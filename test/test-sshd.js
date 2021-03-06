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

  afterEach(function(done) {
    sshd.stop();
    done();
  });

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

  it('in echo mode it should echo of a command should work', function(done) {
    var command = 'uptime';
    sshd = new TestSshd({port: port, mode: 'echo'});
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

  it('in expect mode it should echo of a command should work', function(done) {
    var command = 'uptime';
    var expectations = { 'uptime': { stdout: 'uptime' , stderr: '' , code: 0 }} ;

    var expectedStdout = expectations[command].stdout;
    var expectedCode = expectations[command].code;

    sshd = new TestSshd({port: port, mode: 'expect' , expectations: expectations });

    var connectParams = sshd.connectParams();

    var c = new Connection();
    c.on('ready',function() {
      c.exec(command,{}, function(err, stream) {

        if (err) {
          sshd.stop();
          return done(err);
        }

        stream.on('data', function(data, extended) {
          var output = data + '';
          expect(output).to.equal(expectedStdout);
          sshd.stop();
          return done();
        });

        stream.on('exit', function(code, signal) {
          if (code !==  expectedCode) {
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

  it('run of a command should work', function(done) {
    var command = 'whoami';
    sshd = new TestSshd({port: port, mode: 'exec'});
    var connectParams = sshd.connectParams();

    var c = new Connection();
    c.on('ready',function() {
      c.exec(command,{}, function(err, stream) {

        if (err) {
          return done(err);
        }

        stream.on('data', function(data, extended) {
          var output = data + '';
          expect(output).to.be.string(process.env.USER);
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

  it('error on incorrect mode should work', function(done) {
    try {
      sshd = new TestSshd({port: port, mode: 'exec2'});
    } catch (ex) {
      done();
    }
  });


  it('should terminate correctly', function(done) {

    sshd = new TestSshd({port: port});
    sshd.on('ready', function() {
      sshd.stop();
      done();
    });
    sshd.start();
  });

  it('in transfer mode sftp listing the home dir should work', function(done) {
    sshd = new TestSshd({port: port, mode: 'transfer'});
    var homeDir = process.env.HOME;
    var connectParams = sshd.connectParams();

    var c = new Connection();
    c.on('ready',function() {
      c.sftp(function(err, sftp) {
        if (err) {
          return done(err);
        }
        sftp.opendir(homeDir, function readdir(err, handle) {
          if (err) {
            return done(err);
          }
          sshd.stop();
          return done();
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
