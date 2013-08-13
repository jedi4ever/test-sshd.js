//'use strict';

var expect = require('chai').expect;
var TestSshd = require('../lib/test-sshd');
var Connection = require('ssh2');
var fs = require('fs');
var path = require('path');

var sshd;
var port = 4000;

// Making sure the daemon exits
process.on('exit', function() {
  if (sshd.status === 'started') {
    console.log('stopping');
    sshd.stop();
  }
});

var privateKey = TestSshd.privateKey;

describe('TestSshd', function() {

  it('login should work', function(done) {

    sshd = new TestSshd({port: port});
    var connectParams = sshd.connectParams();

    var c = new Connection();
    c.on('ready',function() {
      sshd.stop();
      return done();
    });

    c.on('error',function(err) {
      return done(err);
    });

    sshd.on('ready', function() {
      c.connect(connectParams);
    });
    sshd.on('error', function(err) {
      return done(err);
    });
    sshd.start();

  });

  it('echo of a command should work', function(done) {
    var command = 'uptime';
    sshd = new TestSshd({port: port});
    var connectParams = sshd.connectParams();

    var c = new Connection();
    c.on('ready',function() {
      c.exec(command,{}, function(err, stream) {

        if (err) {
          return done(err);
        }

        stream.on('data', function(data, extended) {
          var output = data + '';
          expect(output).to.be.string(command);
          sshd.stop();
          return done();
        });

        stream.on('exit', function(code, signal) {
          if (code !== 0) {
            return done(new Error('wrong exit code: '+ code));
          }
        });

      });

    });

    c.on('error',function(err) {
      return done(err);
    });

    sshd.on('ready', function() {
      c.connect(connectParams);
    });
    sshd.on('error', function(err) {
      return done(err);
    });
    sshd.start();

  });

});
