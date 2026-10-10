// Internationalization (i18n) Module
// Supports Arabic (ar) and English (en) with reactive real-time switching

const LANG_KEY = 'seif_app_language';

const translations = {
  ar: {
    // Language Meta
    code: 'ar',
    dir: 'rtl',
    otherLangCode: 'en',
    otherLangName: 'English 🇺🇸',
    currentLangName: 'العربية 🇸🇦',

    // App Header / Common
    appName: 'Seif Ai Test',
    onlineStatus: 'Gemini متصل 24/7 • التنبيهات جاهزة',
    copy: 'نسخ',
    copied: 'تم النسخ بنجاح! 📋',
    clear: 'مسح',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    delete: 'حذف',
    save: 'حفظ',
    loading: 'جاري التحميل...',
    send: 'إرسال',
    back: 'رجوع',
    active: 'نشط',

    // Tab Bar
    tabChat: 'الذكاء الاصطناعي',
    tabFriends: 'الأصدقاء',
    tabTools: 'الأدوات',
    tabNotes: 'الملاحظات',
    tabTasks: 'المهام',
    tabSettings: 'الإعدادات',

    // Language switcher
    switchLanguage: 'English 🇺🇸',
    languageSettingTitle: 'لغة التطبيق (App Language)',
    languageSettingDesc: 'اختر لغة الواجهة بين العربية والإنجليزية بسهولة في أي وقت.',

    // Friends Tab
    friendsHeaderTitle: 'الأصدقاء (Friends)',
    friendsHeaderSubtitle: 'أضف أصدقاءك بالـ Username ودردش معهم ومع البوت الذكي',
    myUsernameLabel: 'اسم المستخدم الخاص بك:',
    notRegistered: 'لم يتم التسجيل بعد',
    addFriendTitle: 'إضافة صديق جديد (Add Friend)',
    addFriendSubtitle: 'أدخل اسم مستخدم صديقك لإرسال طلب صداقة له:',
    friendUsernamePlaceholder: 'اكتب username الصديق هنا...',
    sendFriendRequestBtn: 'إرسال طلب',
    sendingRequestBtn: 'جاري الإرسال...',
    incomingRequestsTitle: 'طلبات الصداقة الواردة',
    newRequestsBadge: 'جديد',
    sentYouRequestText: 'أرسل لك طلب صداقة',
    acceptBtn: 'قبول',
    rejectBtn: 'رفض',
    myFriendsTitle: 'أصدقائي',
    noFriendsYet: 'ليس لديك أصدقاء بعد. اكتب اسم مستخدم صديقك بالأعلى وأرسل له طلب صداقة! 🤝',
    connectedFriend: 'صديق متصل ⚡',
    chatWithFriendBtn: 'دردشة 💬',
    friendChatBadge: 'محادثة صديق',
    botConnectedBadge: 'البوت متصل 🤖',
    addBotBtn: 'إضافة البوت ➕',
    botBannerText: 'الذكاء الاصطناعي (Seif Bot) يشارك في هذا الشات! اسأله أي شيء وسيرد عليكم معاً.',
    startChatPrompt: '👋 ابدأ المحادثة الآن مع صديقك',
    typeMessagePlaceholder: 'اكتب رسالة لصديقك...',
    typeMessageWithBotPlaceholder: 'اكتب رسالة أو اسأل البوت...',
    friendRequestSentSuccess: 'تم إرسال طلب الصداقة بنجاح! 📨',
    friendAcceptedSuccess: 'أصبحتما أصدقاء الآن! 🎉',
    friendRejectedInfo: 'تم رفض طلب الصداقة',

    // Error messages for Friends
    errUsernameNotFound: 'الاسم غير موجود! تأكد من كتابة اسم المستخدم بشكل صحيح.',
    errCannotAddSelf: 'لا يمكنك إرسال طلب صداقة لنفسك!',
    errAlreadyFriends: 'أنت وهذا المستخدم أصدقاء بالفعل!',
    errRequestAlreadyPending: 'تم إرسال طلب صداقة لهذا المستخدم مسبقاً وبانتظار قبوله!',
    errTargetAlreadyRequested: 'المستخدم قد أرسل لك طلب صداقة بالفعل! تحقق من الطلبات لقبوله.',
    errEmptyUsername: 'يرجى إدخال اسم المستخدم',
    errInvalidUsernameChars: 'اسم المستخدم يجب ألا يحتوي على مسافات أو رموز خاصة',
    errUsernameTooShort: 'اسم المستخدم يجب أن يكون حرفين على الأقل',
    errUsernameTaken: 'اسم المستخدم هذا موجود بالفعل! اختر اسماً آخر.',
    errUsernameNotRegistered: 'اسم المستخدم هذا غير مسجل مسبقاً!',

    // Username Registration Modal
    modalTitleNew: 'مرحباً بك في Seif AI',
    modalTitleExisting: 'تسجيل الدخول إلى حسابك',
    modalSubtitleNew: 'اختر اسم مستخدم خاص بك للتواصل والدردشة مع أصدقائك والذكاء الاصطناعي',
    modalSubtitleExisting: 'أدخل اسم المستخدم الخاص بك للوصول إلى أصدقائك ومحادثاتك',
    tabNewUser: 'حساب جديد ✨',
    tabExistingUser: 'لدي حساب مسبقاً 🔑',
    inputUsernamePlaceholder: 'اكتب اسم المستخدم هنا...',
    btnSubmitNew: 'تأكيد اسم المستخدم والبدء',
    btnSubmitExisting: 'دخول واسترجاع الحساب',
    btnSubmitting: 'جاري التحقق...',
    permanentNotice: '🔒 سيبقى حسابك مسجلاً دائماً على هذا الهاتف تلقائياً.',
    welcomeNewUser: '🎉 تم تسجيل دخولك بنجاح!',
    welcomeBackUser: '👋 أهلاً بعودتك!',

    // Chat Tab
    clearChatPrompt: 'هل أنت متأكد من مسح سجل المحادثة؟',
    clearChatSuccess: 'تم مسح المحادثة بنجاح',
    chatInputPlaceholder: 'اسأل أي شيء، اطلب حل مسألة، أو قل "فكرني بعد 10 دقائق"...',
    photoAttachedToast: '📸 تم إرفاق الصورة بنجاح! اسألني عنها أو قولي حلها',
    voiceListeningToast: '🎙️ اتكلم دلوقتي وسامعك...',
    voiceRecordedToast: '🎙️ صوتك اتسجل بنجاح!',
    voiceErrorToast: 'تعذر التقاط الصوت، حاول ثانية',
    appOpeningToast: 'جاري فتح التطبيق... 🚀',
    reminderSetToast: '⏰ تم ضبط التنبيه بنجاح! 🔔',
    testNotificationToast: 'تم إرسال إشعار تجريبي لهاتفك! 🔔',
    logoSoundToast: '✨ تم تشغيل نغمة الشعار!',

    // Settings Tab
    settingsHeaderTitle: 'إعدادات التطبيق',
    settingsHeaderSubtitle: 'تخصيص لغة التطبيق، الشعار، التنبيهات، ووقت الشاشة',
    permanentAccountDesc: 'حساب متصل دائم • لا يحتاج كلمة سر',
    logoCardTitle: 'الشعار وصوت التطبيق',
    logoCardDesc: 'اضغط الشعار لسماع الصوت الفخم',
    screenTimeTitle: 'وقت الشاشة (Screen Time)',
    screenTimeDesc: 'تحكم في مدة استخدامك اليومية للتطبيق واحصل على تنبيهات استراحة لحماية عينيك.',
    todayUsageLabel: 'اليوم (Today\'s Usage):',
    dailyLimitLabel: 'الحد اليومي (Daily Limit)',
    dailyLimitDesc: 'إيقاف التطبيق عند الوصول للحد المحدد',
    breakRemindersLabel: 'تنبيهات الاستراحة (Break Reminders)',
    breakRemindersDesc: 'إشعار كل 20 دقيقة استخدام متواصل لأخذ راحة',
    notificationSoundTitle: 'صوت ونغمة الإشعارات (Notification Sound)',
    notificationSoundDesc: 'نغمة إشعار كريستالية فخمة تعمل تلقائياً مع كل تذكير أو إشعار يصدره التطبيق.',
    testNotificationBtn: 'تجربة صوت الإشعار الآن (Test Notification Sound) 🔔',

    // AI Tools Tab
    toolsHeaderTitle: 'أدوات الذكاء الاصطناعي',
    toolsHeaderSubtitle: 'حل مسائل، تلخيص، ترجمة، وتطوير أفكار بلمسة واحدة',
    inputToolsPlaceholder: 'اكتب أو الصق النص هنا...',
    generateBtn: 'تنفيذ بالذكاء الاصطناعي ⚡',

    // Notes & Tasks
    notesHeaderTitle: 'ملاحظاتي الذكية',
    tasksHeaderTitle: 'قائمة المهام والتذكيرات'
  },

  en: {
    // Language Meta
    code: 'en',
    dir: 'ltr',
    otherLangCode: 'ar',
    otherLangName: 'العربية 🇸🇦',
    currentLangName: 'English 🇺🇸',

    // App Header / Common
    appName: 'Seif Ai Test',
    onlineStatus: 'Gemini Online 24/7 • Reminders Ready',
    copy: 'Copy',
    copied: 'Copied to clipboard! 📋',
    clear: 'Clear',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    save: 'Save',
    loading: 'Loading...',
    send: 'Send',
    back: 'Back',
    active: 'Active',

    // Tab Bar
    tabChat: 'AI Chat',
    tabFriends: 'Friends',
    tabTools: 'AI Tools',
    tabNotes: 'Notes',
    tabTasks: 'Tasks',
    tabSettings: 'Settings',

    // Language switcher
    switchLanguage: 'العربية 🇸🇦',
    languageSettingTitle: 'App Language (لغة التطبيق)',
    languageSettingDesc: 'Switch the entire app interface between Arabic and English instantly.',

    // Friends Tab
    friendsHeaderTitle: 'Friends',
    friendsHeaderSubtitle: 'Add friends by username and chat together with the AI Bot',
    myUsernameLabel: 'Your Username:',
    notRegistered: 'Not Registered',
    addFriendTitle: 'Add New Friend',
    addFriendSubtitle: 'Enter your friend\'s username to send a friend request:',
    friendUsernamePlaceholder: 'Enter friend\'s username...',
    sendFriendRequestBtn: 'Send Request',
    sendingRequestBtn: 'Sending...',
    incomingRequestsTitle: 'Incoming Friend Requests',
    newRequestsBadge: 'New',
    sentYouRequestText: 'sent you a friend request',
    acceptBtn: 'Accept',
    rejectBtn: 'Reject',
    myFriendsTitle: 'My Friends',
    noFriendsYet: 'No friends yet. Enter your friend\'s username above to send a request! 🤝',
    connectedFriend: 'Friend Online ⚡',
    chatWithFriendBtn: 'Chat 💬',
    friendChatBadge: 'Friend Chat',
    botConnectedBadge: 'Bot Connected 🤖',
    addBotBtn: 'Add Bot ➕',
    botBannerText: 'Seif AI Bot is in this chat! Ask any question and it will reply to both of you.',
    startChatPrompt: '👋 Start chatting now with your friend',
    typeMessagePlaceholder: 'Type a message to your friend...',
    typeMessageWithBotPlaceholder: 'Type a message or ask the bot...',
    friendRequestSentSuccess: 'Friend request sent successfully! 📨',
    friendAcceptedSuccess: 'You are now friends! 🎉',
    friendRejectedInfo: 'Friend request declined',

    // Error messages for Friends
    errUsernameNotFound: 'Username not found! Make sure the username is spelled correctly.',
    errCannotAddSelf: 'You cannot send a friend request to yourself!',
    errAlreadyFriends: 'You are already friends with this user!',
    errRequestAlreadyPending: 'A friend request has already been sent to this user and is pending!',
    errTargetAlreadyRequested: 'This user already sent you a friend request! Check incoming requests to accept.',
    errEmptyUsername: 'Please enter a username',
    errInvalidUsernameChars: 'Username must not contain spaces or special characters',
    errUsernameTooShort: 'Username must be at least 2 characters',
    errUsernameTaken: 'This username is already taken! Please choose another.',
    errUsernameNotRegistered: 'This username is not registered!',

    // Username Registration Modal
    modalTitleNew: 'Welcome to Seif AI',
    modalTitleExisting: 'Sign In to Your Account',
    modalSubtitleNew: 'Choose your unique username to chat with friends and AI',
    modalSubtitleExisting: 'Enter your username to access your friends and chats',
    tabNewUser: 'New Account ✨',
    tabExistingUser: 'Existing Account 🔑',
    inputUsernamePlaceholder: 'Type your username here...',
    btnSubmitNew: 'Confirm Username & Start',
    btnSubmitExisting: 'Sign In & Retrieve Account',
    btnSubmitting: 'Verifying...',
    permanentNotice: '🔒 Your account stays permanently signed in on this phone.',
    welcomeNewUser: '🎉 Signed in successfully!',
    welcomeBackUser: '👋 Welcome back!',

    // Chat Tab
    clearChatPrompt: 'Are you sure you want to clear chat history?',
    clearChatSuccess: 'Chat history cleared successfully',
    chatInputPlaceholder: 'Ask anything, solve problems, or say "Remind me in 10 minutes"...',
    photoAttachedToast: '📸 Photo attached! Ask me about it or request solutions',
    voiceListeningToast: '🎙️ Listening to your voice now...',
    voiceRecordedToast: '🎙️ Voice recorded successfully!',
    voiceErrorToast: 'Could not capture voice, please try again',
    appOpeningToast: 'Opening application... 🚀',
    reminderSetToast: '⏰ Reminder scheduled successfully! 🔔',
    testNotificationToast: 'Test alert sent to your phone! 🔔',
    logoSoundToast: '✨ Logo chime played!',

    // Settings Tab
    settingsHeaderTitle: 'App Settings',
    settingsHeaderSubtitle: 'Customize Language, App Icon, Alerts & Screen Time',
    permanentAccountDesc: 'Permanent Account • No Password Needed',
    logoCardTitle: 'App Icon & Chime',
    logoCardDesc: 'Tap the logo to hear the crystal chime',
    screenTimeTitle: 'Screen Time & Wellbeing',
    screenTimeDesc: 'Manage your daily app usage and receive restful pause alerts.',
    todayUsageLabel: 'Today\'s Usage:',
    dailyLimitLabel: 'Daily Limit',
    dailyLimitDesc: 'Lock app once the daily limit is reached',
    breakRemindersLabel: 'Break Reminders',
    breakRemindersDesc: 'Alert every 20 minutes of continuous use',
    notificationSoundTitle: 'Notification Sound & Chime',
    notificationSoundDesc: 'Luxury crystal chime played automatically for every app alert and reminder.',
    testNotificationBtn: 'Test Notification Sound Now 🔔',

    // AI Tools Tab
    toolsHeaderTitle: 'AI Tools',
    toolsHeaderSubtitle: 'Solve questions, summarize, translate and brainstorm in one click',
    inputToolsPlaceholder: 'Type or paste text here...',
    generateBtn: 'Run with AI ⚡',

    // Notes & Tasks
    notesHeaderTitle: 'Smart Notes',
    tasksHeaderTitle: 'Tasks & Reminders'
  }
};

export function getAppLanguage() {
  const saved = localStorage.getItem(LANG_KEY);
  return (saved === 'en' || saved === 'ar') ? saved : 'ar';
}

export function setAppLanguage(lang) {
  const chosen = (lang === 'en') ? 'en' : 'ar';
  localStorage.setItem(LANG_KEY, chosen);

  // Update HTML tag direction and lang
  if (typeof document !== 'undefined') {
    document.documentElement.dir = chosen === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = chosen;
  }

  // Dispatch global reactive event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('seif-language-changed', { detail: chosen }));
  }

  return chosen;
}

export function toggleAppLanguage() {
  const current = getAppLanguage();
  const next = current === 'ar' ? 'en' : 'ar';
  return setAppLanguage(next);
}

export function useTranslation() {
  const lang = getAppLanguage();
  return {
    lang,
    t: translations[lang] || translations.ar,
    isRTL: lang === 'ar',
    setLanguage: setAppLanguage,
    toggleLanguage: toggleAppLanguage
  };
}

export function getTranslation(lang = getAppLanguage()) {
  return translations[lang] || translations.ar;
}

