const DEFAULT_SERVER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : window.location.origin;

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
  return localStorage.getItem('aether_custom_gemini_key') || '';
}

export function setCustomApiKey(key) {
  if (key) {
    localStorage.setItem('aether_custom_gemini_key', key.trim());
  } else {
    localStorage.removeItem('aether_custom_gemini_key');
  }
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

  const response = await fetch(`${server}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Server returned ${response.status}`);
  }

  return data;
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
    return res;
  },
  async signup(name, email, password) {
    const res = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    setToken(res.token);
    return res;
  },
  async getMe() {
    return request('/api/auth/me');
  },
  async updateSettings(settings) {
    return request('/api/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  // AI
  async chat(message, history = [], model = 'gemini-2.0-flash') {
    return request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, model })
    });
  },
  async breakdownTask(title, description) {
    return request('/api/ai/breakdown-task', {
      method: 'POST',
      body: JSON.stringify({ title, description })
    });
  },
  async enhanceNote(content, mode) {
    return request('/api/ai/enhance-note', {
      method: 'POST',
      body: JSON.stringify({ content, mode })
    });
  },

  // Notes
  async getNotes() {
    return request('/api/notes');
  },
  async saveNote(note) {
    return request('/api/notes', {
      method: 'POST',
      body: JSON.stringify(note)
    });
  },
  async deleteNote(id) {
    return request(`/api/notes/${id}`, {
      method: 'DELETE'
    });
  },

  // Tasks
  async getTasks() {
    return request('/api/tasks');
  },
  async saveTask(task) {
    return request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    });
  },
  async deleteTask(id) {
    return request(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
  },

  // Chat History
  async getChats() {
    return request('/api/chats');
  },
  async clearChats() {
    return request('/api/chats', {
      method: 'DELETE'
    });
  }
};
