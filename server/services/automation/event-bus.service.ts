import { AutomationEventType } from '../../types/index.ts';

type EventListener = (payload: any) => Promise<void> | void;

export class EventBusService {
  private listeners: Map<AutomationEventType, Set<EventListener>> = new Map();
  private history: Array<{ event: AutomationEventType; payload: any; timestamp: string }> = [];

  constructor() {
    // initialize empty sets
  }

  /**
   * Subscribe to a system event
   */
  public on(event: AutomationEventType, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  public subscribe(event: AutomationEventType, listener: EventListener): () => void {
    return this.on(event, listener);
  }

  /**
   * Publish an event to the Event Bus
   */
  public async emit(event: AutomationEventType, payload: any): Promise<void> {
    const timestamp = new Date().toISOString();
    this.history.unshift({ event, payload, timestamp });
    if (this.history.length > 200) {
      this.history.pop();
    }

    const listeners = this.listeners.get(event);
    if (listeners && listeners.size > 0) {
      const promises: Array<Promise<any>> = [];
      for (const listener of listeners) {
        try {
          const res = listener(payload);
          if (res instanceof Promise) {
            promises.push(res.catch(err => console.error(`Error in event listener for ${event}:`, err)));
          }
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      }
      await Promise.all(promises);
    }
  }

  /**
   * Get recent events log
   */
  public getRecentEvents(limit: number = 30) {
    return this.history.slice(0, limit);
  }
}

export const eventBus = new EventBusService();
export const eventBusService = eventBus;
