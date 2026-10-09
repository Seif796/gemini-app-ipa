import { directGeminiCall } from './api';
import { playNotificationSound } from './notifications';

const MASTER_REGISTRY_ID = 'ff808181a09d98f701a122e81b8f31c6';
const CLOUD_URL = `https://api.restful-api.dev/objects/${MASTER_REGISTRY_ID}`;

// Local storage keys
const KEY_USERNAME = 'seif_username';
const KEY_LOCAL_REGISTRY = 'seif_local_registry_cache';

// In-memory cache
let registryCache = null;
let lastFetchTime = 0;

export function getCurrentUsername() {
  return localStorage.getItem(KEY_USERNAME) || '';
}

export function setCurrentUsername(username) {
  if (username) {
    localStorage.setItem(KEY_USERNAME, username.toLowerCase().trim());
  } else {
    localStorage.removeItem(KEY_USERNAME);
  }
}

// Fetch master registry from Cloud with fallback to local cache
export async function getMasterRegistry(force = false) {
  const now = Date.now();
  if (!force && registryCache && (now - lastFetchTime < 2500)) {
    return registryCache;
  }

  try {
    const res = await fetch(CLOUD_URL);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        registryCache = {
          users: json.data.users || {},
          friendRequests: json.data.friendRequests || [],
          friendships: json.data.friendships || {},
          chatRooms: json.data.chatRooms || {},
          botSettings: json.data.botSettings || {}
        };
        lastFetchTime = now;
        localStorage.setItem(KEY_LOCAL_REGISTRY, JSON.stringify(registryCache));
        return registryCache;
      }
    }
  } catch (err) {
    console.warn('Could not fetch cloud registry, using local cache:', err);
  }

  // Fallback to local cache
  if (!registryCache) {
    const local = localStorage.getItem(KEY_LOCAL_REGISTRY);
    if (local) {
      try { registryCache = JSON.parse(local); } catch (_) {}
    }
  }

  if (!registryCache) {
    registryCache = {
      users: {},
      friendRequests: [],
      friendships: {},
      chatRooms: {},
      botSettings: {}
    };
  }

  return registryCache;
}

// Save master registry to Cloud
export async function saveMasterRegistry(data) {
  registryCache = data;
  localStorage.setItem(KEY_LOCAL_REGISTRY, JSON.stringify(data));
  lastFetchTime = Date.now();

  try {
    await fetch(CLOUD_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'seif_ai_master_registry_v1',
        data: {
          users: data.users || {},
          friendRequests: data.friendRequests || [],
          friendships: data.friendships || {},
          chatRooms: data.chatRooms || {},
          botSettings: data.botSettings || {},
          updatedAt: new Date().toISOString()
        }
      })
    });
  } catch (err) {
    console.warn('Could not sync to cloud registry:', err);
  }

  return registryCache;
}

// 1. User Registration / Permanent Sign-In
export async function registerOrLoginUsername(rawUsername, isExistingLogin = false) {
  const username = rawUsername.toLowerCase().trim();
  if (!username) {
    throw new Error('يرجى إدخال اسم المستخدم');
  }
  if (username.length < 2) {
    throw new Error('اسم المستخدم يجب أن يكون حرفين على الأقل');
  }
  if (!/^[a-zA-Z0-9_\u0600-\u06FF]+$/.test(username)) {
    throw new Error('اسم المستخدم يجب ألا يحتوي على مسافات أو رموز خاصة');
  }

  const registry = await getMasterRegistry(true);

  if (isExistingLogin) {
    // Logging into an existing account
    if (!registry.users[username]) {
      throw new Error(`اسم المستخدم @${username} غير مسجل مسبقاً!`);
    }
    setCurrentUsername(username);
    return registry.users[username];
  }

  // New user registration
  if (registry.users[username]) {
    throw new Error('اسم المستخدم هذا موجود بالفعل! اختر اسماً آخر.');
  }

  // Create user
  registry.users[username] = {
    username,
    createdAt: new Date().toISOString()
  };

  await saveMasterRegistry(registry);
  setCurrentUsername(username);
  return registry.users[username];
}

// 2. Send Friend Request
export async function sendFriendRequest(targetUsername) {
  const myUsername = getCurrentUsername();
  if (!myUsername) throw new Error('يرجى تسجيل الدخول أولاً');

  const cleanTarget = targetUsername.toLowerCase().trim();
  if (!cleanTarget) throw new Error('يرجى إدخال اسم الصديق');

  if (cleanTarget === myUsername) {
    throw new Error('لا يمكنك إرسال طلب صداقة لنفسك!');
  }

  const registry = await getMasterRegistry(true);

  if (!registry.users[cleanTarget]) {
    throw new Error(`المستخدم @${cleanTarget} غير موجود! تأكد من الاسم.`);
  }

  // Check if already friends
  const myFriends = registry.friendships[myUsername] || [];
  if (myFriends.includes(cleanTarget)) {
    throw new Error(`أنت و @${cleanTarget} أصدقاء بالفعل!`);
  }

  // Check if pending request exists
  const existingReq = (registry.friendRequests || []).find(
    r => ((r.from === myUsername && r.to === cleanTarget) || (r.from === cleanTarget && r.to === myUsername)) && r.status === 'pending'
  );

  if (existingReq) {
    if (existingReq.from === myUsername) {
      throw new Error('تم إرسال طلب صداقة لهذا المستخدم مسبقاً وبانتظار قبوله!');
    } else {
      throw new Error(`المستخدم @${cleanTarget} قد أرسل لك طلب صداقة بالفعل! تحقق من طلبات الصداقة لقبوله.`);
    }
  }

  const newRequest = {
    id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    from: myUsername,
    to: cleanTarget,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  registry.friendRequests = registry.friendRequests || [];
  registry.friendRequests.push(newRequest);

  await saveMasterRegistry(registry);
  return newRequest;
}

// 3. Accept Friend Request
export async function acceptFriendRequest(requestId) {
  const myUsername = getCurrentUsername();
  const registry = await getMasterRegistry(true);

  const req = (registry.friendRequests || []).find(r => r.id === requestId);
  if (!req) throw new Error('طلب الصداقة غير موجود');

  req.status = 'accepted';

  // Add friendship both ways
  registry.friendships = registry.friendships || {};
  registry.friendships[req.from] = registry.friendships[req.from] || [];
  registry.friendships[req.to] = registry.friendships[req.to] || [];

  if (!registry.friendships[req.from].includes(req.to)) {
    registry.friendships[req.from].push(req.to);
  }
  if (!registry.friendships[req.to].includes(req.from)) {
    registry.friendships[req.to].push(req.from);
  }

  await saveMasterRegistry(registry);
  playNotificationSound();
  return req;
}

// 4. Reject Friend Request
export async function rejectFriendRequest(requestId) {
  const registry = await getMasterRegistry(true);
  const req = (registry.friendRequests || []).find(r => r.id === requestId);
  if (req) {
    req.status = 'rejected';
    await saveMasterRegistry(registry);
  }
  return true;
}

// 5. Get User Friends & Requests
export async function getFriendsData() {
  const myUsername = getCurrentUsername();
  if (!myUsername) return { friends: [], incomingRequests: [], outgoingRequests: [] };

  const registry = await getMasterRegistry();

  const friends = registry.friendships[myUsername] || [];

  const incomingRequests = (registry.friendRequests || []).filter(
    r => r.to === myUsername && r.status === 'pending'
  );

  const outgoingRequests = (registry.friendRequests || []).filter(
    r => r.from === myUsername && r.status === 'pending'
  );

  return { friends, incomingRequests, outgoingRequests };
}

// Helper: Room key for 2 users
export function getChatRoomKey(user1, user2) {
  return [user1.toLowerCase().trim(), user2.toLowerCase().trim()].sort().join('___');
}

// 6. Get Chat Messages
export async function getChatMessages(friendUsername) {
  const myUsername = getCurrentUsername();
  const roomKey = getChatRoomKey(myUsername, friendUsername);
  const registry = await getMasterRegistry();

  const messages = registry.chatRooms[roomKey] || [];
  const isBotEnabled = Boolean(registry.botSettings?.[roomKey]);

  return { messages, isBotEnabled };
}

// 7. Toggle Bot in Chat Room
export async function toggleBotInChat(friendUsername) {
  const myUsername = getCurrentUsername();
  const roomKey = getChatRoomKey(myUsername, friendUsername);
  const registry = await getMasterRegistry(true);

  registry.botSettings = registry.botSettings || {};
  const current = Boolean(registry.botSettings[roomKey]);
  registry.botSettings[roomKey] = !current;

  // Add system notice message in chat
  registry.chatRooms = registry.chatRooms || {};
  registry.chatRooms[roomKey] = registry.chatRooms[roomKey] || [];
  registry.chatRooms[roomKey].push({
    id: 'sys_' + Date.now(),
    sender: 'system',
    text: !current ? '🤖 تم تفعيل البوت الذكي (Seif AI) في المحادثة! يمكنك توجيه أي سؤال له.' : 'تم إيقاف البوت الذكي من المحادثة.',
    timestamp: Date.now(),
    isSystem: true
  });

  await saveMasterRegistry(registry);
  return !current;
}

// 8. Send Message in Friend Chat (with AI Bot integration)
export async function sendFriendMessage(friendUsername, text) {
  const myUsername = getCurrentUsername();
  if (!myUsername) throw new Error('يرجى تسجيل الدخول أولاً');

  const cleanText = text.trim();
  if (!cleanText) return null;

  const roomKey = getChatRoomKey(myUsername, friendUsername);
  const registry = await getMasterRegistry(true);

  registry.chatRooms = registry.chatRooms || {};
  registry.chatRooms[roomKey] = registry.chatRooms[roomKey] || [];

  const userMsg = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    sender: myUsername,
    text: cleanText,
    timestamp: Date.now(),
    isBot: false
  };

  registry.chatRooms[roomKey].push(userMsg);
  await saveMasterRegistry(registry);

  // Check if Bot is enabled or mentioned
  const isBotEnabled = Boolean(registry.botSettings?.[roomKey]);
  const isBotMentioned = cleanText.toLowerCase().includes('@bot') || cleanText.includes('@بوت') || cleanText.includes('@ai');

  if (isBotEnabled || isBotMentioned) {
    // Generate AI Bot reply asynchronously
    triggerBotResponse(roomKey, myUsername, friendUsername, cleanText);
  }

  return userMsg;
}

// Async Bot Responder
async function triggerBotResponse(roomKey, sender, friend, prompt) {
  try {
    const systemPrompt = `You are "Seif AI Bot", an intelligent, friendly AI assistant participating in a group chat between two friends: @${sender} and @${friend}.
Answer naturally, helpfully, and concisely in the same language they are speaking (Arabic/English).
Keep answers punchy and fun for chat.`;

    const res = await directGeminiCall(prompt, systemPrompt, [], 'gemini-flash-lite-latest');
    const botReply = res?.reply;

    if (botReply) {
      const freshRegistry = await getMasterRegistry(true);
      freshRegistry.chatRooms = freshRegistry.chatRooms || {};
      freshRegistry.chatRooms[roomKey] = freshRegistry.chatRooms[roomKey] || [];

      freshRegistry.chatRooms[roomKey].push({
        id: 'bot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        sender: 'Seif AI Bot 🤖',
        text: botReply,
        timestamp: Date.now(),
        isBot: true
      });

      await saveMasterRegistry(freshRegistry);
      playNotificationSound();
    }
  } catch (err) {
    console.warn('Bot auto-reply error:', err);
  }
}
