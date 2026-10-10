import { directGeminiCall } from './api';
import { playNotificationSound } from './notifications';
import { getTranslation } from './i18n';

const MASTER_REGISTRY_ID = 'ff808181a09d98f701a122e81b8f31c6';
const CLOUD_URL = `https://api.restful-api.dev/objects/${MASTER_REGISTRY_ID}`;

// Local storage keys
const KEY_USERNAME = 'seif_username';
const KEY_LOCAL_REGISTRY = 'seif_local_registry_cache';

// In-memory cache
let registryCache = null;
let lastFetchTime = 0;

export function getCurrentUsername() {
  try {
    return localStorage.getItem(KEY_USERNAME) || '';
  } catch (_) {
    return '';
  }
}

export function setCurrentUsername(username) {
  try {
    if (username) {
      localStorage.setItem(KEY_USERNAME, username.toLowerCase().trim());
    } else {
      localStorage.removeItem(KEY_USERNAME);
    }
  } catch (_) {}
}

// Helper: Normalize registry structure safely
function sanitizeRegistry(raw) {
  const d = raw || {};
  return {
    users: (d.users && typeof d.users === 'object' && !Array.isArray(d.users)) ? d.users : {},
    friendRequests: Array.isArray(d.friendRequests) ? d.friendRequests : [],
    friendships: (d.friendships && typeof d.friendships === 'object' && !Array.isArray(d.friendships)) ? d.friendships : {},
    chatRooms: (d.chatRooms && typeof d.chatRooms === 'object' && !Array.isArray(d.chatRooms)) ? d.chatRooms : {},
    botSettings: (d.botSettings && typeof d.botSettings === 'object' && !Array.isArray(d.botSettings)) ? d.botSettings : {}
  };
}

// Fetch master registry with strict 2-second timeout and instant local fallback
export async function getMasterRegistry(force = false) {
  const now = Date.now();
  if (!force && registryCache && (now - lastFetchTime < 3000)) {
    return registryCache;
  }

  // Load local cache first so we always have something valid
  if (!registryCache) {
    const local = localStorage.getItem(KEY_LOCAL_REGISTRY);
    if (local) {
      try {
        registryCache = sanitizeRegistry(JSON.parse(local));
      } catch (_) {}
    }
  }

  if (!registryCache) {
    registryCache = sanitizeRegistry({});
  }

  // Attempt non-blocking fast cloud sync (max 2 seconds timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(CLOUD_URL, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        registryCache = sanitizeRegistry(json.data);
        try {
          localStorage.setItem(KEY_LOCAL_REGISTRY, JSON.stringify(registryCache));
        } catch (_) {}
        return registryCache;
      }
    }
  } catch (err) {
    // Cloud slow or offline, continue with local cache smoothly
  }

  return registryCache;
}

// Save master registry to local cache immediately and sync to cloud in background
export async function saveMasterRegistry(data) {
  const cleanData = sanitizeRegistry(data);
  registryCache = cleanData;
  try {
    localStorage.setItem(KEY_LOCAL_REGISTRY, JSON.stringify(cleanData));
  } catch (_) {}
  lastFetchTime = Date.now();

  // Background Cloud Sync - Never blocks UI
  (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      await fetch(CLOUD_URL, {
        method: 'PUT',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'seif_ai_master_registry_v1',
          data: {
            ...cleanData,
            updatedAt: new Date().toISOString()
          }
        })
      });
      clearTimeout(timeoutId);
    } catch (err) {
      // Ignore background sync errors, local cache remains safe
    }
  })();

  return registryCache;
}

// 1. User Registration / Permanent Sign-In
export async function registerOrLoginUsername(rawUsername, isExistingLogin = false) {
  const t = getTranslation();
  const username = (rawUsername || '').toLowerCase().replace(/^@+/, '').trim();
  if (!username) {
    throw new Error(t.errEmptyUsername || 'يرجى إدخال اسم المستخدم');
  }
  if (username.length < 2) {
    throw new Error(t.errUsernameTooShort || 'اسم المستخدم يجب أن يكون حرفين على الأقل');
  }
  if (!/^[a-zA-Z0-9_\u0600-\u06FF]+$/.test(username)) {
    throw new Error(t.errInvalidUsernameChars || 'اسم المستخدم يجب ألا يحتوي على مسافات أو رموز خاصة');
  }

  const registry = await getMasterRegistry(true);

  if (isExistingLogin) {
    // Logging into an existing account
    if (!registry.users || !registry.users[username]) {
      throw new Error(t.errUsernameNotRegistered || `اسم المستخدم @${username} غير مسجل مسبقاً!`);
    }
    setCurrentUsername(username);
    return registry.users[username];
  }

  // New user registration
  if (registry.users && registry.users[username]) {
    throw new Error(t.errUsernameTaken || 'اسم المستخدم هذا موجود بالفعل! اختر اسماً آخر.');
  }

  // Create user
  registry.users = registry.users || {};
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
  const t = getTranslation();
  const myUsername = getCurrentUsername();
  if (!myUsername) throw new Error(t.errEmptyUsername || 'يرجى تسجيل الدخول أولاً');

  const cleanTarget = (targetUsername || '').toLowerCase().replace(/^@+/, '').trim();
  if (!cleanTarget) throw new Error(t.errEmptyUsername || 'يرجى إدخال اسم الصديق');

  if (cleanTarget === myUsername) {
    throw new Error(t.errCannotAddSelf || 'لا يمكنك إرسال طلب صداقة لنفسك!');
  }

  const registry = await getMasterRegistry(true);

  // Validate that user exists in registry
  if (!registry.users || !registry.users[cleanTarget]) {
    throw new Error(t.errUsernameNotFound || `الاسم غير موجود! تأكد من كتابة اسم المستخدم @${cleanTarget} بشكل صحيح.`);
  }

  // Check if already friends
  const myFriends = (registry.friendships && registry.friendships[myUsername]) || [];
  if (myFriends.includes(cleanTarget)) {
    throw new Error(t.errAlreadyFriends || `أنت و @${cleanTarget} أصدقاء بالفعل!`);
  }

  // Check if pending request exists
  const existingReq = (registry.friendRequests || []).find(
    r => ((r.from === myUsername && r.to === cleanTarget) || (r.from === cleanTarget && r.to === myUsername)) && r.status === 'pending'
  );

  if (existingReq) {
    if (existingReq.from === myUsername) {
      throw new Error(t.errRequestAlreadyPending || 'تم إرسال طلب صداقة لهذا المستخدم مسبقاً وبانتظار قبوله!');
    } else {
      throw new Error(t.errTargetAlreadyRequested || `المستخدم @${cleanTarget} قد أرسل لك طلب صداقة بالفعل! تحقق من طلبات الصداقة لقبوله.`);
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

  const friendships = (registry && registry.friendships) ? registry.friendships : {};
  const rawFriends = friendships[myUsername];
  const friends = Array.isArray(rawFriends) ? rawFriends : [];

  const rawReqs = (registry && Array.isArray(registry.friendRequests)) ? registry.friendRequests : [];
  const incomingRequests = rawReqs.filter(
    r => r && r.to === myUsername && r.status === 'pending'
  );

  const outgoingRequests = rawReqs.filter(
    r => r && r.from === myUsername && r.status === 'pending'
  );

  return { friends, incomingRequests, outgoingRequests };
}

// Helper: Room key for 2 users
export function getChatRoomKey(user1, user2) {
  const u1 = (user1 || '').toLowerCase().trim();
  const u2 = (user2 || '').toLowerCase().trim();
  return [u1, u2].sort().join('___');
}

// 6. Get Chat Messages
export async function getChatMessages(friendUsername) {
  if (!friendUsername) return { messages: [], isBotEnabled: false };
  const myUsername = getCurrentUsername();
  const roomKey = getChatRoomKey(myUsername, friendUsername);
  const registry = await getMasterRegistry();

  const chatRooms = (registry && registry.chatRooms) ? registry.chatRooms : {};
  const rawMessages = chatRooms[roomKey];
  const messages = Array.isArray(rawMessages) ? rawMessages : [];
  const isBotEnabled = Boolean(registry && registry.botSettings && registry.botSettings[roomKey]);

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
    }
  } catch (err) {
    console.warn('Bot auto-reply error:', err);
  }
}

// 9. Real-Time DM Message Watcher & Notification Trigger
const seenMessageIds = new Set();
let isWatcherInitialized = false;

export function initDmWatcherWithExistingMessages(registry) {
  if (isWatcherInitialized) return;
  const myUsername = getCurrentUsername();
  if (!myUsername) return;

  const chatRooms = (registry && registry.chatRooms) ? registry.chatRooms : {};
  for (const [roomKey, msgs] of Object.entries(chatRooms)) {
    if (roomKey.split('___').includes(myUsername) && Array.isArray(msgs)) {
      for (const m of msgs) {
        if (m && m.id) {
          seenMessageIds.add(m.id);
        }
      }
    }
  }
  isWatcherInitialized = true;
}

export async function checkNewIncomingDmMessages() {
  const myUsername = getCurrentUsername();
  if (!myUsername) return [];

  const registry = await getMasterRegistry(true);
  if (!registry) return [];

  if (!isWatcherInitialized) {
    initDmWatcherWithExistingMessages(registry);
    return [];
  }

  const incoming = [];
  const chatRooms = (registry && registry.chatRooms) ? registry.chatRooms : {};

  for (const [roomKey, msgs] of Object.entries(chatRooms)) {
    const participants = roomKey.split('___');
    if (!participants.includes(myUsername) || !Array.isArray(msgs)) continue;

    for (const m of msgs) {
      if (!m || !m.id) continue;
      if (!seenMessageIds.has(m.id)) {
        seenMessageIds.add(m.id);
        if (m.sender && m.sender !== myUsername && !m.isSystem) {
          incoming.push({
            id: m.id,
            roomKey,
            sender: m.sender,
            text: m.text || '',
            timestamp: m.timestamp || Date.now(),
            isBot: Boolean(m.isBot)
          });
        }
      }
    }
  }

  return incoming;
}


