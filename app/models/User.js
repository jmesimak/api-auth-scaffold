"use strict";

var bcrypt = require('bcrypt');
var crypto = require('crypto');
var pw = require('../lib/password');
var dbAccess = require('../lib/dbAccess');

var User = function(email, password) {
  this.email = email;
  this.password = password;
}

User.prototype.create = function(db) {
  let u = this;
  var p = new Promise(function(resolve, reject) {
    pw.hashPassword(u.password).then(function(hash) {
      dbAccess
        .insert(db, `INSERT INTO user VALUES (null, '${u.email}', '${hash}', '')`)
        .then(function(id) {
          if (id) {
            crypto.randomBytes(48, function(ex, buf) {
              let token = buf.toString('hex');
              dbAccess
                .insert(`INSERT INTO session VALUES ('${token}', ${id})`)
                .then(function(id) {
                  resolve({authenticated: true, accessToken: token});
                });
            });
          } else {
            reject(false);
          }
        });
    });
  });
  return p;
}

User.prototype.updatePassword = function(db, newPassword) {
  let u = this;
  pw.hashPassword(u.password).then(function(hash) {
    console.log(`hashed password for ${u.email}: ${hash}`);
    db.serialize(() => {
      db.run(`UPDATE user SET password='${hash}' WHERE email='${u.email}'`, (err) => {
        console.log(err);
        if (err) { console.log(`tried to create a duplicate account for ${u.email}`); }
      });
    });
  });
}

User.prototype.find = function(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(`SELECT id, email FROM user`, (err, rows) => {
        resolve(rows);
      });
    });
  });
}

module.exports = User;
