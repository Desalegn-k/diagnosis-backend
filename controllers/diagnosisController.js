const db = require("../config/db");
const { runDiagnosis } = require("../utils/prologEngine");

exports.evaluate = (req, res) => {
  const { symptoms } = req.body; // These are symptom IDs
  const userId = req.user.id;

  if (!symptoms || symptoms.length === 0) {
    return res.status(400).json({
      message: "Please select at least one symptom",
    });
  }

  // FIRST: Fetch symptom names from the database using the IDs
  const symptomIds = symptoms;
  const sql = "SELECT name FROM symptoms WHERE id IN (?)";

  db.query(sql, [symptomIds], (err, symptomRows) => {
    if (err) {
      console.error("Database error fetching symptoms:", err);
      return res.status(500).json({ message: "Failed to fetch symptoms" });
    }

    if (symptomRows.length === 0) {
      return res.status(400).json({ message: "Invalid symptoms selected" });
    }

    // Convert symptom names to Prolog-friendly format (lowercase, underscores)
    const symptomNames = symptomRows.map((row) =>
      row.name.toLowerCase().replace(/\s+/g, "_"),
    );

    console.log("Symptom IDs received:", symptoms);
    console.log("Symptom names for Prolog:", symptomNames);

    // NOW call Prolog with the symptom NAMES
    runDiagnosis(symptomNames, (err, result) => {
      if (err) {
        console.error("Prolog error:", err);
        return res.status(500).json({ message: "Diagnosis failed" });
      }

      // ---- New rule: too few symptoms and low confidence ----
      if (symptomNames.length < 3 && result.confidence < 30) {
        return res.json({
          disease: "Unknown",
          recommendation:
            "Please provide more symptoms if you have or consult a medical professional",
          confidence: 0,
        });
      }

      // Handle explicit "unknown" from Prolog
      if (result.disease === "unknown") {
        return res.json({
          disease: "Unknown",
          recommendation: result.recommendation || "No clear diagnosis",
          confidence: 0,
        });
      }

      // Save to DB using the confidence from Prolog
      db.query(
        "SELECT id FROM diseases WHERE LOWER(name) = ?",
        [result.disease.toLowerCase()],
        (err, rows) => {
          if (err || rows.length === 0) {
            console.error("Disease not found in DB:", result.disease);
            // Still return the diagnosis even if we can't save to history
            return res.json({
              disease: result.disease,
              recommendation: result.recommendation,
              confidence: result.confidence,
            });
          }

          const diseaseId = rows[0].id;
          db.query(
            "INSERT INTO diagnosis (user_id, disease_id, confidence) VALUES (?, ?, ?)",
            [userId, diseaseId, result.confidence],
            (err) => {
              if (err) {
                console.error("Failed to save diagnosis:", err);
                // Still return the diagnosis
                return res.json({
                  disease: result.disease,
                  recommendation: result.recommendation,
                  confidence: result.confidence,
                });
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
  });
};

exports.history = (req, res) => {
  db.query(
    `SELECT d.created_at, di.name AS disease, d.confidence
     FROM diagnosis d
     JOIN diseases di ON d.disease_id = di.id
     WHERE d.user_id = ?
     ORDER BY d.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error("History fetch error:", err);
        return res.status(500).json({ message: "Failed to fetch history" });
      }
      res.json(rows);
    },
  );
};

exports.test = (req, res) => {
  res.send("DIAGNOSIS CONTROLLER WORKS");
};
