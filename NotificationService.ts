
import { Notification, NotificationPreferences, User } from './types';

const STORAGE_KEY = 'pharma_notifications';
const PREFS_KEY = 'pharma_notification_prefs';

export const getNotificationPreferences = (): NotificationPreferences => {
  const saved = localStorage.getItem(PREFS_KEY);
  return saved ? JSON.parse(saved) : {
    emailOnCriticalDeviation: true,
    emailOnCapaAssignment: true,
    emailOnOverdueTask: true,
    systemAlertsEnabled: true
  };
};

export const saveNotificationPreferences = (prefs: NotificationPreferences) => {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
};

export const getNotifications = (): Notification[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const triggerNotification = (
  user: User,
  category: Notification['category'],
  priority: Notification['priority'],
  title: string,
  message: string
) => {
  const prefs = getNotificationPreferences();
  
  // Logic check based on preferences
  const shouldSendEmail = 
    (category === 'Deviation' && priority === 'Critical' && prefs.emailOnCriticalDeviation) ||
    (category === 'CAPA' && prefs.emailOnCapaAssignment) ||
    (category === 'Task' && priority === 'High' && prefs.emailOnOverdueTask);

  const newNotification: Notification = {
    id: Date.now().toString(),
    type: shouldSendEmail ? 'Email' : 'System',
    category,
    priority,
    title,
    message,
    timestamp: new Date().toISOString(),
    isRead: false,
    recipient: user.email
  };

  const existing = getNotifications();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newNotification, ...existing].slice(0, 50)));

  if (shouldSendEmail) {
    console.log(`%c[EMAIL SENT TO ${user.email}]`, 'color: #2563eb; font-weight: bold', {
      subject: `CRITICAL QUALITY ALERT: ${title}`,
      body: message
    });
  }
  
  return newNotification;
};
