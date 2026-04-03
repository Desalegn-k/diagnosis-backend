const pl = require("tau-prolog");
const fs = require("fs");
const path = require("path");

// Load your Prolog rules
const rulesPath = path.join(__dirname, "../prolog/diagnosis_rules.pl");
console.log("Loading Prolog rules from:", rulesPath);

let prologSource = "";
if (fs.existsSync(rulesPath)) {
  prologSource = fs.readFileSync(rulesPath, "utf8");
  console.log(
    "Prolog rules loaded successfully, size:",
    prologSource.length,
    "bytes",
  );
} else {
  console.error("ERROR: Prolog rules file not found at:", rulesPath);
}

exports.runDiagnosis = (symptoms, callback) => {
  // Validate input
  if (!symptoms || symptoms.length === 0) {
    return callback(null, {
      disease: "unknown",
      recommendation: "No symptoms provided",
      confidence: 0,
    });
  }

  if (!prologSource) {
    return callback(null, {
      disease: "unknown",
      recommendation: "Prolog rules not loaded",
      confidence: 0,
    });
  }

  console.log("Running diagnosis for symptoms:", symptoms);

  // Create a new session
  const session = pl.create();
  let responded = false;

  // Set timeout to prevent hanging
  const timeout = setTimeout(() => {
    if (!responded) {
      responded = true;
      console.error("Diagnosis timeout");
      callback(null, {
        disease: "unknown",
        recommendation: "Diagnosis timeout",
        confidence: 0,
      });
    }
  }, 10000); // 10 second timeout

  // Consult the Prolog rules
  session.consult(prologSource, {
    success: () => {
      console.log("Prolog rules consulted successfully");

      // First, clear any existing has/1 facts
      session.query("retractall(has(_))");
      session.answer(() => {
        // Convert symptoms to Prolog atoms (lowercase, underscores for spaces)
        const symptomAtoms = symptoms.map((s) => {
          let atom = String(s).toLowerCase().trim();
          atom = atom.replace(/\s+/g, "_");
          return atom;
        });

        console.log("Asserting symptoms:", symptomAtoms);

        // Assert each symptom
        let assertCount = 0;
        if (symptomAtoms.length === 0) {
          // No symptoms, run diagnosis directly
          runDiagnosisQuery(session, callback, responded, timeout);
        } else {
          symptomAtoms.forEach((atom, index) => {
            session.query(`assert(has(${atom}))`);
            session.answer(() => {
              assertCount++;
              console.log(
                `Asserted ${atom} (${assertCount}/${symptomAtoms.length})`,
              );

              if (assertCount === symptomAtoms.length) {
                // All symptoms asserted, run diagnosis
                runDiagnosisQuery(session, callback, responded, timeout);
              }
            });
          });
        }
      });
    },
    error: (err) => {
      console.error("Failed to consult Prolog rules:", err);
      if (!responded) {
        responded = true;
        clearTimeout(timeout);
        callback(null, {
          disease: "unknown",
          recommendation: "Failed to load diagnosis rules",
          confidence: 0,
        });
      }
    },
  });
};

function runDiagnosisQuery(session, callback, responded, timeout) {
  console.log("Running partial diagnosis query...");

  // Run the partial diagnosis
  session.query("run_partial_diagnosis.");

  // Get the answer
  session.answer((answer) => {
    if (!responded) {
      responded = true;
      clearTimeout(timeout);

      if (answer) {
        // Extract the output from the answer
        let output = "";

        // Tau Prolog stores output in different ways depending on version
        if (typeof answer === "object") {
          // Try to get the formatted output
          if (answer.toString) {
            output = answer.toString();
          } else if (answer.format) {
            output = answer.format;
          } else if (answer.stdout) {
            output = answer.stdout;
          }
        } else if (typeof answer === "string") {
          output = answer;
        }

        // Clean up the output
        output = output
          .replace(/\\n/g, "")
          .replace(/\\r/g, "")
          .replace(/\[/g, "")
          .replace(/\]/g, "")
          .trim();

        console.log("Raw Prolog output:", output);

        // Parse the output - expected format: "disease|recommendation|confidence"
        const parts = output.split("|");

        if (parts.length >= 3 && parts[0] !== "unknown") {
          const disease = parts[0];
          const recommendation = parts[1];
          const confidence = parseInt(parts[2], 10) || 0;

          console.log(`Diagnosis result: ${disease} (${confidence}%)`);
          callback(null, { disease, recommendation, confidence });
        } else {
          console.log("No clear diagnosis found");
          callback(null, {
            disease: "unknown",
            recommendation: "No clear diagnosis for the selected symptoms",
            confidence: 0,
          });
        }
      } else {
        console.log("No answer from Prolog");
        callback(null, {
          disease: "unknown",
          recommendation: "No clear diagnosis",
          confidence: 0,
        });
      }
    }
  });
}
