const { execFile } = require("child_process");
const path = require("path");

exports.runDiagnosis = (symptoms, callback) => {
  const file = path.join(__dirname, "../prolog/diagnosis_rules.pl");

  // Create assertions for each symptom
  const asserts = symptoms.map((s) => `assert(has(${s}))`).join(",");

  // Goal: assert symptoms, then run the partial diagnosis predicate
  const goal = `(${asserts}, run_partial_diagnosis).`;

  execFile(
    "swipl",
    ["-q", "-s", file, "-g", goal, "-t", "halt"],
    (error, stdout, stderr) => {
      console.log("PROLOG STDOUT:", stdout);
      console.log("PROLOG STDERR:", stderr);

      if (!stdout || stdout.trim() === "") {
        return callback(null, {
          disease: "unknown",
          recommendation: "No clear diagnosis",
          confidence: 0,
        });
      }

      // Expected format: "disease|recommendation|confidence"
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
