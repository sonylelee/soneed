// SONEED 얼굴분석 중계 서버 (Netlify Function)
exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
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
