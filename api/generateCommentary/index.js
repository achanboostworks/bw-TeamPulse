module.exports = async function (context, req) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY environment variable is not set." })
    };
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
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt || "Provide a summary." }]
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      context.res = {
        status: response.status || 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: data.error?.message || JSON.stringify(data.error) })
      };
      return;
    }

    const commentary = data.content?.[0]?.text || "No commentary returned.";

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentary })
    };
  } catch (err) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
