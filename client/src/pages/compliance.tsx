import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Shield, FileCheck, ClipboardList, ScrollText, Plus, Edit, Trash2,
  CheckCircle, Clock, AlertTriangle, Calendar, Target, Filter, Search, X,
} from "lucide-react";
import {
  CONSENT_DOCUMENT_TYPES, AUDIT_ACTIONS, AUDIT_RESOURCE_TYPES, COMMON_DIAGNOSES,
  type ConsentDocument, type AuditLog, type TreatmentPlan, type Client,
} from "@shared/schema";

const CONSENT_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  signed: { label: "Signed", variant: "default" },
  expired: { label: "Expired", variant: "destructive" },
};

const PLAN_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  discontinued: { label: "Discontinued", variant: "destructive" },
  draft: { label: "Draft", variant: "outline" },
};

const defaultConsentForm = {
  clientId: "",
  documentType: "",
  version: "1.0",
  signedAt: "",
  expiresAt: "",
  witnessName: "",
  status: "pending",
  notes: "",
};

type GoalEntry = { goal: string; objectives: string[]; targetDate: string; status: string };

const defaultPlanForm = {
  clientId: "",
  diagnoses: [] as { code: string; name: string }[],
  presentingProblems: [] as string[],
  goals: [] as GoalEntry[],
  interventions: [] as string[],
  frequency: "Weekly",
  estimatedDuration: "6 months",
  startDate: new Date().toISOString().split("T")[0],
  reviewDate: "",
  notes: "",
};

export default function CompliancePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const [isConsentCreateOpen, setIsConsentCreateOpen] = useState(false);
  const [editingConsent, setEditingConsent] = useState<ConsentDocument | null>(null);
  const [consentForm, setConsentForm] = useState({ ...defaultConsentForm });

  const [isPlanCreateOpen, setIsPlanCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null);
  const [planForm, setPlanForm] = useState({ ...defaultPlanForm });

  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditResourceFilter, setAuditResourceFilter] = useState("all");

  const [diagSearch, setDiagSearch] = useState("");
  const [newProblem, setNewProblem] = useState("");
  const [newIntervention, setNewIntervention] = useState("");
  const [newGoalText, setNewGoalText] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [editingGoalIdx, setEditingGoalIdx] = useState<number | null>(null);

  const { data: consentDocs = [], isLoading: consentLoading } = useQuery<ConsentDocument[]>({
    queryKey: ["/api/consent-documents"],
  });

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const { data: treatmentPlans = [], isLoading: plansLoading } = useQuery<TreatmentPlan[]>({
    queryKey: ["/api/treatment-plans"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createConsentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/consent-documents", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consent-documents"] });
      setIsConsentCreateOpen(false);
      resetConsentForm();
      toast({ title: "Consent document created" });
    },
    onError: () => toast({ title: "Failed to create consent document", variant: "destructive" }),
  });

  const updateConsentMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/consent-documents/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consent-documents"] });
      setEditingConsent(null);
      resetConsentForm();
      toast({ title: "Consent document updated" });
    },
    onError: () => toast({ title: "Failed to update consent document", variant: "destructive" }),
  });

  const deleteConsentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/consent-documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consent-documents"] });
      toast({ title: "Consent document deleted" });
    },
    onError: () => toast({ title: "Failed to delete consent document", variant: "destructive" }),
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/treatment-plans", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-plans"] });
      setIsPlanCreateOpen(false);
      resetPlanForm();
      toast({ title: "Treatment plan created" });
    },
    onError: () => toast({ title: "Failed to create treatment plan", variant: "destructive" }),
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/treatment-plans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-plans"] });
      setEditingPlan(null);
      resetPlanForm();
      toast({ title: "Treatment plan updated" });
    },
    onError: () => toast({ title: "Failed to update treatment plan", variant: "destructive" }),
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/treatment-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-plans"] });
      toast({ title: "Treatment plan deleted" });
    },
    onError: () => toast({ title: "Failed to delete treatment plan", variant: "destructive" }),
  });

  function resetConsentForm() {
    setConsentForm({ ...defaultConsentForm });
  }

  function resetPlanForm() {
    setPlanForm({ ...defaultPlanForm });
    setDiagSearch("");
    setNewProblem("");
    setNewIntervention("");
    setNewGoalText("");
    setNewObjective("");
    setEditingGoalIdx(null);
  }

  function getClientName(clientId: number): string {
    const client = clients.find((c) => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : `Client #${clientId}`;
  }

  function getDocTypeName(typeId: string): string {
    const dt = CONSENT_DOCUMENT_TYPES.find((t) => t.id === typeId);
    return dt ? dt.name : typeId;
  }

  function openEditConsent(doc: ConsentDocument) {
    setEditingConsent(doc);
    setConsentForm({
      clientId: String(doc.clientId),
      documentType: doc.documentType,
      version: doc.version || "1.0",
      signedAt: doc.signedAt ? new Date(doc.signedAt).toISOString().split("T")[0] : "",
      expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString().split("T")[0] : "",
      witnessName: doc.witnessName || "",
      status: doc.status || "pending",
      notes: doc.notes || "",
    });
  }

  function handleConsentSubmit() {
    const payload: any = {
      clientId: parseInt(consentForm.clientId),
      documentType: consentForm.documentType,
      version: consentForm.version,
      signedAt: consentForm.signedAt ? new Date(consentForm.signedAt).toISOString() : null,
      expiresAt: consentForm.expiresAt ? new Date(consentForm.expiresAt).toISOString() : null,
      witnessName: consentForm.witnessName || null,
      status: consentForm.status,
      notes: consentForm.notes || null,
    };

    if (editingConsent) {
      updateConsentMutation.mutate({ id: editingConsent.id, ...payload });
    } else {
      createConsentMutation.mutate(payload);
    }
  }

  function markAsSigned(doc: ConsentDocument) {
    updateConsentMutation.mutate({
      id: doc.id,
      clientId: doc.clientId,
      documentType: doc.documentType,
      version: doc.version,
      signedAt: new Date().toISOString(),
      expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : null,
      witnessName: doc.witnessName,
      status: "signed",
      notes: doc.notes,
    });
  }

  function openEditPlan(plan: TreatmentPlan) {
    setEditingPlan(plan);
    setPlanForm({
      clientId: String(plan.clientId),
      diagnoses: (plan.diagnoses as any) || [],
      presentingProblems: (plan.presentingProblems as any) || [],
      goals: ((plan.goals as any) || []).map((g: any) => ({
        goal: g.goal || "",
        objectives: g.objectives || [],
        targetDate: g.targetDate || "",
        status: g.status || "in-progress",
      })),
      interventions: (plan.interventions as any) || [],
      frequency: plan.frequency || "Weekly",
      estimatedDuration: plan.estimatedDuration || "6 months",
      startDate: plan.startDate ? new Date(plan.startDate).toISOString().split("T")[0] : "",
      reviewDate: plan.reviewDate ? new Date(plan.reviewDate).toISOString().split("T")[0] : "",
      notes: plan.notes || "",
    });
  }

  function handlePlanSubmit() {
    const payload: any = {
      clientId: parseInt(planForm.clientId),
      diagnoses: planForm.diagnoses,
      presentingProblems: planForm.presentingProblems,
      goals: planForm.goals,
      interventions: planForm.interventions,
      frequency: planForm.frequency,
      estimatedDuration: planForm.estimatedDuration,
      startDate: planForm.startDate ? new Date(planForm.startDate).toISOString() : null,
      reviewDate: planForm.reviewDate ? new Date(planForm.reviewDate).toISOString() : null,
      notes: planForm.notes || null,
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, ...payload });
    } else {
      createPlanMutation.mutate(payload);
    }
  }

  function addDiagnosis(code: string, name: string) {
    if (!planForm.diagnoses.find((d) => d.code === code)) {
      setPlanForm((p) => ({ ...p, diagnoses: [...p.diagnoses, { code, name }] }));
    }
  }

  function removeDiagnosis(code: string) {
    setPlanForm((p) => ({ ...p, diagnoses: p.diagnoses.filter((d) => d.code !== code) }));
  }

  function addProblem() {
    if (newProblem.trim()) {
      setPlanForm((p) => ({ ...p, presentingProblems: [...p.presentingProblems, newProblem.trim()] }));
      setNewProblem("");
    }
  }

  function removeProblem(idx: number) {
    setPlanForm((p) => ({ ...p, presentingProblems: p.presentingProblems.filter((_, i) => i !== idx) }));
  }

  function addIntervention() {
    if (newIntervention.trim()) {
      setPlanForm((p) => ({ ...p, interventions: [...p.interventions, newIntervention.trim()] }));
      setNewIntervention("");
    }
  }

  function removeIntervention(idx: number) {
    setPlanForm((p) => ({ ...p, interventions: p.interventions.filter((_, i) => i !== idx) }));
  }

  function addGoal() {
    if (newGoalText.trim()) {
      setPlanForm((p) => ({
        ...p,
        goals: [...p.goals, { goal: newGoalText.trim(), objectives: [], targetDate: "", status: "in-progress" }],
      }));
      setNewGoalText("");
    }
  }

  function removeGoal(idx: number) {
    setPlanForm((p) => ({ ...p, goals: p.goals.filter((_, i) => i !== idx) }));
  }

  function addObjectiveToGoal(goalIdx: number) {
    if (newObjective.trim()) {
      setPlanForm((p) => ({
        ...p,
        goals: p.goals.map((g, i) =>
          i === goalIdx ? { ...g, objectives: [...g.objectives, newObjective.trim()] } : g
        ),
      }));
      setNewObjective("");
    }
  }

  function removeObjectiveFromGoal(goalIdx: number, objIdx: number) {
    setPlanForm((p) => ({
      ...p,
      goals: p.goals.map((g, i) =>
        i === goalIdx ? { ...g, objectives: g.objectives.filter((_, j) => j !== objIdx) } : g
      ),
    }));
  }

  function updateGoalField(goalIdx: number, field: keyof GoalEntry, value: string) {
    setPlanForm((p) => ({
      ...p,
      goals: p.goals.map((g, i) => (i === goalIdx ? { ...g, [field]: value } : g)),
    }));
  }

  const pendingConsents = consentDocs.filter((d) => d.status === "pending").length;
  const expiredConsents = consentDocs.filter((d) => d.status === "expired").length;
  const signedConsents = consentDocs.filter((d) => d.status === "signed").length;
  const activePlans = treatmentPlans.filter((p) => p.status === "active").length;

  const hasIssues = pendingConsents > 0 || expiredConsents > 0;

  const filteredAuditLogs = auditLogs
    .filter((log) => {
      const matchesAction = auditActionFilter === "all" || log.action === auditActionFilter;
      const matchesResource = auditResourceFilter === "all" || log.resourceType === auditResourceFilter;
      return matchesAction && matchesResource;
    })
    .slice(0, 100);

  const filteredDiagnoses = COMMON_DIAGNOSES.filter(
    (d) =>
      d.code.toLowerCase().includes(diagSearch.toLowerCase()) ||
      d.name.toLowerCase().includes(diagSearch.toLowerCase())
  );

  const consentIsPending = createConsentMutation.isPending || updateConsentMutation.isPending;
  const planIsPending = createPlanMutation.isPending || updatePlanMutation.isPending;

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-compliance-title">
                HIPAA Compliance
              </h1>
              <Badge
                variant={hasIssues ? "destructive" : "default"}
                data-testid="badge-compliance-status"
              >
                {hasIssues ? (
                  <><AlertTriangle className="h-3 w-3 mr-1" /> Needs Attention</>
                ) : (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Compliant</>
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1" data-testid="text-compliance-date">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-compliance">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <Shield className="h-4 w-4 mr-2" />
              Compliance Overview
            </TabsTrigger>
            <TabsTrigger value="consent" data-testid="tab-consent">
              <FileCheck className="h-4 w-4 mr-2" />
              Consent Tracking
            </TabsTrigger>
            <TabsTrigger value="plans" data-testid="tab-plans">
              <ClipboardList className="h-4 w-4 mr-2" />
              Treatment Plans
            </TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit">
              <ScrollText className="h-4 w-4 mr-2" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-total-consents">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Consent Forms</CardTitle>
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-consents">{consentDocs.length}</div>
                  <p className="text-xs text-muted-foreground">{signedConsents} signed</p>
                </CardContent>
              </Card>
              <Card data-testid="card-pending-signatures">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Signatures</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-pending-signatures">{pendingConsents}</div>
                  <p className="text-xs text-muted-foreground">Awaiting client signatures</p>
                </CardContent>
              </Card>
              <Card data-testid="card-expired-forms">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expired Forms</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-expired-forms">{expiredConsents}</div>
                  <p className="text-xs text-muted-foreground">Require renewal</p>
                </CardContent>
              </Card>
              <Card data-testid="card-total-plans">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Treatment Plans</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-plans">{treatmentPlans.length}</div>
                  <p className="text-xs text-muted-foreground">{activePlans} active</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="consent" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold" data-testid="text-consent-heading">Consent Documents</h2>
              <Dialog open={isConsentCreateOpen} onOpenChange={(open) => { setIsConsentCreateOpen(open); if (!open) resetConsentForm(); }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-consent">
                    <Plus className="h-4 w-4 mr-2" />
                    New Consent Document
                  </Button>
                </DialogTrigger>
                <ConsentFormDialog
                  form={consentForm}
                  setForm={setConsentForm}
                  onSubmit={handleConsentSubmit}
                  onCancel={() => { setIsConsentCreateOpen(false); resetConsentForm(); }}
                  isPending={consentIsPending}
                  clients={clients}
                  title="Create Consent Document"
                  description="Add a new consent document for a client"
                  submitLabel="Create Document"
                />
              </Dialog>
            </div>

            {consentLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="h-20" />
                  </Card>
                ))}
              </div>
            ) : consentDocs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No consent documents yet</p>
                  <p className="text-sm text-muted-foreground/70 mb-4">Create consent documents to track client agreements</p>
                  <Button onClick={() => setIsConsentCreateOpen(true)} data-testid="button-empty-create-consent">
                    <Plus className="h-4 w-4 mr-2" />
                    New Consent Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {consentDocs.map((doc) => {
                  const statusInfo = CONSENT_STATUS_MAP[doc.status || "pending"];
                  return (
                    <Card key={doc.id} data-testid={`card-consent-${doc.id}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium" data-testid={`text-consent-client-${doc.id}`}>
                                {getClientName(doc.clientId)}
                              </span>
                              <Badge variant={statusInfo.variant} data-testid={`badge-consent-status-${doc.id}`}>
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground" data-testid={`text-consent-type-${doc.id}`}>
                              {getDocTypeName(doc.documentType)}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              {doc.signedAt && (
                                <span data-testid={`text-consent-signed-${doc.id}`}>
                                  Signed: {new Date(doc.signedAt).toLocaleDateString()}
                                </span>
                              )}
                              {doc.expiresAt && (
                                <span data-testid={`text-consent-expires-${doc.id}`}>
                                  Expires: {new Date(doc.expiresAt).toLocaleDateString()}
                                </span>
                              )}
                              {doc.version && (
                                <span>v{doc.version}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {doc.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsSigned(doc)}
                                data-testid={`button-sign-consent-${doc.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark Signed
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditConsent(doc)}
                              data-testid={`button-edit-consent-${doc.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground"
                                  data-testid={`button-delete-consent-${doc.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Consent Document</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this consent document for{" "}
                                    {getClientName(doc.clientId)}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel data-testid={`button-cancel-delete-consent-${doc.id}`}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteConsentMutation.mutate(doc.id)}
                                    data-testid={`button-confirm-delete-consent-${doc.id}`}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Dialog
              open={!!editingConsent}
              onOpenChange={(open) => { if (!open) { setEditingConsent(null); resetConsentForm(); } }}
            >
              <ConsentFormDialog
                form={consentForm}
                setForm={setConsentForm}
                onSubmit={handleConsentSubmit}
                onCancel={() => { setEditingConsent(null); resetConsentForm(); }}
                isPending={consentIsPending}
                clients={clients}
                title="Edit Consent Document"
                description="Update the consent document details"
                submitLabel="Save Changes"
              />
            </Dialog>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold" data-testid="text-plans-heading">Treatment Plans</h2>
              <Dialog open={isPlanCreateOpen} onOpenChange={(open) => { setIsPlanCreateOpen(open); if (!open) resetPlanForm(); }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-plan">
                    <Plus className="h-4 w-4 mr-2" />
                    New Treatment Plan
                  </Button>
                </DialogTrigger>
                <PlanFormDialog
                  form={planForm}
                  setForm={setPlanForm}
                  onSubmit={handlePlanSubmit}
                  onCancel={() => { setIsPlanCreateOpen(false); resetPlanForm(); }}
                  isPending={planIsPending}
                  clients={clients}
                  diagSearch={diagSearch}
                  setDiagSearch={setDiagSearch}
                  filteredDiagnoses={filteredDiagnoses}
                  addDiagnosis={addDiagnosis}
                  removeDiagnosis={removeDiagnosis}
                  newProblem={newProblem}
                  setNewProblem={setNewProblem}
                  addProblem={addProblem}
                  removeProblem={removeProblem}
                  newIntervention={newIntervention}
                  setNewIntervention={setNewIntervention}
                  addIntervention={addIntervention}
                  removeIntervention={removeIntervention}
                  newGoalText={newGoalText}
                  setNewGoalText={setNewGoalText}
                  addGoal={addGoal}
                  removeGoal={removeGoal}
                  newObjective={newObjective}
                  setNewObjective={setNewObjective}
                  editingGoalIdx={editingGoalIdx}
                  setEditingGoalIdx={setEditingGoalIdx}
                  addObjectiveToGoal={addObjectiveToGoal}
                  removeObjectiveFromGoal={removeObjectiveFromGoal}
                  updateGoalField={updateGoalField}
                  title="Create Treatment Plan"
                  description="Create a new treatment plan for a client"
                  submitLabel="Create Plan"
                />
              </Dialog>
            </div>

            {plansLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="h-24" />
                  </Card>
                ))}
              </div>
            ) : treatmentPlans.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No treatment plans yet</p>
                  <p className="text-sm text-muted-foreground/70 mb-4">Create treatment plans for your clients</p>
                  <Button onClick={() => setIsPlanCreateOpen(true)} data-testid="button-empty-create-plan">
                    <Plus className="h-4 w-4 mr-2" />
                    New Treatment Plan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {treatmentPlans.map((plan) => {
                  const statusInfo = PLAN_STATUS_MAP[plan.status || "active"];
                  const goalsArr = (plan.goals as any) || [];
                  const diagArr = (plan.diagnoses as any) || [];
                  return (
                    <Card key={plan.id} data-testid={`card-plan-${plan.id}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium" data-testid={`text-plan-client-${plan.id}`}>
                                {getClientName(plan.clientId)}
                              </span>
                              <Badge variant={statusInfo.variant} data-testid={`badge-plan-status-${plan.id}`}>
                                {statusInfo.label}
                              </Badge>
                            </div>
                            {diagArr.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {diagArr.slice(0, 3).map((d: any) => (
                                  <Badge key={d.code} variant="outline" className="text-xs">
                                    {d.code}
                                  </Badge>
                                ))}
                                {diagArr.length > 3 && (
                                  <Badge variant="outline" className="text-xs">+{diagArr.length - 3} more</Badge>
                                )}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span data-testid={`text-plan-goals-${plan.id}`}>
                                {goalsArr.length} goal{goalsArr.length !== 1 ? "s" : ""}
                              </span>
                              {plan.startDate && (
                                <span data-testid={`text-plan-start-${plan.id}`}>
                                  Start: {new Date(plan.startDate).toLocaleDateString()}
                                </span>
                              )}
                              {plan.reviewDate && (
                                <span data-testid={`text-plan-review-${plan.id}`}>
                                  Review: {new Date(plan.reviewDate).toLocaleDateString()}
                                </span>
                              )}
                              {plan.frequency && <span>{plan.frequency}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditPlan(plan)}
                              data-testid={`button-edit-plan-${plan.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground"
                                  data-testid={`button-delete-plan-${plan.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Treatment Plan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this treatment plan for{" "}
                                    {getClientName(plan.clientId)}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel data-testid={`button-cancel-delete-plan-${plan.id}`}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deletePlanMutation.mutate(plan.id)}
                                    data-testid={`button-confirm-delete-plan-${plan.id}`}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Dialog
              open={!!editingPlan}
              onOpenChange={(open) => { if (!open) { setEditingPlan(null); resetPlanForm(); } }}
            >
              <PlanFormDialog
                form={planForm}
                setForm={setPlanForm}
                onSubmit={handlePlanSubmit}
                onCancel={() => { setEditingPlan(null); resetPlanForm(); }}
                isPending={planIsPending}
                clients={clients}
                diagSearch={diagSearch}
                setDiagSearch={setDiagSearch}
                filteredDiagnoses={filteredDiagnoses}
                addDiagnosis={addDiagnosis}
                removeDiagnosis={removeDiagnosis}
                newProblem={newProblem}
                setNewProblem={setNewProblem}
                addProblem={addProblem}
                removeProblem={removeProblem}
                newIntervention={newIntervention}
                setNewIntervention={setNewIntervention}
                addIntervention={addIntervention}
                removeIntervention={removeIntervention}
                newGoalText={newGoalText}
                setNewGoalText={setNewGoalText}
                addGoal={addGoal}
                removeGoal={removeGoal}
                newObjective={newObjective}
                setNewObjective={setNewObjective}
                editingGoalIdx={editingGoalIdx}
                setEditingGoalIdx={setEditingGoalIdx}
                addObjectiveToGoal={addObjectiveToGoal}
                removeObjectiveFromGoal={removeObjectiveFromGoal}
                updateGoalField={updateGoalField}
                title="Edit Treatment Plan"
                description="Update the treatment plan details"
                submitLabel="Save Changes"
              />
            </Dialog>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold" data-testid="text-audit-heading">Audit Log</h2>
              <div className="flex flex-wrap gap-2">
                <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-audit-action-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {AUDIT_ACTIONS.map((a) => (
                      <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={auditResourceFilter} onValueChange={setAuditResourceFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-audit-resource-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Resource" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {AUDIT_RESOURCE_TYPES.map((r) => (
                      <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {auditLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredAuditLogs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ScrollText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No audit log entries</p>
                  <p className="text-sm text-muted-foreground/70">Activity will be recorded here automatically</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="table-audit-logs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-medium text-muted-foreground">Timestamp</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Resource Type</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Resource ID</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Details</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAuditLogs.map((log) => (
                          <tr key={log.id} className="border-b last:border-0" data-testid={`row-audit-${log.id}`}>
                            <td className="p-3 text-muted-foreground whitespace-nowrap" data-testid={`text-audit-time-${log.id}`}>
                              {log.createdAt ? new Date(log.createdAt).toLocaleString() : "N/A"}
                            </td>
                            <td className="p-3" data-testid={`text-audit-action-${log.id}`}>
                              <Badge variant="outline" className="text-xs">
                                {log.action.replace(/_/g, " ")}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground" data-testid={`text-audit-resource-${log.id}`}>
                              {log.resourceType.replace(/_/g, " ")}
                            </td>
                            <td className="p-3 text-muted-foreground font-mono text-xs" data-testid={`text-audit-resourceid-${log.id}`}>
                              {log.resourceId || "-"}
                            </td>
                            <td className="p-3 text-muted-foreground max-w-[200px] truncate" data-testid={`text-audit-details-${log.id}`}>
                              {log.details || "-"}
                            </td>
                            <td className="p-3 text-muted-foreground font-mono text-xs" data-testid={`text-audit-ip-${log.id}`}>
                              {log.ipAddress || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
            <p className="text-xs text-muted-foreground text-center" data-testid="text-audit-count">
              Showing {filteredAuditLogs.length} of {auditLogs.length} entries
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutShell>
  );
}

function ConsentFormDialog({
  form, setForm, onSubmit, onCancel, isPending, clients, title, description, submitLabel,
}: {
  form: typeof defaultConsentForm;
  setForm: (fn: (prev: typeof defaultConsentForm) => typeof defaultConsentForm) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  clients: Client[];
  title: string;
  description: string;
  submitLabel: string;
}) {
  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label>Client *</Label>
          <Select value={form.clientId} onValueChange={(v) => setForm((p) => ({ ...p, clientId: v }))}>
            <SelectTrigger data-testid="select-consent-client">
              <SelectValue placeholder="Select client" />
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
        <div className="space-y-2">
          <Label>Document Type *</Label>
          <Select value={form.documentType} onValueChange={(v) => setForm((p) => ({ ...p, documentType: v }))}>
            <SelectTrigger data-testid="select-consent-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {CONSENT_DOCUMENT_TYPES.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Version</Label>
            <Input
              data-testid="input-consent-version"
              value={form.version}
              onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))}
              placeholder="1.0"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
              <SelectTrigger data-testid="select-consent-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Signed Date</Label>
            <Input
              data-testid="input-consent-signed-at"
              type="date"
              value={form.signedAt}
              onChange={(e) => setForm((p) => ({ ...p, signedAt: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Expiration Date</Label>
            <Input
              data-testid="input-consent-expires-at"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Witness Name</Label>
          <Input
            data-testid="input-consent-witness"
            value={form.witnessName}
            onChange={(e) => setForm((p) => ({ ...p, witnessName: e.target.value }))}
            placeholder="Witness name"
          />
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            data-testid="input-consent-notes"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Additional notes..."
            className="resize-none"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel-consent">Cancel</Button>
        <Button
          onClick={onSubmit}
          disabled={!form.clientId || !form.documentType || isPending}
          data-testid="button-submit-consent"
        >
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function PlanFormDialog({
  form, setForm, onSubmit, onCancel, isPending, clients,
  diagSearch, setDiagSearch, filteredDiagnoses, addDiagnosis, removeDiagnosis,
  newProblem, setNewProblem, addProblem, removeProblem,
  newIntervention, setNewIntervention, addIntervention, removeIntervention,
  newGoalText, setNewGoalText, addGoal, removeGoal,
  newObjective, setNewObjective, editingGoalIdx, setEditingGoalIdx,
  addObjectiveToGoal, removeObjectiveFromGoal, updateGoalField,
  title, description, submitLabel,
}: {
  form: typeof defaultPlanForm;
  setForm: (fn: (prev: typeof defaultPlanForm) => typeof defaultPlanForm) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  clients: Client[];
  diagSearch: string;
  setDiagSearch: (v: string) => void;
  filteredDiagnoses: typeof COMMON_DIAGNOSES;
  addDiagnosis: (code: string, name: string) => void;
  removeDiagnosis: (code: string) => void;
  newProblem: string;
  setNewProblem: (v: string) => void;
  addProblem: () => void;
  removeProblem: (idx: number) => void;
  newIntervention: string;
  setNewIntervention: (v: string) => void;
  addIntervention: () => void;
  removeIntervention: (idx: number) => void;
  newGoalText: string;
  setNewGoalText: (v: string) => void;
  addGoal: () => void;
  removeGoal: (idx: number) => void;
  newObjective: string;
  setNewObjective: (v: string) => void;
  editingGoalIdx: number | null;
  setEditingGoalIdx: (idx: number | null) => void;
  addObjectiveToGoal: (goalIdx: number) => void;
  removeObjectiveFromGoal: (goalIdx: number, objIdx: number) => void;
  updateGoalField: (goalIdx: number, field: keyof GoalEntry, value: string) => void;
  title: string;
  description: string;
  submitLabel: string;
}) {
  return (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label>Client *</Label>
          <Select value={form.clientId} onValueChange={(v) => setForm((p) => ({ ...p, clientId: v }))}>
            <SelectTrigger data-testid="select-plan-client">
              <SelectValue placeholder="Select client" />
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

        <div className="space-y-2">
          <Label>Diagnoses (ICD Codes)</Label>
          {form.diagnoses.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {form.diagnoses.map((d) => (
                <Badge key={d.code} variant="secondary" className="text-xs">
                  {d.code}
                  <button
                    className="ml-1 hover:text-destructive"
                    onClick={() => removeDiagnosis(d.code)}
                    data-testid={`button-remove-diag-${d.code}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-diag-search"
              className="pl-9"
              placeholder="Search diagnoses..."
              value={diagSearch}
              onChange={(e) => setDiagSearch(e.target.value)}
            />
          </div>
          {diagSearch && (
            <div className="max-h-32 overflow-y-auto border rounded-md">
              {filteredDiagnoses.slice(0, 10).map((d) => (
                <button
                  key={d.code}
                  className="w-full text-left px-3 py-1.5 text-xs hover-elevate"
                  onClick={() => { addDiagnosis(d.code, d.name); setDiagSearch(""); }}
                  data-testid={`button-add-diag-${d.code}`}
                >
                  <span className="font-medium">{d.code}</span> - {d.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Presenting Problems</Label>
          {form.presentingProblems.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs flex-1 justify-start">{p}</Badge>
              <Button variant="ghost" size="icon" onClick={() => removeProblem(i)} data-testid={`button-remove-problem-${i}`}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              data-testid="input-new-problem"
              value={newProblem}
              onChange={(e) => setNewProblem(e.target.value)}
              placeholder="Add presenting problem"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addProblem(); } }}
            />
            <Button variant="outline" size="icon" onClick={addProblem} data-testid="button-add-problem">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Goals</Label>
          {form.goals.map((g, i) => (
            <Card key={i} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" data-testid={`text-goal-${i}`}>{g.goal}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Select
                      value={g.status}
                      onValueChange={(v) => updateGoalField(i, "status", v)}
                    >
                      <SelectTrigger className="w-[130px]" data-testid={`select-goal-status-${i}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="achieved">Achieved</SelectItem>
                        <SelectItem value="modified">Modified</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={g.targetDate}
                      onChange={(e) => updateGoalField(i, "targetDate", e.target.value)}
                      className="w-[160px]"
                      data-testid={`input-goal-target-${i}`}
                    />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingGoalIdx(editingGoalIdx === i ? null : i)}
                    data-testid={`button-toggle-objectives-${i}`}
                  >
                    <Target className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeGoal(i)} data-testid={`button-remove-goal-${i}`}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {editingGoalIdx === i && (
                <div className="pl-4 border-l-2 border-muted space-y-1">
                  <Label className="text-xs">Objectives</Label>
                  {g.objectives.map((obj, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <span className="text-xs flex-1" data-testid={`text-objective-${i}-${j}`}>{obj}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeObjectiveFromGoal(i, j)} data-testid={`button-remove-obj-${i}-${j}`}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      data-testid={`input-new-objective-${i}`}
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      placeholder="Add objective"
                      className="text-xs"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addObjectiveToGoal(i); } }}
                    />
                    <Button variant="outline" size="icon" onClick={() => addObjectiveToGoal(i)} data-testid={`button-add-objective-${i}`}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
          <div className="flex gap-2">
            <Input
              data-testid="input-new-goal"
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              placeholder="Add a new goal"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGoal(); } }}
            />
            <Button variant="outline" size="icon" onClick={addGoal} data-testid="button-add-goal">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Interventions</Label>
          {form.interventions.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs flex-1 justify-start">{v}</Badge>
              <Button variant="ghost" size="icon" onClick={() => removeIntervention(i)} data-testid={`button-remove-intervention-${i}`}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              data-testid="input-new-intervention"
              value={newIntervention}
              onChange={(e) => setNewIntervention(e.target.value)}
              placeholder="Add intervention"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addIntervention(); } }}
            />
            <Button variant="outline" size="icon" onClick={addIntervention} data-testid="button-add-intervention">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={form.frequency} onValueChange={(v) => setForm((p) => ({ ...p, frequency: v }))}>
              <SelectTrigger data-testid="select-plan-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Biweekly">Biweekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="As Needed">As Needed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estimated Duration</Label>
            <Select value={form.estimatedDuration} onValueChange={(v) => setForm((p) => ({ ...p, estimatedDuration: v }))}>
              <SelectTrigger data-testid="select-plan-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3 months">3 months</SelectItem>
                <SelectItem value="6 months">6 months</SelectItem>
                <SelectItem value="12 months">12 months</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              data-testid="input-plan-start"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Review Date</Label>
            <Input
              data-testid="input-plan-review"
              type="date"
              value={form.reviewDate}
              onChange={(e) => setForm((p) => ({ ...p, reviewDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            data-testid="input-plan-notes"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Additional notes..."
            className="resize-none"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel-plan">Cancel</Button>
        <Button
          onClick={onSubmit}
          disabled={!form.clientId || isPending}
          data-testid="button-submit-plan"
        >
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
