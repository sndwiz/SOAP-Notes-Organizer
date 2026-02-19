import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, File, Image, Trash2, Download, Search, FolderOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DOCUMENT_CATEGORIES } from "@shared/schema";

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function fileIcon(mime: string) {
  if (mime.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  if (mime.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

export default function DocumentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("general");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: documents = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/documents'] });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', uploadName || selectedFile.name);
      formData.append('category', uploadCategory);
      const res = await fetch('/api/documents', { method: 'POST', body: formData, credentials: 'include' });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setIsDialogOpen(false);
      setSelectedFile(null);
      setUploadName("");
      setUploadCategory("general");
      toast({ title: "Document Uploaded" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/documents/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({ title: "Document Deleted" });
    },
  });

  const filtered = documents
    .filter(d => catFilter === 'all' || d.category === catFilter)
    .filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.originalName.toLowerCase().includes(search.toLowerCase()));

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display" data-testid="text-documents-title">Documents</h1>
            <p className="text-muted-foreground text-sm">Upload and manage clinical documents</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-doc"><Upload className="mr-2 h-4 w-4" /> Upload</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); uploadMutation.mutate(); }} className="space-y-4">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setSelectedFile(f); if (!uploadName) setUploadName(f.name); }
                    }}
                    data-testid="input-file-upload"
                  />
                  {selectedFile ? (
                    <div className="flex items-center gap-2 justify-center">
                      {fileIcon(selectedFile.type)}
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground">({formatBytes(selectedFile.size)})</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to select a file</p>
                      <p className="text-xs text-muted-foreground">Max 10MB</p>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Document Name</Label>
                  <Input value={uploadName} onChange={e => setUploadName(e.target.value)} data-testid="input-doc-name" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={!selectedFile || uploadMutation.isPending} data-testid="button-submit-upload">
                  {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search documents..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-docs" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {DOCUMENT_CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-16 animate-pulse bg-muted/50 border-0" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border">
            <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-medium">No documents</h3>
            <p className="text-sm text-muted-foreground mt-1">Upload your first document to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((doc: any) => (
              <Card key={doc.id} className="border-border/60" data-testid={`card-doc-${doc.id}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  {fileIcon(doc.mimeType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{formatBytes(doc.size)}</span>
                      <Badge variant="secondary" className="text-[10px]">{doc.category}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(doc.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => window.open(`/api/documents/${doc.id}?download=true`, '_blank')}
                      data-testid={`button-download-doc-${doc.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(doc.id)} data-testid={`button-delete-doc-${doc.id}`}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
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
