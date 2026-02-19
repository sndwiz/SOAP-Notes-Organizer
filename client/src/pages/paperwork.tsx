import { useState, useRef } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Printer, Shield, Phone, DollarSign, Calendar,
  ClipboardList, UserCheck, Video, XCircle, Receipt, ArrowLeft,
  Check,
} from "lucide-react";
import { CONSENT_DOCUMENT_TYPES, CPT_CODES, COMMON_DIAGNOSES, type Client, type BillingRecord } from "@shared/schema";

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
}

const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "informed-consent",
    name: "Informed Consent for Treatment",
    description: "Standard clinical consent with practice info, client rights, confidentiality limits, and signatures",
    icon: ClipboardList,
    category: "Consent",
  },
  {
    id: "hipaa-npp",
    name: "Notice of Privacy Practices (HIPAA)",
    description: "HIPAA notice covering PHI usage, patient rights, practice responsibilities, and complaint procedures",
    icon: Shield,
    category: "Privacy",
  },
  {
    id: "release-of-info",
    name: "Authorization for Release of Information",
    description: "ROI form for authorizing disclosure of protected health information",
    icon: FileText,
    category: "Authorization",
  },
  {
    id: "telehealth-consent",
    name: "Telehealth Informed Consent",
    description: "Risks/benefits of telehealth, technology requirements, emergency protocols",
    icon: Video,
    category: "Consent",
  },
  {
    id: "cancellation-policy",
    name: "Cancellation/No-Show Policy",
    description: "Notice requirements, fees, exceptions, late arrival policy",
    icon: XCircle,
    category: "Policy",
  },
  {
    id: "financial-agreement",
    name: "Financial Agreement",
    description: "Fee schedule, payment methods, insurance billing, copay/deductible responsibility",
    icon: DollarSign,
    category: "Financial",
  },
  {
    id: "superbill",
    name: "Superbill",
    description: "Generated from billing records with CPT codes, diagnoses, and insurance info",
    icon: Receipt,
    category: "Billing",
  },
  {
    id: "discharge-summary",
    name: "Discharge Summary",
    description: "Client discharge with treatment summary, progress, recommendations, and aftercare plan",
    icon: UserCheck,
    category: "Clinical",
  },
];

function formatDate(d?: string | Date | null): string {
  if (!d) return "________________";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PaperworkPage() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedBillingId, setSelectedBillingId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [practiceName, setPracticeName] = useState("Clinical Practice");
  const [therapistName, setTherapistName] = useState("");
  const [therapistCredentials, setTherapistCredentials] = useState("");
  const [therapistPhone, setTherapistPhone] = useState("");
  const [therapistAddress, setTherapistAddress] = useState("");

  const [roiRecipient, setRoiRecipient] = useState("");
  const [roiPurpose, setRoiPurpose] = useState("");
  const [roiInfo, setRoiInfo] = useState("");
  const [roiExpiration, setRoiExpiration] = useState("");

  const [dischargeAdmitDate, setDischargeAdmitDate] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");
  const [dischargeDiagnoses, setDischargeDiagnoses] = useState("");
  const [dischargeTreatmentSummary, setDischargeTreatmentSummary] = useState("");
  const [dischargeProgress, setDischargeProgress] = useState("");
  const [dischargeRecommendations, setDischargeRecommendations] = useState("");
  const [dischargeReferrals, setDischargeReferrals] = useState("");
  const [dischargeAftercare, setDischargeAftercare] = useState("");

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: billingRecords = [] } = useQuery<BillingRecord[]>({
    queryKey: ["/api/billing-records"],
  });

  const { data: superbillData } = useQuery<any>({
    queryKey: ["/api/billing-records", selectedBillingId, "superbill"],
    enabled: !!selectedBillingId && selectedTemplate === "superbill",
  });

  const selectedClient = clients.find((c) => c.id === Number(selectedClientId));
  const template = DOCUMENT_TEMPLATES.find((t) => t.id === selectedTemplate);

  function handleGenerate() {
    if (selectedTemplate === "superbill") {
      if (!selectedBillingId) {
        toast({ title: "Please select a billing record", variant: "destructive" });
        return;
      }
    } else if (!selectedClientId) {
      toast({ title: "Please select a client", variant: "destructive" });
      return;
    }
    setShowPreview(true);
  }

  function handlePrint() {
    window.print();
  }

  function handleBack() {
    if (showPreview) {
      setShowPreview(false);
    } else {
      setSelectedTemplate(null);
      setSelectedClientId("");
      setSelectedBillingId("");
      setShowPreview(false);
    }
  }

  function getClientName(client?: Client | null): string {
    if (!client) return "________________";
    return `${client.firstName} ${client.lastName}`;
  }

  function renderDocumentContent() {
    const client = selectedClient;
    const today = formatDate(new Date());

    switch (selectedTemplate) {
      case "informed-consent":
        return (
          <div className="document-body">
            <h1 className="text-2xl font-bold text-center mb-1">{practiceName}</h1>
            <h2 className="text-lg font-semibold text-center mb-6">Informed Consent for Treatment</h2>

            <div className="mb-4">
              <p className="mb-2"><strong>Client Name:</strong> {getClientName(client)}</p>
              <p className="mb-2"><strong>Date of Birth:</strong> {formatDate(client?.dateOfBirth)}</p>
              <p className="mb-2"><strong>Date:</strong> {today}</p>
              <p className="mb-2"><strong>Therapist:</strong> {therapistName || "________________"}, {therapistCredentials || "________________"}</p>
            </div>

            <Separator className="my-4 print:border-t print:border-black" />

            <h3 className="text-base font-semibold mb-2">Purpose of Treatment</h3>
            <p className="mb-4 text-sm leading-relaxed">
              I, {getClientName(client)}, voluntarily consent to participate in psychotherapy/counseling services
              provided by {therapistName || "[Therapist Name]"}, {therapistCredentials || "[Credentials]"}.
              I understand that therapy involves exploring thoughts, feelings, and behaviors in a safe and
              confidential environment. Treatment may include individual therapy, assessment, and other
              evidence-based interventions deemed appropriate by my therapist.
            </p>

            <h3 className="text-base font-semibold mb-2">Benefits and Risks of Treatment</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Therapy has been shown to benefit most individuals. However, results are not guaranteed. Potential
              benefits include improved coping skills, symptom reduction, improved relationships, and enhanced
              self-awareness. Potential risks may include temporary discomfort when discussing difficult topics,
              changes in relationships, and the recall of unpleasant memories.
            </p>

            <h3 className="text-base font-semibold mb-2">Confidentiality</h3>
            <p className="mb-4 text-sm leading-relaxed">
              All information shared during therapy sessions is confidential and will not be disclosed without
              written authorization, except as required by law. Exceptions to confidentiality include:
            </p>
            <ul className="list-disc pl-6 mb-4 text-sm space-y-1">
              <li>Suspected child abuse or neglect</li>
              <li>Suspected elder abuse or abuse of a vulnerable adult</li>
              <li>Imminent danger of harm to self or others</li>
              <li>Court order or subpoena</li>
              <li>As otherwise required by law</li>
            </ul>

            <h3 className="text-base font-semibold mb-2">Client Rights</h3>
            <ul className="list-disc pl-6 mb-4 text-sm space-y-1">
              <li>You have the right to ask questions about your treatment at any time</li>
              <li>You have the right to refuse or discontinue treatment at any time</li>
              <li>You have the right to request a referral to another provider</li>
              <li>You have the right to review your treatment records</li>
              <li>You have the right to be treated with dignity and respect</li>
            </ul>

            <h3 className="text-base font-semibold mb-2">Emergency Procedures</h3>
            <p className="mb-4 text-sm leading-relaxed">
              If you are experiencing a psychiatric emergency, please call 911 or go to the nearest emergency
              room. You may also contact the 988 Suicide & Crisis Lifeline by calling or texting 988.
              During non-emergency situations outside of session, you may contact the office at{" "}
              {therapistPhone || "[Phone Number]"}.
            </p>

            <h3 className="text-base font-semibold mb-2">Fees and Payment</h3>
            <p className="mb-6 text-sm leading-relaxed">
              Fees for services will be discussed and agreed upon prior to the start of treatment.
              A separate Financial Agreement outlines payment terms and policies.
            </p>

            <Separator className="my-6 print:border-t print:border-black" />

            <p className="mb-2 text-sm">
              By signing below, I acknowledge that I have read and understand this Informed Consent,
              have had the opportunity to ask questions, and agree to participate in treatment.
            </p>

            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Client Signature</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Therapist Signature</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
            </div>
          </div>
        );

      case "hipaa-npp":
        return (
          <div className="document-body">
            <h1 className="text-2xl font-bold text-center mb-1">{practiceName}</h1>
            <h2 className="text-lg font-semibold text-center mb-6">Notice of Privacy Practices</h2>
            <p className="text-center text-sm text-muted-foreground mb-6">Effective Date: {today}</p>

            <h3 className="text-base font-semibold mb-2">THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.</h3>

            <h3 className="text-base font-semibold mb-2 mt-6">Uses and Disclosures of Protected Health Information (PHI)</h3>
            <p className="mb-2 text-sm leading-relaxed">Your PHI may be used and disclosed for the following purposes:</p>
            <ul className="list-disc pl-6 mb-4 text-sm space-y-1">
              <li><strong>Treatment:</strong> To provide, coordinate, or manage your health care and related services, including consultation with other providers.</li>
              <li><strong>Payment:</strong> To obtain reimbursement for services, including billing, claims management, and collection activities.</li>
              <li><strong>Health Care Operations:</strong> For quality assessment, credentialing, auditing, compliance, and business management.</li>
              <li><strong>As Required by Law:</strong> Including mandatory reporting of abuse, neglect, or threats of harm.</li>
            </ul>

            <h3 className="text-base font-semibold mb-2">Your Rights Regarding Your PHI</h3>
            <ul className="list-disc pl-6 mb-4 text-sm space-y-1">
              <li><strong>Right to Access:</strong> You may request copies of your PHI maintained by this practice.</li>
              <li><strong>Right to Amend:</strong> You may request amendments to your PHI if you believe it is inaccurate.</li>
              <li><strong>Right to an Accounting of Disclosures:</strong> You may request a list of certain disclosures made of your PHI.</li>
              <li><strong>Right to Request Restrictions:</strong> You may request restrictions on certain uses and disclosures of your PHI.</li>
              <li><strong>Right to Request Confidential Communications:</strong> You may request that communications be sent to a specific address or by a specific method.</li>
              <li><strong>Right to a Paper Copy:</strong> You may request a paper copy of this Notice at any time.</li>
              <li><strong>Right to Revoke Authorization:</strong> You may revoke any written authorization at any time.</li>
            </ul>

            <h3 className="text-base font-semibold mb-2">Practice Responsibilities</h3>
            <ul className="list-disc pl-6 mb-4 text-sm space-y-1">
              <li>This practice is required by law to maintain the privacy of your PHI.</li>
              <li>This practice is required to provide you with this Notice of its legal duties and privacy practices.</li>
              <li>This practice is required to abide by the terms of this Notice currently in effect.</li>
              <li>This practice reserves the right to change the terms of this Notice and to make new provisions effective for all PHI maintained.</li>
            </ul>

            <h3 className="text-base font-semibold mb-2">Complaints</h3>
            <p className="mb-4 text-sm leading-relaxed">
              If you believe your privacy rights have been violated, you may file a complaint with this practice
              or with the Secretary of the U.S. Department of Health and Human Services. You will not be
              retaliated against for filing a complaint. To file a complaint with HHS, visit www.hhs.gov/ocr/privacy/hipaa/complaints/.
            </p>

            <h3 className="text-base font-semibold mb-2">Contact Information</h3>
            <p className="mb-1 text-sm">{practiceName}</p>
            <p className="mb-1 text-sm">{therapistName || "[Therapist Name]"}, {therapistCredentials || "[Credentials]"}</p>
            <p className="mb-1 text-sm">{therapistAddress || "[Address]"}</p>
            <p className="mb-6 text-sm">{therapistPhone || "[Phone]"}</p>

            <Separator className="my-6 print:border-t print:border-black" />

            <h3 className="text-base font-semibold mb-4">Acknowledgment of Receipt</h3>
            <p className="mb-6 text-sm">
              I, {getClientName(client)}, acknowledge that I have received a copy of this Notice of Privacy Practices.
            </p>

            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Client Signature</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
            </div>
          </div>
        );

      case "release-of-info":
        return (
          <div className="document-body">
            <h1 className="text-2xl font-bold text-center mb-1">{practiceName}</h1>
            <h2 className="text-lg font-semibold text-center mb-6">Authorization for Release of Information</h2>

            <div className="mb-4">
              <p className="mb-2 text-sm"><strong>Client Name:</strong> {getClientName(client)}</p>
              <p className="mb-2 text-sm"><strong>Date of Birth:</strong> {formatDate(client?.dateOfBirth)}</p>
              <p className="mb-2 text-sm"><strong>Date:</strong> {today}</p>
            </div>

            <Separator className="my-4 print:border-t print:border-black" />

            <p className="mb-4 text-sm leading-relaxed">
              I, {getClientName(client)}, hereby authorize {practiceName} to release and/or obtain
              the following protected health information:
            </p>

            <h3 className="text-base font-semibold mb-2">Release Information To / Obtain Information From:</h3>
            <p className="mb-4 text-sm">{roiRecipient || "________________________________________________"}</p>

            <h3 className="text-base font-semibold mb-2">Information to be Released:</h3>
            <p className="mb-4 text-sm">{roiInfo || "________________________________________________"}</p>

            <h3 className="text-base font-semibold mb-2">Purpose of Release:</h3>
            <p className="mb-4 text-sm">{roiPurpose || "________________________________________________"}</p>

            <h3 className="text-base font-semibold mb-2">Expiration</h3>
            <p className="mb-4 text-sm leading-relaxed">
              This authorization will expire on {roiExpiration ? formatDate(roiExpiration) : "________________"}
              or one year from the date of signature, whichever comes first.
            </p>

            <h3 className="text-base font-semibold mb-2">Right to Revoke</h3>
            <p className="mb-4 text-sm leading-relaxed">
              I understand that I may revoke this authorization at any time by providing written notice to
              {" "}{practiceName}. I understand that revocation will not apply to information that has already
              been released in response to this authorization. I understand that information disclosed pursuant
              to this authorization may be subject to re-disclosure by the recipient and may no longer be
              protected by federal privacy regulations.
            </p>

            <p className="mb-4 text-sm leading-relaxed">
              I understand that my treatment, payment, enrollment, or eligibility for benefits will not be
              conditioned upon signing this authorization.
            </p>

            <Separator className="my-6 print:border-t print:border-black" />

            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Client Signature</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Witness Signature</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
            </div>
          </div>
        );

      case "telehealth-consent":
        return (
          <div className="document-body">
            <h1 className="text-2xl font-bold text-center mb-1">{practiceName}</h1>
            <h2 className="text-lg font-semibold text-center mb-6">Telehealth Informed Consent</h2>

            <div className="mb-4">
              <p className="mb-2 text-sm"><strong>Client Name:</strong> {getClientName(client)}</p>
              <p className="mb-2 text-sm"><strong>Date:</strong> {today}</p>
              <p className="mb-2 text-sm"><strong>Therapist:</strong> {therapistName || "________________"}, {therapistCredentials || "________________"}</p>
            </div>

            <Separator className="my-4 print:border-t print:border-black" />

            <h3 className="text-base font-semibold mb-2">What is Telehealth?</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Telehealth involves the delivery of health care services using interactive audio, video,
              or other electronic media. It allows for clinical services to be provided when the client
              and therapist are not in the same physical location.
            </p>

            <h3 className="text-base font-semibold mb-2">Benefits of Telehealth</h3>
            <ul className="list-disc pl-6 mb-4 text-sm space-y-1">
              <li>Increased access to care, especially for those in remote areas</li>
              <li>Elimination of travel time and associated costs</li>
              <li>Flexibility in scheduling appointments</li>
              <li>Continuity of care during illness or inclement weather</li>
            </ul>

            <h3 className="text-base font-semibold mb-2">Risks of Telehealth</h3>
            <ul className="list-disc pl-6 mb-4 text-sm space-y-1">
              <li>Technology failures may interrupt or prevent sessions</li>
              <li>Despite security measures, electronic communications may be intercepted</li>
              <li>Therapist may not be able to fully observe non-verbal cues</li>
              <li>Sessions may feel different than in-person interactions</li>
            </ul>

            <h3 className="text-base font-semibold mb-2">Technology Requirements</h3>
            <ul className="list-disc pl-6 mb-4 text-sm space-y-1">
              <li>Reliable internet connection</li>
              <li>Device with camera and microphone capabilities</li>
              <li>Private, quiet location free from interruptions</li>
              <li>HIPAA-compliant video platform will be used for sessions</li>
            </ul>

            <h3 className="text-base font-semibold mb-2">Emergency Protocols</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Prior to each session, you will confirm your physical location so that emergency services
              can be contacted if needed. If you experience a mental health crisis, please call 911 or
              the 988 Suicide & Crisis Lifeline. An alternative therapist or emergency contact should
              be identified in case of technology failure during a crisis.
            </p>

            <h3 className="text-base font-semibold mb-2">Confidentiality</h3>
            <p className="mb-4 text-sm leading-relaxed">
              The same confidentiality protections that apply to in-person sessions also apply to telehealth.
              Sessions will not be recorded without your consent. You are responsible for ensuring your
              environment is private during sessions.
            </p>

            <h3 className="text-base font-semibold mb-2">Alternatives</h3>
            <p className="mb-4 text-sm leading-relaxed">
              In-person sessions remain available as an alternative to telehealth. You may choose to
              discontinue telehealth services at any time.
            </p>

            <Separator className="my-6 print:border-t print:border-black" />

            <p className="mb-6 text-sm">
              By signing below, I acknowledge that I have read and understand the above information,
              consent to participate in telehealth services, and agree to the terms outlined.
            </p>

            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Client Signature</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Therapist Signature</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
            </div>
          </div>
        );

      case "cancellation-policy":
        return (
          <div className="document-body">
            <h1 className="text-2xl font-bold text-center mb-1">{practiceName}</h1>
            <h2 className="text-lg font-semibold text-center mb-6">Cancellation / No-Show Policy</h2>

            <div className="mb-4">
              <p className="mb-2 text-sm"><strong>Client Name:</strong> {getClientName(client)}</p>
              <p className="mb-2 text-sm"><strong>Date:</strong> {today}</p>
            </div>

            <Separator className="my-4 print:border-t print:border-black" />

            <h3 className="text-base font-semibold mb-2">Cancellation Policy</h3>
            <p className="mb-4 text-sm leading-relaxed">
              To ensure the best possible care for all clients, we require at least <strong>24 hours notice</strong> for
              appointment cancellations. Cancellations made with less than 24 hours notice or missed
              appointments (no-shows) will be subject to a cancellation fee.
            </p>

            <h3 className="text-base font-semibold mb-2">Cancellation/No-Show Fee</h3>
            <ul className="list-disc pl-6 mb-4 text-sm space-y-1">
              <li>Cancellation with less than 24 hours notice: Full session fee</li>
              <li>No-show (failure to attend without notice): Full session fee</li>
              <li>These fees are not billable to insurance and are the client's responsibility</li>
            </ul>

            <h3 className="text-base font-semibold mb-2">Exceptions</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Exceptions may be made at the therapist's discretion for genuine emergencies, sudden illness,
              severe weather conditions, or other extraordinary circumstances. Please communicate with your
              therapist as soon as possible.
            </p>

            <h3 className="text-base font-semibold mb-2">Late Arrival Policy</h3>
            <p className="mb-4 text-sm leading-relaxed">
              If you arrive late to your appointment, the session will still end at the regularly scheduled
              time. The full session fee will apply. If you are more than 15 minutes late without
              communication, the appointment may be considered a no-show.
            </p>

            <h3 className="text-base font-semibold mb-2">Repeated No-Shows</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Three or more no-shows within a 6-month period may result in termination of services.
              Consistent attendance is important for therapeutic progress. If scheduling is a barrier,
              please discuss alternative options with your therapist.
            </p>

            <Separator className="my-6 print:border-t print:border-black" />

            <p className="mb-6 text-sm">
              By signing below, I acknowledge that I have read, understand, and agree to the
              cancellation and no-show policy described above.
            </p>

            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Client Signature</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
            </div>
          </div>
        );

      case "financial-agreement":
        return (
          <div className="document-body">
            <h1 className="text-2xl font-bold text-center mb-1">{practiceName}</h1>
            <h2 className="text-lg font-semibold text-center mb-6">Financial Agreement</h2>

            <div className="mb-4">
              <p className="mb-2 text-sm"><strong>Client Name:</strong> {getClientName(client)}</p>
              <p className="mb-2 text-sm"><strong>Date:</strong> {today}</p>
            </div>

            <Separator className="my-4 print:border-t print:border-black" />

            <h3 className="text-base font-semibold mb-2">Fee Schedule</h3>
            <div className="mb-4 text-sm">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 pr-4">Service</th>
                    <th className="text-right py-1">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-dashed"><td className="py-1 pr-4">Initial Assessment (90791)</td><td className="text-right py-1">$________</td></tr>
                  <tr className="border-b border-dashed"><td className="py-1 pr-4">Individual Therapy 38-52 min (90834)</td><td className="text-right py-1">$________</td></tr>
                  <tr className="border-b border-dashed"><td className="py-1 pr-4">Individual Therapy 53+ min (90837)</td><td className="text-right py-1">$________</td></tr>
                  <tr className="border-b border-dashed"><td className="py-1 pr-4">Family Therapy (90847)</td><td className="text-right py-1">$________</td></tr>
                  <tr className="border-b border-dashed"><td className="py-1 pr-4">Late Cancellation / No-Show</td><td className="text-right py-1">$________</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-base font-semibold mb-2">Payment Methods</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Payment is expected at the time of service unless other arrangements have been made.
              We accept cash, check, credit/debit cards, and HSA/FSA cards.
            </p>

            <h3 className="text-base font-semibold mb-2">Insurance Billing</h3>
            <p className="mb-4 text-sm leading-relaxed">
              If you choose to use insurance, we will verify your benefits and submit claims on your behalf.
              You are responsible for understanding your benefits, including copays, deductibles, and
              coinsurance. You are ultimately responsible for all charges not covered by your insurance.
            </p>

            <h3 className="text-base font-semibold mb-2">Copay/Deductible Responsibility</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Copays are due at the time of service. If your deductible has not been met, you will be
              responsible for the full contracted rate until the deductible is satisfied. We will provide
              you with an estimate of your out-of-pocket costs based on the information provided by your
              insurance company.
            </p>

            <h3 className="text-base font-semibold mb-2">Outstanding Balances</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Accounts with balances over 90 days past due may be referred to a collection agency.
              If an account is sent to collections, you will be responsible for any additional fees
              associated with the collection process.
            </p>

            <h3 className="text-base font-semibold mb-2">Sliding Scale</h3>
            <p className="mb-4 text-sm leading-relaxed">
              A limited number of sliding scale spots may be available based on financial need.
              Please discuss options with your therapist if you are experiencing financial hardship.
            </p>

            <Separator className="my-6 print:border-t print:border-black" />

            <p className="mb-6 text-sm">
              By signing below, I acknowledge that I have read and understand the financial policies above,
              and agree to be responsible for payment as described.
            </p>

            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Client Signature</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
            </div>
          </div>
        );

      case "superbill": {
        if (!superbillData) return <p className="text-center text-muted-foreground">Loading superbill data...</p>;
        const record: BillingRecord = superbillData.record;
        const sbClient: Client | null = superbillData.client;
        const cptInfo = CPT_CODES.find((c) => c.code === record.cptCode);
        const icdCodes = (record.icdCodes as string[]) || [];
        const diagnoses = icdCodes.map((code) => {
          const diag = COMMON_DIAGNOSES.find((d) => d.code === code);
          return { code, name: diag?.name || "Unknown" };
        });

        return (
          <div className="document-body">
            <h1 className="text-2xl font-bold text-center mb-1">{practiceName}</h1>
            <h2 className="text-lg font-semibold text-center mb-1">Superbill / Statement for Insurance Reimbursement</h2>
            <p className="text-center text-xs text-muted-foreground mb-6">Generated: {formatDate(superbillData.generatedAt)}</p>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold mb-2 border-b pb-1">Provider Information</h3>
                <p className="text-sm">{therapistName || "[Provider Name]"}</p>
                <p className="text-sm">{therapistCredentials || "[Credentials]"}</p>
                <p className="text-sm">{therapistAddress || "[Address]"}</p>
                <p className="text-sm">{therapistPhone || "[Phone]"}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2 border-b pb-1">Client Information</h3>
                <p className="text-sm">{sbClient ? `${sbClient.firstName} ${sbClient.lastName}` : "N/A"}</p>
                <p className="text-sm">DOB: {sbClient?.dateOfBirth ? formatDate(sbClient.dateOfBirth) : "N/A"}</p>
                {sbClient?.insuranceProvider && <p className="text-sm">Insurance: {sbClient.insuranceProvider}</p>}
                {sbClient?.insuranceId && <p className="text-sm">Member ID: {sbClient.insuranceId}</p>}
              </div>
            </div>

            <Separator className="my-4 print:border-t print:border-black" />

            <h3 className="text-sm font-semibold mb-2">Service Details</h3>
            <table className="w-full border-collapse text-sm mb-4">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-2 pr-4">Date of Service</th>
                  <th className="text-left py-2 pr-4">CPT Code</th>
                  <th className="text-left py-2 pr-4">Description</th>
                  <th className="text-right py-2">Fee</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4">{formatDate(record.serviceDate)}</td>
                  <td className="py-2 pr-4">{record.cptCode}</td>
                  <td className="py-2 pr-4">{cptInfo?.description || "Psychotherapy"}</td>
                  <td className="text-right py-2">{formatCents(record.amount || 0)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td colSpan={3} className="py-2 text-right pr-4">Total:</td>
                  <td className="text-right py-2">{formatCents(record.amount || 0)}</td>
                </tr>
                {(record.paymentReceived || 0) > 0 && (
                  <tr>
                    <td colSpan={3} className="py-1 text-right pr-4 text-muted-foreground">Payment Received:</td>
                    <td className="text-right py-1 text-muted-foreground">{formatCents(record.paymentReceived || 0)}</td>
                  </tr>
                )}
              </tfoot>
            </table>

            {diagnoses.length > 0 && (
              <>
                <h3 className="text-sm font-semibold mb-2">Diagnosis Codes (ICD-10)</h3>
                <table className="w-full border-collapse text-sm mb-4">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left py-2 pr-4">Code</th>
                      <th className="text-left py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnoses.map((d) => (
                      <tr key={d.code} className="border-b">
                        <td className="py-2 pr-4">{d.code}</td>
                        <td className="py-2">{d.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {record.insuranceProvider && (
              <>
                <h3 className="text-sm font-semibold mb-2">Insurance Information</h3>
                <p className="text-sm mb-1">Provider: {record.insuranceProvider}</p>
                <p className="text-sm mb-1">Claim Status: {record.claimStatus}</p>
              </>
            )}

            <Separator className="my-6 print:border-t print:border-black" />

            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Provider Signature</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
            </div>
          </div>
        );
      }

      case "discharge-summary":
        return (
          <div className="document-body">
            <h1 className="text-2xl font-bold text-center mb-1">{practiceName}</h1>
            <h2 className="text-lg font-semibold text-center mb-6">Discharge Summary</h2>

            <div className="mb-4">
              <p className="mb-2 text-sm"><strong>Client Name:</strong> {getClientName(client)}</p>
              <p className="mb-2 text-sm"><strong>Date of Birth:</strong> {formatDate(client?.dateOfBirth)}</p>
              <p className="mb-2 text-sm"><strong>Therapist:</strong> {therapistName || "________________"}, {therapistCredentials || "________________"}</p>
              <p className="mb-2 text-sm"><strong>Date of Admission:</strong> {dischargeAdmitDate ? formatDate(dischargeAdmitDate) : "________________"}</p>
              <p className="mb-2 text-sm"><strong>Date of Discharge:</strong> {dischargeDate ? formatDate(dischargeDate) : "________________"}</p>
            </div>

            <Separator className="my-4 print:border-t print:border-black" />

            <h3 className="text-base font-semibold mb-2">Diagnoses at Admission / Discharge</h3>
            <p className="mb-4 text-sm leading-relaxed whitespace-pre-wrap">
              {dischargeDiagnoses || "________________________________________________"}
            </p>

            <h3 className="text-base font-semibold mb-2">Treatment Summary</h3>
            <p className="mb-4 text-sm leading-relaxed whitespace-pre-wrap">
              {dischargeTreatmentSummary || "________________________________________________"}
            </p>

            <h3 className="text-base font-semibold mb-2">Progress Made</h3>
            <p className="mb-4 text-sm leading-relaxed whitespace-pre-wrap">
              {dischargeProgress || "________________________________________________"}
            </p>

            <h3 className="text-base font-semibold mb-2">Recommendations</h3>
            <p className="mb-4 text-sm leading-relaxed whitespace-pre-wrap">
              {dischargeRecommendations || "________________________________________________"}
            </p>

            <h3 className="text-base font-semibold mb-2">Referrals</h3>
            <p className="mb-4 text-sm leading-relaxed whitespace-pre-wrap">
              {dischargeReferrals || "________________________________________________"}
            </p>

            <h3 className="text-base font-semibold mb-2">Aftercare Plan</h3>
            <p className="mb-4 text-sm leading-relaxed whitespace-pre-wrap">
              {dischargeAftercare || "________________________________________________"}
            </p>

            <Separator className="my-6 print:border-t print:border-black" />

            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Therapist Signature</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Client Signature</p>
              </div>
              <div>
                <div className="border-b border-foreground mb-1 h-8" />
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  function renderFormFields() {
    if (!selectedTemplate) return null;

    const needsClient = selectedTemplate !== "superbill";
    const isSuperbill = selectedTemplate === "superbill";

    return (
      <div className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Practice Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Practice Name</Label>
              <Input
                data-testid="input-practice-name"
                value={practiceName}
                onChange={(e) => setPracticeName(e.target.value)}
                placeholder="Practice name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Therapist Name</Label>
              <Input
                data-testid="input-therapist-name"
                value={therapistName}
                onChange={(e) => setTherapistName(e.target.value)}
                placeholder="Dr. Jane Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Credentials</Label>
              <Input
                data-testid="input-therapist-credentials"
                value={therapistCredentials}
                onChange={(e) => setTherapistCredentials(e.target.value)}
                placeholder="LCSW, PhD, etc."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input
                data-testid="input-therapist-phone"
                value={therapistPhone}
                onChange={(e) => setTherapistPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Input
              data-testid="input-therapist-address"
              value={therapistAddress}
              onChange={(e) => setTherapistAddress(e.target.value)}
              placeholder="123 Main St, City, State ZIP"
            />
          </div>
        </div>

        <Separator />

        {needsClient && (
          <div className="space-y-1.5">
            <Label className="text-xs">Select Client</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger data-testid="select-paperwork-client">
                <SelectValue placeholder="Choose a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isSuperbill && (
          <div className="space-y-1.5">
            <Label className="text-xs">Select Billing Record</Label>
            <Select value={selectedBillingId} onValueChange={setSelectedBillingId}>
              <SelectTrigger data-testid="select-billing-record">
                <SelectValue placeholder="Choose a billing record" />
              </SelectTrigger>
              <SelectContent>
                {billingRecords.map((r) => {
                  const cl = clients.find((c) => c.id === r.clientId);
                  const clientName = cl ? `${cl.firstName} ${cl.lastName}` : `Client #${r.clientId}`;
                  return (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {clientName} - {r.cptCode} - {r.serviceDate ? new Date(r.serviceDate).toLocaleDateString() : "No date"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedTemplate === "release-of-info" && (
          <>
            <Separator />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Release Details</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Release To / Obtain From</Label>
                <Input
                  data-testid="input-roi-recipient"
                  value={roiRecipient}
                  onChange={(e) => setRoiRecipient(e.target.value)}
                  placeholder="Name of person or organization"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Information to Release</Label>
                <Input
                  data-testid="input-roi-info"
                  value={roiInfo}
                  onChange={(e) => setRoiInfo(e.target.value)}
                  placeholder="e.g., Treatment records, diagnoses, test results"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Purpose</Label>
                <Input
                  data-testid="input-roi-purpose"
                  value={roiPurpose}
                  onChange={(e) => setRoiPurpose(e.target.value)}
                  placeholder="e.g., Continuity of care, legal proceedings"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expiration Date</Label>
                <Input
                  data-testid="input-roi-expiration"
                  type="date"
                  value={roiExpiration}
                  onChange={(e) => setRoiExpiration(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {selectedTemplate === "discharge-summary" && (
          <>
            <Separator />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Discharge Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Date of Admission</Label>
                  <Input
                    data-testid="input-discharge-admit-date"
                    type="date"
                    value={dischargeAdmitDate}
                    onChange={(e) => setDischargeAdmitDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date of Discharge</Label>
                  <Input
                    data-testid="input-discharge-date"
                    type="date"
                    value={dischargeDate}
                    onChange={(e) => setDischargeDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Diagnoses at Admission / Discharge</Label>
                <Textarea
                  data-testid="input-discharge-diagnoses"
                  value={dischargeDiagnoses}
                  onChange={(e) => setDischargeDiagnoses(e.target.value)}
                  placeholder="List diagnoses at admission and at discharge"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Treatment Summary</Label>
                <Textarea
                  data-testid="input-discharge-treatment"
                  value={dischargeTreatmentSummary}
                  onChange={(e) => setDischargeTreatmentSummary(e.target.value)}
                  placeholder="Summary of treatment provided"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Progress Made</Label>
                <Textarea
                  data-testid="input-discharge-progress"
                  value={dischargeProgress}
                  onChange={(e) => setDischargeProgress(e.target.value)}
                  placeholder="Describe progress made during treatment"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Recommendations</Label>
                <Textarea
                  data-testid="input-discharge-recommendations"
                  value={dischargeRecommendations}
                  onChange={(e) => setDischargeRecommendations(e.target.value)}
                  placeholder="Recommendations for continued care"
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Referrals</Label>
                <Textarea
                  data-testid="input-discharge-referrals"
                  value={dischargeReferrals}
                  onChange={(e) => setDischargeReferrals(e.target.value)}
                  placeholder="Referral providers and contact information"
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Aftercare Plan</Label>
                <Textarea
                  data-testid="input-discharge-aftercare"
                  value={dischargeAftercare}
                  onChange={(e) => setDischargeAftercare(e.target.value)}
                  placeholder="Aftercare plan and follow-up schedule"
                  rows={3}
                />
              </div>
            </div>
          </>
        )}

        <Button
          className="w-full"
          onClick={handleGenerate}
          data-testid="button-generate-preview"
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate Preview
        </Button>
      </div>
    );
  }

  return (
    <LayoutShell>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-content,
          .print-content * {
            visibility: visible !important;
          }
          .print-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 40px !important;
            background: white !important;
            color: black !important;
          }
          .print-content .document-body {
            max-width: 800px !important;
            margin: 0 auto !important;
          }
          .no-print {
            display: none !important;
          }
          .print-content h1,
          .print-content h2,
          .print-content h3,
          .print-content p,
          .print-content li,
          .print-content td,
          .print-content th,
          .print-content span {
            color: black !important;
          }
          .print-content .text-muted-foreground {
            color: #555 !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-paperwork-title">
              Paperwork & Forms
            </h1>
            <p className="text-sm text-muted-foreground">
              Generate and print clinical documents and consent forms
            </p>
          </div>
          {(selectedTemplate || showPreview) && (
            <Button variant="outline" onClick={handleBack} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>

        {showPreview ? (
          <div className="space-y-4">
            <div className="flex justify-end no-print">
              <Button onClick={handlePrint} data-testid="button-print">
                <Printer className="h-4 w-4 mr-2" />
                Print Document
              </Button>
            </div>
            <Card>
              <CardContent className="p-8">
                <div className="print-content" ref={printRef}>
                  {renderDocumentContent()}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : selectedTemplate ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 no-print">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {template && <template.icon className="h-5 w-5 text-primary" />}
                    {template?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{template?.description}</p>
                  <Badge variant="outline">{template?.category}</Badge>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base" data-testid="text-form-title">Document Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderFormFields()}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DOCUMENT_TEMPLATES.map((tmpl) => (
              <Card
                key={tmpl.id}
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedTemplate(tmpl.id)}
                data-testid={`card-template-${tmpl.id}`}
              >
                <CardHeader className="flex flex-row items-start gap-3 pb-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <tmpl.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm" data-testid={`text-template-name-${tmpl.id}`}>
                      {tmpl.name}
                    </CardTitle>
                    <Badge variant="outline" className="mt-1.5 text-[10px]">
                      {tmpl.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{tmpl.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
