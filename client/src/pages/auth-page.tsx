import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ShieldCheck, Zap } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-muted rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent/20"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-lg text-primary-foreground">
          <div className="mb-8 p-4 bg-white/10 backdrop-blur-sm rounded-2xl w-fit">
            <Activity className="h-12 w-12" />
          </div>
          <h1 className="text-5xl font-display font-bold mb-6 leading-tight">
            Streamlined Clinical Documentation
          </h1>
          <p className="text-lg text-primary-foreground/80 mb-8 font-light">
            Secure, efficient, and intelligent SOAP notes designed for modern mental health professionals. Spend less time typing and more time with clients.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-medium">HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5" />
              <span className="font-medium">Voice Dictation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardHeader className="text-center pb-8">
            <div className="lg:hidden mx-auto mb-4 p-3 bg-primary/10 rounded-xl w-fit text-primary">
              <Activity className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl font-display font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-base mt-2">
              Sign in to access your practice dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              size="lg" 
              className="w-full h-12 text-base font-semibold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
              onClick={() => window.location.href = "/api/login"}
            >
              Log In to Continue
            </Button>
            
            <p className="text-center text-xs text-muted-foreground mt-8">
              By continuing, you agree to our Terms of Service and Privacy Policy.
              This system is for authorized clinical use only.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
