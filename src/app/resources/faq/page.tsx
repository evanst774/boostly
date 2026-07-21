// src/app/resources/faq/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'How do I add a new bike to inventory?',
    a: 'Go to Inventory → Add Bike. Fill in the plate number, chassis number, model, category, and pricing details. Click Save to add the bike.',
  },
  {
    q: 'How do I record a sale?',
    a: 'Go to Sales → New Sale. Select a customer and a bike, enter the sale amount, choose payment type (Full or Installment), and submit.',
  },
  {
    q: 'How do I track customer debts?',
    a: 'Go to Customers → Debtors to see all customers with outstanding balances. You can filter by risk level, status, and search by name or phone.',
  },
  {
    q: 'How do I enable Two-Factor Authentication?',
    a: 'Go to Settings → Security. Under Two-Factor Authentication, click Enable on Email or Authenticator App. Follow the verification steps.',
  },
  {
    q: 'How do I export reports?',
    a: 'Go to Reports → Export. Select the report type, date range, and format (Excel or PDF). Click Export to download.',
  },
  {
    q: 'How do I manage user permissions?',
    a: 'Go to Admin → Users. Click on a user to view details. Use the Permissions panel to grant or revoke specific module access.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'MotoTrack supports Cash, Bank Transfer, Mobile Money, and Card payments. You can record payments with any of these methods.',
  },
  {
    q: 'How do I upload a contract?',
    a: 'Go to Contracts → Upload. Select the associated sale, upload the PDF file, add a name and optional tags, then submit.',
  },
];

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#050B1A]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 touch-manipulation min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Frequently Asked <span className="text-amber-400">Questions</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Find answers to common questions about MotoTrack ERP.
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* FAQ List */}
        <div className="space-y-2">
          {filteredFaqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left touch-manipulation min-h-[48px]"
              >
                <span className="text-sm font-medium text-white">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
          {filteredFaqs.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No questions match your search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
