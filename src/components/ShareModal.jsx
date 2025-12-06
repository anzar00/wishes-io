import React, { useState } from 'react';
import { Users, Gift, Copy, Check, X } from 'lucide-react';

export default function ShareModal({ event, onClose }) {
  const origin = window.location.origin;
  const guestLink = `${origin}/?mode=guest&eventId=${event.id}`;
  const recipientLink = `${origin}/?mode=recipient&eventId=${event.id}`;

  const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <button 
        onClick={handleCopy}
        className={`p-2 rounded-lg transition ${copied ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scaleIn">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-slate-900">Share Links</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} className="text-slate-400"/></button>
        </div>
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-sm uppercase"><Users size={16}/> Guest Link</div>
            <p className="text-xs text-blue-600 mb-3">Share this with friends to collect wishes.</p>
            <div className="flex gap-2">
              <input readOnly value={guestLink} className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none" />
              <CopyButton text={guestLink} />
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
             <div className="flex items-center gap-2 mb-2 text-purple-800 font-bold text-sm uppercase"><Gift size={16}/> Recipient Link</div>
            <p className="text-xs text-purple-600 mb-3">Send this to {event.recipientName} on the big day.</p>
            <div className="flex gap-2">
              <input readOnly value={recipientLink} className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none" />
              <CopyButton text={recipientLink} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};