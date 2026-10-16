/**
 * Local browser notification utility for evening expense logging reminders.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function showEveningReminderNotification(): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification('Centra Evening Reminder 🔔', {
      body: "Did you forget to record today's expenses? Tap to quickly log your airtime, food, or fuel purchases!",
      icon: '/favicon.ico',
      tag: 'centra-evening-reminder',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    console.error('Failed to display notification:', err);
  }
}
