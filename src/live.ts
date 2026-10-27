// 실제 AI 연동 API 클라이언트 (api/ 폴더의 서버와 통신)

export type TaskStatus = "proposed" | "hold" | "rejected" | "running" | "done" | "archived" | "failed";

export interface LiveTask {
  id: string;
  dept: string;
  from: string;
  title: string;
  brief: string;
  origin: "team" | "ceo";
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  result?: { summary: string; deliverable: string; ceoActions: string[] };
  error?: string;
}

export interface TaskList {
  tasks: LiveTask[];
  todayCount: number;
  dailyLimit: number;
}

const PW_KEY = "kimtoos-ceo-password";

export function savedPassword(): string {
  try {
    return localStorage.getItem(PW_KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberPassword(pw: string) {
  try {
    if (pw) localStorage.setItem(PW_KEY, pw);
    else localStorage.removeItem(PW_KEY);
  } catch {
    /* 저장 불가 환경 무시 */
  }
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function call<T>(pw: string, init?: { method: string; body: unknown }): Promise<T> {
  const res = await fetch("/api/tasks", {
    method: init?.method ?? "GET",
    headers: { "content-type": "application/json", "x-ceo-password": pw },
    body: init ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? `오류 (${res.status})`, res.status);
  return data as T;
}

/** 서버에 실제 AI 연동이 켜져 있는지 확인. 로컬 개발(npm run dev)에서는 false */
export async function fetchLiveStatus(): Promise<{ live: boolean; missing: string[] }> {
  try {
    const res = await fetch("/api/status");
    if (!res.ok) return { live: false, missing: [] };
    return await res.json();
  } catch {
    return { live: false, missing: [] };
  }
}

export const listTasks = (pw: string) => call<TaskList>(pw);
export const postTask = (pw: string, body: Record<string, unknown>) =>
  call<{ task: LiveTask }>(pw, { method: "POST", body });
