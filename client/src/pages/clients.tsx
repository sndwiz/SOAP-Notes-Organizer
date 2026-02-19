import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Phone, Mail, Shield, UserPlus, Users, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "@shared/schema";

export default function ClientsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    insuranceProvider: "", insuranceId: "", notes: "", status: "active"
  });

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/clients', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsDialogOpen(false);
      setFormData({ firstName: "", lastName: "", email: "", phone: "", insuranceProvider: "", insuranceId: "", notes: "", status: "active" });
      toast({ title: "Client Added", description: "New client has been added." });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = clients.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string | null) => {
    if (s === 'active') return 'bg-green-500/10 text-green-700 dark:text-green-400';
    if (s === 'inactive') return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display" data-testid="text-clients-title">Clients</h1>
            <p className="text-muted-foreground text-sm">Manage your client roster</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-client">
                <UserPlus className="mr-2 h-4 w-4" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input data-testid="input-first-name" value={formData.firstName} onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input data-testid="input-last-name" value={formData.lastName} onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" data-testid="input-client-email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input data-testid="input-client-phone" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Insurance Provider</Label>
                    <Input value={formData.insuranceProvider} onChange={(e) => setFormData(p => ({ ...p, insuranceProvider: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance ID</Label>
                    <Input value={formData.insuranceId} onChange={(e) => setFormData(p => ({ ...p, insuranceId: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} className="min-h-[80px]" />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-client">
                  {createMutation.isPending ? "Adding..." : "Add Client"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-clients" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Card key={i} className="h-40 animate-pulse bg-muted/50 border-0" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-medium">No clients yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Add your first client to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <Card key={client.id} className="hover-elevate cursor-pointer" data-testid={`card-client-${client.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {client.firstName[0]}{client.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{client.firstName} {client.lastName}</h3>
                        <Badge variant="secondary" className={`text-[10px] ${statusColor(client.status)}`}>
                          {client.status}
                        </Badge>
                      </div>
                      {client.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3" /> {client.email}
                        </p>
                      )}
                      {client.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" /> {client.phone}
                        </p>
                      )}
                      {client.insuranceProvider && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Shield className="h-3 w-3" /> {client.insuranceProvider}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
