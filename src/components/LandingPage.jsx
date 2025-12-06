import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function LandingPage({ onLogin, user, goToDashboard }) {
  return (
    <div className="flex flex-col items-center justify-center pt-20 px-6 text-center pb-20">
      <div className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-xs font-bold mb-6 tracking-wide uppercase">
        The New Way to say Happy Birthday
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
        Make someone's day,<br /> <span className="text-blue-600">digitally unforgettable.</span>
      </h1>
      <p className="text-lg text-slate-500 max-w-2xl mb-10 leading-relaxed">
        Create a collaborative greeting card website. Collect wishes from friends, 
        lock it until a specific time, and reveal it with a custom animation.
      </p>
      
      <button 
        onClick={user ? goToDashboard : onLogin}
        className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition flex items-center gap-2 shadow-xl hover:-translate-y-1"
      >
        {user ? "Go to Dashboard" : "Sign in with Google"} <ArrowRight size={20} />
      </button>
    </div>
  );
}