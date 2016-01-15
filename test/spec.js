var request = require('supertest');
var assert = require('assert');
var should = require('should');

describe('loading express', function () {
  var server;
  var token;
  before(function (done) {

    var serverHandle = require('../app/index');
    // console.log(serverHandle);
    serverHandle.serverStart.on('start', function() {
      console.log(':)');
      server = serverHandle.getServer();
      done();
    });

  });

  after(function () {
    server.close();
  });

  it('responds to /user without authentication', function(done) {
    request(server)
      .get('/user')
      .expect(401, done);
  });

  it('POST /user creates a user and returns a token', function(done) {
    request(server)
      .post('/user')
      .send({email: 'test@foo.com', password: 'foobar123'})
      .expect(200)
      .end(function(err, res) {
        token = res.body.accessToken;
        done();
      });

  });

  it('POST /login able to login with created credentials', function(done) {
    request(server)
      .post('/login')
      .send({email: 'test@foo.com', password: 'foobar123'})
      .expect(200)
      .end(function(err, res) {
        res.body.should.have.property('accessToken');
        done();
      });
  });

  it('GET /user returns list of users for an authenticated user', function(done) {
    request(server)
      .get('/user')
      .set('access-token', token)
      .expect(200)
      .end(function(err, res) {
        res.body.length.should.be.above(0);
        done();
      });
  });
});
