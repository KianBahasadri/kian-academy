/* Placeholder curriculum. Topic names are real; lessons and sources are not attached. */
window.ROADMAP = {
  paths: [
    {
      id: "psychotherapy",
      title: "Psychotherapy",
      search: "therapy cbt counseling psychotherapy dbt act exposure schema mindfulness psychodynamic trauma motivational interviewing family",
      summary: "The practice of psychological treatment, from the shared clinical frame through CBT and the other major schools.",
      stages: [
        {
          id: "psychotherapy--foundations",
          title: "Shared clinical foundations",
          summary: "What every therapy rests on, before a school is chosen.",
          rows: [
            [
              {
                id: "th-what",
                code: "TH-01",
                title: "What psychotherapy is",
                summary: "How a therapy differs from advice, medicine, coaching, and friendship.",
                about: "Psychotherapy is a structured relationship in which psychological methods are used to relieve distress and change patterns of feeling, thinking, and acting. This topic separates that activity from neighboring ones.",
                covers: ["Aims and limits of therapy", "Common factors and specific techniques", "Titles, training, and who may practice", "What a course of therapy looks like from the first session"]
              }
            ],
            [
              {
                id: "th-ethics",
                code: "TH-02",
                title: "Ethics, consent, and the frame",
                summary: "The agreements that make a therapy safe enough to do.",
                about: "The frame is the set of agreements around consent, confidentiality, time, money, contact, and the practitioner's boundaries. Later techniques assume this frame is already in place.",
                covers: ["Informed consent", "Confidentiality and its limits", "Dual relationships and boundaries", "Records, privacy, and the contract"],
                prereqs: ["th-what"]
              },
              {
                id: "th-alliance",
                code: "TH-03",
                title: "The therapeutic relationship",
                summary: "How a working alliance is built, strained, and repaired.",
                about: "Outcome research keeps finding that the working alliance matters across schools. This topic is about goals, tasks, bond, and what happens when the relationship goes wrong.",
                covers: ["Goals, tasks, and bond", "Rupture and repair", "Therapist factors and fit", "Preference, dropout, and mismatch"],
                prereqs: ["th-what"]
              }
            ],
            [
              {
                id: "th-interview",
                code: "TH-04",
                title: "Clinical interviewing",
                summary: "Learning what is happening without turning the first hours into an interrogation.",
                about: "A therapy interview gathers the history of the problem, the person's own account, and what they want to change. It is a clinical skill, not a script.",
                covers: ["Opening and pacing", "History of the problem", "Hearing mental state without a checklist alone", "Strengths, context, and the request"],
                prereqs: ["th-ethics", "th-alliance"]
              }
            ],
            [
              {
                id: "th-risk",
                code: "TH-05",
                title: "Risk, crisis, and safeguarding",
                summary: "Duties around suicide, self-harm, harm to others, and abuse. Not a crisis protocol.",
                about: "Therapists have to recognize risk and know when confidentiality gives way to action. This topic names those responsibilities. It does not teach a crisis procedure.",
                covers: ["Asking about suicide and self-harm", "Acute risk and ongoing risk", "Safeguarding children and adults at risk", "When to involve other people"],
                prereqs: ["th-interview"]
              }
            ],
            [
              {
                id: "th-formulation",
                code: "TH-06",
                title: "Case formulation",
                summary: "A shared explanation of how the problem developed and what keeps it going.",
                about: "A formulation guides what the therapy will actually do. It is revised when it is wrong, and it is built with the person rather than handed down.",
                covers: ["The 4 Ps and other simple frames", "Collaborative and expert write-ups", "Using a formulation in session", "Revising a formulation that does not fit"],
                prereqs: ["th-interview"]
              }
            ],
            [
              {
                id: "th-culture",
                code: "TH-07",
                title: "Culture, identity, and power",
                summary: "Race, language, faith, class, gender, sexuality, disability, and the therapist's own position.",
                about: "People do not arrive as unmarked individuals. This topic is about naming culture and power in the room, including the practitioner's position.",
                covers: ["Cultural formulation", "Racism and minority stress", "Language and interpreters", "Power in the relationship"],
                prereqs: ["th-formulation"]
              },
              {
                id: "th-supervision",
                code: "TH-08",
                title: "Supervision and reflective practice",
                summary: "Using supervision, and knowing the edge of one's competence.",
                about: "Therapy is not practiced alone. Supervision, reflection, and referral are part of the work.",
                covers: ["What supervision is for", "Recordings and process notes", "Personal therapy and self-awareness", "Competence, scope, and referral"],
                prereqs: ["th-ethics"]
              }
            ]
          ]
        },
        {
          id: "psychotherapy--cbt",
          title: "Cognitive and behavioral therapies",
          summary: "Learning theory, the cognitive model, and the therapies built from them.",
          rows: [
            [
              {
                id: "th-learning",
                code: "TH-09",
                title: "Learning theory",
                summary: "How behavior is acquired, maintained, and given up.",
                about: "Behavior therapy starts from conditioning and from the habits, especially avoidance, that keep a problem in place.",
                covers: ["Classical and operant conditioning", "Reinforcement, punishment, and extinction", "Avoidance and safety behaviors", "Two-factor accounts of fear"],
                prereqs: ["th-formulation"]
              },
              {
                id: "th-cognitive",
                code: "TH-10",
                title: "Cognitive theory",
                summary: "Meaning, emotion, and the Beck and Ellis traditions.",
                about: "Cognitive therapies propose that the meaning assigned to events shapes emotion and action, and that those meanings can be examined.",
                covers: ["Automatic thoughts, assumptions, and beliefs", "Beck's models of depression and anxiety", "Ellis and rational emotive behavior therapy", "What a cognitive distortion is, and is not"],
                prereqs: ["th-formulation"]
              }
            ],
            [
              {
                id: "th-cbt-core",
                code: "TH-11",
                title: "CBT structure and formulation",
                summary: "Agenda, shared formulation, between-session practice, and review.",
                about: "Standard cognitive behavioral therapy is a structured therapy with a problem list, a formulation, session agendas, and homework. The disorder-specific models sit on this frame.",
                covers: ["Assessment and the problem list", "A cognitive behavioral formulation", "Session structure and homework", "Measuring from the first session"],
                prereqs: ["th-learning", "th-cognitive"]
              }
            ],
            [
              {
                id: "th-ba",
                code: "TH-12",
                title: "Behavioral activation",
                summary: "Treating depression by restoring rewarded activity.",
                about: "Behavioral activation starts from lost activity and avoidance, not from debating thoughts. It is both a standalone treatment and a piece of broader CBT.",
                covers: ["Activity monitoring", "Avoidance and values", "Scheduling and graded tasks", "When activation is not enough"],
                prereqs: ["th-cbt-core"]
              },
              {
                id: "th-exposure",
                code: "TH-13",
                title: "Exposure",
                summary: "Staying with what is feared, including response prevention for OCD.",
                about: "Exposure reduces fear by contact with the feared situation without the escape and safety habits that keep it going. Response prevention is the OCD form of the same idea.",
                covers: ["Habituation and inhibitory learning", "Building a hierarchy", "In vivo, imaginal, and interoceptive exposure", "Response prevention"],
                prereqs: ["th-cbt-core"]
              }
            ],
            [
              {
                id: "th-cbt-anx",
                code: "TH-14",
                title: "CBT for anxiety disorders",
                summary: "Panic, social anxiety, worry, specific phobia, and health anxiety.",
                about: "The general model is adapted for each anxiety problem. The shared piece is threat, avoidance, and safety behavior. The specific piece is the belief that keeps that problem going.",
                covers: ["Panic and misread body sensations", "Social anxiety and self-focused attention", "Worry and intolerance of uncertainty", "What is shared and what is specific"],
                prereqs: ["th-exposure"]
              },
              {
                id: "th-cbt-dep",
                code: "TH-15",
                title: "CBT for depression",
                summary: "Inactivity, rumination, hopelessness, and relapse.",
                about: "CBT for depression combines activation with work on the meanings that keep the episode going, and it plans for the next episode from the start.",
                covers: ["Activation inside a full CBT course", "Thought records and behavioral experiments", "Rumination and hopelessness", "Relapse signatures"],
                prereqs: ["th-ba"]
              }
            ],
            [
              {
                id: "th-cbtp",
                code: "TH-16",
                title: "CBT for psychosis",
                summary: "A psychological approach to voices, paranoia, and distressing beliefs.",
                role: "elective",
                about: "CBTp works with the distress and behavior around psychotic experiences. It does not claim to replace medical care, and it is not a method for arguing someone out of a belief.",
                covers: ["Voices, paranoia, and preoccupation", "Formulation of a single experience", "Working with conviction without debate", "Where this sits beside antipsychotic treatment"],
                prereqs: ["th-cbt-core"]
              },
              {
                id: "th-dbt",
                code: "TH-17",
                title: "Dialectical behavior therapy",
                summary: "Skills, acceptance, and change for chronic suicidality and borderline personality disorder.",
                about: "DBT combines individual therapy, skills training, and a consultation team. It was built for borderline personality disorder and is now adapted more widely.",
                covers: ["Biosocial theory", "Mindfulness, distress tolerance, emotion regulation, interpersonal effectiveness", "Individual therapy and coaching", "Evidence, and adaptations beyond the original population"],
                prereqs: ["th-cbt-core", "th-risk"]
              }
            ],
            [
              {
                id: "th-act",
                code: "TH-18",
                title: "Acceptance and commitment therapy",
                summary: "Acceptance, defusion, and action toward chosen values.",
                about: "ACT trains a different relationship to thoughts and feelings, then asks the person to act on values. It belongs to the behavioral tradition even where it does not dispute thought content.",
                covers: ["Psychological flexibility", "The hexaflex processes", "Values and committed action", "How ACT differs from standard CBT"],
                prereqs: ["th-cbt-core"]
              }
            ],
            [
              {
                id: "th-schema",
                code: "TH-19",
                title: "Schema therapy",
                summary: "Early schemas, modes, and limited reparenting for long-standing patterns.",
                role: "elective",
                about: "Schema therapy integrates cognitive work with attention to early patterns and to the therapy relationship. It is aimed at problems that a short CBT protocol does not reach.",
                covers: ["Schemas and modes", "Limited reparenting", "Imagery rescripting", "Who it is aimed at"],
                prereqs: ["th-cbt-core"]
              },
              {
                id: "th-mbct",
                code: "TH-20",
                title: "Mindfulness-based therapies",
                summary: "MBCT, MBSR, and the difference between a clinical program and a wellness claim.",
                role: "elective",
                about: "Mindfulness-based cognitive therapy is a structured group program, best known for reducing relapse after depression. The topic also covers what these programs are not.",
                covers: ["MBCT and MBSR", "Decentering", "Relapse prevention in depression", "Contraindications and overclaiming"],
                prereqs: ["th-cbt-dep"]
              }
            ]
          ]
        },
        {
          id: "psychotherapy--schools",
          title: "Other schools of practice",
          summary: "Humanistic, psychodynamic, systemic, trauma-focused, and integrative work.",
          rows: [
            [
              {
                id: "th-person",
                code: "TH-21",
                title: "Person-centered therapy",
                summary: "Rogers's conditions: empathy, regard, and congruence.",
                about: "Person-centered therapy holds that change follows from the relationship conditions more than from techniques. Nondirective does not mean passive.",
                covers: ["Actualizing tendency and conditions of worth", "Empathy, unconditional positive regard, and congruence", "What the therapist still does", "Evidence and criticism"],
                prereqs: ["th-alliance", "th-formulation"]
              }
            ],
            [
              {
                id: "th-pdt",
                code: "TH-22",
                title: "Psychodynamic therapy in practice",
                summary: "Using recurring patterns and the relationship in the room. Theory lives on the psychology path.",
                role: "bridge",
                bridgeTo: "psychology",
                about: "This is the clinical use of psychodynamic ideas: a focus, the relationship in the session, and interpretations offered sparingly. The psychoanalytic theory those ideas come from is on the psychology path.",
                covers: ["Transference and countertransference in session", "A focus and the triangle of person", "When to interpret, and when not to", "Brief psychodynamic models"],
                prereqs: ["th-formulation", "th-alliance"]
              }
            ],
            [
              {
                id: "th-systemic",
                code: "TH-23",
                title: "Systemic and family therapy",
                summary: "Problems held in patterns between people.",
                about: "Systemic therapies treat the unit of work as a relationship pattern. The identified patient is not assumed to be the location of the problem.",
                covers: ["Circular patterns", "Genograms", "First- and second-order ideas in plain language", "More than one person in the room"],
                prereqs: ["th-formulation"]
              },
              {
                id: "th-group",
                code: "TH-24",
                title: "Group therapy",
                summary: "The group itself as a means of change.",
                about: "Group therapy uses both a method and the relationships in the group. It is not the same thing as a class.",
                covers: ["Factors Yalom described", "Agreements and roles", "Process groups and psychoeducation groups", "Selection and dropout"],
                prereqs: ["th-alliance"]
              }
            ],
            [
              {
                id: "th-couples",
                code: "TH-25",
                title: "Couple therapy",
                summary: "Working with an intimate relationship as the client.",
                role: "elective",
                about: "Couple therapy has its own frame: two accounts, secrets, safety, and the question of whether the relationship is the client.",
                covers: ["The relationship as the client", "Pursuit and withdrawal patterns", "Secrets and safety", "Behavioral and emotion-focused approaches in outline"],
                prereqs: ["th-systemic"]
              },
              {
                id: "th-mi",
                code: "TH-26",
                title: "Motivational interviewing",
                summary: "A guiding style for ambivalence.",
                about: "Motivational interviewing is used in addiction, health behavior, and as a prelude to other treatments. It is a conversation style, not a bag of tricks for getting compliance.",
                covers: ["Ambivalence and sustain talk", "Open questions, affirmation, reflection, summary", "Change talk", "MI alongside other therapies"],
                prereqs: ["th-interview"]
              }
            ],
            [
              {
                id: "th-trauma",
                code: "TH-27",
                title: "Trauma-focused therapies",
                summary: "Prolonged exposure, CPT, trauma-focused CBT, and EMDR as a debated option.",
                about: "Several therapies have evidence for post-traumatic stress. They are not interchangeable, and early trauma processing is not always the first step. EMDR is included as a widely used option whose proposed mechanism is contested.",
                covers: ["PTSD as a treatment target", "Prolonged exposure and cognitive processing therapy", "Trauma-focused CBT with children", "EMDR and the eye-movement debate", "Stabilization and the timing of trauma memory work"],
                prereqs: ["th-exposure", "th-risk"]
              }
            ],
            [
              {
                id: "th-integrative",
                code: "TH-28",
                title: "Integrative and pluralistic practice",
                summary: "Borrowing across schools on purpose, from a formulation.",
                about: "Most working therapists draw on more than one school. This topic is about doing that from a formulation the therapist can defend, rather than collecting techniques.",
                covers: ["Technical eclecticism and theoretical integration", "Pluralism and client preference", "Combinations that fight each other", "Stating a model"],
                prereqs: ["th-cbt-core", "th-person", "th-pdt"]
              }
            ]
          ]
        },
        {
          id: "psychotherapy--contexts",
          title: "Contexts of practice",
          summary: "Teams, medical settings, children, measurement, and endings.",
          rows: [
            [
              {
                id: "th-with-psychiatry",
                code: "TH-29",
                title: "Therapy alongside medical treatment",
                summary: "Shared care when someone is also in psychiatric treatment.",
                role: "bridge",
                bridgeTo: "psychiatry",
                about: "Psychological treatment is often delivered beside medication, wards, and teams. This topic is about that arrangement. The medicines themselves are on the psychiatry path.",
                covers: ["Combined treatment", "What to know about medicines without prescribing", "Teams, wards, and handovers", "When therapy is the wrong offer right now"],
                prereqs: ["th-formulation", "th-risk"]
              },
              {
                id: "th-camhs",
                code: "TH-30",
                title: "Children, adolescents, and families",
                summary: "Consent, caregivers, development, and school.",
                role: "bridge",
                bridgeTo: "development",
                about: "The work changes when the client is a child or teenager. Development, parental consent, and the network around the child are part of the therapy.",
                covers: ["Assent and parental consent", "Who is in the room", "Fitting a method to development", "School, protection, and the network"],
                prereqs: ["th-ethics", "th-systemic"]
              }
            ],
            [
              {
                id: "th-health",
                code: "TH-31",
                title: "Therapy in health settings",
                summary: "Hospitals, primary care, illness, and persistent physical symptoms.",
                about: "Psychological care in medical settings deals with adjustment, health anxiety, and symptoms that have not yielded to a medical explanation. It is done beside physicians, not instead of them.",
                covers: ["Health anxiety and medical illness", "Adjustment and grief", "Consultation-liaison work", "Brief models in primary care"],
                prereqs: ["th-cbt-core"]
              }
            ],
            [
              {
                id: "th-outcomes",
                code: "TH-32",
                title: "Outcome monitoring",
                summary: "Using measures during a therapy, not only after it.",
                about: "Routine measurement of symptoms, alliance, and functioning can steer a therapy. A score is not the therapy.",
                covers: ["Session-by-session measures", "Feedback-informed treatment", "Reliable change", "What a score cannot say"],
                prereqs: ["th-cbt-core"]
              }
            ],
            [
              {
                id: "th-endings",
                code: "TH-33",
                title: "Endings",
                summary: "Planned endings, dropout, and relapse plans.",
                about: "Therapies stop. Some stop on purpose, with a plan. Some stop because the person leaves. Both need thinking about from early in the work.",
                covers: ["Preparing an ending from the start", "Relapse signatures and plans", "Unplanned endings", "Follow-up"],
                prereqs: ["th-outcomes", "th-formulation"]
              }
            ]
          ]
        }
      ]
    },
    {
      id: "psychiatry",
      title: "Psychiatry and treatments",
      search: "psychiatry medicine medication diagnosis dsm icd pharmacology antidepressant antipsychotic lithium ect tms psychosis bipolar adhd",
      summary: "Medical assessment, diagnosis, medicines, brain stimulation, and the services around them.",
      stages: [
        {
          id: "psychiatry--foundations",
          title: "Clinical foundations",
          summary: "How a psychiatric assessment is made, and what a diagnosis is for.",
          rows: [
            [
              {
                id: "ps-interview",
                code: "PS-01",
                title: "Psychiatric interview and mental state",
                summary: "History, mental status examination, and collateral information.",
                about: "The psychiatric assessment is a medical interview plus a mental status examination. Collateral history matters because the person in front of you may not be able to give the whole account.",
                covers: ["History of the present illness", "Mental status examination", "Collateral history", "A preliminary impression, held lightly"]
              }
            ],
            [
              {
                id: "ps-diagnosis",
                code: "PS-02",
                title: "Diagnosis in DSM-5-TR and ICD-11",
                summary: "What the manuals are for, how they differ, and what they leave out.",
                about: "Diagnosis is a shared language for description, research, and services. It is not an explanation of a person. DSM-5-TR and ICD-11 are the current manuals this map uses.",
                covers: ["Categories and dimensions", "DSM and ICD side by side", "Comorbidity and diagnostic hierarchy", "Criticism, including over-medicalization"],
                prereqs: ["ps-interview"]
              },
              {
                id: "ps-desc",
                code: "PS-03",
                title: "Descriptive psychopathology",
                summary: "The vocabulary of mood, thought, perception, insight, and experience.",
                about: "Descriptive psychopathology is the careful naming of signs and symptoms. It comes from the phenomenological tradition and is still the language of clinical notes.",
                covers: ["Mood, affect, and anxiety", "Thought form and thought content", "Perception, passivity, and agency", "Insight and judgment"],
                prereqs: ["ps-interview"]
              }
            ],
            [
              {
                id: "ps-neuro",
                code: "PS-04",
                title: "Neuroscience for clinicians",
                summary: "The neural vocabulary clinicians use, and what a scan cannot say about one patient.",
                role: "bridge",
                bridgeTo: "psychology",
                about: "Clinicians need a working vocabulary of transmitters, stress systems, and circuits. They also need the limit: a group finding on a scan is not a diagnosis of the person in the room. The fuller biological psychology is on the psychology path.",
                covers: ["Transmitters clinicians actually name", "Stress systems and sleep in outline", "What imaging does not diagnose", "Why chemical imbalance is a slogan"],
                prereqs: ["ps-interview"]
              },
              {
                id: "ps-medical",
                code: "PS-05",
                title: "Medical mimics and physical health",
                summary: "Illness, substances, and medicines that look psychiatric, and the bodies of psychiatric patients.",
                about: "Psychiatric symptoms are sometimes medical, toxic, or drug-induced. People with mental illness also carry a heavy burden of ordinary physical disease. Both facts belong in the assessment.",
                covers: ["Delirium and medical mimics", "Substance-induced states", "Metabolic and cardiac risk", "The idea of a baseline investigation"],
                prereqs: ["ps-interview"]
              }
            ],
            [
              {
                id: "ps-law",
                code: "PS-06",
                title: "Risk, capacity, and mental health law",
                summary: "Clinical risk and the legal ideas of capacity and compulsion. Not a statute guide.",
                about: "Psychiatry works under legal duties: risk, capacity, confidentiality, and, in some cases, treatment without consent. The statutes differ by country and are not spelled out here.",
                covers: ["Suicide and violence risk in a medical assessment", "Decision-making capacity", "Compulsory treatment as a concept", "Confidentiality inside a team"],
                prereqs: ["ps-interview"]
              }
            ]
          ]
        },
        {
          id: "psychiatry--presentations",
          title: "Presentations",
          summary: "The main groups of disorder, as clinical pictures rather than treatment recipes.",
          rows: [
            [
              {
                id: "ps-mood",
                code: "PS-07",
                title: "Mood disorders",
                summary: "Depression, bipolar disorders, mixed states, and grief.",
                about: "Mood disorders are defined by episodes, course, and polarity. Grief, medical illness, and substances sit in the differential and are not the same diagnosis.",
                covers: ["Depressive episodes and specifiers", "Bipolar I, bipolar II, and cyclothymia", "Mixed features and rapid cycling", "Grief and other lookalikes"],
                prereqs: ["ps-diagnosis", "ps-desc"]
              },
              {
                id: "ps-anxiety",
                code: "PS-08",
                title: "Anxiety, OCD, and trauma-related disorders",
                summary: "Fear, obsessions, and the aftermath of trauma as separate groups.",
                about: "These problems share distress and avoidance and differ in what is feared, what is repeated, and what the person does to feel safer. Trauma-related diagnosis is also a live debate.",
                covers: ["Anxiety disorders and panic", "OCD and related disorders", "PTSD", "Complex trauma as a clinical argument"],
                prereqs: ["ps-diagnosis", "ps-desc"]
              }
            ],
            [
              {
                id: "ps-psychosis",
                code: "PS-09",
                title: "Psychotic disorders",
                summary: "Schizophrenia, delusional disorder, and psychosis with a medical or mood cause.",
                about: "Psychosis is a syndrome, not one disease. The assessment asks about duration, mood, substances, and neurological illness before a primary psychotic disorder is named.",
                covers: ["Schizophrenia and related disorders", "Delusional disorder and brief psychosis", "Secondary psychosis", "Early intervention as a service idea"],
                prereqs: ["ps-diagnosis", "ps-desc"]
              },
              {
                id: "ps-personality",
                code: "PS-10",
                title: "Personality disorders",
                summary: "Categorical diagnoses, the dimensional alternative, and the stigma around both.",
                about: "Personality disorder describes enduring patterns of emotion, identity, and relationships. The category is clinically used and heavily criticized. Both belong in the topic.",
                covers: ["Categorical diagnoses", "The alternative dimensional model", "Borderline and antisocial patterns", "Overlap with mood and trauma"],
                prereqs: ["ps-diagnosis", "ps-desc"]
              }
            ],
            [
              {
                id: "ps-addiction",
                code: "PS-11",
                title: "Substance use and addiction",
                summary: "Use, harm, dependence, withdrawal, and dual diagnosis.",
                about: "Substance problems range from use to dependence, and withdrawal can be a medical emergency. They also travel with almost every other psychiatric presentation.",
                covers: ["Use, harmful use, and dependence", "Alcohol, opioids, stimulants, cannabis, and sedatives in outline", "Withdrawal as a medical risk", "Dual diagnosis"],
                prereqs: ["ps-diagnosis", "ps-medical"]
              },
              {
                id: "ps-ndd",
                code: "PS-12",
                title: "Neurodevelopmental conditions",
                summary: "ADHD and autism as lifespan conditions, not childhood footnotes.",
                about: "ADHD and autism are developmental conditions that persist, change shape, and are often recognized late. A single clinic visit is not an assessment.",
                covers: ["ADHD across the lifespan", "Autism", "Learning disability and psychiatric comorbidity", "What an assessment has to include"],
                prereqs: ["ps-diagnosis"]
              }
            ],
            [
              {
                id: "ps-eating",
                code: "PS-13",
                title: "Eating disorders",
                summary: "Anorexia, bulimia, binge-eating disorder, and the medical danger.",
                about: "Eating disorders are psychiatric and medical at once. Weight, purging, and cardiac risk decide the setting of care. This topic does not describe how to refeed someone.",
                covers: ["Anorexia, bulimia, and binge-eating disorder", "Medical danger", "Psychological and family treatments in outline", "When medical admission is the issue"],
                prereqs: ["ps-diagnosis", "ps-medical"]
              },
              {
                id: "ps-later",
                code: "PS-14",
                title: "Later life and cognitive disorders",
                summary: "Delirium, dementia, and depression in older adults.",
                about: "In later life the first task is often to tell delirium, dementia, and depression apart. Behavioral change may be the presentation of a medical illness.",
                covers: ["Delirium, dementia, and depression", "Alzheimer disease and other dementias in outline", "Behavioral and psychological symptoms", "Capacity and carers"],
                prereqs: ["ps-diagnosis", "ps-medical"]
              }
            ],
            [
              {
                id: "ps-perinatal",
                code: "PS-15",
                title: "Perinatal psychiatry",
                summary: "Mood and psychosis around pregnancy and the postpartum period.",
                about: "Perinatal psychiatry covers ordinary baby blues, depressive illness, and postpartum psychosis, plus the risk conversation about medicines in pregnancy and lactation. It does not give a prescribing regimen.",
                covers: ["Baby blues, depression, and postpartum psychosis", "Medicines in pregnancy and lactation as a risk conversation", "The infant and the bond", "Partners and the network"],
                prereqs: ["ps-mood", "ps-medical"]
              },
              {
                id: "ps-child",
                code: "PS-16",
                title: "Child and adolescent psychiatry",
                summary: "Presentations, consent, and services that differ from adult practice.",
                role: "bridge",
                bridgeTo: "development",
                about: "Children are not small adults. Presentation, consent, family, and school change the assessment. Developmental science is on the development path.",
                covers: ["Presentations that differ from adult practice", "Consent and the family", "Mood, behavior, and self-harm in young people", "Services around the child"],
                prereqs: ["ps-diagnosis"]
              }
            ]
          ]
        },
        {
          id: "psychiatry--medicines",
          title: "Medicines",
          summary: "Classes, adverse effects, and decisions. No doses and no regimens.",
          rows: [
            [
              {
                id: "ps-pharm",
                code: "PS-17",
                title: "Principles of psychopharmacology",
                summary: "Targets, time course, adverse effects, and the gap between a mechanism story and a trial.",
                about: "Psychiatric medicines are chosen from evidence, adverse effects, and the person's priorities. A receptor story is not, by itself, a reason to prescribe.",
                covers: ["Pharmacokinetics and dynamics in plain language", "Onset, trial length, and non-response", "Adverse effects and interactions", "Shared decisions and adherence"],
                prereqs: ["ps-diagnosis", "ps-medical"]
              }
            ],
            [
              {
                id: "ps-antidepressants",
                code: "PS-18",
                title: "Antidepressants",
                summary: "Classes, uses beyond depression, and stopping.",
                about: "Antidepressants are a set of classes with different adverse effects and with uses outside depression, including anxiety and OCD. Stopping them is its own clinical topic.",
                covers: ["Classes in current use", "Indications beyond depression", "Common and serious adverse effects", "Discontinuation"],
                prereqs: ["ps-pharm"]
              },
              {
                id: "ps-anxiolytics",
                code: "PS-19",
                title: "Anxiolytics and hypnotics",
                summary: "Benzodiazepines, alternatives, and the problem of dependence.",
                about: "Medicines for anxiety and sleep work quickly and carry dependence, tolerance, and falls. Non-drug approaches are part of the same decision.",
                covers: ["Benzodiazepines and their risks", "Other anxiolytics in outline", "Sleeping medicines", "Dependence and withdrawal"],
                prereqs: ["ps-pharm"]
              }
            ],
            [
              {
                id: "ps-antipsychotics",
                code: "PS-20",
                title: "Antipsychotics",
                summary: "Acute treatment, maintenance, and metabolic and motor harms.",
                about: "Antipsychotics reduce psychotic symptoms for many people and carry serious physical costs. Clozapine is a special case because of both its place in treatment-resistant illness and its monitoring burden. This topic does not describe how to start it.",
                covers: ["First- and second-generation drugs", "Acute episodes and maintenance", "Metabolic, motor, and cardiac effects", "Clozapine as a special case"],
                prereqs: ["ps-pharm", "ps-psychosis"]
              },
              {
                id: "ps-moodstab",
                code: "PS-21",
                title: "Mood stabilizers",
                summary: "Lithium, anticonvulsants, monitoring, and teratogenicity.",
                about: "Mood stabilizers are used in bipolar disorder and sometimes beyond it. Lithium and several anticonvulsants need monitoring and a specific conversation about pregnancy.",
                covers: ["Lithium", "Anticonvulsant mood stabilizers", "The idea of monitoring", "Teratogenicity as a counseling issue"],
                prereqs: ["ps-pharm", "ps-mood"]
              }
            ],
            [
              {
                id: "ps-stimulants",
                code: "PS-22",
                title: "Medicines for ADHD",
                summary: "Stimulants, non-stimulants, misuse, and the rest of the plan.",
                about: "ADHD medicines are effective for many people and are also diverted and misused. Medicine is one part of a plan that includes the person's actual day.",
                covers: ["Stimulants and non-stimulants", "Misuse and diversion", "Adult treatment in outline", "When medicine is not the whole plan"],
                prereqs: ["ps-pharm", "ps-ndd"]
              },
              {
                id: "ps-dementia-meds",
                code: "PS-23",
                title: "Medicines in dementia",
                summary: "What cognitive enhancers do, and what they do not do.",
                about: "Cholinesterase inhibitors and memantine have modest effects on cognition for some dementias. They do not stop the disease. Agitation is not an indication for a casual antipsychotic.",
                covers: ["Cholinesterase inhibitors and memantine", "Limits of the effect", "Agitation and the antipsychotic problem", "Deprescribing"],
                prereqs: ["ps-pharm", "ps-later"]
              }
            ],
            [
              {
                id: "ps-addiction-tx",
                code: "PS-24",
                title: "Medicines for substance use",
                summary: "Withdrawal, relapse prevention, and opioid agonist treatment as concepts.",
                about: "Some substance treatments are medical emergencies and some are long-term maintenance. This topic names them. It does not give a withdrawal schedule.",
                covers: ["Alcohol withdrawal as a medical emergency", "Relapse-prevention medicines", "Opioid agonist treatment as a concept", "Psychosocial treatment beside medicine"],
                prereqs: ["ps-pharm", "ps-addiction"]
              },
              {
                id: "ps-special",
                code: "PS-25",
                title: "Special populations",
                summary: "Pregnancy, children, older adults, and medical comorbidity.",
                about: "The same drug is a different decision in pregnancy, childhood, old age, and organ failure. This topic is that difference, not a dosing table.",
                covers: ["Pregnancy and lactation", "Children and adolescents", "Older adults and polypharmacy", "Liver, kidney, and cardiac disease"],
                prereqs: ["ps-pharm"]
              }
            ],
            [
              {
                id: "ps-deprescribe",
                code: "PS-26",
                title: "Deprescribing",
                summary: "When to continue a medicine and when to stop it.",
                about: "Stopping is a clinical act. Withdrawal, relapse, and the person's own goal all belong in the plan.",
                covers: ["Reasons to continue", "Reasons to stop", "Withdrawal syndromes", "A shared plan"],
                prereqs: ["ps-pharm"]
              }
            ]
          ]
        },
        {
          id: "psychiatry--services",
          title: "Other treatments and services",
          summary: "Stimulation, psychological care inside psychiatry, and how services are organized.",
          rows: [
            [
              {
                id: "ps-ect",
                code: "PS-27",
                title: "ECT and neuromodulation",
                summary: "Electroconvulsive therapy, rTMS, and treatments that are still experimental.",
                about: "ECT remains a treatment for severe mood disorder and some other states, with real cognitive costs and a long stigma. Repetitive TMS is a different, noninvasive option. Newer stimulation methods stay experimental until the evidence says otherwise.",
                covers: ["What ECT is used for", "Cognitive effects and consent", "Repetitive TMS in outline", "Experimental treatments, and why they stay experimental"],
                prereqs: ["ps-mood", "ps-pharm"]
              },
              {
                id: "ps-emerging",
                code: "PS-28",
                title: "Ketamine and psychedelic-assisted treatments",
                summary: "What is licensed, what is research, and what this map will not teach.",
                role: "elective",
                about: "Esketamine is a licensed option in some countries. Other psychedelic-assisted treatments are mostly research programs with serious problems of blinding and expectancy. This map does not describe how to give them.",
                covers: ["Esketamine as a licensed option in some places", "Psychedelic-assisted therapy as research", "Placebo, blinding, and expectancy", "Why administration is not taught here"],
                prereqs: ["ps-pharm"]
              }
            ],
            [
              {
                id: "ps-psych-tx",
                code: "PS-29",
                title: "Psychological treatment in psychiatric care",
                summary: "Which therapies are offered inside medical services, and when.",
                role: "bridge",
                bridgeTo: "psychotherapy",
                about: "Guidelines attach specific therapies to specific conditions. Delivering them during acute illness, on a ward, or to someone who declines medicine is a different problem from the therapy textbook. The therapies themselves are on the psychotherapy path.",
                covers: ["Therapies named in guidelines", "Therapy during acute illness", "Team delivery", "Care for someone who declines medicine"],
                prereqs: ["ps-diagnosis"]
              }
            ],
            [
              {
                id: "ps-services",
                code: "PS-30",
                title: "Services and settings",
                summary: "Outpatient, inpatient, crisis, and community care.",
                about: "The setting changes what can be done. Least restriction is a principle, not a slogan, and pathways into hospital are also pathways out.",
                covers: ["Outpatient, inpatient, and crisis care", "Community and early-intervention teams", "Coercion and least restriction", "Coming in and leaving"],
                prereqs: ["ps-law"]
              },
              {
                id: "ps-recovery",
                code: "PS-31",
                title: "Recovery and social intervention",
                summary: "Housing, work, peers, and the word recovery.",
                about: "Recovery names both a service-user movement and a clinical aim, and those are not identical. Housing, income, work, and peer support change outcomes that medicines do not touch.",
                covers: ["Two uses of the word recovery", "Housing, work, and income", "Peer support", "Rehabilitation"],
                prereqs: ["ps-services"]
              }
            ],
            [
              {
                id: "ps-mbc",
                code: "PS-32",
                title: "Measurement-based care",
                summary: "Using scales in clinics without being ruled by them.",
                role: "bridge",
                bridgeTo: "assessment",
                about: "Measurement-based care means acting on repeated measures, not collecting them for a dashboard. The psychometrics of those measures are on the assessment path.",
                covers: ["Scales in ordinary clinics", "Acting on a score", "Outcome and process", "What services audit"],
                prereqs: ["ps-diagnosis"]
              }
            ]
          ]
        }
      ]
    },
    {
      id: "psychology",
      title: "Psychology and psychoanalysis",
      search: "psychology psychoanalysis freud jung lacan cognitive social personality developmental attachment memory learning research",
      summary: "The science of mind and behavior, the psychoanalytic tradition, and the arguments between them.",
      stages: [
        {
          id: "psychology--science",
          title: "The science of mind and behavior",
          summary: "The undergraduate core: history, method, and the main mental functions.",
          rows: [
            [
              {
                id: "py-history",
                code: "PY-01",
                title: "History and schools",
                summary: "Laboratories, behaviorism, the cognitive turn, and what a school still means.",
                about: "Psychology did not begin as one science. Structuralism, functionalism, psychoanalysis, behaviorism, humanism, and cognitive psychology each claimed the subject. The present field is the remainder of those fights.",
                covers: ["Early laboratories", "Behaviorism's break", "The cognitive turn", "What a school is now"]
              },
              {
                id: "py-methods",
                code: "PY-02",
                title: "Research methods",
                summary: "Designs, samples, and the distance between a study and a conclusion.",
                role: "bridge",
                bridgeTo: "assessment",
                about: "Psychological claims are tested with designs that can fail in known ways. The statistics, measurement theory, and paper-reading live in more detail on the assessment path.",
                covers: ["Experiments, correlations, and quasi-experiments", "Samples and bias", "What a single study can support", "Why methods have their own path"],
                prereqs: ["py-history"]
              }
            ],
            [
              {
                id: "py-bio",
                code: "PY-03",
                title: "Biological psychology",
                summary: "Nervous system, hormones, genetics, and evolution at textbook scale.",
                about: "Biological psychology is the body side of behavior: neurons, systems, hormones, genes, and evolution. Heritability is not destiny, and a brain region is not a trait.",
                covers: ["Neurons and major systems", "Regions psychologists actually name", "Behavioral genetics and its limits", "Evolution and comparative behavior"],
                prereqs: ["py-history"]
              },
              {
                id: "py-perception",
                code: "PY-04",
                title: "Sensation, perception, and attention",
                summary: "From a stimulus to something noticed.",
                about: "Perception is constructive, and attention decides which constructions get made. Failures of attention are data, not just lapses.",
                covers: ["Sensory systems in outline", "Perceptual organization", "Attention and its failures", "Awareness of a stimulus"],
                prereqs: ["py-bio"]
              }
            ],
            [
              {
                id: "py-learning",
                code: "PY-05",
                title: "Learning",
                summary: "Habituation, conditioning, and learning by watching.",
                about: "The scientific study of learning covers more than the clinical use of exposure. Biological constraints on learning are part of the basic account.",
                covers: ["Habituation", "Classical and operant conditioning", "Observational learning", "Biological constraints"],
                prereqs: ["py-history"]
              },
              {
                id: "py-memory",
                code: "PY-06",
                title: "Memory",
                summary: "Encoding, systems of storage, forgetting, and distortion.",
                about: "Memory is not a recording. Working memory, long-term systems, and the reconstructive character of recall are the core of the topic.",
                covers: ["Encoding, storage, and retrieval", "Working memory", "Long-term systems", "Forgetting and distortion"],
                prereqs: ["py-learning"]
              }
            ],
            [
              {
                id: "py-thought",
                code: "PY-07",
                title: "Language and thought",
                summary: "Concepts, judgment, and the outline of language acquisition.",
                about: "Thought covers categories, judgment under uncertainty, and problem solving. Language is included as the human medium those processes often use.",
                covers: ["Language acquisition in outline", "Concepts and categories", "Judgment and decision-making", "Problem solving"],
                prereqs: ["py-memory"]
              },
              {
                id: "py-emotion",
                code: "PY-08",
                title: "Emotion and motivation",
                summary: "Theories of emotion, appraisal, drive, and stress.",
                about: "Emotion theories disagree about whether bodily state, appraisal, or constructed categories come first. The disagreement matters for clinical models that quietly pick one.",
                covers: ["Theories of emotion", "Appraisal", "Motivation and drive", "Stress"],
                prereqs: ["py-bio"]
              }
            ],
            [
              {
                id: "py-sleep",
                code: "PY-09",
                title: "Consciousness and sleep",
                summary: "Sleep architecture, dreaming, and the cognitive unconscious.",
                about: "Sleep and consciousness are research topics with their own methods. The cognitive unconscious, meaning processing without awareness, is not the psychoanalytic unconscious.",
                covers: ["Sleep architecture", "Dreaming as a research topic", "Attention and awareness", "The cognitive unconscious"],
                prereqs: ["py-perception"]
              }
            ]
          ]
        },
        {
          id: "psychology--person",
          title: "Persons in context",
          summary: "Personality, social life, development, intelligence, health, and culture.",
          rows: [
            [
              {
                id: "py-personality",
                code: "PY-10",
                title: "Personality",
                summary: "Traits, temperament, and the situation.",
                about: "Personality psychology asks what is stable about a person and what the situation does instead. The five-factor model is the current common language, not a final theory.",
                covers: ["Trait models and the five factors", "Temperament", "Persons and situations", "Personality across the lifespan"],
                prereqs: ["py-history", "py-methods"]
              },
              {
                id: "py-social",
                code: "PY-11",
                title: "Social psychology",
                summary: "Attribution, attitudes, groups, obedience, and prejudice.",
                about: "Social psychology studies how other people shape thought and action. Its classic experiments are famous and, in several cases, more complicated than the textbook telling.",
                covers: ["Attribution", "Attitudes and persuasion", "Conformity, obedience, and groups", "Prejudice and social identity"],
                prereqs: ["py-methods"]
              }
            ],
            [
              {
                id: "py-dev",
                code: "PY-12",
                title: "Developmental psychology",
                summary: "Change across the lifespan, including Piaget and the critiques.",
                role: "bridge",
                bridgeTo: "development",
                about: "Developmental psychology studies change from infancy through old age. Stage theories are taught with the evidence that replaced parts of them. The applied lifespan path continues this topic.",
                covers: ["Methods with children", "Cognitive development", "Social and moral development", "Aging as development"],
                prereqs: ["py-methods"]
              },
              {
                id: "py-iq",
                code: "PY-13",
                title: "Intelligence and individual differences",
                summary: "What tests measure, g, heritability, and the political history.",
                about: "Intelligence research is both a psychometric field and a history of misuse. The topic includes the findings and the misuse.",
                covers: ["What tests measure", "General and specific abilities", "Heritability and environment", "The political history of testing"],
                prereqs: ["py-methods", "py-personality"]
              }
            ],
            [
              {
                id: "py-health",
                code: "PY-14",
                title: "Health psychology",
                summary: "Behavior, stress, coping, and illness.",
                about: "Health psychology studies how behavior and appraisal relate to illness and to health care. It is the basic-science neighbor of therapy in medical settings.",
                covers: ["Health behavior", "Stress and illness", "Coping", "Psychology inside medicine"],
                prereqs: ["py-emotion", "py-social"]
              },
              {
                id: "py-culture",
                code: "PY-15",
                title: "Cultural psychology",
                summary: "Variation, the self, and the problem of WEIRD samples.",
                about: "Cultural psychology asks which findings travel. A great deal of the evidence base comes from Western, educated, industrialized, rich, and democratic samples, and that is a methods problem.",
                covers: ["Universals and variation", "Models of the self", "Methods in cross-cultural work", "WEIRD samples"],
                prereqs: ["py-social", "py-methods"]
              }
            ]
          ]
        },
        {
          id: "psychology--analysis",
          title: "Psychoanalysis and depth psychology",
          summary: "Freud, the later schools, technique, and the empirical argument.",
          rows: [
            [
              {
                id: "py-freud",
                code: "PY-16",
                title: "Freud",
                summary: "Drive, structure, development, and the talking cure.",
                about: "Freud's theory changed several times. A usable reading separates the clinical observations, the models of mind, and the developmental claims that later evidence did not support.",
                covers: ["Unconscious process, repression, and drive", "Topographic and structural models", "Psychosexual development and its criticism", "Dream, symptom, and speech"],
                prereqs: ["py-history"]
              }
            ],
            [
              {
                id: "py-ego",
                code: "PY-17",
                title: "Ego psychology",
                summary: "Defense, adaptation, and Erikson's stages.",
                about: "Ego psychology shifted the emphasis from drive to defense and adaptation. It is the route by which many later clinical ideas about defense entered ordinary practice.",
                covers: ["Anna Freud and defense", "Hartmann and adaptation", "Erikson's psychosocial stages", "What was kept and what was dropped"],
                prereqs: ["py-freud"]
              },
              {
                id: "py-object",
                code: "PY-18",
                title: "Object relations",
                summary: "Klein, Winnicott, Fairbairn, and the turn toward relationship.",
                about: "Object relations theories treat relationships, not drives alone, as the material of the mind. The clinical ideas that survived are more widely used than the metaphysical systems they came from.",
                covers: ["Klein, phantasy, and positions", "Winnicott, holding, and transitional space", "Fairbairn and the turn from drive", "Ideas that entered ordinary clinical speech"],
                prereqs: ["py-freud"]
              }
            ],
            [
              {
                id: "py-relational",
                code: "PY-19",
                title: "Self psychology and relational psychoanalysis",
                summary: "Kohut, the relational turn, and the two-person model.",
                about: "Later psychoanalysis argued about whether the analyst is a blank screen or a participant. Self psychology and relational psychoanalysis are the main late-twentieth-century answers.",
                covers: ["Kohut and selfobject functions", "The relational turn", "Intersubjectivity", "One-person and two-person models"],
                prereqs: ["py-object"]
              }
            ],
            [
              {
                id: "py-jung",
                code: "PY-20",
                title: "Jung and analytical psychology",
                summary: "Complexes, archetypes, and individuation.",
                role: "elective",
                about: "Analytical psychology split from Freud and developed its own map of the psyche. Its influence outside the clinic is wider than its influence inside evidence-based services.",
                covers: ["Complexes and archetypes", "Persona, shadow, and individuation", "The break with Freud", "Influence outside the clinic"],
                prereqs: ["py-freud"]
              },
              {
                id: "py-lacan",
                code: "PY-21",
                title: "Lacan",
                summary: "Imaginary, symbolic, and real, and why the writing resists summary.",
                role: "elective",
                about: "Lacanian psychoanalysis is a major tradition in parts of Europe and Latin America and a minor one in much of Anglophone clinical training. The difficulty of the texts is intentional.",
                covers: ["Imaginary, symbolic, and real", "The mirror stage", "Language and the subject", "Where this is actually practiced"],
                prereqs: ["py-freud", "py-object"]
              }
            ],
            [
              {
                id: "py-attachment",
                code: "PY-22",
                title: "Attachment",
                summary: "Bowlby, Ainsworth, and the research program that followed.",
                role: "bridge",
                bridgeTo: "development",
                about: "Attachment theory began beside psychoanalysis and became an empirical research program. It is one of the few depth-psychological ideas with a large observational literature. The lifespan continuation is on the development path.",
                covers: ["Bowlby and Ainsworth", "Categories and later dimensional work", "Adult attachment", "What the Strange Situation does not prove"],
                prereqs: ["py-object", "py-dev"]
              }
            ],
            [
              {
                id: "py-pdm",
                code: "PY-23",
                title: "Psychodynamic diagnosis",
                summary: "Personality organization, defenses, and manuals other than the DSM.",
                about: "Psychodynamic diagnosis describes structure and defense, not only symptom lists. It is a supplement to descriptive diagnosis, not a rival code set for billing.",
                covers: ["Levels of personality organization", "Defenses in a formulation", "A descriptive style in the McWilliams tradition", "The Psychodynamic Diagnostic Manual as a supplement"],
                prereqs: ["py-freud", "py-ego", "py-object"]
              },
              {
                id: "py-technique",
                code: "PY-24",
                title: "Psychoanalytic technique",
                summary: "Frame, free association, transference, and interpretation.",
                about: "Technique varies by institute and country: frequency, use of the couch, and how active the analyst is. The shared ideas are the frame, free association, and work with transference and resistance.",
                covers: ["Frame and frequency", "Free association and attention", "Transference, resistance, and interpretation", "Differences among traditions"],
                prereqs: ["py-freud", "py-pdm"]
              }
            ],
            [
              {
                id: "py-critique",
                code: "PY-25",
                title: "Evidence and criticism",
                summary: "Outcome research, philosophical objections, and historical harms.",
                about: "Psychoanalysis has an outcome literature, a set of philosophical objections, and a record of harm, including around recovered memory. A fair reading keeps all three.",
                covers: ["Outcome research on psychodynamic therapy", "Philosophical objections", "Recovered memory and historical harms", "What a fair reading leaves standing"],
                prereqs: ["py-technique", "py-methods"]
              }
            ]
          ]
        },
        {
          id: "psychology--clinical",
          title: "From psychology to clinical work",
          summary: "Abnormal psychology, the clinical profession, and the standing arguments.",
          rows: [
            [
              {
                id: "py-abnormal",
                code: "PY-26",
                title: "Abnormal psychology",
                summary: "How the field defines disorder, at textbook scale.",
                about: "Abnormal psychology is the survey of distress and dysfunction and of the models used to explain them. It is not a treatment manual and not a diagnostic handbook.",
                covers: ["Defining disorder", "Major presentations at textbook scale", "Biological, psychological, and social models", "Continuum with ordinary experience"],
                prereqs: ["py-emotion", "py-methods"]
              }
            ],
            [
              {
                id: "py-clinical",
                code: "PY-27",
                title: "Clinical psychology as a profession",
                summary: "The scientist-practitioner model, and how the role differs from neighboring professions.",
                role: "bridge",
                bridgeTo: "psychotherapy",
                about: "Clinical psychology trains assessment, formulation, and intervention together, under a scientist-practitioner ideal that real jobs only partly match. The therapies themselves are on the psychotherapy path.",
                covers: ["The scientist-practitioner model", "Assessment, formulation, and therapy", "Psychiatry, counseling, and social work as neighboring roles", "Regulation in outline, without a single country's path"],
                prereqs: ["py-abnormal", "py-methods"]
              }
            ],
            [
              {
                id: "py-critical",
                code: "PY-28",
                title: "Critical and historical debates",
                summary: "Anti-psychiatry, construction of diagnosis, and the replication crisis.",
                about: "The field argues about whether its categories are discoveries or decisions, and about how much of its literature replicates. This map takes those arguments as part of the subject.",
                covers: ["Anti-psychiatry and its heirs", "Diagnosis as a social decision", "Replication and research practice", "What this map is not claiming"],
                prereqs: ["py-methods", "py-abnormal"]
              }
            ]
          ]
        }
      ]
    },
    {
      id: "assessment",
      title: "Assessment and evidence",
      search: "assessment psychometrics statistics evidence meta-analysis testing validity reliability scale diagnosis formulation qualitative",
      summary: "How claims are tested, how measures work, and how a clinician reads both.",
      stages: [
        {
          id: "assessment--thinking",
          title: "Thinking about evidence",
          summary: "Design, statistics, papers, and the ethics of studying people.",
          rows: [
            [
              {
                id: "as-evidence",
                code: "AS-01",
                title: "What counts as evidence",
                summary: "Claims, tests, and the kinds of mistake a method can make.",
                about: "Before a statistic there is a question about what would count against a claim. This topic is that question, kept short enough to use.",
                covers: ["Claims and their rivals", "Falsification and its limits", "Mechanisms and associations", "Clinical questions versus study questions"]
              }
            ],
            [
              {
                id: "as-design",
                code: "AS-02",
                title: "Research design",
                summary: "Experiments, observational studies, and the threats to each.",
                about: "Design decides what a result can mean. Randomization, control, blinding, and confounding are the working vocabulary.",
                covers: ["Randomized and non-randomized comparisons", "Confounding and bias", "Blinding and expectancy", "Internal and external validity of a design"],
                prereqs: ["as-evidence"]
              },
              {
                id: "as-stats",
                code: "AS-03",
                title: "Statistics for readers",
                summary: "Estimation, error, and what a p-value is not.",
                about: "A reader of clinical research needs estimation, uncertainty, and effect size more than derivations. Significance is not importance.",
                covers: ["Description and distributions", "Estimation and intervals", "Null tests and their misuse", "Effect size and clinical importance"],
                prereqs: ["as-design"]
              }
            ],
            [
              {
                id: "as-papers",
                code: "AS-04",
                title: "Reading a paper",
                summary: "A repeatable pass over methods, results, and conflicts.",
                about: "Reading a paper is a skill with a sequence: question, design, sample, analysis, result, and what the abstract claimed anyway.",
                covers: ["Question and design", "Sample and measures", "Analysis and reporting", "Conflicts, spin, and preprint versus paper"],
                prereqs: ["as-design", "as-stats"]
              },
              {
                id: "as-ethics",
                code: "AS-05",
                title: "Research ethics",
                summary: "Consent, risk, and the history that produced review boards.",
                about: "Research on people is governed because it has harmed people. Consent, risk, and the difference between treatment and research are the core.",
                covers: ["Consent and capacity to consent", "Risk and benefit", "Treatment and research", "Why review exists"],
                prereqs: ["as-evidence"]
              }
            ]
          ]
        },
        {
          id: "assessment--measurement",
          title: "Measurement",
          summary: "Reliability, validity, and the instruments clinicians actually touch.",
          rows: [
            [
              {
                id: "as-reliability",
                code: "AS-06",
                title: "Reliability",
                summary: "Consistency, error, and classical test theory.",
                about: "A measure that does not agree with itself cannot support a decision. Classical test theory is the usual language for that fact.",
                covers: ["True score and error", "Internal consistency", "Test-retest and inter-rater agreement", "What a reliability coefficient does not prove"],
                prereqs: ["as-stats"]
              },
              {
                id: "as-validity",
                code: "AS-07",
                title: "Validity",
                summary: "Whether a score means what it is used to mean.",
                about: "Validity is an argument about use, not a property stamped on a test. Content, criterion, and construct evidence answer different questions.",
                covers: ["Content, criterion, and construct evidence", "Face validity as a weak clue", "Validity for a decision", "Bias and fairness"],
                prereqs: ["as-reliability"]
              }
            ],
            [
              {
                id: "as-scales",
                code: "AS-08",
                title: "Symptom and outcome scales",
                summary: "Questionnaires used in clinics and trials.",
                about: "Symptom scales are short, fallible, and everywhere. Knowing what a cutoff was built for matters more than memorizing the items.",
                covers: ["Common families of scale", "Cutoffs and their origins", "Sensitivity to change", "Burden and misuse"],
                prereqs: ["as-validity"]
              },
              {
                id: "as-interviews",
                code: "AS-09",
                title: "Structured interviews",
                summary: "Diagnostic interviews and the gap between them and ordinary practice.",
                about: "Structured interviews trade clinical freedom for reliability. They are the reference standard in much research and a poor description of a first clinic visit.",
                covers: ["Fully and semi-structured interviews", "Reliability against clinical judgment", "Research diagnoses and clinical diagnoses", "When a structure helps"],
                prereqs: ["as-validity"]
              }
            ],
            [
              {
                id: "as-cognitive",
                code: "AS-10",
                title: "Cognitive and neuropsychological testing",
                summary: "What a battery can say about ability, and what it cannot diagnose alone.",
                role: "bridge",
                bridgeTo: "development",
                about: "Cognitive tests estimate abilities relative to norms. They do not, by themselves, name a disease. The clinical use in neurological and developmental settings continues on the development path.",
                covers: ["Norms and standardized scores", "Domains usually tested", "Effort and the limits of a score", "A test result is not a diagnosis"],
                prereqs: ["as-validity"]
              },
              {
                id: "as-inventories",
                code: "AS-11",
                title: "Personality inventories",
                summary: "Self-report trait measures and their clinical use.",
                about: "Inventories such as those built on the five-factor model describe tendencies. They are not projective depth and they are not a personality-disorder diagnosis.",
                covers: ["Self-report and its distortions", "Trait inventories", "Clinical versus personnel uses", "What a profile tempts people to say"],
                prereqs: ["as-validity"]
              }
            ],
            [
              {
                id: "as-projective",
                code: "AS-12",
                title: "Performance-based and projective measures",
                summary: "Rorschach, storytelling measures, and the argument about them.",
                about: "Projective and performance-based tests have dedicated users, scoring systems, and a long criticism that the inferences outrun the evidence. The topic is the argument, not a scoring manual.",
                covers: ["The idea of a projective method", "Standardized performance-based systems", "Reliability and validity disputes", "Where these are still used"],
                prereqs: ["as-validity"]
              },
              {
                id: "as-risk",
                code: "AS-13",
                title: "Risk instruments",
                summary: "What actuarial and structured-judgment tools can and cannot predict.",
                about: "Risk tools improve on unaided judgment in some settings and are still weak predictors of rare events. A score is not a decision about a person's liberty.",
                covers: ["Actuarial tools and structured judgment", "Base rates and rare events", "Violence and suicide instruments", "The jump from a score to a decision"],
                prereqs: ["as-validity", "as-stats"]
              }
            ]
          ]
        },
        {
          id: "assessment--use",
          title: "Using evidence",
          summary: "Reviews, hierarchies, qualitative work, and formulation.",
          rows: [
            [
              {
                id: "as-meta",
                code: "AS-14",
                title: "Systematic reviews and meta-analysis",
                summary: "How studies are pooled, and how a pool can still mislead.",
                about: "A systematic review asks a closed question and shows its search. A meta-analysis averages effects that may not have been the same effect. Both can be done badly.",
                covers: ["Systematic versus selective review", "Heterogeneity", "Publication bias", "Reading a forest plot"],
                prereqs: ["as-papers", "as-stats"]
              },
              {
                id: "as-hierarchy",
                code: "AS-15",
                title: "Evidence hierarchies",
                summary: "Pyramids, guidelines, and the criticism of both.",
                about: "Hierarchies put trials above case reports for treatment questions. They are a poor guide to questions they were not built for, including mechanism, meaning, and harm that trials exclude.",
                covers: ["What a hierarchy is for", "Guidelines and grading", "Questions trials answer badly", "Expertise and patient values in a decision"],
                prereqs: ["as-meta"]
              }
            ],
            [
              {
                id: "as-qual",
                code: "AS-16",
                title: "Qualitative methods",
                summary: "Interviews, themes, and standards of rigor that are not sample size.",
                about: "Qualitative research answers questions about meaning and process. Its standards are transparency, sufficiency, and a check on the researcher's own reading, not a p-value.",
                covers: ["Interviews and observation", "Thematic and related approaches", "What rigor means here", "Mixing methods"],
                prereqs: ["as-design"]
              },
              {
                id: "as-single",
                code: "AS-17",
                title: "Single-case and practice-based evidence",
                summary: "N-of-1 designs and learning from one's own caseload.",
                about: "A single case can be designed, measured, and interpreted. An anecdote cannot. Practice-based evidence is the attempt to learn from routine care without pretending it was a trial.",
                covers: ["Single-case designs", "Baselines and change", "Routine data", "What a caseload cannot prove"],
                prereqs: ["as-design", "as-scales"]
              }
            ],
            [
              {
                id: "as-formulation",
                code: "AS-18",
                title: "Formulation and diagnosis",
                summary: "Why a category and an explanation are different products.",
                about: "Diagnosis sorts. Formulation explains a particular case. Collapsing them produces either a label with no plan or a story with no shared language.",
                covers: ["What diagnosis is for", "What formulation is for", "Using both", "When either is being asked to do the other's job"],
                prereqs: ["as-evidence", "as-scales"]
              }
            ]
          ]
        }
      ]
    },
    {
      id: "development",
      title: "Development and context",
      search: "development child adolescent attachment culture community lifespan family forensic neuropsychology school social determinants",
      summary: "Lifespan development, families, culture, and the settings around clinical work.",
      stages: [
        {
          id: "development--lifespan",
          title: "Lifespan",
          summary: "From early development to the end of life.",
          rows: [
            [
              {
                id: "dv-early",
                code: "DV-01",
                title: "Early development",
                summary: "Prenatal factors, infancy, and the first relationships.",
                about: "Early development covers biological risk, caregiving, and the rapid change of the first years. It is the base for later topics, not a claim that everything is decided in infancy.",
                covers: ["Prenatal and perinatal factors", "Infancy and regulation", "Early communication", "What early experience does not determine"]
              }
            ],
            [
              {
                id: "dv-attachment",
                code: "DV-02",
                title: "Attachment across the lifespan",
                summary: "From infant attachment to adult relationships, without turning a category into a fate.",
                role: "bridge",
                bridgeTo: "psychology",
                about: "Attachment is observed in infancy and talked about, often too loosely, in adult clinical work. This topic keeps the observational meaning and the adult extension separate. The research origins are on the psychology path.",
                covers: ["Infant attachment patterns", "Stability and change", "Adult relationships", "Clinical overuse of the word"],
                prereqs: ["dv-early"]
              }
            ],
            [
              {
                id: "dv-child",
                code: "DV-03",
                title: "Childhood and adolescence",
                summary: "Cognitive change, peers, identity, and puberty.",
                about: "Childhood and adolescence are periods of changing capacity, not a single stage. Peers, school, puberty, and identity work all belong in a clinical picture of a young person.",
                covers: ["Cognitive and social change", "Peers and school", "Puberty", "Identity"],
                prereqs: ["dv-early"]
              },
              {
                id: "dv-ndd",
                code: "DV-04",
                title: "Neurodevelopment across the lifespan",
                summary: "ADHD, autism, and learning differences beyond the childhood clinic.",
                about: "Neurodevelopmental conditions change their presentation with age and with the demands of school, work, and relationships. Late recognition is common.",
                covers: ["Changing demands with age", "Masking and late recognition", "School, work, and relationships", "Overlap with mental health problems"],
                prereqs: ["dv-child"]
              }
            ],
            [
              {
                id: "dv-adult",
                code: "DV-05",
                title: "Adulthood, work, and relationships",
                summary: "Intimacy, work, parenting, and the middle of life.",
                about: "Adult development is less a sequence of stages than a set of roles: work, partnership, parenting, and care for one's own parents. Clinical problems often sit in those roles.",
                covers: ["Partnership and intimacy", "Work and identity", "Parenting", "Care across generations"],
                prereqs: ["dv-child"]
              },
              {
                id: "dv-aging",
                code: "DV-06",
                title: "Aging and the end of life",
                summary: "Cognitive change, loss, and dying as developmental topics.",
                about: "Aging includes ordinary cognitive change, illness, retirement, grief, and dying. Pathology is not the whole of the psychology of later life.",
                covers: ["Ordinary and pathological cognitive change", "Retirement and role loss", "Grief", "Dying and palliative contexts"],
                prereqs: ["dv-adult"]
              }
            ]
          ]
        },
        {
          id: "development--systems",
          title: "Systems and social context",
          summary: "Families, communities, determinants, culture, and identity.",
          rows: [
            [
              {
                id: "dv-family",
                code: "DV-07",
                title: "Families as systems",
                summary: "Structure, roles, and stress inside a household.",
                about: "A family is a pattern of roles and obligations, not only a source of individual history. This is the developmental and social account. The therapy is on the psychotherapy path.",
                covers: ["Structure and roles", "Boundaries and coalitions", "Stress and transition", "Chosen family and household variety"],
                prereqs: ["dv-early"]
              },
              {
                id: "dv-community",
                code: "DV-08",
                title: "Community psychology",
                summary: "Prevention, participation, and problems located outside the individual.",
                about: "Community psychology studies settings and prevention rather than only treatment of identified patients. It is a corrective to a map that would otherwise be entirely clinical.",
                covers: ["Levels of analysis", "Prevention", "Participation", "Settings as the object of change"],
                prereqs: ["dv-family"]
              }
            ],
            [
              {
                id: "dv-sdoh",
                code: "DV-09",
                title: "Social determinants of mental health",
                summary: "Poverty, housing, discrimination, and the limits of an individual treatment.",
                about: "The distribution of distress follows poverty, housing, work, discrimination, and violence. A treatment plan that ignores that is incomplete even when the treatment itself is sound.",
                covers: ["Income, work, and housing", "Discrimination and violence", "Neighborhood and access", "What an individual treatment cannot fix"],
                prereqs: ["dv-community"]
              }
            ],
            [
              {
                id: "dv-culture",
                code: "DV-10",
                title: "Culture, race, and migration",
                summary: "Idioms of distress, racism, and clinical work across language.",
                about: "Distress is described in cultural idioms, and services are not neutral with respect to race and migration. Interpreters, racism, and acculturation are clinical facts.",
                covers: ["Idioms of distress", "Racism and racial trauma", "Migration and acculturation", "Language and interpreters"],
                prereqs: ["dv-sdoh"]
              },
              {
                id: "dv-gender",
                code: "DV-11",
                title: "Gender, sexuality, and affirmative practice",
                summary: "Development of sexuality and gender, and care that does not treat identity as the illness.",
                about: "Sexuality and gender are developmental topics and clinical contexts. Affirmative practice means the identity is not the pathology. Distress, minority stress, and comorbid illness still need ordinary clinical skill.",
                covers: ["Sexual orientation and gender identity across development", "Minority stress", "What affirmative practice is", "Ordinary illness in a person with a minority identity"],
                prereqs: ["dv-child", "dv-culture"]
              }
            ]
          ]
        },
        {
          id: "development--adjacent",
          title: "Adjacent fields",
          summary: "Neuropsychology, forensic settings, applied psychology, and the professions.",
          rows: [
            [
              {
                id: "dv-neuropsych",
                code: "DV-12",
                title: "Neuropsychology",
                summary: "Brain injury, neurological disease, and the clinical use of cognitive tests.",
                role: "bridge",
                bridgeTo: "assessment",
                about: "Neuropsychology applies cognitive testing and behavioral observation to injury and disease. The measurement theory is on the assessment path. This topic is the clinical use.",
                covers: ["Injury, stroke, and neurological disease", "Domains and everyday function", "Rehabilitation in outline", "A score beside a history"],
                prereqs: ["dv-aging"]
              },
              {
                id: "dv-forensic",
                code: "DV-13",
                title: "Forensic and correctional contexts",
                summary: "The difference between treating someone and evaluating them for a legal question.",
                about: "Forensic work splits treatment from evaluation for a court or a detaining authority. The duty is not the same as in ordinary therapy. This is not legal training.",
                covers: ["Treatment and evaluation", "Whose client it is", "Risk, liberty, and reports", "Care inside secure settings"],
                prereqs: ["dv-sdoh"]
              }
            ],
            [
              {
                id: "dv-applied",
                code: "DV-14",
                title: "Educational and occupational psychology",
                summary: "Learning settings and workplaces as psychological practices.",
                about: "Not all professional psychology is clinical. Educational and occupational psychology apply assessment and intervention to schools and work.",
                covers: ["Learning and school placement", "Work, selection, and wellbeing", "Where these meet clinical referral", "What they are not"],
                prereqs: ["dv-child", "dv-adult"]
              }
            ],
            [
              {
                id: "dv-professions",
                code: "DV-15",
                title: "Professions and training paths",
                summary: "Psychiatry, clinical psychology, counseling, social work, and nursing, as roles rather than a ranking.",
                about: "The same clinical problem is approached by several professions with different training, powers, and duties. This topic is a map of those roles. It is not advice about which degree to buy, and licensing rules are local.",
                covers: ["Psychiatry and prescribing", "Clinical and counseling psychology", "Social work, nursing, and psychotherapy as a title", "Why licensing is local and not on this map"],
                prereqs: ["dv-community"]
              }
            ]
          ]
        }
      ]
    }
  ]
};
