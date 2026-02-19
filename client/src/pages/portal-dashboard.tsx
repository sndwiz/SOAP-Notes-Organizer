import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { INTAKE_FORM_TYPES } from "@shared/schema";
import type { IntakeForm, MessageThread, Message } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LogOut, FileText, ClipboardList, MessageCircle, Download, Send,
  ArrowLeft, Clock, CheckCircle, Eye, Shield, Loader2
} from "lucide-react";

interface PortalClient {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
}

interface PortalDoc {
  id: number;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string | null;
  createdAt: string | null;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: typeof Clock }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  submitted: { label: "Submitted", variant: "default", icon: CheckCircle },
  reviewed: { label: "Reviewed", variant: "outline", icon: Eye },
};

export default function PortalDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("documents");
  const [selectedForm, setSelectedForm] = useState<IntakeForm | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const { data: meData, isLoading: meLoading } = useQuery<{ client: PortalClient; userId: string } | null>({
    queryKey: ["/api/portal/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const client = meData?.client;

  const { data: documents = [], isLoading: docsLoading } = useQuery<PortalDoc[]>({
    queryKey: ["/api/portal/documents"],
    enabled: !!client,
  });

  const { data: intakeForms = [], isLoading: formsLoading } = useQuery<IntakeForm[]>({
    queryKey: ["/api/portal/intake-forms"],
    enabled: !!client,
  });

  const { data: threads = [], isLoading: threadsLoading } = useQuery<MessageThread[]>({
    queryKey: ["/api/portal/messages"],
    enabled: !!client,
  });

  const { data: threadMessages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/portal/messages", selectedThread],
    enabled: !!selectedThread,
  });

  const submitFormMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: Record<string, any> }) => {
      const res = await apiRequest("PUT", `/api/portal/intake-forms/${id}`, { formData });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/intake-forms"] });
      setSelectedForm(null);
      setFormData({});
      toast({ title: "Form submitted successfully" });
    },
    onError: () => toast({ title: "Failed to submit form", variant: "destructive" }),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ threadId, body }: { threadId: number; body: string }) => {
      const res = await apiRequest("POST", `/api/portal/messages/${threadId}`, { body });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/messages", selectedThread] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/messages"] });
      setNewMessage("");
    },
    onError: () => toast({ title: "Failed to send message", variant: "destructive" }),
  });

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/portal/logout", {});
    } catch {}
    setLocation("/portal/login");
  }

  if (meLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100 dark:from-slate-900 dark:to-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (!client) {
    setLocation("/portal/login");
    return null;
  }

  const pendingForms = intakeForms.filter((f) => f.status === "pending").length;
  const unreadMessages = threads.reduce((acc, t) => acc, 0);

  function openFormDialog(form: IntakeForm) {
    setFormData(form.formData as Record<string, any> || {});
    setSelectedForm(form);
  }

  function updateField(key: string, value: any) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function renderFormFields(formType: string) {
    switch (formType) {
      case "demographics":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input data-testid="input-form-firstName" value={formData.firstName || ""} onChange={(e) => updateField("firstName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input data-testid="input-form-lastName" value={formData.lastName || ""} onChange={(e) => updateField("lastName", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input data-testid="input-form-dob" type="date" value={formData.dateOfBirth || ""} onChange={(e) => updateField("dateOfBirth", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input data-testid="input-form-address" value={formData.address || ""} onChange={(e) => updateField("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input data-testid="input-form-phone" value={formData.phone || ""} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input data-testid="input-form-email" type="email" value={formData.email || ""} onChange={(e) => updateField("email", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emergency Contact Name</Label>
                <Input data-testid="input-form-emergencyName" value={formData.emergencyContactName || ""} onChange={(e) => updateField("emergencyContactName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact Phone</Label>
                <Input data-testid="input-form-emergencyPhone" value={formData.emergencyContactPhone || ""} onChange={(e) => updateField("emergencyContactPhone", e.target.value)} />
              </div>
            </div>
          </div>
        );
      case "mental-health-history":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Previous Diagnoses</Label>
              <Textarea data-testid="input-form-diagnoses" value={formData.previousDiagnoses || ""} onChange={(e) => updateField("previousDiagnoses", e.target.value)} placeholder="List any previous mental health diagnoses..." />
            </div>
            <div className="space-y-2">
              <Label>Current Medications</Label>
              <Textarea data-testid="input-form-medications" value={formData.currentMedications || ""} onChange={(e) => updateField("currentMedications", e.target.value)} placeholder="List current medications and dosages..." />
            </div>
            <div className="space-y-2">
              <Label>Prior Treatment History</Label>
              <Textarea data-testid="input-form-treatment" value={formData.priorTreatment || ""} onChange={(e) => updateField("priorTreatment", e.target.value)} placeholder="Describe any prior therapy, counseling, or psychiatric treatment..." />
            </div>
            <div className="space-y-2">
              <Label>Substance Use History</Label>
              <Textarea data-testid="input-form-substance" value={formData.substanceUse || ""} onChange={(e) => updateField("substanceUse", e.target.value)} placeholder="Describe current or past substance use, if any..." />
            </div>
          </div>
        );
      case "consent":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-md text-sm text-muted-foreground space-y-3">
              <p>By checking the boxes below, you acknowledge and consent to the following:</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                data-testid="input-form-consentTreatment"
                checked={!!formData.consentToTreatment}
                onCheckedChange={(v) => updateField("consentToTreatment", !!v)}
                className="mt-0.5"
              />
              <span className="text-sm">I consent to receive mental health treatment and understand the nature of therapy services.</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                data-testid="input-form-consentConfidentiality"
                checked={!!formData.consentConfidentiality}
                onCheckedChange={(v) => updateField("consentConfidentiality", !!v)}
                className="mt-0.5"
              />
              <span className="text-sm">I understand the limits of confidentiality and mandatory reporting obligations.</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                data-testid="input-form-consentTelehealth"
                checked={!!formData.consentTelehealth}
                onCheckedChange={(v) => updateField("consentTelehealth", !!v)}
                className="mt-0.5"
              />
              <span className="text-sm">I consent to telehealth services when applicable.</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                data-testid="input-form-consentFees"
                checked={!!formData.consentFees}
                onCheckedChange={(v) => updateField("consentFees", !!v)}
                className="mt-0.5"
              />
              <span className="text-sm">I understand the fee structure and cancellation policy.</span>
            </label>
          </div>
        );
      case "insurance-info":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Insurance Provider</Label>
              <Input data-testid="input-form-insuranceProvider" value={formData.insuranceProvider || ""} onChange={(e) => updateField("insuranceProvider", e.target.value)} placeholder="e.g. Blue Cross Blue Shield" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Policy / Member ID</Label>
                <Input data-testid="input-form-memberId" value={formData.memberId || ""} onChange={(e) => updateField("memberId", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Group Number</Label>
                <Input data-testid="input-form-groupNumber" value={formData.groupNumber || ""} onChange={(e) => updateField("groupNumber", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subscriber Name (if different)</Label>
              <Input data-testid="input-form-subscriberName" value={formData.subscriberName || ""} onChange={(e) => updateField("subscriberName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subscriber Date of Birth</Label>
              <Input data-testid="input-form-subscriberDob" type="date" value={formData.subscriberDob || ""} onChange={(e) => updateField("subscriberDob", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Relationship to Subscriber</Label>
              <Input data-testid="input-form-subscriberRelation" value={formData.subscriberRelation || ""} onChange={(e) => updateField("subscriberRelation", e.target.value)} placeholder="e.g. Self, Spouse, Child" />
            </div>
          </div>
        );
      default:
        return <p className="text-sm text-muted-foreground">Unknown form type.</p>;
    }
  }

  const formTypeName = selectedForm ? INTAKE_FORM_TYPES.find((t) => t.id === selectedForm.formType)?.name || selectedForm.formType : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-sky-50/50 dark:from-slate-900 dark:to-slate-800">
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-foreground" data-testid="text-portal-brand">Client Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-client-name">
              {client.firstName} {client.lastName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-portal-logout">
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {(pendingForms > 0) && (
          <div className="flex flex-wrap gap-4">
            {pendingForms > 0 && (
              <Card className="flex-1 min-w-[200px]">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
                    <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-pending-forms-count">{pendingForms}</p>
                    <p className="text-xs text-muted-foreground">Pending Forms</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="documents" data-testid="tab-documents" className="gap-1.5">
              <FileText className="h-4 w-4" />
              My Documents
            </TabsTrigger>
            <TabsTrigger value="forms" data-testid="tab-forms" className="gap-1.5">
              <ClipboardList className="h-4 w-4" />
              Intake Forms
              {pendingForms > 0 && <Badge variant="secondary" className="ml-1 text-xs">{pendingForms}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages" className="gap-1.5">
              <MessageCircle className="h-4 w-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-4 space-y-3">
            {docsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse"><CardContent className="h-16" /></Card>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium" data-testid="text-no-documents">No documents shared yet</p>
                  <p className="text-sm text-muted-foreground/70">Your provider will share documents here when available.</p>
                </CardContent>
              </Card>
            ) : (
              documents.map((doc) => (
                <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/20">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm" data-testid={`text-doc-name-${doc.id}`}>{doc.name}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {doc.category && <Badge variant="outline" className="text-[10px]">{doc.category}</Badge>}
                          {doc.createdAt && <span>{new Date(doc.createdAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild data-testid={`button-download-doc-${doc.id}`}>
                      <a href={`/api/portal/documents/${doc.id}/download`} download={doc.originalName}>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="forms" className="mt-4 space-y-3">
            {formsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse"><CardContent className="h-16" /></Card>
                ))}
              </div>
            ) : intakeForms.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <ClipboardList className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium" data-testid="text-no-forms">No intake forms assigned</p>
                  <p className="text-sm text-muted-foreground/70">Your provider will assign forms when needed.</p>
                </CardContent>
              </Card>
            ) : (
              intakeForms.map((form) => {
                const typeInfo = INTAKE_FORM_TYPES.find((t) => t.id === form.formType);
                const statusInfo = STATUS_BADGE[form.status || "pending"];
                const StatusIcon = statusInfo.icon;
                return (
                  <Card key={form.id} data-testid={`card-form-${form.id}`}>
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-900/20">
                          <ClipboardList className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm" data-testid={`text-form-type-${form.id}`}>
                            {typeInfo?.name || form.formType}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant={statusInfo.variant} className="text-[10px] gap-1">
                              <StatusIcon className="h-2.5 w-2.5" />
                              {statusInfo.label}
                            </Badge>
                            {form.submittedAt && <span>Submitted {new Date(form.submittedAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </div>
                      {form.status === "pending" && (
                        <Button size="sm" onClick={() => openFormDialog(form)} data-testid={`button-fill-form-${form.id}`}>
                          Fill Out
                        </Button>
                      )}
                      {form.status !== "pending" && (
                        <Button variant="outline" size="sm" onClick={() => openFormDialog(form)} data-testid={`button-view-form-${form.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="messages" className="mt-4">
            {selectedThread ? (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedThread(null)} data-testid="button-back-threads">
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Back to threads
                </Button>
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] p-4">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : threadMessages.length === 0 ? (
                        <div className="flex flex-col items-center py-8">
                          <MessageCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">No messages yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {threadMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.senderType === "client" ? "justify-end" : "justify-start"}`}
                              data-testid={`message-${msg.id}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-md px-3 py-2 text-sm ${
                                  msg.senderType === "client"
                                    ? "bg-blue-600 text-white dark:bg-blue-700"
                                    : "bg-muted"
                                }`}
                              >
                                <p>{msg.body}</p>
                                <p className={`text-[10px] mt-1 ${msg.senderType === "client" ? "text-blue-100" : "text-muted-foreground"}`}>
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    <div className="border-t p-3 flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && newMessage.trim()) {
                            e.preventDefault();
                            sendMessageMutation.mutate({ threadId: selectedThread, body: newMessage.trim() });
                          }
                        }}
                        data-testid="input-message"
                      />
                      <Button
                        size="icon"
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        onClick={() => sendMessageMutation.mutate({ threadId: selectedThread, body: newMessage.trim() })}
                        data-testid="button-send-message"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-3">
                {threadsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Card key={i} className="animate-pulse"><CardContent className="h-16" /></Card>
                    ))}
                  </div>
                ) : threads.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center py-12">
                      <MessageCircle className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground font-medium" data-testid="text-no-threads">No message threads</p>
                      <p className="text-sm text-muted-foreground/70">Your provider will start a conversation when needed.</p>
                    </CardContent>
                  </Card>
                ) : (
                  threads.map((thread) => (
                    <Card
                      key={thread.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => setSelectedThread(thread.id)}
                      data-testid={`card-thread-${thread.id}`}
                    >
                      <CardContent className="flex items-center justify-between gap-4 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/20">
                            <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate" data-testid={`text-thread-subject-${thread.id}`}>
                              {thread.subject}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleString() : ""}
                            </p>
                          </div>
                        </div>
                        <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 shrink-0" />
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedForm} onOpenChange={(open) => { if (!open) { setSelectedForm(null); setFormData({}); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formTypeName}</DialogTitle>
            <DialogDescription>
              {selectedForm?.status === "pending" ? "Please fill out all fields and submit." : "Viewing submitted form data."}
            </DialogDescription>
          </DialogHeader>
          {selectedForm && renderFormFields(selectedForm.formType)}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedForm(null); setFormData({}); }} data-testid="button-cancel-form">
              {selectedForm?.status === "pending" ? "Cancel" : "Close"}
            </Button>
            {selectedForm?.status === "pending" && (
              <Button
                onClick={() => submitFormMutation.mutate({ id: selectedForm.id, formData })}
                disabled={submitFormMutation.isPending}
                data-testid="button-submit-form"
              >
                {submitFormMutation.isPending ? "Submitting..." : "Submit Form"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
