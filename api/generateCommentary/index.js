module.exports = async function (context, req) {
  const rawKey = process.env.ANTHROPIC_API_KEY;

  if (!rawKey) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY environment variable is not configured in Azure." })
    };
    return;
  }

  const apiKey = rawKey.trim();
  const { prompt } = req.body || {};

  try {
    // 1. Fetch available models for your specific API key
    const modelsRes = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      }
    });

    const modelsData = await modelsRes.json();

    if (!modelsRes.ok || !modelsData.data || modelsData.data.length === 0) {
      const errMsg = modelsData.error?.message || "No models available for this API key. Verify billing/credits at console.anthropic.com.";
      context.res = {
        status: modelsRes.status || 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: errMsg })
      };
      return;
    }

    // 2. Pick preferred model or fallback to first available
    const availableIds = modelsData.data.map(m => m.id);
    const chosenModel =
      availableIds.find(id => id.includes("3-5-sonnet") || id.includes("3-7-sonnet")) ||
      availableIds.find(id => id.includes("haiku")) ||
      availableIds[0];

    // 3. Generate commentary with the validated model
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: chosenModel,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt || "Provide a brief summary." }]
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      context.res = {
        status: response.status || 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: data.error?.message || `Failed with model: ${chosenModel}. Available models: ${availableIds.join(", ")}`
        })
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
