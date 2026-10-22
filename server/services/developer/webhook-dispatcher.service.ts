import crypto from 'crypto';
import { db } from '../../db/database.ts';
import { WebhookDelivery } from '../../types/index.ts';

export class WebhookDispatcherService {
  /**
   * Dispatch an event to all matching active webhook endpoints
   */
  public async dispatchEvent(organizationId: string, event: string, payload: any): Promise<void> {
    const webhooks = db.listWebhooks(organizationId).filter(w => w.status === 'ACTIVE' && (w.events.includes(event) || w.events.includes('*')));

    for (const webhook of webhooks) {
      this.sendWithRetry(webhook.id, organizationId, webhook.url, webhook.secret, event, payload).catch(err => {
        console.error(`[WebhookDispatcher] Failed delivery to ${webhook.url}:`, err);
      });
    }
  }

  /**
   * Send webhook HTTP POST with HMAC SHA-256 signature
   */
  public async sendWithRetry(
    webhookId: string,
    organizationId: string,
    url: string,
    secret: string,
    event: string,
    payload: any,
    attempt: number = 1
  ): Promise<WebhookDelivery> {
    const timestamp = Math.floor(Date.now() / 1000);
    const bodyString = JSON.stringify({
      id: 'evt_' + crypto.randomUUID().slice(0, 12),
      event,
      timestamp,
      organizationId,
      data: payload
    });

    // Compute HMAC signature
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${bodyString}`)
      .digest('hex');

    const startTime = Date.now();
    let responseStatus: number | undefined;
    let deliveryStatus: 'SUCCESS' | 'FAILED' = 'FAILED';
    let errorMessage: string | undefined;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LocalOS-Webhook-Delivery/1.0',
          'X-LOCALOS-SIGNATURE': `t=${timestamp},v1=${signature}`,
          'X-LOCALOS-EVENT': event
        },
        body: bodyString,
        signal: AbortSignal.timeout(10000)
      });

      responseStatus = response.status;
      if (response.ok) {
        deliveryStatus = 'SUCCESS';
      } else {
        errorMessage = `HTTP status ${response.status} ${response.statusText}`;
      }
    } catch (err: any) {
      errorMessage = err.message || 'Network error / Timeout';
    }

    const durationMs = Date.now() - startTime;
    const delivery: WebhookDelivery = {
      id: 'whdel_' + crypto.randomUUID().slice(0, 10),
      webhookId,
      organizationId,
      event,
      payload,
      responseStatus,
      durationMs,
      status: deliveryStatus,
      attempts: attempt,
      error: errorMessage,
      createdAt: new Date().toISOString()
    };

    db.createWebhookDelivery(delivery);

    // If failed and attempt < 3, retry asynchronously with backoff
    if (deliveryStatus === 'FAILED' && attempt < 3) {
      const backoffMs = attempt === 1 ? 5000 : 20000;
      setTimeout(() => {
        this.sendWithRetry(webhookId, organizationId, url, secret, event, payload, attempt + 1).catch(() => {});
      }, backoffMs);
    }

    return delivery;
  }
}

export const webhookDispatcherService = new WebhookDispatcherService();
