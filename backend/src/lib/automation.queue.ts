import { ServiceBusClient, ServiceBusMessage } from '@azure/service-bus';

export interface GenerationJobMessage {
  jobId: string;
  tenantId?: string | null;
}

const provider = process.env.AUTOMATION_QUEUE_PROVIDER ?? 'memory';
const serviceBusConnectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
const serviceBusQueueName = process.env.AZURE_SERVICE_BUS_QUEUE_NAME;

let serviceBusClient: ServiceBusClient | null = null;
let serviceBusSender: ReturnType<ServiceBusClient['createSender']> | null = null;
let serviceBusReceiver: ReturnType<ServiceBusClient['createReceiver']> | null = null;

async function ensureServiceBus() {
  if (!serviceBusClient) {
    if (!serviceBusConnectionString || !serviceBusQueueName) {
      throw new Error('Service Bus Provider ausgewählt, aber AZURE_SERVICE_BUS_CONNECTION_STRING oder AZURE_SERVICE_BUS_QUEUE_NAME fehlt.');
    }
    serviceBusClient = new ServiceBusClient(serviceBusConnectionString);
    serviceBusSender = serviceBusClient.createSender(serviceBusQueueName);
    serviceBusReceiver = serviceBusClient.createReceiver(serviceBusQueueName);
    console.info('[AutomationQueue] Service Bus Verbindung aufgebaut');
  }
}

async function sendViaServiceBus(message: GenerationJobMessage) {
  await ensureServiceBus();
  const sbMessage: ServiceBusMessage = {
    body: message,
    applicationProperties: {
      type: 'generation-job',
    },
  };
  await serviceBusSender!.sendMessages(sbMessage);
}

function subscribeViaServiceBus(handler: (message: GenerationJobMessage) => Promise<void> | void) {
  serviceBusReceiver!.subscribe({
    async processMessage(message) {
      try {
        const body = message.body as GenerationJobMessage;
        await handler(body);
      } catch (error) {
        console.error('[AutomationQueue] Fehler beim Verarbeiten einer Service Bus Nachricht', error);
      }
    },
    async processError(args) {
      console.error('[AutomationQueue] Service Bus Fehler', args.error);
    },
  });
}

// Sehr einfache In-Memory-Queue als Platzhalter für Azure Service Bus, RabbitMQ o.Ä.
const subscribers: Array<(message: GenerationJobMessage) => Promise<void> | void> = [];

async function publishToProvider(message: GenerationJobMessage) {
  if (provider === 'servicebus') {
    await sendViaServiceBus(message);
    return;
  }

  if (provider === 'memory') {
    await Promise.all(subscribers.map((subscriber) => Promise.resolve(subscriber(message))));
    return;
  }

  console.warn('[AutomationQueue] Unbekannter Provider, Nachricht wird verworfen:', provider);
}

export const automationQueue = {
  async publish(message: GenerationJobMessage) {
    console.info('[AutomationQueue] publish', message, '(provider:', provider, ')');
    await publishToProvider(message);
  },

  async subscribe(handler: (message: GenerationJobMessage) => Promise<void> | void) {
    if (provider === 'servicebus') {
      await ensureServiceBus();
      subscribeViaServiceBus(handler);
      console.info('[AutomationQueue] Service Bus subscription aktiv');
      return;
    }

    if (provider !== 'memory') {
      console.info('[AutomationQueue] subscribe called, aber Provider ist', provider, '- bitte eigenständige Consumer-Implementierung erstellen.');
      return;
    }

    subscribers.push(handler);
    console.info('[AutomationQueue] subscriber registered. total=', subscribers.length);
  },
};

process.on('SIGINT', async () => {
  if (serviceBusReceiver) {
    await serviceBusReceiver.close();
  }
  if (serviceBusSender) {
    await serviceBusSender.close();
  }
  if (serviceBusClient) {
    await serviceBusClient.close();
  }
});
