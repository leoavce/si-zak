import OpenAI from "openai";

export const runtime = "nodejs"; // 스트리밍 안정적으로 Node runtime

export async function POST(req: Request) {
  const { messages, context } = await req.json();

  const apiKey = process.env.UPSTAGE_API_KEY;
  if (!apiKey) {
    return new Response("Missing UPSTAGE_API_KEY", { status: 500 });
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: "https://api.upstage.ai/v1",
  });

  // 아주 간단한 시스템 프롬프트(원하면 나중에 더 다듬자)
  const system = {
    role: "system" as const,
    content:
      "너는 취업 공고 추천 서비스의 도우미야. 사용자의 질문에 간단하고 실용적으로 답해.",
  };

  const ctx = context
    ? {
        role: "system" as const,
        content: `현재 페이지 컨텍스트:\n${context}`,
      }
    : null;

  const stream = await openai.chat.completions.create({
    model: "solar-pro2",
    stream: true,
    messages: [system, ...(ctx ? [ctx] : []), ...(messages ?? [])],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        controller.enqueue(encoder.encode("\n\n(스트리밍 오류)"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}