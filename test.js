const { runDiagnosis } = require("./utils/prologEngine");

// Test 1: Flu symptoms (should return flu with high confidence)
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

      // Test 3: COVID-19 symptoms
      setTimeout(() => {
        console.log(
          "\n=== Test 3: COVID-19 symptoms (fever, cough, fatigue, loss_of_taste) ===",
        );
        runDiagnosis(
          ["fever", "cough", "fatigue", "loss_of_taste"],
          (err, result) => {
            if (err) console.error("Error:", err);
            else console.log("Result:", result);

            // Test 4: Malaria symptoms
            setTimeout(() => {
              console.log(
                "\n=== Test 4: Malaria symptoms (fever, headache, sweating) ===",
              );
              runDiagnosis(["fever", "headache", "sweating"], (err, result) => {
                if (err) console.error("Error:", err);
                else console.log("Result:", result);

                // Test 5: Mixed symptoms (should return highest confidence match)
                setTimeout(() => {
                  console.log(
                    "\n=== Test 5: Mixed symptoms (fever, cough) ===",
                  );
                  runDiagnosis(["fever", "cough"], (err, result) => {
                    if (err) console.error("Error:", err);
                    else console.log("Result:", result);
                  });
                }, 1000);
              });
            }, 1000);
          },
        );
      }, 1000);
    });
  }, 1000);
});
