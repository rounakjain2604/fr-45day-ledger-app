import { useEffect, useMemo, useState } from "react";
import { ALL_DAYS, dayPlannedHours } from "../data/schedule";
import { carryForwardFromDay, getBurnUpData, getDayLedger, getMetrics, getTrialBalance, todayIso } from "../lib/analytics";
import {
  createInitialState,
  loadLedgerState,
  parseBackupText,
  saveLedgerState,
  serializeBackup,
  type LedgerState,
  type MistakeTag,
  type MockAttempt,
} from "../lib/state";

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export const useLedgerState = () => {
  const [state, setState] = useState<LedgerState>(() => loadLedgerState());
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    saveLedgerState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", state.theme === "dark" ? "#101412" : "#f7f1e4");
  }, [state.theme]);

  const ledgers = useMemo(() => getDayLedger(state), [state]);
  const metrics = useMemo(() => getMetrics(state), [state]);
  const burnUp = useMemo(() => getBurnUpData(state), [state]);
  const trialBalance = useMemo(() => getTrialBalance(state), [state]);

  const updateState = (updater: (current: LedgerState) => LedgerState) => {
    setState((current) => ({ ...updater(current), updatedAt: new Date().toISOString() }));
  };

  const setTaskChecked = (taskId: string, checked: boolean) => {
    updateState((current) => ({
      ...current,
      checkedTasks: { ...current.checkedTasks, [taskId]: checked },
    }));
  };

  const postHours = (dayId: string, deltaHours: number) => {
    updateState((current) => {
      const nextHours = Math.max(0, Math.round(((current.actualHours[dayId] ?? 0) + deltaHours) * 2) / 2);

      return {
        ...current,
        actualHours: { ...current.actualHours, [dayId]: nextHours },
      };
    });
  };

  const setActualHours = (dayId: string, hours: number) => {
    updateState((current) => ({
      ...current,
      actualHours: { ...current.actualHours, [dayId]: Math.max(0, Math.round(hours * 2) / 2) },
    }));
  };

  const closeDay = (dayId: string) => {
    const studyDay = ALL_DAYS.find((entry) => entry.id === dayId);
    if (!studyDay) return;

    updateState((current) => {
      const checkedTasks = { ...current.checkedTasks };
      studyDay.tasks.forEach((studyTask) => {
        checkedTasks[studyTask.id] = true;
      });

      return {
        ...current,
        checkedTasks,
        closedDays: { ...current.closedDays, [dayId]: true },
        actualHours: {
          ...current.actualHours,
          [dayId]: current.actualHours[dayId] ?? dayPlannedHours(studyDay),
        },
      };
    });
  };

  const reopenDay = (dayId: string) => {
    updateState((current) => ({
      ...current,
      closedDays: { ...current.closedDays, [dayId]: false },
    }));
  };

  const updateNote = (dayId: string, note: string) => {
    updateState((current) => ({
      ...current,
      notes: { ...current.notes, [dayId]: note },
    }));
  };

  const addMistake = (dayId: string, tag: MistakeTag, text: string) => {
    if (!text.trim()) return;

    updateState((current) => ({
      ...current,
      mistakes: [
        {
          id: uid(),
          dayId,
          tag,
          text: text.trim(),
          createdAt: new Date().toISOString(),
        },
        ...current.mistakes,
      ],
    }));
  };

  const removeMistake = (mistakeId: string) => {
    updateState((current) => ({
      ...current,
      mistakes: current.mistakes.filter((mistake) => mistake.id !== mistakeId),
    }));
  };

  const toggleRevision = (dayId: string) => {
    updateState((current) => {
      const currentFlag = current.revisionFlags[dayId];
      const flagged = !currentFlag?.flagged;

      return {
        ...current,
        revisionFlags: {
          ...current.revisionFlags,
          [dayId]: {
            flagged,
            lastTouchedIso: todayIso(),
          },
        },
      };
    });
  };

  const addMockAttempt = (attempt: Omit<MockAttempt, "id">) => {
    updateState((current) => ({
      ...current,
      mockAttempts: [...current.mockAttempts, { ...attempt, id: uid() }],
    }));
  };

  const removeMockAttempt = (attemptId: string) => {
    updateState((current) => ({
      ...current,
      mockAttempts: current.mockAttempts.filter((attempt) => attempt.id !== attemptId),
    }));
  };

  const setTimerDuration = (minutes: 25 | 50) => {
    updateState((current) => ({
      ...current,
      timer: { ...current.timer, selectedMinutes: minutes },
    }));
  };

  const completeTimerSession = (dayId: string, minutes: number) => {
    updateState((current) => {
      const date = todayIso();
      const nextHours = Math.round(((current.actualHours[dayId] ?? 0) + minutes / 60) * 2) / 2;

      return {
        ...current,
        actualHours: { ...current.actualHours, [dayId]: nextHours },
        timer: {
          ...current.timer,
          sessionsByDate: {
            ...current.timer.sessionsByDate,
            [date]: (current.timer.sessionsByDate[date] ?? 0) + 1,
          },
        },
      };
    });
  };

  const carryForward = (dayId: string) => {
    updateState((current) => carryForwardFromDay(current, dayId));
  };

  const toggleTheme = () => {
    updateState((current) => ({
      ...current,
      theme: current.theme === "dark" ? "light" : "dark",
    }));
  };

  const exportBackup = () => {
    const backup = serializeBackup(state);
    updateState((current) => ({ ...current, lastBackupAt: new Date().toISOString() }));
    return backup;
  };

  const importBackup = (backupText: string) => {
    try {
      const imported = parseBackupText(backupText);
      setImportError(null);
      setState(imported);
      return true;
    } catch {
      setImportError("Backup text could not be read.");
      return false;
    }
  };

  const resetLedger = () => {
    setState(createInitialState());
  };

  return {
    state,
    ledgers,
    metrics,
    burnUp,
    trialBalance,
    importError,
    actions: {
      addMistake,
      addMockAttempt,
      carryForward,
      closeDay,
      completeTimerSession,
      exportBackup,
      importBackup,
      postHours,
      removeMistake,
      removeMockAttempt,
      reopenDay,
      resetLedger,
      setActualHours,
      setTaskChecked,
      setTimerDuration,
      toggleRevision,
      toggleTheme,
      updateNote,
    },
  };
};
