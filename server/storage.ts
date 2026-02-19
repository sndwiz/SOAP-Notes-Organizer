import { db } from "./db";
import {
  soapNotes,
  type SoapNote,
  type InsertSoapNote,
  type UpdateSoapNoteRequest,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // SOAP Notes
  getSoapNotes(userId: string): Promise<SoapNote[]>;
  getSoapNote(id: number): Promise<SoapNote | undefined>;
  createSoapNote(note: InsertSoapNote): Promise<SoapNote>;
  updateSoapNote(id: number, updates: UpdateSoapNoteRequest): Promise<SoapNote>;
  deleteSoapNote(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getSoapNotes(userId: string): Promise<SoapNote[]> {
    return await db
      .select()
      .from(soapNotes)
      .where(eq(soapNotes.userId, userId))
      .orderBy(desc(soapNotes.updatedAt));
  }

  async getSoapNote(id: number): Promise<SoapNote | undefined> {
    const [note] = await db.select().from(soapNotes).where(eq(soapNotes.id, id));
    return note;
  }

  async createSoapNote(note: InsertSoapNote): Promise<SoapNote> {
    const [created] = await db.insert(soapNotes).values(note).returning();
    return created;
  }

  async updateSoapNote(id: number, updates: UpdateSoapNoteRequest): Promise<SoapNote> {
    const [updated] = await db
      .update(soapNotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(soapNotes.id, id))
      .returning();
    return updated;
  }

  async deleteSoapNote(id: number): Promise<void> {
    await db.delete(soapNotes).where(eq(soapNotes.id, id));
  }
}

export const storage = new DatabaseStorage();
