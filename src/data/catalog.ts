import type { LucideIcon } from "lucide-react";
import { BookOpen, Brain, Calculator, FileText, Gauge, LibraryBig, Route, Target } from "lucide-react";

export type StudyStatus = "Live" | "Dashboard" | "Planned" | "Source Ready";

export type ChapterAsset = {
  id: string;
  title: string;
  subtitle: string;
  subject: string;
  unit: string;
  status: StudyStatus;
  readiness: number;
  tone: "cap" | "exp" | "gold" | "ink";
  href?: string;
  sourceFile?: string;
  tags: string[];
  summary: string;
  sections: Array<{
    id: string;
    title: string;
    summary: string;
    rules: string[];
    traps: string[];
  }>;
  practice: Array<{
    id: string;
    title: string;
    type: string;
    difficulty: string;
    question: string;
    modelAnswer: string;
    topic: string;
  }>;
};

export type SubjectGroup = {
  id: string;
  code: string;
  name: string;
  group: string;
  readiness: number;
  chapters: ChapterAsset[];
};

export const chapters: ChapterAsset[] = [
  {
    id: "fr-ind-as-23",
    title: "Ind AS 23",
    subtitle: "Borrowing Costs",
    subject: "FR",
    unit: "Chapter 6 Unit 3",
    status: "Live",
    readiness: 42,
    tone: "cap",
    href: "content/Ind_AS_23_Borrowing_Costs_Dashboard_polished.html",
    sourceFile:
      "CA_Final_May_2027_Command_Center/ICAI_Materials_Text/01_FR_Financial_Reporting/012 - Unit 3- Ind AS 23 - Borrowing Costs - 74894bos60524-cp6-u3.txt",
    tags: ["capitalisation", "qualifying asset", "forex", "specific/general borrowing"],
    summary:
      "A decision-led chapter workspace for deciding whether borrowing costs are capitalised or expensed, with calculators, TYK-style cases, and traps.",
    sections: [
      {
        id: "indas23-core",
        title: "Core Capitalisation Principle",
        summary:
          "Borrowing costs directly attributable to acquisition, construction, or production of a qualifying asset are capitalised; other borrowing costs are expensed.",
        rules: [
          "The avoidable-cost test drives most judgement questions.",
          "Capitalisation is mandatory once a qualifying asset and eligible borrowing costs exist.",
          "Capitalised borrowing costs cannot exceed actual borrowing costs incurred.",
        ],
        traps: ["Treating cost of equity as borrowing cost", "Capitalising notional interest on own funds"],
      },
      {
        id: "indas23-period",
        title: "Commence, Suspend, Cease",
        summary:
          "Capitalisation starts only when expenditure, borrowing costs, and necessary activities are all present; it stops when the asset is substantially ready.",
        rules: [
          "Use the latest of the three commencement conditions.",
          "Suspend during extended interruptions in active development.",
          "Cease at readiness, not when the asset starts earning revenue.",
        ],
        traps: ["Continuing capitalisation because only part of a complex is rented", "Missing pre-construction technical work"],
      },
      {
        id: "indas23-computation",
        title: "Specific vs General Borrowings",
        summary:
          "Specific borrowings use actual cost less temporary investment income. General borrowings use weighted-average rate times eligible expenditure.",
        rules: [
          "Specific loans stay out of the general pool until the related asset is complete.",
          "General borrowing rate is a weighted-average borrowing cost rate.",
          "Progress payments and grants reduce the expenditure base.",
        ],
        traps: ["Including specific borrowings too early", "Forgetting the actual-cost ceiling"],
      },
    ],
    practice: [
      {
        id: "indas23-drill-forex",
        title: "Foreign Currency Borrowing Cap",
        type: "Computation Drill",
        difficulty: "Advanced",
        topic: "Forex difference",
        question:
          "A foreign-currency loan saves interest versus functional-currency borrowing, but creates exchange loss. How much exchange difference can be treated as borrowing cost?",
        modelAnswer:
          "Eligible exchange difference is limited to the lower of the exchange loss and the interest saving compared with the functional-currency benchmark. Any excess exchange loss is expensed.",
      },
      {
        id: "indas23-drill-cease",
        title: "Ready but Not Fully Occupied",
        type: "Exam Trap",
        difficulty: "Moderate",
        topic: "Cessation",
        question:
          "A commercial complex is ready for use on 31 May, but only 10% is rented by year-end. Up to what date are borrowing costs capitalised?",
        modelAnswer:
          "Capitalisation ceases on 31 May, when the complex is substantially ready for intended use. Occupancy level after readiness is irrelevant.",
      },
    ],
  },
  {
    id: "fr-ind-as-109-u2",
    title: "Ind AS 109 Unit 2",
    subtitle: "Classification and Measurement",
    subject: "FR",
    unit: "Chapter 11 Unit 2",
    status: "Dashboard",
    readiness: 30,
    tone: "gold",
    href: "content/ind_as_109_unit2_dashboard.html",
    sourceFile:
      "CA_Final_May_2027_Command_Center/ICAI_Materials_Text/01_FR_Financial_Reporting/029 - Unit 2- Classification and Measurement of Financial Assets and Financial Liabilities - 74911bos60524-cp11-u2.txt",
    tags: ["SPPI", "business model", "EIR", "ECL", "liability modification"],
    summary:
      "Financial instrument classification and measurement workspace with a mature AI tutor pattern and practice-card design.",
    sections: [
      {
        id: "indas109-bm",
        title: "Business Model",
        summary: "Classification begins with how financial assets are managed at portfolio level.",
        rules: ["Hold to collect tolerates credit deterioration sales", "Collect-and-sell has both cash collection and sale as integral objectives"],
        traps: ["Judging business model one instrument at a time"],
      },
      {
        id: "indas109-sppi",
        title: "SPPI Test",
        summary: "Cash flows must be solely payments of principal and interest on principal outstanding.",
        rules: ["Equity/commodity/index upside usually fails SPPI", "Debt that fails SPPI goes to FVTPL"],
        traps: ["Letting business model rescue an SPPI failure"],
      },
    ],
    practice: [
      {
        id: "indas109-sppi-equity-index",
        title: "Equity-Linked Return",
        type: "Concept Drill",
        difficulty: "Moderate",
        topic: "SPPI",
        question: "A debt instrument pays principal plus return linked to an equity index. Classify the asset.",
        modelAnswer: "It fails SPPI because the return is exposed to equity price risk, so it is measured at FVTPL.",
      },
    ],
  },
  {
    id: "fr-ind-as-115",
    title: "Ind AS 115",
    subtitle: "Revenue from Contracts with Customers",
    subject: "FR",
    unit: "Chapter 5",
    status: "Dashboard",
    readiness: 28,
    tone: "exp",
    href: "content/ind_as_115_dashboard.html",
    tags: ["5-step model", "variable consideration", "principal-agent", "contract costs"],
    summary: "Revenue recognition dashboard for the five-step model and special areas.",
    sections: [],
    practice: [],
  },
  {
    id: "fr-consolidation",
    title: "Consolidation",
    subtitle: "Ind AS 110 / 111 / 27 / 28",
    subject: "FR",
    unit: "Chapter 13",
    status: "Planned",
    readiness: 0,
    tone: "ink",
    tags: ["subsidiary", "associate", "joint arrangement", "NCI"],
    summary: "Planned migration target for full consolidation workings and mixed problems.",
    sections: [],
    practice: [],
  },
];

export const subjects: SubjectGroup[] = [
  {
    id: "fr",
    code: "FR",
    name: "Financial Reporting",
    group: "Group I",
    readiness: Math.round(chapters.reduce((sum, chapter) => sum + chapter.readiness, 0) / chapters.length),
    chapters,
  },
  {
    id: "afm",
    code: "AFM",
    name: "Advanced Financial Management",
    group: "Group I",
    readiness: 6,
    chapters: [],
  },
  {
    id: "audit",
    code: "Audit",
    name: "Advanced Audit",
    group: "Group I",
    readiness: 0,
    chapters: [],
  },
  {
    id: "dt",
    code: "DT",
    name: "Direct Tax",
    group: "Group II",
    readiness: 0,
    chapters: [],
  },
  {
    id: "idt",
    code: "IDT",
    name: "Indirect Tax",
    group: "Group II",
    readiness: 0,
    chapters: [],
  },
  {
    id: "spom",
    code: "SPOM",
    name: "Self-Paced Online Modules",
    group: "SPOM",
    readiness: 0,
    chapters: [],
  },
];

export const workflowCards: Array<{
  icon: LucideIcon;
  label: string;
  title: string;
  body: string;
}> = [
  {
    icon: Route,
    label: "Path",
    title: "Start from the syllabus, not the panic",
    body: "Home shows the whole field first. Then you enter the exact chapter workspace you need.",
  },
  {
    icon: Brain,
    label: "AI",
    title: "Ask from context",
    body: "Every Ask AI action sends chapter, section, rules, traps, and model answer context to the tutor.",
  },
  {
    icon: Calculator,
    label: "Numbers",
    title: "Keep computation chapters tactile",
    body: "Borrowing-cost, EIR, modification, and other calculation-heavy chapters should keep calculators close to practice.",
  },
  {
    icon: Target,
    label: "Exam",
    title: "Mistakes become revision targets",
    body: "The ledger, weak areas, and chapter practice should eventually share one revision queue.",
  },
];

export const quickLinks = [
  { icon: LibraryBig, label: "Library", target: "library" },
  { icon: BookOpen, label: "Chapter", target: "chapter" },
  { icon: Gauge, label: "Ledger", target: "ledger" },
  { icon: FileText, label: "Vault", target: "data" },
] as const;
