import { PENDING_INTEGRATIONS } from "../company_config";
import type { Agent, Department } from "../engine";
import { Character } from "./Character";

interface Props {
  dept: Department;
  agents: Agent[];
  progress: number;
  pendingCount: number;
  working: number;
  requesting: boolean;
  onSelect: (a: Agent) => void;
  onRequestReport: (deptId: string) => void;
}

export function Room({ dept, agents, progress, pendingCount, working, requesting, onSelect, onRequestReport }: Props) {
  const integration = PENDING_INTEGRATIONS[dept.id];

  return (
    <section className="room">
      <header className="room-head">
        <span className="room-icon">{dept.icon}</span>
        <div className="room-title">
          <strong>{dept.name}</strong>
          <span className="room-short">{dept.short}</span>
        </div>
        <span
          className={`status-dot ${integration ? "wait" : "ok"}`}
          title={integration ? `연동 대기: ${integration}` : "정상 가동"}
        />
      </header>

      <div className="room-floor">
        {agents.map((a) => (
          <div
            key={`desk-${a.key}`}
            className={`desk${a.staff.rank === "lead" ? " lead" : ""}`}
            style={{ left: `${a.deskX}%`, top: `${a.deskY}%` }}
          >
            <span className="desk-monitor" />
          </div>
        ))}
        <span className="plant" />
        {pendingCount > 0 && <span className="room-mail">📨 {pendingCount}</span>}
        {working > 0 && <span className="room-working">⚙️ AI 작업 중 {working}</span>}

        {agents.map((a) => (
          <button
            key={a.key}
            className="agent"
            style={{ left: `${a.x}%`, top: `${a.y}%`, zIndex: Math.round(a.y) + 10 }}
            onClick={() => onSelect(a)}
            aria-label={`${a.staff.name} (${a.staff.role})`}
          >
            {a.bubble && (
              <span className={`bubble${a.x > 70 ? " edge-r" : a.x < 30 ? " edge-l" : ""}`}>{a.bubble}</span>
            )}
            <Character
              hair={a.staff.colors[0]}
              shirt={a.staff.colors[1]}
              accent={a.staff.colors[2]}
              walking={a.mode === "walking"}
              seated={a.mode === "seated"}
              facing={a.facing}
              lead={a.staff.rank === "lead"}
            />
            <span className="agent-name">{a.staff.name}</span>
          </button>
        ))}
      </div>

      <footer className="room-foot">
        <div className="task">
          <span className="task-label">오늘 할 일</span> {dept.task}
        </div>
        <div className="progress" role="progressbar" aria-valuenow={Math.round(progress)}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="room-foot-row">
          {integration ? (
            <span className="badge wait">⏳ 연동 대기 · {integration}</span>
          ) : (
            <span className="badge ok">● 가동 중</span>
          )}
          <button className="link-btn" disabled={requesting} onClick={() => onRequestReport(dept.id)}>
            {requesting ? "제안 받는 중…" : "보고 요청"}
          </button>
        </div>
      </footer>
    </section>
  );
}
