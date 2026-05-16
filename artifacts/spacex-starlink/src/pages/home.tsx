import React, { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";
import { Check, Zap, Globe, Shield, Wifi, ChevronRight, Star, ArrowRight, Signal, Satellite, Radio } from "lucide-react";

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function AnimatedStat({ value, suffix, label, start }: { value: number; suffix: string; label: string; start: boolean }) {
  const count = useCountUp(value, 2200, start);
  return (
    <div className="py-6 px-4 text-center">
      <div className="text-3xl md:text-4xl font-black text-white tracking-tight tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs uppercase tracking-widest text-gray-500 font-medium mt-1">{label}</div>
    </div>
  );
}

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const MEDIA = ["BBC News", "TechCrunch", "Forbes", "Reuters", "CNN", "Bloomberg", "Wired"];

const TESTIMONIALS = [
  {
    quote: "Starlink has been a total game-changer. I run my entire business remotely and the connection is faster than what I had in the city.",
    name: "Amaka O.",
    location: "Lagos, Nigeria",
    plan: "Business Plan",
    stars: 5,
  },
  {
    quote: "I live 80km from the nearest town. Before Starlink I had zero internet. Now my kids attend online school every day without interruption.",
    name: "James K.",
    location: "Plateau State, Nigeria",
    plan: "Residential Plan",
    stars: 5,
  },
  {
    quote: "Our fishing vessel now has 150 Mbps in the middle of the ocean. The crew can video call their families every evening. Life-changing.",
    name: "Capt. Ibrahim M.",
    location: "Atlantic Ocean",
    plan: "Maritime Plan",
    stars: 5,
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Satellite,
    title: "Order Your Kit",
    desc: "Choose a plan and order your Starlink hardware kit online. Ships directly to your door within 1–2 weeks.",
  },
  {
    step: "02",
    icon: Radio,
    title: "15-Minute Setup",
    desc: "Point the dish at the sky, plug in the router, and you're live. No technician required — the app guides you through.",
  },
  {
    step: "03",
    icon: Wifi,
    title: "Connect Everything",
    desc: "Stream, work, learn, and game at high speeds. Unlimited data, no contracts, cancel anytime.",
  },
];

const COMPARISON = [
  { feature: "Coverage in Remote Areas", starlink: true, traditional: false },
  { feature: "No Infrastructure Required", starlink: true, traditional: false },
  { feature: "Works While Moving", starlink: true, traditional: false },
  { feature: "Available in 100+ Countries", starlink: true, traditional: false },
  { feature: "Unlimited Data", starlink: true, traditional: false },
  { feature: "20–40ms Low Latency", starlink: true, traditional: false },
  { feature: "15-Minute Self Setup", starlink: true, traditional: false },
  { feature: "No Annual Contracts", starlink: true, traditional: false },
];

const USE_CASES = [
  {
    icon: Globe,
    title: "Homes & Families",
    desc: "Bring high-speed internet to your household no matter where you live — rural farm, hilltop home, or remote village.",
    stat: "200 Mbps avg speed",
    color: "from-blue-500/10 to-transparent",
    border: "border-blue-500/20",
  },
  {
    icon: Zap,
    title: "Businesses & Enterprises",
    desc: "Keep operations running with priority data, SLA guarantees, and enterprise-grade hardware designed for commercial use.",
    stat: "99.9% uptime SLA",
    color: "from-cyan-500/10 to-transparent",
    border: "border-cyan-500/20",
  },
  {
    icon: Signal,
    title: "On the Move",
    desc: "Stay connected across oceans, continents, and skies. Starlink works on vessels, RVs, planes, and ground vehicles.",
    stat: "Global ocean coverage",
    color: "from-primary/10 to-transparent",
    border: "border-primary/20",
  },
  {
    icon: Shield,
    title: "Emergency & Relief",
    desc: "When ground infrastructure collapses during disasters, Starlink stays online. Governments and NGOs trust it worldwide.",
    stat: "Active in 50+ relief missions",
    color: "from-orange-500/10 to-transparent",
    border: "border-orange-500/20",
  },
];

const FEATURED_PLANS = [
  { name: "Residential", price: "$120", features: ["Unlimited data", "50–200 Mbps", "99.9% uptime", "24/7 support", "Fixed location"], tag: null },
  { name: "Priority", price: "$250", features: ["1 TB priority data", "40–220 Mbps", "Priority access", "Portable use", "No throttling"], tag: "MOST POPULAR" },
  { name: "Business", price: "$500", features: ["Priority network", "Multi-device", "SLA guarantee", "Dedicated support", "Commercial hardware"], tag: null },
];

export default function Home() {
  const { ref: statsRef, inView: statsInView } = useInView();
  const { ref: howRef, inView: howInView } = useInView(0.1);
  const { ref: compareRef, inView: compareInView } = useInView(0.1);

  return (
    <MainLayout>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="relative min-h-screen flex flex-col overflow-hidden bg-black">
        <Starfield count={500} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black z-0 pointer-events-none" />

        {/* Glowing orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 md:px-12 relative z-10 flex flex-col items-center justify-center text-center flex-1 pt-28 pb-16">

          {/* Breaking news badge */}
          <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/5 backdrop-blur-sm rounded-full px-4 py-1.5 mb-8 text-xs font-bold uppercase tracking-widest text-primary animate-pulse">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            Now Available in Nigeria — Order Today
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] font-black tracking-tighter text-white leading-none uppercase mb-6">
            Internet<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-primary">
              From Space
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed mb-4">
            High-speed, low-latency satellite internet — available anywhere on Earth.
            No infrastructure. No excuses. Just fast internet, everywhere.
          </p>

          <p className="text-xs md:text-sm tracking-widest text-gray-500 uppercase mb-10">
            Trusted by 4 Million+ Subscribers &nbsp;·&nbsp; 100+ Countries &nbsp;·&nbsp; 6,000+ Satellites in Orbit
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Link href="/plans">
              <Button size="lg" className="h-14 px-10 text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-black shadow-[0_0_40px_rgba(0,212,255,0.3)] hover:shadow-[0_0_60px_rgba(0,212,255,0.5)] transition-all">
                Get Started — From $120/mo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/plans">
              <Button size="lg" variant="outline" className="h-14 px-10 text-sm font-bold uppercase tracking-widest border-white/20 text-white hover:bg-white/10 hover:border-white/40">
                Compare Plans
              </Button>
            </Link>
          </div>

          {/* Dish hero image */}
          <div className="relative w-full max-w-sm mx-auto">
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-75" />
            <img
              src="/dish.png"
              alt="Starlink Dish"
              className="relative w-full object-contain drop-shadow-[0_0_80px_rgba(0,212,255,0.2)]"
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div ref={statsRef} className="relative z-10 border-t border-white/10 bg-black/70 backdrop-blur-md">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
              <AnimatedStat value={4} suffix="M+" label="Global Subscribers" start={statsInView} />
              <AnimatedStat value={100} suffix="+" label="Countries Served" start={statsInView} />
              <AnimatedStat value={6000} suffix="+" label="Satellites in Orbit" start={statsInView} />
              <AnimatedStat value={40} suffix="ms" label="Avg Latency" start={statsInView} />
            </div>
          </div>
        </div>
      </div>

      {/* ── AS FEATURED IN ────────────────────────────────────────────────── */}
      <section className="bg-[#050505] border-y border-white/5 py-8 overflow-hidden">
        <div className="container mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-gray-600 mb-6">As featured in</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {MEDIA.map((m) => (
              <span key={m} className="text-gray-600 font-black text-sm md:text-base uppercase tracking-widest hover:text-gray-400 transition-colors cursor-default select-none">
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ─────────────────────────────────────────────────────── */}
      <section className="bg-black py-28 border-t border-white/5">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-2xl mb-16">
            <div className="w-10 h-0.5 bg-primary mb-5" />
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white leading-tight mb-4">
              Internet for<br />Every Situation
            </h2>
            <p className="text-gray-400 text-base leading-relaxed">
              Whether you're running a business in Lagos, farming in Plateau State, fishing the Atlantic, 
              or responding to a crisis — Starlink keeps you connected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {USE_CASES.map((uc, i) => (
              <div
                key={uc.title}
                className={`group relative rounded-lg border ${uc.border} bg-gradient-to-br ${uc.color} p-8 hover:border-opacity-60 transition-all duration-300 overflow-hidden`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 opacity-5 group-hover:opacity-10 transition-opacity">
                  <uc.icon className="w-full h-full text-white" />
                </div>
                <uc.icon className="w-7 h-7 text-primary mb-5" />
                <h3 className="text-white font-black text-xl uppercase tracking-tight mb-3">{uc.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{uc.desc}</p>
                <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  {uc.stat}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="bg-[#030303] py-28 border-t border-white/5" ref={howRef}>
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="w-10 h-0.5 bg-primary mb-5 mx-auto" />
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
              Up & Running in 15 Minutes
            </h2>
            <p className="text-gray-400 text-base">
              No waiting for a technician. No installation fees. Just plug in, point at the sky, and connect.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.step}
                className={`relative text-center transition-all duration-700 ${howInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="w-16 h-16 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center mx-auto mb-6 relative">
                  <step.icon className="w-7 h-7 text-primary" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-black text-[10px] font-black">
                    {i + 1}
                  </span>
                </div>
                <div className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-2">{step.step}</div>
                <h3 className="text-white font-black uppercase tracking-tight text-lg mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HARDWARE + FEATURE HIGHLIGHT ─────────────────────────────────── */}
      <section className="bg-black border-t border-white/5 overflow-hidden">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center min-h-[600px]">
            <div className="py-20">
              <div className="w-10 h-0.5 bg-primary mb-6" />
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-tight mb-4">
                Everything You Need.<br />
                <span className="text-gray-500">Ships to Your Door.</span>
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
                The Starlink Kit includes the dish, mounting base, WiFi router, cables, and power supply. 
                Self-install in minutes — no engineers, no waiting.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "High-performance phased array antenna",
                  "Dual-band WiFi 6 router included",
                  "Weatherproof for extreme conditions",
                  "Auto-adjusts to track satellites",
                  "App-based setup & monitoring",
                  "Global warranty & 24/7 support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-end gap-2 mb-6">
                <span className="text-xs text-gray-500 uppercase tracking-widest">Hardware from</span>
                <span className="text-4xl font-black text-white tracking-tighter">$599</span>
                <span className="text-gray-500 text-sm mb-1">one-time</span>
              </div>
              <Link href="/plans">
                <Button className="h-12 px-8 text-xs font-black uppercase tracking-widest bg-white text-black hover:bg-gray-100">
                  Order Your Kit
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="relative flex items-center justify-center py-10 md:py-0">
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-primary/3 blur-3xl" />
              <img
                src="/dish.png"
                alt="Starlink Hardware Kit"
                className="relative w-full max-w-md object-contain drop-shadow-[0_20px_80px_rgba(0,212,255,0.15)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────── */}
      <section className="bg-[#030303] py-28 border-t border-white/5" ref={compareRef}>
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="w-10 h-0.5 bg-primary mb-5 mx-auto" />
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
              Why Starlink Wins
            </h2>
            <p className="text-gray-400 text-base">
              Traditional ISPs were built for a different era. Starlink was built for everywhere.
            </p>
          </div>

          <div
            className={`max-w-3xl mx-auto rounded-lg overflow-hidden border border-white/10 transition-all duration-700 ${compareInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <div className="grid grid-cols-3 bg-white/5 border-b border-white/10">
              <div className="p-4 text-xs uppercase tracking-widest text-gray-500 font-bold">Feature</div>
              <div className="p-4 text-center border-l border-white/10">
                <span className="text-xs uppercase tracking-widest text-primary font-black">Starlink</span>
              </div>
              <div className="p-4 text-center border-l border-white/10">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Traditional ISP</span>
              </div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-3 border-b border-white/5 ${i % 2 === 0 ? "bg-white/2" : ""} hover:bg-white/5 transition-colors`}>
                <div className="p-4 text-sm text-gray-300">{row.feature}</div>
                <div className="p-4 flex justify-center items-center border-l border-white/5">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                </div>
                <div className="p-4 flex justify-center items-center border-l border-white/5">
                  <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                    <span className="text-red-400 text-xs font-black">✕</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS TEASER ─────────────────────────────────────────────────── */}
      <section className="bg-black py-28 border-t border-white/5">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center max-w-xl mx-auto mb-16">
            <div className="w-10 h-0.5 bg-primary mb-5 mx-auto" />
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
              Plans for Every Need
            </h2>
            <p className="text-gray-400 text-base">
              No contracts. No hidden fees. Cancel anytime. Start connecting today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-12">
            {FEATURED_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-lg border p-7 transition-all duration-300 group hover:-translate-y-1 ${
                  plan.tag
                    ? "border-primary/40 bg-gradient-to-b from-primary/5 to-transparent shadow-[0_0_40px_rgba(0,212,255,0.08)]"
                    : "border-white/10 bg-white/2 hover:border-white/20"
                }`}
              >
                {plan.tag && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.tag}
                  </div>
                )}
                <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">{plan.name}</p>
                <p className="text-5xl font-black text-white tracking-tighter mb-1">
                  {plan.price}<span className="text-lg text-gray-400 font-medium">/mo</span>
                </p>
                <p className="text-xs text-gray-600 uppercase tracking-widest mb-6">+ hardware from $599</p>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/plans">
                  <Button
                    className={`w-full h-11 text-xs font-black uppercase tracking-widest ${
                      plan.tag ? "bg-primary text-black hover:bg-primary/90" : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                    }`}
                  >
                    Order Now
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/plans">
              <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm font-bold uppercase tracking-widest group">
                See all plans including Maritime & Aviation
                <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="bg-[#030303] py-28 border-t border-white/5">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center max-w-xl mx-auto mb-16">
            <div className="w-10 h-0.5 bg-primary mb-5 mx-auto" />
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
              Real People.<br />Real Results.
            </h2>
            <p className="text-gray-400 text-base">
              Thousands of subscribers across Africa and beyond have already transformed their lives with Starlink.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-lg border border-white/8 bg-white/2 p-7 hover:border-white/15 transition-all group">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{t.location}</p>
                  <span className="inline-block mt-2 text-[10px] text-primary uppercase tracking-widest font-bold border border-primary/20 bg-primary/5 px-2 py-0.5 rounded-full">
                    {t.plan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="relative bg-black py-32 border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[100px] rounded-full" />

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="w-10 h-0.5 bg-primary mb-8 mx-auto" />
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-white mb-5 leading-tight">
            The World Is Online.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">Are You?</span>
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto mb-10 leading-relaxed">
            Join 4 million subscribers worldwide. Order today and be online within 2 weeks. 
            No contracts. No commitments. Just the fastest internet from space.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/plans">
              <Button size="lg" className="h-14 px-12 text-sm font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 shadow-[0_0_60px_rgba(0,212,255,0.25)] hover:shadow-[0_0_80px_rgba(0,212,255,0.4)] transition-all">
                Order Now — From $120/mo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/plans">
              <Button size="lg" variant="outline" className="h-14 px-10 text-sm font-bold uppercase tracking-widest border-white/20 text-white hover:bg-white/8 hover:border-white/40">
                View All Plans
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-600 uppercase tracking-widest">
            No annual contract &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; Ships to Nigeria
          </p>
        </div>
      </section>

    </MainLayout>
  );
}
