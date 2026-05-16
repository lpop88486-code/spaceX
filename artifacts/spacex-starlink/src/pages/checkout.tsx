import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useGetPlan } from "@workspace/api-client-react";
import { getGetPlanQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  AlertCircle, ShieldCheck, Coins, CheckCircle2, Lock,
  ArrowRight, RefreshCw, Zap
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const checkoutSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Please provide your shipping address"),
});

export default function Checkout() {
  const urlParams = new URLSearchParams(window.location.search);
  const planIdParam = urlParams.get("planId");
  const planId = planIdParam ? parseInt(planIdParam, 10) : 0;

  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: plan, isLoading: isLoadingPlan } = useGetPlan(planId, {
    query: { enabled: !!planId, queryKey: getGetPlanQueryKey(planId) }
  });

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: "", email: "", address: "" },
  });

  useEffect(() => {
    if (user) {
      form.setValue("name", user.name);
      form.setValue("email", user.email);
      if (user.address) form.setValue("address", user.address);
    }
  }, [user, form]);

  const fetchWallet = useCallback(async (email: string) => {
    if (!email || !email.includes("@")) return;
    setWalletLoading(true);
    try {
      const res = await fetch(`/api/wallet/${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance);
      }
    } catch {}
    setWalletLoading(false);
  }, []);

  const emailValue = form.watch("email");
  useEffect(() => {
    if (emailValue && emailValue.includes("@")) fetchWallet(emailValue);
  }, [emailValue, fetchWallet]);

  const priceTokens = plan ? Math.ceil(plan.priceMonthly) : 0;
  const hasSufficientTokens = walletBalance !== null && walletBalance >= priceTokens;

  const onSubmit = async (data: z.infer<typeof checkoutSchema>) => {
    if (!plan) return;
    setError("");
    setPaying(true);
    try {
      const res = await fetch("/api/checkout/wallet-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          email: data.email,
          name: data.name,
          address: data.address,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setError(`You need ${json.required} tokens but only have ${json.available}. Please top up your wallet first.`);
        } else {
          setError(json.error || "Payment failed. Please try again.");
        }
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/dashboard"), 2500);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setPaying(false);
  };

  if (!planId) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Alert variant="destructive" className="max-w-md mx-auto text-left">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Plan Selected</AlertTitle>
            <AlertDescription>Please go back and select a plan first.</AlertDescription>
          </Alert>
          <Button className="mt-8 uppercase tracking-widest font-bold" onClick={() => navigate("/plans")}>
            View Plans
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (success) {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center bg-black">
          <div className="text-center max-w-md px-6">
            <div className="w-24 h-24 bg-emerald-400/10 border border-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              <div className="absolute inset-0 bg-emerald-400/10 rounded-full animate-ping" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-3">
              Subscription Active!
            </h2>
            <p className="text-gray-400 mb-2">
              <span className="font-black text-white">{priceTokens} tokens</span> were deducted from your wallet.
            </p>
            <p className="text-gray-500 text-sm mb-6">Your {plan?.name} plan is now live.</p>
            <div className="flex items-center justify-center gap-2 text-primary text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Redirecting to your dashboard…
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4 text-xs font-bold uppercase tracking-widest text-primary">
            <Coins className="w-3.5 h-3.5" />
            Token-Powered Checkout
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Complete Your Order</h1>
          <p className="text-muted-foreground">Pay instantly using your Orbit Wallet tokens</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: form */}
          <div className="lg:col-span-7 space-y-5">

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Payment Failed</AlertTitle>
                <AlertDescription>
                  {error}
                  {error.includes("top up") && (
                    <a href="/wallet" className="block mt-2 text-primary font-bold hover:underline">
                      → Top up your wallet now
                    </a>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Wallet status banner */}
            <div className={`rounded-xl border p-5 flex items-center gap-4 ${
              hasSufficientTokens
                ? "border-emerald-500/20 bg-emerald-500/5"
                : walletBalance !== null && walletBalance > 0
                ? "border-orange-500/20 bg-orange-500/5"
                : "border-white/10 bg-white/2"
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                hasSufficientTokens ? "bg-emerald-500/20" : "bg-white/5"
              }`}>
                <Coins className={`w-5 h-5 ${hasSufficientTokens ? "text-emerald-400" : "text-gray-500"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-white">
                    {walletLoading ? "Checking balance…" : "Orbit Wallet Balance"}
                  </p>
                  {walletLoading && <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-2xl font-black tabular-nums ${
                    hasSufficientTokens ? "text-emerald-400" : walletBalance === null ? "text-gray-600" : "text-orange-400"
                  }`}>
                    {walletBalance !== null ? walletBalance.toLocaleString() : "—"}
                  </span>
                  <span className="text-xs text-gray-500 font-bold">TOKENS AVAILABLE</span>
                  {hasSufficientTokens && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-0.5">
                      ✓ Ready
                    </span>
                  )}
                </div>
                {!hasSufficientTokens && walletBalance !== null && priceTokens > 0 && (
                  <p className="text-xs text-orange-400 mt-1">
                    Need {(priceTokens - walletBalance).toLocaleString()} more tokens.{" "}
                    <a href="/wallet" className="font-bold underline hover:text-orange-300">Top up now →</a>
                  </p>
                )}
              </div>
            </div>

            {/* Details form */}
            <Card className="bg-background border-border">
              <CardHeader className="border-b border-border bg-card/50">
                <CardTitle className="text-lg uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Service & Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Adeyemi" className="bg-card h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs font-bold tracking-wider text-muted-foreground">
                          Email Address
                          <span className="text-gray-600 normal-case ml-1">(must match your wallet email)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="bg-card h-12"
                            {...field}
                            onChange={e => {
                              field.onChange(e);
                              if (e.target.value.includes("@")) fetchWallet(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs font-bold tracking-wider text-muted-foreground">Shipping / Installation Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Lagos, Nigeria" className="bg-card h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </form>
                </Form>
              </CardContent>
            </Card>

            {!user && (
              <div className="border border-primary/20 rounded-xl bg-primary/3 p-4 flex items-start gap-3">
                <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white mb-0.5">Sign in for faster checkout</p>
                  <p className="text-[11px] text-gray-500">
                    <a href="/login?redirect=/checkout" className="text-primary hover:underline font-bold">Create an account</a>{" "}
                    to auto-fill your details and wallet balance instantly.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-5">
            <Card className="bg-card/50 border-primary/20 sticky top-24">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg uppercase tracking-wider">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {isLoadingPlan ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : plan ? (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-base uppercase tracking-wide">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{(plan as any).category ?? ""} · {plan.speed}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">${plan.priceMonthly}/mo</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border/50">
                      <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Shipping</p>
                      <p className="text-sm font-bold text-emerald-500">Free</p>
                    </div>

                    {/* Token cost breakdown */}
                    <div className="border border-primary/20 rounded-xl bg-primary/5 p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Coins className="w-4 h-4 text-primary" />
                        <p className="text-xs font-black uppercase tracking-widest text-primary">Token Payment</p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Monthly plan cost</span>
                        <span className="font-bold text-white">{priceTokens} tokens</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Your balance</span>
                        <span className={`font-bold ${hasSufficientTokens ? "text-emerald-400" : walletBalance !== null ? "text-orange-400" : "text-gray-500"}`}>
                          {walletLoading ? "…" : walletBalance !== null ? `${walletBalance.toLocaleString()} tokens` : "Enter email above"}
                        </span>
                      </div>
                      {walletBalance !== null && (
                        <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                          <span className="text-gray-400">After payment</span>
                          <span className="font-bold text-gray-300">
                            {Math.max(0, walletBalance - priceTokens).toLocaleString()} tokens
                          </span>
                        </div>
                      )}
                      {!hasSufficientTokens && walletBalance !== null && (
                        <a
                          href="/wallet"
                          className="flex items-center justify-center gap-2 w-full mt-1 text-xs font-black uppercase tracking-widest text-black bg-primary rounded-lg py-2.5 hover:bg-primary/90 transition-colors"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          Top Up {priceTokens - walletBalance} Tokens
                        </a>
                      )}
                    </div>

                    {/* Features */}
                    {(plan as any).features?.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Included</p>
                        {((plan as any).features as string[]).slice(0, 4).map((f: string) => (
                          <div key={f} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-xs text-gray-400">{f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
              </CardContent>

              <CardFooter className="flex-col pt-2 pb-6 border-t border-border bg-background/50">
                <div className="w-full flex justify-between items-center py-4 mb-3">
                  <div className="uppercase font-bold tracking-wider text-sm">Tokens Required</div>
                  <div className="text-3xl font-black text-white tabular-nums">{priceTokens}</div>
                </div>

                <Button
                  type="submit"
                  form="checkout-form"
                  className="w-full h-14 text-sm font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(0,212,255,0.15)]"
                  disabled={
                    isLoadingPlan ||
                    paying ||
                    (walletBalance !== null && !hasSufficientTokens)
                  }
                >
                  {paying ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing Payment…
                    </span>
                  ) : !hasSufficientTokens && walletBalance !== null ? (
                    <span className="flex items-center gap-2">
                      <Coins className="w-5 h-5" />
                      Insufficient Tokens
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Activate with {priceTokens} Tokens
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-4 mt-4">
                  {["Instant activation", "No card needed", "Cancel anytime"].map(t => (
                    <span key={t} className="flex items-center gap-1 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                      {t}
                    </span>
                  ))}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
