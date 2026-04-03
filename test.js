const { runDiagnosis } = require("./utils/prologEngine");

// Test 1: Flu symptoms
console.log("\n=== Test 1: Flu symptoms (fever, cough, fatigue) ===");
runDiagnosis(["fever", "cough", "fatigue"], (err, result) => {
  if (err) console.error("Error:", err);
  else console.log("Result:", result);

  // Test 2: Common cold symptoms
  setTimeout(() => {
    console.log(
      "\n=== Test 2: Cold symptoms (runny_nose, sore_throat, cough) ===",
    );
    runDiagnosis(["runny_nose", "sore_throat", "cough"], (err, result) => {
      if (err) console.error("Error:", err);
      else console.log("Result:", result);

      // Test 3: No symptoms
      setTimeout(() => {
        console.log("\n=== Test 3: No symptoms ===");
        runDiagnosis([], (err, result) => {
          if (err) console.error("Error:", err);
          else console.log("Result:", result);
        });
      }, 1000);
    });
  }, 1000);
});
