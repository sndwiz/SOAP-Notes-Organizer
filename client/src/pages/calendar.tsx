import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutShell } from "@/components/layout-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, FileText } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { Link } from "wouter";
import type { SoapNote } from "@shared/schema";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: notes = [] } = useQuery<SoapNote[]>({
    queryKey: ['/api/soap-notes'],
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const notesByDay = useMemo(() => {
    const map: Record<string, SoapNote[]> = {};
    notes.forEach(note => {
      const key = format(new Date(note.sessionDate), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(note);
    });
    return map;
  }, [notes]);

  const today = new Date();
  const selectedDayKey = format(today, 'yyyy-MM-dd');

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display" data-testid="text-calendar-title">Calendar</h1>
          <p className="text-muted-foreground text-sm">View your session schedule</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} data-testid="button-prev-month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg" data-testid="text-current-month">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} data-testid="button-next-month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayNotes = notesByDay[key] || [];
                const isToday = isSameDay(day, today);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <div
                    key={key}
                    className={`min-h-[80px] md:min-h-[100px] p-1.5 border border-border/30 rounded-md ${
                      isToday ? 'bg-primary/5 border-primary/30' : ''
                    } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                  >
                    <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayNotes.slice(0, 3).map(note => (
                        <Link key={note.id} href={`/notes/${note.id}`}>
                          <div className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 truncate cursor-pointer hover:bg-primary/20 transition-colors">
                            {note.clientName}
                          </div>
                        </Link>
                      ))}
                      {dayNotes.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">+{dayNotes.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {notes.filter(n => new Date(n.sessionDate) >= today).length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
            ) : (
              <div className="space-y-2">
                {notes
                  .filter(n => new Date(n.sessionDate) >= today)
                  .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
                  .slice(0, 5)
                  .map(note => (
                    <Link key={note.id} href={`/notes/${note.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer border border-border/30">
                        <FileText className="h-4 w-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{note.clientName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(note.sessionDate), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{note.cptCode}</Badge>
                      </div>
                    </Link>
                  ))
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
