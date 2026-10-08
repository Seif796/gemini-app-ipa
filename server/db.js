const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

// Initial schema structure
const defaultData = {
  users: [],
  notes: [],
  tasks: [],
  chats: []
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db:', err);
    return defaultData;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db:', err);
  }
}

module.exports = {
  // User methods
  getUserByEmail: (email) => {
    const db = readDb();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  getUserById: (id) => {
    const db = readDb();
    return db.users.find(u => u.id === id);
  },
  createUser: (user) => {
    const db = readDb();
    db.users.push(user);
    writeDb(db);
    return user;
  },
  updateUserApiKey: (userId, geminiApiKey) => {
    const db = readDb();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      db.users[idx].geminiApiKey = geminiApiKey;
      writeDb(db);
      return db.users[idx];
    }
    return null;
  },

  // Notes methods
  getNotesByUser: (userId) => {
    const db = readDb();
    return (db.notes || []).filter(n => n.userId === userId).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },
  saveNote: (note) => {
    const db = readDb();
    if (!db.notes) db.notes = [];
    const idx = db.notes.findIndex(n => n.id === note.id);
    if (idx !== -1) {
      db.notes[idx] = { ...db.notes[idx], ...note, updatedAt: new Date().toISOString() };
      writeDb(db);
      return db.notes[idx];
    } else {
      const newNote = {
        ...note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.notes.push(newNote);
      writeDb(db);
      return newNote;
    }
  },
  deleteNote: (id, userId) => {
    const db = readDb();
    if (!db.notes) return false;
    db.notes = db.notes.filter(n => !(n.id === id && n.userId === userId));
    writeDb(db);
    return true;
  },

  // Tasks methods
  getTasksByUser: (userId) => {
    const db = readDb();
    return (db.tasks || []).filter(t => t.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  saveTask: (task) => {
    const db = readDb();
    if (!db.tasks) db.tasks = [];
    const idx = db.tasks.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      db.tasks[idx] = { ...db.tasks[idx], ...task, updatedAt: new Date().toISOString() };
      writeDb(db);
      return db.tasks[idx];
    } else {
      const newTask = {
        ...task,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.tasks.push(newTask);
      writeDb(db);
      return newTask;
    }
  },
  deleteTask: (id, userId) => {
    const db = readDb();
    if (!db.tasks) return false;
    db.tasks = db.tasks.filter(t => !(t.id === id && t.userId === userId));
    writeDb(db);
    return true;
  },

  // Chat message history methods
  getChatsByUser: (userId) => {
    const db = readDb();
    return (db.chats || []).filter(c => c.userId === userId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },
  addChatMessage: (msg) => {
    const db = readDb();
    if (!db.chats) db.chats = [];
    const message = {
      ...msg,
      id: msg.id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString()
    };
    db.chats.push(message);
    writeDb(db);
    return message;
  },
  clearChatsByUser: (userId) => {
    const db = readDb();
    if (!db.chats) return true;
    db.chats = db.chats.filter(c => c.userId !== userId);
    writeDb(db);
    return true;
  }
};
