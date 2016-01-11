module.exports = {

  ups: function(db) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('ALTER TABLE user ADD COLUMN pwtoken STRING', [], () => {
          resolve(true);
        });
      });
    });
  }

};
