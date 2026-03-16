const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const tmp = require("tmp");

exports.runDiagnosis = (symptoms, callback) => {
  if (!symptoms || symptoms.length === 0) {
    return callback(null, {
      disease: "unknown",
      recommendation: "No symptoms provided",
      confidence: 0,
    });
  }

  const rulesFile = path.join(__dirname, "../prolog/diagnosis_rules.pl");
  if (!fs.existsSync(rulesFile)) {
    console.error("Prolog rules file not found:", rulesFile);
    return callback(null, {
      disease: "unknown",
      recommendation: "System configuration error",
      confidence: 0,
    });
  }

  // Create a temporary file with the assertions and goal
  const tmpFile = tmp.fileSync({ postfix: ".pl" });

  // Build Prolog script
  const asserts = symptoms
    .map((s) => {
      const atom = s.toLowerCase().replace(/\s+/g, "_");
      return `has(${atom}).`;
    })
    .join("\n");

  const script = `
:- dynamic has/1.
${asserts}
run_partial_diagnosis.
`;
  fs.writeFileSync(tmpFile.name, script);

  // Run swipl: load rules, then consult temporary file, then run goal
  execFile(
    "swipl",
    [
      "-q", // quiet mode
      "-s",
      rulesFile, // load your rules
      "-g",
      `consult('${tmpFile.name}')`, // load the temporary script
      "-g",
      "run_partial_diagnosis",
      "-t",
      "halt",
    ],
    (error, stdout, stderr) => {
      // Clean up temp file
      tmpFile.removeCallback();

      console.log("PROLOG STDOUT:", stdout);
      console.log("PROLOG STDERR:", stderr);
      if (error) {
        console.error("Exec error:", error);
        return callback(null, {
          disease: "unknown",
          recommendation: "Diagnosis engine error",
          confidence: 0,
        });
      }

      if (!stdout || stdout.trim() === "") {
        return callback(null, {
          disease: "unknown",
          recommendation: "No clear diagnosis",
          confidence: 0,
        });
      }

      const parts = stdout.trim().split("|");
      if (parts.length < 3) {
        return callback(null, {
          disease: "unknown",
          recommendation: "No clear diagnosis",
          confidence: 0,
        });
      }

      const [disease, recommendation, confidenceStr] = parts;
      const confidence = parseInt(confidenceStr, 10) || 0;

      callback(null, { disease, recommendation, confidence });
    },
  );
};
