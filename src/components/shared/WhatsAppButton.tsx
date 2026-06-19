'use client';

import { Phone, MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function WhatsAppButton() {
  const pathname = usePathname();
  
  // Hide on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 no-print">
      {/* Phone Call Button */}
      <a
        href="tel:+919788045564"
        title="Call SMS Grocery"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
      >
        <Phone className="h-5 w-5" />
        <span className="sr-only">Call Store</span>
      </a>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/919788045564"
        target="_blank"
        rel="noopener noreferrer"
        title="WhatsApp SMS Grocery"
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-95"
      >
        {/* Pulsing indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
        </span>
        <MessageSquare className="h-5 w-5 fill-current" />
        <span className="sr-only">WhatsApp Chat</span>
      </a>
    </div>
  );
}
