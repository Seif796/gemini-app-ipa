// API key can be set in Settings or via server
const FALLBACK_GEMINI_KEY = '';

// Detect default server host: if on mobile or local network, suggest local IP
const DEFAULT_SERVER_URL = 'http://192.168.1.17:5000';

export function getServerUrl() {
  return localStorage.getItem('aether_server_url') || DEFAULT_SERVER_URL;
}

export function setServerUrl(url) {
  if (url) {
    localStorage.setItem('aether_server_url', url.trim().replace(/\/$/, ''));
  } else {
    localStorage.removeItem('aether_server_url');
  }
}

export function getToken() {
  return localStorage.getItem('aether_auth_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('aether_auth_token', token);
  } else {
    localStorage.removeItem('aether_auth_token');
  }
}

export function getCustomApiKey() {
  return localStorage.getItem('aether_custom_gemini_key') || FALLBACK_GEMINI_KEY;
}

export function setCustomApiKey(key) {
  if (key) {
    localStorage.setItem('aether_custom_gemini_key', key.trim());
  } else {
    localStorage.removeItem('aether_custom_gemini_key');
  }
}

export function isGuestMode() {
  return localStorage.getItem('aether_guest_mode') === 'true';
}

export function setGuestMode(active) {
  if (active) {
    localStorage.setItem('aether_guest_mode', 'true');
  } else {
    localStorage.removeItem('aether_guest_mode');
  }
}

// Direct client-side Gemini API call (works directly on iPhone without needing server)
async function directGeminiCall(prompt, systemInstruction = '', history = [], model = 'gemini-flash-lite-latest') {
  const key = getCustomApiKey() || FALLBACK_GEMINI_KEY;
  const safeModel = (model.includes('2.0') || model.includes('1.5')) ? 'gemini-flash-lite-latest' : model;

  const contents = [];
  if (Array.isArray(history) && history.length > 0) {
    for (const h of history) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content || h.text || '' }]
      });
    }
  }
  contents.push({ role: 'user', parts: [{ text: prompt }] });

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.95
    }
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${safeModel}:generateContent?key=${key.trim()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini API returned ${res.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  return { reply: text, model: safeModel };
}

async function request(endpoint, options = {}) {
  const server = getServerUrl();
  const token = getToken();
  const customKey = getCustomApiKey();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${server}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Server returned ${response.status}`);
    }
    return data;
  } catch (err) {
    // If request failed because server is unreachable or offline
    if (err.name === 'AbortError' || err.message.includes('Load failed') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('SERVER_UNREACHABLE');
    }
    throw err;
  }
}

export const api = {
  // Auth
  async checkHealth() {
    return request('/api/health');
  },
  async login(email, password) {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(res.token);
    setGuestMode(false);
    return res;
  },
  async signup(name, email, password) {
    const res = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    setToken(res.token);
    setGuestMode(false);
    return res;
  },
  async getMe() {
    if (isGuestMode()) {
      return {
        user: {
          id: 'guest_user',
          name: 'iPhone Guest',
          email: 'guest@device.local',
          hasCustomApiKey: true
        }
      };
    }
    return request('/api/auth/me');
  },
  async updateSettings(settings) {
    if (isGuestMode()) return { success: true };
    return request('/api/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  // AI Chat (Direct device fallback if server is offline)
  async chat(message, history = [], model = 'gemini-flash-lite-latest') {
    try {
      if (!isGuestMode()) {
        return await request('/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({ message, history, model })
        });
      }
    } catch (err) {
      if (err.message !== 'SERVER_UNREACHABLE') throw err;
      // Fall through to direct call
    }

    // Direct fallback
    const systemPrompt = 'You are Seif Ai Test, a fast, elegant iOS personal productivity companion. Answer concisely with clear formatting.';
    return directGeminiCall(message, systemPrompt, history, model);
  },

  async breakdownTask(title, description) {
    try {
      if (!isGuestMode()) {
        return await request('/api/ai/breakdown-task', {
          method: 'POST',
          body: JSON.stringify({ title, description })
        });
      }
    } catch (err) {
      if (err.message !== 'SERVER_UNREACHABLE') throw err;
    }

    // Direct Gemini fallback
    const prompt = `Break down into 3-5 subtasks as JSON with structure {"subtasks":[{"title":"..."}],"proTip":"..."}: "${title}"`;
    const res = await directGeminiCall(prompt, 'Always output pure JSON.', [], 'gemini-flash-lite-latest');
    const clean = res.reply.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  },

  async enhanceNote(content, mode) {
    try {
      if (!isGuestMode()) {
        return await request('/api/ai/enhance-note', {
          method: 'POST',
          body: JSON.stringify({ content, mode })
        });
      }
    } catch (err) {
      if (err.message !== 'SERVER_UNREACHABLE') throw err;
    }

    const res = await directGeminiCall(`Enhance these notes (${mode}):\n${content}`, '', [], 'gemini-flash-lite-latest');
    return { enhanced: res.reply, mode };
  },

  // Notes (Local Storage fallback for instant offline access)
  async getNotes() {
    try {
      if (!isGuestMode()) return await request('/api/notes');
    } catch (e) {}
    const raw = localStorage.getItem('aether_local_notes');
    return { notes: raw ? JSON.parse(raw) : [] };
  },
  async saveNote(note) {
    try {
      if (!isGuestMode()) return await request('/api/notes', { method: 'POST', body: JSON.stringify(note) });
    } catch (e) {}
    const raw = localStorage.getItem('aether_local_notes');
    const list = raw ? JSON.parse(raw) : [];
    const n = { ...note, id: note.id || 'note_' + Date.now(), updatedAt: new Date().toISOString() };
    const idx = list.findIndex(x => x.id === n.id);
    if (idx !== -1) list[idx] = n; else list.unshift(n);
    localStorage.setItem('aether_local_notes', JSON.stringify(list));
    return { note: n };
  },
  async deleteNote(id) {
    try {
      if (!isGuestMode()) return await request(`/api/notes/${id}`, { method: 'DELETE' });
    } catch (e) {}
    const raw = localStorage.getItem('aether_local_notes');
    const list = raw ? JSON.parse(raw) : [];
    localStorage.setItem('aether_local_notes', JSON.stringify(list.filter(x => x.id !== id)));
    return { success: true };
  },

  // Tasks
  async getTasks() {
    try {
      if (!isGuestMode()) return await request('/api/tasks');
    } catch (e) {}
    const raw = localStorage.getItem('aether_local_tasks');
    return { tasks: raw ? JSON.parse(raw) : [] };
  },
  async saveTask(task) {
    try {
      if (!isGuestMode()) return await request('/api/tasks', { method: 'POST', body: JSON.stringify(task) });
    } catch (e) {}
    const raw = localStorage.getItem('aether_local_tasks');
    const list = raw ? JSON.parse(raw) : [];
    const t = { ...task, id: task.id || 'task_' + Date.now() };
    const idx = list.findIndex(x => x.id === t.id);
    if (idx !== -1) list[idx] = t; else list.unshift(t);
    localStorage.setItem('aether_local_tasks', JSON.stringify(list));
    return { task: t };
  },
  async deleteTask(id) {
    try {
      if (!isGuestMode()) return await request(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch (e) {}
    const raw = localStorage.getItem('aether_local_tasks');
    const list = raw ? JSON.parse(raw) : [];
    localStorage.setItem('aether_local_tasks', JSON.stringify(list.filter(x => x.id !== id)));
    return { success: true };
  },

  // Chats
  async getChats() {
    try {
      if (!isGuestMode()) return await request('/api/chats');
    } catch (e) {}
    const raw = localStorage.getItem('aether_local_chats');
    return { chats: raw ? JSON.parse(raw) : [] };
  },
  async clearChats() {
    try {
      if (!isGuestMode()) return await request('/api/chats', { method: 'DELETE' });
    } catch (e) {}
    localStorage.removeItem('aether_local_chats');
    return { success: true };
  }
};
