export const notificationsService = {
  async sendPushNotification(token: string, title: string, body: string): Promise<void> {
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          title,
          body,
          sound: 'default',
          priority: 'high',
        }),
      });
    } catch {
      // Non-critical — never block message sending on notification failure
    }
  },
};
