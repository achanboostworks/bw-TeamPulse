module.exports = async function (context, req) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    context.res = { status: 500, body: "ANTHROPIC_API_KEY is not configured." };
    return;
  }

  const { prompt } = req.body || {};

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt || "Generate brief commentary." }]
      })
    });

    const data = await response.json();
    const commentary = data.content?.[0]?.text || "";

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { commentary }
    };
  } catch (err) {
    context.res = { status: 500, body: err.message };
  }
};
