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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Shield, Trash2, Edit, Phone, AlertTriangle, Heart,
  Users, Stethoscope, X, ChevronDown, ChevronUp, Printer
} from "lucide-react";
import type { SafetyPlan } from "@shared/schema";

interface ListItemEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  testIdPrefix: string;
}

function ListItemEditor({ items, onChange, placeholder, testIdPrefix }: ListItemEditorProps) {
  const [input, setInput] = useState("");

  function addItem() {
    if (input.trim()) {
      onChange([...items, input.trim()]);
      setInput("");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addItem())}
          data-testid={`${testIdPrefix}-input`}
        />
        <Button type="button" variant="outline" size="sm" onClick={addItem} data-testid={`${testIdPrefix}-add`}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-1.5">
            <span className="flex-1">{item}</span>
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ContactEditorProps {
  contacts: { name: string; phone?: string; role?: string; relationship?: string }[];
  onChange: (contacts: any[]) => void;
  fields: ("name" | "phone" | "role" | "relationship")[];
  testIdPrefix: string;
}

function ContactEditor({ contacts, onChange, fields, testIdPrefix }: ContactEditorProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [extra, setExtra] = useState("");

  function addContact() {
    if (name.trim()) {
      const contact: any = { name: name.trim() };
      if (fields.includes("phone") && phone.trim()) contact.phone = phone.trim();
      if (fields.includes("role") && extra.trim()) contact.role = extra.trim();
      if (fields.includes("relationship") && extra.trim()) contact.relationship = extra.trim();
      onChange([...contacts, contact]);
      setName(""); setPhone(""); setExtra("");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name"
          className="flex-1 min-w-[120px]"
          data-testid={`${testIdPrefix}-name`}
        />
        {fields.includes("phone") && (
          <Input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Phone"
            className="w-[140px]"
            data-testid={`${testIdPrefix}-phone`}
          />
        )}
        {(fields.includes("role") || fields.includes("relationship")) && (
          <Input
            value={extra}
            onChange={e => setExtra(e.target.value)}
            placeholder={fields.includes("role") ? "Role" : "Relationship"}
            className="w-[120px]"
            data-testid={`${testIdPrefix}-extra`}
          />
        )}
        <Button type="button" variant="outline" size="sm" onClick={addContact} data-testid={`${testIdPrefix}-add`}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1">
        {contacts.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-1.5">
            <span className="font-medium">{c.name}</span>
            {c.phone && <span className="text-muted-foreground">- {c.phone}</span>}
            {c.role && <Badge variant="outline" className="text-[10px]">{c.role}</Badge>}
            {c.relationship && <Badge variant="outline" className="text-[10px]">{c.relationship}</Badge>}
            <button
              type="button"
              className="ml-auto text-muted-foreground hover:text-destructive"
              onClick={() => onChange(contacts.filter((_, idx) => idx !== i))}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const defaultCrisisResources = [
  { name: "988 Suicide & Crisis Lifeline", phone: "988" },
  { name: "Crisis Text Line", phone: "Text HOME to 741741" },
  { name: "Emergency Services", phone: "911" },
];

export default function SafetyPlansPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewPlanId, setViewPlanId] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    warning: true, coping: true, social: true, professional: true,
    emergency: true, crisis: true, environment: true, reasons: true,
  });

  const [form, setForm] = useState({
    clientName: "",
    clientId: null as number | null,
    warningSignals: [] as string[],
    copingStrategies: [] as string[],
    socialDistractions: [] as { name: string; phone?: string }[],
    professionalContacts: [] as { name: string; phone?: string; role?: string }[],
    emergencyContacts: [] as { name: string; phone: string; relationship?: string }[],
    crisisResources: [...defaultCrisisResources],
    environmentSafety: [] as string[],
    reasonsForLiving: [] as string[],
  });

  const { data: plans = [], isLoading } = useQuery<SafetyPlan[]>({
    queryKey: ['/api/safety-plans'],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/safety-plans", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/safety-plans'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Safety plan created" });
    },
    onError: () => toast({ title: "Failed to create safety plan", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/safety-plans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/safety-plans'] });
      toast({ title: "Safety plan updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/safety-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/safety-plans'] });
      setViewPlanId(null);
      toast({ title: "Safety plan deleted" });
    },
  });

  function resetForm() {
    setForm({
      clientName: "", clientId: null,
      warningSignals: [], copingStrategies: [],
      socialDistractions: [], professionalContacts: [],
      emergencyContacts: [], crisisResources: [...defaultCrisisResources],
      environmentSafety: [], reasonsForLiving: [],
    });
  }

  function toggleSection(key: string) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const viewPlan = plans.find(p => p.id === viewPlanId);

  const SectionHeader = ({ icon: Icon, title, sectionKey, color }: {
    icon: any; title: string; sectionKey: string; color: string;
  }) => (
    <button
      type="button"
      className="flex items-center gap-2 w-full text-left py-2"
      onClick={() => toggleSection(sectionKey)}
    >
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="font-medium text-sm flex-1">{title}</span>
      {expandedSections[sectionKey] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
  );

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-safety-plans-title">Safety Plans</h1>
            <p className="text-sm text-muted-foreground">Create and manage client crisis safety plans (Stanley-Brown model)</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-safety-plan">
                <Plus className="h-4 w-4 mr-2" />
                New Safety Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Safety Plan</DialogTitle>
                <DialogDescription>Stanley-Brown Safety Planning Intervention template</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client Name *</Label>
                    <Input
                      data-testid="input-safety-client-name"
                      value={form.clientName}
                      onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))}
                      placeholder="Client full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Link to Client</Label>
                    <Select
                      value={form.clientId?.toString() || "none"}
                      onValueChange={v => setForm(p => ({ ...p, clientId: v === "none" ? null : Number(v) }))}
                    >
                      <SelectTrigger data-testid="select-safety-client"><SelectValue placeholder="Select client" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No linked client</SelectItem>
                        {clients.map((c: any) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.firstName} {c.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <SectionHeader icon={AlertTriangle} title="Step 1: Warning Signs" sectionKey="warning" color="text-yellow-500" />
                      {expandedSections.warning && (
                        <div className="pl-6">
                          <p className="text-xs text-muted-foreground mb-2">Thoughts, images, moods, situations, behaviors that signal a crisis may be developing</p>
                          <ListItemEditor
                            items={form.warningSignals}
                            onChange={items => setForm(p => ({ ...p, warningSignals: items }))}
                            placeholder="e.g., Feeling hopeless, withdrawing from friends..."
                            testIdPrefix="warning-signal"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <SectionHeader icon={Heart} title="Step 2: Internal Coping Strategies" sectionKey="coping" color="text-green-500" />
                      {expandedSections.coping && (
                        <div className="pl-6">
                          <p className="text-xs text-muted-foreground mb-2">Things I can do to take my mind off my problems without contacting another person</p>
                          <ListItemEditor
                            items={form.copingStrategies}
                            onChange={items => setForm(p => ({ ...p, copingStrategies: items }))}
                            placeholder="e.g., Deep breathing, exercise, journaling..."
                            testIdPrefix="coping-strategy"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <SectionHeader icon={Users} title="Step 3: People & Places for Distraction" sectionKey="social" color="text-blue-500" />
                      {expandedSections.social && (
                        <div className="pl-6">
                          <p className="text-xs text-muted-foreground mb-2">People and social settings that provide healthy distraction</p>
                          <ContactEditor
                            contacts={form.socialDistractions}
                            onChange={items => setForm(p => ({ ...p, socialDistractions: items }))}
                            fields={["name", "phone"]}
                            testIdPrefix="social"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <SectionHeader icon={Stethoscope} title="Step 4: Professional Contacts" sectionKey="professional" color="text-purple-500" />
                      {expandedSections.professional && (
                        <div className="pl-6">
                          <p className="text-xs text-muted-foreground mb-2">Clinicians, therapists, and agencies I can contact during a crisis</p>
                          <ContactEditor
                            contacts={form.professionalContacts}
                            onChange={items => setForm(p => ({ ...p, professionalContacts: items }))}
                            fields={["name", "phone", "role"]}
                            testIdPrefix="professional"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <SectionHeader icon={Phone} title="Step 5: Emergency Contacts" sectionKey="emergency" color="text-red-500" />
                      {expandedSections.emergency && (
                        <div className="pl-6">
                          <p className="text-xs text-muted-foreground mb-2">Family members or friends I can ask for help</p>
                          <ContactEditor
                            contacts={form.emergencyContacts}
                            onChange={items => setForm(p => ({ ...p, emergencyContacts: items }))}
                            fields={["name", "phone", "relationship"]}
                            testIdPrefix="emergency"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <SectionHeader icon={Phone} title="Crisis Resources" sectionKey="crisis" color="text-red-600" />
                      {expandedSections.crisis && (
                        <div className="pl-6">
                          <p className="text-xs text-muted-foreground mb-2">National crisis hotlines and emergency services</p>
                          <ContactEditor
                            contacts={form.crisisResources}
                            onChange={items => setForm(p => ({ ...p, crisisResources: items }))}
                            fields={["name", "phone"]}
                            testIdPrefix="crisis"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <SectionHeader icon={Shield} title="Step 6: Making the Environment Safe" sectionKey="environment" color="text-orange-500" />
                      {expandedSections.environment && (
                        <div className="pl-6">
                          <p className="text-xs text-muted-foreground mb-2">Steps to restrict access to lethal means</p>
                          <ListItemEditor
                            items={form.environmentSafety}
                            onChange={items => setForm(p => ({ ...p, environmentSafety: items }))}
                            placeholder="e.g., Lock medications, remove firearms from home..."
                            testIdPrefix="environment"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <SectionHeader icon={Heart} title="Reasons for Living" sectionKey="reasons" color="text-pink-500" />
                      {expandedSections.reasons && (
                        <div className="pl-6">
                          <p className="text-xs text-muted-foreground mb-2">The most important things worth living for</p>
                          <ListItemEditor
                            items={form.reasonsForLiving}
                            onChange={items => setForm(p => ({ ...p, reasonsForLiving: items }))}
                            placeholder="e.g., My children, my pet, future goals..."
                            testIdPrefix="reasons"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button
                  data-testid="button-submit-safety-plan"
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.clientName || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create Safety Plan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No safety plans yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">Create guided safety plans using the Stanley-Brown model</p>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-empty-create-safety-plan">
                <Plus className="h-4 w-4 mr-2" />
                New Safety Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan.id} className="hover-elevate cursor-pointer" data-testid={`card-safety-plan-${plan.id}`}
                onClick={() => setViewPlanId(plan.id)}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                  <div>
                    <CardTitle className="text-base" data-testid={`text-plan-client-${plan.id}`}>
                      {plan.clientName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {new Date(plan.updatedAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                    {plan.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>{(plan.warningSignals as string[])?.length || 0} warning signs</div>
                    <div>{(plan.copingStrategies as string[])?.length || 0} coping strategies</div>
                    <div>{(plan.emergencyContacts as any[])?.length || 0} emergency contacts</div>
                    <div>{(plan.reasonsForLiving as string[])?.length || 0} reasons for living</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!viewPlan} onOpenChange={() => setViewPlanId(null)}>
          {viewPlan && (
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Safety Plan - {viewPlan.clientName}
                </DialogTitle>
                <DialogDescription>
                  Last updated: {new Date(viewPlan.updatedAt!).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4">
                <PlanSection
                  icon={AlertTriangle} color="text-yellow-500"
                  title="Step 1: Warning Signs"
                  items={(viewPlan.warningSignals as string[]) || []}
                />
                <PlanSection
                  icon={Heart} color="text-green-500"
                  title="Step 2: Internal Coping Strategies"
                  items={(viewPlan.copingStrategies as string[]) || []}
                />
                <PlanContactSection
                  icon={Users} color="text-blue-500"
                  title="Step 3: People & Places for Distraction"
                  contacts={(viewPlan.socialDistractions as any[]) || []}
                />
                <PlanContactSection
                  icon={Stethoscope} color="text-purple-500"
                  title="Step 4: Professional Contacts"
                  contacts={(viewPlan.professionalContacts as any[]) || []}
                />
                <PlanContactSection
                  icon={Phone} color="text-red-500"
                  title="Step 5: Emergency Contacts"
                  contacts={(viewPlan.emergencyContacts as any[]) || []}
                />
                <PlanContactSection
                  icon={Phone} color="text-red-600"
                  title="Crisis Resources"
                  contacts={(viewPlan.crisisResources as any[]) || []}
                />
                <PlanSection
                  icon={Shield} color="text-orange-500"
                  title="Step 6: Making the Environment Safe"
                  items={(viewPlan.environmentSafety as string[]) || []}
                />
                <PlanSection
                  icon={Heart} color="text-pink-500"
                  title="Reasons for Living"
                  items={(viewPlan.reasonsForLiving as string[]) || []}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => window.print()} data-testid="button-print-plan">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(viewPlan.id)}
                  data-testid="button-delete-plan"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </LayoutShell>
  );
}

function PlanSection({ icon: Icon, color, title, items }: {
  icon: any; color: string; title: string; items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      <div className="pl-6 space-y-1">
        {items.map((item, i) => (
          <div key={i} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-xs mt-1 text-muted-foreground/50">{i + 1}.</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanContactSection({ icon: Icon, color, title, contacts }: {
  icon: any; color: string; title: string; contacts: any[];
}) {
  if (contacts.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      <div className="pl-6 space-y-1">
        {contacts.map((c, i) => (
          <div key={i} className="text-sm flex items-center gap-2">
            <span className="font-medium">{c.name}</span>
            {c.phone && <span className="text-muted-foreground">- {c.phone}</span>}
            {c.role && <Badge variant="outline" className="text-[10px]">{c.role}</Badge>}
            {c.relationship && <Badge variant="outline" className="text-[10px]">{c.relationship}</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}
