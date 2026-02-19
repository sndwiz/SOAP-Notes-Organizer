import { useState, useEffect, useRef } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Plus, User, Clock, ArrowLeft } from "lucide-react";

interface MessageThread {
  id: number;
  userId: string;
  clientId: number;
  subject: string;
  lastMessageAt: string | null;
  status: string;
  createdAt: string;
  unreadCount?: number;
  client?: { firstName: string; lastName: string };
}

interface Message {
  id: number;
  threadId: number;
  senderType: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatTimestamp(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MessagingPage() {
  const { toast } = useToast();
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threads = [], isLoading: threadsLoading } = useQuery<MessageThread[]>({
    queryKey: ["/api/message-threads"],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const { data: selectedThread } = useQuery<MessageThread>({
    queryKey: ["/api/message-threads", selectedThreadId],
    enabled: !!selectedThreadId,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/message-threads", selectedThreadId, "messages"],
    enabled: !!selectedThreadId,
  });

  const markReadMutation = useMutation({
    mutationFn: async (threadId: number) => {
      await apiRequest("PUT", `/api/message-threads/${threadId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-threads"] });
      if (selectedThreadId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/message-threads", selectedThreadId, "messages"],
        });
      }
    },
  });

  const createThreadMutation = useMutation({
    mutationFn: async (data: { clientId: number; subject: string; status: string }) => {
      const res = await apiRequest("POST", "/api/message-threads", data);
      return res.json();
    },
    onSuccess: (thread: MessageThread) => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-threads"] });
      setIsCreateOpen(false);
      setNewSubject("");
      setNewClientId("");
      setSelectedThreadId(thread.id);
      toast({ title: "Thread created" });
    },
    onError: () => toast({ title: "Failed to create thread", variant: "destructive" }),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ threadId, body }: { threadId: number; body: string }) => {
      const res = await apiRequest("POST", `/api/message-threads/${threadId}/messages`, { body });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/message-threads", selectedThreadId, "messages"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/message-threads"] });
      setMessageBody("");
    },
    onError: () => toast({ title: "Failed to send message", variant: "destructive" }),
  });

  useEffect(() => {
    if (selectedThreadId) {
      markReadMutation.mutate(selectedThreadId);
    }
  }, [selectedThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSendMessage() {
    if (!messageBody.trim() || !selectedThreadId) return;
    sendMessageMutation.mutate({ threadId: selectedThreadId, body: messageBody.trim() });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function getClientName(thread: MessageThread) {
    if (thread.client) {
      return `${thread.client.firstName} ${thread.client.lastName}`;
    }
    const client = clients.find((c: any) => c.id === thread.clientId);
    if (client) return `${client.firstName} ${client.lastName}`;
    return "Unknown Client";
  }

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-messaging-title">
              Messages
            </h1>
            <p className="text-sm text-muted-foreground">
              Communicate with clients through secure message threads
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-thread">
                <Plus className="h-4 w-4 mr-2" />
                New Thread
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Message Thread</DialogTitle>
                <DialogDescription>Start a new conversation with a client</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={newClientId} onValueChange={setNewClientId}>
                    <SelectTrigger data-testid="select-thread-client">
                      <SelectValue placeholder="Select a client" />
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
                  <Label>Subject</Label>
                  <Input
                    data-testid="input-thread-subject"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Enter thread subject"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  data-testid="button-create-thread"
                  onClick={() =>
                    createThreadMutation.mutate({
                      clientId: Number(newClientId),
                      subject: newSubject,
                      status: "active",
                    })
                  }
                  disabled={!newClientId || !newSubject.trim() || createThreadMutation.isPending}
                >
                  {createThreadMutation.isPending ? "Creating..." : "Create Thread"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: "calc(100vh - 280px)" }}>
          <Card className={`lg:col-span-1 flex flex-col overflow-hidden ${selectedThreadId ? "hidden lg:flex" : "flex"}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <CardTitle className="text-base">Threads</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {threads.length}
              </Badge>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              {threadsLoading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
                  ))}
                </div>
              ) : threads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No threads yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Start a conversation with a client
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="divide-y">
                    {threads.map((thread) => {
                      const isSelected = selectedThreadId === thread.id;
                      const unread = (thread as any).unreadCount || 0;
                      return (
                        <button
                          key={thread.id}
                          onClick={() => setSelectedThreadId(thread.id)}
                          className={`w-full text-left px-4 py-3 transition-colors ${
                            isSelected
                              ? "bg-primary/10"
                              : "hover-elevate"
                          }`}
                          data-testid={`thread-item-${thread.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-medium truncate ${
                                  unread > 0 ? "font-semibold" : ""
                                }`}
                                data-testid={`text-thread-subject-${thread.id}`}
                              >
                                {thread.subject}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span
                                  className="text-xs text-muted-foreground truncate"
                                  data-testid={`text-thread-client-${thread.id}`}
                                >
                                  {getClientName(thread)}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {thread.lastMessageAt && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatTime(thread.lastMessageAt)}
                                </span>
                              )}
                              {unread > 0 && (
                                <Badge
                                  variant="default"
                                  className="h-5 min-w-[20px] px-1.5 text-[10px]"
                                  data-testid={`badge-unread-${thread.id}`}
                                >
                                  {unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className={`lg:col-span-2 flex flex-col overflow-hidden ${selectedThreadId ? "flex" : "hidden lg:flex"}`}>
            {!selectedThreadId ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground" data-testid="text-empty-state">
                  Select a thread to view messages
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Or start a new conversation
                </p>
              </div>
            ) : (
              <>
                <CardHeader className="flex flex-row items-center gap-3 pb-3 border-b">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSelectedThreadId(null)}
                    data-testid="button-back-threads"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate" data-testid="text-active-thread-subject">
                      {selectedThread?.subject || "Loading..."}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground" data-testid="text-active-thread-client">
                        {selectedThread ? getClientName(selectedThread) : ""}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                  <ScrollArea className="flex-1 px-4 py-3">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">
                            No messages yet. Start the conversation below.
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isProvider = msg.senderType === "provider";
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isProvider ? "justify-end" : "justify-start"}`}
                              data-testid={`message-item-${msg.id}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-lg px-3 py-2 ${
                                  isProvider
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`text-[10px] font-medium ${
                                      isProvider ? "text-primary-foreground/70" : "text-muted-foreground"
                                    }`}
                                  >
                                    {isProvider ? "You" : "Client"}
                                  </span>
                                  <span
                                    className={`text-[10px] ${
                                      isProvider ? "text-primary-foreground/50" : "text-muted-foreground/70"
                                    }`}
                                  >
                                    {formatTimestamp(msg.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap" data-testid={`text-message-body-${msg.id}`}>
                                  {msg.body}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="border-t px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Input
                        data-testid="input-message-body"
                        className="flex-1"
                        placeholder="Type a message..."
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!messageBody.trim() || sendMessageMutation.isPending}
                        data-testid="button-send-message"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </LayoutShell>
  );
}
