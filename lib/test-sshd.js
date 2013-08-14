'use strict';

var hashmerge = require('hashmerge');
var child_process= require('child_process');
var spawn = child_process.spawn;
var path = require('path');
var quote = require('shell-quote').quote;

var events = require('events');
var util   = require('util');
var fs = require('fs');

var TestSshd = function(options) {
  var self = this;

  events.EventEmitter.call(self);

  var privateKey = fs.readFileSync(path.join(__dirname,'..','config','keys','id_rsa'))+'';

  var defaults = {
    port: 4000 ,
    mode: 'echo',
    host: '127.0.0.1',
    username: process.env.USER,
    privateKey:  privateKey
  };

  self.settings = hashmerge(defaults,options);


  self._process = null;
  self.status = 'stopped';

  return self;
};

util.inherits(TestSshd, events.EventEmitter);

module.exports = TestSshd;

TestSshd.prototype.start = function() {
  var self = this;


  var fs = require('fs');
  var keysDir = path.join(__dirname, '..', 'config', 'keys');
  var keys = [ 'id_rsa', 'id_rsa.pub' , 'ssh_host_rsa_key', 'ssh_host_rsa_key.pub' ];

  // Let's make sure the have the right permissions
  keys.forEach(function(key) {
    fs.chmodSync(path.join(keysDir, key), '0600');
  });

  var hostKeyFile = path.join(keysDir,'ssh_host_rsa_key');
  var authorizedKeysFile = path.join(__dirname, '..', 'config', 'authorized_keys2');

  var sshdArgs = [
    '-D',     // Don't fork as a deamon
  //  '-4',     // Only listen for ipv4
    '-e',     // Echo errors to stdout
    '-p',     // Port Option
    self.settings.port,// The port to use
    '-h',     // Hostkey Option
    quote([hostKeyFile]),
    '-o',
    'AuthorizedKeysFile=' + quote([authorizedKeysFile]),
    '-o',
    'AllowUsers=' + quote([self.settings.username]),
    '-o',
    'ForceCommand=echo $SSH_ORIGINAL_COMMAND',
    '-o',
    'PidFile=/dev/null',
    '-o',
    'ListenAddress=127.0.0.1'
  ];

  // console.log(sshdArgs.join(' '));

  self._process = spawn('/usr/sbin/sshd',sshdArgs);

  self._process.stdout.on('data', function (data) {
    self.emit('stdout', data);
  });

  var stderr = '';
  self._process.stderr.on('data', function (data) {
    var output = data + '';
    stderr = stderr +  output;
    self.emit('stderr', data);
    if (output.indexOf('Server listening') >= 0) {
      self.status = 'started';
      self.emit('ready');
    }
  });

  self._process.on('close', function(code) {
    // catch startup errors
    if (self.status !== 'started') {
      self.emit('error',new Error('Exit code['+code + '] - ' +  stderr));
    }
    self.status = 'stopped';
    self.emit('exit',code);
  });

};

TestSshd.prototype.stop = function(options) {
  var self = this;
  if (self._process) {
    self._process.kill();
    self._process = null;
    self.status = 'stopped';
    self.emit('exit');
  }
};

TestSshd.prototype.connectParams = function() {
  var self = this;

  return {
    username: self.settings.username,
    host: self.settings.host,
    privateKey: self.settings.privateKey,
    port: self.settings.port
  };

};
