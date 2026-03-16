const db = require("../config/db");
const { runDiagnosis } = require("../utils/prologEngine");


exports.evaluate = (req, res) => {
  const { symptoms } = req.body; // symptom IDs from frontend
  const userId = req.user.id;

  // 1. Fetch symptom names from DB
  db.query(
    "SELECT name FROM symptoms WHERE id IN (?)",
    [symptoms],
    (err, rows) => {
      if (err || rows.length === 0) {
        return res.status(400).json({ message: "Invalid symptoms" });
      }

      const symptomNames = rows.map((row) => row.name); // e.g., ['fever', 'cough']

      // 2. Call Prolog with the names
      runDiagnosis(symptomNames, (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Diagnosis failed" });
        }

        // 3. Optional: low symptom count rule
        if (symptomNames.length < 3 && result.confidence < 30) {
          return res.json({
            disease: "Unknown",
            recommendation:
              "Please provide more symptoms if you have or consult a medical professional",
            confidence: 0,
          });
        }

        // 4. Handle explicit "unknown" from Prolog
        if (result.disease === "unknown") {
          return res.json({
            disease: "Unknown",
            recommendation: result.recommendation,
            confidence: 0,
          });
        }

        // 5. Save to DB using the disease name returned by Prolog
        db.query(
          "SELECT id FROM diseases WHERE LOWER(name) = ?",
          [result.disease.toLowerCase()],
          (err, rows) => {
            if (err || rows.length === 0) {
              return res
                .status(500)
                .json({ message: "Disease not found in DB" });
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
    },
  );
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