import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAdminLogin } from "@workspace/api-client-react";
import { setAdminToken } from "@/lib/auth";
import { Satellite, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const loginMutation = useAdminLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { password } },
      {
        onSuccess: (data) => {
          if (data.success && data.token) {
            setAdminToken(data.token);
            setLocation("/admin/dashboard");
            toast({
              title: "Access Granted",
              description: "Welcome to Mission Control.",
            });
          }
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Invalid credentials.",
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative dark p-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwaHoiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMCAwdjQwTTAgMGg0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none" />
      
      <Card className="w-full max-w-md bg-background/80 backdrop-blur-xl border-border shadow-2xl relative z-10">
        <CardHeader className="text-center pt-10 pb-8 border-b border-border/50">
          <div className="mx-auto w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-6">
            <Satellite className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold uppercase tracking-widest text-white">Mission Control</CardTitle>
          <CardDescription className="uppercase tracking-widest text-xs mt-2 font-medium">Authorized Personnel Only</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter passcode (admin123)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 bg-card border-border uppercase tracking-widest text-sm font-mono placeholder:normal-case placeholder:tracking-normal"
                  data-testid="input-admin-password"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 uppercase tracking-widest font-bold" 
              disabled={loginMutation.isPending || !password}
              data-testid="button-admin-login"
            >
              {loginMutation.isPending ? "Authenticating..." : "Initialize Session"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
