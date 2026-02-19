import { LayoutShell } from "@/components/layout-shell";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, User, Shield, Bell } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <LayoutShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold font-display" data-testid="text-settings-title">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your account and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-border">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {user?.firstName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold" data-testid="text-profile-name">{user?.firstName} {user?.lastName}</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-profile-email">{user?.email}</p>
                <Badge variant="secondary" className="mt-1 text-xs">Therapist</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-primary" /> Practice Info
            </CardTitle>
            <CardDescription>Your default session settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Location</Label>
                <Input defaultValue="Office" data-testid="input-default-location" />
              </div>
              <div className="space-y-2">
                <Label>Default CPT Code</Label>
                <Input defaultValue="90837" data-testid="input-default-cpt" />
              </div>
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input placeholder="e.g. LCSW-12345" data-testid="input-license" />
              </div>
              <div className="space-y-2">
                <Label>NPI Number</Label>
                <Input placeholder="e.g. 1234567890" data-testid="input-npi" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Settings are stored locally and don't sync yet. Full persistence coming soon.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Authentication is managed through Replit. Your session is securely encrypted and HIPAA-aligned.
            </p>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
