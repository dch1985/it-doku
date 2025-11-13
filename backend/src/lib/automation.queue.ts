export interface GenerationJobMessage {
  jobId: string;
  tenantId?: string | null;
}

const provider = process.env.AUTOMATION_QUEUE_PROVIDER ?? 'memory';

// Sehr einfache In-Memory-Queue als Platzhalter für Azure Service Bus, RabbitMQ o.Ä.
const subscribers: Array<(message: GenerationJobMessage) => Promise<void> | void> = [];

async function publishToProvider(message: GenerationJobMessage) {
  if (provider === 'memory') {
    await Promise.all(subscribers.map((subscriber) => Promise.resolve(subscriber(message))));
    return;
  }

  if (provider === 'servicebus') {
    console.warn('[AutomationQueue] servicebus provider konfiguriert – bitte Azure Service Bus Client integrieren. Nachricht wird geloggt, aber nicht versendet.', message);
    return;
  }

  console.warn('[AutomationQueue] Unbekannter Provider, Nachricht wird verworfen:', provider);
}

export const automationQueue = {
  async publish(message: GenerationJobMessage) {
    console.info('[AutomationQueue] publish', message, '(provider:', provider, ')');
    await publishToProvider(message);
  },

  subscribe(handler: (message: GenerationJobMessage) => Promise<void> | void) {
    if (provider !== 'memory') {
      console.info('[AutomationQueue] subscribe called, aber Provider ist', provider, '- bitte eigenständige Consumer-Implementierung erstellen.');
    }

    subscribers.push(handler);
    console.info('[AutomationQueue] subscriber registered. total=', subscribers.length);
  },
};
