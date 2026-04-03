:- dynamic has/1.

/* ==================== SYMPTOM LISTS (for partial matching) ==================== */
disease_symptoms(malaria, [fever, headache, sweating]).
disease_symptoms(flu, [fever, cough, fatigue]).
disease_symptoms(pneumonia, [fever, cough, chest_pain]).
disease_symptoms(typhoid, [fever, headache, nausea, loss_of_appetite]).
disease_symptoms(covid19, [fever, cough, fatigue, loss_of_taste]).
disease_symptoms(common_cold, [runny_nose, sore_throat, cough]).

/* --- New diseases --- */
disease_symptoms(diabetes, [frequent_urination, excessive_thirst, fatigue, blurred_vision]).
disease_symptoms(hypertension, [headache, dizziness, chest_pain, shortness_of_breath]).
disease_symptoms(asthma, [shortness_of_breath, wheezing, cough, chest_tightness]).
disease_symptoms(tuberculosis, [chronic_cough, weight_loss, night_sweats, fever]).

/* ==================== EXACT MATCH RULES ==================== */
diagnosis(malaria) :- has(fever), has(headache), has(sweating).
diagnosis(flu) :- has(fever), has(cough), has(fatigue).
diagnosis(pneumonia) :- has(fever), has(cough), has(chest_pain).
diagnosis(typhoid) :- has(fever), has(headache), has(nausea), has(loss_of_appetite).
diagnosis(covid19) :- has(fever), has(cough), has(fatigue), has(loss_of_taste).
diagnosis(common_cold) :- has(runny_nose), has(sore_throat), has(cough).

diagnosis(diabetes) :- has(frequent_urination), has(excessive_thirst), has(fatigue), has(blurred_vision).
diagnosis(hypertension) :- has(headache), has(dizziness), has(chest_pain), has(shortness_of_breath).
diagnosis(asthma) :- has(shortness_of_breath), has(wheezing), has(cough), has(chest_tightness).
diagnosis(tuberculosis) :- has(chronic_cough), has(weight_loss), has(night_sweats), has(fever).

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

/* ==================== PARTIAL MATCHING PREDICATES ==================== */

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
    ->  format('unknown|No clear diagnosis|0')
    ;   max_confidence(Results, BestD, BestC),
        recommendation(BestD, R),
        format('~w|~w|~w', [BestD, R, BestC])
    ).