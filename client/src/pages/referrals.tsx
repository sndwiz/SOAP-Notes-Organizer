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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Search, Phone, Mail, MapPin, Users, Filter, Trash2,
  FileCheck, Send, CheckCircle, XCircle, Clock, Video, Building
} from "lucide-react";
import { INSURANCE_PROVIDERS, PROVIDER_SPECIALTIES, type Referral } from "@shared/schema";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  sent: { label: "Sent", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
  completed: { label: "Completed", variant: "default" },
};

export default function ReferralsPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInsurance, setFilterInsurance] = useState<string>("all");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all");

  const [form, setForm] = useState({
    providerName: "",
    providerType: "psychiatrist",
    specialty: "",
    phone: "",
    fax: "",
    email: "",
    address: "",
    insurancesAccepted: [] as string[],
    acceptingNewPatients: true,
    telehealth: false,
    notes: "",
    reasonForReferral: "",
    status: "pending",
    roiSigned: false,
  });

  const { data: referrals = [], isLoading } = useQuery<Referral[]>({
    queryKey: ['/api/referrals'],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/referrals", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Referral created" });
    },
    onError: () => toast({ title: "Failed to create referral", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/referrals/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals'] });
      toast({ title: "Referral updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/referrals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals'] });
      toast({ title: "Referral deleted" });
    },
  });

  function resetForm() {
    setForm({
      providerName: "", providerType: "psychiatrist", specialty: "", phone: "", fax: "",
      email: "", address: "", insurancesAccepted: [], acceptingNewPatients: true,
      telehealth: false, notes: "", reasonForReferral: "", status: "pending", roiSigned: false,
    });
  }

  function toggleInsurance(ins: string) {
    setForm(prev => ({
      ...prev,
      insurancesAccepted: prev.insurancesAccepted.includes(ins)
        ? prev.insurancesAccepted.filter(i => i !== ins)
        : [...prev.insurancesAccepted, ins]
    }));
  }

  const filtered = referrals.filter((r) => {
    const matchesSearch = r.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInsurance = filterInsurance === "all" ||
      (r.insurancesAccepted as string[] || []).includes(filterInsurance);
    const matchesSpecialty = filterSpecialty === "all" || r.specialty === filterSpecialty;
    return matchesSearch && matchesInsurance && matchesSpecialty;
  });

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-referrals-title">Referrals</h1>
            <p className="text-sm text-muted-foreground">Manage provider referrals and ROI tracking</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-referral">
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Referral Provider</DialogTitle>
                <DialogDescription>Add a new provider to your referral network</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provider Name *</Label>
                    <Input
                      data-testid="input-provider-name"
                      value={form.providerName}
                      onChange={e => setForm(p => ({ ...p, providerName: e.target.value }))}
                      placeholder="Dr. Jane Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provider Type</Label>
                    <Select value={form.providerType} onValueChange={v => setForm(p => ({ ...p, providerType: v }))}>
                      <SelectTrigger data-testid="select-provider-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                        <SelectItem value="psychologist">Psychologist</SelectItem>
                        <SelectItem value="primary-care">Primary Care</SelectItem>
                        <SelectItem value="specialist">Specialist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Select value={form.specialty} onValueChange={v => setForm(p => ({ ...p, specialty: v }))}>
                    <SelectTrigger data-testid="select-specialty"><SelectValue placeholder="Select specialty" /></SelectTrigger>
                    <SelectContent>
                      {PROVIDER_SPECIALTIES.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      data-testid="input-provider-phone"
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fax</Label>
                    <Input
                      data-testid="input-provider-fax"
                      value={form.fax}
                      onChange={e => setForm(p => ({ ...p, fax: e.target.value }))}
                      placeholder="(555) 123-4568"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      data-testid="input-provider-email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="provider@clinic.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      data-testid="input-provider-address"
                      value={form.address}
                      onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Insurance Accepted</Label>
                  <div className="flex flex-wrap gap-2">
                    {INSURANCE_PROVIDERS.map(ins => (
                      <label key={ins} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox
                          checked={form.insurancesAccepted.includes(ins)}
                          onCheckedChange={() => toggleInsurance(ins)}
                        />
                        {ins}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.acceptingNewPatients}
                      onCheckedChange={(v) => setForm(p => ({ ...p, acceptingNewPatients: !!v }))}
                    />
                    Accepting new patients
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.telehealth}
                      onCheckedChange={(v) => setForm(p => ({ ...p, telehealth: !!v }))}
                    />
                    Telehealth available
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.roiSigned}
                      onCheckedChange={(v) => setForm(p => ({ ...p, roiSigned: !!v }))}
                    />
                    ROI signed
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>Reason for Referral</Label>
                  <Textarea
                    data-testid="input-referral-reason"
                    value={form.reasonForReferral}
                    onChange={e => setForm(p => ({ ...p, reasonForReferral: e.target.value }))}
                    placeholder="Medication management for treatment-resistant depression..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    data-testid="input-referral-notes"
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Additional provider notes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button
                  data-testid="button-submit-referral"
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.providerName || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Add Provider"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-search-referrals"
              className="pl-9"
              placeholder="Search providers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterInsurance} onValueChange={setFilterInsurance}>
            <SelectTrigger className="w-[200px]" data-testid="select-filter-insurance">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Insurance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Insurance</SelectItem>
              {INSURANCE_PROVIDERS.map(ins => (
                <SelectItem key={ins} value={ins}>{ins}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
            <SelectTrigger className="w-[200px]" data-testid="select-filter-specialty">
              <SelectValue placeholder="Specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {PROVIDER_SPECIALTIES.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse"><CardContent className="h-40" /></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No referral providers yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">Add psychiatrists and specialists to your referral network</p>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-empty-create-referral">
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((ref) => {
              const specialtyLabel = PROVIDER_SPECIALTIES.find(s => s.id === ref.specialty)?.name || ref.specialty;
              const statusInfo = STATUS_MAP[ref.status || "pending"];
              return (
                <Card key={ref.id} data-testid={`card-referral-${ref.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate" data-testid={`text-provider-name-${ref.id}`}>
                        {ref.providerName}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs capitalize">{ref.providerType}</Badge>
                        {specialtyLabel && <Badge variant="outline" className="text-xs">{specialtyLabel}</Badge>}
                        <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground"
                      onClick={() => deleteMutation.mutate(ref.id)}
                      data-testid={`button-delete-referral-${ref.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {ref.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{ref.phone}</span>
                        </div>
                      )}
                      {ref.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{ref.email}</span>
                        </div>
                      )}
                      {ref.address && (
                        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{ref.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {ref.acceptingNewPatients && (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          Accepting patients
                        </div>
                      )}
                      {ref.telehealth && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <Video className="h-3 w-3" />
                          Telehealth
                        </div>
                      )}
                      {ref.roiSigned && (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <FileCheck className="h-3 w-3" />
                          ROI on file
                        </div>
                      )}
                    </div>

                    {(ref.insurancesAccepted as string[] || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(ref.insurancesAccepted as string[]).slice(0, 4).map(ins => (
                          <Badge key={ins} variant="outline" className="text-[10px]">{ins}</Badge>
                        ))}
                        {(ref.insurancesAccepted as string[]).length > 4 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{(ref.insurancesAccepted as string[]).length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {ref.reasonForReferral && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{ref.reasonForReferral}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      {ref.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: ref.id, status: "sent" })}
                          data-testid={`button-send-referral-${ref.id}`}
                        >
                          <Send className="h-3.5 w-3.5 mr-1.5" />
                          Mark Sent
                        </Button>
                      )}
                      {ref.status === "sent" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: ref.id, status: "accepted" })}
                          data-testid={`button-accept-referral-${ref.id}`}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          Mark Accepted
                        </Button>
                      )}
                      {!ref.roiSigned && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: ref.id, roiSigned: true, roiDate: new Date().toISOString() })}
                          data-testid={`button-roi-referral-${ref.id}`}
                        >
                          <FileCheck className="h-3.5 w-3.5 mr-1.5" />
                          ROI Signed
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
