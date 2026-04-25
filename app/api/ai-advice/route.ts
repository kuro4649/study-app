export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
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
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OPENAI ERROR:", data);
      return Response.json(
        { text: `OpenAI APIエラー: ${data?.error?.message || "不明なエラー"}` },
        { status: 500 }
      );
    }

    return Response.json({
      text: data.choices[0].message.content,
    });
  } catch (error) {
    console.error("AI ADVICE ERROR:", error);
    return Response.json(
      { text: "AIアドバイス生成でエラーが発生しました。" },
      { status: 500 }
    );
  }
}