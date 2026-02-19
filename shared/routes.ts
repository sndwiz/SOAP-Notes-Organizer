import { z } from 'zod';
import { insertSoapNoteSchema, soapNotes, insertClientSchema, clients, insertTaskSchema, tasks, insertDocumentSchema, documents, insertNotificationSchema, notifications, insertReferralSchema, referrals, insertSafetyPlanSchema, safetyPlans, insertCeCreditSchema, ceCredits, insertMessageThreadSchema, messageThreads, insertMessageSchema, messages, insertIntakeFormSchema, intakeForms, insertBillingRecordSchema, billingRecords, utahCodes } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  // SOAP Notes
  soapNotes: {
    list: {
      method: 'GET' as const,
      path: '/api/soap-notes' as const,
      responses: { 200: z.array(z.custom<typeof soapNotes.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/soap-notes/:id' as const,
      responses: { 200: z.custom<typeof soapNotes.$inferSelect>(), 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/soap-notes' as const,
      input: insertSoapNoteSchema,
      responses: { 201: z.custom<typeof soapNotes.$inferSelect>(), 400: errorSchemas.validation },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/soap-notes/:id' as const,
      input: insertSoapNoteSchema.partial(),
      responses: { 200: z.custom<typeof soapNotes.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/soap-notes/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
    aiSuggest: {
      method: 'POST' as const,
      path: '/api/soap-notes/:id/ai-suggest' as const,
      responses: {
        200: z.object({
          suggestedDiagnoses: z.array(z.object({ code: z.string(), name: z.string(), confidence: z.number() })),
          suggestedCpt: z.string(),
          reasoning: z.string(),
        }),
      },
    },
  },

  // Clients
  clients: {
    list: {
      method: 'GET' as const,
      path: '/api/clients' as const,
      responses: { 200: z.array(z.custom<typeof clients.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/clients/:id' as const,
      responses: { 200: z.custom<typeof clients.$inferSelect>(), 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clients' as const,
      input: insertClientSchema,
      responses: { 201: z.custom<typeof clients.$inferSelect>(), 400: errorSchemas.validation },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/clients/:id' as const,
      input: insertClientSchema.partial(),
      responses: { 200: z.custom<typeof clients.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/clients/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
  },

  // Tasks
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks' as const,
      responses: { 200: z.array(z.custom<typeof tasks.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tasks' as const,
      input: insertTaskSchema,
      responses: { 201: z.custom<typeof tasks.$inferSelect>(), 400: errorSchemas.validation },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/tasks/:id' as const,
      input: insertTaskSchema.partial(),
      responses: { 200: z.custom<typeof tasks.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/tasks/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
  },

  // Documents
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/documents' as const,
      responses: { 200: z.array(z.custom<typeof documents.$inferSelect>()) },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/documents' as const,
      responses: { 201: z.custom<typeof documents.$inferSelect>(), 400: errorSchemas.validation },
    },
    get: {
      method: 'GET' as const,
      path: '/api/documents/:id' as const,
      responses: { 200: z.custom<typeof documents.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/documents/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
  },

  // Notifications
  notifications: {
    list: {
      method: 'GET' as const,
      path: '/api/notifications' as const,
      responses: { 200: z.array(z.custom<typeof notifications.$inferSelect>()) },
    },
    markRead: {
      method: 'PUT' as const,
      path: '/api/notifications/:id/read' as const,
      responses: { 200: z.custom<typeof notifications.$inferSelect>() },
    },
    markAllRead: {
      method: 'PUT' as const,
      path: '/api/notifications/read-all' as const,
      responses: { 200: z.object({ count: z.number() }) },
    },
  },

  // Referrals
  referrals: {
    list: {
      method: 'GET' as const,
      path: '/api/referrals' as const,
      responses: { 200: z.array(z.custom<typeof referrals.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/referrals/:id' as const,
      responses: { 200: z.custom<typeof referrals.$inferSelect>(), 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/referrals' as const,
      input: insertReferralSchema,
      responses: { 201: z.custom<typeof referrals.$inferSelect>(), 400: errorSchemas.validation },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/referrals/:id' as const,
      input: insertReferralSchema.partial(),
      responses: { 200: z.custom<typeof referrals.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/referrals/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
  },

  // Safety Plans
  safetyPlans: {
    list: {
      method: 'GET' as const,
      path: '/api/safety-plans' as const,
      responses: { 200: z.array(z.custom<typeof safetyPlans.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/safety-plans/:id' as const,
      responses: { 200: z.custom<typeof safetyPlans.$inferSelect>(), 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/safety-plans' as const,
      input: insertSafetyPlanSchema,
      responses: { 201: z.custom<typeof safetyPlans.$inferSelect>(), 400: errorSchemas.validation },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/safety-plans/:id' as const,
      input: insertSafetyPlanSchema.partial(),
      responses: { 200: z.custom<typeof safetyPlans.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/safety-plans/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
  },

  // CE Credits
  ceCredits: {
    list: {
      method: 'GET' as const,
      path: '/api/ce-credits' as const,
      responses: { 200: z.array(z.custom<typeof ceCredits.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/ce-credits' as const,
      input: insertCeCreditSchema,
      responses: { 201: z.custom<typeof ceCredits.$inferSelect>(), 400: errorSchemas.validation },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/ce-credits/:id' as const,
      input: insertCeCreditSchema.partial(),
      responses: { 200: z.custom<typeof ceCredits.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/ce-credits/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
  },

  // Message Threads
  messageThreads: {
    list: {
      method: 'GET' as const,
      path: '/api/message-threads' as const,
      responses: { 200: z.array(z.custom<typeof messageThreads.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/message-threads/:id' as const,
      responses: { 200: z.custom<typeof messageThreads.$inferSelect>(), 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/message-threads' as const,
      input: insertMessageThreadSchema,
      responses: { 201: z.custom<typeof messageThreads.$inferSelect>(), 400: errorSchemas.validation },
    },
  },

  // Messages
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/message-threads/:threadId/messages' as const,
      responses: { 200: z.array(z.custom<typeof messages.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/message-threads/:threadId/messages' as const,
      input: z.object({ body: z.string().min(1) }),
      responses: { 201: z.custom<typeof messages.$inferSelect>(), 400: errorSchemas.validation },
    },
    markRead: {
      method: 'PUT' as const,
      path: '/api/message-threads/:threadId/read' as const,
      responses: { 200: z.object({ count: z.number() }) },
    },
  },

  // Intake Forms
  intakeForms: {
    list: {
      method: 'GET' as const,
      path: '/api/intake-forms' as const,
      responses: { 200: z.array(z.custom<typeof intakeForms.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/intake-forms/:id' as const,
      responses: { 200: z.custom<typeof intakeForms.$inferSelect>(), 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/intake-forms' as const,
      input: insertIntakeFormSchema,
      responses: { 201: z.custom<typeof intakeForms.$inferSelect>(), 400: errorSchemas.validation },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/intake-forms/:id' as const,
      input: z.object({ status: z.string().optional(), formData: z.record(z.any()).optional() }),
      responses: { 200: z.custom<typeof intakeForms.$inferSelect>(), 404: errorSchemas.notFound },
    },
  },

  // Billing Records
  billingRecords: {
    list: {
      method: 'GET' as const,
      path: '/api/billing-records' as const,
      responses: { 200: z.array(z.custom<typeof billingRecords.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/billing-records/:id' as const,
      responses: { 200: z.custom<typeof billingRecords.$inferSelect>(), 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/billing-records' as const,
      input: insertBillingRecordSchema,
      responses: { 201: z.custom<typeof billingRecords.$inferSelect>(), 400: errorSchemas.validation },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/billing-records/:id' as const,
      input: insertBillingRecordSchema.partial(),
      responses: { 200: z.custom<typeof billingRecords.$inferSelect>(), 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/billing-records/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
  },

  // Utah Codes
  utahCodes: {
    list: {
      method: 'GET' as const,
      path: '/api/utah-codes' as const,
      responses: { 200: z.array(z.custom<typeof utahCodes.$inferSelect>()) },
    },
    search: {
      method: 'POST' as const,
      path: '/api/utah-codes/ai-search' as const,
      input: z.object({ query: z.string().min(1) }),
      responses: { 200: z.object({ results: z.array(z.any()), aiSummary: z.string() }) },
    },
  },

  // Client Portal Auth
  portalAuth: {
    login: {
      method: 'POST' as const,
      path: '/api/portal/login' as const,
      input: z.object({ email: z.string().email(), password: z.string().min(6) }),
      responses: { 200: z.object({ client: z.any(), token: z.string() }) },
    },
    me: {
      method: 'GET' as const,
      path: '/api/portal/me' as const,
      responses: { 200: z.any() },
    },
  },

  // Client Portal (client-facing)
  portal: {
    documents: {
      method: 'GET' as const,
      path: '/api/portal/documents' as const,
      responses: { 200: z.array(z.any()) },
    },
    intakeForms: {
      method: 'GET' as const,
      path: '/api/portal/intake-forms' as const,
      responses: { 200: z.array(z.any()) },
    },
    submitIntakeForm: {
      method: 'PUT' as const,
      path: '/api/portal/intake-forms/:id' as const,
      input: z.object({ formData: z.record(z.any()) }),
      responses: { 200: z.any() },
    },
    threads: {
      method: 'GET' as const,
      path: '/api/portal/messages' as const,
      responses: { 200: z.array(z.any()) },
    },
    threadMessages: {
      method: 'GET' as const,
      path: '/api/portal/messages/:threadId' as const,
      responses: { 200: z.array(z.any()) },
    },
    sendMessage: {
      method: 'POST' as const,
      path: '/api/portal/messages/:threadId' as const,
      input: z.object({ body: z.string().min(1) }),
      responses: { 201: z.any() },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type InsertSoapNote = z.infer<typeof api.soapNotes.create.input>;
export type InsertClient = z.infer<typeof api.clients.create.input>;
export type InsertTask = z.infer<typeof api.tasks.create.input>;
