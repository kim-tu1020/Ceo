// 업무(Task) 저장소 — Vercel Blob(private)에 업무 1건 = JSON 파일 1개로 저장
import { get, list, put } from "@vercel/blob";

export type TaskStatus =
  | "proposed" // 팀이 올린 결재 대기
  | "hold" // 대표 보류
  | "rejected" // 대표 반려
  | "running" // 승인됨 → AI 작업 중
  | "done" // 완료 보고 대기
  | "archived" // 대표 확인 완료
  | "failed"; // 작업 실패

export interface TaskResult {
  summary: string;
  deliverable: string;
  ceoActions: string[];
}

export interface Task {
  id: string;
  dept: string;
  from: string;
  title: string;
  brief: string;
  origin: "team" | "ceo";
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  result?: TaskResult;
  error?: string;
  usage?: { input: number; output: number; model: string };
}

const PREFIX = "tasks/";
const MAX_TASKS = 120;
const STUCK_MS = 10 * 60 * 1000;

export const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function saveTask(task: Task): Promise<void> {
  task.updatedAt = Date.now();
  await put(`${PREFIX}${task.id}.json`, JSON.stringify(task), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export async function loadTask(id: string): Promise<Task | null> {
  if (!/^[\w-]+$/.test(id)) return null;
  const res = await get(`${PREFIX}${id}.json`, { access: "private", useCache: false });
  if (!res || !res.stream) return null;
  return JSON.parse(await new Response(res.stream).text()) as Task;
}

export async function listTasks(): Promise<Task[]> {
  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
  const recent = blobs
    .sort((a, b) => b.pathname.localeCompare(a.pathname))
    .slice(0, MAX_TASKS);
  const tasks = (
    await Promise.all(
      recent.map((b) => loadTask(b.pathname.slice(PREFIX.length).replace(/\.json$/, "")).catch(() => null)),
    )
  ).filter((t): t is Task => t !== null);

  // 서버가 중간에 멈춰 "작업 중"에 갇힌 건은 실패로 정리
  const now = Date.now();
  for (const t of tasks) {
    if (t.status === "running" && now - (t.startedAt ?? t.updatedAt) > STUCK_MS) {
      t.status = "failed";
      t.error = "작업 시간이 너무 오래 걸려 중단됐어요. 다시 시도해 주세요.";
      await saveTask(t).catch(() => undefined);
    }
  }
  return tasks.sort((a, b) => b.createdAt - a.createdAt);
}
