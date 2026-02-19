import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
export * from "./models/auth";

export const soapNotes = pgTable("soap_notes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id), // Link to Replit Auth user
  
  // Session Info
  clientName: text("client_name").notNull(),
  clientDOB: timestamp("client_dob"),
  providerName: text("provider_name"), // Can default to user's name
  sessionDate: timestamp("session_date").defaultNow().notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  location: text("location").default("Office"),
  isTelehealth: boolean("is_telehealth").default(false),
  cptCode: text("cpt_code").default("90837"),
  
  // SOAP Content
  subjective: text("subjective").default(""),
  objective: text("objective").default(""),
  assessment: text("assessment").default(""),
  plan: text("plan").default(""),
  
  // Assessments (JSONB for structured data)
  phq9Score: integer("phq9_score").default(0),
  phq9Items: jsonb("phq9_items").$type<number[]>().default([]),
  
  gad7Score: integer("gad7_score").default(0),
  gad7Items: jsonb("gad7_items").$type<number[]>().default([]),
  
  // Risk Assessment
  riskSuicidal: text("risk_suicidal").default("Denied"), // Denied, Passive, Active
  riskHomicidal: text("risk_homicidal").default("Denied"),
  riskSafetyPlan: boolean("risk_safety_plan").default(false),
  riskResources: boolean("risk_resources").default(false),
  
  // Diagnoses (JSONB array)
  diagnoses: jsonb("diagnoses").$type<{code: string, name: string}[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSoapNoteSchema = createInsertSchema(soapNotes).omit({ 
  id: true, 
  userId: true,
  createdAt: true, 
  updatedAt: true 
});

export type SoapNote = typeof soapNotes.$inferSelect;
export type InsertSoapNote = z.infer<typeof insertSoapNoteSchema>;

// Request Types
export type CreateSoapNoteRequest = InsertSoapNote;
export type UpdateSoapNoteRequest = Partial<InsertSoapNote>;

// Constants from Swift code for frontend use
export const CPT_CODES = [
    { code: "90832", description: "Psychotherapy, 16-37 min" },
    { code: "90834", description: "Psychotherapy, 38-52 min" },
    { code: "90837", description: "Psychotherapy, 53+ min" },
    { code: "90847", description: "Family therapy with patient" },
    { code: "90846", description: "Family therapy without patient" },
    { code: "90853", description: "Group psychotherapy" },
    { code: "90791", description: "Psychiatric diagnostic eval" },
    { code: "96156", description: "Health behavior assessment" }
];

export const COMMON_DIAGNOSES = [
    { code: "F32.0", name: "Major Depressive Disorder, Single Episode, Mild" },
    { code: "F32.1", name: "Major Depressive Disorder, Single Episode, Moderate" },
    { code: "F32.2", name: "Major Depressive Disorder, Single Episode, Severe" },
    { code: "F33.0", name: "Major Depressive Disorder, Recurrent, Mild" },
    { code: "F33.1", name: "Major Depressive Disorder, Recurrent, Moderate" },
    { code: "F33.2", name: "Major Depressive Disorder, Recurrent, Severe" },
    { code: "F41.1", name: "Generalized Anxiety Disorder" },
    { code: "F41.0", name: "Panic Disorder" },
    { code: "F40.10", name: "Social Anxiety Disorder" },
    { code: "F43.10", name: "PTSD, Unspecified" },
    { code: "F43.11", name: "PTSD, Acute" },
    { code: "F43.12", name: "PTSD, Chronic" },
    { code: "F43.21", name: "Adjustment Disorder with Depressed Mood" },
    { code: "F43.22", name: "Adjustment Disorder with Anxiety" },
    { code: "F43.23", name: "Adjustment Disorder, Mixed Anxiety/Depression" },
    { code: "F31.9", name: "Bipolar Disorder, Unspecified" },
    { code: "F31.81", name: "Bipolar II Disorder" },
    { code: "F42.2", name: "OCD, Mixed" },
    { code: "F50.00", name: "Anorexia Nervosa" },
    { code: "F50.2", name: "Bulimia Nervosa" },
    { code: "F50.81", name: "Binge Eating Disorder" },
    { code: "F60.3", name: "Borderline Personality Disorder" },
    { code: "F90.0", name: "ADHD, Inattentive Type" },
    { code: "F90.1", name: "ADHD, Hyperactive Type" },
    { code: "F90.2", name: "ADHD, Combined Type" },
    { code: "F10.10", name: "Alcohol Use Disorder, Mild" },
    { code: "F10.20", name: "Alcohol Use Disorder, Moderate" },
    { code: "F34.1", name: "Persistent Depressive Disorder" },
    { code: "F44.9", name: "Dissociative Disorder" },
    { code: "Z63.0", name: "Relationship Distress" },
    { code: "Z56.9", name: "Occupational Problem" },
    { code: "Z63.4", name: "Death of Family Member" }
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
