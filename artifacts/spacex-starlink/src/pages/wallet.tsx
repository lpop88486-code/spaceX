import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Starfield } from "@/components/Starfield";
import { useAuth } from "@/contexts/AuthContext";
import {
  Coins, ArrowUpRight, ArrowDownLeft, ArrowLeftRight,
  ShieldCheck, Zap, Globe, RefreshCw, CheckCircle2, Clock, XCircle, Lock, Send
} from "lucide-react";
import { format } from "date-fns";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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
  status: "completed" | "pending" | "failed";
  createdAt: string;
}

const BUNDLES = [
  { tokens: 100, price: 100, label: "Starter", tag: null, perToken: "$1.00" },
  { tokens: 500, price: 475, label: "Growth", tag: "SAVE 5%", perToken: "$0.95" },
  { tokens: 1000, price: 900, label: "Enterprise", tag: "BEST VALUE", perToken: "$0.90" },
  { tokens: 2500, price: 2000, label: "Ultimate", tag: "SAVE 20%", perToken: "$0.80" },
];

function StatusIcon({ status }: { status: Transaction["status"] }) {
  if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === "pending") return <Clock className="w-4 h-4 text-yellow-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

function TypeIcon({ type }: { type: Transaction["type"] }) {
  if (type === "credit" || type === "transfer_in") return <ArrowDownLeft className="w-4 h-4 text-emerald-400 shrink-0" />;
  if (type === "transfer_out") return <ArrowLeftRight className="w-4 h-4 text-yellow-400 shrink-0" />;
  return <ArrowUpRight className="w-4 h-4 text-red-400 shrink-0" />;
}

function showToastGlobal(msg: string, type: "success" | "error" = "success") {}

export default function Wallet() {
  const { user } = useAuth();

  const [email, setEmail] = useState(user?.email ?? "");
  const [emailSet, setEmailSet] = useState(!!user?.email);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fetching, setFetching] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auto-fill from auth
  useEffect(() => {
    if (user?.email && !emailSet) {
      setEmail(user.email);
      setEmailSet(true);
    }
  }, [user]);

  const fetchWallet = useCallback(async (emailAddr: string) => {
    setFetching(true);
    try {
      const [wRes, tRes] = await Promise.all([
        fetch(`${API_BASE}/api/wallet/${encodeURIComponent(emailAddr)}`),
        fetch(`${API_BASE}/api/wallet/${encodeURIComponent(emailAddr)}/transactions?limit=30`),
      ]);
      if (wRes.ok) setWallet(await wRes.json());
      if (tRes.ok) {
        const data = await tRes.json();
        setTransactions(data.transactions || []);
      }
    } catch {
      showToast("Failed to load wallet data", "error");
    }
    setFetching(false);
  }, []);

  // Load on mount if email is set
  useEffect(() => {
    if (emailSet && email) fetchWallet(email);
  }, [emailSet, email, fetchWallet]);

  const verifyPayment = useCallback(async (ref: string) => {
    if (!email) return;
    setVerifying(true);
    try {
      const res = await fetch(`${API_BASE}/api/paystack-verify?ref=${ref}`);
      const data = await res.json();
      if (data.verified && data.tokens) {
        const creditRes = await fetch(`${API_BASE}/api/wallet/credit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            amount: data.tokens,
            description: `Token top-up via Paystack — ${data.tokens} tokens`,
            reference: ref,
            metadata: { source: "paystack", amount_usd: data.amount },
          }),
        });
        if (creditRes.ok) {
          const result = await creditRes.json();
          setWallet(result.wallet);
          showToast(`${data.tokens} tokens added to your wallet!`);
          await fetchWallet(email);
        }
        window.history.replaceState({}, "", "/wallet");
      }
    } catch {}
    setVerifying(false);
  }, [email, fetchWallet]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || params.get("trxref");
    if (ref && emailSet && email) verifyPayment(ref);
  }, [emailSet]);

  const handleSetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("orbit_email", email);
    setEmailSet(true);
    await fetchWallet(email);
    showToast("Wallet activated for " + email);
  };

  const handleBuy = async () => {
    if (!emailSet || selected === null || !wallet) return;
    const bundle = BUNDLES[selected];
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/paystack-init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount: bundle.price * 100,
          tokens: bundle.tokens,
          label: bundle.label,
          callbackUrl: `${window.location.origin}/wallet`,
        }),
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        showToast(data.error || "Payment initiation failed", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    }
    setLoading(false);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !transferTo || !transferAmount) return;
    const amt = parseInt(transferAmount);
    if (isNaN(amt) || amt <= 0) { showToast("Invalid amount", "error"); return; }
    setTransferring(true);
    try {
      const res = await fetch(`${API_BASE}/api/wallet/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromEmail: email, toEmail: transferTo, amount: amt }),
      });
      const data = await res.json();
      if (res.ok) {
        setWallet(data.from);
        setTransferTo(""); setTransferAmount(""); setShowTransfer(false);
        await fetchWallet(email);
        showToast(`${amt} tokens transferred to ${transferTo}`);
      } else {
        showToast(data.error || "Transfer failed", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    }
    setTransferring(false);
  };

  return (
    <MainLayout>
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-lg text-sm font-bold shadow-2xl transition-all ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Hero */}
      <div className="relative bg-black border-b border-white/8 overflow-hidden" style={{ minHeight: 260 }}>
        <Starfield count={120} className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-6 pt-16 pb-10 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5 text-xs font-bold uppercase tracking-widest text-primary">
            <Coins className="w-3.5 h-3.5" />
            Orbit Token Wallet
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase mb-3">
            Your Token Balance
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Purchase tokens once, use them anytime to pay for plans and services. 1 Token = $1 USD.
          </p>
        </div>
      </div>

      <div className="bg-black min-h-screen py-14">
        <div className="container mx-auto px-6 max-w-6xl">

          {verifying && (
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-5 py-4 mb-8 text-primary text-sm font-bold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Verifying your payment and crediting tokens…
            </div>
          )}

          {/* Email Setup (only for non-auth users) */}
          {!emailSet && !user && (
            <div className="border border-primary/20 bg-primary/3 rounded-xl p-8 mb-10">
              <div className="w-8 h-0.5 bg-primary mb-4" />
              <h2 className="text-white font-black text-xl uppercase tracking-tight mb-2">Activate Your Wallet</h2>
              <p className="text-gray-400 text-sm mb-5">Enter your email to create or access your token wallet.</p>
              <form onSubmit={handleSetEmail} className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
                  className="flex-1 h-12 bg-white/5 border border-white/10 rounded-lg px-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/40" />
                <Button type="submit" className="h-12 px-7 text-xs font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90">Activate</Button>
              </form>
              <p className="text-xs text-gray-600 mt-4">
                Or{" "}
                <a href="/login" className="text-primary font-bold hover:underline">sign in</a>
                {" "}to auto-connect your wallet.
              </p>
            </div>
          )}

          {emailSet && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* LEFT: Balance + Top-up */}
              <div className="lg:col-span-2 space-y-6">

                {/* Balance Card */}
                <div className="relative rounded-xl border border-white/10 bg-gradient-to-br from-primary/5 to-transparent p-8 overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl rounded-full" />
                  {fetching && (
                    <div className="absolute top-4 right-4">
                      <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                    </div>
                  )}
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-3">Available Balance</p>
                  <div className="flex items-end gap-3 mb-2">
                    <span className="text-6xl md:text-7xl font-black text-white tracking-tighter tabular-nums">
                      {wallet ? wallet.balance.toLocaleString() : "—"}
                    </span>
                    <span className="text-primary text-xl font-black mb-3">TOKENS</span>
                  </div>
                  <p className="text-gray-500 text-sm">≈ ${wallet ? wallet.balance.toFixed(2) : "0.00"} USD value</p>
                  <p className="text-xs text-gray-600 mt-1">Wallet: {email}</p>
                  <div className="flex gap-3 mt-5">
                    <Button onClick={() => fetchWallet(email)} variant="ghost" size="sm"
                      className="h-8 px-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white border border-white/10 gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </Button>
                    <Button onClick={() => setShowTransfer(!showTransfer)} variant="ghost" size="sm"
                      className="h-8 px-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white border border-white/10 gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Transfer
                    </Button>
                    <a href="/checkout" className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-bold uppercase tracking-widest text-primary border border-primary/30 rounded-md hover:bg-primary/10 transition-colors">
                      <Coins className="w-3.5 h-3.5" /> Pay for Plan
                    </a>
                  </div>
                </div>

                {/* Transfer form */}
                {showTransfer && (
                  <div className="border border-white/10 rounded-xl p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-white mb-4">Transfer Tokens</p>
                    <form onSubmit={handleTransfer} className="space-y-3">
                      <input type="email" required value={transferTo} onChange={e => setTransferTo(e.target.value)} placeholder="Recipient email"
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/40" />
                      <div className="flex gap-3">
                        <input type="number" required min={1} max={wallet?.balance} value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="Amount of tokens"
                          className="flex-1 h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/40" />
                        <Button type="submit" disabled={transferring} className="h-11 px-6 text-xs font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90">
                          {transferring ? "Sending…" : "Send"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Token bundles */}
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white mb-4">Top Up Tokens via Paystack</p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {BUNDLES.map((b, i) => (
                      <button key={i} type="button" onClick={() => setSelected(i)}
                        className={`relative flex flex-col items-start p-4 rounded-xl border transition-all text-left ${selected === i ? "border-primary bg-primary/8" : "border-white/10 bg-white/2 hover:border-white/20"}`}>
                        {b.tag && (
                          <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest text-black bg-primary rounded px-1.5 py-0.5">{b.tag}</span>
                        )}
                        <span className={`text-xs font-black uppercase tracking-widest mb-1 ${selected === i ? "text-primary" : "text-gray-400"}`}>{b.label}</span>
                        <span className="text-2xl font-black text-white">{b.tokens.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 font-bold">tokens</span>
                        <div className="mt-3 pt-3 border-t border-white/8 w-full">
                          <span className="text-sm font-black text-white">${b.price}</span>
                          <span className="text-[10px] text-gray-600 ml-2">{b.perToken}/token</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <Button onClick={handleBuy} disabled={selected === null || loading || !wallet}
                    className="w-full h-12 text-xs font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 shadow-[0_0_30px_rgba(0,212,255,0.15)]">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Redirecting to Paystack…
                      </span>
                    ) : selected !== null ? `Buy ${BUNDLES[selected].tokens} Tokens for $${BUNDLES[selected].price}` : "Select a Bundle"}
                  </Button>
                  <p className="text-[10px] text-gray-600 text-center mt-3">
                    Secured by Paystack · Supports card, bank transfer, USSD, mobile money
                  </p>
                </div>
              </div>

              {/* RIGHT: Transaction history + trust */}
              <div className="space-y-6">
                {/* Trust */}
                <div className="border border-white/8 rounded-xl bg-white/2 p-5">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">Why Orbit Tokens?</p>
                  <div className="space-y-3">
                    {[
                      { icon: ShieldCheck, text: "Instant subscription activation" },
                      { icon: Coins, text: "1 Token = $1 USD value" },
                      { icon: Zap, text: "No credit card needed at checkout" },
                      { icon: Globe, text: "Works for all plans worldwide" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs text-gray-400">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transaction history */}
                <div className="border border-white/8 rounded-xl overflow-hidden">
                  <div className="bg-white/3 border-b border-white/8 px-5 py-3.5 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-white font-black">Ledger</p>
                    <span className="text-[10px] text-gray-500">{transactions.length} entries</span>
                  </div>
                  {fetching && transactions.length === 0 ? (
                    <div className="px-5 py-6 flex items-center justify-center gap-2 text-gray-500 text-xs">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /> Loading…
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="px-5 py-8 text-center text-gray-600 text-xs">No transactions yet.</div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {transactions.map((tx, i) => (
                        <div key={tx.id} className={`flex items-start gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors ${i < transactions.length - 1 ? "border-b border-white/5" : ""}`}>
                          <TypeIcon type={tx.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-bold truncate">{tx.description}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{format(new Date(tx.createdAt), "MMM d · HH:mm")}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-black ${tx.type === "credit" || tx.type === "transfer_in" ? "text-emerald-400" : "text-red-400"}`}>
                              {tx.type === "credit" || tx.type === "transfer_in" ? "+" : "−"}{tx.amount}
                            </p>
                            <StatusIcon status={tx.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
