"use strict";

var bcrypt = require('bcrypt');
var crypto = require('crypto');
var _ = require('lodash');
var User = require('../models/User');


var AuthController = function(db) {
  this.db = db;
}

AuthController.prototype.isAuthenticated = function(token) {
  let db = this.db;

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(`SELECT * from session where token='${token}'`, (err, rows) => {
        if (err) console.log(err);
        var auth = _.first(rows);
        if (auth) {
          db.serialize(() => {
            db.all(`SELECT id, email FROM user where id=${auth.user}`, (err, rows) => {
              if (err) console.log(err);
              resolve(_.first(rows));
            });
          });
        } else {
          resolve(false);
        }
      });
    });
  });

}

AuthController.prototype.route = function(app) {
  let db = this.db;

  app.route('/login')
    .post((req, res) => {
      db.serialize(() => {
        db.all(`SELECT * from user where email='${req.body.email}'`, (err, rows) => {
          console.log(rows);
          var user = _.first(rows);
          bcrypt.compare(req.body.password, user.password, (err, auth) => {
            if (auth) {
              db.serialize(() => {
                crypto.randomBytes(48, function(ex, buf) {
                  let token = buf.toString('hex');
                  db.run(`INSERT INTO session VALUES ('${token}', ${user.id})`, (err) => {
                    res.json({authenticated: true, accessToken: token});
                  });
                });
              });
            } else {
              res.status(401).json({error: 'Wrong password'});
            }
          });
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
