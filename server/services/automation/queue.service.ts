import { QueueJob } from '../../types/index.ts';

export type QueueName =
  | 'google-sync'
  | 'reviews'
  | 'ai'
  | 'seo'
  | 'competitors'
  | 'visibility'
  | 'reports'
  | 'notifications'
  | 'system';

type JobHandler<T = any> = (job: QueueJob<T>) => Promise<any>;

export class AutomationQueueService {
  private jobs: Map<string, QueueJob> = new Map();
  private handlers: Map<QueueName, JobHandler> = new Map();
  private processing: Set<string> = new Set();
  private deadLetterQueue: QueueJob[] = [];
  private completedOperationKeys: Map<string, { timestamp: number; result: any }> = new Map();
  private isWorkerRunning: boolean = false;
  private workerTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startWorker();
  }

  /**
   * Register a processor for a queue
   */
  public registerHandler(queue: QueueName, handler: JobHandler): void {
    this.handlers.set(queue, handler);
  }

  /**
   * Enqueue a new background job with idempotency check
   */
  public enqueue<T = any>(
    queue: QueueName,
    name: string,
    payload: T,
    options?: {
      idempotencyKey?: string;
      maxAttempts?: number;
      backoffMs?: number;
    }
  ): QueueJob<T> {
    const idempotencyKey = options?.idempotencyKey;
    if (idempotencyKey && this.completedOperationKeys.has(idempotencyKey)) {
      const existing = this.completedOperationKeys.get(idempotencyKey)!;
      // Return synthetic completed job representation
      return {
        id: `dedup_${idempotencyKey}`,
        queue,
        name,
        payload,
        attempts: 1,
        maxAttempts: options?.maxAttempts || 3,
        backoffMs: options?.backoffMs || 60000,
        status: 'COMPLETED',
        idempotencyKey,
        createdAt: new Date(existing.timestamp).toISOString(),
        processedAt: new Date(existing.timestamp).toISOString()
      };
    }

    const job: QueueJob<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      queue,
      name,
      payload,
      attempts: 0,
      maxAttempts: options?.maxAttempts || 4,
      backoffMs: options?.backoffMs || 60000, // default 1 min
      status: 'WAITING',
      idempotencyKey,
      createdAt: new Date().toISOString()
    };

    this.jobs.set(job.id, job);
    return job;
  }

  /**
   * Start worker processing loop
   */
  private startWorker(): void {
    if (this.isWorkerRunning) return;
    this.isWorkerRunning = true;
    this.workerTimer = setInterval(() => {
      this.processWaitingJobs().catch(err => console.error('Queue worker loop error:', err));
    }, 2000); // tick every 2s
  }

  public stopWorker(): void {
    if (this.workerTimer) {
      clearInterval(this.workerTimer);
      this.workerTimer = null;
    }
    this.isWorkerRunning = false;
  }

  /**
   * Process pending jobs across queues respecting concurrency
   */
  private async processWaitingJobs(): Promise<void> {
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (job.status !== 'WAITING' || this.processing.has(id)) continue;

      // Check handler
      const handler = this.handlers.get(job.queue);
      if (!handler) continue;

      this.processing.add(id);
      job.status = 'ACTIVE';
      job.attempts += 1;

      (async () => {
        try {
          const result = await handler(job);
          job.status = 'COMPLETED';
          job.processedAt = new Date().toISOString();
          if (job.idempotencyKey) {
            this.completedOperationKeys.set(job.idempotencyKey, {
              timestamp: now,
              result
            });
          }
        } catch (err: any) {
          console.error(`[Queue ${job.queue}] Job ${job.id} (${job.name}) failed attempt ${job.attempts}/${job.maxAttempts}:`, err.message);
          job.error = err.message || 'Execution error';

          if (job.attempts < job.maxAttempts) {
            job.status = 'WAITING';
            // Exponential/tiered backoff: 1 min, 5 min, 15 min, 30 min
            const backoffs = [60000, 300000, 900000, 1800000];
            const backoffDelay = backoffs[job.attempts - 1] || 1800000;
            // Delay next attempt
            await new Promise(r => setTimeout(r, Math.min(backoffDelay, 5000))); // Cap at 5s in demo env
          } else {
            job.status = 'DEAD_LETTER';
            job.processedAt = new Date().toISOString();
            this.deadLetterQueue.unshift({ ...job });
          }
        } finally {
          this.processing.delete(id);
        }
      })();
    }
  }

  /**
   * Queue stats for Admin Monitoring
   */
  public getStats() {
    let waiting = 0;
    let active = 0;
    let completed = 0;
    let failed = 0;
    let deadLetter = this.deadLetterQueue.length;

    for (const job of this.jobs.values()) {
      if (job.status === 'WAITING') waiting++;
      else if (job.status === 'ACTIVE') active++;
      else if (job.status === 'COMPLETED') completed++;
      else if (job.status === 'FAILED') failed++;
      else if (job.status === 'DEAD_LETTER') deadLetter++;
    }

    return {
      totalJobs: this.jobs.size,
      waiting,
      active,
      completed,
      failed,
      deadLetter,
      queueDistribution: Array.from(this.jobs.values()).reduce((acc: Record<string, number>, j) => {
        acc[j.queue] = (acc[j.queue] || 0) + 1;
        return acc;
      }, {})
    };
  }

  public getQueueStatus() {
    return this.getStats();
  }

  public getDeadLetters(): QueueJob[] {
    return this.deadLetterQueue.slice(0, 50);
  }

  public retryDeadLetter(jobId: string): boolean {
    const job = this.deadLetterQueue.find(j => j.id === jobId);
    if (!job) return false;
    job.attempts = 0;
    job.status = 'WAITING';
    job.error = undefined;
    this.jobs.set(job.id, job);
    this.deadLetterQueue = this.deadLetterQueue.filter(j => j.id !== jobId);
    return true;
  }
}

export const automationQueueService = new AutomationQueueService();
export const queueService = automationQueueService;
