import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, MapPin, Clock, Send, ChevronRight } from "lucide-react";

const WHATSAPP_NUMBER = "+16206123994";
const WHATSAPP_DISPLAY = "+1 (620) 612-3994";
const EMAIL = "managementstarlinkhq@gmail.com";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent("Hi, I'm interested in Starlink satellite internet service.");
    window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  const handleEmail = () => {
    window.location.href = `mailto:${EMAIL}?subject=Starlink%20Inquiry`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    const subject = encodeURIComponent(form.subject || "Starlink Inquiry");
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <MainLayout>
      {/* Hero */}
      <div className="relative bg-black border-b border-white/8 overflow-hidden" style={{ minHeight: 240 }}>
        <Starfield count={120} className="opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-6 pt-14 pb-10 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/4 border border-white/10 rounded-full px-4 py-1.5 mb-5 text-xs font-bold uppercase tracking-widest text-gray-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Available 24/7
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase mb-4 leading-tight">
            Contact Us
          </h1>
          <p className="text-gray-400 text-base max-w-lg mx-auto">
            Reach our team via WhatsApp or email. We typically respond within minutes.
          </p>
        </div>
      </div>

      <div className="bg-black py-14">
        <div className="container mx-auto px-6 max-w-5xl">

          {/* Quick contact cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">

            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="group relative text-left rounded-xl border border-[#25D366]/30 bg-gradient-to-br from-[#25D366]/8 to-transparent p-8 hover:border-[#25D366]/60 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4 text-[#25D366]" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center mb-5">
                <MessageCircle className="w-6 h-6 text-[#25D366]" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">WhatsApp</p>
              <p className="text-xl font-black text-white tracking-tight mb-1">{WHATSAPP_DISPLAY}</p>
              <p className="text-xs text-gray-500 mb-5">Chat with us instantly — fastest response time</p>
              <div className="inline-flex items-center gap-2 bg-[#25D366] text-black text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-lg">
                <MessageCircle className="w-3.5 h-3.5" />
                Open WhatsApp
              </div>
            </button>

            {/* Email */}
            <button
              onClick={handleEmail}
              className="group relative text-left rounded-xl border border-primary/30 bg-gradient-to-br from-primary/8 to-transparent p-8 hover:border-primary/60 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4 text-primary" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Email</p>
              <p className="text-lg font-black text-white tracking-tight mb-1 break-all">{EMAIL}</p>
              <p className="text-xs text-gray-500 mb-5">For detailed inquiries, orders, and support tickets</p>
              <div className="inline-flex items-center gap-2 bg-primary text-black text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-lg">
                <Mail className="w-3.5 h-3.5" />
                Send Email
              </div>
            </button>
          </div>

          {/* Info strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
            {[
              { icon: Clock, label: "Response Time", value: "Under 30 minutes", sub: "During business hours" },
              { icon: MapPin, label: "Coverage", value: "100+ Countries", sub: "Including Nigeria & Africa" },
              { icon: MessageCircle, label: "Support", value: "24/7 Available", sub: "WhatsApp preferred" },
            ].map((item) => (
              <div key={item.label} className="border border-white/8 rounded-xl bg-white/2 p-6 text-center">
                <item.icon className="w-5 h-5 text-primary mx-auto mb-3" />
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">{item.label}</p>
                <p className="text-white font-black text-base">{item.value}</p>
                <p className="text-gray-600 text-[11px] mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <div className="w-8 h-0.5 bg-primary mb-5" />
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-3">Send a Message</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Fill out the form and we'll get back to you — or reach us directly on WhatsApp for the fastest reply.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-400">
                  <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span className="font-bold">{WHATSAPP_DISPLAY}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-bold break-all">{EMAIL}</span>
                </div>
              </div>
            </div>

            <div>
              {sent ? (
                <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-white font-black text-lg uppercase tracking-tight mb-2">Message Sent!</p>
                  <p className="text-gray-500 text-sm">Your email client should have opened. We'll reply shortly.</p>
                  <button onClick={() => setSent(false)} className="mt-4 text-xs text-primary font-bold uppercase tracking-widest hover:underline">
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {[
                    { key: "name", label: "Full Name", placeholder: "John Adeyemi", type: "text" },
                    { key: "email", label: "Email Address", placeholder: "you@example.com", type: "email" },
                    { key: "subject", label: "Subject", placeholder: "Inquiry about Residential Plan", type: "text" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1.5">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        required={field.key !== "subject"}
                        placeholder={field.placeholder}
                        value={(form as any)[field.key]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1.5">Message</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Tell us how we can help..."
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-xs font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90">
                    <Send className="w-3.5 h-3.5 mr-2" />
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
