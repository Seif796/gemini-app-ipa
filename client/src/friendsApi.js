import { directGeminiCall } from './api';
import { notifications, playNotificationSound } from './notifications';
import { getTranslation } from './i18n';
import { findNearbyFriends, getLastKnownLocation } from './locationService';

// Local storage keys
const KEY_USERNAME = 'seif_username';
const KEY_REGISTRY = 'seif_local_registry_v3';

// ntfy.sh Real-Time Cloud Sync Prefix (Free, unlimited, zero credentials required)
const NTFY_PREFIX = 'https://ntfy.sh/seif_companion_';

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

// ---------------- LOCAL REGISTRY HELPERS ----------------

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

export function getLocalRegistry() {
  try {
    const raw = localStorage.getItem(KEY_REGISTRY);
    if (raw) {
      return sanitizeRegistry(JSON.parse(raw));
    }
  } catch (_) {}
  const empty = sanitizeRegistry({});
  saveLocalRegistry(empty);
  return empty;
}

export function saveLocalRegistry(registry) {
  try {
    localStorage.setItem(KEY_REGISTRY, JSON.stringify(registry));
  } catch (_) {}
  return registry;
}

// Publish event to a cloud topic via ntfy.sh (fire & forget, non-blocking)
async function publishCloudEvent(topic, data) {
  try {
    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), 3000);
    await fetch(`${NTFY_PREFIX}${topic}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    clearTimeout(tId);
  } catch (_) {
    // Non-blocking sync failure is safe
  }
}

// Poll cloud inbox events for current user
async function pollCloudInbox(username) {
  if (!username) return [];
  try {
    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${NTFY_PREFIX}inbox_${username}/json?poll=1&since=all`, {
      signal: controller.signal
    });
    clearTimeout(tId);

    if (!res.ok) return [];
    const text = await res.text();
    if (!text.trim()) return [];

    const lines = text.trim().split('\n');
    const events = [];
    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        if (item && item.message) {
          const payload = typeof item.message === 'string' ? JSON.parse(item.message) : item.message;
          events.push(payload);
        }
      } catch (_) {}
    }
    return events;
  } catch (_) {
    return [];
  }
}

// ---------------- 1. USER AUTH / REGISTRATION ----------------

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

  const registry = getLocalRegistry();
  registry.users = registry.users || {};

  const userObj = {
    username,
    createdAt: new Date().toISOString(),
    lastActive: Date.now()
  };

  registry.users[username] = userObj;
  saveLocalRegistry(registry);
  setCurrentUsername(username);

  // Announce user on cloud
  publishCloudEvent('users_v3', { type: 'user_active', username });

  return userObj;
}

// ---------------- 2. FRIEND REQUESTS ----------------

export async function sendFriendRequest(targetUsername) {
  const t = getTranslation();
  const myUsername = getCurrentUsername();
  if (!myUsername) throw new Error(t.errEmptyUsername || 'يرجى تسجيل الدخول أولاً');

  const cleanTarget = (targetUsername || '').toLowerCase().replace(/^@+/, '').trim();
  if (!cleanTarget) throw new Error(t.errEmptyUsername || 'يرجى إدخال اسم الصديق');

  if (cleanTarget.length < 2) {
    throw new Error(t.errUsernameTooShort || 'اسم المستخدم يجب أن يكون حرفين على الأقل');
  }

  if (cleanTarget === myUsername) {
    throw new Error(t.errCannotAddSelf || 'لا يمكنك إرسال طلب صداقة لنفسك!');
  }

  const registry = getLocalRegistry();

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

  // Auto-register target in local user registry
  registry.users = registry.users || {};
  if (!registry.users[cleanTarget]) {
    registry.users[cleanTarget] = { username: cleanTarget };
  }

  saveLocalRegistry(registry);

  // Send real-time notification to the target user via their cloud inbox
  publishCloudEvent(`inbox_${cleanTarget}`, {
    type: 'friend_request',
    request: newRequest,
    from: myUsername,
    time: Date.now()
  });

  // Announce friendship intent to global registry
  publishCloudEvent('users_v3', {
    type: 'user_active',
    username: cleanTarget
  });

  return newRequest;
}

// ---------------- 3. ACCEPT FRIEND REQUEST ----------------

export async function acceptFriendRequest(requestId) {
  const myUsername = getCurrentUsername();
  const registry = getLocalRegistry();

  const req = (registry.friendRequests || []).find(r => r.id === requestId);
  if (!req) throw new Error('طلب الصداقة غير موجود');

  req.status = 'accepted';
  req.acceptedAt = Date.now();

  const friendUsername = req.from === myUsername ? req.to : req.from;

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

  // Create initial room message
  const roomKey = getChatRoomKey(myUsername, friendUsername);
  registry.chatRooms = registry.chatRooms || {};
  if (!registry.chatRooms[roomKey] || registry.chatRooms[roomKey].length === 0) {
    registry.chatRooms[roomKey] = [
      {
        id: 'sys_' + Date.now(),
        sender: 'system',
        text: `🎉 أنتم الآن أصدقاء! ابدأ المحادثة الآن، ويمكنك كتابة @gemini لسؤال الذكاء الاصطناعي في أي وقت.`,
        timestamp: Date.now(),
        isSystem: true
      }
    ];
  }

  saveLocalRegistry(registry);

  // Send celebratory notification to User A (the one accepting)
  try {
    notifications.sendNow('🎉 مبروك!', `قبلت صديقك @${friendUsername} وأصبحتم أصدقاء الآن! ابدأ الدردشة معه 🤝`);
  } catch (_) {}

  // Send celebratory event to User B (the sender of the request)
  publishCloudEvent(`inbox_${req.from}`, {
    type: 'friend_accepted',
    by: myUsername,
    requestId: req.id,
    time: Date.now()
  });

  return { req, friend: friendUsername };
}

// ---------------- 4. REJECT FRIEND REQUEST ----------------

export async function rejectFriendRequest(requestId) {
  const myUsername = getCurrentUsername();
  const registry = getLocalRegistry();
  const req = (registry.friendRequests || []).find(r => r.id === requestId);
  if (req) {
    req.status = 'rejected';
    saveLocalRegistry(registry);

    // Notify the sender so their outgoing pending list clears
    publishCloudEvent(`inbox_${req.from}`, {
      type: 'friend_rejected',
      by: myUsername,
      requestId: req.id,
      time: Date.now()
    });
  }
  return true;
}

// ---------------- 5. GET USER FRIENDS & REQUESTS ----------------

export async function getFriendsData() {
  const myUsername = getCurrentUsername();
  if (!myUsername) return { friends: [], incomingRequests: [], outgoingRequests: [] };

  const registry = getLocalRegistry();

  const friendships = registry.friendships || {};
  const rawFriends = friendships[myUsername];
  const friends = Array.isArray(rawFriends) ? rawFriends : [];

  const rawReqs = Array.isArray(registry.friendRequests) ? registry.friendRequests : [];
  const incomingRequests = rawReqs.filter(
    r => r && r.to === myUsername && r.status === 'pending'
  );
  const outgoingRequests = rawReqs.filter(
    r => r && r.from === myUsername && r.status === 'pending'
  );

  return { friends, incomingRequests, outgoingRequests };
}

// ---------------- 6. CHAT ROOMS & MESSAGES ----------------

export function getChatRoomKey(user1, user2) {
  const u1 = (user1 || '').toLowerCase().trim();
  const u2 = (user2 || '').toLowerCase().trim();
  return [u1, u2].sort().join('___');
}

export async function getChatMessages(friendUsername) {
  if (!friendUsername) return { messages: [], isBotEnabled: false };
  const myUsername = getCurrentUsername();
  const roomKey = getChatRoomKey(myUsername, friendUsername);
  const registry = getLocalRegistry();

  const chatRooms = registry.chatRooms || {};
  const rawMessages = chatRooms[roomKey];
  const messages = Array.isArray(rawMessages) ? rawMessages : [];
  const isBotEnabled = Boolean(registry.botSettings && registry.botSettings[roomKey]);

  return { messages, isBotEnabled };
}

export async function toggleBotInChat(friendUsername) {
  const myUsername = getCurrentUsername();
  const roomKey = getChatRoomKey(myUsername, friendUsername);
  const registry = getLocalRegistry();

  registry.botSettings = registry.botSettings || {};
  const current = Boolean(registry.botSettings[roomKey]);
  registry.botSettings[roomKey] = !current;

  registry.chatRooms = registry.chatRooms || {};
  registry.chatRooms[roomKey] = registry.chatRooms[roomKey] || [];
  registry.chatRooms[roomKey].push({
    id: 'sys_' + Date.now(),
    sender: 'system',
    text: !current ? '🤖 تم تفعيل البوت الذكي (Seif AI) في المحادثة!' : 'تم إيقاف البوت الذكي من المحادثة.',
    timestamp: Date.now(),
    isSystem: true
  });

  saveLocalRegistry(registry);
  return !current;
}

export async function sendFriendMessage(friendUsername, text) {
  const myUsername = getCurrentUsername();
  if (!myUsername) throw new Error('يرجى تسجيل الدخول أولاً');

  const cleanText = text.trim();
  if (!cleanText) return null;

  const roomKey = getChatRoomKey(myUsername, friendUsername);
  const registry = getLocalRegistry();

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
  saveLocalRegistry(registry);

  // Publish to recipient's inbox and room channel
  publishCloudEvent(`inbox_${friendUsername}`, {
    type: 'dm_message',
    message: userMsg,
    friend: myUsername,
    time: Date.now()
  });

  // Check Gemini AI Bot trigger
  const isBotEnabled = Boolean(registry.botSettings?.[roomKey]);
  const isGeminiMentioned = /@gemini|@Gemini|@جيميني|@bot|@بوت|@ai/i.test(cleanText);

  if (isBotEnabled || isGeminiMentioned) {
    triggerBotResponse(roomKey, myUsername, friendUsername, cleanText);
  }

  return userMsg;
}

async function triggerBotResponse(roomKey, sender, friend, prompt) {
  try {
    // Notify chat UI that Gemini is thinking
    window.dispatchEvent(new CustomEvent('seif-gemini-thinking', { detail: { roomKey, status: true } }));

    const systemPrompt = `You are "Gemini", Google's intelligent, friendly AI assistant participating in a private group chat between two friends: @${sender} and @${friend}.
Answer naturally, accurately, and helpfully in Arabic (or English if the user asks in English).
Keep answers clear, well-structured, concise, and engaging.
Both friends can see your response in this chat.`;

    const cleanedPrompt = prompt.replace(/@gemini|@Gemini|@جيميني|@bot|@بوت|@ai/gi, '').trim() || prompt;

    const res = await directGeminiCall(cleanedPrompt, systemPrompt, [], 'gemini-flash-lite-latest');
    const botReply = res?.reply || 'أهلاً بكما! كيف يمكنني مساعدتكم معاً؟ ✨';

    const registry = getLocalRegistry();
    registry.chatRooms = registry.chatRooms || {};
    registry.chatRooms[roomKey] = registry.chatRooms[roomKey] || [];

    const botMsg = {
      id: 'gemini_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sender: 'Gemini ✨',
      text: botReply,
      timestamp: Date.now(),
      isBot: true
    };

    // 1. Save to sender's chat room locally
    registry.chatRooms[roomKey].push(botMsg);
    saveLocalRegistry(registry);

    // 2. Publish to the friend's inbox on the cloud so BOTH friends receive it!
    publishCloudEvent(`inbox_${friend}`, {
      type: 'dm_message',
      message: botMsg,
      friend: sender,
      time: Date.now()
    });

    // 3. Dispatch locally so sender's chat UI immediately shows Gemini's reply
    window.dispatchEvent(new CustomEvent('seif-new-dm-received', { detail: botMsg }));
    window.dispatchEvent(new CustomEvent('seif-gemini-thinking', { detail: { roomKey, status: false } }));
  } catch (err) {
    console.warn('Gemini auto-reply error:', err);
    window.dispatchEvent(new CustomEvent('seif-gemini-thinking', { detail: { roomKey, status: false } }));
  }
}

// ---------------- 7. REAL-TIME INBOX & NOTIFICATION DISPATCHER ----------------

const processedEventIds = new Set();

export async function checkNewIncomingDmMessages() {
  const myUsername = getCurrentUsername();
  if (!myUsername) return [];

  const events = await pollCloudInbox(myUsername);
  if (!Array.isArray(events) || events.length === 0) return [];

  const newDmMessages = [];
  const registry = getLocalRegistry();
  let modified = false;

  for (const ev of events) {
    if (!ev || !ev.type) continue;
    const eventKey = `${ev.type}_${ev.message?.id || ev.request?.id || ev.requestId || ev.time}`;
    if (processedEventIds.has(eventKey)) continue;
    processedEventIds.add(eventKey);

    // 1. Incoming DM Message
    if (ev.type === 'dm_message' && ev.message) {
      const m = ev.message;
      if (m.sender && m.sender !== myUsername) {
        const friend = ev.friend || m.sender;
        const roomKey = getChatRoomKey(myUsername, friend);

        registry.chatRooms = registry.chatRooms || {};
        registry.chatRooms[roomKey] = registry.chatRooms[roomKey] || [];

        // Avoid duplicate message in chat history
        if (!registry.chatRooms[roomKey].some(x => x.id === m.id)) {
          registry.chatRooms[roomKey].push(m);
          modified = true;
        }

        newDmMessages.push({
          id: m.id,
          sender: m.sender,
          text: m.text || '',
          timestamp: m.timestamp || Date.now(),
          isBot: Boolean(m.isBot)
        });
      }
    }

    // 2. Incoming Friend Request
    else if (ev.type === 'friend_request' && ev.request) {
      const req = ev.request;
      registry.friendRequests = registry.friendRequests || [];
      const existing = registry.friendRequests.find(x => x.id === req.id || (x.from === req.from && x.to === req.to && x.status === 'pending'));
      if (!existing) {
        registry.friendRequests.push(req);
        modified = true;

        try {
          notifications.sendNow(`🤝 طلب صداقة جديد من @${req.from}`, `أرسل لك طلب صداقة! افتح التطبيق للقبول أو الرفض`);
          playNotificationSound();
        } catch (_) {}

        window.dispatchEvent(new CustomEvent('seif-friend-request-received', { detail: req }));
      }
    }

    // 3. Friend Request Accepted
    else if (ev.type === 'friend_accepted' && ev.by) {
      const friend = ev.by;
      registry.friendships = registry.friendships || {};
      registry.friendships[myUsername] = registry.friendships[myUsername] || [];
      registry.friendships[friend] = registry.friendships[friend] || [];

      if (!registry.friendships[myUsername].includes(friend)) {
        registry.friendships[myUsername].push(friend);
        modified = true;
      }

      // Mark request as accepted locally
      if (Array.isArray(registry.friendRequests)) {
        const found = registry.friendRequests.find(r => r.from === myUsername && r.to === friend);
        if (found) found.status = 'accepted';
      }

      // Ensure room has welcome message if empty
      const roomKey = getChatRoomKey(myUsername, friend);
      registry.chatRooms = registry.chatRooms || {};
      if (!registry.chatRooms[roomKey] || registry.chatRooms[roomKey].length === 0) {
        registry.chatRooms[roomKey] = [
          {
            id: 'sys_' + Date.now(),
            sender: 'system',
            text: `🎉 أنتم الآن أصدقاء! ابدأ المحادثة الآن، ويمكنك كتابة @gemini لسؤال الذكاء الاصطناعي في أي وقت.`,
            timestamp: Date.now(),
            isSystem: true
          }
        ];
        modified = true;
      }

      window.dispatchEvent(new CustomEvent('seif-friend-accepted', { detail: { friend } }));

      // Trigger celebration notification to the sender!
      try {
        notifications.sendNow('🎉 مبروك!', `@${friend} قبل طلب صداقتك وأصبحتم أصدقاء الآن! ابدأ الدردشة معه 🤝`);
        playNotificationSound();
      } catch (_) {}
    }

    // 4. Friend Request Rejected
    else if (ev.type === 'friend_rejected' && ev.by) {
      if (Array.isArray(registry.friendRequests)) {
        const found = registry.friendRequests.find(r => r.from === myUsername && r.to === ev.by && r.status === 'pending');
        if (found) {
          found.status = 'rejected';
          modified = true;
        }
      }
    }

    // 4. Friend Location Update
    else if (ev.type === 'friend_location' && ev.sender && ev.lat && ev.lng) {
      registry.users = registry.users || {};
      registry.users[ev.sender] = registry.users[ev.sender] || { username: ev.sender };
      registry.users[ev.sender].location = {
        lat: ev.lat,
        lng: ev.lng,
        updatedAt: ev.time || Date.now()
      };
      modified = true;
    }
  }

  if (modified) {
    saveLocalRegistry(registry);
  }

  return newDmMessages;
}

// ---------------- 8. LOCATION & PROXIMITY ----------------

export async function updateUserLocation(lat, lng) {
  const myUsername = getCurrentUsername();
  if (!myUsername || lat == null || lng == null) return;

  const registry = getLocalRegistry();
  registry.users = registry.users || {};
  registry.users[myUsername] = registry.users[myUsername] || { username: myUsername };
  registry.users[myUsername].location = {
    lat,
    lng,
    updatedAt: Date.now()
  };
  saveLocalRegistry(registry);

  // Broadcast location to all friends
  const myFriends = (registry.friendships && registry.friendships[myUsername]) || [];
  for (const friend of myFriends) {
    publishCloudEvent(`inbox_${friend}`, {
      type: 'friend_location',
      sender: myUsername,
      lat,
      lng,
      time: Date.now()
    });
  }
}

export async function checkAcceptedFriendships() {
  return []; // Handled reactively by checkNewIncomingDmMessages
}

export async function checkNearbyFriendsAlerts() {
  const myUsername = getCurrentUsername();
  if (!myUsername) return [];

  const registry = getLocalRegistry();
  return findNearbyFriends(myUsername, registry);
}
