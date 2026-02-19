import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
export * from "./models/auth";

// ============================================
// CLIENTS TABLE
// ============================================
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  insuranceProvider: text("insurance_provider"),
  insuranceId: text("insurance_id"),
  diagnoses: jsonb("diagnoses").$type<{code: string, name: string}[]>().default([]),
  notes: text("notes"),
  status: text("status").default("active"), // active, inactive, discharged
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true, userId: true, createdAt: true, updatedAt: true
});
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

// ============================================
// SOAP NOTES TABLE
// ============================================
export const soapNotes = pgTable("soap_notes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),

  clientName: text("client_name").notNull(),
  clientDOB: timestamp("client_dob"),
  providerName: text("provider_name"),
  sessionDate: timestamp("session_date").defaultNow().notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  location: text("location").default("Office"),
  isTelehealth: boolean("is_telehealth").default(false),
  cptCode: text("cpt_code").default("90837"),

  subjective: text("subjective").default(""),
  objective: text("objective").default(""),
  assessment: text("assessment").default(""),
  plan: text("plan").default(""),

  phq9Score: integer("phq9_score").default(0),
  phq9Items: jsonb("phq9_items").$type<number[]>().default([]),
  gad7Score: integer("gad7_score").default(0),
  gad7Items: jsonb("gad7_items").$type<number[]>().default([]),

  riskSuicidal: text("risk_suicidal").default("Denied"),
  riskHomicidal: text("risk_homicidal").default("Denied"),
  riskSafetyPlan: boolean("risk_safety_plan").default(false),
  riskResources: boolean("risk_resources").default(false),

  diagnoses: jsonb("diagnoses").$type<{code: string, name: string}[]>().default([]),

  // AI suggestions
  aiSuggestedDiagnoses: jsonb("ai_suggested_diagnoses").$type<{code: string, name: string, confidence: number}[]>(),
  aiSuggestedCpt: text("ai_suggested_cpt"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSoapNoteSchema = createInsertSchema(soapNotes).omit({
  id: true, userId: true, createdAt: true, updatedAt: true
});
export type SoapNote = typeof soapNotes.$inferSelect;
export type InsertSoapNote = z.infer<typeof insertSoapNoteSchema>;
export type CreateSoapNoteRequest = InsertSoapNote;
export type UpdateSoapNoteRequest = Partial<InsertSoapNote>;

// ============================================
// TASKS TABLE
// ============================================
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("medium"), // low, medium, high, urgent
  status: text("status").default("pending"), // pending, in_progress, completed
  category: text("category").default("general"), // general, follow-up, documentation, billing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true, userId: true, createdAt: true, updatedAt: true
});
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// ============================================
// DOCUMENTS TABLE
// ============================================
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(), // base64 encoded file data
  category: text("category").default("general"), // general, intake, consent, assessment, insurance, discharge
  sharedWithClient: boolean("shared_with_client").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true, userId: true, createdAt: true
});
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// ============================================
// NOTIFICATIONS TABLE
// ============================================
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info"), // info, warning, reminder, task
  isRead: boolean("is_read").default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true, userId: true, createdAt: true
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// ============================================
// EXPANDED CPT CODES
// ============================================
export const CPT_CODES = [
  // Evaluation & Management
  { code: "90791", description: "Psychiatric diagnostic eval", category: "Evaluation" },
  { code: "90792", description: "Psychiatric diagnostic eval with medical services", category: "Evaluation" },
  // Individual Therapy
  { code: "90832", description: "Psychotherapy, 16-37 min", category: "Individual" },
  { code: "90834", description: "Psychotherapy, 38-52 min", category: "Individual" },
  { code: "90837", description: "Psychotherapy, 53+ min", category: "Individual" },
  // Add-on Codes (use with E/M)
  { code: "90833", description: "Psychotherapy add-on, 16-37 min (with E/M)", category: "Add-on" },
  { code: "90836", description: "Psychotherapy add-on, 38-52 min (with E/M)", category: "Add-on" },
  { code: "90838", description: "Psychotherapy add-on, 53+ min (with E/M)", category: "Add-on" },
  // Family/Couples
  { code: "90847", description: "Family therapy with patient", category: "Family" },
  { code: "90846", description: "Family therapy without patient", category: "Family" },
  // Group
  { code: "90853", description: "Group psychotherapy", category: "Group" },
  // Crisis
  { code: "90839", description: "Crisis psychotherapy, first 60 min", category: "Crisis" },
  { code: "90840", description: "Crisis psychotherapy, each add'l 30 min", category: "Crisis" },
  // Health & Behavior
  { code: "96156", description: "Health behavior assessment", category: "Health Behavior" },
  { code: "96158", description: "Health behavior intervention, first 30 min", category: "Health Behavior" },
  { code: "96159", description: "Health behavior intervention, each add'l 15 min", category: "Health Behavior" },
  // Testing
  { code: "96130", description: "Psychological testing eval, first hour", category: "Testing" },
  { code: "96131", description: "Psychological testing eval, each add'l hour", category: "Testing" },
  { code: "96136", description: "Psychological test admin, first 30 min", category: "Testing" },
  { code: "96137", description: "Psychological test admin, each add'l 30 min", category: "Testing" },
  // E/M Codes
  { code: "99213", description: "Office visit, established patient, low complexity", category: "E/M" },
  { code: "99214", description: "Office visit, established patient, moderate complexity", category: "E/M" },
  { code: "99215", description: "Office visit, established patient, high complexity", category: "E/M" },
  // Telehealth Modifiers
  { code: "90837-95", description: "Psychotherapy 53+ min (synchronous telehealth)", category: "Telehealth" },
  { code: "90834-95", description: "Psychotherapy 38-52 min (synchronous telehealth)", category: "Telehealth" },
];

// ============================================
// EXPANDED DIAGNOSIS CODES (DSM-5-TR aligned)
// ============================================
export const COMMON_DIAGNOSES = [
  // Depressive Disorders
  { code: "F32.0", name: "Major Depressive Disorder, Single Episode, Mild", category: "Depressive" },
  { code: "F32.1", name: "Major Depressive Disorder, Single Episode, Moderate", category: "Depressive" },
  { code: "F32.2", name: "Major Depressive Disorder, Single Episode, Severe", category: "Depressive" },
  { code: "F32.3", name: "Major Depressive Disorder, Single Episode, Severe with Psychotic Features", category: "Depressive" },
  { code: "F32.4", name: "Major Depressive Disorder, Single Episode, In Partial Remission", category: "Depressive" },
  { code: "F32.5", name: "Major Depressive Disorder, Single Episode, In Full Remission", category: "Depressive" },
  { code: "F32.81", name: "Premenstrual Dysphoric Disorder", category: "Depressive" },
  { code: "F32.89", name: "Other Specified Depressive Disorder", category: "Depressive" },
  { code: "F32.A", name: "Depression, Unspecified", category: "Depressive" },
  { code: "F33.0", name: "Major Depressive Disorder, Recurrent, Mild", category: "Depressive" },
  { code: "F33.1", name: "Major Depressive Disorder, Recurrent, Moderate", category: "Depressive" },
  { code: "F33.2", name: "Major Depressive Disorder, Recurrent, Severe", category: "Depressive" },
  { code: "F33.3", name: "Major Depressive Disorder, Recurrent, Severe with Psychotic Features", category: "Depressive" },
  { code: "F33.40", name: "Major Depressive Disorder, Recurrent, In Remission, Unspecified", category: "Depressive" },
  { code: "F33.41", name: "Major Depressive Disorder, Recurrent, In Partial Remission", category: "Depressive" },
  { code: "F33.42", name: "Major Depressive Disorder, Recurrent, In Full Remission", category: "Depressive" },
  { code: "F34.1", name: "Persistent Depressive Disorder (Dysthymia)", category: "Depressive" },
  { code: "F34.81", name: "Disruptive Mood Dysregulation Disorder", category: "Depressive" },

  // Anxiety Disorders
  { code: "F41.1", name: "Generalized Anxiety Disorder", category: "Anxiety" },
  { code: "F41.0", name: "Panic Disorder", category: "Anxiety" },
  { code: "F40.10", name: "Social Anxiety Disorder (Social Phobia)", category: "Anxiety" },
  { code: "F40.00", name: "Agoraphobia", category: "Anxiety" },
  { code: "F40.218", name: "Specific Phobia, Animal Type", category: "Anxiety" },
  { code: "F40.228", name: "Specific Phobia, Natural Environment Type", category: "Anxiety" },
  { code: "F40.248", name: "Specific Phobia, Situational Type", category: "Anxiety" },
  { code: "F40.298", name: "Specific Phobia, Other", category: "Anxiety" },
  { code: "F41.8", name: "Other Specified Anxiety Disorder", category: "Anxiety" },
  { code: "F41.9", name: "Unspecified Anxiety Disorder", category: "Anxiety" },
  { code: "F93.0", name: "Separation Anxiety Disorder", category: "Anxiety" },
  { code: "F94.0", name: "Selective Mutism", category: "Anxiety" },

  // Trauma and Stressor-Related
  { code: "F43.10", name: "PTSD, Unspecified", category: "Trauma" },
  { code: "F43.11", name: "PTSD, Acute", category: "Trauma" },
  { code: "F43.12", name: "PTSD, Chronic", category: "Trauma" },
  { code: "F43.0", name: "Acute Stress Disorder", category: "Trauma" },
  { code: "F43.20", name: "Adjustment Disorder, Unspecified", category: "Trauma" },
  { code: "F43.21", name: "Adjustment Disorder with Depressed Mood", category: "Trauma" },
  { code: "F43.22", name: "Adjustment Disorder with Anxiety", category: "Trauma" },
  { code: "F43.23", name: "Adjustment Disorder, Mixed Anxiety/Depression", category: "Trauma" },
  { code: "F43.24", name: "Adjustment Disorder with Disturbance of Conduct", category: "Trauma" },
  { code: "F43.25", name: "Adjustment Disorder, Mixed Disturbance of Emotions and Conduct", category: "Trauma" },
  { code: "F43.89", name: "Other Specified Trauma- and Stressor-Related Disorder", category: "Trauma" },
  { code: "F43.9", name: "Unspecified Trauma- and Stressor-Related Disorder", category: "Trauma" },

  // Bipolar and Related
  { code: "F31.0", name: "Bipolar I, Current Episode Hypomanic", category: "Bipolar" },
  { code: "F31.11", name: "Bipolar I, Current Episode Manic, Without Psychotic Features", category: "Bipolar" },
  { code: "F31.12", name: "Bipolar I, Current Episode Manic, With Psychotic Features", category: "Bipolar" },
  { code: "F31.30", name: "Bipolar I, Current Episode Depressed, Mild", category: "Bipolar" },
  { code: "F31.31", name: "Bipolar I, Current Episode Depressed, Moderate", category: "Bipolar" },
  { code: "F31.32", name: "Bipolar I, Current Episode Depressed, Severe", category: "Bipolar" },
  { code: "F31.4", name: "Bipolar I, Current Episode Depressed, Severe with Psychotic Features", category: "Bipolar" },
  { code: "F31.71", name: "Bipolar I, In Partial Remission, Most Recent Episode Hypomanic", category: "Bipolar" },
  { code: "F31.73", name: "Bipolar I, In Partial Remission, Most Recent Episode Depressed", category: "Bipolar" },
  { code: "F31.81", name: "Bipolar II Disorder", category: "Bipolar" },
  { code: "F31.89", name: "Other Specified Bipolar and Related Disorder", category: "Bipolar" },
  { code: "F31.9", name: "Bipolar Disorder, Unspecified", category: "Bipolar" },
  { code: "F34.0", name: "Cyclothymic Disorder", category: "Bipolar" },

  // OCD and Related
  { code: "F42.2", name: "OCD, Mixed Obsessions and Compulsions", category: "OCD" },
  { code: "F42.3", name: "Hoarding Disorder", category: "OCD" },
  { code: "F42.4", name: "Excoriation (Skin-Picking) Disorder", category: "OCD" },
  { code: "F42.8", name: "Other Specified OCD and Related Disorder", category: "OCD" },
  { code: "F63.3", name: "Trichotillomania (Hair-Pulling Disorder)", category: "OCD" },
  { code: "F45.22", name: "Body Dysmorphic Disorder", category: "OCD" },

  // Eating Disorders
  { code: "F50.00", name: "Anorexia Nervosa, Restricting Type", category: "Eating" },
  { code: "F50.02", name: "Anorexia Nervosa, Binge-Eating/Purging Type", category: "Eating" },
  { code: "F50.2", name: "Bulimia Nervosa", category: "Eating" },
  { code: "F50.81", name: "Binge Eating Disorder", category: "Eating" },
  { code: "F50.82", name: "Avoidant/Restrictive Food Intake Disorder", category: "Eating" },
  { code: "F50.89", name: "Other Specified Feeding or Eating Disorder", category: "Eating" },
  { code: "F98.21", name: "Rumination Disorder", category: "Eating" },
  { code: "F98.3", name: "Pica", category: "Eating" },

  // Personality Disorders
  { code: "F60.0", name: "Paranoid Personality Disorder", category: "Personality" },
  { code: "F60.1", name: "Schizoid Personality Disorder", category: "Personality" },
  { code: "F60.2", name: "Antisocial Personality Disorder", category: "Personality" },
  { code: "F60.3", name: "Borderline Personality Disorder", category: "Personality" },
  { code: "F60.4", name: "Histrionic Personality Disorder", category: "Personality" },
  { code: "F60.5", name: "Obsessive-Compulsive Personality Disorder", category: "Personality" },
  { code: "F60.6", name: "Avoidant Personality Disorder", category: "Personality" },
  { code: "F60.7", name: "Dependent Personality Disorder", category: "Personality" },
  { code: "F60.81", name: "Narcissistic Personality Disorder", category: "Personality" },
  { code: "F60.89", name: "Other Specified Personality Disorder", category: "Personality" },

  // ADHD
  { code: "F90.0", name: "ADHD, Predominantly Inattentive", category: "ADHD" },
  { code: "F90.1", name: "ADHD, Predominantly Hyperactive-Impulsive", category: "ADHD" },
  { code: "F90.2", name: "ADHD, Combined Presentation", category: "ADHD" },
  { code: "F90.8", name: "Other Specified ADHD", category: "ADHD" },
  { code: "F90.9", name: "Unspecified ADHD", category: "ADHD" },

  // Substance Use
  { code: "F10.10", name: "Alcohol Use Disorder, Mild", category: "Substance" },
  { code: "F10.20", name: "Alcohol Use Disorder, Moderate", category: "Substance" },
  { code: "F10.21", name: "Alcohol Use Disorder, Moderate, In Remission", category: "Substance" },
  { code: "F11.10", name: "Opioid Use Disorder, Mild", category: "Substance" },
  { code: "F11.20", name: "Opioid Use Disorder, Moderate", category: "Substance" },
  { code: "F12.10", name: "Cannabis Use Disorder, Mild", category: "Substance" },
  { code: "F12.20", name: "Cannabis Use Disorder, Moderate", category: "Substance" },
  { code: "F13.10", name: "Sedative/Hypnotic/Anxiolytic Use Disorder, Mild", category: "Substance" },
  { code: "F14.10", name: "Cocaine Use Disorder, Mild", category: "Substance" },
  { code: "F15.10", name: "Stimulant Use Disorder, Mild", category: "Substance" },
  { code: "F19.10", name: "Other Substance Use Disorder, Mild", category: "Substance" },

  // Dissociative
  { code: "F44.0", name: "Dissociative Amnesia", category: "Dissociative" },
  { code: "F44.1", name: "Dissociative Fugue", category: "Dissociative" },
  { code: "F44.81", name: "Dissociative Identity Disorder", category: "Dissociative" },
  { code: "F48.1", name: "Depersonalization/Derealization Disorder", category: "Dissociative" },
  { code: "F44.9", name: "Dissociative Disorder, Unspecified", category: "Dissociative" },

  // Somatic and Related
  { code: "F45.1", name: "Illness Anxiety Disorder", category: "Somatic" },
  { code: "F68.10", name: "Factitious Disorder", category: "Somatic" },
  { code: "F54", name: "Psychological Factors Affecting Medical Condition", category: "Somatic" },

  // Sleep-Wake
  { code: "G47.00", name: "Insomnia Disorder", category: "Sleep" },
  { code: "F51.01", name: "Primary Insomnia", category: "Sleep" },
  { code: "F51.11", name: "Hypersomnia Disorder", category: "Sleep" },
  { code: "F51.5", name: "Nightmare Disorder", category: "Sleep" },

  // Other Conditions
  { code: "F64.0", name: "Gender Dysphoria in Adolescents and Adults", category: "Other" },
  { code: "F63.0", name: "Gambling Disorder", category: "Other" },
  { code: "F91.3", name: "Oppositional Defiant Disorder", category: "Other" },
  { code: "F91.1", name: "Conduct Disorder, Childhood-Onset Type", category: "Other" },
  { code: "F91.2", name: "Conduct Disorder, Adolescent-Onset Type", category: "Other" },
  { code: "F94.1", name: "Reactive Attachment Disorder", category: "Other" },
  { code: "F94.2", name: "Disinhibited Social Engagement Disorder", category: "Other" },

  // V/Z Codes (Other Conditions)
  { code: "Z63.0", name: "Relationship Distress with Spouse/Partner", category: "V/Z Codes" },
  { code: "Z56.9", name: "Occupational Problem", category: "V/Z Codes" },
  { code: "Z63.4", name: "Uncomplicated Bereavement", category: "V/Z Codes" },
  { code: "Z65.8", name: "Religious or Spiritual Problem", category: "V/Z Codes" },
  { code: "Z60.0", name: "Phase of Life Problem", category: "V/Z Codes" },
  { code: "Z71.9", name: "Counseling, Unspecified", category: "V/Z Codes" },
  { code: "Z62.820", name: "Parent-Child Relational Problem", category: "V/Z Codes" },
  { code: "Z69.010", name: "Encounter for Mental Health Services for Victim of Spouse/Partner Abuse", category: "V/Z Codes" },
  { code: "Z62.810", name: "Personal History of Physical Abuse in Childhood", category: "V/Z Codes" },
  { code: "Z62.811", name: "Personal History of Psychological Abuse in Childhood", category: "V/Z Codes" },
  { code: "Z62.812", name: "Personal History of Neglect in Childhood", category: "V/Z Codes" },
  { code: "Z62.813", name: "Personal History of Sexual Abuse in Childhood", category: "V/Z Codes" },
  { code: "Z91.52", name: "Personal History of Self-Harm", category: "V/Z Codes" },
];

export const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling/staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself",
  "Trouble concentrating",
  "Moving/speaking slowly or being fidgety",
  "Thoughts of being better off dead or hurting yourself"
];

export const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid something awful might happen"
];

export const DOCUMENT_CATEGORIES = [
  "general", "intake", "consent", "assessment", "insurance", "discharge", "treatment-plan", "progress-note", "referral"
];

// ============================================
// REFERRALS TABLE
// ============================================
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  providerName: text("provider_name").notNull(),
  providerType: text("provider_type").notNull(), // psychiatrist, psychologist, primary-care, specialist
  specialty: text("specialty"), // med-management, neuropsych, substance-abuse, child-adolescent, geriatric
  phone: text("phone"),
  fax: text("fax"),
  email: text("email"),
  address: text("address"),
  insurancesAccepted: jsonb("insurances_accepted").$type<string[]>().default([]),
  acceptingNewPatients: boolean("accepting_new_patients").default(true),
  telehealth: boolean("telehealth").default(false),
  notes: text("notes"),
  referralDate: timestamp("referral_date").defaultNow(),
  status: text("status").default("pending"), // pending, sent, accepted, declined, completed
  reasonForReferral: text("reason_for_referral"),
  roiSigned: boolean("roi_signed").default(false),
  roiDate: timestamp("roi_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true, userId: true, createdAt: true, updatedAt: true
});
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

// ============================================
// SAFETY PLANS TABLE
// ============================================
export const safetyPlans = pgTable("safety_plans", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  clientName: text("client_name").notNull(),
  warningSignals: jsonb("warning_signals").$type<string[]>().default([]),
  copingStrategies: jsonb("coping_strategies").$type<string[]>().default([]),
  socialDistractions: jsonb("social_distractions").$type<{name: string, phone?: string}[]>().default([]),
  professionalContacts: jsonb("professional_contacts").$type<{name: string, phone?: string, role?: string}[]>().default([]),
  emergencyContacts: jsonb("emergency_contacts").$type<{name: string, phone: string, relationship?: string}[]>().default([]),
  crisisResources: jsonb("crisis_resources").$type<{name: string, phone: string}[]>().default([
    { name: "988 Suicide & Crisis Lifeline", phone: "988" },
    { name: "Crisis Text Line", phone: "Text HOME to 741741" },
    { name: "Emergency Services", phone: "911" }
  ]),
  environmentSafety: jsonb("environment_safety").$type<string[]>().default([]),
  reasonsForLiving: jsonb("reasons_for_living").$type<string[]>().default([]),
  status: text("status").default("active"), // active, updated, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSafetyPlanSchema = createInsertSchema(safetyPlans).omit({
  id: true, userId: true, createdAt: true, updatedAt: true
});
export type SafetyPlan = typeof safetyPlans.$inferSelect;
export type InsertSafetyPlan = z.infer<typeof insertSafetyPlanSchema>;

// ============================================
// CE CREDITS TABLE
// ============================================
export const ceCredits = pgTable("ce_credits", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  provider: text("provider"),
  category: text("category").default("general"), // ethics, cultural-competency, supervision, clinical, general
  hours: integer("hours").notNull(),
  completionDate: timestamp("completion_date"),
  expirationDate: timestamp("expiration_date"),
  certificateUrl: text("certificate_url"),
  notes: text("notes"),
  status: text("status").default("completed"), // planned, in-progress, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCeCreditSchema = createInsertSchema(ceCredits).omit({
  id: true, userId: true, createdAt: true
});
export type CeCredit = typeof ceCredits.$inferSelect;
export type InsertCeCredit = z.infer<typeof insertCeCreditSchema>;

// ============================================
// CE REQUIREMENTS CONFIG
// ============================================
export const CE_CATEGORIES = [
  { id: "ethics", name: "Ethics", requiredHours: 6 },
  { id: "cultural-competency", name: "Cultural Competency", requiredHours: 4 },
  { id: "supervision", name: "Supervision", requiredHours: 6 },
  { id: "clinical", name: "Clinical Topics", requiredHours: 20 },
  { id: "general", name: "General CE", requiredHours: 0 },
];

export const INSURANCE_PROVIDERS = [
  "Aetna", "Anthem", "Blue Cross Blue Shield", "Cigna", "Humana",
  "Kaiser Permanente", "Magellan", "Medicare", "Medicaid", "Optum",
  "Oscar Health", "Tricare", "UnitedHealthcare", "Self-Pay", "Other"
];

export const PROVIDER_SPECIALTIES = [
  { id: "med-management", name: "Medication Management" },
  { id: "neuropsych", name: "Neuropsychological Testing" },
  { id: "substance-abuse", name: "Substance Abuse Treatment" },
  { id: "child-adolescent", name: "Child & Adolescent" },
  { id: "geriatric", name: "Geriatric Psychiatry" },
  { id: "forensic", name: "Forensic Psychiatry" },
  { id: "eating-disorders", name: "Eating Disorders" },
  { id: "trauma", name: "Trauma Specialist" },
  { id: "general", name: "General Psychiatry" },
];
