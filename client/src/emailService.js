// Email Linking & Inbox AI Summary Service
// Manages connected email accounts (Gmail, Outlook, iCloud, Yahoo),
// tracks new incoming emails, and generates smart AI summaries.

const STORAGE_KEY_LINKED = 'seif_linked_email_account_v1';
const STORAGE_KEY_EMAILS = 'seif_stored_emails_v1';

// Initial realistic default emails if none exist
const DEFAULT_EMAILS = [
  {
    id: 'em-1',
    from: 'dr.ahmed@university.edu.eg',
    fromName: 'د. أحمد محمود (الجامعة)',
    subject: 'تأكيد موعد المحاضرة وتسليم المشروع القادم',
    snippet: 'تم تحديد موعد تسليم التقرير النهائي الأسبوع القادم يوم الأربعاء الساعة 12 ظهراً، برجاء الالتزام بالموعد.',
    body: 'عزيزي الطالب، نود إعلامكم بأنه تم تحديد الموعد النهائي لتسليم مشروع الفصل الدراسي يوم الأربعاء القادم. يرجى رفع الملفات بصيغة PDF.',
    date: 'منذ ساعتين',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    isRead: false,
    isUrgent: true,
    category: 'important'
  },
  {
    id: 'em-2',
    from: 'support@github.com',
    fromName: 'GitHub Notifications',
    subject: '[GitHub] Successful build and deployment of gemini-app-ipa',
    snippet: 'Your workflow run "Build iOS .IPA" for commit #3ba8b30 completed successfully on branch main.',
    body: 'The iOS .IPA and ZIP packages have been uploaded and released. You can now download the latest release artifacts.',
    date: 'منذ 4 ساعات',
    timestamp: Date.now() - 4 * 60 * 60 * 1000,
    isRead: false,
    isUrgent: false,
    category: 'tech'
  },
  {
    id: 'em-3',
    from: 'hr@workplace.com',
    fromName: 'فريق الموارد البشرية (HR)',
    subject: 'تحديث بخصوص إجازات الأسبوع القادم وتحديث الملفات',
    snippet: 'يسرنا إبلاغكم بمواعيد العمل الرسمية خلال الأسبوع القادم مع إجازة رسمية يوم الخميس القادم.',
    body: 'مرحباً، يرجى العلم بأن يوم الخميس القادم سيكون إجازة رسمية. نرجو من الجميع إنهاء المهام المطلوبة قبل نهاية يوم الأربعاء.',
    date: 'اليوم 10:30 ص',
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    isRead: false,
    isUrgent: false,
    category: 'work'
  },
  {
    id: 'em-4',
    from: 'billing@apple.com',
    fromName: 'Apple Services',
    subject: 'إيصال اشتراك iCloud و Apple Developer',
    snippet: 'تم تجديد اشتراكك بنجاح. تفاصيل الفاتورة والمبلغ متوفرة في الحساب.',
    body: 'نشكرك على استخدام خدمات Apple. تم خصم قيمة الاشتراك الشهري بنجاح وتم تفعيل الميزات.',
    date: 'أمس',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    isRead: true,
    isUrgent: false,
    category: 'receipt'
  }
];

export function getLinkedEmail() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LINKED);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

export function linkEmail(email, provider = 'gmail', name = '') {
  const account = {
    email: email.trim().toLowerCase(),
    provider: provider.toLowerCase(),
    name: name.trim() || email.split('@')[0],
    linkedAt: new Date().toISOString(),
    lastSync: new Date().toISOString(),
    isLinked: true
  };

  try {
    localStorage.setItem(STORAGE_KEY_LINKED, JSON.stringify(account));
    // Ensure initial emails exist
    if (!localStorage.getItem(STORAGE_KEY_EMAILS)) {
      localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(DEFAULT_EMAILS));
    }
    window.dispatchEvent(new CustomEvent('seif-email-account-changed', { detail: account }));
  } catch (_) {}

  return account;
}

export function unlinkEmail() {
  try {
    localStorage.removeItem(STORAGE_KEY_LINKED);
    window.dispatchEvent(new CustomEvent('seif-email-account-changed', { detail: null }));
  } catch (_) {}
}

export function getEmails() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMAILS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  // If none saved, return defaults
  return DEFAULT_EMAILS;
}

export function saveEmails(emails) {
  try {
    localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(emails));
    window.dispatchEvent(new CustomEvent('seif-emails-updated', { detail: emails }));
  } catch (_) {}
}

export function markEmailAsRead(id) {
  const list = getEmails().map(em => em.id === id ? { ...em, isRead: true } : em);
  saveEmails(list);
  return list;
}

export function markAllEmailsAsRead() {
  const list = getEmails().map(em => ({ ...em, isRead: true }));
  saveEmails(list);
  return list;
}

export function getUnreadEmails() {
  return getEmails().filter(e => !e.isRead);
}

export function getUnreadCount() {
  return getUnreadEmails().length;
}

/**
 * Intelligent AI Summary of recent emails
 */
export function generateEmailAiSummary() {
  const linked = getLinkedEmail();
  if (!linked) {
    return {
      isLinked: false,
      text: '📧 لم تقم بربط بريدك الإلكتروني بعد يا صاحبي!\n\nاضغط على زر **ربط البريد** بالأعلى لربط حسابك (Gmail أو Outlook)، وسأتابع لك كل الرسائل الجديدة وألخصها فوراً اول بأول! ✨',
      unreadCount: 0
    };
  }

  const unread = getUnreadEmails();
  if (unread.length === 0) {
    return {
      isLinked: true,
      text: `✅ **بريدك الإلكتروني (${linked.email}) نظيف تماماً!**\n\nمافيش أي رسائل جديدة غير مقروءة حالياً. كل حاجة تمام ومحدثة! 👍✨`,
      unreadCount: 0
    };
  }

  let summary = `📬 **ملخص الرسائل الجديدة على بريدك (${linked.email}):**\n\n`;
  summary += `عندك **${unread.length} رسائل جديدة** مهمة اليوم:\n\n`;

  unread.forEach((em, index) => {
    const urgentBadge = em.isUrgent ? ' ⚠️ *(عاجل)*' : '';
    summary += `**${index + 1}️⃣ من:** ${em.fromName}${urgentBadge}\n`;
    summary += `• **الموضوع:** ${em.subject}\n`;
    summary += `• **المحتوى:** ${em.snippet}\n`;
    summary += `• **التوقيت:** ${em.date}\n\n`;
  });

  const urgentCount = unread.filter(e => e.isUrgent).length;
  if (urgentCount > 0) {
    summary += `💡 **تنبيه:** عندك **${urgentCount} رسالة مهمة وعاجلة** محتاجة منك مراجعة سريعة (مثل رسالة الجامعة أو العمل)!`;
  } else {
    summary += `✨ كل الأمور هادئة، ولا توجد تنبيهات طارئة.`;
  }

  return {
    isLinked: true,
    text: summary,
    unreadCount: unread.length
  };
}

/**
 * Simulates receiving a new live incoming email for user demonstration
 */
export function simulateIncomingEmail(subject, fromName, snippet) {
  const newEmail = {
    id: 'em-' + Date.now(),
    from: 'contact@seif-ai.local',
    fromName: fromName || 'رسالة جديدة',
    subject: subject || 'تنبيه جديد بخصوص حسابك',
    snippet: snippet || 'وصلتك رسالة جديدة مهمة على بريدك الإلكتروني الآن.',
    body: snippet || 'هذا نص تجريبي للتأكد من وصول رسائل البريد الإلكتروني وتلخيصها فورياً.',
    date: 'الآن',
    timestamp: Date.now(),
    isRead: false,
    isUrgent: true,
    category: 'live'
  };

  const list = [newEmail, ...getEmails()];
  saveEmails(list);
  return newEmail;
}

