// Claude 호출 — 팀 제안 만들기 / 승인된 업무 실행
import Anthropic from "@anthropic-ai/sdk";
import { CEO_PROFILE, COMPANY, DEPARTMENTS, STAFF_LIST } from "../../src/company_config";
import type { TaskResult } from "./store";

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const client = new Anthropic();

type Dept = (typeof DEPARTMENTS)[number];

export function findDept(id: string): Dept | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}

export function leadOf(deptId: string) {
  return STAFF_LIST.find((s) => s.dept === deptId && s.rank === "lead") ?? STAFF_LIST.find((s) => s.dept === deptId);
}

/** 팀 페르소나 시스템 프롬프트 (팀별로 고정 → 프롬프트 캐시 재사용) */
function teamSystem(dept: Dept): string {
  const members = STAFF_LIST.filter((s) => s.dept === dept.id)
    .map((s) => `- ${s.name}${s.rank === "lead" ? " (팀장)" : ""}: ${s.role}`)
    .join("\n");
  return `당신은 ${COMPANY.reportName}의 "${dept.name}"입니다. ${COMPANY.reportName}는 ${CEO_PROFILE.name} 대표가 혼자 운영하는 회사이고, 실제 업무는 AI 팀들이 맡습니다.
회사 소개: ${COMPANY.description}

팀 구성:
${members}

팀의 주 업무: ${dept.task}
팀의 일하는 원칙: ${dept.report}
대표의 경영 원칙: ${CEO_PROFILE.thoughts.join(" / ")}

일하는 방식:
- 결과물은 대표가 바로 쓰거나 고쳐 쓸 수 있는 실제 산출물(대본, 카피, 목록, 표, 계획 등)로, 한국어로 작성합니다.
- 당신은 글로 된 결과물만 만들 수 있습니다. 게시, 업로드, 등록, 메시지 발송, 결제, 계정 접속처럼 바깥에서 실행해야 하는 일은 초안까지 만들고, 대표가 직접 할 일로 따로 적어 주세요.
- 검색량, 시장 규모, 수익 같은 수치를 사실처럼 지어내지 마세요. 확인이 필요한 내용은 "확인 필요"로 표시합니다.
- 금융·재테크 내용은 투자 권유나 수익 보장처럼 들리지 않게 씁니다.`;
}

const PROPOSAL_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "결재함에 표시할 짧은 제목 (40자 이내)" },
    brief: { type: "string", description: "무엇을, 왜, 어떤 결과물로 만들지 2~4문장" },
  },
  required: ["title", "brief"],
  additionalProperties: false,
} as const;

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "대표에게 올리는 한두 문장 완료 보고" },
    deliverable: { type: "string", description: "실제 결과물 전문 (마크다운)" },
    ceoActions: {
      type: "array",
      items: { type: "string" },
      description: "대표가 직접 해야 하는 일 (없으면 빈 배열)",
    },
  },
  required: ["summary", "deliverable", "ceoActions"],
  additionalProperties: false,
} as const;

async function ask<T>(
  dept: Dept,
  prompt: string,
  schema: Record<string, unknown>,
  effort: "low" | "medium" | "high",
): Promise<{ data: T; usage: { input: number; output: number; model: string } }> {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: teamSystem(dept), cache_control: { type: "ephemeral" } }],
    output_config: { effort, format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: prompt }],
  });
  const msg = await stream.finalMessage();

  if (msg.stop_reason === "refusal") throw new Error("AI가 이 요청은 처리하지 않겠다고 했어요. 내용을 바꿔서 다시 지시해 주세요.");
  if (msg.stop_reason === "max_tokens") throw new Error("결과물이 너무 길어 중간에 끊겼어요. 범위를 좁혀서 다시 지시해 주세요.");

  const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return {
    data: JSON.parse(text) as T,
    usage: { input: msg.usage.input_tokens, output: msg.usage.output_tokens, model: msg.model },
  };
}

/** 팀장이 대표에게 올릴 다음 업무 제안 */
export async function proposeTask(dept: Dept, recentTitles: string[]) {
  const recent = recentTitles.length ? `\n최근에 이미 올린 업무(겹치지 않게):\n${recentTitles.map((t) => `- ${t}`).join("\n")}` : "";
  return ask<{ title: string; brief: string }>(
    dept,
    `대표님께 결재받을 다음 업무 하나를 제안해 주세요. 승인되면 팀이 바로 글로 된 결과물을 만들어 낼 수 있는 구체적인 업무여야 합니다.${recent}`,
    PROPOSAL_SCHEMA,
    "low",
  );
}

/** 승인된 업무 실행 */
export async function runTask(dept: Dept, title: string, brief: string) {
  return ask<TaskResult>(
    dept,
    `대표님이 아래 업무를 승인했습니다. 지금 바로 결과물을 만들어 완료 보고해 주세요.\n\n제목: ${title}\n내용: ${brief}`,
    RESULT_SCHEMA,
    "medium",
  );
}

export function describeError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return "Claude API 키가 올바르지 않아요. Vercel의 ANTHROPIC_API_KEY를 확인해 주세요.";
  if (e instanceof Anthropic.PermissionDeniedError) return "이 API 키로는 해당 모델을 쓸 수 없어요.";
  if (e instanceof Anthropic.RateLimitError) return "요청이 몰려 잠시 막혔어요. 조금 뒤에 다시 시도해 주세요.";
  if (e instanceof Anthropic.APIError) {
    if (e.status === 400 && /credit|billing/i.test(e.message)) return "Claude API 크레딧이 부족해요. 결제 설정을 확인해 주세요.";
    return `Claude API 오류 (${e.status ?? "?"}): ${e.message}`;
  }
  if (e instanceof Error) return e.message;
  return "알 수 없는 오류가 났어요.";
}
