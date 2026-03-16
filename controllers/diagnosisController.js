const db = require("../config/db");
const { runDiagnosis } = require("../utils/prologEngine");


exports.evaluate = (req, res) => {
  const { symptoms } = req.body;
  const userId = req.user.id;

  runDiagnosis(symptoms, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Diagnosis failed" });
    }

    // ---- New rule: too few symptoms and low confidence ----
    if (symptoms.length < 3 && result.confidence < 30) {
      return res.json({
        disease: "Unknown",
        recommendation:
          "Please provide more symptoms if you have or consult a medical professional",
        confidence: 0,
      });
    }

    // Handle explicit "unknown" from Prolog (confidence will be 0)
    if (result.disease === "unknown") {
      return res.json({
        disease: "Unknown",
        recommendation: result.recommendation, // "No clear diagnosis"
        confidence: 0,
      });
    }

    // Save to DB using the confidence from Prolog
    db.query(
      "SELECT id FROM diseases WHERE LOWER(name) = ?",
      [result.disease],
      (err, rows) => {
        if (err || rows.length === 0) {
          return res.status(500).json({ message: "Disease not found in DB" });
        }
        const diseaseId = rows[0].id;

        db.query(
          "INSERT INTO diagnosis (user_id, disease_id, confidence) VALUES (?, ?, ?)",
          [userId, diseaseId, result.confidence],
          (err) => {
            if (err) {
              return res
                .status(500)
                .json({ message: "Failed to save diagnosis" });
            }
            res.json({
              disease: result.disease,
              recommendation: result.recommendation,
              confidence: result.confidence,
            });
          },
        );
      },
    );
  });
};
exports.history = (req, res) => {
  db.query(
    // select also considence

    `SELECT d.created_at, di.name AS disease,d.confidence
     FROM diagnosis d
     JOIN diseases di ON d.disease_id = di.id
     WHERE d.user_id = ?`,
    [req.user.id],
    (err, rows) => {
      res.json(rows);
    },
  );
};
 exports.test = (req, res) => {
   res.send("DIAGNOSIS CONTROLLER WORKS");
 };