import React, { useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";
import { useListPlans } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, ShieldCheck, Zap, Globe, Lock, ChevronRight } from "lucide-react";

const CATEGORIES = [
  { key: "residential", label: "Residential", sub: "Homes & Apartments" },
  { key: "roam", label: "Roam & Maritime", sub: "On the Move" },
  { key: "business", label: "Business", sub: "Commercial & Enterprise" },
];

const PAYMENT_GATEWAYS = [
  {
    id: "stripe",
    name: "Stripe",
    tagline: "Recommended · Global Cards",
    desc: "Pay with any major debit or credit card, Apple Pay, Google Pay, or bank transfer. Powered by Stripe — trusted by millions worldwide.",
    gradient: "from-[#6772e5]/15 to-transparent",
    border: "border-[#6772e5]/40",
    activeBorder: "border-[#6772e5]",
    badge: "bg-[#6772e5]",
    methods: ["VISA", "MC", "AMEX", "Apple Pay", "Google Pay", "Bank"],
    security: "PCI DSS Level 1",
    logo: (
      <svg width="52" height="22" viewBox="0 0 52 22" fill="none">
        <text x="0" y="17" fontFamily="sans-serif" fontWeight="900" fontSize="18" fill="#6772e5" letterSpacing="-1">stripe</text>
      </svg>
    ),
  },
  {
    id: "paystack",
    name: "Paystack",
    tagline: "Africa & Global",
    desc: "Pay via card, bank transfer, USSD, mobile money, or QR code. Ideal for Nigerian Naira, South African Rand, and 50+ other currencies.",
    gradient: "from-[#00c3f7]/10 to-transparent",
    border: "border-[#00c3f7]/30",
    activeBorder: "border-[#00c3f7]",
    badge: "bg-[#00c3f7]",
    methods: ["Card", "Bank Transfer", "USSD", "Mobile Money", "QR", "BNPL"],
    security: "PCI DSS Compliant",
    logo: (
      <svg width="90" height="22" viewBox="0 0 90 22" fill="none">
        <text x="0" y="17" fontFamily="sans-serif" fontWeight="900" fontSize="16" fill="#00c3f7" letterSpacing="-0.5">Paystack</text>
      </svg>
    ),
  },
];

const FAQS = [
  { q: "Is there a contract?", a: "No contracts. Cancel anytime — no fees, no penalties." },
  { q: "What hardware do I need?", a: "A Starlink dish, router, and cables — all included in your hardware kit shipped to your door." },
  { q: "How fast is installation?", a: "Most installs take 15 minutes or less using the app-guided setup process." },
  { q: "Can I use it while travelling?", a: "Yes — Roam and Maritime plans support full in-motion use across land, sea, and air." },
  { q: "Which currencies are supported?", a: "All plans priced in USD. Paystack supports NGN, GHS, ZAR, KES, and 50+ others with automatic conversion." },
  { q: "Can I switch plans?", a: "Yes, upgrade or downgrade anytime. Changes take effect on your next billing cycle." },
];

export default function Plans() {
  const [, setLocation] = useLocation();
  const { data: plans, isLoading } = useListPlans();
  const [activeTab, setActiveTab] = useState("residential");
  const [paymentMethod, setPaymentMethod] = useState("stripe");

  const handleOrder = (planId: number) => {
    setLocation(`/checkout?planId=${planId}&payment=${paymentMethod}`);
  };

  const filteredPlans = (plans || []).filter((p) => p.category === activeTab);
  const activeGateway = PAYMENT_GATEWAYS.find(g => g.id === paymentMethod)!;

  return (
    <MainLayout>
      {/* Hero */}
      <div className="relative flex items-center justify-center bg-black overflow-hidden border-b border-white/8" style={{ minHeight: 280 }}>
        <Starfield count={150} className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/4 to-transparent" />
        <div className="container mx-auto px-6 relative z-10 pt-14 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/4 border border-white/10 rounded-full px-4 py-1.5 mb-5 text-xs font-bold uppercase tracking-widest text-gray-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Available in 100+ Countries · All Prices in USD
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase mb-4 leading-tight">
            Service Plans
          </h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
            Enterprise-grade satellite internet for homes, businesses, vessels, and aircraft.
            No contracts. Cancel anytime.
          </p>
        </div>
      </div>

      {/* ── PAYMENT GATEWAY SELECTOR ─────────────────────────────────────── */}
      <section className="bg-[#030303] border-b border-white/8 py-12">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex items-center gap-3 mb-8">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Choose Your Payment Method</span>
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">256-bit SSL ●</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {PAYMENT_GATEWAYS.map((gw) => (
              <button
                key={gw.id}
                onClick={() => setPaymentMethod(gw.id)}
                className={`relative text-left rounded-xl border-2 p-6 transition-all duration-300 overflow-hidden group ${
                  paymentMethod === gw.id
                    ? `${gw.activeBorder} bg-gradient-to-br ${gw.gradient} shadow-[0_0_40px_rgba(0,0,0,0.4)]`
                    : "border-white/8 bg-white/2 hover:border-white/18 hover:bg-white/4"
                }`}
              >
                {/* Selected indicator */}
                {paymentMethod === gw.id && (
                  <div className={`absolute top-3 right-3 w-5 h-5 rounded-full ${gw.badge} flex items-center justify-center`}>
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}

                {/* Logo */}
                <div className="mb-4 h-7 flex items-center">{gw.logo}</div>

                {/* Name + tag */}
                <div className="mb-2">
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${paymentMethod === gw.id ? "text-gray-300" : "text-gray-600"}`}>
                    {gw.tagline}
                  </p>
                </div>

                {/* Description */}
                <p className="text-gray-500 text-xs leading-relaxed mb-5">{gw.desc}</p>

                {/* Accepted methods */}
                <div className="flex flex-wrap gap-1.5">
                  {gw.methods.map((m) => (
                    <span
                      key={m}
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        paymentMethod === gw.id
                          ? "border-white/15 text-gray-300 bg-white/5"
                          : "border-white/8 text-gray-600 bg-transparent"
                      }`}
                    >
                      {m}
                    </span>
                  ))}
                </div>

                {/* Security */}
                <div className="mt-4 pt-4 border-t border-white/6 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] text-emerald-600 font-bold">{gw.security}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Active gateway confirmation bar */}
          <div className={`flex items-center justify-between rounded-lg border px-5 py-3.5 bg-gradient-to-r ${activeGateway.gradient} ${activeGateway.border}`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${activeGateway.badge}`} />
              <span className="text-xs text-white font-bold">
                Paying via {activeGateway.name}
              </span>
              <span className="text-xs text-gray-500">—</span>
              <span className="text-xs text-gray-400">{activeGateway.methods.join(" · ")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-500 font-bold">Secure Checkout</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="bg-[#050505] border-b border-white/8 sticky top-14 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`relative px-6 py-4 text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === cat.key
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"
                }`}
              >
                <span>{cat.label}</span>
                <span className={`block text-[9px] font-medium tracking-wider mt-0.5 ${activeTab === cat.key ? "text-primary/60" : "text-gray-700"}`}>
                  {cat.sub}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="bg-black min-h-[60vh] py-14">
        {isLoading ? (
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-white/10 rounded-xl p-7 bg-white/2">
                  <Skeleton className="h-5 w-2/3 mb-3 bg-white/8" />
                  <Skeleton className="h-12 w-1/3 mb-4 bg-white/8" />
                  <Skeleton className="h-3 w-full mb-2 bg-white/8" />
                  <Skeleton className="h-3 w-5/6 mb-2 bg-white/8" />
                  <Skeleton className="h-3 w-4/5 bg-white/8" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="container mx-auto px-6 text-center py-24">
            <p className="text-gray-500 text-sm">No plans available in this category.</p>
          </div>
        ) : (
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`group relative flex flex-col rounded-xl border transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular
                      ? "border-primary/40 bg-gradient-to-b from-primary/6 to-transparent shadow-[0_0_40px_rgba(0,212,255,0.08)]"
                      : "border-white/10 bg-white/2 hover:border-white/20"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-5 bg-primary text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                      Most Popular
                    </div>
                  )}

                  <div className="p-7 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">{plan.name}</p>
                        <div className="flex items-end gap-1">
                          <span className="text-5xl font-black text-white tracking-tighter">${plan.priceMonthly}</span>
                          <span className="text-gray-500 text-sm mb-1.5">/mo</span>
                        </div>
                      </div>
                      <div className="text-right mt-1">
                        <span className="text-primary text-xs font-bold block">{plan.speed}</span>
                        <span className="text-gray-600 text-[10px]">USD</span>
                      </div>
                    </div>

                    {plan.hardwarePrice && plan.hardwarePrice > 0 && (
                      <p className="text-gray-600 text-xs mb-3">+ ${plan.hardwarePrice} hardware (one-time)</p>
                    )}

                    <p className="text-gray-400 text-xs leading-relaxed mb-6">{plan.description}</p>

                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-gray-300">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Payment method indicator */}
                    <div className="mt-5 pt-4 border-t border-white/6 flex items-center gap-2 rounded-lg">
                      <div className={`w-1.5 h-1.5 rounded-full ${activeGateway.badge}`} />
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        {paymentMethod === "stripe" ? "Pay with Stripe" : "Pay with Paystack"}
                      </span>
                    </div>
                  </div>

                  <div className="px-7 pb-7">
                    <Button
                      className={`w-full h-12 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                        plan.popular
                          ? "bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(0,212,255,0.2)]"
                          : "bg-white/8 text-white hover:bg-white/15 border border-white/10"
                      }`}
                      onClick={() => handleOrder(plan.id)}
                    >
                      Order Now
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats strip */}
      <section className="bg-[#030303] border-t border-white/8 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
            {[
              { stat: "99.9%", label: "Uptime SLA" },
              { stat: "24/7", label: "Support" },
              { stat: "No", label: "Contracts" },
              { stat: "Free", label: "Shipping" },
            ].map((s) => (
              <div key={s.label} className="border border-white/8 rounded-xl p-6 text-center bg-white/2">
                <p className="text-3xl font-black text-primary tracking-tighter mb-1">{s.stat}</p>
                <p className="text-xs uppercase tracking-widest text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-black border-t border-white/8 py-16">
        <div className="container mx-auto px-6">
          <div className="w-8 h-0.5 bg-primary mb-6" />
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-10">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl">
            {FAQS.map((faq) => (
              <div key={faq.q} className="border border-white/8 rounded-xl p-6 bg-white/2 hover:border-white/15 transition-colors">
                <p className="text-white text-sm font-bold mb-2">{faq.q}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
