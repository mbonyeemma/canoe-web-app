import { Link } from 'react-router-dom';
import { Stethoscope, UserRound, CalendarDays, ShieldCheck, Video } from 'lucide-react';

export default function Register() {
  return (
    <div className="min-h-screen flex w-full">
      {/* LEFT: Green storytelling panel – matches signup flow */}
      <div
        className="hidden lg:flex lg:w-[44%] bg-gradient-to-br from-[#1B5E20] via-[#256829] to-[#2E7D32] flex-col justify-between p-10 relative overflow-hidden shrink-0"
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-12 w-72 h-72 rounded-full bg-white/8 pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-20 right-8 w-64 h-64 rounded-full bg-black/10 pointer-events-none" />

        {/* Logo */}
        <Link to="/" className="relative z-10">
          <img src="/logo.png" alt="Canoe Health" className="h-20 w-auto" />
        </Link>

        {/* Content */}
        <div className="relative z-10">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.18em] mb-3">Get started</p>
          <h2 className="text-[28px] font-bold text-white leading-[1.2] whitespace-pre-line">
            Tell us how you will use Canoe Health
          </h2>
        

          <div className="mt-7 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-white/80 font-medium">Book and manage appointments easily</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-white/80 font-medium">Video &amp; voice consultations from anywhere</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-white/80 font-medium">Secure, privacy-first experience</span>
            </div>
          </div>

          <div className="flex gap-1.5 mt-10">
            <div className="w-7 h-2 rounded-full bg-white" />
            <div className="w-2 h-2 rounded-full bg-white/30" />
            <div className="w-2 h-2 rounded-full bg-white/30" />
          </div>
        </div>

        <p className="text-white/20 text-xs relative z-10">&copy; {new Date().getFullYear()} Canoe Health Ltd.</p>
      </div>

      {/* RIGHT: Role selection cards */}
      <div className="flex-1 flex items-center justify-center bg-white p-6 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-xl py-4">
          {/* Mobile logo + sign in */}
          <div className="flex items-center justify-between mb-6 lg:mb-10">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <img src="/logo.png" alt="Canoe Health" className="h-8 w-auto" />
              <span className="font-bold text-gray-900 text-base">Canoe Health</span>
            </Link>
            <Link to="/login" className="ml-auto text-sm font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>

          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Create your account</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">How do you want to use Canoe Health?</h1>
          <p className="text-sm text-gray-600 mt-2">
            Choose your role to start a tailored signup flow.
          </p>

          <div className="mt-8 grid md:grid-cols-2 gap-5">
            <Link
              to="/signup?role=client"
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-primary/40 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
                <UserRound className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary transition">
                Register as a client
              </h2>
              
              <div className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
                Continue →
              </div>
            </Link>

            <Link
              to="/signup?role=provider"
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-primary/40 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary transition">
                Register as a provider
              </h2>
             
              <div className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
                Continue →
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}