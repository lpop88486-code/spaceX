import React from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LayoutDashboard, Globe, Mail, MessageCircle, Coins, LogOut, User, Satellite } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useAuth } from "@/contexts/AuthContext";

const FOOTER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Service Plans", href: "/plans" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Support", href: "#" },
  { label: "Admin Portal", href: "/admin" },
];

const REGIONS = ["🇺🇸 USA", "🇬🇧 Europe", "🇳🇬 Africa", "🌏 Global"];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, logout } = useAuth();

  const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Service Plans", href: "/plans" },
    { label: "Tracker", href: "/tracker" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative dark">
      {/* Main nav */}
      <header className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-xl border-b border-white/8 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        {/* Top ticker bar */}
        <div className="hidden md:flex bg-[#040404] border-b border-white/5 h-7 items-center px-8">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-6">
              {REGIONS.map((r) => (
                <span key={r} className="text-[10px] text-gray-600 font-medium">{r}</span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-gray-600">USD · English</span>
              <span className="w-px h-3 bg-white/10" />
              <span className="text-[10px] text-emerald-500 font-bold">● All Systems Operational</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tighter uppercase text-white leading-none block">Starlink</span>
              <span className="text-[8px] text-gray-600 uppercase tracking-[0.2em] font-medium leading-none">by orbitfuture.com</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${
                  location === l.href
                    ? "text-white bg-white/5"
                    : "text-gray-500 hover:text-white hover:bg-white/4"
                }`}
              >
                {l.label === "Dashboard" && <LayoutDashboard className="w-3 h-3" />}
                {l.label === "Tracker" && <Satellite className="w-3 h-3" />}
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link href="/wallet">
                  <Button variant="ghost" className="h-9 px-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-primary" />
                    Wallet
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" className="h-9 px-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    {user.name.split(" ")[0]}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="h-9 px-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Sign In
                </Button>
              </Link>
            )}
            <Link href="/plans">
              <Button className="h-9 px-6 text-xs font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 rounded-sm shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                Order Now
              </Button>
            </Link>
          </div>

          <button className="md:hidden text-white p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10 px-6 py-5 space-y-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 py-3 px-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
                  location === l.href ? "text-white bg-white/5" : "text-gray-400 hover:text-white"
                }`}
              >
                {l.label === "Dashboard" && <LayoutDashboard className="w-3.5 h-3.5 text-primary" />}
                {l.label === "Tracker" && <Satellite className="w-3.5 h-3.5 text-primary" />}
                {l.label}
              </Link>
            ))}
            <Link href="/wallet" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-2 py-3 px-3 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white">
                <Coins className="w-3.5 h-3.5 text-primary" />
                Wallet
              </div>
            </Link>
            <div className="pt-3 space-y-2">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full h-11 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white border border-white/10 mb-2">
                      <User className="w-3.5 h-3.5 mr-2 text-primary" />
                      {user.name}
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full h-9 text-xs font-bold uppercase tracking-widest text-gray-500 border border-white/10">
                    <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
                  </Button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full h-11 text-xs font-bold uppercase tracking-widest text-gray-400 border border-white/10 mb-2">
                    <User className="w-3.5 h-3.5 mr-2 text-primary" /> Sign In
                  </Button>
                </Link>
              )}
              <Link href="/plans" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full h-11 text-xs font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90">
                  Order Now
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-[10px] text-emerald-500 font-bold">● All Systems Operational</span>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-14 flex flex-col relative z-10">
        {children}
      </main>

      <WhatsAppButton />

      {/* Enterprise Footer */}
      <footer className="bg-[#030303] border-t border-white/8 pt-16 pb-8 z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span className="font-black text-sm tracking-tighter uppercase text-white">Starlink</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed mb-4">
                Production-grade global satellite internet infrastructure. Serving 4M+ subscribers across 100+ countries.
              </p>
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-bold">orbitfuture.com</span>
              </div>
            </div>

            {/* Services */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-4">Services</p>
              <div className="space-y-2.5">
                {[
                  { label: "Residential Plans", href: "/plans" },
                  { label: "Business Plans", href: "/plans" },
                  { label: "Maritime & Aviation", href: "/plans" },
                  { label: "Enterprise", href: "/plans" },
                ].map((l) => (
                  <Link key={l.label} href={l.href} className="block text-xs text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-4">Platform</p>
              <div className="space-y-2.5">
                {[
                  { label: "My Dashboard", href: "/dashboard" },
                  { label: "Orbit Wallet", href: "/wallet" },
                  { label: "Admin Portal", href: "/admin" },
                  { label: "Status Page", href: "#" },
                ].map((l) => (
                  <Link key={l.label} href={l.href} className="block text-xs text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-4">Contact Us</p>
              <div className="space-y-3">
                <a href="https://wa.me/16206123994?text=Hi%2C%20I%27m%20interested%20in%20Starlink." target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors group">
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  <span>+1 (620) 612-3994</span>
                </a>
                <a href="mailto:managementstarlinkhq@gmail.com"
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="break-all">managementstarlinkhq@gmail.com</span>
                </a>
                <Link href="/contact" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                  <span>Contact Page</span>
                </Link>
                <Link href="#" className="block text-xs text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="#" className="block text-xs text-gray-500 hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>

          {/* Payment logos */}
          <div className="border-t border-white/5 pt-6 mb-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-[10px] text-gray-600 uppercase tracking-widest">We Accept:</span>
              {["Stripe", "Paystack", "Orbit Wallet", "Visa", "Mastercard", "AMEX", "Apple Pay"].map((p) => (
                <span key={p} className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border border-white/8 rounded px-2 py-1 bg-white/2">{p}</span>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <p className="text-xs text-gray-700">
              © {new Date().getFullYear()} OrbitFuture Ltd. d/b/a Starlink. All rights reserved. · orbitfuture.com
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span className="text-[10px] text-gray-600 uppercase tracking-widest">All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
