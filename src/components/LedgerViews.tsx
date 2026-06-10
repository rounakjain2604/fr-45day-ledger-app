import { useEffect, useState, type FormEvent } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  Flag,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  SquarePen,
  Sun,
  TimerReset,
  Upload,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ALL_DAYS, SCHEDULE, TARGET_DATE, TOTAL_DAYS, TOTAL_PLANNED_HOURS, dayPlannedHours, type StudyDay } from "../data/schedule";
import {
  displayDate,
  displayDateWithYear,
  formatHours,
  getEffectiveDate,
  phaseProgress,
  todayIso,
  weekday,
  type BurnUpPoint,
  type DayLedger,
  type LedgerMetrics,
  type TrialBalance,
} from "../lib/analytics";
import type { LedgerState, MistakeTag, MockAttempt } from "../lib/state";
import type { useLedgerState } from "../hooks/useLedgerState";

export type TabId = "today" | "analytics" | "errors" | "revision" | "mocks" | "data";
export type LedgerActions = ReturnType<typeof useLedgerState>["actions"];

const tabs: Array<{ id: TabId; label: string; icon: typeof BookOpen }> = [
  { id: "today", label: "Ledger", icon: BookOpen },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "errors", label: "Errors", icon: Search },
  { id: "revision", label: "Revision", icon: Flag },
  { id: "mocks", label: "Mocks", icon: ClipboardList },
  { id: "data", label: "Vault", icon: Download },
];

const mistakeTags: MistakeTag[] = ["concept gap", "silly error", "presentation"];

const getLedgerForDay = (ledgers: DayLedger[], dayId: string) => ledgers.find((entry) => entry.dayId === dayId);

const getDayById = (dayId: string) => ALL_DAYS.find((studyDay) => studyDay.id === dayId) ?? ALL_DAYS[0];

const varianceCopy = (variance: number) => {
  if (variance >= 0.5) return `+${formatHours(variance)} ahead`;
  if (variance <= -0.5) return `${formatHours(Math.abs(variance))} behind`;
  return "on schedule";
};

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

export function LedgerHeader({
  activeTab,
  metrics,
  state,
  onChangeTab,
  onToggleTheme,
}: {
  activeTab: TabId;
  metrics: LedgerMetrics;
  state: LedgerState;
  onChangeTab: (tab: TabId) => void;
  onToggleTheme: () => void;
}) {
  const backupAge = state.lastBackupAt
    ? Math.floor((Date.now() - new Date(state.lastBackupAt).getTime()) / 86_400_000)
    : null;
  const needsBackup = backupAge === null || backupAge >= 7;

  return (
    <header className="ledger-header">
      <div className="shell header-inner">
        <div className="brand-block">
          <div className="eyebrow">CA Final · Financial Reporting</div>
          <h1>45-Day Ledger</h1>
          <p className="subline">10 Jun – 24 Jul 2026 · {formatHours(TOTAL_PLANNED_HOURS)} study hours</p>
        </div>

        <button className="icon-btn" type="button" onClick={onToggleTheme} aria-label="Toggle theme">
          {state.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="shell progress-row">
        <div className="progress-ledger" aria-label={`${metrics.progressPct}% posted`}>
          <span style={{ width: `${Math.min(metrics.progressPct, 100)}%` }} />
        </div>
        <div className="header-figures">
          <span>
            <b>{formatHours(metrics.totalActual)}</b> of {formatHours(metrics.totalPlanned)} posted
          </span>
          <span className={cx("variance-pill", metrics.varianceHours < -0.4 && "negative")}>
            {varianceCopy(metrics.varianceHours)}
          </span>
        </div>
        {needsBackup ? <div className="backup-chip">Backup due</div> : null}
      </div>

      <nav className="tab-rail shell" aria-label="App sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              className={cx("tab-button", activeTab === tab.id && "active")}
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}

export function DayBookGrid({
  ledgers,
  selectedDayId,
  onSelectDay,
}: {
  ledgers: DayLedger[];
  selectedDayId: string;
  onSelectDay: (dayId: string) => void;
}) {
  return (
    <section className="day-book-hero" aria-labelledby="day-book-title">
      <div className="section-kicker">Day book</div>
      <div className="day-book-title-row">
        <h2 id="day-book-title">Posting grid</h2>
        <span>{TOTAL_DAYS} entries</span>
      </div>
      <div className="day-grid">
        {ledgers.map((entry) => {
          const studyDay = getDayById(entry.dayId);

          return (
            <button
              aria-label={`D${entry.dayNumber}, ${studyDay.topic}, ${entry.status}`}
              className={cx("day-cell", entry.status, selectedDayId === entry.dayId && "selected")}
              key={entry.dayId}
              onClick={() => onSelectDay(entry.dayId)}
              title={`${studyDay.topic} · ${entry.status}`}
              type="button"
            >
              <span className="day-cell-number">{entry.dayNumber}</span>
              <span className="day-cell-stamp" aria-hidden="true">
                <Check size={13} />
              </span>
            </button>
          );
        })}
      </div>
      <div className="legend-row">
        <span>
          <i className="legend-dot closed" /> closed
        </span>
        <span>
          <i className="legend-dot part-posted" /> part-posted
        </span>
        <span>
          <i className="legend-dot pending" /> pending
        </span>
        <span>
          <i className="legend-dot upcoming" /> upcoming
        </span>
      </div>
    </section>
  );
}

function FocusTimer({
  dayId,
  state,
  actions,
}: {
  dayId: string;
  state: LedgerState;
  actions: LedgerActions;
}) {
  const durationSeconds = state.timer.selectedMinutes * 60;
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(false);
  const sessionsToday = state.timer.sessionsByDate[todayIso()] ?? 0;

  useEffect(() => {
    setRemaining(durationSeconds);
    setRunning(false);
  }, [durationSeconds, dayId]);

  useEffect(() => {
    if (!running) return undefined;

    const interval = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setRunning(false);
          actions.completeTimerSession(dayId, state.timer.selectedMinutes);
          return durationSeconds;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [actions, dayId, durationSeconds, running, state.timer.selectedMinutes]);

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div className="timer-strip">
      <div>
        <div className="section-kicker">Focus timer</div>
        <div className="timer-face">
          {minutes}:{seconds}
        </div>
      </div>
      <div className="timer-actions">
        <div className="segmented" aria-label="Timer duration">
          {[25, 50].map((minutesOption) => (
            <button
              className={state.timer.selectedMinutes === minutesOption ? "active" : ""}
              key={minutesOption}
              type="button"
              onClick={() => actions.setTimerDuration(minutesOption as 25 | 50)}
            >
              {minutesOption}
            </button>
          ))}
        </div>
        <button className="icon-btn ink" type="button" onClick={() => setRunning((value) => !value)} aria-label={running ? "Pause timer" : "Start timer"}>
          {running ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="icon-btn" type="button" onClick={() => setRemaining(durationSeconds)} aria-label="Reset timer">
          <TimerReset size={18} />
        </button>
        <span className="mono-note">{sessionsToday} sessions</span>
      </div>
    </div>
  );
}

export function TodayEntry({
  selectedDay,
  ledger,
  state,
  actions,
}: {
  selectedDay: StudyDay;
  ledger: DayLedger;
  state: LedgerState;
  actions: LedgerActions;
}) {
  const [mistakeText, setMistakeText] = useState("");
  const [mistakeTag, setMistakeTag] = useState<MistakeTag>("concept gap");
  const actual = state.actualHours[selectedDay.id] ?? 0;
  const planned = dayPlannedHours(selectedDay);
  const allTasksChecked = selectedDay.tasks.every((studyTask) => state.checkedTasks[studyTask.id]);
  const isClosed = state.closedDays[selectedDay.id] === true;
  const effectiveDate = getEffectiveDate(selectedDay.id, state);
  const dayMistakes = state.mistakes.filter((mistake) => mistake.dayId === selectedDay.id);

  const submitMistake = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    actions.addMistake(selectedDay.id, mistakeTag, mistakeText);
    setMistakeText("");
  };

  return (
    <section className="today-panel" aria-labelledby="today-title">
      <div className="entry-topline">
        <div>
          <div className="section-kicker">Today</div>
          <h2 id="today-title">{selectedDay.topic}</h2>
          <p className="subline">
            D{selectedDay.dayNumber} · {weekday(effectiveDate)} {displayDate(effectiveDate)}
          </p>
        </div>
        <span className={cx("status-badge", ledger.status)}>{ledger.status}</span>
      </div>

      <div className="posting-row">
        <div>
          <span className="mono-label">Posted</span>
          <strong className="number-large">{formatHours(actual)}</strong>
          <span className="mono-note">planned {formatHours(planned)}</span>
        </div>
        <div className="stepper" aria-label="Post actual hours">
          <button type="button" onClick={() => actions.postHours(selectedDay.id, -0.5)} aria-label="Remove half hour">
            −
          </button>
          <input
            aria-label="Actual hours"
            inputMode="decimal"
            min="0"
            step="0.5"
            type="number"
            value={actual}
            onChange={(event) => actions.setActualHours(selectedDay.id, Number(event.target.value))}
          />
          <button type="button" onClick={() => actions.postHours(selectedDay.id, 0.5)} aria-label="Add half hour">
            +
          </button>
        </div>
      </div>

      <div className="task-ledger">
        {selectedDay.tasks.map((studyTask) => (
          <label className="task-line" key={studyTask.id}>
            <input
              checked={state.checkedTasks[studyTask.id] === true}
              type="checkbox"
              onChange={(event) => actions.setTaskChecked(studyTask.id, event.target.checked)}
            />
            <span>{studyTask.text}</span>
            <em>{formatHours(studyTask.plannedHours)}</em>
          </label>
        ))}
      </div>

      <div className="entry-actions">
        <button className="primary-action" type="button" disabled={!allTasksChecked && !isClosed} onClick={() => (isClosed ? actions.reopenDay(selectedDay.id) : actions.closeDay(selectedDay.id))}>
          {isClosed ? <RotateCcw size={16} /> : <Check size={16} />}
          <span>{isClosed ? "Reopen entry" : "Close the day"}</span>
        </button>
        <button className="quiet-action" type="button" onClick={() => actions.toggleRevision(selectedDay.id)}>
          <Flag size={16} />
          <span>{state.revisionFlags[selectedDay.id]?.flagged ? "Posted to queue" : "Needs revision"}</span>
        </button>
        <button className="quiet-action" type="button" onClick={() => actions.carryForward(selectedDay.id)}>
          <CalendarDays size={16} />
          <span>Carry forward</span>
        </button>
      </div>

      <FocusTimer actions={actions} dayId={selectedDay.id} state={state} />

      <div className="notes-grid">
        <label className="field-stack">
          <span>Topic note</span>
          <textarea
            value={state.notes[selectedDay.id] ?? ""}
            onChange={(event) => actions.updateNote(selectedDay.id, event.target.value)}
            placeholder="Mistakes, doubts, carry-forwards..."
          />
        </label>
        <form className="mistake-form" onSubmit={submitMistake}>
          <label className="field-stack">
            <span>Mistake log</span>
            <textarea value={mistakeText} onChange={(event) => setMistakeText(event.target.value)} placeholder="What should be fixed next revision?" />
          </label>
          <div className="form-row">
            <select value={mistakeTag} onChange={(event) => setMistakeTag(event.target.value as MistakeTag)} aria-label="Mistake tag">
              {mistakeTags.map((tag) => (
                <option key={tag}>{tag}</option>
              ))}
            </select>
            <button className="icon-btn ink" type="submit" aria-label="Add mistake">
              <Plus size={18} />
            </button>
          </div>
        </form>
      </div>

      {dayMistakes.length ? (
        <div className="inline-ledger-list">
          {dayMistakes.slice(0, 3).map((mistake) => (
            <div className="ledger-list-item" key={mistake.id}>
              <span>{mistake.tag}</span>
              <p>{mistake.text}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function PhaseSections({
  ledgers,
  state,
  onSelectDay,
}: {
  ledgers: DayLedger[];
  state: LedgerState;
  onSelectDay: (dayId: string) => void;
}) {
  const progress = phaseProgress(state);

  return (
    <section className="phase-ledger" aria-label="Phase ledger">
      {SCHEDULE.map((phase) => {
        const phaseStat = progress.find((item) => item.phaseId === phase.id);

        return (
          <details className="phase-section" key={phase.id} open={phase.id === "p1"}>
            <summary>
              <span>
                <ChevronDown size={16} />
                {phase.name}
              </span>
              <em>
                {formatHours(phaseStat?.actual ?? 0)} / {formatHours(phase.plannedHours)}
              </em>
            </summary>
            <div className="phase-rule">
              <span style={{ width: `${Math.min(phaseStat?.pct ?? 0, 100)}%` }} />
            </div>
            <div className="day-rows">
              {phase.days.map((studyDay) => {
                const ledger = getLedgerForDay(ledgers, studyDay.id);

                return (
                  <button className="day-row-button" key={studyDay.id} type="button" onClick={() => onSelectDay(studyDay.id)}>
                    <span className="row-date">
                      <b>D{studyDay.dayNumber}</b>
                      {displayDate(getEffectiveDate(studyDay.id, state))}
                    </span>
                    <span className="row-title">{studyDay.topic}</span>
                    <span className={cx("row-status", ledger?.status)}>{ledger ? formatHours(ledger.actualHours) : "0h"}</span>
                  </button>
                );
              })}
            </div>
          </details>
        );
      })}
    </section>
  );
}

function MetricTile({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className={cx("metric-tile", tone)}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Heatmap({ ledgers }: { ledgers: DayLedger[] }) {
  const maxHours = Math.max(...ledgers.map((entry) => entry.actualHours), 1);

  return (
    <div className="heatmap" aria-label="Hours posted heatmap">
      {ledgers.map((entry) => {
        const intensity = entry.actualHours / maxHours;

        return (
          <span
            className={cx("heat-cell", entry.status)}
            key={entry.dayId}
            style={{ opacity: entry.actualHours ? Math.max(0.35, intensity) : undefined }}
            title={`D${entry.dayNumber}: ${formatHours(entry.actualHours)}`}
          />
        );
      })}
    </div>
  );
}

export function AnalyticsView({
  burnUp,
  ledgers,
  metrics,
  trialBalance,
}: {
  burnUp: BurnUpPoint[];
  ledgers: DayLedger[];
  metrics: LedgerMetrics;
  trialBalance: TrialBalance;
}) {
  return (
    <div className="view-grid analytics-view">
      <section className="ledger-panel wide">
        <div className="section-kicker">Variance & pace</div>
        <div className="metric-grid">
          <MetricTile label="Variance" tone={metrics.varianceHours < -0.4 ? "bad" : "good"} value={varianceCopy(metrics.varianceHours)} />
          <MetricTile label="Variance in days" value={`${metrics.varianceDays >= 0 ? "+" : ""}${metrics.varianceDays}`} />
          <MetricTile label="Required daily" value={formatHours(metrics.requiredDailyHours)} />
          <MetricTile label="Projected close" value={metrics.projectedCompletionDate ? displayDateWithYear(metrics.projectedCompletionDate) : "No pace"} />
        </div>
        <div className="chart-box">
          <ResponsiveContainer height={270} width="100%">
            <LineChart data={burnUp} margin={{ bottom: 0, left: -18, right: 10, top: 12 }}>
              <CartesianGrid stroke="var(--rule)" strokeDasharray="2 6" />
              <XAxis dataKey="date" minTickGap={24} stroke="var(--muted)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--muted)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--rule)", color: "var(--text)" }} />
              <Line dataKey="planned" dot={false} stroke="var(--pending)" strokeWidth={2} type="monotone" />
              <Line dataKey="actual" dot={false} stroke="var(--posted)" strokeWidth={3} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="ledger-panel">
        <div className="section-kicker">Heatmap</div>
        <h2>Hours posted</h2>
        <Heatmap ledgers={ledgers} />
        <div className="metric-grid compact">
          <MetricTile label="Current streak" value={`${metrics.currentStreak}`} />
          <MetricTile label="Best streak" value={`${metrics.bestStreak}`} />
          <MetricTile label="Days c/f" value={`${TOTAL_DAYS - metrics.closedDays}`} />
          <MetricTile label="To deadline" value={`${metrics.daysRemaining}`} />
        </div>
      </section>

      <section className="ledger-panel">
        <div className="section-kicker">Trial balance</div>
        <h2>{trialBalance.range}</h2>
        <div className="trial-lines">
          <span>Planned</span>
          <b>{formatHours(trialBalance.planned)}</b>
          <span>Posted</span>
          <b>{formatHours(trialBalance.actual)}</b>
          <span>Days closed</span>
          <b>
            {trialBalance.closed}/{trialBalance.totalDays}
          </b>
          <span>Next load</span>
          <b>{formatHours(trialBalance.nextWeekLoad)}</b>
        </div>
        <div className="tag-strip">
          {trialBalance.topTags.length ? trialBalance.topTags.map((tag) => <span key={tag}>{tag}</span>) : <span>no error tags posted</span>}
        </div>
      </section>
    </div>
  );
}

export function ErrorsView({
  state,
  actions,
}: {
  state: LedgerState;
  actions: LedgerActions;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const notes = ALL_DAYS.map((studyDay) => ({ studyDay, note: state.notes[studyDay.id] ?? "" })).filter((entry) => entry.note.trim());
  const mistakes = state.mistakes.filter((mistake) => {
    const studyDay = getDayById(mistake.dayId);
    const haystack = `${studyDay.topic} ${mistake.tag} ${mistake.text}`.toLowerCase();
    return !normalizedQuery || haystack.includes(normalizedQuery);
  });
  const filteredNotes = notes.filter((entry) => {
    const haystack = `${entry.studyDay.topic} ${entry.note}`.toLowerCase();
    return !normalizedQuery || haystack.includes(normalizedQuery);
  });

  return (
    <div className="view-grid">
      <section className="ledger-panel wide">
        <div className="search-line">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search errors, tags, topics" />
        </div>
        <div className="error-columns">
          <div>
            <div className="section-kicker">Mistake log</div>
            <div className="stack-list">
              {mistakes.map((mistake) => {
                const studyDay = getDayById(mistake.dayId);

                return (
                  <article className="ledger-list-item" key={mistake.id}>
                    <span>
                      D{studyDay.dayNumber} · {mistake.tag}
                    </span>
                    <h3>{studyDay.topic}</h3>
                    <p>{mistake.text}</p>
                    <button type="button" onClick={() => actions.removeMistake(mistake.id)}>
                      Remove
                    </button>
                  </article>
                );
              })}
              {!mistakes.length ? <p className="empty-line">No matching error entries.</p> : null}
            </div>
          </div>
          <div>
            <div className="section-kicker">Topic notes</div>
            <div className="stack-list">
              {filteredNotes.map((entry) => (
                <article className="ledger-list-item" key={entry.studyDay.id}>
                  <span>D{entry.studyDay.dayNumber}</span>
                  <h3>{entry.studyDay.topic}</h3>
                  <p>{entry.note}</p>
                </article>
              ))}
              {!filteredNotes.length ? <p className="empty-line">No matching notes.</p> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function RevisionView({
  state,
  ledgers,
  actions,
  onSelectDay,
}: {
  state: LedgerState;
  ledgers: DayLedger[];
  actions: LedgerActions;
  onSelectDay: (dayId: string) => void;
}) {
  const queue = ALL_DAYS.filter((studyDay) => state.revisionFlags[studyDay.id]?.flagged);
  const p6Days = SCHEDULE.find((phase) => phase.id === "p6")?.days ?? [];

  return (
    <div className="view-grid">
      <section className="ledger-panel">
        <div className="section-kicker">Revision queue</div>
        <h2>{queue.length} topics flagged</h2>
        <div className="stack-list">
          {queue.map((studyDay) => {
            const flag = state.revisionFlags[studyDay.id];

            return (
              <button className="queue-item" key={studyDay.id} type="button" onClick={() => onSelectDay(studyDay.id)}>
                <span>D{studyDay.dayNumber}</span>
                <strong>{studyDay.topic}</strong>
                <em>{flag?.lastTouchedIso ? displayDate(flag.lastTouchedIso) : "not touched"}</em>
              </button>
            );
          })}
          {!queue.length ? <p className="empty-line">The revision queue is clear.</p> : null}
        </div>
      </section>

      <section className="ledger-panel wide">
        <div className="section-kicker">P6 inline queue</div>
        <h2>Revision, RTP/MTP & mock</h2>
        <div className="day-rows">
          {p6Days.map((studyDay) => {
            const ledger = getLedgerForDay(ledgers, studyDay.id);

            return (
              <div className="revision-row" key={studyDay.id}>
                <button type="button" onClick={() => onSelectDay(studyDay.id)}>
                  <span>D{studyDay.dayNumber}</span>
                  <strong>{studyDay.topic}</strong>
                  <em>{ledger ? formatHours(ledger.actualHours) : "0h"}</em>
                </button>
                <button className="icon-btn" type="button" onClick={() => actions.toggleRevision(studyDay.id)} aria-label="Toggle revision flag">
                  <Flag size={17} fill={state.revisionFlags[studyDay.id]?.flagged ? "currentColor" : "none"} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function MocksView({
  attempts,
  actions,
}: {
  attempts: MockAttempt[];
  actions: LedgerActions;
}) {
  const [form, setForm] = useState({ date: todayIso(), paper: "MTP-I", score: "0", maxScore: "100", weakChapters: "" });
  const chartData = attempts.map((attempt) => ({
    label: displayDate(attempt.date),
    score: Math.round((attempt.score / attempt.maxScore) * 100),
  }));

  const submitAttempt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    actions.addMockAttempt({
      date: form.date,
      paper: form.paper,
      score: Number(form.score),
      maxScore: Number(form.maxScore),
      weakChapters: form.weakChapters,
    });
    setForm({ date: todayIso(), paper: "MTP-I", score: "0", maxScore: "100", weakChapters: "" });
  };

  return (
    <div className="view-grid">
      <section className="ledger-panel">
        <div className="section-kicker">Mock & test tracker</div>
        <form className="mock-form" onSubmit={submitAttempt}>
          <label>
            Date
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>
          <label>
            Paper
            <input value={form.paper} onChange={(event) => setForm({ ...form, paper: event.target.value })} />
          </label>
          <label>
            Marks
            <input inputMode="decimal" type="number" value={form.score} onChange={(event) => setForm({ ...form, score: event.target.value })} />
          </label>
          <label>
            Max
            <input inputMode="decimal" type="number" value={form.maxScore} onChange={(event) => setForm({ ...form, maxScore: event.target.value })} />
          </label>
          <label className="span-two">
            Weak chapters
            <textarea value={form.weakChapters} onChange={(event) => setForm({ ...form, weakChapters: event.target.value })} />
          </label>
          <button className="primary-action span-two" type="submit">
            <SquarePen size={16} />
            <span>Post attempt</span>
          </button>
        </form>
      </section>

      <section className="ledger-panel wide">
        <div className="section-kicker">Score trend</div>
        <div className="chart-box">
          <ResponsiveContainer height={240} width="100%">
            <LineChart data={chartData} margin={{ left: -18, right: 10, top: 12 }}>
              <CartesianGrid stroke="var(--rule)" strokeDasharray="2 6" />
              <XAxis dataKey="label" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />
              <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--rule)", color: "var(--text)" }} />
              <Line dataKey="score" stroke="var(--posted)" strokeWidth={3} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="stack-list">
          {attempts.map((attempt) => (
            <article className="ledger-list-item" key={attempt.id}>
              <span>
                {displayDate(attempt.date)} · {attempt.paper}
              </span>
              <h3>
                {attempt.score}/{attempt.maxScore}
              </h3>
              <p>{attempt.weakChapters}</p>
              <button type="button" onClick={() => actions.removeMockAttempt(attempt.id)}>
                Remove
              </button>
            </article>
          ))}
          {!attempts.length ? <p className="empty-line">No attempts posted.</p> : null}
        </div>
      </section>
    </div>
  );
}

export function DataView({
  state,
  actions,
  importError,
}: {
  state: LedgerState;
  actions: LedgerActions;
  importError: string | null;
}) {
  const [backupText, setBackupText] = useState("");
  const backupAge = state.lastBackupAt
    ? Math.floor((Date.now() - new Date(state.lastBackupAt).getTime()) / 86_400_000)
    : null;

  const copyBackup = async () => {
    const backup = actions.exportBackup();
    setBackupText(backup);
    await navigator.clipboard?.writeText(backup);
  };

  return (
    <div className="view-grid">
      <section className="ledger-panel wide">
        <div className="section-kicker">Data vault</div>
        <h2>Backup ledger</h2>
        <div className="metric-grid compact">
          <MetricTile label="Schema" value="v1" />
          <MetricTile label="Backup age" value={backupAge === null ? "never" : `${backupAge}d`} tone={backupAge === null || backupAge >= 7 ? "bad" : "good"} />
          <MetricTile label="Target close" value={displayDate(TARGET_DATE)} />
          <MetricTile label="Storage" value="local" />
        </div>
        <div className="data-actions">
          <button className="primary-action" type="button" onClick={copyBackup}>
            <Download size={16} />
            <span>Export JSON</span>
          </button>
          <button className="quiet-action" type="button" onClick={() => backupText && actions.importBackup(backupText)}>
            <Upload size={16} />
            <span>Import JSON</span>
          </button>
          <button className="quiet-action danger" type="button" onClick={() => window.confirm("Reset all ledger progress?") && actions.resetLedger()}>
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
        <textarea className="backup-box" value={backupText} onChange={(event) => setBackupText(event.target.value)} placeholder="Exported JSON, or paste old HTML backup text here." />
        {importError ? <p className="error-line">{importError}</p> : null}
      </section>
    </div>
  );
}
