/**
 * Service for communicating with Google Gemini API
 */
const DEFAULT_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.8-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];

async function callGeminiApi({ prompt, systemInstruction, history = [], apiKey, model = 'gemini-3.8-flash' }) {
  const activeKey = apiKey || process.env.GEMINI_API_KEY;

  if (!activeKey) {
    throw new Error('Gemini API key is not configured. Please provide it in Settings or set GEMINI_API_KEY in the server .env');
  }

  // Build contents array supporting conversational history
  const contents = [];

  // Add history messages
  if (Array.isArray(history) && history.length > 0) {
    for (const h of history) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content || h.text || '' }]
      });
    }
  }

  // Add current prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const requestBody = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  // Try requested model first, then fallback to other standard models if model not found
  const modelsToTry = [model, ...DEFAULT_MODELS.filter(m => m !== model)];
  let lastError = null;

  for (const m of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${activeKey.trim()}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        // If it's a model not found error, try fallback model
        if (response.status === 404 || errorMsg.includes('not found')) {
          lastError = new Error(`Model ${m} not found: ${errorMsg}`);
          continue;
        }
        throw new Error(errorMsg);
      }

      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.map(p => p.text).join('') || '';
      return {
        text,
        model: m,
        usage: data.usageMetadata
      };
    } catch (err) {
      lastError = err;
      // If error is an auth failure or bad request, don't keep cycling models
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('quota'))) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini API');
}

module.exports = {
  callGeminiApi
};
