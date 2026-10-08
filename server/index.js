require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { callGeminiApi } = require('./geminiService');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-gemini-ios-companion-key-2026';

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Auth helper middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please sign in again.' });
  }
}

// ----------------- HEALTH & SYSTEM CHECK -----------------
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Gemini iOS Companion 24/7 API',
    hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

// ----------------- AUTHENTICATION -----------------
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name || email.split('@')[0],
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      geminiApiKey: '',
      createdAt: new Date().toISOString()
    };

    db.createUser(newUser);

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        hasCustomApiKey: Boolean(newUser.geminiApiKey),
        hasServerApiKey: Boolean(process.env.GEMINI_API_KEY)
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        hasCustomApiKey: Boolean(user.geminiApiKey),
        hasServerApiKey: Boolean(process.env.GEMINI_API_KEY)
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      hasCustomApiKey: Boolean(req.user.geminiApiKey),
      customApiKeyMasked: req.user.geminiApiKey ? `${req.user.geminiApiKey.substring(0, 4)}...${req.user.geminiApiKey.slice(-4)}` : null,
      hasServerApiKey: Boolean(process.env.GEMINI_API_KEY)
    }
  });
});

app.put('/api/auth/settings', authenticate, (req, res) => {
  try {
    const { geminiApiKey } = req.body;
    if (geminiApiKey !== undefined) {
      db.updateUserApiKey(req.user.id, (geminiApiKey || '').trim());
    }
    const updated = db.getUserById(req.user.id);
    res.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        hasCustomApiKey: Boolean(updated.geminiApiKey),
        customApiKeyMasked: updated.geminiApiKey ? `${updated.geminiApiKey.substring(0, 4)}...${updated.geminiApiKey.slice(-4)}` : null,
        hasServerApiKey: Boolean(process.env.GEMINI_API_KEY)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// Helper to determine the effective Gemini API key
function getEffectiveApiKey(req) {
  const headerKey = req.headers['x-gemini-api-key'];
  if (headerKey && headerKey.trim()) return headerKey.trim();
  if (req.user && req.user.geminiApiKey && req.user.geminiApiKey.trim()) return req.user.geminiApiKey.trim();
  return process.env.GEMINI_API_KEY || '';
}

// ----------------- GEMINI AI ENDPOINTS -----------------

// Chat with Gemini Companion
app.post('/api/ai/chat', authenticate, async (req, res) => {
  try {
    const { message, history, model } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const apiKey = getEffectiveApiKey(req);
    if (!apiKey) {
      return res.status(400).json({
        error: 'Gemini API key is not configured. Please paste your Gemini API key in the app Settings or configure the server.'
      });
    }

    const systemInstruction = `You are a high-caliber iOS Personal AI Productivity Companion named "Aether".
Your role is to assist the user proactively with task planning, clear thinking, summarizing notes, problem solving, and staying organized.
Keep your responses friendly, concise, elegant, and action-oriented. Format with clear Markdown bullet points or numbered lists where appropriate for mobile reading.`;

    const result = await callGeminiApi({
      prompt: message,
      systemInstruction,
      history: history || [],
      apiKey,
      model: model || 'gemini-3.8-flash'
    });

    // Save chat interaction to history
    db.addChatMessage({ userId: req.user.id, role: 'user', content: message });
    db.addChatMessage({ userId: req.user.id, role: 'model', content: result.text, model: result.model });

    res.json({
      reply: result.text,
      model: result.model
    });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate AI response.' });
  }
});

// AI Breakdown Task into Actionable Subtasks
app.post('/api/ai/breakdown-task', authenticate, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const apiKey = getEffectiveApiKey(req);
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API key is required. Check Settings.' });
    }

    const prompt = `Break down the following productivity goal/task into 3 to 6 clear, actionable, bite-sized checklist steps.
Task Title: "${title}"
${description ? `Details: "${description}"` : ''}

Respond ONLY with valid JSON in this exact structure without markdown backticks:
{
  "subtasks": [
    { "title": "Step 1 description" },
    { "title": "Step 2 description" }
  ],
  "estimatedTimeMinutes": 30,
  "proTip": "A short practical tip to accomplish this smoothly"
}`;

    const result = await callGeminiApi({
      prompt,
      systemInstruction: 'You are an expert productivity assistant. Always return pure JSON with no markdown wrapping.',
      apiKey,
      model: 'gemini-3.8-flash'
    });

    let parsed;
    try {
      const cleanJson = result.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      // Fallback parser if LLM included conversational text
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI task breakdown response.');
      }
    }

    res.json(parsed);
  } catch (err) {
    console.error('Task breakdown error:', err);
    res.status(500).json({ error: err.message || 'Failed to breakdown task.' });
  }
});

// AI Enhance Note (Summarize, Bullet points, Action items, Polish)
app.post('/api/ai/enhance-note', authenticate, async (req, res) => {
  try {
    const { content, mode } = req.body; // mode: 'summarize' | 'bullets' | 'actions' | 'polish'
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Note content is required.' });
    }

    const apiKey = getEffectiveApiKey(req);
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API key is required. Check Settings.' });
    }

    let instruction = '';
    switch (mode) {
      case 'summarize':
        instruction = 'Provide a punchy, 2-3 sentence executive summary of these notes.';
        break;
      case 'bullets':
        instruction = 'Convert these notes into structured, high-value bullet points with emojis.';
        break;
      case 'actions':
        instruction = 'Extract all concrete action items and next steps from these notes as a checklist.';
        break;
      case 'polish':
      default:
        instruction = 'Refine and polish these notes for clarity, professional tone, and excellent organization while preserving all key information.';
        break;
    }

    const prompt = `${instruction}\n\nContent:\n"""\n${content}\n"""`;

    const result = await callGeminiApi({
      prompt,
      systemInstruction: 'You are an executive note editor and productivity strategist.',
      apiKey,
      model: 'gemini-3.8-flash'
    });

    res.json({
      enhanced: result.text,
      mode
    });
  } catch (err) {
    console.error('Enhance note error:', err);
    res.status(500).json({ error: err.message || 'Failed to enhance note.' });
  }
});

// ----------------- NOTES CRUD -----------------
app.get('/api/notes', authenticate, (req, res) => {
  const notes = db.getNotesByUser(req.user.id);
  res.json({ notes });
});

app.post('/api/notes', authenticate, (req, res) => {
  const { id, title, content, tags, aiSummary } = req.body;
  const saved = db.saveNote({
    id: id || 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId: req.user.id,
    title: title || 'Untitled Note',
    content: content || '',
    tags: tags || [],
    aiSummary: aiSummary || ''
  });
  res.json({ note: saved });
});

app.delete('/api/notes/:id', authenticate, (req, res) => {
  const success = db.deleteNote(req.params.id, req.user.id);
  res.json({ success });
});

// ----------------- TASKS CRUD -----------------
app.get('/api/tasks', authenticate, (req, res) => {
  const tasks = db.getTasksByUser(req.user.id);
  res.json({ tasks });
});

app.post('/api/tasks', authenticate, (req, res) => {
  const { id, title, description, completed, priority, subtasks, dueDate } = req.body;
  const saved = db.saveTask({
    id: id || 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId: req.user.id,
    title: title || 'New Task',
    description: description || '',
    completed: Boolean(completed),
    priority: priority || 'medium', // low, medium, high
    subtasks: subtasks || [],
    dueDate: dueDate || null
  });
  res.json({ task: saved });
});

app.delete('/api/tasks/:id', authenticate, (req, res) => {
  const success = db.deleteTask(req.params.id, req.user.id);
  res.json({ success });
});

// ----------------- CHATS CRUD -----------------
app.get('/api/chats', authenticate, (req, res) => {
  const chats = db.getChatsByUser(req.user.id);
  res.json({ chats });
});

app.delete('/api/chats', authenticate, (req, res) => {
  db.clearChatsByUser(req.user.id);
  res.json({ success: true });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Gemini iOS Companion Server running 24/7 on port ${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/health`);
  console.log(`🔑 Server Default Gemini API Key: ${process.env.GEMINI_API_KEY ? 'CONFIGURED ✅' : 'NOT SET (Clients can provide in Settings) ⚠️'}`);
});
