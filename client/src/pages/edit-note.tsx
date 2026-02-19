import { useSoapNote, useUpdateSoapNote, useDeleteSoapNote } from "@/hooks/use-soap-notes";
import { LayoutShell } from "@/components/layout-shell";
import { SoapEditor } from "@/components/soap-editor";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import type { InsertSoapNote } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditNote({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { data: note, isLoading } = useSoapNote(id);
  const { mutateAsync: updateNote, isPending } = useUpdateSoapNote();
  const { mutateAsync: deleteNote } = useDeleteSoapNote();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </LayoutShell>
    );
  }

  if (!note) {
    return (
      <LayoutShell>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold">Note not found</h2>
          <Link href="/">
            <Button className="mt-4">Return Home</Button>
          </Link>
        </div>
      </LayoutShell>
    );
  }

  const handleSubmit = async (data: InsertSoapNote) => {
    await updateNote({ id, ...data });
  };

  const handleDelete = async () => {
    await deleteNote(id);
    setLocation("/");
  };

  return (
    <LayoutShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-display">Edit Note</h1>
              <p className="text-muted-foreground text-sm">
                Session with {note.clientName}
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the SOAP note for 
                  <span className="font-semibold text-foreground"> {note.clientName}</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <SoapEditor 
          initialData={note} 
          onSubmit={handleSubmit} 
          isSubmitting={isPending} 
        />
      </div>
    </LayoutShell>
  );
}
