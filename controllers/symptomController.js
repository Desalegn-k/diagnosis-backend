const db = require("../config/db");

exports.getAllSymptoms = (req, res) => {
  db.query("SELECT id, name FROM symptoms", (err, rows) => {
    if (err) return res.status(500).send("DB error");
    res.json(rows);
  });
};
