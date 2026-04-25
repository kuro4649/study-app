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
            content: "あなたはAWS SAP試験の問題作成者です。",
          },
          {
            role: "user",
            content: `
以下の弱点分野のAWS SAPレベル問題を1問作ってください。

弱点分野: ${body.category}

条件:
・長文問題
・選択肢A〜D
・正解
・なぜ正解か
・なぜ他が不正解か
・日本語
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
    console.error("AI QUESTION ERROR:", error);
    return Response.json(
      { text: "AI問題生成でエラーが発生しました。" },
      { status: 500 }
    );
  }
}