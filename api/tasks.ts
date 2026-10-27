// 결재함 API
//  GET  /api/tasks                → 업무 목록
//  POST /api/tasks {action, ...}  → propose(팀 제안) / order(대표 직접 지시) /
//                                   decide(승인·보류·반려) / archive(확인 완료) / retry(재시도)
import { waitUntil } from "@vercel/functions";
import { checkAuth, json } from "./_lib/auth";
import { describeError, findDept, leadOf, proposeTask, runTask } from "./_lib/claude";
import { listTasks, loadTask, newId, saveTask, type Task } from "./_lib/store";

const DAILY_LIMIT = Number(process.env.DAILY_LIMIT || 30);
const MAX_RUNNING = 3;

export async function GET(request: Request): Promise<Response> {
  const denied = checkAuth(request);
  if (denied) return denied;
  const tasks = await listTasks();
  return json({ tasks, todayCount: countToday(tasks), dailyLimit: DAILY_LIMIT });
}

export async function POST(request: Request): Promise<Response> {
  const denied = checkAuth(request);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "요청 형식이 잘못됐어요." }, 400);
  }
  const action = String(body.action ?? "");

  if (action === "propose" || action === "order") {
    const dept = findDept(String(body.dept ?? ""));
    if (!dept) return json({ error: "없는 팀이에요." }, 400);
    const tasks = await listTasks();
    const limited = checkLimits(tasks, action === "order");
    if (limited) return limited;
    const lead = leadOf(dept.id);
    const from = lead?.callsign ?? lead?.name ?? dept.name;

    if (action === "propose") {
      try {
        const recent = tasks.filter((t) => t.dept === dept.id).slice(0, 8).map((t) => t.title);
        const { data } = await proposeTask(dept, recent);
        const task: Task = {
          id: newId(), dept: dept.id, from, title: data.title, brief: data.brief,
          origin: "team", status: "proposed", createdAt: Date.now(), updatedAt: Date.now(),
        };
        await saveTask(task);
        return json({ task });
      } catch (e) {
        return json({ error: describeError(e) }, 502);
      }
    }

    const brief = String(body.brief ?? "").trim().slice(0, 2000);
    if (!brief) return json({ error: "지시 내용을 적어 주세요." }, 400);
    const task: Task = {
      id: newId(), dept: dept.id, from, title: brief.split("\n")[0].slice(0, 40), brief,
      origin: "ceo", status: "running", createdAt: Date.now(), updatedAt: Date.now(), startedAt: Date.now(),
    };
    await saveTask(task);
    waitUntil(execute(task));
    return json({ task });
  }

  const task = await loadTask(String(body.id ?? ""));
  if (!task) return json({ error: "업무를 찾을 수 없어요." }, 404);

  if (action === "decide") {
    if (task.status !== "proposed" && task.status !== "hold") return json({ error: "이미 처리된 결재예요." }, 409);
    const decision = String(body.decision ?? "");
    if (decision === "hold" || decision === "rejected") {
      task.status = decision;
      await saveTask(task);
      return json({ task });
    }
    if (decision !== "approved") return json({ error: "알 수 없는 결재예요." }, 400);
    const limited = checkLimits(await listTasks(), true);
    if (limited) return limited;
    return json({ task: await start(task) });
  }

  if (action === "retry") {
    if (task.status !== "failed") return json({ error: "실패한 업무만 다시 시도할 수 있어요." }, 409);
    const limited = checkLimits(await listTasks(), true);
    if (limited) return limited;
    task.error = undefined;
    return json({ task: await start(task) });
  }

  if (action === "archive") {
    if (task.status !== "done" && task.status !== "rejected" && task.status !== "failed") {
      return json({ error: "완료되거나 반려된 업무만 정리할 수 있어요." }, 409);
    }
    task.status = "archived";
    await saveTask(task);
    return json({ task });
  }

  return json({ error: "알 수 없는 요청이에요." }, 400);
}

async function start(task: Task): Promise<Task> {
  task.status = "running";
  task.startedAt = Date.now();
  await saveTask(task);
  waitUntil(execute(task));
  return task;
}

/** 응답을 먼저 돌려준 뒤 백그라운드에서 실제 작업 */
async function execute(task: Task): Promise<void> {
  const dept = findDept(task.dept);
  try {
    if (!dept) throw new Error("없는 팀이에요.");
    const { data, usage } = await runTask(dept, task.title, task.brief);
    task.status = "done";
    task.result = data;
    task.usage = usage;
  } catch (e) {
    task.status = "failed";
    task.error = describeError(e);
  }
  await saveTask(task);
}

function countToday(tasks: Task[]): number {
  const today = new Date().toDateString();
  return tasks.filter((t) => new Date(t.createdAt).toDateString() === today).length;
}

function checkLimits(tasks: Task[], running: boolean): Response | null {
  if (countToday(tasks) >= DAILY_LIMIT) {
    return json({ error: `오늘 AI 작업 한도(${DAILY_LIMIT}건)를 다 썼어요. 내일 다시 이용해 주세요.` }, 429);
  }
  if (running && tasks.filter((t) => t.status === "running").length >= MAX_RUNNING) {
    return json({ error: `동시에 ${MAX_RUNNING}건까지만 작업할 수 있어요. 진행 중인 업무가 끝나면 다시 시도해 주세요.` }, 429);
  }
  return null;
}
