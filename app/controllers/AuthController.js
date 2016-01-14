"use strict";

var bcrypt = require('bcrypt');
var crypto = require('crypto');
var _ = require('lodash');
var User = require('../models/User');
var dbAccess = require('../lib/dbAccess');

var AuthController = function(db) {
  this.db = db;
}

AuthController.prototype.isAuthenticated = function(token) {
  let db = this.db;
  var p = new Promise(function(resolve, reject) {
    dbAccess
      .getOne(db, `SELECT * from session where token='${token}'`)
      .then(function(auth) {
        if (auth) {
          dbAccess
            .getOne(db, `SELECT id, email FROM user where id=${auth.user}`)
            .then(function(user) {
              resolve(user);
            });
        } else {
          resolve(false);
        }
      });
  });
  return p;
}

AuthController.prototype.route = function(app) {
  let db = this.db;

  app.route('/login')
    .post((req, res) => {
      dbAccess
        .getOne(db, `SELECT * from user where email='${req.body.email}'`)
        .then(function(user) {
          bcrypt.compare(req.body.password, user.password, (err, auth) => {
            if (auth) {
              crypto.randomBytes(48, function(ex, buf) {
                let token = buf.toString('hex');
                dbAccess
                  .insert(db, `INSERT INTO session VALUES ('${token}', ${user.id})`)
                  .then(function(id) {
                    console.log(`User ${user.id} has successfully logged in.`);
                    res.json({authenticated: true, accessToken: token});
                  });
              });
            } else {
              res.status(401).json({error: 'Wrong password'});
            }
          });
        });
    });

  app.route('/logout')
    .post((req, res) => {
      var token = req.get('access-token') || '';
      if (token) {
        db.serialize(() => {
          db.run(`DELETE FROM session where token='${token}'`, [], () => {
            res.json({authenticated: false});
          });
        });
      }
    });

  app.route('/restore')
    .post((req, res) => {
      var email = req.body.email || '';
      if (email) {
        crypto.randomBytes(48, function(ex, buf) {
          let token = buf.toString('hex');
          db.serialize(() => {
            db.run(`UPDATE user SET pwtoken='${token}' WHERE email='${email}'`, [], () => {
              res.json({message: 'Password reset token sent', token: token});
            });
          });
        });
      }
    });

  app.route('/update-password')
    .post((req, res) => {
      let token = req.body.token;
      let password = req.body.password;
      db.serialize(() => {
        db.all(`SELECT * from user where pwtoken='${token}'`, (err, rows) => {
          console.log(`hashing ${password}`);
          var ret = _.first(rows);
          var user = new User(ret.email);
          user.updatePassword(db, password);
        });
      });
    });
};

module.exports = AuthController;
