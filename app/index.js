"use strict";

var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var server;

eventEmitter.on('start', function() {
  console.log('READY!');
});

app.use( bodyParser.json());

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

var items = fs.readdirSync(__dirname + '/migrations');

function migrateFile(index) {
  console.log(`Migrating nr. ${index}`);
  var migration = require(`./migrations/${index}.js`);
  migration.ups(db)
    .then(function() {
      if (index < items.length) {
        migrateFile(index+1);
      } else {
        console.log('Starting');
        startApp()
          .then(function(s) {
            console.log('ebens');
            eventEmitter.emit('start');
          });
      }
    });
}

migrateFile(1);
// migrateFile(1)
//   .then(function(s) {
//     server = server;
//     eventEmitter.emit('start');
//     console.log('should be up');
//   });


function startApp() {
  var p = new Promise(function(resolve, reject) {
    var UserController = require('./controllers/UserController');
    var AuthController = require('./controllers/AuthController');
    var uc = new UserController(db);
    var ac = new AuthController(db);

    // CORS
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, access-token");
      next();
    });

    // Authentication middleware
    app.use((req, res, next) => {
      var token = req.get('access-token') || '';

      if (token) {
        ac.isAuthenticated(token)
          .then((user) => {
            if (user) {
              req.user = user;
              next();
            } else {
              req.user = undefined;
              console.log(`Invalid token ${token}`);
              next();
            }
          });
      } else {
        next();
      }
    });

    uc.route(app);
    ac.route(app);

    var s = app.listen(3000, function () {
      console.log('Example app listening on port 3000!');
      server = s;
      resolve(server);
    });
  });
  return p;
}

function getServer() {
  return server;
}

var ret = {
  serverStart: eventEmitter,
  getServer: getServer
};

module.exports = ret;
