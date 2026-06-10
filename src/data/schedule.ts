export type StudyTask = {
  id: string;
  text: string;
  plannedHours: number;
};

export type StudyDay = {
  id: string;
  dayNumber: number;
  isoDate: string;
  displayDate: string;
  weekday: string;
  topic: string;
  phaseId: string;
  tasks: StudyTask[];
};

export type StudyPhase = {
  id: string;
  name: string;
  ledgerName: string;
  plannedHours: number;
  days: StudyDay[];
};

const task = (dayId: string, taskIndex: number, text: string, plannedHours: number): StudyTask => ({
  id: `${dayId}-t${taskIndex + 1}`,
  text,
  plannedHours,
});

const day = (
  phaseId: string,
  dayNumber: number,
  isoDate: string,
  displayDate: string,
  weekday: string,
  topic: string,
  tasks: Array<[string, number]>,
): StudyDay => {
  const id = `d${dayNumber}`;

  return {
    id,
    dayNumber,
    isoDate,
    displayDate,
    weekday,
    topic,
    phaseId,
    tasks: tasks.map(([text, plannedHours], index) => task(id, index, text, plannedHours)),
  };
};

export const SCHEDULE: StudyPhase[] = [
  {
    id: "p1",
    name: "P1 · Revenue, Leases & Tax",
    ledgerName: "Revenue, leases & tax",
    plannedHours: 40,
    days: [
      day("p1", 1, "2026-06-10", "10 Jun", "Wed", "Ind AS 115 — Steps 1–3", [
        ["Read Steps 1–3: contract, performance obligations", 2.5],
        ["Solve 4 basic module questions", 1.5],
      ]),
      day("p1", 2, "2026-06-11", "11 Jun", "Thu", "Ind AS 115 — Steps 4–5", [
        ["Transaction price, variable consideration, allocation", 2],
        ["Solve 6 module questions", 2],
      ]),
      day("p1", 3, "2026-06-12", "12 Jun", "Fri", "Ind AS 115 — special areas", [
        ["Modifications & contract costs", 1.5],
        ["Principal vs agent, licences, warranties", 1],
        ["Solve 5 questions", 1.5],
      ]),
      day("p1", 4, "2026-06-13", "13 Jun", "Sat", "115 question day + 116 start", [
        ["10 mixed Ind AS 115 questions", 2],
        ["115 summary note (1 page)", 0.5],
        ["Ind AS 116: identifying a lease", 1.5],
      ]),
      day("p1", 5, "2026-06-14", "14 Jun", "Sun", "Ind AS 116 — full coverage", [
        ["Lessee: ROU asset & liability, initial + subsequent", 2.5],
        ["Remeasurement & modifications", 1.5],
        ["Lessor classification", 1.5],
        ["Sale & leaseback", 1.5],
        ["Solve 4 questions", 1],
      ]),
      day("p1", 6, "2026-06-15", "15 Jun", "Mon", "Ind AS 116 — question day", [
        ["8 module questions", 3],
        ["116 summary note", 1],
      ]),
      day("p1", 7, "2026-06-16", "16 Jun", "Tue", "Ind AS 12 — concepts", [
        ["Tax base, DTA/DTL recognition", 2],
        ["Special items: revaluation, BC, consolidation", 1],
        ["3 basic questions", 1],
      ]),
      day("p1", 8, "2026-06-17", "17 Jun", "Wed", "Ind AS 12 close + Ind AS 113", [
        ["6 module questions on Ind AS 12", 2.5],
        ["Ind AS 113: FV hierarchy & techniques", 1.5],
      ]),
      day("p1", 9, "2026-06-18", "18 Jun", "Thu", "Ind AS 21", [
        ["Functional currency & foreign transactions", 1.5],
        ["Translation of foreign operations", 1],
        ["Solve 5 questions", 1.5],
      ]),
    ],
  },
  {
    id: "p2",
    name: "P2 · Presentation & Small Standards",
    ledgerName: "Presentation & small standards",
    plannedHours: 8,
    days: [
      day("p2", 10, "2026-06-19", "19 Jun", "Fri", "Ind AS 1, 34, 8", [
        ["Ind AS 1: presentation of FS", 1.5],
        ["Ind AS 34: interim reporting", 1],
        ["Ind AS 8: policies, estimates, errors", 1.5],
      ]),
      day("p2", 11, "2026-06-20", "20 Jun", "Sat", "Ind AS 37, 10, 7", [
        ["Ind AS 37: provisions + questions", 2.5],
        ["Ind AS 10: events after reporting period", 1],
        ["Ind AS 7: quick pass (known from Inter)", 0.5],
      ]),
    ],
  },
  {
    id: "p3",
    name: "P3 · Financial Instruments",
    ledgerName: "Financial instruments",
    plannedHours: 40,
    days: [
      day("p3", 12, "2026-06-21", "21 Jun", "Sun", "Ind AS 32 + 109 classification", [
        ["Ind AS 32: liability vs equity tests", 2],
        ["Compound instruments + questions", 2.5],
        ["Ind AS 109: business model & SPPI", 2.5],
        ["Classification worked examples", 1],
      ]),
      day("p3", 13, "2026-06-22", "22 Jun", "Mon", "EIR & amortised cost", [
        ["EIR concept & schedule building", 1.5],
        ["Solve 5 EIR questions", 2.5],
      ]),
      day("p3", 14, "2026-06-23", "23 Jun", "Tue", "FVTPL / FVOCI", [
        ["FVTPL & FVOCI measurement + reclassification", 2],
        ["Solve 5 questions", 2],
      ]),
      day("p3", 15, "2026-06-24", "24 Jun", "Wed", "Derecognition", [
        ["Derecognition: financial assets & liabilities", 2],
        ["Solve 4 questions", 2],
      ]),
      day("p3", 16, "2026-06-25", "25 Jun", "Thu", "ECL impairment", [
        ["Expected credit loss model", 2],
        ["Solve 4 questions", 2],
      ]),
      day("p3", 17, "2026-06-26", "26 Jun", "Fri", "Derivatives", [
        ["Derivatives & embedded derivatives", 2.5],
        ["Solve 3 questions", 1.5],
      ]),
      day("p3", 18, "2026-06-27", "27 Jun", "Sat", "Hedge accounting — concepts", [
        ["FV, cash flow & net investment hedges", 3],
        ["2 simple hedge questions", 1],
      ]),
      day("p3", 19, "2026-06-28", "28 Jun", "Sun", "Hedge Qs + FI marathon", [
        ["Hedge accounting questions", 3],
        ["Ind AS 107 disclosures", 1],
        ["Mixed FI marathon — 12 questions", 3],
        ["FI summary chart (1 page)", 1],
      ]),
    ],
  },
  {
    id: "p4",
    name: "P4 · Business Combination & Consolidation",
    ledgerName: "Business combination & consolidation",
    plannedHours: 40,
    days: [
      day("p4", 20, "2026-06-29", "29 Jun", "Mon", "Ind AS 103 — acquisition method", [
        ["Acquisition method, goodwill, NCI options", 2.5],
        ["Solve 4 questions", 1.5],
      ]),
      day("p4", 21, "2026-06-30", "30 Jun", "Tue", "Ind AS 103 — advanced I", [
        ["Contingent consideration & step acquisition", 2],
        ["Solve 4 questions", 2],
      ]),
      day("p4", 22, "2026-07-01", "01 Jul", "Wed", "Ind AS 103 — advanced II", [
        ["Reverse acquisition & common control", 2],
        ["Solve 4 questions + 103 summary note", 2],
      ]),
      day("p4", 23, "2026-07-02", "02 Jul", "Thu", "Ind AS 110 — control & CFS setup", [
        ["Control assessment framework", 1.5],
        ["CFS mechanics: standard workings format", 2.5],
      ]),
      day("p4", 24, "2026-07-03", "03 Jul", "Fri", "CFS — NCI", [
        ["NCI & pre/post-acquisition profits", 1.5],
        ["Solve 2 full problems", 2.5],
      ]),
      day("p4", 25, "2026-07-04", "04 Jul", "Sat", "CFS — eliminations", [
        ["Intra-group transactions & unrealised profits", 1.5],
        ["Solve 2 full problems", 2.5],
      ]),
      day("p4", 26, "2026-07-05", "05 Jul", "Sun", "Chain holdings + Associates/JVs", [
        ["Chain & cross holdings", 2.5],
        ["Ind AS 28/111: equity method", 2.5],
        ["2 full CFS problems", 3],
      ]),
      day("p4", 27, "2026-07-06", "06 Jul", "Mon", "Loss of control + Ind AS 112", [
        ["Disposal & loss of control", 2],
        ["Ind AS 112 + questions", 2],
      ]),
      day("p4", 28, "2026-07-07", "07 Jul", "Tue", "Consolidation drill", [
        ["2 full mixed problems (timed)", 3.5],
        ["Consolidation summary note", 0.5],
      ]),
    ],
  },
  {
    id: "p5",
    name: "P5 · Asset Standards & Balance Topics",
    ledgerName: "Asset standards & balance topics",
    plannedHours: 40,
    days: [
      day("p5", 29, "2026-07-08", "08 Jul", "Wed", "Ind AS 16 + 23", [
        ["Ind AS 16: PPE + questions", 2.5],
        ["Ind AS 23: borrowing costs + questions", 1.5],
      ]),
      day("p5", 30, "2026-07-09", "09 Jul", "Thu", "Ind AS 36", [
        ["Impairment: CGU, value in use, goodwill", 2.5],
        ["Solve 3 questions", 1.5],
      ]),
      day("p5", 31, "2026-07-10", "10 Jul", "Fri", "Ind AS 38, 40, 105", [
        ["Ind AS 38: intangibles", 2],
        ["Ind AS 40: investment property", 1],
        ["Ind AS 105: held for sale", 1],
      ]),
      day("p5", 32, "2026-07-11", "11 Jul", "Sat", "Ind AS 20, 41, 24", [
        ["Ind AS 20: government grants", 1.5],
        ["Ind AS 41: agriculture", 1],
        ["Ind AS 24: related parties", 1.5],
      ]),
      day("p5", 33, "2026-07-12", "12 Jul", "Sun", "Ind AS 19 + 102", [
        ["Ind AS 19: DB plans, OCI routing + questions", 3.5],
        ["Ind AS 102: equity & cash settled + questions", 3.5],
        ["Recap notes for both", 1],
      ]),
      day("p5", 34, "2026-07-13", "13 Jul", "Mon", "Ind AS 33 — EPS", [
        ["Basic EPS + adjustments", 1.5],
        ["Diluted EPS + questions", 2.5],
      ]),
      day("p5", 35, "2026-07-14", "14 Jul", "Tue", "Ind AS 108 + 101", [
        ["Ind AS 108: operating segments", 1.5],
        ["Ind AS 101: first-time adoption + questions", 2.5],
      ]),
      day("p5", 36, "2026-07-15", "15 Jul", "Wed", "Theory chapters I", [
        ["Analysis of Financial Statements", 2.5],
        ["Accounting & Technology", 1.5],
      ]),
      day("p5", 37, "2026-07-16", "16 Jul", "Thu", "Theory II + buffer", [
        ["Professional & Ethical Duty of a CA", 2],
        ["Backlog clearance buffer", 2],
      ]),
    ],
  },
  {
    id: "p6",
    name: "P6 · Revision, RTP/MTP & Mock",
    ledgerName: "Revision, RTP/MTP & mock",
    plannedHours: 36,
    days: [
      day("p6", 38, "2026-07-17", "17 Jul", "Fri", "Revise P1 + RTP", [
        ["Revise 115/116/12 summary notes", 2],
        ["RTP — part 1", 2],
      ]),
      day("p6", 39, "2026-07-18", "18 Jul", "Sat", "Revise FI + RTP", [
        ["Revise FI summary chart + weak areas", 2],
        ["RTP — part 2", 2],
      ]),
      day("p6", 40, "2026-07-19", "19 Jul", "Sun", "Consol revision + MTP-I", [
        ["Re-solve 2 consolidation problems", 4],
        ["MTP-I FR paper", 3],
        ["Review vs suggested answers", 1],
      ]),
      day("p6", 41, "2026-07-20", "20 Jul", "Mon", "Revise P5 + error log", [
        ["Revise asset standards + 19/102 notes", 2.5],
        ["Error-log review", 1.5],
      ]),
      day("p6", 42, "2026-07-21", "21 Jul", "Tue", "MTP-II", [
        ["MTP-II FR questions", 3],
        ["Review vs suggested answers", 1],
      ]),
      day("p6", 43, "2026-07-22", "22 Jul", "Wed", "EPS, 101 & theory revision", [
        ["Revise Ind AS 33 & 101", 2],
        ["Revise theory chapters", 2],
      ]),
      day("p6", 44, "2026-07-23", "23 Jul", "Thu", "Weak-area drill", [
        ["Targeted drill from error log", 4],
      ]),
      day("p6", 45, "2026-07-24", "24 Jul", "Fri", "Mock day", [
        ["3-hr timed mock (latest paper)", 3],
        ["Evaluate vs suggested answers", 1],
      ]),
    ],
  },
];

export const ALL_DAYS = SCHEDULE.flatMap((phase) => phase.days);
export const START_DATE = "2026-06-10";
export const TARGET_DATE = "2026-07-24";
export const TOTAL_DAYS = ALL_DAYS.length;
export const TOTAL_PLANNED_HOURS = ALL_DAYS.reduce(
  (total, studyDay) => total + studyDay.tasks.reduce((sum, item) => sum + item.plannedHours, 0),
  0,
);

export const dayPlannedHours = (studyDay: StudyDay) =>
  studyDay.tasks.reduce((sum, item) => sum + item.plannedHours, 0);
