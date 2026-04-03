const db = require("../config/db");
const { runDiagnosis } = require("../utils/prologEngine");

exports.evaluate = (req, res) => {
  let { symptoms } = req.body;
  const userId = req.user.id;

  console.log("=== DIAGNOSIS REQUEST ===");
  console.log("Raw symptoms from frontend:", symptoms);

  // Ensure symptoms is an array
  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return res
      .status(400)
      .json({ message: "Please select at least one symptom" });
  }

  // Convert symptom IDs to numbers (in case they're strings)
  const symptomIds = symptoms.map((id) => {
    const numId = parseInt(id, 10);
    return isNaN(numId) ? id : numId;
  });

  console.log("Converted symptom IDs:", symptomIds);

  // Build query with proper placeholders
  const placeholders = symptomIds.map(() => "?").join(",");
  const sql = `SELECT id, name FROM symptoms WHERE id IN (${placeholders})`;

  console.log("SQL Query:", sql);
  console.log("Query params:", symptomIds);

  db.query(sql, symptomIds, (err, symptomRows) => {
    console.log("Query result - Error:", err);
    console.log("Rows returned:", symptomRows?.length || 0);

    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch symptoms", error: err.message });
    }

    if (!symptomRows || symptomRows.length === 0) {
      // Debug: Get all symptoms to help diagnose
      db.query(
        "SELECT id, name FROM symptoms LIMIT 20",
        (err2, allSymptoms) => {
          console.error("No matching symptoms found!");
          console.error("Requested IDs:", symptomIds);
          console.error("Available symptoms:", allSymptoms);

          return res.status(400).json({
            message: "Invalid symptoms selected",
            debug: {
              requestedIds: symptomIds,
              availableSymptoms: allSymptoms || [],
            },
          });
        },
      );
      return;
    }

    // Convert symptom names to Prolog-friendly format
    const symptomNames = symptomRows.map((row) =>
      row.name.toLowerCase().replace(/\s+/g, "_"),
    );

    console.log("✓ Found symptoms:", symptomNames);

    // Call Prolog engine with symptom names
    runDiagnosis(symptomNames, (err, result) => {
      if (err) {
        console.error("Prolog error:", err);
        return res.status(500).json({ message: "Diagnosis failed" });
      }

      console.log("Prolog result:", result);

      // Check for too few symptoms
      if (symptomNames.length < 3 && result.confidence < 30) {
        return res.json({
          disease: "Unknown",
          recommendation:
            "Please provide more symptoms or consult a medical professional",
          confidence: 0,
        });
      }

      // Handle unknown diagnosis
      if (result.disease === "unknown") {
        return res.json({
          disease: "Unknown",
          recommendation:
            result.recommendation ||
            "No clear diagnosis for the selected symptoms",
          confidence: 0,
        });
      }

      // Save to database
      db.query(
        "SELECT id FROM diseases WHERE LOWER(name) = ?",
        [result.disease.toLowerCase()],
        (err, rows) => {
          if (err || !rows || rows.length === 0) {
            console.warn(
              "Disease not found in DB, but returning diagnosis anyway",
            );
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
              if (err) console.error("Failed to save diagnosis:", err);
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

// Keep your history and test functions unchanged...
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
        console.error("History error:", err);
        return res.status(500).json({ message: "Failed to fetch history" });
      }
      res.json(rows || []);
    },
  );
};

exports.test = (req, res) => {
  res.send("DIAGNOSIS CONTROLLER WORKS");
};
