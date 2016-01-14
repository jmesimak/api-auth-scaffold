var request = require('supertest');
describe('loading express', function () {
  var server;
  beforeEach(function (done) {

    var serverHandle = require('../app/index');
    // console.log(serverHandle);
    serverHandle.serverStart.on('start', function() {
      console.log(':)');
      server = serverHandle.getServer();
      done();
    });

  });
  afterEach(function () {
    server.close();
  });
  it('responds to /', function testSlash(done) {
  request(server)
    .get('/user')
    .expect(401, done);
  });
  // it('404 everything else', function testPath(done) {
  //   request(server)
  //     .get('/foo/bar')
  //     .expect(404, done);
  // });
});
