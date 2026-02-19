import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  // SOAP Note Routes - Protected by isAuthenticated middleware
  
  // List Notes
  app.get(api.soapNotes.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notes = await storage.getSoapNotes(userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get Note
  app.get(api.soapNotes.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const note = await storage.getSoapNote(id);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Verify ownership
      if (note.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create Note
  app.post(api.soapNotes.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Force the userId to be the authenticated user
      const input = api.soapNotes.create.input.parse({
        ...req.body,
        userId: userId
      });
      
      const note = await storage.createSoapNote(input);
      res.status(201).json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update Note
  app.put(api.soapNotes.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existingNote = await storage.getSoapNote(id);
      
      if (!existingNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      if (existingNote.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const input = api.soapNotes.update.input.parse(req.body);
      const updatedNote = await storage.updateSoapNote(id, input);
      res.json(updatedNote);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete Note
  app.delete(api.soapNotes.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existingNote = await storage.getSoapNote(id);
      
      if (!existingNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      if (existingNote.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteSoapNote(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
