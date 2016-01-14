var _ = require('lodash');

function getMany(db, query) {
  var p = new Promise(function(resolve, reject) {
    db.serialize(function() {
      db.all(query, function(error, rows) {
        resolve(rows);
      });
    });
  });
  return p;
}

function getOne(db, query) {
  var p = new Promise(function(resolve, reject) {
    getMany(db, query)
      .then(function(rows) {
        resolve(_.first(rows));
      });
  });
  return p;
}

function insert(db, query) {
  var p = new Promise(function(resolve, reject) {
    db.serialize(function() {
      db.run(query, function(error) {
        if (!error) {
          resolve(this.lastID);
        }
      });
    });
  });
  return p;
}

module.exports = {
  getMany: getMany,
  getOne: getOne,
  insert: insert
}
