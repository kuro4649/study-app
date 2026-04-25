import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたはAWS SAP試験の学習アドバイザーです。",
        },
        {
          role: "user",
          content: `
残り日数: ${body.remainingDays}
残り時間: ${body.remainingHours}
弱点: ${body.weakCategories}
誤答理由: ${body.mistakeReasons}
復習件数: ${body.reviewCount}

次にやるべき学習を短く具体的に提案してください。
`,
        },
      ],
    });

    return Response.json({
      text: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("AI ADVICE ERROR:", error);
    return Response.json(
      { text: "AIアドバイス生成でエラーが発生しました。" },
      { status: 500 }
    );
  }
}