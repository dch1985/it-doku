#!/usr/bin/env ts-node
import 'dotenv/config';
import { automationService } from '../services/automation.service.js';
import { automationQueue } from '../lib/automation.queue.js';

async function processSingleJob(jobId: string) {
  console.info(`[AutomationWorker] Processing job ${jobId}`);
  try {
    await automationService.processJob(jobId);
    console.info('[AutomationWorker] Job processed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('[AutomationWorker] Failed to process job', error?.message ?? error);
    process.exit(1);
  }
}

function listenForQueueMessages() {
  console.info('[AutomationWorker] Waiting for queue messages...');
  automationQueue.subscribe(async (message) => {
    try {
      console.info('[AutomationWorker] Received queue message', message);
      await automationService.processJob(message.jobId);
      console.info('[AutomationWorker] Job finished', message.jobId);
    } catch (error: any) {
      console.error('[AutomationWorker] Job failed', message.jobId, error?.message ?? error);
    }
  });

  process.on('SIGINT', () => {
    console.info('[AutomationWorker] Gracefully shutting down');
    process.exit(0);
  });
}

(async () => {
  const jobId = process.argv[2];
  if (jobId) {
    await processSingleJob(jobId);
  } else {
    listenForQueueMessages();
  }
})();
