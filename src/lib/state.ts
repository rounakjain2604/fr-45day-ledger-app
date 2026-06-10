import { ALL_DAYS, dayPlannedHours } from "../data/schedule";

export const STORAGE_KEY = "fr45-ledger-app-v1";
export const LEGACY_KEY = "fr45-tracker-v2";
export const STATE_VERSION = 1;

export type ThemeMode = "dark" | "light";
export type MistakeTag = "concept gap" | "silly error" | "presentation";

export type MistakeEntry = {
  id: string;
  dayId: string;
  tag: MistakeTag;
  text: string;
  createdAt: string;
};

export type MockAttempt = {
  id: string;
  date: string;
  paper: string;
  score: number;
  maxScore: number;
  weakChapters: string;
};

export type RescheduleLogEntry = {
  id: string;
  dayId: string;
  movedAt: string;
  note: string;
};

export type TimerPrefs = {
  selectedMinutes: 25 | 50;
  sessionsByDate: Record<string, number>;
};

export type RevisionFlag = {
  flagged: boolean;
  lastTouchedIso: string;
};

export type LedgerState = {
  version: typeof STATE_VERSION;
  theme: ThemeMode;
  checkedTasks: Record<string, boolean>;
  actualHours: Record<string, number>;
  closedDays: Record<string, boolean>;
  notes: Record<string, string>;
  mistakes: MistakeEntry[];
  revisionFlags: Record<string, RevisionFlag>;
  mockAttempts: MockAttempt[];
  rescheduleOffsets: Record<string, number>;
  rescheduleLog: RescheduleLogEntry[];
  timer: TimerPrefs;
  lastBackupAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const nowIso = () => new Date().toISOString();

export const createInitialState = (): LedgerState => {
  const now = nowIso();

  return {
    version: STATE_VERSION,
    theme: "dark",
    checkedTasks: {},
    actualHours: {},
    closedDays: {},
    notes: {},
    mistakes: [],
    revisionFlags: {},
    mockAttempts: [],
    rescheduleOffsets: {},
    rescheduleLog: [],
    timer: {
      selectedMinutes: 25,
      sessionsByDate: {},
    },
    lastBackupAt: null,
    createdAt: now,
    updatedAt: now,
  };
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asNumberRecord = (value: unknown): Record<string, number> => {
  if (!isObject(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]))
      .map(([key, numberValue]) => [key, Math.max(0, Math.round(numberValue * 2) / 2)]),
  );
};

const asStringRecord = (value: unknown): Record<string, string> => {
  if (!isObject(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
};

const asBooleanRecord = (value: unknown): Record<string, boolean> => {
  if (!isObject(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"),
  );
};

const migrateLegacyTaskState = (tasks: unknown, notes: unknown): LedgerState => {
  const state = createInitialState();
  const legacyTasks = isObject(tasks) ? tasks : {};

  ALL_DAYS.forEach((studyDay, dayIndex) => {
    const legacyDay = legacyTasks[String(dayIndex)];
    if (!Array.isArray(legacyDay)) return;

    let postedHours = 0;
    studyDay.tasks.forEach((studyTask, taskIndex) => {
      if (legacyDay[taskIndex] === true) {
        state.checkedTasks[studyTask.id] = true;
        postedHours += studyTask.plannedHours;
      }
    });

    if (postedHours > 0) {
      state.actualHours[studyDay.id] = Math.round(postedHours * 2) / 2;
    }

    if (postedHours >= dayPlannedHours(studyDay) && studyDay.tasks.every((studyTask) => state.checkedTasks[studyTask.id])) {
      state.closedDays[studyDay.id] = true;
    }
  });

  state.notes = asStringRecord(notes);
  state.updatedAt = nowIso();
  return state;
};

export const normalizeImportedState = (raw: unknown): LedgerState => {
  if (!isObject(raw)) {
    return createInitialState();
  }

  if (raw.version === STATE_VERSION) {
    const base = createInitialState();

    return {
      ...base,
      ...raw,
      version: STATE_VERSION,
      theme: raw.theme === "light" ? "light" : "dark",
      checkedTasks: asBooleanRecord(raw.checkedTasks),
      actualHours: asNumberRecord(raw.actualHours),
      closedDays: asBooleanRecord(raw.closedDays),
      notes: asStringRecord(raw.notes),
      mistakes: Array.isArray(raw.mistakes) ? (raw.mistakes as MistakeEntry[]) : [],
      revisionFlags: isObject(raw.revisionFlags) ? (raw.revisionFlags as Record<string, RevisionFlag>) : {},
      mockAttempts: Array.isArray(raw.mockAttempts) ? (raw.mockAttempts as MockAttempt[]) : [],
      rescheduleOffsets: asNumberRecord(raw.rescheduleOffsets),
      rescheduleLog: Array.isArray(raw.rescheduleLog) ? (raw.rescheduleLog as RescheduleLogEntry[]) : [],
      timer: {
        selectedMinutes: raw.timer && isObject(raw.timer) && raw.timer.selectedMinutes === 50 ? 50 : 25,
        sessionsByDate:
          raw.timer && isObject(raw.timer) ? asNumberRecord(raw.timer.sessionsByDate) : base.timer.sessionsByDate,
      },
      lastBackupAt: typeof raw.lastBackupAt === "string" ? raw.lastBackupAt : null,
      updatedAt: nowIso(),
    };
  }

  if ("tasks" in raw || "notes" in raw) {
    return migrateLegacyTaskState(raw.tasks, raw.notes);
  }

  return migrateLegacyTaskState(raw, {});
};

export const loadLedgerState = (): LedgerState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeImportedState(JSON.parse(raw));

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) return normalizeImportedState(JSON.parse(legacy));
  } catch {
    return createInitialState();
  }

  return createInitialState();
};

export const saveLedgerState = (state: LedgerState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, updatedAt: nowIso() }));
};

export const parseBackupText = (backupText: string): LedgerState => normalizeImportedState(JSON.parse(backupText));

export const serializeBackup = (state: LedgerState) =>
  JSON.stringify({ ...state, lastBackupAt: nowIso(), updatedAt: nowIso() }, null, 2);
