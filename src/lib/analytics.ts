import { ALL_DAYS, SCHEDULE, START_DATE, TARGET_DATE, TOTAL_PLANNED_HOURS, dayPlannedHours } from "../data/schedule";
import type { LedgerState, MistakeTag } from "./state";

export type DayStatus = "closed" | "part-posted" | "pending" | "upcoming";

export type DayLedger = {
  dayId: string;
  dayNumber: number;
  plannedDate: string;
  effectiveDate: string;
  plannedHours: number;
  actualHours: number;
  taskCount: number;
  checkedCount: number;
  status: DayStatus;
};

export type LedgerMetrics = {
  totalActual: number;
  totalPlanned: number;
  closedDays: number;
  progressPct: number;
  expectedToDate: number;
  varianceHours: number;
  varianceDays: number;
  requiredDailyHours: number;
  projectedCompletionDate: string | null;
  daysRemaining: number;
  currentStreak: number;
  bestStreak: number;
};

export type BurnUpPoint = {
  date: string;
  planned: number;
  actual: number;
};

export type TrialBalance = {
  range: string;
  planned: number;
  actual: number;
  closed: number;
  totalDays: number;
  nextWeekLoad: number;
  topTags: string[];
};

export const toLocalDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const addDays = (iso: string, days: number) => {
  const date = toLocalDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};

export const dayDifference = (fromIso: string, toIso: string) =>
  Math.round((toLocalDate(toIso).getTime() - toLocalDate(fromIso).getTime()) / 86_400_000);

export const formatHours = (hours: number) => `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;

export const displayDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(toLocalDate(iso));

export const displayDateWithYear = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(toLocalDate(iso));

export const weekday = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(toLocalDate(iso));

export const todayIso = () => toIsoDate(new Date());

export const getEffectiveDate = (dayId: string, state: LedgerState) => {
  const dayEntry = ALL_DAYS.find((studyDay) => studyDay.id === dayId);
  return addDays(dayEntry?.isoDate ?? START_DATE, state.rescheduleOffsets[dayId] ?? 0);
};

export const getDayLedger = (state: LedgerState, currentIso = todayIso()): DayLedger[] =>
  ALL_DAYS.map((studyDay) => {
    const actualHours = state.actualHours[studyDay.id] ?? 0;
    const checkedCount = studyDay.tasks.filter((studyTask) => state.checkedTasks[studyTask.id]).length;
    const plannedHours = dayPlannedHours(studyDay);
    const effectiveDate = getEffectiveDate(studyDay.id, state);
    const closedByTasks = checkedCount === studyDay.tasks.length && state.closedDays[studyDay.id] === true;
    const status: DayStatus = closedByTasks
      ? "closed"
      : actualHours > 0 || checkedCount > 0
        ? "part-posted"
        : dayDifference(effectiveDate, currentIso) > 0
          ? "upcoming"
          : "pending";

    return {
      dayId: studyDay.id,
      dayNumber: studyDay.dayNumber,
      plannedDate: studyDay.isoDate,
      effectiveDate,
      plannedHours,
      actualHours,
      taskCount: studyDay.tasks.length,
      checkedCount,
      status,
    };
  });

export const getActiveDay = (state: LedgerState, currentIso = todayIso()) => {
  const ledgers = getDayLedger(state, currentIso);
  const exactToday = ledgers.find((entry) => entry.effectiveDate === currentIso);
  if (exactToday) return ALL_DAYS.find((studyDay) => studyDay.id === exactToday.dayId) ?? ALL_DAYS[0];

  const firstOpen = ledgers.find((entry) => entry.status !== "closed");
  return ALL_DAYS.find((studyDay) => studyDay.id === firstOpen?.dayId) ?? ALL_DAYS[ALL_DAYS.length - 1];
};

export const getMetrics = (state: LedgerState, currentIso = todayIso()): LedgerMetrics => {
  const ledgers = getDayLedger(state, currentIso);
  const totalActual = ledgers.reduce((sum, item) => sum + item.actualHours, 0);
  const closedDays = ledgers.filter((item) => item.status === "closed").length;
  const expectedToDate = ledgers
    .filter((item) => dayDifference(item.effectiveDate, currentIso) > 0)
    .reduce((sum, item) => sum + item.plannedHours, 0);
  const varianceHours = Math.round((totalActual - expectedToDate) * 2) / 2;
  const averageDay = TOTAL_PLANNED_HOURS / ALL_DAYS.length;
  const varianceDays = Math.round((varianceHours / averageDay) * 10) / 10;
  const daysRemaining = Math.max(0, dayDifference(currentIso, TARGET_DATE) + 1);
  const remainingHours = Math.max(0, TOTAL_PLANNED_HOURS - totalActual);
  const requiredDailyHours = daysRemaining > 0 ? Math.round((remainingHours / daysRemaining) * 10) / 10 : remainingHours;
  const elapsedDays = Math.max(1, dayDifference(START_DATE, currentIso) + 1);
  const pace = totalActual / elapsedDays;
  const projectedCompletionDate = pace > 0 ? addDays(START_DATE, Math.ceil(TOTAL_PLANNED_HOURS / pace) - 1) : null;

  let currentStreak = 0;
  let bestStreak = 0;
  let running = 0;
  const sorted = [...ledgers].sort((left, right) => dayDifference(right.effectiveDate, left.effectiveDate));

  sorted.forEach((entry) => {
    if (entry.status === "closed") {
      running += 1;
      bestStreak = Math.max(bestStreak, running);
    } else {
      running = 0;
    }
  });

  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    if (dayDifference(sorted[index].effectiveDate, currentIso) < 0) continue;
    if (sorted[index].status === "closed") currentStreak += 1;
    else if (sorted[index].status !== "upcoming") break;
  }

  return {
    totalActual: Math.round(totalActual * 2) / 2,
    totalPlanned: TOTAL_PLANNED_HOURS,
    closedDays,
    progressPct: Math.round((totalActual / TOTAL_PLANNED_HOURS) * 100),
    expectedToDate,
    varianceHours,
    varianceDays,
    requiredDailyHours,
    projectedCompletionDate,
    daysRemaining,
    currentStreak,
    bestStreak,
  };
};

export const getBurnUpData = (state: LedgerState): BurnUpPoint[] => {
  const ledgers = getDayLedger(state);
  let planned = 0;
  let actual = 0;

  return ledgers.map((entry) => {
    planned += entry.plannedHours;
    actual += entry.actualHours;

    return {
      date: displayDate(entry.effectiveDate),
      planned: Math.round(planned * 2) / 2,
      actual: Math.round(actual * 2) / 2,
    };
  });
};

export const carryForwardFromDay = (state: LedgerState, dayId: string): LedgerState => {
  const selectedIndex = ALL_DAYS.findIndex((studyDay) => studyDay.id === dayId);
  if (selectedIndex < 0) return state;

  const nextOffsets = { ...state.rescheduleOffsets };
  ALL_DAYS.slice(selectedIndex).forEach((studyDay) => {
    if (!state.closedDays[studyDay.id]) {
      nextOffsets[studyDay.id] = (nextOffsets[studyDay.id] ?? 0) + 1;
    }
  });

  return {
    ...state,
    rescheduleOffsets: nextOffsets,
    rescheduleLog: [
      ...state.rescheduleLog,
      {
        id: crypto.randomUUID(),
        dayId,
        movedAt: new Date().toISOString(),
        note: "Balance carried forward by one day",
      },
    ],
  };
};

export const getTrialBalance = (state: LedgerState, currentIso = todayIso()): TrialBalance => {
  const currentDate = toLocalDate(currentIso);
  const dayOfWeek = currentDate.getDay();
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - dayOfWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startIso = toIsoDate(weekStart);
  const endIso = toIsoDate(weekEnd);
  const ledgers = getDayLedger(state, currentIso).filter(
    (entry) => dayDifference(startIso, entry.effectiveDate) >= 0 && dayDifference(entry.effectiveDate, endIso) >= 0,
  );
  const nextStart = addDays(endIso, 1);
  const nextEnd = addDays(endIso, 7);
  const nextWeekLoad = getDayLedger(state, currentIso)
    .filter((entry) => dayDifference(nextStart, entry.effectiveDate) >= 0 && dayDifference(entry.effectiveDate, nextEnd) >= 0)
    .reduce((sum, entry) => sum + entry.plannedHours, 0);
  const tagCounts = state.mistakes.reduce<Record<MistakeTag, number>>(
    (counts, mistake) => {
      counts[mistake.tag] += 1;
      return counts;
    },
    { "concept gap": 0, "silly error": 0, presentation: 0 },
  );
  const topTags = Object.entries(tagCounts)
    .sort((left, right) => right[1] - left[1])
    .filter((entry) => entry[1] > 0)
    .map(([tag, count]) => `${tag}: ${count}`);

  return {
    range: `${displayDate(startIso)} – ${displayDate(endIso)}`,
    planned: ledgers.reduce((sum, entry) => sum + entry.plannedHours, 0),
    actual: ledgers.reduce((sum, entry) => sum + entry.actualHours, 0),
    closed: ledgers.filter((entry) => entry.status === "closed").length,
    totalDays: ledgers.length,
    nextWeekLoad,
    topTags,
  };
};

export const phaseProgress = (state: LedgerState) =>
  SCHEDULE.map((phase) => {
    const actual = phase.days.reduce((sum, studyDay) => sum + (state.actualHours[studyDay.id] ?? 0), 0);
    const closed = phase.days.filter((studyDay) => state.closedDays[studyDay.id]).length;

    return {
      phaseId: phase.id,
      actual,
      closed,
      pct: Math.round((actual / phase.plannedHours) * 100),
    };
  });
