import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import multer from "multer";
import OpenAI from "openai";
import bcrypt from "bcryptjs";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // ==================
  // SOAP Notes
  // ==================
  app.get(api.soapNotes.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const notes = await storage.getSoapNotes(req.user.claims.sub);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.soapNotes.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const note = await storage.getSoapNote(Number(req.params.id));
      if (!note) return res.status(404).json({ message: "Note not found" });
      if (note.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.soapNotes.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.soapNotes.create.input.parse(req.body);
      const note = await storage.createSoapNote(req.user.claims.sub, input);
      res.status(201).json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.soapNotes.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getSoapNote(id);
      if (!existing) return res.status(404).json({ message: "Note not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      const input = api.soapNotes.update.input.parse(req.body);
      const updated = await storage.updateSoapNote(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.soapNotes.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getSoapNote(id);
      if (!existing) return res.status(404).json({ message: "Note not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteSoapNote(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // Clients
  // ==================
  app.get(api.clients.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const result = await storage.getClients(req.user.claims.sub);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.clients.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const client = await storage.getClient(Number(req.params.id));
      if (!client) return res.status(404).json({ message: "Client not found" });
      if (client.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.clients.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.clients.create.input.parse(req.body);
      const client = await storage.createClient(req.user.claims.sub, input);
      res.status(201).json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.clients.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getClient(id);
      if (!existing) return res.status(404).json({ message: "Client not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      const input = api.clients.update.input.parse(req.body);
      const updated = await storage.updateClient(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.clients.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getClient(id);
      if (!existing) return res.status(404).json({ message: "Client not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteClient(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // Tasks
  // ==================
  app.get(api.tasks.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const result = await storage.getTasks(req.user.claims.sub);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.tasks.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(req.user.claims.sub, input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.tasks.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.tasks.update.input.parse(req.body);
      const updated = await storage.updateTask(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.tasks.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteTask(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // Documents
  // ==================
  app.get(api.documents.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
      const result = await storage.getDocuments(req.user.claims.sub, clientId);
      const docsWithoutData = result.map(({ data, ...rest }) => rest);
      res.json(docsWithoutData);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.documents.upload.path, isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const doc = await storage.createDocument(req.user.claims.sub, {
        name: req.body.name || req.file.originalname,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer.toString('base64'),
        category: req.body.category || 'general',
        clientId: req.body.clientId ? Number(req.body.clientId) : null,
        sharedWithClient: req.body.sharedWithClient === 'true',
      });
      const { data, ...rest } = doc;
      res.status(201).json(rest);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get(api.documents.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const doc = await storage.getDocument(Number(req.params.id));
      if (!doc) return res.status(404).json({ message: "Document not found" });
      if (doc.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });

      if (req.query.download === 'true') {
        const buffer = Buffer.from(doc.data, 'base64');
        res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
        res.setHeader('Content-Type', doc.mimeType);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
      }

      const { data, ...rest } = doc;
      res.json(rest);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.documents.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const doc = await storage.getDocument(id);
      if (!doc) return res.status(404).json({ message: "Document not found" });
      if (doc.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteDocument(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // Notifications
  // ==================
  app.get(api.notifications.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const result = await storage.getNotifications(req.user.claims.sub);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.notifications.markRead.path, isAuthenticated, async (req: any, res) => {
    try {
      const updated = await storage.markNotificationRead(Number(req.params.id));
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.notifications.markAllRead.path, isAuthenticated, async (req: any, res) => {
    try {
      const count = await storage.markAllNotificationsRead(req.user.claims.sub);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // Referrals
  // ==================
  app.get(api.referrals.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const result = await storage.getReferrals(req.user.claims.sub);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.referrals.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const referral = await storage.getReferral(Number(req.params.id));
      if (!referral) return res.status(404).json({ message: "Referral not found" });
      if (referral.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      res.json(referral);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.referrals.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.referrals.create.input.parse(req.body);
      const referral = await storage.createReferral(req.user.claims.sub, input);
      res.status(201).json(referral);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.referrals.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getReferral(id);
      if (!existing) return res.status(404).json({ message: "Referral not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      const input = api.referrals.update.input.parse(req.body);
      const updated = await storage.updateReferral(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.referrals.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getReferral(id);
      if (!existing) return res.status(404).json({ message: "Referral not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteReferral(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // Safety Plans
  // ==================
  app.get(api.safetyPlans.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const result = await storage.getSafetyPlans(req.user.claims.sub);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.safetyPlans.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const plan = await storage.getSafetyPlan(Number(req.params.id));
      if (!plan) return res.status(404).json({ message: "Safety plan not found" });
      if (plan.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.safetyPlans.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.safetyPlans.create.input.parse(req.body);
      const plan = await storage.createSafetyPlan(req.user.claims.sub, input);
      res.status(201).json(plan);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.safetyPlans.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getSafetyPlan(id);
      if (!existing) return res.status(404).json({ message: "Safety plan not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      const input = api.safetyPlans.update.input.parse(req.body);
      const updated = await storage.updateSafetyPlan(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.safetyPlans.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getSafetyPlan(id);
      if (!existing) return res.status(404).json({ message: "Safety plan not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteSafetyPlan(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // CE Credits
  // ==================
  app.get(api.ceCredits.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const result = await storage.getCeCredits(req.user.claims.sub);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.ceCredits.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.ceCredits.create.input.parse(req.body);
      const credit = await storage.createCeCredit(req.user.claims.sub, input);
      res.status(201).json(credit);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.ceCredits.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getCeCredit(id);
      if (!existing) return res.status(404).json({ message: "CE credit not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      const input = api.ceCredits.update.input.parse(req.body);
      const updated = await storage.updateCeCredit(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.ceCredits.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getCeCredit(id);
      if (!existing) return res.status(404).json({ message: "CE credit not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteCeCredit(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // AI Diagnosis/CPT Suggestion
  // ==================
  app.post(api.soapNotes.aiSuggest.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const note = await storage.getSoapNote(id);
      if (!note) return res.status(404).json({ message: "Note not found" });
      if (note.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const prompt = `You are a clinical coding assistant for a mental health professional. Based on the following SOAP note content, suggest the most appropriate ICD-10 diagnosis codes and CPT billing code.

SOAP Note:
- Subjective: ${note.subjective || 'Not provided'}
- Objective: ${note.objective || 'Not provided'}
- Assessment: ${note.assessment || 'Not provided'}
- Plan: ${note.plan || 'Not provided'}
- PHQ-9 Score: ${note.phq9Score || 'N/A'}
- GAD-7 Score: ${note.gad7Score || 'N/A'}
- Session Duration: ${note.startTime && note.endTime ? 'Available' : 'Not specified'}
- Current CPT Code: ${note.cptCode || 'Not set'}
- Is Telehealth: ${note.isTelehealth ? 'Yes' : 'No'}

Respond in valid JSON only with this exact structure:
{
  "suggestedDiagnoses": [
    {"code": "F-code", "name": "Diagnosis name", "confidence": 0.0-1.0}
  ],
  "suggestedCpt": "CPT code",
  "reasoning": "Brief clinical reasoning for suggestions"
}

Suggest up to 3 diagnoses ranked by confidence. Use standard ICD-10-CM F-codes. For CPT, consider session duration and telehealth status.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ message: "AI returned empty response" });
      }

      const parsed = JSON.parse(content);

      await storage.updateSoapNote(id, {
        aiSuggestedDiagnoses: parsed.suggestedDiagnoses,
        aiSuggestedCpt: parsed.suggestedCpt,
      });

      res.json(parsed);
    } catch (error) {
      console.error("AI suggestion error:", error);
      res.status(500).json({ message: "Failed to generate AI suggestions" });
    }
  });

  // ==================
  // Message Threads
  // ==================
  app.get(api.messageThreads.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const threads = await storage.getMessageThreads(req.user.claims.sub);
      res.json(threads);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.messageThreads.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const thread = await storage.getMessageThread(Number(req.params.id));
      if (!thread) return res.status(404).json({ message: "Thread not found" });
      if (thread.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      res.json(thread);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.messageThreads.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.messageThreads.create.input.parse(req.body);
      const thread = await storage.createMessageThread({ ...input, userId: req.user.claims.sub });
      res.status(201).json(thread);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // Messages
  // ==================
  app.get(api.messages.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const threadId = Number(req.params.threadId);
      const thread = await storage.getMessageThread(threadId);
      if (!thread) return res.status(404).json({ message: "Thread not found" });
      if (thread.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      const msgs = await storage.getMessages(threadId);
      res.json(msgs);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.messages.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const threadId = Number(req.params.threadId);
      const thread = await storage.getMessageThread(threadId);
      if (!thread) return res.status(404).json({ message: "Thread not found" });
      if (thread.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      const input = api.messages.create.input.parse(req.body);
      const message = await storage.createMessage({ threadId, senderType: 'provider', body: input.body });
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.messages.markRead.path, isAuthenticated, async (req: any, res) => {
    try {
      const threadId = Number(req.params.threadId);
      const thread = await storage.getMessageThread(threadId);
      if (!thread) return res.status(404).json({ message: "Thread not found" });
      if (thread.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      const count = await storage.markMessagesRead(threadId, 'client');
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // Intake Forms
  // ==================
  app.get(api.intakeForms.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const forms = await storage.getIntakeForms(req.user.claims.sub);
      res.json(forms);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.intakeForms.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const form = await storage.getIntakeForm(Number(req.params.id));
      if (!form) return res.status(404).json({ message: "Intake form not found" });
      if (form.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      res.json(form);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.intakeForms.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.intakeForms.create.input.parse(req.body);
      const form = await storage.createIntakeForm({ ...input, userId: req.user.claims.sub });
      res.status(201).json(form);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.intakeForms.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getIntakeForm(id);
      if (!existing) return res.status(404).json({ message: "Intake form not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      const input = api.intakeForms.update.input.parse(req.body);
      const updated = await storage.updateIntakeForm(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // Billing Records
  // ==================
  app.get(api.billingRecords.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const records = await storage.getBillingRecords(req.user.claims.sub);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.billingRecords.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const record = await storage.getBillingRecord(Number(req.params.id));
      if (!record) return res.status(404).json({ message: "Billing record not found" });
      if (record.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.billingRecords.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.billingRecords.create.input.parse(req.body);
      const record = await storage.createBillingRecord(req.user.claims.sub, input);
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.billingRecords.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getBillingRecord(id);
      if (!existing) return res.status(404).json({ message: "Billing record not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      const input = api.billingRecords.update.input.parse(req.body);
      const updated = await storage.updateBillingRecord(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.billingRecords.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getBillingRecord(id);
      if (!existing) return res.status(404).json({ message: "Billing record not found" });
      if (existing.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteBillingRecord(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // Utah Codes
  // ==================
  app.get(api.utahCodes.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const codes = await storage.getUtahCodes();
      res.json(codes);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.utahCodes.search.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.utahCodes.search.input.parse(req.body);
      const results = await storage.searchUtahCodes(input.query);

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const codesContext = results.map(c => `${c.section} - ${c.heading}: ${c.summary}`).join('\n');

      const prompt = `You are a legal assistant specializing in Utah mental health regulations. The user searched for: "${input.query}"

Here are the matching Utah codes found:
${codesContext || 'No exact matches found in the database.'}

Provide a concise, helpful summary of the relevant Utah regulations related to the user's query. If codes were found, explain their relevance. If no codes were found, provide general guidance about Utah mental health law on this topic.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      const aiSummary = completion.choices[0]?.message?.content || "Unable to generate AI summary.";

      res.json({ results, aiSummary });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error("Utah codes AI search error:", err);
      res.status(500).json({ message: "Failed to search Utah codes" });
    }
  });

  // ==================
  // Client Portal Auth
  // ==================
  const isPortalAuthenticated = (req: any, res: any, next: any) => {
    const portalSession = req.session?.portalClientId;
    const portalUserId = req.session?.portalUserId;
    if (!portalSession || !portalUserId) {
      return res.status(401).json({ message: "Portal authentication required" });
    }
    req.portalClientId = portalSession;
    req.portalUserId = portalUserId;
    next();
  };

  app.post(api.portalAuth.login.path, async (req: any, res) => {
    try {
      const input = api.portalAuth.login.input.parse(req.body);
      const account = await storage.getPortalAccountByEmail(input.email);
      if (!account) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (account.status !== 'active') {
        return res.status(401).json({ message: "Account is not active" });
      }
      const valid = await bcrypt.compare(input.password, account.hashedPassword);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      await storage.updatePortalAccountLogin(account.id);
      const client = await storage.getClient(account.clientId);

      req.session.portalClientId = account.clientId;
      req.session.portalUserId = account.userId;

      res.json({ client, token: 'session' });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.portalAuth.me.path, async (req: any, res) => {
    try {
      const portalClientId = req.session?.portalClientId;
      const portalUserId = req.session?.portalUserId;
      if (!portalClientId || !portalUserId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const client = await storage.getClient(portalClientId);
      if (!client) return res.status(404).json({ message: "Client not found" });
      res.json({ client, userId: portalUserId });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // Client Portal Data Routes
  // ==================
  app.get(api.portal.documents.path, isPortalAuthenticated, async (req: any, res) => {
    try {
      const docs = await storage.getDocuments(req.portalUserId, req.portalClientId);
      const sharedDocs = docs.filter(d => d.sharedWithClient);
      const docsWithoutData = sharedDocs.map(({ data, ...rest }) => rest);
      res.json(docsWithoutData);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.portal.intakeForms.path, isPortalAuthenticated, async (req: any, res) => {
    try {
      const forms = await storage.getIntakeFormsByClient(req.portalClientId);
      res.json(forms);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.portal.submitIntakeForm.path, isPortalAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const form = await storage.getIntakeForm(id);
      if (!form) return res.status(404).json({ message: "Form not found" });
      if (form.clientId !== req.portalClientId) return res.status(403).json({ message: "Forbidden" });
      const input = api.portal.submitIntakeForm.input.parse(req.body);
      const updated = await storage.updateIntakeForm(id, { formData: input.formData, status: 'submitted', submittedAt: new Date() });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.portal.threads.path, isPortalAuthenticated, async (req: any, res) => {
    try {
      const threads = await storage.getMessageThreadsByClient(req.portalClientId);
      res.json(threads);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.portal.threadMessages.path, isPortalAuthenticated, async (req: any, res) => {
    try {
      const threadId = Number(req.params.threadId);
      const thread = await storage.getMessageThread(threadId);
      if (!thread) return res.status(404).json({ message: "Thread not found" });
      if (thread.clientId !== req.portalClientId) return res.status(403).json({ message: "Forbidden" });
      const msgs = await storage.getMessages(threadId);
      await storage.markMessagesRead(threadId, 'provider');
      res.json(msgs);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.portal.sendMessage.path, isPortalAuthenticated, async (req: any, res) => {
    try {
      const threadId = Number(req.params.threadId);
      const thread = await storage.getMessageThread(threadId);
      if (!thread) return res.status(404).json({ message: "Thread not found" });
      if (thread.clientId !== req.portalClientId) return res.status(403).json({ message: "Forbidden" });
      const input = api.portal.sendMessage.input.parse(req.body);
      const message = await storage.createMessage({ threadId, senderType: 'client', body: input.body });
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================
  // Provider Portal Account Management
  // ==================
  app.post('/api/portal-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const input = z.object({
        clientId: z.number(),
        email: z.string().email(),
        password: z.string().min(6),
      }).parse(req.body);

      const existingAccount = await storage.getPortalAccountByEmail(input.email);
      if (existingAccount) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      const client = await storage.getClient(input.clientId);
      if (!client) return res.status(404).json({ message: "Client not found" });
      if (client.userId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const account = await storage.createPortalAccount({
        clientId: input.clientId,
        userId: req.user.claims.sub,
        email: input.email,
        hashedPassword,
        status: 'active',
      });
      const { hashedPassword: _, ...safeAccount } = account;
      res.status(201).json(safeAccount);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/portal-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const accounts = await storage.getPortalAccountsByProvider(req.user.claims.sub);
      const safeAccounts = accounts.map(({ hashedPassword, ...rest }) => rest);
      res.json(safeAccounts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
