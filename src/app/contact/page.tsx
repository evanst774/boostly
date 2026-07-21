// src/app/contact/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { Footer } from '@/components/landing/Footer';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const contactInfo = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: 'Email',
      value: 'hello@themototrack.com',
      href: 'mailto:hello@themototrack.com',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: 'Phone',
      value: '+250 782 368 529',
      href: 'tel:+250782368529',
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/20',
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: 'Address',
      value: 'KK 120 Street, Kigali, Rwanda',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Business Hours',
      value: 'Mon-Fri, 8AM-6PM CAT',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Hero */}
      <section className="relative sm:pt-24 pb-6 sm:pb-10 overflow-hidden safe-top">
        <div className="absolute inset-0 bg-hero-dark" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-green-600/10 to-emerald-600/10 blur-3xl rounded-full" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 sm:mb-6 touch-manipulation min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold bg-green-500/10 border border-green-500/20 text-green-400 mb-4">
              <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Get in
              Touch
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 font-space-grotesk">
              Contact <span className="text-gradient-blue">Us</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-xs sm:text-sm">
              Have questions? We&apos;d love to hear from you. Send us a message
              and we&apos;ll respond promptly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="py-4 sm:py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Contact Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {contactInfo.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-xl border ${item.bg} p-3 sm:p-4 hover:scale-[1.02] transition-all`}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-2 sm:mb-3 ${item.color} flex-shrink-0`}
                >
                  {item.icon}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">
                  {item.title}
                </p>
                {item.href ? (
                  <a
                    href={item.href}
                    className="text-xs sm:text-sm text-white hover:text-primary-400 transition-colors break-all touch-manipulation min-h-[32px] flex items-center"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="text-xs sm:text-sm text-white">{item.value}</p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 rounded-2xl border border-white/10 p-5 sm:p-8 max-w-3xl mx-auto"
          >
            {sent ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  Message Sent!
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-4">
                  We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSent(false);
                    setForm({ name: '', email: '', subject: '', message: '' });
                  }}
                  className="text-sm text-primary-400 hover:text-primary-300 touch-manipulation min-h-[44px] px-4"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-[11px] sm:text-xs font-semibold text-gray-400 mb-1.5"
                    >
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-all placeholder:text-gray-600 touch-manipulation min-h-[44px]"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-[11px] sm:text-xs font-semibold text-gray-400 mb-1.5"
                    >
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-all placeholder:text-gray-600 touch-manipulation min-h-[44px]"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-[11px] sm:text-xs font-semibold text-gray-400 mb-1.5"
                  >
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={form.subject}
                    onChange={(e) => update('subject', e.target.value)}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-all placeholder:text-gray-600 touch-manipulation min-h-[44px]"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-[11px] sm:text-xs font-semibold text-gray-400 mb-1.5"
                  >
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    rows={4}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500/50 transition-all placeholder:text-gray-600 resize-none touch-manipulation min-h-[100px]"
                    placeholder="Tell us about your needs..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold text-sm sm:text-base hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation min-h-[48px] active:scale-[0.98]"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Message
                    </>
                  )}
                </button>
                <p className="text-[10px] text-gray-600 text-center">
                  We respect your privacy. Your information will never be
                  shared.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
