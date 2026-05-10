'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Modes', href: '#modes' },
  { label: 'Verify', href: '#verify' },
  { label: 'Card', href: '#card' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#09090B]/80 backdrop-blur-xl border-b border-white/[0.04]' : 'bg-transparent'
      }`}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex items-center justify-between h-[64px]">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="StackPair" width={28} height={28} className="object-contain invert brightness-200" priority />
            <span className="font-semibold text-white/90 text-sm">StackPair</span>
          </Link>

          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-[13px] text-white/35 hover:text-white/70 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="text-[13px] text-white/40 hover:text-white/70 transition-colors px-3 py-1.5">
              Log In
            </Link>
            <Link
              href="/signup"
              className="text-[13px] font-medium bg-white/[0.08] border border-white/[0.06] text-white/80 px-5 py-2 rounded-full hover:bg-white/[0.12] hover:text-white transition-all"
            >
              Get Started
            </Link>
          </div>

          <button className="lg:hidden text-white/60 p-1 cursor-pointer" onClick={() => setIsMenuOpen(true)} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setIsMenuOpen(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 right-0 bottom-0 w-[260px] bg-[#0F0F12] border-l border-white/[0.04] z-[61] flex flex-col p-6"
            >
              <button className="self-end text-white/30 hover:text-white/60 mb-8 cursor-pointer" onClick={() => setIsMenuOpen(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
              <div className="flex flex-col gap-5">
                {navLinks.map(link => (
                  <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="text-lg text-white/40 hover:text-white/80 transition-colors">{link.label}</a>
                ))}
              </div>
              <div className="mt-auto flex flex-col gap-2">
                <Link href="/login" className="text-center text-white/40 hover:text-white/70 py-2.5" onClick={() => setIsMenuOpen(false)}>Log In</Link>
                <Link href="/signup" className="text-center font-medium bg-white/[0.08] text-white/80 py-2.5 rounded-full hover:bg-white/[0.12]" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
