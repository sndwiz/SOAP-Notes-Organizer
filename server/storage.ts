import { db } from "./db";
import {
  soapNotes, type SoapNote, type InsertSoapNote, type UpdateSoapNoteRequest,
  clients, type Client, type InsertClient,
  tasks, type Task, type InsertTask,
  documents, type Document, type InsertDocument,
  notifications, type Notification, type InsertNotification,
  referrals, type Referral, type InsertReferral,
  safetyPlans, type SafetyPlan, type InsertSafetyPlan,
  ceCredits, type CeCredit, type InsertCeCredit,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // SOAP Notes
  getSoapNotes(userId: string): Promise<SoapNote[]>;
  getSoapNote(id: number): Promise<SoapNote | undefined>;
  createSoapNote(userId: string, note: InsertSoapNote): Promise<SoapNote>;
  updateSoapNote(id: number, updates: UpdateSoapNoteRequest): Promise<SoapNote>;
  deleteSoapNote(id: number): Promise<void>;

  // Clients
  getClients(userId: string): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(userId: string, client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;

  // Tasks
  getTasks(userId: string): Promise<Task[]>;
  createTask(userId: string, task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Documents
  getDocuments(userId: string, clientId?: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(userId: string, doc: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(userId: string, notif: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<Notification>;
  markAllNotificationsRead(userId: string): Promise<number>;

  // Referrals
  getReferrals(userId: string): Promise<Referral[]>;
  getReferral(id: number): Promise<Referral | undefined>;
  createReferral(userId: string, referral: InsertReferral): Promise<Referral>;
  updateReferral(id: number, updates: Partial<InsertReferral>): Promise<Referral>;
  deleteReferral(id: number): Promise<void>;

  // Safety Plans
  getSafetyPlans(userId: string): Promise<SafetyPlan[]>;
  getSafetyPlan(id: number): Promise<SafetyPlan | undefined>;
  createSafetyPlan(userId: string, plan: InsertSafetyPlan): Promise<SafetyPlan>;
  updateSafetyPlan(id: number, updates: Partial<InsertSafetyPlan>): Promise<SafetyPlan>;
  deleteSafetyPlan(id: number): Promise<void>;

  // CE Credits
  getCeCredits(userId: string): Promise<CeCredit[]>;
  getCeCredit(id: number): Promise<CeCredit | undefined>;
  createCeCredit(userId: string, credit: InsertCeCredit): Promise<CeCredit>;
  updateCeCredit(id: number, updates: Partial<InsertCeCredit>): Promise<CeCredit>;
  deleteCeCredit(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ==================
  // SOAP Notes
  // ==================
  async getSoapNotes(userId: string): Promise<SoapNote[]> {
    return await db.select().from(soapNotes).where(eq(soapNotes.userId, userId)).orderBy(desc(soapNotes.updatedAt));
  }

  async getSoapNote(id: number): Promise<SoapNote | undefined> {
    const [note] = await db.select().from(soapNotes).where(eq(soapNotes.id, id));
    return note;
  }

  async createSoapNote(userId: string, note: InsertSoapNote): Promise<SoapNote> {
    const [created] = await db.insert(soapNotes).values({ ...note, userId }).returning();
    return created;
  }

  async updateSoapNote(id: number, updates: UpdateSoapNoteRequest): Promise<SoapNote> {
    const [updated] = await db.update(soapNotes).set({ ...updates, updatedAt: new Date() }).where(eq(soapNotes.id, id)).returning();
    return updated;
  }

  async deleteSoapNote(id: number): Promise<void> {
    await db.delete(soapNotes).where(eq(soapNotes.id, id));
  }

  // ==================
  // Clients
  // ==================
  async getClients(userId: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.updatedAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(userId: string, client: InsertClient): Promise<Client> {
    const [created] = await db.insert(clients).values({ ...client, userId }).returning();
    return created;
  }

  async updateClient(id: number, updates: Partial<InsertClient>): Promise<Client> {
    const [updated] = await db.update(clients).set({ ...updates, updatedAt: new Date() }).where(eq(clients.id, id)).returning();
    return updated;
  }

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // ==================
  // Tasks
  // ==================
  async getTasks(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  }

  async createTask(userId: string, task: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values({ ...task, userId }).returning();
    return created;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const [updated] = await db.update(tasks).set({ ...updates, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // ==================
  // Documents
  // ==================
  async getDocuments(userId: string, clientId?: number): Promise<Document[]> {
    if (clientId) {
      return await db.select().from(documents).where(and(eq(documents.userId, userId), eq(documents.clientId, clientId))).orderBy(desc(documents.createdAt));
    }
    return await db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.createdAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async createDocument(userId: string, doc: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values({ ...doc, userId }).returning();
    return created;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // ==================
  // Notifications
  // ==================
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(userId: string, notif: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values({ ...notif, userId }).returning();
    return created;
  }

  async markNotificationRead(id: number): Promise<Notification> {
    const [updated] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return updated;
  }

  async markAllNotificationsRead(userId: string): Promise<number> {
    const result = await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))).returning();
    return result.length;
  }

  // ==================
  // Referrals
  // ==================
  async getReferrals(userId: string): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.userId, userId)).orderBy(desc(referrals.createdAt));
  }

  async getReferral(id: number): Promise<Referral | undefined> {
    const [ref] = await db.select().from(referrals).where(eq(referrals.id, id));
    return ref;
  }

  async createReferral(userId: string, referral: InsertReferral): Promise<Referral> {
    const [created] = await db.insert(referrals).values({ ...referral, userId }).returning();
    return created;
  }

  async updateReferral(id: number, updates: Partial<InsertReferral>): Promise<Referral> {
    const [updated] = await db.update(referrals).set({ ...updates, updatedAt: new Date() }).where(eq(referrals.id, id)).returning();
    return updated;
  }

  async deleteReferral(id: number): Promise<void> {
    await db.delete(referrals).where(eq(referrals.id, id));
  }

  // ==================
  // Safety Plans
  // ==================
  async getSafetyPlans(userId: string): Promise<SafetyPlan[]> {
    return await db.select().from(safetyPlans).where(eq(safetyPlans.userId, userId)).orderBy(desc(safetyPlans.updatedAt));
  }

  async getSafetyPlan(id: number): Promise<SafetyPlan | undefined> {
    const [plan] = await db.select().from(safetyPlans).where(eq(safetyPlans.id, id));
    return plan;
  }

  async createSafetyPlan(userId: string, plan: InsertSafetyPlan): Promise<SafetyPlan> {
    const [created] = await db.insert(safetyPlans).values({ ...plan, userId }).returning();
    return created;
  }

  async updateSafetyPlan(id: number, updates: Partial<InsertSafetyPlan>): Promise<SafetyPlan> {
    const [updated] = await db.update(safetyPlans).set({ ...updates, updatedAt: new Date() }).where(eq(safetyPlans.id, id)).returning();
    return updated;
  }

  async deleteSafetyPlan(id: number): Promise<void> {
    await db.delete(safetyPlans).where(eq(safetyPlans.id, id));
  }

  // ==================
  // CE Credits
  // ==================
  async getCeCredits(userId: string): Promise<CeCredit[]> {
    return await db.select().from(ceCredits).where(eq(ceCredits.userId, userId)).orderBy(desc(ceCredits.createdAt));
  }

  async getCeCredit(id: number): Promise<CeCredit | undefined> {
    const [credit] = await db.select().from(ceCredits).where(eq(ceCredits.id, id));
    return credit;
  }

  async createCeCredit(userId: string, credit: InsertCeCredit): Promise<CeCredit> {
    const [created] = await db.insert(ceCredits).values({ ...credit, userId }).returning();
    return created;
  }

  async updateCeCredit(id: number, updates: Partial<InsertCeCredit>): Promise<CeCredit> {
    const [updated] = await db.update(ceCredits).set(updates).where(eq(ceCredits.id, id)).returning();
    return updated;
  }

  async deleteCeCredit(id: number): Promise<void> {
    await db.delete(ceCredits).where(eq(ceCredits.id, id));
  }
}

export const storage = new DatabaseStorage();
