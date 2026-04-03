const pl = require("tau-prolog");
const fs = require("fs");
const path = require("path");

// Load your Prolog rules once at startup
const prologSource = fs.readFileSync(
  path.join(__dirname, "diagnosis_rules.pl"),
  "utf8",
);

exports.runDiagnosis = (symptoms, callback) => {
  if (!symptoms || symptoms.length === 0) {
    return callback(null, {
      disease: "unknown",
      recommendation: "No symptoms provided",
      confidence: 0,
    });
  }

  // Create a new session for each diagnosis
  const session = pl.create();
  let resultCaptured = false;

  session.consult(prologSource, {
    success: () => {
      // Convert symptoms to Prolog facts
      const symptomAtoms = symptoms.map((s) => {
        // Convert to lowercase and replace spaces with underscores
        const atom = s.toLowerCase().replace(/\s+/g, "_");
        return `has(${atom})`;
      });

      // Build the query: assert all symptoms, then run diagnosis
      const query =
        symptomAtoms.map((s) => `assert(${s})`).join(", ") +
        ", run_partial_diagnosis.";

      session.query(query);
      session.answer((answer) => {
        if (resultCaptured) return;

        if (answer) {
          // Tau Prolog captures output from format/2 in answer.toString()
          const output = answer.toString();
          const parts = output.trim().split("|");

          if (parts.length >= 3) {
            const [disease, recommendation, confidenceStr] = parts;
            const confidence = parseInt(confidenceStr, 10) || 0;
            resultCaptured = true;
            callback(null, { disease, recommendation, confidence });
          } else {
            resultCaptured = true;
            callback(null, {
              disease: "unknown",
              recommendation: "No clear diagnosis",
              confidence: 0,
            });
          }
        } else {
          resultCaptured = true;
          callback(null, {
            disease: "unknown",
            recommendation: "No clear diagnosis",
            confidence: 0,
          });
        }
      });
    },
    error: (err) => {
      console.error("Prolog consultation error:", err);
      callback(null, {
        disease: "unknown",
        recommendation: "System error",
        confidence: 0,
      });
    },
  });
};
