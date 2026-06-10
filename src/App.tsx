import { useEffect, useMemo, useState } from "react";
import { ALL_DAYS } from "./data/schedule";
import { getActiveDay } from "./lib/analytics";
import { useLedgerState } from "./hooks/useLedgerState";
import {
  AnalyticsView,
  DataView,
  DayBookGrid,
  ErrorsView,
  LedgerHeader,
  MocksView,
  PhaseSections,
  RevisionView,
  TodayEntry,
  type TabId,
} from "./components/LedgerViews";

const readHashTab = (): TabId => {
  const hash = window.location.hash.replace("#/", "");
  if (["today", "analytics", "errors", "revision", "mocks", "data"].includes(hash)) return hash as TabId;
  return "today";
};

function App() {
  const { actions, burnUp, importError, ledgers, metrics, state, trialBalance } = useLedgerState();
  const [activeTab, setActiveTab] = useState<TabId>(() => readHashTab());
  const activeDay = useMemo(() => getActiveDay(state), [state]);
  const [selectedDayId, setSelectedDayId] = useState(activeDay.id);
  const selectedDay = ALL_DAYS.find((studyDay) => studyDay.id === selectedDayId) ?? activeDay;
  const selectedLedger = ledgers.find((entry) => entry.dayId === selectedDay.id) ?? ledgers[0];

  useEffect(() => {
    const onHashChange = () => setActiveTab(readHashTab());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    setSelectedDayId(activeDay.id);
  }, [activeDay.id]);

  const changeTab = (tab: TabId) => {
    setActiveTab(tab);
    window.location.hash = `/${tab}`;
  };

  const selectDay = (dayId: string) => {
    setSelectedDayId(dayId);
    setActiveTab("today");
    window.location.hash = "/today";
    window.requestAnimationFrame(() => document.getElementById("today-entry")?.scrollIntoView({ block: "start", behavior: "smooth" }));
  };

  return (
    <>
      <LedgerHeader
        activeTab={activeTab}
        metrics={metrics}
        state={state}
        onChangeTab={changeTab}
        onToggleTheme={actions.toggleTheme}
      />

      <main className="shell app-main">
        {activeTab === "today" ? (
          <>
            <DayBookGrid ledgers={ledgers} selectedDayId={selectedDay.id} onSelectDay={selectDay} />
            <div id="today-entry">
              <TodayEntry actions={actions} ledger={selectedLedger} selectedDay={selectedDay} state={state} />
            </div>
            <PhaseSections ledgers={ledgers} state={state} onSelectDay={selectDay} />
          </>
        ) : null}

        {activeTab === "analytics" ? (
          <AnalyticsView burnUp={burnUp} ledgers={ledgers} metrics={metrics} trialBalance={trialBalance} />
        ) : null}

        {activeTab === "errors" ? <ErrorsView actions={actions} state={state} /> : null}

        {activeTab === "revision" ? (
          <RevisionView actions={actions} ledgers={ledgers} state={state} onSelectDay={selectDay} />
        ) : null}

        {activeTab === "mocks" ? <MocksView actions={actions} attempts={state.mockAttempts} /> : null}

        {activeTab === "data" ? <DataView actions={actions} importError={importError} state={state} /> : null}
      </main>
    </>
  );
}

export default App;
