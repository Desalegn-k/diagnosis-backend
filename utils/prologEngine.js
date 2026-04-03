const pl = require("tau-prolog");
const fs = require("fs");
const path = require("path");

// Load your Prolog rules once at startup
const prologSource = fs.readFileSync(
  path.join(__dirname, "../prolog/diagnosis_rules.pl"),
  "utf8",
);

exports.runDiagnosis = (symptoms, callback) => {
  // Validate input
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

  // Consult the Prolog rules
  session.consult(prologSource, {
    success: () => {
      try {
        // Convert symptoms to Prolog facts
        // Assuming symptoms are already in correct format (e.g., 'fever', 'cough')
        // If they have spaces, convert to underscores
        const symptomAtoms = symptoms.map((s) => {
          // Convert to lowercase and replace spaces with underscores
          const atom = s.toLowerCase().replace(/\s+/g, "_");
          return `has(${atom})`;
        });

        // Build the query: assert all symptoms, then run diagnosis
        const assertQuery = symptomAtoms.map((s) => `assert(${s})`).join(", ");
        const fullQuery = assertQuery
          ? `${assertQuery}, run_partial_diagnosis.`
          : "run_partial_diagnosis.";

        console.log("Tau Prolog query:", fullQuery);

        // Execute the query
        session.query(fullQuery);

        // Get the answer
        session.answer((answer) => {
          if (resultCaptured) return;

          if (answer) {
            // Tau Prolog captures output from format/2 in answer.toString()
            let output = answer.toString();

            // Clean up the output (remove any Prolog formatting)
            output = output.replace(/\\n/g, "").replace(/\\r/g, "").trim();

            console.log("Tau Prolog output:", output);

            // Expected format: "disease|recommendation|confidence"
            const parts = output.split("|");

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
            // No answer or error
            resultCaptured = true;
            callback(null, {
              disease: "unknown",
              recommendation: "No clear diagnosis",
              confidence: 0,
            });
          }
        });
      } catch (err) {
        console.error("Error in Prolog query:", err);
        callback(null, {
          disease: "unknown",
          recommendation: "Diagnosis engine error",
          confidence: 0,
        });
      }
    },
    error: (err) => {
      console.error("Prolog consultation error:", err);
      callback(null, {
        disease: "unknown",
        recommendation: "Failed to load diagnosis rules",
        confidence: 0,
      });
    },
  });
};
