import { timingSafeEqual } from "node:crypto";

/** 대표 비밀번호(CEO_PASSWORD) 확인. 맞으면 null, 틀리면 에러 응답 */
export function checkAuth(request: Request): Response | null {
  const expected = process.env.CEO_PASSWORD;
  if (!expected) return json({ error: "CEO_PASSWORD가 설정되지 않았어요." }, 503);
  const given = request.headers.get("x-ceo-password") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return json({ error: "비밀번호가 맞지 않아요." }, 401);
  }
  return null;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
