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
import { Progress } from "@/components/ui/progress";
import {
  Plus, GraduationCap, Trash2, BookOpen, Award, Calendar,
  Clock, CheckCircle, ExternalLink
} from "lucide-react";
import { CE_CATEGORIES, type CeCredit } from "@shared/schema";

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  planned: { label: "Planned", variant: "outline" },
  "in-progress": { label: "In Progress", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
};

export default function CeResourcesPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [form, setForm] = useState({
    title: "",
    provider: "",
    category: "general",
    hours: 1,
    completionDate: "",
    expirationDate: "",
    certificateUrl: "",
    notes: "",
    status: "completed",
  });

  const { data: credits = [], isLoading } = useQuery<CeCredit[]>({
    queryKey: ['/api/ce-credits'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        completionDate: data.completionDate ? new Date(data.completionDate).toISOString() : null,
        expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
      };
      const res = await apiRequest("POST", "/api/ce-credits", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ce-credits'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "CE credit added" });
    },
    onError: () => toast({ title: "Failed to add CE credit", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ce-credits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ce-credits'] });
      toast({ title: "CE credit deleted" });
    },
  });

  function resetForm() {
    setForm({
      title: "", provider: "", category: "general", hours: 1,
      completionDate: "", expirationDate: "", certificateUrl: "", notes: "", status: "completed",
    });
  }

  const completedCredits = credits.filter(c => c.status === "completed");
  const totalHours = completedCredits.reduce((sum, c) => sum + c.hours, 0);

  const categoryBreakdown = CE_CATEGORIES.map(cat => {
    const catCredits = completedCredits.filter(c => c.category === cat.id);
    const earned = catCredits.reduce((sum, c) => sum + c.hours, 0);
    return { ...cat, earned, remaining: Math.max(0, cat.requiredHours - earned) };
  });

  const totalRequired = CE_CATEGORIES.reduce((sum, c) => sum + c.requiredHours, 0);
  const progressPercent = totalRequired > 0 ? Math.min(100, (totalHours / totalRequired) * 100) : 0;

  const filtered = filterCategory === "all" ? credits : credits.filter(c => c.category === filterCategory);

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-ce-title">CE Resources</h1>
            <p className="text-sm text-muted-foreground">Track continuing education credits and requirements</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-ce-credit">
                <Plus className="h-4 w-4 mr-2" />
                Add CE Credit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add CE Credit</DialogTitle>
                <DialogDescription>Log a completed or planned continuing education activity</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    data-testid="input-ce-title"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g., Ethics in Telehealth Practice"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provider/Organization</Label>
                    <Input
                      data-testid="input-ce-provider"
                      value={form.provider}
                      onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
                      placeholder="e.g., APA, NASW"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                      <SelectTrigger data-testid="select-ce-category"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CE_CATEGORIES.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CE Hours *</Label>
                    <Input
                      data-testid="input-ce-hours"
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={form.hours}
                      onChange={e => setForm(p => ({ ...p, hours: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger data-testid="select-ce-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Completion Date</Label>
                    <Input
                      data-testid="input-ce-completion-date"
                      type="date"
                      value={form.completionDate}
                      onChange={e => setForm(p => ({ ...p, completionDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiration Date</Label>
                    <Input
                      data-testid="input-ce-expiration-date"
                      type="date"
                      value={form.expirationDate}
                      onChange={e => setForm(p => ({ ...p, expirationDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Certificate URL</Label>
                  <Input
                    data-testid="input-ce-certificate-url"
                    value={form.certificateUrl}
                    onChange={e => setForm(p => ({ ...p, certificateUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    data-testid="input-ce-notes"
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Additional details..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button
                  data-testid="button-submit-ce-credit"
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.title || !form.hours || createMutation.isPending}
                >
                  {createMutation.isPending ? "Adding..." : "Add Credit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                <Award className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold" data-testid="text-total-hours">{totalHours}</p>
              <p className="text-xs text-muted-foreground">of {totalRequired} required hours</p>
              <Progress value={progressPercent} className="mt-2 h-2" />
            </CardContent>
          </Card>

          {categoryBreakdown.filter(c => c.requiredHours > 0).map(cat => {
            const catProgress = cat.requiredHours > 0 ? Math.min(100, (cat.earned / cat.requiredHours) * 100) : 100;
            return (
              <Card key={cat.id}>
                <CardContent className="pt-5">
                  <p className="text-sm font-medium text-muted-foreground">{cat.name}</p>
                  <p className="text-xl font-bold mt-1">{cat.earned} / {cat.requiredHours}</p>
                  <Progress value={catProgress} className="mt-2 h-2" />
                  {cat.remaining > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{cat.remaining} hours remaining</p>
                  )}
                  {cat.remaining === 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Complete
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px]" data-testid="select-filter-ce-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CE_CATEGORIES.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse"><CardContent className="h-20" /></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No CE credits logged yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">Start tracking your continuing education hours</p>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-empty-add-ce">
                <Plus className="h-4 w-4 mr-2" />
                Add CE Credit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((credit) => {
              const statusInfo = STATUS_STYLES[credit.status || "completed"];
              const catInfo = CE_CATEGORIES.find(c => c.id === credit.category);
              return (
                <Card key={credit.id} data-testid={`card-ce-credit-${credit.id}`}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm truncate" data-testid={`text-ce-title-${credit.id}`}>
                          {credit.title}
                        </p>
                        <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                        {catInfo && <Badge variant="outline" className="text-xs">{catInfo.name}</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {credit.provider && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {credit.provider}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {credit.hours} hours
                        </span>
                        {credit.completionDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(credit.completionDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {credit.certificateUrl && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={credit.certificateUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-certificate-${credit.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        onClick={() => deleteMutation.mutate(credit.id)}
                        data-testid={`button-delete-ce-${credit.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              CE Resources & Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { name: "APA Continuing Education", url: "https://www.apa.org/education/ce", desc: "American Psychological Association CE programs" },
                { name: "NASW CE Programs", url: "https://www.socialworkers.org/Careers/Continuing-Education", desc: "National Association of Social Workers" },
                { name: "NBCC CE Requirements", url: "https://www.nbcc.org/certification/ncc/renewal", desc: "National Board for Certified Counselors" },
                { name: "ASWB CE Tracker", url: "https://www.aswb.org/", desc: "Association of Social Work Boards" },
                { name: "Psychology Today CE", url: "https://www.psychologytoday.com/us/continuing-education", desc: "Free & paid CE courses" },
                { name: "PESI CE Training", url: "https://www.pesi.com/", desc: "Mental health CE seminars & training" },
              ].map((resource) => (
                <a
                  key={resource.name}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg hover-elevate border border-border/50"
                  data-testid={`link-resource-${resource.name.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <ExternalLink className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{resource.name}</p>
                    <p className="text-xs text-muted-foreground">{resource.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
