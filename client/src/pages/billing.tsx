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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DollarSign, Receipt, FileText, Filter, Plus, Trash2, Edit, Search,
  CheckCircle, Clock, XCircle, AlertTriangle,
} from "lucide-react";
import { CPT_CODES, COMMON_DIAGNOSES, type BillingRecord } from "@shared/schema";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  unbilled: { label: "Unbilled", variant: "secondary" },
  submitted: { label: "Submitted", variant: "outline" },
  paid: { label: "Paid", variant: "default" },
  denied: { label: "Denied", variant: "destructive" },
  appealed: { label: "Appealed", variant: "outline" },
};

const CLAIM_STATUSES = ["unbilled", "submitted", "paid", "denied", "appealed"];

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function parseDollars(dollars: string): number {
  const val = parseFloat(dollars);
  return isNaN(val) ? 0 : Math.round(val * 100);
}

const defaultForm = {
  clientId: "",
  noteId: "",
  serviceDate: new Date().toISOString().split("T")[0],
  cptCode: "90837",
  icdCodes: [] as string[],
  amount: "",
  insuranceProvider: "",
  claimStatus: "unbilled",
  paymentReceived: "",
  notes: "",
};

export default function BillingPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BillingRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [form, setForm] = useState({ ...defaultForm });

  const { data: records = [], isLoading } = useQuery<BillingRecord[]>({
    queryKey: ["/api/billing-records"],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const { data: soapNotes = [] } = useQuery<any[]>({
    queryKey: ["/api/soap-notes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/billing-records", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing-records"] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Billing record created" });
    },
    onError: () => toast({ title: "Failed to create billing record", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/billing-records/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing-records"] });
      setEditingRecord(null);
      resetForm();
      toast({ title: "Billing record updated" });
    },
    onError: () => toast({ title: "Failed to update billing record", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/billing-records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing-records"] });
      toast({ title: "Billing record deleted" });
    },
    onError: () => toast({ title: "Failed to delete billing record", variant: "destructive" }),
  });

  function resetForm() {
    setForm({ ...defaultForm });
  }

  function openEdit(record: BillingRecord) {
    setEditingRecord(record);
    setForm({
      clientId: String(record.clientId),
      noteId: record.noteId ? String(record.noteId) : "",
      serviceDate: record.serviceDate ? new Date(record.serviceDate).toISOString().split("T")[0] : "",
      cptCode: record.cptCode,
      icdCodes: (record.icdCodes as string[]) || [],
      amount: ((record.amount || 0) / 100).toFixed(2),
      insuranceProvider: record.insuranceProvider || "",
      claimStatus: record.claimStatus || "unbilled",
      paymentReceived: ((record.paymentReceived || 0) / 100).toFixed(2),
      notes: record.notes || "",
    });
  }

  function handleSubmit() {
    const payload: any = {
      clientId: parseInt(form.clientId),
      noteId: form.noteId && form.noteId !== "none" ? parseInt(form.noteId) : null,
      serviceDate: new Date(form.serviceDate).toISOString(),
      cptCode: form.cptCode,
      icdCodes: form.icdCodes,
      amount: parseDollars(form.amount),
      insuranceProvider: form.insuranceProvider || null,
      claimStatus: form.claimStatus,
      paymentReceived: parseDollars(form.paymentReceived),
      notes: form.notes || null,
    };

    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function toggleIcdCode(code: string) {
    setForm((prev) => ({
      ...prev,
      icdCodes: prev.icdCodes.includes(code)
        ? prev.icdCodes.filter((c) => c !== code)
        : [...prev.icdCodes, code],
    }));
  }

  function getClientName(clientId: number): string {
    const client = clients.find((c: any) => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : `Client #${clientId}`;
  }

  const totalBilled = records.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalReceived = records.reduce((sum, r) => sum + (r.paymentReceived || 0), 0);
  const outstanding = totalBilled - totalReceived;
  const statusCounts = CLAIM_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: records.filter((r) => r.claimStatus === s).length }),
    {} as Record<string, number>
  );

  const filtered = records.filter((r) => {
    const clientName = getClientName(r.clientId).toLowerCase();
    const matchesSearch = clientName.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || r.claimStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isDialogOpen = isCreateOpen || !!editingRecord;

  const cptCategories = Array.from(new Set(CPT_CODES.map((c) => c.category)));
  const diagCategories = Array.from(new Set(COMMON_DIAGNOSES.map((d) => d.category)));

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-billing-title">
              Billing
            </h1>
            <p className="text-sm text-muted-foreground">
              Track insurance claims, billing records, and revenue
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-billing">
                <Plus className="h-4 w-4 mr-2" />
                Create Billing Record
              </Button>
            </DialogTrigger>
            <BillingFormDialog
              form={form}
              setForm={setForm}
              onSubmit={handleSubmit}
              onCancel={() => { setIsCreateOpen(false); resetForm(); }}
              isPending={isPending}
              clients={clients}
              soapNotes={soapNotes}
              toggleIcdCode={toggleIcdCode}
              cptCategories={cptCategories}
              diagCategories={diagCategories}
              title="Create Billing Record"
              description="Add a new billing record for a client session"
              submitLabel="Create Record"
            />
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-total-billed">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-billed">
                {formatCents(totalBilled)}
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-total-received">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Received</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-received">
                {formatCents(totalReceived)}
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-outstanding">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-outstanding">
                {formatCents(outstanding)}
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-claims-status">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Claims by Status</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {CLAIM_STATUSES.map((s) => (
                  <Badge
                    key={s}
                    variant={STATUS_MAP[s].variant}
                    data-testid={`badge-status-count-${s}`}
                  >
                    {STATUS_MAP[s].label}: {statusCounts[s] || 0}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-search-billing"
              className="pl-9"
              placeholder="Search by client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-filter-status">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Claim Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {CLAIM_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_MAP[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-24" />
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No billing records yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                Create billing records to track insurance claims and payments
              </p>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-empty-create-billing">
                <Plus className="h-4 w-4 mr-2" />
                Create Billing Record
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((record) => {
              const statusInfo = STATUS_MAP[record.claimStatus || "unbilled"];
              const cptInfo = CPT_CODES.find((c) => c.code === record.cptCode);
              return (
                <Card key={record.id} data-testid={`card-billing-${record.id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium" data-testid={`text-client-name-${record.id}`}>
                            {getClientName(record.clientId)}
                          </span>
                          <Badge variant={statusInfo.variant} data-testid={`badge-status-${record.id}`}>
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {record.cptCode}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span data-testid={`text-service-date-${record.id}`}>
                            {record.serviceDate
                              ? new Date(record.serviceDate).toLocaleDateString()
                              : "No date"}
                          </span>
                          {cptInfo && <span className="truncate">{cptInfo.description}</span>}
                          {record.insuranceProvider && (
                            <span>{record.insuranceProvider}</span>
                          )}
                        </div>
                        {(record.icdCodes as string[] || []).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(record.icdCodes as string[]).slice(0, 3).map((code) => (
                              <Badge key={code} variant="outline" className="text-[10px]">
                                {code}
                              </Badge>
                            ))}
                            {(record.icdCodes as string[]).length > 3 && (
                              <Badge variant="outline" className="text-[10px]">
                                +{(record.icdCodes as string[]).length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                        {record.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{record.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right space-y-0.5">
                          <div className="font-semibold" data-testid={`text-amount-${record.id}`}>
                            {formatCents(record.amount || 0)}
                          </div>
                          <div className="text-xs text-muted-foreground" data-testid={`text-received-${record.id}`}>
                            Received: {formatCents(record.paymentReceived || 0)}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(record)}
                            data-testid={`button-edit-billing-${record.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground"
                                data-testid={`button-delete-billing-${record.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Billing Record</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this billing record for{" "}
                                  {getClientName(record.clientId)}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-testid={`button-cancel-delete-${record.id}`}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(record.id)}
                                  data-testid={`button-confirm-delete-${record.id}`}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog
          open={!!editingRecord}
          onOpenChange={(open) => { if (!open) { setEditingRecord(null); resetForm(); } }}
        >
          <BillingFormDialog
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            onCancel={() => { setEditingRecord(null); resetForm(); }}
            isPending={isPending}
            clients={clients}
            soapNotes={soapNotes}
            toggleIcdCode={toggleIcdCode}
            cptCategories={cptCategories}
            diagCategories={diagCategories}
            title="Edit Billing Record"
            description="Update the billing record details"
            submitLabel="Save Changes"
          />
        </Dialog>
      </div>
    </LayoutShell>
  );
}

function BillingFormDialog({
  form,
  setForm,
  onSubmit,
  onCancel,
  isPending,
  clients,
  soapNotes,
  toggleIcdCode,
  cptCategories,
  diagCategories,
  title,
  description,
  submitLabel,
}: {
  form: typeof defaultForm;
  setForm: (fn: (prev: typeof defaultForm) => typeof defaultForm) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  clients: any[];
  soapNotes: any[];
  toggleIcdCode: (code: string) => void;
  cptCategories: string[];
  diagCategories: string[];
  title: string;
  description: string;
  submitLabel: string;
}) {
  const [diagSearch, setDiagSearch] = useState("");

  const filteredDiagnoses = COMMON_DIAGNOSES.filter(
    (d) =>
      d.code.toLowerCase().includes(diagSearch.toLowerCase()) ||
      d.name.toLowerCase().includes(diagSearch.toLowerCase())
  );

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={form.clientId} onValueChange={(v) => setForm((p) => ({ ...p, clientId: v }))}>
              <SelectTrigger data-testid="select-client">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Linked Note (optional)</Label>
            <Select value={form.noteId} onValueChange={(v) => setForm((p) => ({ ...p, noteId: v }))}>
              <SelectTrigger data-testid="select-note">
                <SelectValue placeholder="Select note" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {soapNotes.map((n: any) => (
                  <SelectItem key={n.id} value={String(n.id)}>
                    {n.clientName} - {new Date(n.sessionDate).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Service Date *</Label>
            <Input
              data-testid="input-service-date"
              type="date"
              value={form.serviceDate}
              onChange={(e) => setForm((p) => ({ ...p, serviceDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>CPT Code *</Label>
            <Select value={form.cptCode} onValueChange={(v) => setForm((p) => ({ ...p, cptCode: v }))}>
              <SelectTrigger data-testid="select-cpt-code">
                <SelectValue placeholder="Select CPT code" />
              </SelectTrigger>
              <SelectContent>
                {cptCategories.map((cat) => (
                  <div key={cat}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{cat}</div>
                    {CPT_CODES.filter((c) => c.category === cat).map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} - {c.description}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>ICD Codes (Diagnoses)</Label>
          <Input
            data-testid="input-search-diagnoses"
            placeholder="Search diagnoses..."
            value={diagSearch}
            onChange={(e) => setDiagSearch(e.target.value)}
          />
          {form.icdCodes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {form.icdCodes.map((code) => {
                const diag = COMMON_DIAGNOSES.find((d) => d.code === code);
                return (
                  <Badge
                    key={code}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleIcdCode(code)}
                    data-testid={`badge-selected-icd-${code}`}
                  >
                    {code}
                    {diag ? ` - ${diag.name}` : ""}
                    <XCircle className="h-3 w-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
          )}
          <div className="max-h-40 overflow-y-auto border rounded-md">
            {diagCategories.map((cat) => {
              const codesInCat = filteredDiagnoses.filter((d) => d.category === cat);
              if (codesInCat.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                    {cat}
                  </div>
                  {codesInCat.map((d) => (
                    <label
                      key={d.code}
                      className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover-elevate"
                    >
                      <Checkbox
                        checked={form.icdCodes.includes(d.code)}
                        onCheckedChange={() => toggleIcdCode(d.code)}
                        data-testid={`checkbox-icd-${d.code}`}
                      />
                      <span className="text-muted-foreground font-mono text-xs">{d.code}</span>
                      <span className="truncate">{d.name}</span>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Amount ($) *</Label>
            <Input
              data-testid="input-amount"
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label>Payment Received ($)</Label>
            <Input
              data-testid="input-payment-received"
              type="number"
              step="0.01"
              min="0"
              value={form.paymentReceived}
              onChange={(e) => setForm((p) => ({ ...p, paymentReceived: e.target.value }))}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Insurance Provider</Label>
            <Input
              data-testid="input-insurance-provider"
              value={form.insuranceProvider}
              onChange={(e) => setForm((p) => ({ ...p, insuranceProvider: e.target.value }))}
              placeholder="e.g. Blue Cross Blue Shield"
            />
          </div>
          <div className="space-y-2">
            <Label>Claim Status</Label>
            <Select value={form.claimStatus} onValueChange={(v) => setForm((p) => ({ ...p, claimStatus: v }))}>
              <SelectTrigger data-testid="select-claim-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLAIM_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_MAP[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            data-testid="input-billing-notes"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Additional billing notes..."
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          data-testid="button-submit-billing"
          onClick={onSubmit}
          disabled={!form.clientId || !form.serviceDate || !form.cptCode || isPending}
        >
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
