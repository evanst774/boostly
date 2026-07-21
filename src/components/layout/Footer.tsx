// src/components/layout/Footer.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/5 bg-[#0A0F1A] overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">MotoTrack</p>
                <p className="text-[10px] text-gray-500">ERP Management</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Complete business management solution for inventory, sales,
              customers, and financial tracking.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white text-xs font-bold mb-3 tracking-wider uppercase">
              Product
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Inventory', href: '/inventory' },
                { label: 'Sales', href: '/sales' },
                { label: 'Reports', href: '/reports' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-500 text-xs hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white text-xs font-bold mb-3 tracking-wider uppercase">
              Resources
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Documentation', href: '/resources/documentation' },
                { label: 'User Guides', href: '/resources/guides' },
                { label: 'FAQ', href: '/resources/faq' },
                { label: 'API Reference', href: '/resources/api' },
                { label: 'Changelog', href: '/resources/changelog' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-500 text-xs hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Contact */}
          <div>
            <h4 className="text-white text-xs font-bold mb-3 tracking-wider uppercase">
              Legal
            </h4>
            <ul className="space-y-2 mb-4">
              {[
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Cookie Policy', href: '/cookies' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-500 text-xs hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="text-white text-xs font-bold mb-3 tracking-wider uppercase">
              Contact
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-gray-500">
                <Mail className="w-3 h-3 text-gray-600 flex-shrink-0" />
                support@themototrack.com
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-500">
                <Phone className="w-3 h-3 text-gray-600 flex-shrink-0" />
                +250 782 368 529
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-500">
                <MapPin className="w-3 h-3 text-gray-600 flex-shrink-0 mt-0.5" />
                KK 120 Street, Kigali, Rwanda
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-gray-600">
            &copy; {currentYear} MotoTrack ERP. All rights reserved.
          </p>
          <p className="text-[10px] text-gray-600">Built with ❤️ in Rwanda</p>
        </div>
      </div>
    </footer>
  );
}
