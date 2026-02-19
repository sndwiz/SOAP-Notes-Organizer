import { useSoapNotes, useCreateSoapNote } from "@/hooks/use-soap-notes";
import { Link, useLocation } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  FileText, 
  MoreVertical, 
  ArrowRight,
  TrendingUp,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Dashboard() {
  const { data: notes, isLoading } = useSoapNotes();
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const filteredNotes = notes?.filter(note => 
    note.clientName.toLowerCase().includes(search.toLowerCase()) ||
    (note.assessment ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: "Total Notes", value: notes?.length || 0, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "This Month", value: notes?.filter(n => new Date(n.sessionDate).getMonth() === new Date().getMonth()).length || 0, icon: Calendar, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Risk Alerts", value: notes?.filter(n => n.riskSuicidal !== "Denied" || n.riskHomicidal !== "Denied").length || 0, icon: Activity, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <LayoutShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your recent clinical activity</p>
          </div>
          <Link href="/notes/new">
            <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
              <Plus className="mr-2 h-5 w-5" />
              New Note
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold font-display">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Notes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Sessions</h2>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients..." 
                className="pl-9 bg-background" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="h-48 animate-pulse bg-muted/50 border-0" />
              ))}
            </div>
          ) : filteredNotes?.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border">
              <div className="bg-background p-4 rounded-full w-fit mx-auto mb-4 shadow-sm">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No notes found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                Get started by creating your first SOAP note for a client session.
              </p>
              <Link href="/notes/new">
                <Button variant="outline" className="mt-6">Create Note</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes?.map((note) => (
                <Link key={note.id} href={`/notes/${note.id}`}>
                  <Card className="group cursor-pointer border-border/60 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border bg-secondary">
                            <AvatarFallback className="text-primary font-medium">
                              {note.clientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base group-hover:text-primary transition-colors">
                              {note.clientName}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-0.5 text-xs">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(note.sessionDate), "MMM d, yyyy")}
                            </CardDescription>
                          </div>
                        </div>
                        {(note.riskSuicidal !== "Denied" || note.riskHomicidal !== "Denied") && (
                          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Risk Flagged" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg">
                          <Clock className="h-4 w-4" />
                          <span>CPT: {note.cptCode}</span>
                        </div>
                        {note.assessment && (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {note.assessment}
                          </p>
                        )}
                        <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 mt-4">
                          <span>{note.location}</span>
                          <span className="group-hover:translate-x-1 transition-transform flex items-center text-primary font-medium">
                            View <ArrowRight className="h-3 w-3 ml-1" />
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </LayoutShell>
  );
}
