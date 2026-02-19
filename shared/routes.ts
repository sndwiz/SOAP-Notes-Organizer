import { z } from 'zod';
import { insertSoapNoteSchema, soapNotes, insertClientSchema, clients, insertTaskSchema, tasks, insertDocumentSchema, documents, insertNotificationSchema, notifications } from './schema';

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
