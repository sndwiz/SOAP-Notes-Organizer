import { useCreateSoapNote } from "@/hooks/use-soap-notes";
import { LayoutShell } from "@/components/layout-shell";
import { SoapEditor } from "@/components/soap-editor";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import type { InsertSoapNote } from "@shared/schema";

export default function CreateNote() {
  const { mutateAsync: createNote, isPending } = useCreateSoapNote();
  const [, setLocation] = useLocation();

  const handleSubmit = async (data: InsertSoapNote) => {
    await createNote(data);
    setLocation("/");
  };

  return (
    <LayoutShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display">New Session Note</h1>
            <p className="text-muted-foreground text-sm">Create a new SOAP note record</p>
          </div>
        </div>

        <SoapEditor 
          onSubmit={handleSubmit} 
          isSubmitting={isPending} 
        />
      </div>
    </LayoutShell>
  );
}
