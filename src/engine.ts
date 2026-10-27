// ============================================================
//  시뮬레이션 엔진 — 직원 이동·혼잣말·업무 진행·결재 상신
// ============================================================
//  company_config.ts 의 부서 id 로 방(4열 × 3행)을 배정하고,
//  직원마다 자리·이동 상태를 관리합니다.
//  좌표는 모두 "방 안에서의 %" 입니다 (0~100).
// ============================================================

import {
  DEPARTMENTS,
  STAFF_LIST,
  PENDING_INTEGRATIONS,
  type StaffEntry,
} from "./company_config";

export type Department = (typeof DEPARTMENTS)[number];
export type DeptId = Department["id"];

export type AgentMode = "seated" | "walking" | "standing";

export interface Agent {
  key: string;
  staff: StaffEntry;
  dept: string;
  deskX: number;
  deskY: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  mode: AgentMode;
  facing: 1 | -1;
  bubble: string | null;
  bubbleUntil: number;
  nextActionAt: number;
}

export type ApprovalStatus = "pending" | "approved" | "hold" | "rejected";

export interface Approval {
  id: string;
  dept: string;
  from: string;
  title: string;
  note: string;
  createdAt: number;
  status: ApprovalStatus;
  decidedAt?: number;
}

export interface LogEntry {
  at: number;
  text: string;
}

const TICK_MS = 125;
const SPEED = 0.9; // % / tick
const PROGRESS_PER_SEATED = 0.006; // % / tick / 착석 인원
const MAX_PENDING = 12;
const STORAGE_KEY = "kimtoos-office-v1";

const REPORT_KINDS = ["진행 보고", "중간 결과", "검토 요청", "아이디어 제안"];

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

export const isPending = (dept: string) => dept in PENDING_INTEGRATIONS;

/** 부서별 자리 배치: 팀장은 창가 앞자리, 팀원은 아래 줄에 나란히 */
function layoutDesks(members: StaffEntry[]): { x: number; y: number }[] {
  const leads = members.filter((m) => m.rank === "lead");
  const others = members.filter((m) => m.rank !== "lead");
  const seats = new Map<StaffEntry, { x: number; y: number }>();
  leads.forEach((m, i) => seats.set(m, { x: 50 + (i - (leads.length - 1) / 2) * 22, y: 40 }));
  others.forEach((m, i) => seats.set(m, { x: ((i + 1) / (others.length + 1)) * 100, y: 74 }));
  return members.map((m) => seats.get(m)!);
}

function loadSaved(): { approvals: Approval[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(approvals: Approval[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ approvals: approvals.slice(0, 80) }));
  } catch {
    /* 저장 불가 환경(시크릿 창 등)은 무시 */
  }
}

export class Simulation {
  agents: Agent[] = [];
  progress: Record<string, number> = {};
  approvals: Approval[] = [];
  log: LogEntry[] = [];
  paused = false;
  speed = 1;
  version = 0;

  private listeners = new Set<() => void>();
  private timer: number | undefined;
  private now = Date.now();

  constructor() {
    for (const d of DEPARTMENTS) {
      const members = STAFF_LIST.filter((s) => s.dept === d.id);
      const desks = layoutDesks(members);
      members.forEach((staff, i) => {
        const { x, y } = desks[i];
        this.agents.push({
          key: `${d.id}-${i}`,
          staff,
          dept: d.id,
          deskX: x,
          deskY: y,
          x,
          y,
          tx: x,
          ty: y,
          mode: "seated",
          facing: 1,
          bubble: null,
          bubbleUntil: 0,
          nextActionAt: this.now + rand(1500, 9000),
        });
      });
      this.progress[d.id] = rand(5, 55);
    }
    const saved = loadSaved();
    this.approvals = saved?.approvals ?? [];
    this.pushLog("🏢 출근 완료! 오늘도 12개 팀이 일을 시작합니다.");
  }

  start() {
    if (this.timer !== undefined) return;
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    window.clearInterval(this.timer);
    this.timer = undefined;
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getVersion = () => this.version;

  private emit() {
    this.version++;
    this.listeners.forEach((fn) => fn());
  }

  private pushLog(text: string) {
    this.log.unshift({ at: Date.now(), text });
    this.log.length = Math.min(this.log.length, 40);
  }

  private say(a: Agent, text: string, ms = 4200) {
    a.bubble = text;
    a.bubbleUntil = this.now + ms;
  }

  private tick() {
    if (this.paused) return;
    for (let s = 0; s < this.speed; s++) this.step();
    this.emit();
  }

  private step() {
    this.now += TICK_MS;
    const now = this.now;

    for (const a of this.agents) {
      if (a.bubble && now > a.bubbleUntil) a.bubble = null;

      if (a.mode === "walking") {
        const dx = a.tx - a.x;
        const dy = a.ty - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= SPEED) {
          a.x = a.tx;
          a.y = a.ty;
          const atDesk = a.tx === a.deskX && a.ty === a.deskY;
          a.mode = atDesk ? "seated" : "standing";
          a.nextActionAt = now + (atDesk ? rand(5000, 14000) : rand(2500, 5000));
          if (!atDesk) this.say(a, pick(a.staff.thoughts));
        } else {
          a.x += (dx / dist) * SPEED;
          a.y += (dy / dist) * SPEED * 1.4;
          if (Math.abs(dx) > 0.3) a.facing = dx > 0 ? 1 : -1;
        }
        continue;
      }

      if (now < a.nextActionAt) continue;

      if (a.mode === "standing") {
        // 돌아다니다가 → 자리로 복귀
        this.walkTo(a, a.deskX, a.deskY);
        continue;
      }

      // 착석 중 행동 결정
      const r = Math.random();
      if (r < 0.4) {
        this.walkTo(a, rand(10, 90), rand(30, 86));
      } else if (r < 0.75) {
        const line =
          isPending(a.dept) && Math.random() < 0.3
            ? `${PENDING_INTEGRATIONS[a.dept]} 대기 중… ⏳`
            : pick(a.staff.thoughts);
        this.say(a, line);
        a.nextActionAt = now + rand(6000, 12000);
      } else {
        a.nextActionAt = now + rand(4000, 9000);
      }
    }

    // 업무 진행
    for (const d of DEPARTMENTS) {
      const seated = this.agents.filter((a) => a.dept === d.id && a.mode === "seated").length;
      const factor = isPending(d.id) ? 0.5 : 1;
      this.progress[d.id] += seated * PROGRESS_PER_SEATED * factor;
      if (this.progress[d.id] >= 100) {
        this.progress[d.id] = 0;
        this.submit(d, "최종 결과");
      } else if (Math.random() < 0.0004) {
        this.submit(d, pick(REPORT_KINDS));
      }
    }
  }

  private walkTo(a: Agent, x: number, y: number) {
    a.tx = x;
    a.ty = y;
    a.mode = "walking";
  }

  private submit(d: Department, kind: string) {
    if (this.approvals.filter((p) => p.status === "pending").length >= MAX_PENDING) return;
    const lead =
      this.agents.find((a) => a.dept === d.id && a.staff.rank === "lead") ??
      this.agents.find((a) => a.dept === d.id);
    if (!lead) return;
    const item: Approval = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dept: d.id,
      from: lead.staff.callsign ?? lead.staff.name,
      title: `[${kind}] ${d.task}`,
      note: d.report,
      createdAt: Date.now(),
      status: "pending",
    };
    this.approvals.unshift(item);
    this.say(lead, "📨 대표님 결재 올렸어요!", 5000);
    this.pushLog(`${d.icon} ${d.name} · ${item.from} → 결재 상신: ${item.title}`);
    save(this.approvals);
  }

  /** 대표 결재 */
  decide(id: string, status: Exclude<ApprovalStatus, "pending">) {
    const item = this.approvals.find((p) => p.id === id);
    if (!item) return;
    item.status = status;
    item.decidedAt = Date.now();
    const d = DEPARTMENTS.find((x) => x.id === item.dept);
    const lead = this.agents.find((a) => a.dept === item.dept && a.staff.rank === "lead");
    const label = { approved: "승인", hold: "보류", rejected: "반려" }[status];
    const reaction = {
      approved: "승인 났다! 바로 진행할게요 🎉",
      hold: "보류… 보완해서 다시 올릴게요.",
      rejected: "반려ㅠ 처음부터 다시 볼게요.",
    }[status];
    if (lead) this.say(lead, reaction, 5000);
    this.pushLog(`✅ 대표 ${label}: ${d?.icon ?? ""} ${item.title}`);
    save(this.approvals);
    this.emit();
  }

  /** 결재 기록 비우기 (결정된 것만) */
  clearDecided() {
    this.approvals = this.approvals.filter((p) => p.status === "pending");
    save(this.approvals);
    this.emit();
  }

  /** 지금 바로 한 팀이 보고하도록 */
  requestReport(deptId: string) {
    const d = DEPARTMENTS.find((x) => x.id === deptId);
    if (d) this.submit(d, "긴급 보고");
    this.emit();
  }

  setPaused(p: boolean) {
    this.paused = p;
    this.emit();
  }

  setSpeed(s: number) {
    this.speed = s;
    this.emit();
  }
}
