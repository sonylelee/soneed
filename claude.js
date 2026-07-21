// SONEED 얼굴분석 중계 서버 (Netlify Function)
// 등급 하드락: SUPABASE_URL + SUPABASE_ANON_KEY 환경변수가 설정되면 AI 호출 전에 등급을 검증한다.
//   - 앱이 보낸 x-sb-token(관리사의 Supabase 액세스 토큰)으로 본인 등급을 조회.
//   - 베이직(스탠다드 미만)이면 403 거부. 스탠다드/프리미엄 또는 등급행 없음(기본 프리미엄)이면 통과.
//   - 환경변수가 없으면 검증을 건너뛰어 기존과 동일하게 동작(점진 도입).
const TIER_LV = { "베이직": 1, "스탠다드": 2, "프리미엄": 3 };
const MIN_AI_LV = 2; // AI = 스탠다드 이상

async function checkTier(event, supaBase, anon) {
  const h = event.headers || {};
  const token = h["x-sb-token"] || h["X-Sb-Token"] || "";
  if (!token) return { ok: false, code: 401, msg: "로그인이 필요합니다(토큰 없음)." };
  // 1) 토큰 검증 + 이메일
  let email = "";
  try {
    const u = await fetch(supaBase + "/auth/v1/user", { headers: { apikey: anon, Authorization: "Bearer " + token } });
    if (!u.ok) return { ok: false, code: 401, msg: "세션이 만료되었습니다. 다시 로그인하세요." };
    const uj = await u.json();
    email = uj.email || "";
  } catch (e) {
    return { ok: true }; // 인프라 오류 → 통과(정상 사용자 끊기지 않게)
  }
  if (!email) return { ok: true };
  // 2) 본인 등급 조회(RLS: 자기 행만 보임)
  try {
    const r = await fetch(supaBase + "/rest/v1/accounts?select=tier&email=eq." + encodeURIComponent(email), { headers: { apikey: anon, Authorization: "Bearer " + token } });
    if (!r.ok) return { ok: true }; // 테이블 없음/오류 → 통과(기본 프리미엄)
    const j = await r.json();
    const tier = j && j[0] && j[0].tier;
    if (tier && TIER_LV[tier] && TIER_LV[tier] < MIN_AI_LV) {
      return { ok: false, code: 403, msg: "AI 분석은 스탠다드 등급 이상 전용입니다." };
    }
    return { ok: true }; // 스탠다드+ 또는 등급행 없음(기본 프리미엄)
  } catch (e) {
    return { ok: true };
  }
}

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, x-sb-token, x-app",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "POST만 허용됩니다." }) };
  }
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "서버에 ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다." }) };
  }
  // 등급 하드락(환경변수가 있을 때만 작동). 단 B2C 공개 체험(self.html)은 로그인 없이 허용.
  const h0 = event.headers || {};
  const isB2C = (h0["x-app"] || h0["X-App"]) === "self-b2c";
  const SUPA = process.env.SUPABASE_URL;
  const ANON = process.env.SUPABASE_ANON_KEY;
  if (SUPA && ANON && !isB2C) {
    const chk = await checkTier(event, SUPA.replace(/\/+$/, ""), ANON);
    if (!chk.ok) {
      return { statusCode: chk.code, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ error: chk.msg }) };
    }
  }
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "요청 형식이 잘못되었습니다." }) };
  }
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: payload.model || "claude-sonnet-4-6",
        max_tokens: payload.max_tokens || 4000,
        messages: payload.messages || [],
      }),
    });
    const text = await resp.text();
    return {
      statusCode: resp.status,
      headers: { ...cors, "Content-Type": "application/json" },
      body: text,
    };
  } catch (err) {
    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: "Anthropic 호출 실패: " + (err.message || String(err)) }) };
  }
};
