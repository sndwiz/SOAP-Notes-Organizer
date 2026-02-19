import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  type InsertSoapNote, 
  insertSoapNoteSchema, 
  PHQ9_QUESTIONS, 
  GAD7_QUESTIONS,
  COMMON_DIAGNOSES,
  CPT_CODES
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Mic, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Stethoscope, 
  Brain, 
  ClipboardCheck, 
  Activity,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface SoapEditorProps {
  initialData?: InsertSoapNote;
  onSubmit: (data: InsertSoapNote) => Promise<any>;
  isSubmitting: boolean;
}

const sectionTips = {
  subjective: [
    "Include direct client quotes",
    "Document symptoms since last session", 
    "Note mood changes",
    "Review homework compliance"
  ],
  objective: [
    "Document observable behaviors",
    "Note mental status (affect, appearance)",
    "List interventions used (CBT, DBT)",
    "Record response to interventions"
  ],
  assessment: [
    "Clinical conceptualization",
    "Link observations to diagnosis",
    "Note progress or regression",
    "Assess risk factors"
  ],
  plan: [
    "Treatment goals for next session",
    "Assign specific homework",
    "Next appointment date/time",
    "Coordination of care if needed"
  ]
};

export function SoapEditor({ initialData, onSubmit, isSubmitting }: SoapEditorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("session");
  const [isRecording, setIsRecording] = useState(false);

  const defaultValues: InsertSoapNote = initialData || {
    clientName: "",
    sessionDate: new Date(),
    location: "Office",
    cptCode: "90837",
    isTelehealth: false,
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    riskSuicidal: "Denied",
    riskHomicidal: "Denied",
    riskSafetyPlan: false,
    riskResources: false,
    phq9Score: 0,
    gad7Score: 0,
    phq9Items: [],
    gad7Items: [],
    diagnoses: []
  };

  const form = useForm<InsertSoapNote>({
    resolver: zodResolver(insertSoapNoteSchema),
    defaultValues
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = form;

  // Simple dictation helper
  const toggleDictation = (field: keyof InsertSoapNote) => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      // Logic to stop would go here if we kept a ref to the recognition instance
      return;
    }

    setIsRecording(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const currentVal = watch(field) as string || "";
      setValue(field, (currentVal + " " + transcript).trim(), { shouldDirty: true });
      setIsRecording(false);
      toast({ title: "Dictation Added", description: "Text appended to field." });
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast({ title: "Error", description: "Dictation failed.", variant: "destructive" });
    };

    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  // Auto-calculate scores
  const phq9Items = watch("phq9Items");
  const gad7Items = watch("gad7Items");

  useEffect(() => {
    if (Array.isArray(phq9Items)) {
      const score = phq9Items.reduce((a, b) => a + b, 0);
      setValue("phq9Score", score);
    }
  }, [phq9Items, setValue]);

  useEffect(() => {
    if (Array.isArray(gad7Items)) {
      const score = gad7Items.reduce((a, b) => a + b, 0);
      setValue("gad7Score", score);
    }
  }, [gad7Items, setValue]);

  const onInvalid = (errors: any) => {
    console.error("Form errors:", errors);
    toast({
      title: "Validation Error",
      description: "Please check the form for missing required fields.",
      variant: "destructive"
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <Card className="sticky top-24 border-border/60 shadow-sm">
            <CardContent className="p-4">
              <nav className="flex flex-col gap-2">
                {[
                  { id: "session", label: "Session Info", icon: User },
                  { id: "subjective", label: "Subjective", icon: User },
                  { id: "objective", label: "Objective", icon: Stethoscope },
                  { id: "assessment", label: "Assessment", icon: Brain },
                  { id: "plan", label: "Plan", icon: ClipboardCheck },
                  { id: "scores", label: "Scores & Risks", icon: Activity },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                      ${activeTab === tab.id 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "text-muted-foreground hover:bg-muted"
                      }
                    `}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-border">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            
            {/* Session Info Tab */}
            <TabsContent value="session" className="mt-0 focus-visible:outline-none">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Session Information</CardTitle>
                  <CardDescription>Basic details about the appointment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client Name *</Label>
                      <Input 
                        id="clientName" 
                        {...register("clientName")} 
                        className={errors.clientName ? "border-destructive focus-visible:ring-destructive" : ""}
                        placeholder="e.g. John Doe" 
                      />
                      {errors.clientName && (
                        <p className="text-xs text-destructive">{errors.clientName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sessionDate">Date *</Label>
                      <Controller
                        control={control}
                        name="sessionDate"
                        render={({ field }) => (
                          <Input 
                            type="datetime-local" 
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            className="block"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cptCode">CPT Code</Label>
                      <Controller
                        control={control}
                        name="cptCode"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value || "90837"}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select CPT Code" />
                            </SelectTrigger>
                            <SelectContent>
                              {CPT_CODES.map(cpt => (
                                <SelectItem key={cpt.code} value={cpt.code}>
                                  <span className="font-mono font-bold mr-2">{cpt.code}</span>
                                  <span className="text-muted-foreground text-xs">{cpt.description}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" {...register("location")} placeholder="Office" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <Controller
                      control={control}
                      name="isTelehealth"
                      render={({ field }) => (
                        <Switch 
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          id="isTelehealth"
                        />
                      )}
                    />
                    <Label htmlFor="isTelehealth" className="flex items-center gap-2 cursor-pointer">
                      Telehealth Session
                      {watch("isTelehealth") && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Remote</span>}
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SOAP Sections */}
            {["subjective", "objective", "assessment", "plan"].map((section) => (
              <TabsContent key={section} value={section} className="mt-0 focus-visible:outline-none">
                <Card className="border-border/60 shadow-sm relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    section === 'subjective' ? 'bg-blue-500' :
                    section === 'objective' ? 'bg-green-500' :
                    section === 'assessment' ? 'bg-orange-500' :
                    'bg-purple-500'
                  }`} />
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="capitalize">{section}</CardTitle>
                      <CardDescription>
                        {section === 'subjective' && "Client's self-reported experiences, symptoms, mood."}
                        {section === 'objective' && "Clinical observations, mental status, interventions used."}
                        {section === 'assessment' && "Clinical conceptualization, diagnosis support, progress."}
                        {section === 'plan' && "Treatment goals, homework, next session plan."}
                      </CardDescription>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleDictation(section as keyof InsertSoapNote)}
                      className={isRecording ? "text-destructive animate-pulse" : "text-muted-foreground"}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      {isRecording ? "Recording..." : "Dictate"}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg border border-border/50 text-sm">
                      <p className="font-medium mb-2 text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" /> Tips for this section:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {sectionTips[section as keyof typeof sectionTips].map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                    <Textarea 
                      {...register(section as any)} 
                      className="min-h-[300px] font-mono text-sm leading-relaxed resize-y p-4"
                      placeholder={`Enter ${section} notes here...`}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            ))}

            {/* Scores & Risks Tab */}
            <TabsContent value="scores" className="mt-0 focus-visible:outline-none space-y-6">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Suicidal Ideation</Label>
                      <Controller
                        control={control}
                        name="riskSuicidal"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value || "Denied"}>
                            <SelectTrigger className={field.value !== "Denied" ? "border-destructive text-destructive" : ""}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Denied">Denied</SelectItem>
                              <SelectItem value="Passive">Passive</SelectItem>
                              <SelectItem value="Active">Active</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Homicidal Ideation</Label>
                      <Controller
                        control={control}
                        name="riskHomicidal"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value || "Denied"}>
                            <SelectTrigger className={field.value !== "Denied" ? "border-destructive text-destructive" : ""}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Denied">Denied</SelectItem>
                              <SelectItem value="Passive">Passive</SelectItem>
                              <SelectItem value="Active">Active</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                      <Controller
                        control={control}
                        name="riskSafetyPlan"
                        render={({ field }) => (
                          <Switch 
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            id="riskSafetyPlan"
                          />
                        )}
                      />
                      <Label htmlFor="riskSafetyPlan">Safety Plan Reviewed</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                      <Controller
                        control={control}
                        name="riskResources"
                        render={({ field }) => (
                          <Switch 
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            id="riskResources"
                          />
                        )}
                      />
                      <Label htmlFor="riskResources">Crisis Resources Provided</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border/60 shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>PHQ-9 (Depression)</CardTitle>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        (watch("phq9Score") || 0) > 10 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      }`}>
                        Score: {watch("phq9Score") || 0}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {PHQ9_QUESTIONS.map((q, idx) => (
                      <div key={idx} className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{idx + 1}. {q}</p>
                        <Controller
                          control={control}
                          name={`phq9Items.${idx}`}
                          render={({ field }) => (
                            <RadioGroup 
                              onValueChange={(val) => field.onChange(parseInt(val))} 
                              value={field.value?.toString() || "0"}
                              className="flex gap-4"
                            >
                              {[0, 1, 2, 3].map((val) => (
                                <div key={val} className="flex items-center space-x-1">
                                  <RadioGroupItem value={val.toString()} id={`phq9-${idx}-${val}`} />
                                  <Label htmlFor={`phq9-${idx}-${val}`} className="text-xs text-muted-foreground font-normal">
                                    {val}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          )}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>GAD-7 (Anxiety)</CardTitle>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        (watch("gad7Score") || 0) > 10 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      }`}>
                        Score: {watch("gad7Score") || 0}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {GAD7_QUESTIONS.map((q, idx) => (
                      <div key={idx} className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{idx + 1}. {q}</p>
                        <Controller
                          control={control}
                          name={`gad7Items.${idx}`}
                          render={({ field }) => (
                            <RadioGroup 
                              onValueChange={(val) => field.onChange(parseInt(val))} 
                              value={field.value?.toString() || "0"}
                              className="flex gap-4"
                            >
                              {[0, 1, 2, 3].map((val) => (
                                <div key={val} className="flex items-center space-x-1">
                                  <RadioGroupItem value={val.toString()} id={`gad7-${idx}-${val}`} />
                                  <Label htmlFor={`gad7-${idx}-${val}`} className="text-xs text-muted-foreground font-normal">
                                    {val}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          )}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </form>
  );
}
