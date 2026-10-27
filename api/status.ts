import { json } from "./_lib/auth";

/** 실제 AI 연동이 켜져 있는지 (비밀값 자체는 절대 내보내지 않음) */
export function GET(): Response {
  const missing = [
    !process.env.ANTHROPIC_API_KEY && "ANTHROPIC_API_KEY",
    !process.env.CEO_PASSWORD && "CEO_PASSWORD",
    !process.env.BLOB_READ_WRITE_TOKEN && "BLOB_READ_WRITE_TOKEN",
  ].filter(Boolean);
  return json({ live: missing.length === 0, missing });
}
