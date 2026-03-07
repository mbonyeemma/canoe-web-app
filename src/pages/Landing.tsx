import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Apple, Play } from 'lucide-react';

const STATS = [
  { value: '50K+',   label: 'Appointments'  },
  { value: '25K+',   label: 'Consultations' },
  { value: '1,200+', label: 'Providers'     },
];

const NAV_LINKS = [
  { label: 'Features', to: '#features' },
  { label: 'App',      to: '#app'      },
  { label: 'Contact',  to: '/contact'  },
  { label: 'Privacy',  to: '/privacy'  },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#edf9f0' }}>

      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="bg-white/80 backdrop-blur sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Canoe Health" className="h-8 w-auto" />
            <span className="font-bold text-gray-900 text-base tracking-tight">Canoe Health Care</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} to={l.to} className="text-sm font-medium text-gray-600 hover:text-primary transition">
                {l.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <Link to="/signup" className="text-sm font-semibold bg-primary text-white px-5 py-2.5 rounded-full hover:bg-primary-dark transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-0 py-14 lg:py-0">

          {/* Left: Text */}
          <div className="flex-1 lg:pr-12 text-center lg:text-left">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-1.5 bg-white rounded-full px-3.5 py-1.5 shadow-sm border border-gray-100 mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-gray-600">Trusted by 10,000+ patients</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-gray-900 leading-[1.1] tracking-tight">
              Healthcare made<br />
              <span className="text-gray-900">simple and</span><br />
              <span className="text-primary">accessible</span>
            </h1>

            {/* Subtext */}
            <p className="mt-5 text-base text-gray-500 leading-relaxed max-w-md mx-auto lg:mx-0">
              Book appointments, connect with specialists, and manage your health — all from one beautifully designed app.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3 justify-center lg:justify-start">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-primary-dark transition shadow-md shadow-primary/20"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#app"
                className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-5 py-3 rounded-full text-sm hover:bg-gray-800 transition"
              >
                <Apple className="w-4 h-4" /> App Store
              </a>
              <a
                href="#app"
                className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 font-semibold px-5 py-3 rounded-full text-sm hover:border-gray-400 transition"
              >
                <Play className="w-4 h-4" /> Google Play
              </a>
            </div>

            {/* Stats */}
            <div className="mt-10 flex items-center gap-8 justify-center lg:justify-start">
              {STATS.map((s, i) => (
                <div key={s.label}>
                  <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  {i < STATS.length - 1 && (
                    <div className="hidden" /> /* spacer handled by gap */
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Phone mockups */}
          <div className="shrink-0 flex items-end gap-4 lg:gap-6">
            {/* Phone 1 — taller, in front */}
            <div className="relative w-[160px] sm:w-[190px] lg:w-[210px] aspect-[9/19.5] bg-gray-900 rounded-[2.2rem] p-[5px] shadow-[0_30px_70px_rgba(0,0,0,0.18)] mb-0">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-[14px] bg-gray-900 rounded-b-xl z-10" />
              <div className="w-full h-full rounded-[1.9rem] overflow-hidden bg-white">
                <img src="/HomeIndividual.png" alt="Patient view" className="w-full h-full object-cover object-top" />
              </div>
            </div>

            {/* Phone 2 — shorter, behind, green tint overlay */}
            <div className="relative w-[150px] sm:w-[175px] lg:w-[195px] aspect-[9/19.5] bg-[#1B5E20] rounded-[2.2rem] p-[5px] shadow-[0_24px_50px_rgba(0,0,0,0.14)] mb-6">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-[13px] bg-[#1B5E20] rounded-b-xl z-10" />
              <div className="w-full h-full rounded-[1.9rem] overflow-hidden bg-white relative">
                <img src="/HomeIndividual.png" alt="Provider view" className="w-full h-full object-cover object-top scale-105" />
                {/* Green overlay to differentiate */}
                <div className="absolute inset-0 bg-primary/10 rounded-[1.9rem]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="max-w-6xl mx-auto px-5 sm:px-8 py-5 w-full flex items-center justify-between text-xs text-gray-400">
        <span>&copy; {new Date().getFullYear()} Canoe Health Ltd.</span>
        <div className="flex gap-5">
          <Link to="/terms"   className="hover:text-primary transition">Terms</Link>
          <Link to="/privacy" className="hover:text-primary transition">Privacy</Link>
          <Link to="/contact" className="hover:text-primary transition">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
