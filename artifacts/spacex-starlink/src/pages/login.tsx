import React, { useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Satellite, Lock, Mail, User, AlertCircle, CheckCircle2 } from "lucide-react";

type Mode = "login" | "register";

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const [, navigate] = useLocation();

  const urlParams = new URLSearchParams(window.location.search);
  const redirect = urlParams.get("redirect") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        navigate(redirect);
      } else {
        if (name.trim().length < 2) { setError("Please enter your full name"); setLoading(false); return; }
        await register(name, email, password);
        setSuccess("Account created! Redirecting…");
        setTimeout(() => navigate(redirect), 800);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => { setMode(m => m === "login" ? "register" : "login"); setError(""); setSuccess(""); };

  return (
    <MainLayout>
      <div className="relative min-h-[calc(100vh-56px)] flex items-center justify-center bg-black overflow-hidden">
        <Starfield count={200} className="opacity-25" />
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />

        <div className="relative z-10 w-full max-w-md px-6 py-12">
          {/* Logo mark */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-primary/30 bg-primary/5 mb-5">
              <Satellite className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-1">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-sm text-gray-500">
              {mode === "login" ? "Sign in to manage your Starlink subscription" : "Join Starlink and connect to the future"}
            </p>
          </div>

          {/* Card */}
          <div className="border border-white/10 rounded-2xl bg-white/3 backdrop-blur-sm p-8">
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 mb-6 text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "register" && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="John Adeyemi"
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-lg pl-11 pr-12 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-xs font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 mt-2 shadow-[0_0_30px_rgba(0,212,255,0.2)]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    {mode === "login" ? "Signing In…" : "Creating Account…"}
                  </span>
                ) : mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/8 text-center">
              <p className="text-sm text-gray-500">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button onClick={toggle} className="text-primary font-bold hover:underline">
                  {mode === "login" ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {["256-bit SSL", "No contracts", "Cancel anytime"].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
