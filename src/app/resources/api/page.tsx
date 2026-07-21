// src/app/resources/api/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Code, Copy, CheckCircle2 } from 'lucide-react';

const endpoints = [
  { method: 'GET', path: '/api/bikes', desc: 'List all bikes' },
  { method: 'POST', path: '/api/bikes', desc: 'Create a new bike' },
  { method: 'GET', path: '/api/customers', desc: 'List all customers' },
  { method: 'POST', path: '/api/sales', desc: 'Create a new sale' },
  { method: 'GET', path: '/api/finance/payments', desc: 'List all payments' },
  { method: 'GET', path: '/api/reports/sales', desc: 'Get sales report data' },
];

const methodColors: Record<string, string> = {
  GET: 'bg-green-500/10 text-green-400 border-green-500/20',
  POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function APIPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const exampleCode = `fetch('/api/bikes', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log(data));`;

  return (
    <div className="min-h-screen bg-[#050B1A]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 touch-manipulation min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
            <Code className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            API <span className="text-purple-400">Reference</span>
          </h1>
          <p className="text-gray-400 text-sm">
            REST API endpoints for integrating with MotoTrack ERP.
          </p>
        </motion.div>

        {/* Example */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-white mb-3">
            Example Request
          </h3>
          <div className="relative bg-[#0A1020] rounded-xl border border-white/10 p-4">
            <button
              onClick={() => copyCode(exampleCode)}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 text-gray-500 hover:text-white"
            >
              {copied === exampleCode ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <pre className="text-xs text-green-400 font-mono overflow-x-auto">
              {exampleCode}
            </pre>
          </div>
        </div>

        {/* Endpoints */}
        <h3 className="text-sm font-semibold text-white mb-3">
          Available Endpoints
        </h3>
        <div className="space-y-2">
          {endpoints.map((ep, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-3 bg-white/5 rounded-lg border border-white/10 p-3"
            >
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${methodColors[ep.method]}`}
              >
                {ep.method}
              </span>
              <code className="text-sm text-white font-mono">{ep.path}</code>
              <span className="text-xs text-gray-500 ml-auto">{ep.desc}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <p className="text-xs text-gray-400">
            📝 Full API documentation with request/response examples coming
            soon.
          </p>
        </div>
      </div>
    </div>
  );
}
