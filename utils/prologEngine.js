const pl = require("tau-prolog");

// EMBEDDED PROLOG RULES - No file reading needed!
const PROLOG_RULES = `
:- dynamic has/1.

/* ==================== SYMPTOM LISTS ==================== */
disease_symptoms(malaria, [fever, headache, sweating]).
disease_symptoms(flu, [fever, cough, fatigue]).
disease_symptoms(pneumonia, [fever, cough, chest_pain]).
disease_symptoms(typhoid, [fever, headache, nausea, loss_of_appetite]).
disease_symptoms(covid19, [fever, cough, fatigue, loss_of_taste]).
disease_symptoms(common_cold, [runny_nose, sore_throat, cough]).
disease_symptoms(diabetes, [frequent_urination, excessive_thirst, fatigue, blurred_vision]).
disease_symptoms(hypertension, [headache, dizziness, chest_pain, shortness_of_breath]).
disease_symptoms(asthma, [shortness_of_breath, wheezing, cough, chest_tightness]).
disease_symptoms(tuberculosis, [chronic_cough, weight_loss, night_sweats, fever]).

/* ==================== RECOMMENDATIONS ==================== */
recommendation(malaria, 'Take antimalarial drugs and visit a hospital').
recommendation(flu, 'Rest, fluids, and paracetamol').
recommendation(pneumonia, 'Seek immediate medical attention').
recommendation(typhoid, 'Take antibiotics as prescribed and drink clean water').
recommendation(covid19, 'Isolate, get tested, and follow medical guidance').
recommendation(common_cold, 'Rest, fluids, and warm drinks').
recommendation(diabetes, 'Consult a doctor for blood sugar management and lifestyle changes').
recommendation(hypertension, 'Monitor blood pressure, reduce salt intake, and consult a doctor').
recommendation(asthma, 'Use prescribed inhalers and avoid triggers; seek medical advice').
recommendation(tuberculosis, 'Immediate medical evaluation and treatment; follow TB guidelines').

/* ==================== PARTIAL MATCHING ==================== */
partial_diagnosis(D, Confidence) :-
    disease_symptoms(D, Required),
    findall(S, (member(S, Required), has(S)), Present),
    length(Required, Total),
    length(Present, Count),
    Total > 0,
    Confidence is (Count / Total) * 100.

max_confidence([D-C], D, C).
max_confidence([D1-C1, D2-C2 | T], BestD, BestC) :-
    (   C1 > C2
    ->  max_confidence([D1-C1 | T], BestD, BestC)
    ;   max_confidence([D2-C2 | T], BestD, BestC)
    ).

run_partial_diagnosis :-
    findall(D-C, partial_diagnosis(D,C), Results),
    (   Results == []
    ->  write('unknown|No clear diagnosis|0')
    ;   max_confidence(Results, BestD, BestC),
        recommendation(BestD, R),
        write(BestD), write('|'), write(R), write('|'), write(BestC)
    ).
`;

exports.runDiagnosis = (symptoms, callback) => {
  console.log("Diagnosis called with symptoms:", symptoms);

  if (!symptoms || symptoms.length === 0) {
    return callback(null, {
      disease: "unknown",
      recommendation: "No symptoms provided",
      confidence: 0,
    });
  }

  // Create a new session
  const session = pl.create();
  let responded = false;

  // Timeout after 5 seconds
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
  }, 5000);

  // Load the embedded rules
  session.consult(PROLOG_RULES, {
    success: () => {
      console.log("Prolog rules loaded successfully");

      // Clear existing facts
      session.query("retractall(has(_))");
      session.answer(() => {
        // Convert symptoms to proper format
        const symptomAtoms = symptoms.map((s) =>
          s.toLowerCase().replace(/\s+/g, "_"),
        );

        console.log("Processing symptoms:", symptomAtoms);

        // Assert all symptoms
        let assertCount = 0;
        if (symptomAtoms.length === 0) {
          runQuery();
        } else {
          symptomAtoms.forEach((atom) => {
            session.query(`assert(has(${atom}))`);
            session.answer(() => {
              assertCount++;
              if (assertCount === symptomAtoms.length) {
                runQuery();
              }
            });
          });
        }

        function runQuery() {
          console.log("Running diagnosis query...");
          session.query("run_partial_diagnosis.");
          session.answer((answer) => {
            if (!responded) {
              responded = true;
              clearTimeout(timeout);

              if (answer) {
                let output = answer.toString();
                console.log("Raw output:", output);

                // Clean output
                output = output.replace(/[\[\]\\n]/g, "").trim();
                const parts = output.split("|");

                if (parts.length >= 3 && parts[0] !== "unknown") {
                  callback(null, {
                    disease: parts[0],
                    recommendation: parts[1],
                    confidence: parseInt(parts[2]) || 0,
                  });
                } else {
                  callback(null, {
                    disease: "unknown",
                    recommendation: "No clear diagnosis",
                    confidence: 0,
                  });
                }
              } else {
                callback(null, {
                  disease: "unknown",
                  recommendation: "No clear diagnosis",
                  confidence: 0,
                });
              }
            }
          });
        }
      });
    },
    error: (err) => {
      console.error("Failed to load Prolog rules:", err);
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
