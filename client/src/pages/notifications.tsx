import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Info, AlertTriangle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Notification } from "@shared/schema";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({ queryKey: ['/api/notifications'] });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('PUT', `/api/notifications/${id}/read`);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PUT', '/api/notifications/read-all');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/notifications'] }),
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const typeIcon = (type: string | null) => {
    if (type === 'warning') return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    if (type === 'reminder') return <Clock className="h-4 w-4 text-blue-500" />;
    if (type === 'task') return <Check className="h-4 w-4 text-green-500" />;
    return <Info className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold font-display" data-testid="text-notifications-title">Notifications</h1>
            <p className="text-muted-foreground text-sm">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()} data-testid="button-mark-all-read">
              <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-16 animate-pulse bg-muted/50 border-0" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-medium">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => (
              <Card key={notif.id} className={`border-border/60 ${!notif.isRead ? 'bg-primary/[0.03] border-primary/20' : ''}`} data-testid={`card-notif-${notif.id}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  {typeIcon(notif.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notif.isRead ? '' : 'text-muted-foreground'}`}>{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(notif.createdAt!), "MMM d, h:mm a")}</p>
                  </div>
                  {!notif.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => markReadMutation.mutate(notif.id)} data-testid={`button-read-notif-${notif.id}`}>
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
