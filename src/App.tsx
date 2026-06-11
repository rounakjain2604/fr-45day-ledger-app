import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BarChart3,
  BookOpen,
  Brain,
  Check,
  ClipboardList,
  Download,
  ExternalLink,
  Flag,
  Gauge,
  Home,
  LibraryBig,
  Moon,
  Search,
  Send,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { ALL_DAYS } from "./data/schedule";
import { chapters, subjects, workflowCards, type ChapterAsset } from "./data/catalog";
import { getActiveDay } from "./lib/analytics";
import { useLedgerState } from "./hooks/useLedgerState";
import {
  AnalyticsView,
  DataView,
  DayBookGrid,
  ErrorsView,
  MocksView,
  PhaseSections,
  RevisionView,
  TodayEntry,
} from "./components/LedgerViews";

type AppSection = "home" | "library" | "chapter" | "ledger" | "analytics" | "errors" | "revision" | "mocks" | "data";
type AiMode = "explain" | "socratic" | "journal" | "exam" | "answer_check";
type AiMessage = { role: "user" | "assistant" | "system"; content: string };
type AiContext = {
  subject?: string;
  chapter?: string;
  unit?: string;
  section?: string;
  title?: string;
  question?: string;
  modelAnswer?: string;
  summary?: string;
  keyRules?: string[];
  traps?: string[];
  sourceFile?: string;
};

const sectionIds: AppSection[] = ["home", "library", "chapter", "ledger", "analytics", "errors", "revision", "mocks", "data"];

const navItems: Array<{ id: AppSection; label: string; icon: typeof Home }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "library", label: "Library", icon: LibraryBig },
  { id: "chapter", label: "Chapter", icon: BookOpen },
  { id: "ledger", label: "Ledger", icon: Gauge },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "errors", label: "Errors", icon: Search },
  { id: "revision", label: "Revision", icon: Flag },
  { id: "mocks", label: "Mocks", icon: ClipboardList },
  { id: "data", label: "Vault", icon: Download },
];

const readHashSection = (): AppSection => {
  const hash = window.location.hash.replace("#/", "");
  if (sectionIds.includes(hash as AppSection)) return hash as AppSection;
  return "home";
};

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const aiStarter = (mode: AiMode) =>
  ({
    explain: "Explain this in simple CA Final exam language using the selected context.",
    socratic: "Ask me 3 guided questions first, then show the answer.",
    journal: "Explain the journal entry logic and why each account is debited or credited.",
    exam: "Tell me the exam trap here and how to avoid it.",
    answer_check: "Check my answer against the model answer and list missing points.",
  })[mode];

const resolveAiEndpoint = () => {
  const local = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  if (window.location.protocol === "file:" || (local && window.location.port !== "3721")) {
    return "http://127.0.0.1:3721/api/ai-tutor";
  }
  return "/api/ai-tutor";
};

function App() {
  const { actions, burnUp, importError, ledgers, metrics, state, trialBalance } = useLedgerState();
  const [activeSection, setActiveSection] = useState<AppSection>(() => readHashSection());
  const [selectedChapterId, setSelectedChapterId] = useState("fr-ind-as-23");
  const [selectedDayId, setSelectedDayId] = useState(() => getActiveDay(state).id);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>("explain");
  const [aiInput, setAiInput] = useState("");
  const [aiStatus, setAiStatus] = useState("AI server: waiting");
  const [aiContext, setAiContext] = useState<AiContext | null>(null);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      role: "system",
      content: "Select a chapter, section, or practice card. The tutor will receive that bounded context.",
    },
  ]);
  const [aiBusy, setAiBusy] = useState(false);

  const activeDay = useMemo(() => getActiveDay(state), [state]);
  const selectedDay = ALL_DAYS.find((studyDay) => studyDay.id === selectedDayId) ?? activeDay;
  const selectedLedger = ledgers.find((entry) => entry.dayId === selectedDay.id) ?? ledgers[0];
  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId) ?? chapters[0];

  useEffect(() => {
    const onHashChange = () => setActiveSection(readHashSection());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    setSelectedDayId(activeDay.id);
  }, [activeDay.id]);

  const changeSection = (section: AppSection) => {
    setActiveSection(section);
    window.location.hash = `/${section}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectDay = (dayId: string) => {
    setSelectedDayId(dayId);
    changeSection("ledger");
    window.requestAnimationFrame(() =>
      document.getElementById("today-entry")?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  };

  const selectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    changeSection("chapter");
  };

  const openAi = (context?: AiContext) => {
    if (context) setAiContext(context);
    setAiOpen(true);
    if (!aiInput.trim()) setAiInput(aiStarter(aiMode));
  };

  const askAi = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const userQuestion = aiInput.trim();
    if (!userQuestion || aiBusy) return;

    const nextHistory: AiMessage[] = [...aiMessages, { role: "user", content: userQuestion }];
    setAiMessages(nextHistory);
    setAiInput("");
    setAiBusy(true);
    setAiStatus("Thinking...");

    try {
      const response = await fetch(resolveAiEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: aiMode,
          userQuestion,
          context: aiContext,
          history: nextHistory.slice(-8).map((message) => ({ role: message.role, content: message.content })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI request failed.");

      const answer = data.answer || "No answer returned.";
      setAiMessages((current) => [...current, { role: "assistant", content: answer }]);
      setAiStatus(
        `Answered by ${data.model || "AI"}${data.provider ? ` via ${data.provider}` : ""}${
          data.latencyMs ? ` · ${data.latencyMs}ms` : ""
        }`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI tutor unavailable.";
      setAiMessages((current) => [...current, { role: "system", content: message }]);
      setAiStatus("Run ai-server, then open the PWA through port 3721.");
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="app-frame">
      <aside className="side-rail">
        <div className="brand-block">
          <div className="brand">FR<br />Costs <em>Ledger</em></div>
          <div className="brand-sub">CA Final · May 2027</div>
        </div>

        <div className="progress-wrap">
          <div className="progress-label">
            <span>45-day pace</span>
            <b>{metrics.progressPct}%</b>
          </div>
          <div className="progress-bar"><span style={{ width: `${Math.min(metrics.progressPct, 100)}%` }} /></div>
        </div>

        <nav className="nav-rail" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button className={cx(activeSection === item.id && "active")} key={item.id} type="button" onClick={() => changeSection(item.id)}>
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="theme-btn" type="button" onClick={actions.toggleTheme}>
          {state.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          <span>{state.theme === "dark" ? "Light" : "Dark"} mode</span>
        </button>
      </aside>

      <main className="main-stage">
        <header className="topline">
          <div>
            <div className="kicker">Personal Study Environment</div>
            <h1>{pageTitle(activeSection, selectedChapter)}</h1>
            <p>{pageSubtitle(activeSection, selectedChapter)}</p>
          </div>
          <div className="top-actions">
            <button className="btn ghost" type="button" onClick={() => openAi(chapterContext(selectedChapter))}>
              <Brain size={16} />
              Ask AI
            </button>
            <button className="btn cap" type="button" onClick={() => changeSection("chapter")}>
              <BookOpen size={16} />
              Resume
            </button>
          </div>
        </header>

        {activeSection === "home" ? (
          <HomeView
            metrics={metrics}
            selectedChapter={selectedChapter}
            onOpenAi={openAi}
            onOpenLibrary={() => changeSection("library")}
            onSelectChapter={selectChapter}
          />
        ) : null}

        {activeSection === "library" ? <LibraryView selectedChapterId={selectedChapter.id} onSelectChapter={selectChapter} /> : null}

        {activeSection === "chapter" ? <ChapterView chapter={selectedChapter} onOpenAi={openAi} /> : null}

        {activeSection === "ledger" ? (
          <>
            <DayBookGrid ledgers={ledgers} selectedDayId={selectedDay.id} onSelectDay={selectDay} />
            <div id="today-entry">
              <TodayEntry actions={actions} ledger={selectedLedger} selectedDay={selectedDay} state={state} />
            </div>
            <PhaseSections ledgers={ledgers} state={state} onSelectDay={selectDay} />
          </>
        ) : null}

        {activeSection === "analytics" ? (
          <AnalyticsView burnUp={burnUp} ledgers={ledgers} metrics={metrics} trialBalance={trialBalance} />
        ) : null}

        {activeSection === "errors" ? <ErrorsView actions={actions} state={state} /> : null}

        {activeSection === "revision" ? (
          <RevisionView actions={actions} ledgers={ledgers} state={state} onSelectDay={selectDay} />
        ) : null}

        {activeSection === "mocks" ? <MocksView actions={actions} attempts={state.mockAttempts} /> : null}

        {activeSection === "data" ? <DataView actions={actions} importError={importError} state={state} /> : null}
      </main>

      <AiDrawer
        busy={aiBusy}
        context={aiContext}
        input={aiInput}
        messages={aiMessages}
        mode={aiMode}
        open={aiOpen}
        status={aiStatus}
        onAsk={askAi}
        onChangeInput={setAiInput}
        onClose={() => setAiOpen(false)}
        onModeChange={(mode) => {
          setAiMode(mode);
          if (!aiInput.trim()) setAiInput(aiStarter(mode));
        }}
      />
    </div>
  );
}

function pageTitle(section: AppSection, chapter: ChapterAsset) {
  if (section === "home") return "Control Room";
  if (section === "library") return "Subject Library";
  if (section === "chapter") return chapter.title;
  if (section === "ledger") return "45-Day Ledger";
  if (section === "analytics") return "Ledger Analytics";
  if (section === "errors") return "Mistake Ledger";
  if (section === "revision") return "Revision Queue";
  if (section === "mocks") return "Mock Tracker";
  return "Data Vault";
}

function pageSubtitle(section: AppSection, chapter: ChapterAsset) {
  if (section === "chapter") return chapter.subtitle;
  if (section === "home") return "Open the app into a calm study cockpit, then go where the work actually is.";
  if (section === "library") return "Every chapter should eventually be visible, searchable, and askable.";
  return "Progress, weak areas, mock work, and backup live beside the chapter workspaces.";
}

function chapterContext(chapter: ChapterAsset): AiContext {
  return {
    subject: chapter.subject,
    chapter: chapter.title,
    unit: chapter.unit,
    title: chapter.title,
    summary: chapter.summary,
    keyRules: chapter.sections.flatMap((section) => section.rules).slice(0, 10),
    traps: chapter.sections.flatMap((section) => section.traps).slice(0, 8),
    sourceFile: chapter.sourceFile,
  };
}

function HomeView({
  metrics,
  selectedChapter,
  onOpenAi,
  onOpenLibrary,
  onSelectChapter,
}: {
  metrics: { progressPct: number; totalActual: number; totalPlanned: number; varianceHours: number; daysRemaining: number };
  selectedChapter: ChapterAsset;
  onOpenAi: (context?: AiContext) => void;
  onOpenLibrary: () => void;
  onSelectChapter: (chapterId: string) => void;
}) {
  return (
    <div className="home-stack">
      <section className="hero">
        <div>
          <div className="kicker">Today’s command</div>
          <h2>
            Study inside one room. Track the day, open any chapter, and ask AI from the exact context.
          </h2>
          <p>
            The Ind AS 23 visual system now drives the whole PWA: quiet paper, crisp ledgers, compact controls, and chapter-first navigation.
          </p>
          <div className="hero-actions">
            <button className="btn cap" type="button" onClick={() => onSelectChapter(selectedChapter.id)}>
              <BookOpen size={16} />
              Resume {selectedChapter.title}
            </button>
            <button className="btn ghost" type="button" onClick={onOpenLibrary}>
              <LibraryBig size={16} />
              Open Library
            </button>
            <button className="btn ghost" type="button" onClick={() => onOpenAi(chapterContext(selectedChapter))}>
              <Sparkles size={16} />
              Ask AI
            </button>
          </div>
        </div>
        <div className="hero-panel">
          <span>Current live chapter</span>
          <strong>{selectedChapter.title}</strong>
          <p>{selectedChapter.summary}</p>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard label="Ledger posted" value={`${metrics.progressPct}%`} note={`${metrics.totalActual}h of ${metrics.totalPlanned}h`} />
        <MetricCard label="Variance" value={`${metrics.varianceHours >= 0 ? "+" : ""}${metrics.varianceHours.toFixed(1)}h`} note="Against the 45-day plan" />
        <MetricCard label="Days left" value={metrics.daysRemaining} note="To current target close" />
        <MetricCard label="Live chapters" value={chapters.filter((chapter) => chapter.status !== "Planned").length} note="Dashboards available now" />
      </section>

      <section className="workflow-grid">
        {workflowCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="workflow-card" key={card.title}>
              <span className="tag cap"><Icon size={13} /> {card.label}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          );
        })}
      </section>

      <section className="chapter-strip">
        <div className="sec-head">
          <span className="folio">Live</span>
          <h2>Chapter boards</h2>
        </div>
        <div className="chapter-grid">
          {chapters.slice(0, 3).map((chapter) => (
            <ChapterCard chapter={chapter} key={chapter.id} onSelectChapter={onSelectChapter} />
          ))}
        </div>
      </section>
    </div>
  );
}

function LibraryView({
  selectedChapterId,
  onSelectChapter,
}: {
  selectedChapterId: string;
  onSelectChapter: (chapterId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const visibleSubjects = subjects
    .map((subject) => ({
      ...subject,
      chapters: subject.chapters.filter((chapter) =>
        !normalized
          ? true
          : [chapter.title, chapter.subtitle, chapter.tags.join(" "), chapter.summary].join(" ").toLowerCase().includes(normalized),
      ),
    }))
    .filter((subject) => subject.chapters.length || !normalized);

  return (
    <div className="library-stack">
      <label className="search-box">
        <Search size={17} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Ind AS, traps, computation areas..." />
      </label>
      {visibleSubjects.map((subject) => (
        <section className="subject-section" key={subject.id}>
          <div className="sec-head">
            <span className="folio">{subject.group}</span>
            <h2>{subject.code} · {subject.name}</h2>
          </div>
          {subject.chapters.length ? (
            <div className="chapter-grid">
              {subject.chapters.map((chapter) => (
                <ChapterCard
                  active={selectedChapterId === chapter.id}
                  chapter={chapter}
                  key={chapter.id}
                  onSelectChapter={onSelectChapter}
                />
              ))}
            </div>
          ) : (
            <div className="empty-card">Chapter migration pending. Source material is still visible in the broader workspace.</div>
          )}
        </section>
      ))}
    </div>
  );
}

function ChapterView({ chapter, onOpenAi }: { chapter: ChapterAsset; onOpenAi: (context?: AiContext) => void }) {
  return (
    <div className="chapter-workspace">
      <section className="chapter-hero">
        <div>
          <span className={cx("tag", chapter.tone)}>{chapter.status}</span>
          <h2>{chapter.title} · {chapter.subtitle}</h2>
          <p>{chapter.summary}</p>
          <div className="chip-row">
            {chapter.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
        <div className="chapter-actions">
          <button className="btn cap" type="button" onClick={() => onOpenAi(chapterContext(chapter))}>
            <Brain size={16} />
            Ask AI
          </button>
          {chapter.href ? (
            <a className="btn ghost" href={chapter.href} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              Open dashboard
            </a>
          ) : null}
        </div>
      </section>

      {chapter.sections.length ? (
        <section className="study-section-grid">
          {chapter.sections.map((section) => (
            <article className="study-card" key={section.id}>
              <div>
                <span className="tag cap">Study</span>
                <h3>{section.title}</h3>
                <p>{section.summary}</p>
                <ul>{section.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
              </div>
              <button
                className="btn ghost small"
                type="button"
                onClick={() =>
                  onOpenAi({
                    subject: chapter.subject,
                    chapter: chapter.title,
                    unit: chapter.unit,
                    section: section.title,
                    title: section.title,
                    summary: section.summary,
                    keyRules: section.rules,
                    traps: section.traps,
                    sourceFile: chapter.sourceFile,
                  })
                }
              >
                Ask AI
              </button>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-card">This chapter is registered, but its structured cards are still pending migration.</section>
      )}

      {chapter.practice.length ? (
        <section className="practice-panel">
          <div className="sec-head">
            <span className="folio">Practice</span>
            <h2>Question cards</h2>
          </div>
          <div className="practice-list">
            {chapter.practice.map((item) => (
              <article className="practice-card" key={item.id}>
                <div className="practice-meta">
                  <span>{item.type}</span>
                  <span>{item.topic}</span>
                  <span>{item.difficulty}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.question}</p>
                <details>
                  <summary>Model answer</summary>
                  <p>{item.modelAnswer}</p>
                </details>
                <button
                  className="btn ghost small"
                  type="button"
                  onClick={() =>
                    onOpenAi({
                      subject: chapter.subject,
                      chapter: chapter.title,
                      unit: chapter.unit,
                      title: item.title,
                      question: item.question,
                      modelAnswer: item.modelAnswer,
                      section: item.topic,
                      sourceFile: chapter.sourceFile,
                    })
                  }
                >
                  Ask AI
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {chapter.href ? (
        <section className="embedded-dashboard">
          <div className="sec-head">
            <span className="folio">Board</span>
            <h2>Dashboard preview</h2>
          </div>
          <iframe title={`${chapter.title} dashboard`} src={chapter.href} />
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({ label, note, value }: { label: string; note: string; value: string | number }) {
  return (
    <article className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
      <p>{note}</p>
    </article>
  );
}

function ChapterCard({
  active,
  chapter,
  onSelectChapter,
}: {
  active?: boolean;
  chapter: ChapterAsset;
  onSelectChapter: (chapterId: string) => void;
}) {
  return (
    <article className={cx("chapter-card", active && "active")}>
      <span className={cx("tag", chapter.tone)}>{chapter.status}</span>
      <h3>{chapter.title}</h3>
      <p>{chapter.subtitle}</p>
      <div className="chip-row">{chapter.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="chapter-card-foot">
        <div className="mini-meter"><span style={{ width: `${chapter.readiness}%` }} /></div>
        <b>{chapter.readiness}%</b>
        <button className="btn ghost small" type="button" onClick={() => onSelectChapter(chapter.id)}>Open</button>
      </div>
    </article>
  );
}

function AiDrawer({
  busy,
  context,
  input,
  messages,
  mode,
  open,
  status,
  onAsk,
  onChangeInput,
  onClose,
  onModeChange,
}: {
  busy: boolean;
  context: AiContext | null;
  input: string;
  messages: AiMessage[];
  mode: AiMode;
  open: boolean;
  status: string;
  onAsk: (event: FormEvent<HTMLFormElement>) => void;
  onChangeInput: (value: string) => void;
  onClose: () => void;
  onModeChange: (mode: AiMode) => void;
}) {
  const modes: AiMode[] = ["explain", "socratic", "journal", "exam", "answer_check"];

  return (
    <aside className={cx("ai-drawer", open && "open")} aria-label="Contextual AI Tutor">
      <div className="ai-head">
        <div>
          <div className="ai-title">Contextual AI Tutor</div>
          <p>Gemini first, then ranked model fallbacks through the local AI server.</p>
        </div>
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Close AI drawer"><X size={17} /></button>
      </div>

      <div className="ai-context-card">
        <strong>{context?.title || context?.chapter || "General CA Final context"}</strong>
        <span>{[context?.subject, context?.chapter, context?.unit, context?.section].filter(Boolean).join(" · ") || "No specific section selected"}</span>
      </div>

      <div className="ai-mode-row">
        {modes.map((item) => (
          <button className={cx(mode === item && "active")} key={item} type="button" onClick={() => onModeChange(item)}>
            {item.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="ai-log">
        {messages.map((message, index) => (
          <div className={cx("ai-message", message.role)} key={`${message.role}-${index}`}>
            {message.content}
          </div>
        ))}
      </div>

      <form className="ai-form" onSubmit={onAsk}>
        <textarea value={input} onChange={(event) => onChangeInput(event.target.value)} placeholder="Ask about the selected chapter, section, or question..." />
        <div className="ai-form-foot">
          <span>{status}</span>
          <button className="btn cap" disabled={busy} type="submit">
            {busy ? <Check size={16} /> : <Send size={16} />}
            Ask
          </button>
        </div>
      </form>
    </aside>
  );
}

export default App;
