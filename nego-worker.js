// 네고 예약 — 네이버 예약 캡처 사진을 AI로 읽어 예약 정보를 뽑아주는 Cloudflare Worker
// 배포: Cloudflare → Workers & Pages → Create → Worker → 이름 'soneed-nego-ocr' → 이 코드 붙여넣기 → Deploy
// 그다음: Settings → Variables and Secrets → Secret 추가 → 이름 ANTHROPIC_API_KEY, 값 = Anthropic API 키 → Deploy
export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("POST only", { status: 405, headers: cors });
    try {
      const { image, media_type } = await req.json();
      if (!image) return jsonRes({ error: "no image" }, 400, cors);
      const prompt = `이 이미지는 '네이버 예약 상세정보' 화면 캡처야. 아래 항목을 순수 JSON으로만 추출해(설명·코드블록 없이):
{
 "name": "예약자 성함",
 "phone": "연락처 (010-0000-0000 형식)",
 "reserve": "이용일시를 YYYY-MM-DDTHH:MM 형식으로 (예: 2026-09-04T20:00, 오후 8시는 20:00, 오전 10시는 10:00)",
 "branch": "압구정점 또는 동탄본점 (둘 중 하나)",
 "pkg": "가입상품 (아래 후보 중 정확히 하나, 모르면 빈 문자열)",
 "memo": "요청사항이 있으면 그 내용, 없으면 빈 문자열",
 "info": "예약번호와 이메일 (예: 예약번호 1341884377 · abc@naver.com)"
}
지점 판단: 시술메뉴에 '동탄점' 또는 '(동탄)'이면 "동탄본점", '압구정점' 또는 '(압구정)'이면 "압구정점".
가입상품 후보(정확히 이 문자열 중 하나): "페이스리세팅 1회","페이스리세팅 5회","페이스리세팅 10+1회","페이스리세팅 15+2회","원장 1회","원장 단독 10+1회".
규칙: '첫 방문 + 1회관리'는 "페이스리세팅 1회". '대표원장 네고이벤트'는 "원장 1회". '차액결제 15+2회'는 "페이스리세팅 15+2회".
반드시 JSON만 출력.`;
      const body = {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: media_type || "image/png", data: image } },
            { type: "text", text: prompt },
          ],
        }],
      };
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-workspace-id": "wrkspc_01Pt4BdhaG2PfZeqtSFBD7Po",
        },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      const text = (data && data.content && data.content[0] && data.content[0].text) || "";
      if (!text) {
        const detail = (data && data.error && (data.error.message || data.error.type)) || ("HTTP " + r.status);
        return jsonRes({ error: "ai_error", detail: detail }, 200, cors);
      }
      const m = text.match(/\{[\s\S]*\}/);
      const parsed = m ? JSON.parse(m[0]) : { error: "parse failed", raw: text };
      return jsonRes(parsed, 200, cors);
    } catch (e) {
      return jsonRes({ error: String(e) }, 500, cors);
    }
  },
};
function jsonRes(o, s, cors) {
  return new Response(JSON.stringify(o), { status: s, headers: { ...cors, "content-type": "application/json" } });
}
