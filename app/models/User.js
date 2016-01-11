"use strict";

var bcrypt = require('bcrypt');
var crypto = require('crypto');

var User = function(email, password) {
  this.email = email;
  this.password = password;
}

User.prototype.create = function(db) {
  let u = this;
  var p = new Promise(function(resolve, reject) {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(u.password, salt, function(err, hash) {
        console.log(`hashed password for ${u.email}: ${hash}`);
        db.serialize(() => {
          // For some reason, using the arrow function notation, k.w. 'this' doesn't refer to the the correct object.
          db.run(`INSERT INTO user VALUES (null, '${u.email}', '${hash}', '')`, function(err) {
            var id = this.lastID;
            if (err) { console.log(`tried to create a duplicate account for ${u.email}`); reject(false); }
            crypto.randomBytes(48, function(ex, buf) {
              let token = buf.toString('hex');
              console.log(`Inserting token ${token} for user ${id}`);
              db.serialize(() => {
                db.run(`INSERT INTO session VALUES ('${token}', ${id})`, (err) => {
                  resolve({authenticated: true, accessToken: token});
                });
              })
            });
          });
        });
      });
    });
  });
  return p;
}

User.prototype.updatePassword = function(db, newPassword) {
  let u = this;
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(newPassword, salt, function(err, hash) {
      console.log(`hashed password for ${u.email}: ${hash}`);
      db.serialize(() => {
        db.run(`UPDATE user SET password='${hash}' WHERE email='${u.email}'`, (err) => {
          console.log(err);
          if (err) { console.log(`tried to create a duplicate account for ${u.email}`); }
        });
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
