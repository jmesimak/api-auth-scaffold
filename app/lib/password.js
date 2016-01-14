var bcrypt = require('bcrypt');

function hashPassword(password) {
  var p = new Promise(function(resolve, reject) {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, function(err, hash) {
        resolve(hash);
      });
    });
  });
  return p;
}

module.exports = {
  hashPassword: hashPassword
}
