// Bypass self-signed / enterprise proxy certificate errors (VPN / Antivirus / Windows SSL interception)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
try {
  const { Agent, setGlobalDispatcher } = require('undici');
  setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: false } }));
} catch (e) {}

/**
 * High-speed active Gemini models (Sub-1s latency)
 */
const DEFAULT_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash'
];

/**
 * Automatically maps any outdated/retired model to the lightning-fast active model
 */
function normalizeModel(model) {
  if (!model) return 'gemini-flash-lite-latest';
  const m = String(model).toLowerCase();
  if (m.includes('2.0') || m.includes('1.5') || m.includes('2.5') || m.includes('flash-pro')) {
    return 'gemini-flash-lite-latest';
  }
  return model;
}

async function callGeminiApi({ prompt, systemInstruction, history = [], apiKey, model = 'gemini-flash-lite-latest' }) {
  const activeKey = apiKey || process.env.GEMINI_API_KEY;

  if (!activeKey) {
    throw new Error('Gemini API key is not configured. Please provide it in Settings or set GEMINI_API_KEY in the server .env');
  }

  const safeModel = normalizeModel(model);

  // Build contents array supporting conversational history
  const contents = [];

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
      maxOutputTokens: 1024,
      topP: 0.95
    }
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  // Cycle through active high-speed models
  const modelsToTry = [safeModel, ...DEFAULT_MODELS.filter(m => m !== safeModel)];
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
        if (response.status === 404 || errorMsg.includes('not found') || errorMsg.includes('no longer available') || errorMsg.includes('not supported')) {
          lastError = new Error(`Model ${m} unavailable: ${errorMsg}`);
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
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('quota'))) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini API');
}

module.exports = {
  callGeminiApi,
  normalizeModel
};
