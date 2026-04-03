const pl = require("tau-prolog");
const fs = require("fs");
const path = require("path");

// Load your Prolog rules
const rulesPath = path.join(__dirname, "../prolog/diagnosis_rules.pl");
console.log("========================================");
console.log("PROLOG ENGINE INITIALIZATION");
console.log("========================================");
console.log("Looking for Prolog rules at:", rulesPath);
console.log("File exists?", fs.existsSync(rulesPath));

let prologSource = "";
if (fs.existsSync(rulesPath)) {
  prologSource = fs.readFileSync(rulesPath, "utf8");
  console.log("✓ Prolog rules loaded successfully");
  console.log("  File size:", prologSource.length, "bytes");
  console.log("  First 200 chars:", prologSource.substring(0, 200));
} else {
  console.error("✗ ERROR: Prolog rules file not found!");
}

exports.runDiagnosis = (symptoms, callback) => {
  console.log("\n========================================");
  console.log("RUNNING DIAGNOSIS");
  console.log("========================================");
  console.log("Symptoms received:", symptoms);
  console.log("Symptoms type:", typeof symptoms);
  console.log("Is array?", Array.isArray(symptoms));
  console.log("Symptoms length:", symptoms?.length);

  // Validate input
  if (!symptoms || symptoms.length === 0) {
    console.log("✗ No symptoms provided");
    return callback(null, {
      disease: "unknown",
      recommendation: "No symptoms provided",
      confidence: 0,
    });
  }

  if (!prologSource) {
    console.error("✗ Prolog rules not loaded");
    return callback(null, {
      disease: "unknown",
      recommendation: "Prolog rules not loaded",
      confidence: 0,
    });
  }

  console.log("✓ Input validation passed");

  // Create a new session
  const session = pl.create();
  let responded = false;
  let startTime = Date.now();

  // Set timeout to prevent hanging
  const timeout = setTimeout(() => {
    if (!responded) {
      responded = true;
      console.error("✗ Diagnosis timeout after 10 seconds");
      callback(null, {
        disease: "unknown",
        recommendation: "Diagnosis timeout",
        confidence: 0,
      });
    }
  }, 10000);

  console.log("Consulting Prolog rules...");

  // Consult the Prolog rules
  session.consult(prologSource, {
    success: () => {
      console.log("✓ Prolog rules consulted successfully");

      // First, clear any existing has/1 facts
      console.log("Clearing existing facts...");
      session.query("retractall(has(_))");
      session.answer(() => {
        console.log("✓ Existing facts cleared");

        // Convert symptoms to Prolog atoms
        const symptomAtoms = symptoms.map((s) => {
          let atom = String(s).toLowerCase().trim();
          atom = atom.replace(/\s+/g, "_");
          return atom;
        });

        console.log("Converted symptoms:", symptomAtoms);

        // Assert each symptom
        let assertCount = 0;
        console.log(`Asserting ${symptomAtoms.length} symptoms...`);

        if (symptomAtoms.length === 0) {
          console.log("No symptoms to assert, running diagnosis directly");
          runDiagnosisQuery(session, callback, responded, timeout, startTime);
        } else {
          symptomAtoms.forEach((atom, index) => {
            console.log(
              `Asserting symptom ${index + 1}/${symptomAtoms.length}: ${atom}`,
            );
            session.query(`assert(has(${atom}))`);
            session.answer(() => {
              assertCount++;
              console.log(
                `✓ Asserted ${atom} (${assertCount}/${symptomAtoms.length})`,
              );

              if (assertCount === symptomAtoms.length) {
                console.log("✓ All symptoms asserted, running diagnosis...");
                runDiagnosisQuery(
                  session,
                  callback,
                  responded,
                  timeout,
                  startTime,
                );
              }
            });
          });
        }
      });
    },
    error: (err) => {
      console.error("✗ Failed to consult Prolog rules:", err);
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

function runDiagnosisQuery(session, callback, responded, timeout, startTime) {
  console.log("\n--- Running partial diagnosis query ---");
  console.log("Elapsed time:", Date.now() - startTime, "ms");

  // Run the partial diagnosis
  session.query("run_partial_diagnosis.");
  console.log("Query sent: run_partial_diagnosis.");

  // Get the answer
  session.answer((answer) => {
    const elapsed = Date.now() - startTime;
    console.log("\n--- Answer received ---");
    console.log("Elapsed time:", elapsed, "ms");
    console.log("Answer type:", typeof answer);
    console.log("Answer value:", answer);

    if (answer) {
      // Try to get the output in different ways
      let output = "";

      // Method 1: Direct toString
      if (typeof answer === "string") {
        output = answer;
        console.log("Method 1 (string):", output);
      }

      // Method 2: toString method
      else if (answer.toString) {
        output = answer.toString();
        console.log("Method 2 (toString):", output);
      }

      // Method 3: Check for _ object (Tau Prolog internal)
      else if (answer["_"] && answer["_"].stdout) {
        output = answer["_"].stdout;
        console.log("Method 3 (_.stdout):", output);
      }

      // Method 4: Check for stdout property
      else if (answer.stdout) {
        output = answer.stdout;
        console.log("Method 4 (stdout):", output);
      }

      // Method 5: Check for goal_output in session
      else if (session.goal_output) {
        output = session.goal_output;
        console.log("Method 5 (session.goal_output):", output);
      }

      // Method 6: JSON stringify the whole answer
      else {
        try {
          output = JSON.stringify(answer);
          console.log("Method 6 (JSON.stringify):", output);
        } catch (e) {
          console.log("Could not stringify answer");
        }
      }

      // Clean up the output
      let cleanedOutput = output
        .replace(/\\n/g, "")
        .replace(/\\r/g, "")
        .replace(/\[/g, "")
        .replace(/\]/g, "")
        .trim();
      console.log("Cleaned output:", cleanedOutput);

      // Parse the output - expected format: "disease|recommendation|confidence"
      const parts = cleanedOutput.split("|");
      console.log("Split parts:", parts);

      if (!responded) {
        responded = true;
        clearTimeout(timeout);

        if (parts.length >= 3 && parts[0] !== "unknown" && parts[0] !== "") {
          const disease = parts[0];
          const recommendation = parts[1];
          const confidence = parseInt(parts[2], 10) || 0;

          console.log(`\n✓✓✓ DIAGNOSIS SUCCESSFUL ✓✓✓`);
          console.log(`Disease: ${disease}`);
          console.log(`Confidence: ${confidence}%`);
          console.log(`Recommendation: ${recommendation}`);

          callback(null, { disease, recommendation, confidence });
        } else {
          console.log(`\n✗ No clear diagnosis found`);
          console.log(`Raw output: "${cleanedOutput}"`);
          console.log(`Parts:`, parts);

          callback(null, {
            disease: "unknown",
            recommendation: "No clear diagnosis for the selected symptoms",
            confidence: 0,
          });
        }
      }
    } else {
      console.log("✗ No answer from Prolog (answer is null/false)");
      if (!responded) {
        responded = true;
        clearTimeout(timeout);
        callback(null, {
          disease: "unknown",
          recommendation: "No clear diagnosis",
          confidence: 0,
        });
      }
    }
  });
}
