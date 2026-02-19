import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, ShieldCheck, Stethoscope, User, ArrowRight, Zap, Lock } from "lucide-react";

export default function Landing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-10">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground" data-testid="text-landing-title">
              SOAP Notes
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto" data-testid="text-landing-subtitle">
              Secure clinical practice management for mental health professionals and their clients.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              className="group cursor-pointer hover-elevate transition-all"
              onClick={() => setLocation("/provider/login")}
              data-testid="card-provider-login"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-md bg-primary/10">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold text-foreground" data-testid="text-provider-heading">
                    I'm a Therapist
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Access your practice dashboard, SOAP notes, client records, billing, and more.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    HIPAA Compliant
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="h-3.5 w-3.5" />
                    AI Assisted
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer hover-elevate transition-all"
              onClick={() => setLocation("/portal/login")}
              data-testid="card-client-login"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-md bg-accent/10">
                    <User className="h-6 w-6 text-accent" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold text-foreground" data-testid="text-client-heading">
                    I'm a Client
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    View shared documents, complete intake forms, and message your therapist securely.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" />
                    Secure Portal
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-xs text-muted-foreground" data-testid="text-landing-disclaimer">
            This system is for authorized clinical use only. By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
