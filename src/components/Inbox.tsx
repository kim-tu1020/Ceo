import { DEPARTMENTS } from "../company_config";
import type { Approval, ApprovalStatus } from "../engine";

interface Props {
  approvals: Approval[];
  onDecide: (id: string, status: Exclude<ApprovalStatus, "pending">) => void;
  onClear: () => void;
}

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending: "대기",
  approved: "승인",
  hold: "보류",
  rejected: "반려",
};

const time = (t: number) =>
  new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

export function Inbox({ approvals, onDecide, onClear }: Props) {
  const pending = approvals.filter((a) => a.status === "pending");
  const decided = approvals.filter((a) => a.status !== "pending").slice(0, 6);

  return (
    <section className="panel inbox">
      <header className="panel-head">
        <h2>📥 결재함</h2>
        <span className="count">{pending.length}건 대기</span>
      </header>

      {pending.length === 0 ? (
        <p className="empty">결재할 게 없어요. 팀들이 열심히 일하는 중 ☕</p>
      ) : (
        <ul className="inbox-list">
          {pending.map((p) => {
            const d = DEPARTMENTS.find((x) => x.id === p.dept);
            return (
              <li key={p.id} className="inbox-item">
                <div className="inbox-meta">
                  <span>
                    {d?.icon} {d?.name} · {p.from}
                  </span>
                  <span>{time(p.createdAt)}</span>
                </div>
                <strong className="inbox-title">{p.title}</strong>
                <p className="inbox-note">{p.note}</p>
                <div className="inbox-actions">
                  <button className="btn approve" onClick={() => onDecide(p.id, "approved")}>
                    승인
                  </button>
                  <button className="btn hold" onClick={() => onDecide(p.id, "hold")}>
                    보류
                  </button>
                  <button className="btn reject" onClick={() => onDecide(p.id, "rejected")}>
                    반려
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {decided.length > 0 && (
        <div className="decided">
          <div className="decided-head">
            <span>최근 처리</span>
            <button className="link-btn" onClick={onClear}>
              기록 비우기
            </button>
          </div>
          <ul>
            {decided.map((p) => (
              <li key={p.id}>
                <span className={`tag ${p.status}`}>{STATUS_LABEL[p.status]}</span>
                <span className="decided-title">{p.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
