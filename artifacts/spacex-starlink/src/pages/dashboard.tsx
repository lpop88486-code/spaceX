import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  User, Wifi, CreditCard, Clock, CheckCircle2, XCircle,
  AlertCircle, Settings, ChevronRight, Globe,
  Zap, Shield, Signal, BarChart3, Calendar, MapPin,
  Coins, ArrowUpRight, ArrowDownLeft, ArrowLeftRight,
  RefreshCw, Ban, LogOut, Lock
} from "lucide-react";
import { format } from "date-fns";

interface Subscription {
  id: number;
  email: string;
  name: string;
  planId: number;
  planName: string;
  planCategory: string;
  planSpeed: string;
  priceMonthly: number;
  features: string[];
  status: string;
  address?: string;
  createdAt: string;
  cancelledAt?: string;
}

interface WalletData {
  id: number;
  email: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: number;
  walletId: number;
  type: "credit" | "debit" | "transfer_in" | "transfer_out";
  amount: number;
  description: string;
  reference: string | null;
  status: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1">
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
      Active
    </span>
  );
  if (status === "cancelled") return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-3 py-1">
      <XCircle className="w-3 h-3" />
      Cancelled
    </span>
  );
  if (status === "past_due") return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20 rounded-full px-3 py-1">
      <AlertCircle className="w-3 h-3" />
      Past Due
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1">
      <Clock className="w-3 h-3" />
      {status}
    </span>
  );
}

function TxIcon({ type }: { type: Transaction["type"] }) {
  if (type === "credit" || type === "transfer_in") return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
  if (type === "transfer_out") return <ArrowLeftRight className="w-4 h-4 text-yellow-400" />;
  return <ArrowUpRight className="w-4 h-4 text-red-400" />;
}

export default function Dashboard() {
  const { user, token, logout, updateProfile } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "billing" | "wallet" | "settings">("overview");

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Profile form
  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? "");
  const [profileAddress, setProfileAddress] = useState(user?.address ?? "");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  useEffect(() => {
    setProfileName(user?.name ?? "");
    setProfilePhone(user?.phone ?? "");
    setProfileAddress(user?.address ?? "");
  }, [user]);

  const fetchSubscriptions = useCallback(async () => {
    if (!user) return;
    setLoadingSubs(true);
    try {
      const res = await fetch(`/api/subscriptions?email=${encodeURIComponent(user.email)}&limit=50`);
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch {}
    setLoadingSubs(false);
  }, [user]);

  const fetchWallet = useCallback(async () => {
    if (!user) return;
    setLoadingWallet(true);
    try {
      const [wRes, tRes] = await Promise.all([
        fetch(`/api/wallet/${encodeURIComponent(user.email)}`),
        fetch(`/api/wallet/${encodeURIComponent(user.email)}/transactions?limit=30`),
      ]);
      if (wRes.ok) setWallet(await wRes.json());
      if (tRes.ok) {
        const td = await tRes.json();
        setTransactions(td.transactions || []);
      }
    } catch {}
    setLoadingWallet(false);
  }, [user]);

  useEffect(() => {
    fetchSubscriptions();
    fetchWallet();
  }, [fetchSubscriptions, fetchWallet]);

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center bg-black">
          <div className="text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Sign In Required</h2>
            <p className="text-gray-500 mb-6">Please sign in to view your dashboard.</p>
            <Link href="/login?redirect=/dashboard">
              <Button className="bg-primary text-black font-black uppercase tracking-widest px-8">Sign In</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const activeSub = subscriptions.find(s => s.status === "active");
  const memberSince = user.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "—";

  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this subscription?")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) fetchSubscriptions();
    } catch {}
    setCancellingId(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");
    try {
      const payload: any = { name: profileName, phone: profilePhone, address: profileAddress };
      if (newPass && currentPass) { payload.password = currentPass; payload.newPassword = newPass; }
      await updateProfile(payload);
      setProfileMsg("Profile updated successfully.");
      setCurrentPass(""); setNewPass("");
    } catch (err: any) {
      setProfileMsg(err.message || "Update failed.");
    }
    setProfileSaving(false);
  };

  const totalPaid = subscriptions
    .filter(s => s.status === "active" || s.status === "cancelled")
    .reduce((acc, s) => acc + s.priceMonthly, 0);

  return (
    <MainLayout>
      {/* Hero */}
      <div className="relative bg-black border-b border-white/8 overflow-hidden" style={{ minHeight: 220 }}>
        <Starfield count={100} className="opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/4 to-transparent" />
        <div className="container mx-auto px-6 pt-14 pb-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-bold mb-2">My Account</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase leading-none mb-2">
                {user.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {activeSub ? <StatusBadge status="active" /> : <StatusBadge status="no plan" />}
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-primary" />
                  {user.address || "Location not set"}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-primary" />
                  Member since {memberSince}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/plans">
                <Button className="h-10 px-6 text-xs font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90">
                  {activeSub ? "Upgrade Plan" : "Get a Plan"}
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={logout}
                className="h-10 px-4 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white border border-white/10"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#050505] border-b border-white/8 sticky top-14 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-0 overflow-x-auto">
            {(["overview", "billing", "wallet", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? "text-primary border-primary"
                    : "text-gray-500 hover:text-gray-300 border-transparent"
                }`}
              >
                {tab === "wallet" ? (
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-3 h-3" />
                    Wallet {wallet ? `(${wallet.balance})` : ""}
                  </span>
                ) : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-black min-h-screen py-10">
        <div className="container mx-auto px-6 max-w-6xl">

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {loadingSubs ? (
                <div className="flex items-center gap-3 text-gray-500 py-10">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  Loading your subscription data…
                </div>
              ) : (
                <>
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: Wifi, label: "Current Plan", value: activeSub?.planName || "None", sub: activeSub?.planCategory || "No active plan", color: "text-primary" },
                      { icon: Signal, label: "Speed", value: activeSub?.planSpeed || "—", sub: "download", color: "text-cyan-400" },
                      { icon: Zap, label: "Subscriptions", value: subscriptions.length, sub: `${subscriptions.filter(s => s.status === "active").length} active`, color: "text-emerald-400" },
                      { icon: Coins, label: "Token Balance", value: wallet?.balance ?? "—", sub: "orbit tokens", color: "text-orange-400" },
                    ].map((card) => (
                      <div key={card.label} className="border border-white/8 rounded-xl p-5 bg-white/2">
                        <card.icon className={`w-5 h-5 ${card.color} mb-3`} />
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">{card.label}</p>
                        <p className="text-2xl font-black text-white tracking-tight">{card.value}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5 capitalize">{card.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Active plan */}
                  {activeSub ? (
                    <div className="border border-primary/20 rounded-xl bg-gradient-to-br from-primary/5 to-transparent p-7">
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Active Subscription</p>
                          <h2 className="text-2xl font-black text-white tracking-tight uppercase">{activeSub.planName}</h2>
                        </div>
                        <StatusBadge status={activeSub.status} />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                          { label: "Monthly Rate", value: `$${activeSub.priceMonthly}` },
                          { label: "Category", value: activeSub.planCategory },
                          { label: "Speed", value: activeSub.planSpeed },
                          { label: "Address", value: activeSub.address || "Not provided" },
                        ].map((row) => (
                          <div key={row.label}>
                            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">{row.label}</p>
                            <p className="text-sm text-white font-bold mt-0.5 truncate">{row.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <Link href="/plans">
                          <Button className="h-9 px-5 text-xs font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90">Change Plan</Button>
                        </Link>
                        <Button
                          variant="ghost"
                          onClick={() => handleCancel(activeSub.id)}
                          disabled={cancellingId === activeSub.id}
                          className="h-9 px-5 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 border border-red-500/20 hover:bg-red-500/10"
                        >
                          <Ban className="w-3 h-3 mr-1.5" />
                          {cancellingId === activeSub.id ? "Cancelling…" : "Cancel"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-white/8 rounded-xl bg-white/2 p-10 text-center">
                      <Wifi className="w-10 h-10 text-gray-700 mx-auto mb-4" />
                      <p className="text-lg font-black text-white uppercase tracking-tight mb-2">No Active Subscription</p>
                      <p className="text-sm text-gray-500 mb-6">Choose a plan to get started with high-speed satellite internet.</p>
                      <Link href="/plans">
                        <Button className="bg-primary text-black font-black uppercase tracking-widest px-8">Browse Plans</Button>
                      </Link>
                    </div>
                  )}

                  {/* Features list */}
                  {activeSub && activeSub.features.length > 0 && (
                    <div className="border border-white/8 rounded-xl bg-white/2 p-7">
                      <div className="flex items-center gap-3 mb-5">
                        <Shield className="w-4 h-4 text-primary" />
                        <p className="text-xs font-black uppercase tracking-widest text-white">Plan Features</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeSub.features.map((f) => (
                          <div key={f} className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-sm text-gray-300">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── BILLING ── */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Active Plan Cost", value: activeSub ? `$${activeSub.priceMonthly}/mo` : "No active plan", sub: activeSub?.planName || "—", icon: CreditCard, color: "text-primary" },
                  { label: "Total Subscriptions", value: subscriptions.length, sub: `${subscriptions.filter(s => s.status === "active").length} active`, icon: BarChart3, color: "text-emerald-400" },
                  { label: "Token Balance", value: `${wallet?.balance ?? 0} tokens`, sub: `≈ $${wallet?.balance ?? 0} USD`, icon: Coins, color: "text-orange-400" },
                ].map((card) => (
                  <div key={card.label} className="border border-white/8 rounded-xl bg-white/2 p-6">
                    <card.icon className={`w-5 h-5 ${card.color} mb-3`} />
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">{card.label}</p>
                    <p className="text-2xl font-black text-white">{card.value}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Subscription history */}
              <div className="border border-white/8 rounded-xl overflow-hidden">
                <div className="bg-white/3 border-b border-white/8 px-6 py-4 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-white">Subscription History</p>
                  <span className="text-[10px] text-gray-500">{subscriptions.length} records</span>
                </div>
                {loadingSubs ? (
                  <div className="px-6 py-8 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Loading…
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500 text-sm">No subscription records yet.</div>
                ) : (
                  subscriptions.map((sub, i) => (
                    <div key={sub.id} className={`flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-colors ${i < subscriptions.length - 1 ? "border-b border-white/5" : ""}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${sub.status === "active" ? "bg-emerald-400" : sub.status === "cancelled" ? "bg-red-400" : "bg-yellow-400"}`} />
                        <div>
                          <p className="text-sm text-white font-bold">{sub.planName}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{format(new Date(sub.createdAt), "MMM d, yyyy")} · #{sub.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-white">${sub.priceMonthly}/mo</span>
                        <StatusBadge status={sub.status} />
                        {sub.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(sub.id)}
                            disabled={cancellingId === sub.id}
                            className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 border border-red-500/20"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            {cancellingId === sub.id ? "…" : "Cancel"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── WALLET ── */}
          {activeTab === "wallet" && (
            <div className="space-y-6">
              {/* Balance card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative border border-primary/20 rounded-xl bg-gradient-to-br from-primary/5 to-transparent p-8 overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl rounded-full" />
                  {loadingWallet && <RefreshCw className="absolute top-4 right-4 w-4 h-4 text-primary animate-spin" />}
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Token Balance</p>
                  <div className="flex items-end gap-3 mb-1">
                    <span className="text-6xl font-black text-white tracking-tighter tabular-nums">
                      {wallet ? wallet.balance.toLocaleString() : "—"}
                    </span>
                    <span className="text-primary text-xl font-black mb-2">TOKENS</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-5">≈ ${wallet?.balance ?? 0} USD value · 1 Token = $1</p>
                  <div className="flex gap-3">
                    <Link href="/wallet">
                      <Button className="h-9 px-5 text-xs font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90">
                        <Coins className="w-3.5 h-3.5 mr-1.5" />
                        Top Up Tokens
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={fetchWallet}
                      className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white border border-white/10"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="border border-white/8 rounded-xl bg-white/2 p-6 flex flex-col justify-center">
                  <Globe className="w-5 h-5 text-cyan-400 mb-3" />
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Wallet Email</p>
                  <p className="text-sm font-bold text-white break-all">{user.email}</p>
                  <p className="text-[10px] text-gray-600 mt-1">Tokens tied to your account email</p>
                </div>
              </div>

              {/* Transaction history */}
              <div className="border border-white/8 rounded-xl overflow-hidden">
                <div className="bg-white/3 border-b border-white/8 px-6 py-4 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-white">Transaction Ledger</p>
                  <span className="text-[10px] text-gray-500">{transactions.length} records</span>
                </div>
                {loadingWallet ? (
                  <div className="px-6 py-8 text-center text-gray-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Loading…
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="px-6 py-10 text-center text-gray-500 text-sm">
                    No transactions yet.{" "}
                    <Link href="/wallet" className="text-primary font-bold hover:underline">Top up tokens</Link>{" "}
                    to get started.
                  </div>
                ) : (
                  transactions.map((tx, i) => (
                    <div key={tx.id} className={`flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-colors ${i < transactions.length - 1 ? "border-b border-white/5" : ""}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                          <TxIcon type={tx.type} />
                        </div>
                        <div>
                          <p className="text-sm text-white font-bold">{tx.description}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {format(new Date(tx.createdAt), "MMM d, yyyy · HH:mm")}
                            {tx.reference && ` · ${tx.reference}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className={`text-base font-black ${tx.type === "credit" || tx.type === "transfer_in" ? "text-emerald-400" : "text-red-400"}`}>
                          {tx.type === "credit" || tx.type === "transfer_in" ? "+" : "−"}{tx.amount}
                        </span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase">TKN</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5 ${tx.status === "completed" ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20" : "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20"}`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === "settings" && (
            <div className="space-y-5 max-w-2xl">
              <form onSubmit={handleSaveProfile}>
                <div className="border border-white/8 rounded-xl bg-white/2 p-7 mb-5">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-4 h-4 text-primary" />
                    <p className="text-xs font-black uppercase tracking-widest text-white">Account Information</p>
                  </div>
                  {profileMsg && (
                    <div className={`text-sm px-4 py-3 rounded-lg border mb-4 ${profileMsg.includes("success") ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-red-400 bg-red-400/10 border-red-400/20"}`}>
                      {profileMsg}
                    </div>
                  )}
                  <div className="space-y-4">
                    {[
                      { label: "Full Name", value: profileName, setter: setProfileName, type: "text" },
                      { label: "Email Address", value: user.email, setter: () => {}, type: "email", disabled: true },
                      { label: "Phone Number", value: profilePhone, setter: setProfilePhone, type: "tel" },
                      { label: "Address", value: profileAddress, setter: setProfileAddress, type: "text" },
                    ].map((field) => (
                      <div key={field.label}>
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1.5">{field.label}</label>
                        <input
                          type={field.type}
                          value={field.value}
                          onChange={e => !field.disabled && field.setter(e.target.value)}
                          disabled={field.disabled}
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white text-sm focus:outline-none focus:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-white/8 rounded-xl bg-white/2 p-7 mb-5">
                  <div className="flex items-center gap-3 mb-6">
                    <Lock className="w-4 h-4 text-primary" />
                    <p className="text-xs font-black uppercase tracking-widest text-white">Change Password</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1.5">Current Password</label>
                      <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="Leave blank to keep unchanged"
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white text-sm focus:outline-none focus:border-primary/40" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1.5">New Password</label>
                      <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} minLength={6} placeholder="At least 6 characters"
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white text-sm focus:outline-none focus:border-primary/40" />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={profileSaving}
                  className="h-10 px-7 text-xs font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90">
                  {profileSaving ? "Saving…" : "Save Changes"}
                </Button>
              </form>

              <div className="border border-red-500/20 rounded-xl bg-red-500/3 p-7">
                <p className="text-xs font-black uppercase tracking-widest text-red-400 mb-2">Sign Out</p>
                <p className="text-xs text-gray-500 mb-4">Sign out of your account on this device.</p>
                <Button variant="ghost" onClick={() => { logout(); navigate("/"); }}
                  className="h-9 px-5 text-xs font-black uppercase tracking-widest text-red-400 border border-red-500/30 hover:bg-red-500/10">
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
}
