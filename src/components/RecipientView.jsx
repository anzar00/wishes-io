import React, { useState, useEffect } from 'react';
import { Lock, Heart, Plane, Gift, PartyPopper, Sparkles, Unlock, X, Flower, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function RecipientView({ event, onBack }) {
  const [status, setStatus] = useState('loading'); 
  const [timeLeft, setTimeLeft] = useState('');
  const [quizOpen, setQuizOpen] = useState(false);
  const [creatorUnlocked, setCreatorUnlocked] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [wishes, setWishes] = useState([]);
  const [flying, setFlying] = useState(false);
  
  // New State for Scoring
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const mockWishes = [
    { id: 1, name: "Alice", text: "Happy Birthday! Hope you have an amazing day!", color: "bg-pink-100", createdAt: 1 },
    { id: 2, name: "Bob", text: "Can't wait to celebrate with you.", color: "bg-blue-100", createdAt: 2 },
    { id: 3, name: "Charlie", text: "Sending lots of love!", color: "bg-yellow-100", createdAt: 3 }
  ];

  useEffect(() => {
    if (!event) return;
    const checkTime = () => {
      const now = new Date();
      const unlock = new Date(event.unlockDate);
      if (now >= unlock || event.isPreview) { 
        if (status !== 'unlocked') setStatus('unlocked');
      } else {
        setStatus('locked');
        const diff = unlock - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    };
    const timer = setInterval(checkTime, 1000);
    checkTime();
    return () => clearInterval(timer);
  }, [event, status]);

  useEffect(() => {
    if (status === 'unlocked') {
      setTimeout(() => setFlying(true), 500);
      if (event.isPreview) {
        setWishes(mockWishes);
      } else {
        const q = query(collection(db, 'events', event.id, 'wishes'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => setWishes(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => unsub();
      }
    }
  }, [status, event]);

  // Unlock sequence: Just unlock immediately, animation happens via CSS
  const handleUnlockSequence = () => {
    setQuizOpen(false);
    setCreatorUnlocked(true);
  };

  const handleQuizAnswer = (ans) => {
    const isCorrect = ans === event.quizQuestions[quizStep].correct;
    
    // Optimistically update score if correct
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    if (quizStep + 1 < event.quizQuestions.length) {
      setQuizStep(prev => prev + 1);
    } else {
      // Quiz Finished - Show results
      setQuizFinished(true);
    }
  };

  const handleDirectUnlock = () => handleUnlockSequence();

  const handleRetryQuiz = () => {
    setScore(0);
    setQuizStep(0);
    setQuizFinished(false);
  };

  const AnimationElement = () => {
    if (!flying) return null;
    switch(event.animation) {
      case 'confetti': return <div className="absolute inset-0 pointer-events-none overflow-hidden"><PartyPopper className="absolute top-10 left-10 text-yellow-500 w-20 h-20 animate-bounce"/><PartyPopper className="absolute top-20 right-20 text-pink-500 w-16 h-16 animate-pulse"/></div>;
      case 'hearts': return <div className="absolute inset-0 pointer-events-none"><Heart className="absolute bottom-0 left-1/4 text-red-500 w-12 h-12 animate-[floatUp_4s_ease-in-out_infinite]"/><Heart className="absolute bottom-0 right-1/3 text-pink-500 w-16 h-16 animate-[floatUp_5s_ease-in-out_infinite] delay-1000"/></div>;
      case 'stars': return <div className="absolute inset-0 pointer-events-none"><Sparkles className="absolute top-1/4 left-1/4 text-yellow-400 w-12 h-12 animate-pulse"/><Sparkles className="absolute top-1/3 right-1/4 text-yellow-300 w-16 h-16 animate-spin"/></div>;
      default: return null; 
    }
  };

  if (!event) return null;

  if (status === 'locked') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
        <button onClick={onBack} className="absolute top-6 left-6 text-slate-500 hover:text-white transition">Exit Preview</button>
        <Lock size={64} className="mb-6 text-blue-500 animate-pulse" />
        <h1 className="text-3xl font-bold mb-2">Not Yet!</h1>
        <p className="text-slate-400 mb-8">This surprise for {event.recipientName} is locked until {new Date(event.unlockDate).toLocaleDateString()}.</p>
        <div className="text-5xl md:text-7xl font-mono font-bold tracking-wider text-blue-400">{timeLeft}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden relative">
      <button onClick={onBack} className="fixed top-6 left-6 z-50 bg-white/50 p-2 rounded-full hover:bg-white transition flex items-center gap-2 font-bold shadow-sm">{event.isPreview ? "Exit Preview" : "Exit"}</button>
      
      {/* Animation Container */}
      <AnimationElement />

      <div className="h-screen flex flex-col items-center justify-center text-center p-6 relative">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-4 animate-fadeIn">Happy Birthday, <span className="text-blue-600">{event.recipientName}!</span></h1>
        <p className="text-xl text-slate-500 mb-10 max-w-lg animate-fadeIn">Surprise! Everyone you love has sent you a message. Scroll down to see them.</p>
        
        <div className="relative w-64 h-64 md:w-80 md:h-80">
          {event.theme === 'travel' ? (
             <div className={`transition-all duration-[3000ms] ease-out ${flying ? 'translate-x-full -translate-y-20' : '-translate-x-full translate-y-20'}`}><Plane size={120} className="text-blue-500" /></div>
          ) : (
            <div className={`transition-all duration-[2000ms] ${flying ? 'scale-125 opacity-0' : 'scale-0'}`}><Gift size={120} className="text-pink-500 mx-auto" /></div>
          )}
        </div>
        <div className="absolute bottom-10 animate-bounce text-slate-400">Scroll for Wishes ↓</div>
      </div>

      <div className="max-w-4xl mx-auto p-6 pb-20">
        <h2 className="text-2xl font-bold mb-8 text-center flex items-center justify-center gap-2"><Heart className="text-red-500 fill-red-500" /> From All of Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {wishes.map(msg => (
             <div key={msg.id} className={`${msg.color || 'bg-white'} p-6 rounded-2xl shadow-sm hover:scale-[1.02] transition duration-300`}>
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center font-bold text-slate-700">{msg.name[0]}</div><span className="font-bold text-slate-800">{msg.name}</span></div>
                {msg.image && <img src={msg.image} className="w-full h-auto rounded-lg mb-4 shadow-sm" />}
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{msg.text}</p>
             </div>
          ))}
        </div>

        {event.creatorMessage && (
          <div className="max-w-2xl mx-auto mt-20 mb-20">
            {(!creatorUnlocked) ? (
              <div className="bg-slate-900 text-white rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                <Lock size={48} className="mx-auto mb-4 text-blue-400 relative z-10" />
                <h3 className="text-2xl font-bold mb-2 relative z-10">One Last Surprise</h3>
                <p className="text-slate-400 mb-6 relative z-10">I have written a special letter for you{event.isQuizEnabled ? ", but you need to answer a few questions first." : "."}</p>
                <button onClick={() => event.isQuizEnabled ? setQuizOpen(true) : handleDirectUnlock()} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition shadow-lg shadow-blue-500/30 relative z-10">Unlock Secret Message</button>
              </div>
            ) : (
              <div className="bg-white border-2 border-blue-100 rounded-3xl p-8 md:p-12 shadow-xl animate-fadeIn relative overflow-hidden">
                {/* Bouquet Decorations inside the unlocked card */}
                <div className="absolute bottom-0 right-0 pointer-events-none transform translate-y-10 translate-x-10 opacity-80">
                   <div className="relative w-48 h-48 animate-[bloom_1.5s_ease-out_forwards]">
                      <Flower className="absolute bottom-12 right-12 text-pink-500 w-24 h-24 rotate-[-12deg]" />
                      <Flower className="absolute bottom-4 right-20 text-purple-400 w-20 h-20 rotate-[-45deg]" />
                      <Flower className="absolute bottom-20 right-4 text-red-400 w-16 h-16 rotate-[15deg]" />
                      <Flower className="absolute bottom-8 right-8 text-yellow-400 w-12 h-12 rotate-[0deg] z-10" />
                   </div>
                </div>

                <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-2 rounded-lg rotate-12 shadow-lg z-20"><Unlock size={24} /></div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-6 text-slate-800 text-center">{event.secretTitle || "My Letter to You"}</h3>
                  {event.creatorImage && <img src={event.creatorImage} className="w-full h-64 object-cover rounded-xl mb-6 shadow-sm" />}
                  <div className="prose prose-slate mx-auto whitespace-pre-wrap leading-relaxed text-lg text-slate-700 mb-12">{event.creatorMessage}</div>
                  <div className="mt-8 text-center"><Heart className="mx-auto text-red-500 fill-red-500 animate-bounce" /></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {quizOpen && event.quizQuestions && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 text-center relative animate-scaleIn overflow-hidden">
            <button onClick={() => setQuizOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full z-10"><X size={20}/></button>
            
            {/* Quiz Progress Bar */}
            <div className="h-1 w-full bg-slate-100 absolute top-0 left-0">
              <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${((quizStep + (quizFinished ? 1 : 0)) / event.quizQuestions.length) * 100}%` }}
              ></div>
            </div>

            {!quizFinished ? (
              // --- QUESTION VIEW ---
              <>
                <div className="mb-6 mt-4">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase">Question {quizStep + 1} of {event.quizQuestions.length}</span>
                </div>
                
                <h3 className="text-xl font-bold mb-6 text-slate-900">{event.quizQuestions[quizStep].text}</h3>
                
                <div className="grid gap-3">
                  {event.quizQuestions[quizStep].options.map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleQuizAnswer(opt)}
                      className="p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition font-medium text-slate-700 text-left"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              // --- RESULT VIEW ---
              <div className="flex flex-col items-center justify-center py-6 animate-fadeIn">
                {score / event.quizQuestions.length >= 0.7 ? (
                  <>
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">You Passed! 🎉</h3>
                    <p className="text-slate-500 mb-6">
                      You got {score} out of {event.quizQuestions.length} correct.
                    </p>
                    <button 
                      onClick={handleUnlockSequence}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-green-200 transition transform hover:scale-105"
                    >
                      Reveal Message
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                      <XCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Nice Try! 😅</h3>
                    <p className="text-slate-500 mb-6">
                      You scored {Math.round((score / event.quizQuestions.length) * 100)}%.<br/>
                      You need 70% to unlock the secret.
                    </p>
                    <button 
                      onClick={handleRetryQuiz}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition"
                    >
                      <RotateCcw size={18} /> Try Again
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 1s ease-out forwards; } .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; } @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } } @keyframes floatUp { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-100vh) scale(1.5); opacity: 0; } } @keyframes bloom { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
};