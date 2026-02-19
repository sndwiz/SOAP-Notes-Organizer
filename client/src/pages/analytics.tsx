import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutShell } from "@/components/layout-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Calendar, TrendingUp, Clock, AlertTriangle, BarChart3, Activity } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import type { SoapNote, Client } from "@shared/schema";

export default function AnalyticsPage() {
  const { data: notes = [] } = useQuery<SoapNote[]>({ queryKey: ['/api/soap-notes'] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ['/api/clients'] });

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const recentNotes = notes.filter(n => isAfter(new Date(n.sessionDate), thirtyDaysAgo));

    const cptBreakdown: Record<string, number> = {};
    notes.forEach(n => {
      const code = n.cptCode || 'Unknown';
      cptBreakdown[code] = (cptBreakdown[code] || 0) + 1;
    });

    const diagnosisBreakdown: Record<string, number> = {};
    notes.forEach(n => {
      const diags = n.diagnoses as any[];
      if (Array.isArray(diags)) {
        diags.forEach(d => {
          diagnosisBreakdown[d.code] = (diagnosisBreakdown[d.code] || 0) + 1;
        });
      }
    });

    const riskFlags = notes.filter(n => n.riskSuicidal !== 'Denied' || n.riskHomicidal !== 'Denied');
    const avgPhq9 = notes.length > 0 ? Math.round(notes.reduce((s, n) => s + (n.phq9Score || 0), 0) / notes.length) : 0;
    const avgGad7 = notes.length > 0 ? Math.round(notes.reduce((s, n) => s + (n.gad7Score || 0), 0) / notes.length) : 0;

    return { recentNotes, cptBreakdown, diagnosisBreakdown, riskFlags, avgPhq9, avgGad7 };
  }, [notes]);

  const summaryCards = [
    { label: "Total Notes", value: notes.length, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active Clients", value: clients.filter(c => c.status === 'active').length, icon: Users, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Last 30 Days", value: stats.recentNotes.length, icon: Calendar, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Risk Alerts", value: stats.riskFlags.length, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display" data-testid="text-analytics-title">Analytics</h1>
          <p className="text-muted-foreground text-sm">Practice insights and metrics</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> CPT Code Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.cptBreakdown).length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.cptBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .map(([code, count]) => (
                      <div key={code} className="flex items-center gap-3">
                        <Badge variant="secondary" className="font-mono text-xs w-16 justify-center">{code}</Badge>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(count / notes.length) * 100}%` }} />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Assessment Averages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">PHQ-9 Average</span>
                  <span className="font-bold">{stats.avgPhq9}/27</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${stats.avgPhq9 > 14 ? 'bg-red-500' : stats.avgPhq9 > 9 ? 'bg-orange-500' : stats.avgPhq9 > 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${(stats.avgPhq9 / 27) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.avgPhq9 <= 4 ? 'Minimal' : stats.avgPhq9 <= 9 ? 'Mild' : stats.avgPhq9 <= 14 ? 'Moderate' : stats.avgPhq9 <= 19 ? 'Mod. Severe' : 'Severe'}
                </p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">GAD-7 Average</span>
                  <span className="font-bold">{stats.avgGad7}/21</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${stats.avgGad7 > 14 ? 'bg-red-500' : stats.avgGad7 > 9 ? 'bg-orange-500' : stats.avgGad7 > 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${(stats.avgGad7 / 21) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.avgGad7 <= 4 ? 'Minimal' : stats.avgGad7 <= 9 ? 'Mild' : stats.avgGad7 <= 14 ? 'Moderate' : 'Severe'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Top Diagnoses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.diagnosisBreakdown).length === 0 ? (
                <p className="text-sm text-muted-foreground">No diagnoses recorded yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(stats.diagnosisBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([code, count]) => (
                      <div key={code} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <Badge variant="secondary" className="font-mono text-xs">{code}</Badge>
                        <span className="text-sm font-medium">{count} session{count > 1 ? 's' : ''}</span>
                      </div>
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutShell>
  );
}
