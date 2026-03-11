import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Apple, Play, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', to: '#features' },
  { label: 'Contact',  to: '/contact'  },
  { label: 'Privacy',  to: '/privacy'  },
];

const FOREST_GREEN = '#2E6F4F';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: FOREST_GREEN }}>

      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="bg-white/80 backdrop-blur sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo - larger, aligned with text */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0" onClick={() => setMobileMenuOpen(false)}>
            <img src="/logo.png" alt="Canoe Health" className="h-9 sm:h-11 w-auto" />
            <span className="font-bold text-gray-900 text-base sm:text-lg tracking-tight align-middle">Canoe Health</span>
          </Link>

          {/* Nav links - desktop */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} to={l.to} className="text-sm font-medium text-gray-600 hover:text-primary transition whitespace-nowrap">
                {l.label}
              </Link>
            ))}
          </div>

          {/* CTA buttons - desktop */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-primary text-white px-5 py-2.5 rounded-full hover:bg-primary-dark transition"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold border-2 border-primary text-primary px-4 py-2.5 rounded-full hover:bg-primary-light transition"
            >
              Sign in
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} to={l.to} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-gray-700 hover:text-primary">
                {l.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-primary">Get started</Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-primary">Sign in</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <div id="features" className="flex-1 flex items-center min-h-[calc(100vh-140px)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center justify-center gap-8 sm:gap-10 lg:gap-0 py-10 sm:py-12 lg:py-8">

          {/* Left: Text */}
          <div className="flex-1 lg:pr-12 text-center lg:text-left order-2 lg:order-1">
            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-extrabold text-white leading-[1.15] tracking-tight">
              Healthcare made<br />
              <span className="text-white">simple and</span><br />
              <span className="text-white/95">accessible</span>
            </h1>

            {/* Subtext */}
            <p className="mt-5 text-base text-white/85 leading-relaxed max-w-md mx-auto lg:mx-0">
              Book appointments, connect with specialists, and manage your health — all from one app.
            </p>

            {/* CTAs - App Store & Google Play only (Get Started removed from main page) */}
            <div className="mt-8 flex flex-wrap items-center gap-3 justify-center lg:justify-start">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-5 py-3 rounded-full text-sm hover:bg-gray-100 transition shadow-md"
              >
                <Apple className="w-4 h-4" /> App Store
              </a>
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-2 border-white text-white font-semibold px-5 py-3 rounded-full text-sm hover:bg-white/10 transition"
              >
                <Play className="w-4 h-4" /> Google Play
              </a>
            </div>
          </div>

          {/* Right: Phone mockups */}
          <div className="shrink-0 flex items-end justify-center gap-3 sm:gap-4 lg:gap-6 order-1 lg:order-2">
            {/* Phone 1 — taller, in front */}
            <div className="relative w-[140px] sm:w-[170px] lg:w-[210px] aspect-[9/19.5] bg-gray-900 rounded-[2.2rem] p-[5px] shadow-[0_30px_70px_rgba(0,0,0,0.25)] mb-0">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 sm:w-16 h-[12px] sm:h-[14px] bg-gray-900 rounded-b-xl z-10" />
              <div className="w-full h-full rounded-[1.9rem] overflow-hidden bg-white">
                <img src="/HomeIndividual.png" alt="Patient view" className="w-full h-full object-cover object-top" />
              </div>
            </div>

            {/* Phone 2 — shorter, behind */}
            <div className="relative w-[130px] sm:w-[155px] lg:w-[195px] aspect-[9/19.5] bg-[#1B5E20] rounded-[2.2rem] p-[5px] shadow-[0_24px_50px_rgba(0,0,0,0.2)] mb-4 sm:mb-6">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 sm:w-14 h-[11px] sm:h-[13px] bg-[#1B5E20] rounded-b-xl z-10" />
              <div className="w-full h-full rounded-[1.9rem] overflow-hidden bg-white relative">
                <img src="/HomeIndividual.png" alt="Provider view" className="w-full h-full object-cover object-top scale-105" />
                <div className="absolute inset-0 bg-primary/10 rounded-[1.9rem]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
        <span>&copy; {new Date().getFullYear()} Canoe Health Ltd.</span>
        <div className="flex flex-wrap gap-4 sm:gap-5 items-center justify-center sm:justify-end">
          <Link to="/terms"   className="hover:text-white transition">Terms</Link>
          <Link to="/privacy" className="hover:text-white transition">Privacy</Link>
          <Link to="/contact" className="hover:text-white transition">Contact</Link>
          {/* TODO: remove before going live */}
          <a href="https://adminpanel.canoehealthcare.com/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 border border-white/40 text-white/80 hover:border-white hover:text-white px-2.5 py-1 rounded-md transition font-medium">
            ⚙ Admin
          </a>
        </div>
      </footer>
    </div>
  );
}
