import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertSoapNote } from "@shared/routes";
import { type SoapNote } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useSoapNotes() {
  const { toast } = useToast();

  return useQuery({
    queryKey: [api.soapNotes.list.path],
    queryFn: async () => {
      const res = await fetch(api.soapNotes.list.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch SOAP notes");
      const data = await res.json();
      return api.soapNotes.list.responses[200].parse(data);
    },
  });
}

export function useSoapNote(id: number) {
  return useQuery({
    queryKey: [api.soapNotes.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.soapNotes.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch SOAP note");
      const data = await res.json();
      return api.soapNotes.get.responses[200].parse(data);
    },
    enabled: !!id,
  });
}

export function useCreateSoapNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSoapNote) => {
      const res = await fetch(api.soapNotes.create.path, {
        method: api.soapNotes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create note");
      }
      return api.soapNotes.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.soapNotes.list.path] });
      toast({
        title: "Note Created",
        description: `SOAP note for ${data.clientName} created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSoapNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertSoapNote>) => {
      const url = buildUrl(api.soapNotes.update.path, { id });
      const res = await fetch(url, {
        method: api.soapNotes.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update note");
      return api.soapNotes.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.soapNotes.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.soapNotes.get.path, data.id] });
      toast({
        title: "Note Saved",
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSoapNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.soapNotes.delete.path, { id });
      const res = await fetch(url, {
        method: api.soapNotes.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.soapNotes.list.path] });
      toast({
        title: "Note Deleted",
        description: "The SOAP note has been permanently removed.",
        variant: "destructive",
      });
    },
  });
}
