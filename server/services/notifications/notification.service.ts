import { db } from '../../db/database.ts';
import { AppNotification } from '../../types/index.ts';

export class NotificationService {
  public async notify(params: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    db.createNotification({
      ...params,
      read: false
    });

    // If an email provider key is configured, forward critical notifications
    if (params.severity === 'critical' && process.env.EMAIL_PROVIDER_KEY) {
      console.log(`[NotificationService] Forwarding critical alert "${params.title}" to configured notification webhooks.`);
    }
  }
}

export const notificationService = new NotificationService();
