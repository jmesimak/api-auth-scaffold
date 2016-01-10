"use strict";

var bcrypt = require('bcrypt');

var User = function(email, password) {
  this.email = email;
  this.password = password;
}

User.prototype.create = function(db) {
  let u = this;
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(u.password, salt, function(err, hash) {
      console.log(`hashed password for ${u.email}: ${hash}`);
      db.serialize(() => {
        db.run(`INSERT INTO user VALUES (null, '${u.email}', '${hash}', '')`, (err) => {
          console.log(err);
          if (err) { console.log(`tried to create a duplicate account for ${u.email}`); }
        });
      });
    });
  });
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
