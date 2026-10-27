import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  CEO_PROFILE,
  COMPANY,
  DEPARTMENTS,
  PENDING_INTEGRATIONS,
  STAFF_LIST,
  STORAGE_LINK,
} from "./company_config";
import { Simulation, type Agent } from "./engine";
import { Character } from "./components/Character";
import { Inbox } from "./components/Inbox";
import { LiveInbox, ResultModal } from "./components/LiveInbox";
import {
  ApiError,
  fetchLiveStatus,
  listTasks,
  postTask,
  rememberPassword,
  savedPassword,
  type LiveTask,
} from "./live";
import { Room } from "./components/Room";

function useSimulation() {
  const sim = useMemo(() => new Simulation(), []);
  useEffect(() => {
    sim.start();
    return () => sim.stop();
  }, [sim]);
  useSyncExternalStore(sim.subscribe, sim.getVersion);
  return sim;
}

/** 실제 AI 연동: 서버 결재함을 주기적으로 불러오고, 바뀐 상태를 사무실 캐릭터에게 알림 */
function useLive(sim: Simulation) {
  const [live, setLive] = useState(false);
  const [pw, setPw] = useState(savedPassword);
  const [authed, setAuthed] = useState(false);
  const [tasks, setTasks] = useState<LiveTask[]>([]);
  const [quota, setQuota] = useState({ todayCount: 0, dailyLimit: 0 });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seen = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    fetchLiveStatus().then((s) => {
      setLive(s.live);
      if (s.live) sim.setLive(true);
    });
  }, [sim]);

  const notify = useCallback(
    (list: LiveTask[]) => {
      const prev = seen.current;
      seen.current = new Map(list.map((t) => [t.id, t.status]));
      if (!prev) return; // 첫 로딩은 알림 없이
      for (const t of list) {
        if (prev.get(t.id) === t.status) continue;
        const d = DEPARTMENTS.find((x) => x.id === t.dept);
        const tag = `${d?.icon ?? ""} ${d?.name ?? t.dept}`;
        if (t.status === "proposed") sim.announce(t.dept, "📨 대표님 결재 올렸어요!", `${tag} → 결재 요청: ${t.title}`);
        if (t.status === "running") sim.announce(t.dept, "💻 바로 작업 시작할게요!", `${tag} 작업 시작: ${t.title}`);
        if (t.status === "done") sim.announce(t.dept, "📄 완료 보고 올렸어요!", `${tag} 완료 보고: ${t.title}`);
        if (t.status === "failed") sim.announce(t.dept, "😥 문제가 생겼어요…", `${tag} 작업 실패: ${t.title}`);
      }
    },
    [sim],
  );

  const refresh = useCallback(
    async (password = pw) => {
      try {
        const data = await listTasks(password);
        setTasks(data.tasks);
        setQuota({ todayCount: data.todayCount, dailyLimit: data.dailyLimit });
        setAuthed(true);
        notify(data.tasks);
        return true;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          setAuthed(false);
          setError(password ? e.message : null);
        }
        return false;
      }
    },
    [pw, notify],
  );

  useEffect(() => {
    if (!live || !pw) return;
    refresh();
    const t = window.setInterval(() => refresh(), 5000);
    return () => window.clearInterval(t);
  }, [live, pw, refresh]);

  const act = useCallback(
    async (key: string, body: Record<string, unknown>) => {
      setBusy(key);
      setError(null);
      try {
        await postTask(pw, body);
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "요청에 실패했어요.");
        return false;
      } finally {
        setBusy(null);
      }
    },
    [pw, refresh],
  );

  return {
    live,
    authed,
    tasks,
    quota,
    busy,
    error,
    login: async (password: string) => {
      setError(null);
      if (await refresh(password)) {
        rememberPassword(password);
        setPw(password);
      }
    },
    logout: () => {
      rememberPassword("");
      setPw("");
      setAuthed(false);
      setTasks([]);
      seen.current = null;
    },
    act,
  };
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

function CeoThought() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI((v) => (v + 1) % CEO_PROFILE.thoughts.length), 7000);
    return () => window.clearInterval(t);
  }, []);
  return <span className="bubble ceo-bubble">{CEO_PROFILE.thoughts[i]}</span>;
}

export default function App() {
  const sim = useSimulation();
  const now = useClock();
  const [selected, setSelected] = useState<string | null>(null);
  const [openTask, setOpenTask] = useState<LiveTask | null>(null);
  const live = useLive(sim);
  const liveOn = live.live && live.authed;

  const pendingByDept: Record<string, number> = {};
  const workingByDept: Record<string, number> = {};
  if (liveOn) {
    for (const t of live.tasks) {
      if (t.status === "proposed" || t.status === "hold" || t.status === "done") {
        pendingByDept[t.dept] = (pendingByDept[t.dept] ?? 0) + 1;
      }
      if (t.status === "running") workingByDept[t.dept] = (workingByDept[t.dept] ?? 0) + 1;
    }
  } else {
    for (const p of sim.approvals) {
      if (p.status === "pending") pendingByDept[p.dept] = (pendingByDept[p.dept] ?? 0) + 1;
    }
  }

  const pendingTotal = Object.values(pendingByDept).reduce((s, n) => s + n, 0);
  const today = new Date().toDateString();
  const todays = sim.approvals.filter((p) => p.decidedAt && new Date(p.decidedAt).toDateString() === today);
  const stats = {
    approved: todays.filter((p) => p.status === "approved").length,
    hold: todays.filter((p) => p.status === "hold").length,
    rejected: todays.filter((p) => p.status === "rejected").length,
  };

  const selectedAgent = selected ? sim.agents.find((a) => a.key === selected) : undefined;
  const selectedDept = selectedAgent && DEPARTMENTS.find((d) => d.id === selectedAgent.dept);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">{COMPANY.logoLetter}</span>
          <span className="brand-name">{COMPANY.name}</span>
        </div>
        <div className="topbar-right">
          <span className="clock">
            {now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}{" "}
            {now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {STORAGE_LINK && (
            <a className="btn ghost" href={STORAGE_LINK} target="_blank" rel="noreferrer">
              📁 결과 보관함
            </a>
          )}
        </div>
      </header>

      <div className="hero">
        <h1>
          {COMPANY.titlePrefix} <em>{COMPANY.titleAccent}</em>
        </h1>
        <p>{COMPANY.description}</p>
        <div className="hero-stats">
          <span>🏢 {DEPARTMENTS.length}개 팀</span>
          <span>👥 직원 {STAFF_LIST.length}명</span>
          <span>📥 결재 대기 {pendingTotal}건</span>
          <span>⏳ 연동 대기 {Object.keys(PENDING_INTEGRATIONS).length}팀</span>
        </div>
        <div className="controls">
          <button className="btn ghost" onClick={() => sim.setPaused(!sim.paused)}>
            {sim.paused ? "▶ 다시 시작" : "⏸ 일시정지"}
          </button>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              className={`btn ghost${sim.speed === s ? " active" : ""}`}
              onClick={() => sim.setSpeed(s)}
            >
              {s}배속
            </button>
          ))}
        </div>
      </div>

      <div className="top-row">
        <section className="ceo-room">
          <header className="room-head">
            <span className="room-icon">👑</span>
            <div className="room-title">
              <strong>대표실</strong>
              <span className="room-short">{COMPANY.windowLabel}</span>
            </div>
          </header>
          <div className="ceo-floor">
            <div className="ceo-window" />
            <div className="ceo-figure">
              <CeoThought />
              <Character
                hair={CEO_PROFILE.hair}
                shirt={CEO_PROFILE.shirt}
                accent={CEO_PROFILE.accent}
                skin={CEO_PROFILE.skin}
                lead
                scale={1.6}
              />
              <div className="ceo-desk" />
            </div>
            <div className="ceo-info">
              <strong>{CEO_PROFILE.name}</strong>
              <span>{CEO_PROFILE.callsign}</span>
              <span className="muted">{CEO_PROFILE.role}</span>
            </div>
          </div>
        </section>
        {live.live ? (
          <LiveInbox
            authed={live.authed}
            tasks={live.tasks}
            todayCount={live.quota.todayCount}
            dailyLimit={live.quota.dailyLimit}
            busy={live.busy}
            error={live.error}
            onLogin={live.login}
            onLogout={live.logout}
            onOrder={(dept, brief) => live.act("order", { action: "order", dept, brief })}
            onAct={(body) => live.act(String(body.id), body)}
            onOpen={setOpenTask}
          />
        ) : (
          <Inbox
            approvals={sim.approvals}
            onDecide={(id, s) => sim.decide(id, s)}
            onClear={() => sim.clearDecided()}
          />
        )}
      </div>

      <main className="office">
        {DEPARTMENTS.map((d) => (
          <Room
            key={d.id}
            dept={d}
            agents={sim.agents.filter((a) => a.dept === d.id)}
            progress={sim.progress[d.id] ?? 0}
            pendingCount={pendingByDept[d.id] ?? 0}
            working={workingByDept[d.id] ?? 0}
            requesting={live.busy === `propose-${d.id}`}
            onSelect={(a: Agent) => setSelected(a.key)}
            onRequestReport={(id) => {
              if (!liveOn) return sim.requestReport(id);
              sim.announce(id, "🤔 뭘 올릴지 정리해볼게요…");
              live.act(`propose-${id}`, { action: "propose", dept: id });
            }}
          />
        ))}
      </main>

      <div className="bottom-row">
        <section className="panel briefing">
          <header className="panel-head">
            <h2>📋 {COMPANY.reportName} 일일 브리핑</h2>
            <span className="count">
              승인 {stats.approved} · 보류 {stats.hold} · 반려 {stats.rejected}
            </span>
          </header>
          <ul className="brief-list">
            {DEPARTMENTS.map((d) => {
              const lead = STAFF_LIST.find((s) => s.dept === d.id && s.rank === "lead");
              return (
                <li key={d.id}>
                  <span className="brief-icon">{d.icon}</span>
                  <div>
                    <div className="brief-head">
                      <strong>{d.name}</strong>
                      <span className="muted">{lead?.callsign ?? lead?.name}</span>
                      <span className="brief-pct">{Math.round(sim.progress[d.id] ?? 0)}%</span>
                    </div>
                    <p>{d.report}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel log">
          <header className="panel-head">
            <h2>🗒️ 사무실 소식</h2>
          </header>
          <ul className="log-list">
            {sim.log.map((l, i) => (
              <li key={`${l.at}-${i}`}>
                <span className="muted">
                  {new Date(l.at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </span>{" "}
                {l.text}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="window-label">{COMPANY.windowLabel}</footer>

      {openTask && <ResultModal task={openTask} onClose={() => setOpenTask(null)} />}

      {selectedAgent && selectedDept && (
        <div className="modal-back" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="닫기">
              ×
            </button>
            <div className="modal-char">
              <Character
                hair={selectedAgent.staff.colors[0]}
                shirt={selectedAgent.staff.colors[1]}
                accent={selectedAgent.staff.colors[2]}
                lead={selectedAgent.staff.rank === "lead"}
                scale={2.4}
              />
            </div>
            <h3>
              {selectedAgent.staff.name}
              {selectedAgent.staff.callsign && <span className="muted"> · {selectedAgent.staff.callsign}</span>}
            </h3>
            <p className="muted">
              {selectedDept.icon} {selectedDept.name} · {selectedAgent.staff.role}
              {selectedAgent.staff.rank === "lead" ? " (팀장)" : ""}
            </p>
            <p className="modal-status">
              지금:{" "}
              {selectedAgent.mode === "seated"
                ? "자리에서 업무 중 💻"
                : selectedAgent.mode === "walking"
                  ? "이동 중 🚶"
                  : "잠깐 생각 중 💭"}
            </p>
            <h4>혼잣말</h4>
            <ul className="thoughts">
              {selectedAgent.staff.thoughts.map((t) => (
                <li key={t}>“{t}”</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
