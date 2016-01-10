module.exports = {

  ups: function(db) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT, email STRING UNIQUE, password STRING)', [], () => {
          db.run('CREATE TABLE session (token STRING, user INTEGER, FOREIGN KEY(user) references user(id))', [], () => {
            console.log('Migrated');
            resolve(true);
          });
        });
      });
    });
  }

};
