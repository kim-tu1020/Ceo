import { useState } from "react";
import { DEPARTMENTS } from "../company_config";
import type { LiveTask } from "../live";

interface Props {
  authed: boolean;
  tasks: LiveTask[];
  todayCount: number;
  dailyLimit: number;
  busy: string | null;
  error: string | null;
  onLogin: (pw: string) => void;
  onLogout: () => void;
  onOrder: (dept: string, brief: string) => Promise<boolean>;
  onAct: (body: Record<string, unknown>) => void;
  onOpen: (task: LiveTask) => void;
}

const deptOf = (id: string) => DEPARTMENTS.find((d) => d.id === id);
const time = (t: number) => new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

export function LiveInbox(props: Props) {
  const { authed, tasks, busy, error } = props;
  const [pw, setPw] = useState("");
  const [dept, setDept] = useState<string>(DEPARTMENTS[0].id);
  const [brief, setBrief] = useState("");

  if (!authed) {
    return (
      <section className="panel inbox">
        <header className="panel-head">
          <h2>📥 결재함 <span className="live-chip">LIVE</span></h2>
        </header>
        <form
          className="login"
          onSubmit={(e) => {
            e.preventDefault();
            props.onLogin(pw);
          }}
        >
          <p>실제 AI 팀과 연결돼 있어요. 대표 비밀번호를 입력하세요.</p>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="대표 비밀번호" autoComplete="current-password" />
          <button className="btn approve" type="submit">입장</button>
          {error && <p className="err">{error}</p>}
        </form>
      </section>
    );
  }

  const proposed = tasks.filter((t) => t.status === "proposed" || t.status === "hold");
  const running = tasks.filter((t) => t.status === "running");
  const done = tasks.filter((t) => t.status === "done");
  const failed = tasks.filter((t) => t.status === "failed");
  const waiting = proposed.length + done.length;

  return (
    <section className="panel inbox live">
      <header className="panel-head">
        <h2>📥 결재함 <span className="live-chip">LIVE</span></h2>
        <span className="count">
          {waiting}건 대기 · 오늘 {props.todayCount}/{props.dailyLimit}
        </span>
      </header>

      <form
        className="order"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await props.onOrder(dept, brief)) setBrief("");
        }}
      >
        <select value={dept} onChange={(e) => setDept(e.target.value)} aria-label="지시할 팀">
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.icon} {d.name}
            </option>
          ))}
        </select>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="업무 지시 (예: ISA 계좌 쇼츠 대본 3개 써줘)"
          rows={2}
        />
        <button className="btn approve" type="submit" disabled={!brief.trim() || busy === "order"}>
          {busy === "order" ? "전달 중…" : "지시하기"}
        </button>
      </form>

      {error && <p className="err">{error}</p>}

      <ul className="inbox-list">
        {done.map((t) => (
          <li key={t.id} className="inbox-item done">
            <Meta t={t} label="✅ 완료 보고" />
            <strong className="inbox-title">{t.title}</strong>
            <p className="inbox-note">{t.result?.summary}</p>
            <div className="inbox-actions">
              <button className="btn approve" onClick={() => props.onOpen(t)}>결과 보기</button>
              <button className="btn ghost" disabled={busy === t.id} onClick={() => props.onAct({ action: "archive", id: t.id })}>
                확인 완료
              </button>
            </div>
          </li>
        ))}

        {proposed.map((t) => (
          <li key={t.id} className="inbox-item">
            <Meta t={t} label={t.status === "hold" ? "⏸ 보류 중" : "📨 결재 요청"} />
            <strong className="inbox-title">{t.title}</strong>
            <p className="inbox-note">{t.brief}</p>
            <div className="inbox-actions">
              <button className="btn approve" disabled={busy === t.id} onClick={() => props.onAct({ action: "decide", id: t.id, decision: "approved" })}>
                승인
              </button>
              {t.status !== "hold" && (
                <button className="btn hold" disabled={busy === t.id} onClick={() => props.onAct({ action: "decide", id: t.id, decision: "hold" })}>
                  보류
                </button>
              )}
              <button className="btn reject" disabled={busy === t.id} onClick={() => props.onAct({ action: "decide", id: t.id, decision: "rejected" })}>
                반려
              </button>
            </div>
          </li>
        ))}

        {running.map((t) => (
          <li key={t.id} className="inbox-item running">
            <Meta t={t} label="⚙️ 작업 중" />
            <strong className="inbox-title">{t.title}</strong>
            <p className="inbox-note">
              <span className="spinner" /> AI 팀이 결과물을 만들고 있어요. 보통 1~3분 걸려요.
            </p>
          </li>
        ))}

        {failed.map((t) => (
          <li key={t.id} className="inbox-item failed">
            <Meta t={t} label="⚠️ 실패" />
            <strong className="inbox-title">{t.title}</strong>
            <p className="inbox-note">{t.error}</p>
            <div className="inbox-actions">
              <button className="btn hold" disabled={busy === t.id} onClick={() => props.onAct({ action: "retry", id: t.id })}>
                다시 시도
              </button>
              <button className="btn ghost" disabled={busy === t.id} onClick={() => props.onAct({ action: "archive", id: t.id })}>
                지우기
              </button>
            </div>
          </li>
        ))}

        {done.length + proposed.length + running.length + failed.length === 0 && (
          <li className="empty">
            결재할 게 없어요. 위에서 업무를 지시하거나, 팀 방의 "보고 요청"을 눌러 제안을 받아보세요.
          </li>
        )}
      </ul>

      <div className="decided-head live-foot">
        <span>결과는 서버에 저장돼요 · 바깥 게시·결제는 하지 않아요</span>
        <button className="link-btn" onClick={props.onLogout}>로그아웃</button>
      </div>
    </section>
  );
}

function Meta({ t, label }: { t: LiveTask; label: string }) {
  const d = deptOf(t.dept);
  return (
    <div className="inbox-meta">
      <span>
        {label} · {d?.icon} {d?.name} · {t.origin === "ceo" ? "대표 지시" : t.from}
      </span>
      <span>{time(t.updatedAt)}</span>
    </div>
  );
}

export function ResultModal({ task, onClose }: { task: LiveTask; onClose: () => void }) {
  const d = deptOf(task.dept);
  const [copied, setCopied] = useState(false);
  const r = task.result;
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal result" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">×</button>
        <p className="muted">
          {d?.icon} {d?.name} · {task.from}
        </p>
        <h3>{task.title}</h3>
        {r && (
          <>
            <p className="result-summary">{r.summary}</p>
            {r.ceoActions.length > 0 && (
              <div className="ceo-actions">
                <strong>👑 대표님이 직접 할 일</strong>
                <ul>
                  {r.ceoActions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="result-head">
              <strong>결과물</strong>
              <button
                className="btn ghost"
                onClick={() => {
                  navigator.clipboard?.writeText(r.deliverable).then(() => setCopied(true), () => undefined);
                }}
              >
                {copied ? "복사됨 ✓" : "복사"}
              </button>
            </div>
            <pre className="deliverable">{r.deliverable}</pre>
          </>
        )}
      </div>
    </div>
  );
}
