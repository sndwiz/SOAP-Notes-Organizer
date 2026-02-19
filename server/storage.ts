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
  clientPortalAccounts, type ClientPortalAccount, type InsertClientPortalAccount,
  messageThreads, type MessageThread, type InsertMessageThread,
  messages, type Message, type InsertMessage,
  intakeForms, type IntakeForm, type InsertIntakeForm,
  billingRecords, type BillingRecord, type InsertBillingRecord,
  utahCodes, type UtahCode,
  auditLogs, type AuditLog, type InsertAuditLog,
  consentDocuments, type ConsentDocument, type InsertConsentDocument,
  treatmentPlans, type TreatmentPlan, type InsertTreatmentPlan,
} from "@shared/schema";
import { eq, desc, and, or, ilike, sql, count } from "drizzle-orm";

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
  getTask(id: number): Promise<Task | undefined>;
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
  getNotification(id: number): Promise<Notification | undefined>;
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

  // Client Portal Accounts
  getPortalAccountByEmail(email: string): Promise<ClientPortalAccount | undefined>;
  getPortalAccountByClientId(clientId: number): Promise<ClientPortalAccount | undefined>;
  getPortalAccountsByProvider(userId: string): Promise<ClientPortalAccount[]>;
  createPortalAccount(account: InsertClientPortalAccount): Promise<ClientPortalAccount>;
  updatePortalAccountLogin(id: number): Promise<void>;

  // Message Threads
  getMessageThreads(userId: string): Promise<MessageThread[]>;
  getMessageThreadsByClient(clientId: number): Promise<MessageThread[]>;
  getMessageThread(id: number): Promise<MessageThread | undefined>;
  createMessageThread(thread: InsertMessageThread): Promise<MessageThread>;

  // Messages
  getMessages(threadId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesRead(threadId: number, senderType: string): Promise<number>;
  getUnreadMessageCount(userId: string): Promise<number>;

  // Intake Forms
  getIntakeForms(userId: string): Promise<IntakeForm[]>;
  getIntakeFormsByClient(clientId: number): Promise<IntakeForm[]>;
  getIntakeForm(id: number): Promise<IntakeForm | undefined>;
  createIntakeForm(form: InsertIntakeForm): Promise<IntakeForm>;
  updateIntakeForm(id: number, updates: { status?: string; formData?: Record<string, any>; submittedAt?: Date; reviewedAt?: Date }): Promise<IntakeForm>;

  // Billing Records
  getBillingRecords(userId: string): Promise<BillingRecord[]>;
  getBillingRecord(id: number): Promise<BillingRecord | undefined>;
  createBillingRecord(userId: string, record: InsertBillingRecord): Promise<BillingRecord>;
  updateBillingRecord(id: number, updates: Partial<InsertBillingRecord>): Promise<BillingRecord>;
  deleteBillingRecord(id: number): Promise<void>;

  // Utah Codes
  getUtahCodes(): Promise<UtahCode[]>;
  searchUtahCodes(query: string): Promise<UtahCode[]>;
  createUtahCode(code: Omit<UtahCode, 'id'>): Promise<UtahCode>;

  // Audit Logs (HIPAA)
  getAuditLogs(userId: string): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Consent Documents
  getConsentDocuments(userId: string): Promise<ConsentDocument[]>;
  getConsentDocumentsByClient(clientId: number): Promise<ConsentDocument[]>;
  getConsentDocument(id: number): Promise<ConsentDocument | undefined>;
  createConsentDocument(userId: string, doc: InsertConsentDocument): Promise<ConsentDocument>;
  updateConsentDocument(id: number, updates: Partial<InsertConsentDocument>): Promise<ConsentDocument>;
  deleteConsentDocument(id: number): Promise<void>;

  // Treatment Plans
  getTreatmentPlans(userId: string): Promise<TreatmentPlan[]>;
  getTreatmentPlansByClient(clientId: number): Promise<TreatmentPlan[]>;
  getTreatmentPlan(id: number): Promise<TreatmentPlan | undefined>;
  createTreatmentPlan(userId: string, plan: InsertTreatmentPlan): Promise<TreatmentPlan>;
  updateTreatmentPlan(id: number, updates: Partial<InsertTreatmentPlan>): Promise<TreatmentPlan>;
  deleteTreatmentPlan(id: number): Promise<void>;
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

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
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

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notif] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notif;
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

  // ==================
  // Client Portal Accounts
  // ==================
  async getPortalAccountByEmail(email: string): Promise<ClientPortalAccount | undefined> {
    const [account] = await db.select().from(clientPortalAccounts).where(eq(clientPortalAccounts.email, email));
    return account;
  }

  async getPortalAccountByClientId(clientId: number): Promise<ClientPortalAccount | undefined> {
    const [account] = await db.select().from(clientPortalAccounts).where(eq(clientPortalAccounts.clientId, clientId));
    return account;
  }

  async getPortalAccountsByProvider(userId: string): Promise<ClientPortalAccount[]> {
    return await db.select().from(clientPortalAccounts).where(eq(clientPortalAccounts.userId, userId)).orderBy(desc(clientPortalAccounts.createdAt));
  }

  async createPortalAccount(account: InsertClientPortalAccount): Promise<ClientPortalAccount> {
    const [created] = await db.insert(clientPortalAccounts).values(account).returning();
    return created;
  }

  async updatePortalAccountLogin(id: number): Promise<void> {
    await db.update(clientPortalAccounts).set({ lastLoginAt: new Date() }).where(eq(clientPortalAccounts.id, id));
  }

  // ==================
  // Message Threads
  // ==================
  async getMessageThreads(userId: string): Promise<MessageThread[]> {
    return await db.select().from(messageThreads).where(eq(messageThreads.userId, userId)).orderBy(desc(messageThreads.lastMessageAt));
  }

  async getMessageThreadsByClient(clientId: number): Promise<MessageThread[]> {
    return await db.select().from(messageThreads).where(eq(messageThreads.clientId, clientId)).orderBy(desc(messageThreads.lastMessageAt));
  }

  async getMessageThread(id: number): Promise<MessageThread | undefined> {
    const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.id, id));
    return thread;
  }

  async createMessageThread(thread: InsertMessageThread): Promise<MessageThread> {
    const [created] = await db.insert(messageThreads).values(thread).returning();
    return created;
  }

  // ==================
  // Messages
  // ==================
  async getMessages(threadId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.threadId, threadId)).orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    await db.update(messageThreads).set({ lastMessageAt: new Date() }).where(eq(messageThreads.id, message.threadId));
    return created;
  }

  async markMessagesRead(threadId: number, senderType: string): Promise<number> {
    const result = await db.update(messages).set({ isRead: true }).where(and(eq(messages.threadId, threadId), eq(messages.senderType, senderType), eq(messages.isRead, false))).returning();
    return result.length;
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const result = await db
      .select({ total: count() })
      .from(messages)
      .innerJoin(messageThreads, eq(messages.threadId, messageThreads.id))
      .where(
        and(
          eq(messageThreads.userId, userId),
          eq(messages.senderType, 'client'),
          eq(messages.isRead, false)
        )
      );
    return Number(result[0]?.total ?? 0);
  }

  // ==================
  // Intake Forms
  // ==================
  async getIntakeForms(userId: string): Promise<IntakeForm[]> {
    return await db.select().from(intakeForms).where(eq(intakeForms.userId, userId)).orderBy(desc(intakeForms.createdAt));
  }

  async getIntakeFormsByClient(clientId: number): Promise<IntakeForm[]> {
    return await db.select().from(intakeForms).where(eq(intakeForms.clientId, clientId)).orderBy(desc(intakeForms.createdAt));
  }

  async getIntakeForm(id: number): Promise<IntakeForm | undefined> {
    const [form] = await db.select().from(intakeForms).where(eq(intakeForms.id, id));
    return form;
  }

  async createIntakeForm(form: InsertIntakeForm): Promise<IntakeForm> {
    const [created] = await db.insert(intakeForms).values(form).returning();
    return created;
  }

  async updateIntakeForm(id: number, updates: { status?: string; formData?: Record<string, any>; submittedAt?: Date; reviewedAt?: Date }): Promise<IntakeForm> {
    const [updated] = await db.update(intakeForms).set(updates).where(eq(intakeForms.id, id)).returning();
    return updated;
  }

  // ==================
  // Billing Records
  // ==================
  async getBillingRecords(userId: string): Promise<BillingRecord[]> {
    return await db.select().from(billingRecords).where(eq(billingRecords.userId, userId)).orderBy(desc(billingRecords.serviceDate));
  }

  async getBillingRecord(id: number): Promise<BillingRecord | undefined> {
    const [record] = await db.select().from(billingRecords).where(eq(billingRecords.id, id));
    return record;
  }

  async createBillingRecord(userId: string, record: InsertBillingRecord): Promise<BillingRecord> {
    const [created] = await db.insert(billingRecords).values({ ...record, userId }).returning();
    return created;
  }

  async updateBillingRecord(id: number, updates: Partial<InsertBillingRecord>): Promise<BillingRecord> {
    const [updated] = await db.update(billingRecords).set({ ...updates, updatedAt: new Date() }).where(eq(billingRecords.id, id)).returning();
    return updated;
  }

  async deleteBillingRecord(id: number): Promise<void> {
    await db.delete(billingRecords).where(eq(billingRecords.id, id));
  }

  // ==================
  // Utah Codes
  // ==================
  async getUtahCodes(): Promise<UtahCode[]> {
    return await db.select().from(utahCodes);
  }

  async searchUtahCodes(query: string): Promise<UtahCode[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(utahCodes).where(
      or(
        ilike(utahCodes.heading, searchTerm),
        ilike(utahCodes.summary, searchTerm),
        ilike(utahCodes.fullText, searchTerm),
        ilike(utahCodes.section, searchTerm),
        ilike(utahCodes.chapter, searchTerm),
      )
    );
  }

  async createUtahCode(code: Omit<UtahCode, 'id'>): Promise<UtahCode> {
    const [created] = await db.insert(utahCodes).values(code).returning();
    return created;
  }

  // ==================
  // Audit Logs (HIPAA)
  // ==================
  async getAuditLogs(userId: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt)).limit(200);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  // ==================
  // Consent Documents
  // ==================
  async getConsentDocuments(userId: string): Promise<ConsentDocument[]> {
    return await db.select().from(consentDocuments).where(eq(consentDocuments.userId, userId)).orderBy(desc(consentDocuments.createdAt));
  }

  async getConsentDocumentsByClient(clientId: number): Promise<ConsentDocument[]> {
    return await db.select().from(consentDocuments).where(eq(consentDocuments.clientId, clientId)).orderBy(desc(consentDocuments.createdAt));
  }

  async getConsentDocument(id: number): Promise<ConsentDocument | undefined> {
    const [doc] = await db.select().from(consentDocuments).where(eq(consentDocuments.id, id));
    return doc;
  }

  async createConsentDocument(userId: string, doc: InsertConsentDocument): Promise<ConsentDocument> {
    const [created] = await db.insert(consentDocuments).values({ ...doc, userId }).returning();
    return created;
  }

  async updateConsentDocument(id: number, updates: Partial<InsertConsentDocument>): Promise<ConsentDocument> {
    const [updated] = await db.update(consentDocuments).set({ ...updates, updatedAt: new Date() }).where(eq(consentDocuments.id, id)).returning();
    return updated;
  }

  async deleteConsentDocument(id: number): Promise<void> {
    await db.delete(consentDocuments).where(eq(consentDocuments.id, id));
  }

  // ==================
  // Treatment Plans
  // ==================
  async getTreatmentPlans(userId: string): Promise<TreatmentPlan[]> {
    return await db.select().from(treatmentPlans).where(eq(treatmentPlans.userId, userId)).orderBy(desc(treatmentPlans.updatedAt));
  }

  async getTreatmentPlansByClient(clientId: number): Promise<TreatmentPlan[]> {
    return await db.select().from(treatmentPlans).where(eq(treatmentPlans.clientId, clientId)).orderBy(desc(treatmentPlans.updatedAt));
  }

  async getTreatmentPlan(id: number): Promise<TreatmentPlan | undefined> {
    const [plan] = await db.select().from(treatmentPlans).where(eq(treatmentPlans.id, id));
    return plan;
  }

  async createTreatmentPlan(userId: string, plan: InsertTreatmentPlan): Promise<TreatmentPlan> {
    const [created] = await db.insert(treatmentPlans).values({ ...plan, userId }).returning();
    return created;
  }

  async updateTreatmentPlan(id: number, updates: Partial<InsertTreatmentPlan>): Promise<TreatmentPlan> {
    const [updated] = await db.update(treatmentPlans).set({ ...updates, updatedAt: new Date() }).where(eq(treatmentPlans.id, id)).returning();
    return updated;
  }

  async deleteTreatmentPlan(id: number): Promise<void> {
    await db.delete(treatmentPlans).where(eq(treatmentPlans.id, id));
  }
}

export const storage = new DatabaseStorage();
