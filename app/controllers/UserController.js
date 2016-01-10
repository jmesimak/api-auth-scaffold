"use strict";
var User = require('../models/User');

var UserController = function(db) {
  this.db = db;
}

UserController.prototype.route = function(app) {
  let db = this.db;
  app.route('/user')
    .get((req, res) => {
      User.prototype.find(db)
        .then((users) => {
          res.json(users);
        });
    })
    .post((req, res) => {
      console.log(req.body);
      let u = new User(req.body.email, req.body.password);
      u.create(db);
      res.send(req.body);
    });
}

module.exports = UserController;
