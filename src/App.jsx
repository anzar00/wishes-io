import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Gift, Users, ArrowRight, Layout, Trash2, CheckCircle, Clock, Edit, Share2, Send, Image as ImageIcon, X, Upload, Eye, Lock, Unlock, Heart, Plane, Music, MessageCircle, Link, Copy, Check, LogOut } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, orderBy, getDoc, deleteDoc } from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- APP COMPONENT (The Shell) ---
export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Track active event
  const [activeEvent, setActiveEvent] = useState(null);
  // Track event for Share Modal
  const [shareEvent, setShareEvent] = useState(null);

  // 1. Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Only stop loading if we aren't waiting for a URL redirect (handled below)
      if (!window.location.search) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. URL Routing Logic (Handle shared links)
  useEffect(() => {
    const handleUrlRouting = async () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode'); // 'guest' or 'recipient'
      const eventId = params.get('eventId');

      if (eventId && (mode === 'guest' || mode === 'recipient')) {
        // We don't force login here immediately, we let the specific view handle the "Sign In" CTA
        try {
          const docRef = doc(db, 'events', eventId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setActiveEvent({ id: docSnap.id, ...docSnap.data() });
            setCurrentView(mode === 'guest' ? 'guestbook' : 'recipient-view');
          } else {
            alert("Event not found!");
            setCurrentView('landing');
          }
        } catch (error) {
          console.error("Routing error:", error);
        }
      }
      setLoading(false);
    };

    handleUrlRouting();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // If we are on landing, go to dashboard. If on guestbook, stay there.
      if (currentView === 'landing') setCurrentView('dashboard');
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentView('landing');
  };

  // View Router
  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onLogin={handleLogin} user={user} goToDashboard={() => setCurrentView('dashboard')} />;
      case 'dashboard':
        return (
          <Dashboard 
            user={user} 
            onCreateClick={() => { setActiveEvent(null); setCurrentView('create-event'); }}
            onEditClick={(event) => { setActiveEvent(event); setCurrentView('create-event'); }}
            onViewGuestbook={(event) => { setActiveEvent(event); setCurrentView('guestbook'); }}
            onViewRecipient={(event) => { setActiveEvent(event); setCurrentView('recipient-view'); }}
            onShareClick={(event) => setShareEvent(event)}
          />
        );
      case 'create-event':
        return (
          <CreateEvent 
            user={user} 
            initialData={activeEvent}
            onCancel={() => { setActiveEvent(null); setCurrentView('dashboard'); }} 
            onSave={() => { setActiveEvent(null); setCurrentView('dashboard'); }} 
          />
        );
      case 'guestbook':
        return (
          <Guestbook 
            event={activeEvent} 
            user={user}
            onLogin={handleLogin}
            // If user arrived via link, 'Back' goes to landing, else dashboard
            onBack={() => { 
               if (window.location.search) window.location.href = window.location.origin;
               else { setActiveEvent(null); setCurrentView('dashboard'); }
            }}
          />
        );
      case 'recipient-view':
        return (
          <RecipientView 
            event={activeEvent}
            onBack={() => { 
              if (window.location.search) window.location.href = window.location.origin;
              else { setActiveEvent(null); setCurrentView('dashboard'); }
           }}
          />
        );
      default:
        return <LandingPage onLogin={handleLogin} />;
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500">Loading Wishes.io...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Hide header in Recipient View for immersion */}
      {currentView !== 'recipient-view' && (
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <div 
            className="flex items-center gap-2 font-bold text-xl text-blue-600 cursor-pointer"
            onClick={() => window.location.href = '/'}
          >
            <Gift className="fill-blue-100" /> Wishes.io
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setActiveEvent(null); setCurrentView('dashboard'); }}
                className={`text-sm font-medium transition ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                My Dashboard
              </button>
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} className="w-8 h-8 rounded-full border border-slate-200" alt="User" />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500" title="Sign Out">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleLogin} className="text-sm font-semibold text-slate-600 hover:text-blue-600">Sign In</button>
          )}
        </header>
      )}

      <main>{renderView()}</main>

      {/* SHARE MODAL OVERLAY */}
      {shareEvent && (
        <ShareModal 
          event={shareEvent} 
          onClose={() => setShareEvent(null)} 
        />
      )}
    </div>
  );
}

// --- SHARE MODAL COMPONENT ---
const ShareModal = ({ event, onClose }) => {
  const origin = window.location.origin; // e.g., http://localhost:5173 or https://your-app.vercel.app
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
          {/* Guest Link Section */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-sm uppercase">
              <Users size={16}/> Guest Link
            </div>
            <p className="text-xs text-blue-600 mb-3">Share this with friends to collect wishes.</p>
            <div className="flex gap-2">
              <input readOnly value={guestLink} className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none" />
              <CopyButton text={guestLink} />
            </div>
          </div>

          {/* Recipient Link Section */}
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
             <div className="flex items-center gap-2 mb-2 text-purple-800 font-bold text-sm uppercase">
              <Gift size={16}/> Recipient Link
            </div>
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

// --- 1. LANDING PAGE ---
const LandingPage = ({ onLogin, user, goToDashboard }) => (
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

// --- 2. DASHBOARD ---
const Dashboard = ({ user, onCreateClick, onEditClick, onViewGuestbook, onViewRecipient, onShareClick }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'events'), where('creatorId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your Occasions</h2>
          <p className="text-slate-500">Manage your created greetings</p>
        </div>
        <button 
          onClick={onCreateClick}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200"
        >
          <Plus size={18} /> New Greeting
        </button>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
            <Gift size={32} />
          </div>
          <h3 className="font-bold text-slate-900 mb-1">No greetings created yet</h3>
          <p className="text-slate-500 mb-6 max-w-xs">Start by creating a new event for a birthday, anniversary, or farewell.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map(event => (
            <div key={event.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="font-bold text-lg text-slate-900">{event.title}</h3>
                   <p className="text-slate-500 text-sm">For: {event.recipientName}</p>
                </div>
                <div className="flex items-start gap-1">
                   <button onClick={() => onShareClick(event)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Get Share Links">
                     <Link size={18} />
                   </button>
                   <button onClick={() => onViewGuestbook(event)} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Preview Guestbook">
                     <Users size={18} />
                   </button>
                   <button onClick={() => onViewRecipient(event)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Preview Recipient View">
                     <Eye size={18} />
                   </button>
                   <button onClick={() => onEditClick(event)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition" title="Edit Event">
                     <Edit size={18} />
                   </button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 mt-4 border-t border-slate-100 pt-4">
                 <div className="flex items-center gap-1"><Calendar size={14}/> {new Date(event.unlockDate).toLocaleDateString()}</div>
                 <div className="flex items-center gap-1"><Clock size={14}/> {new Date(event.unlockDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- 3. CREATE / EDIT EVENT FORM ---
const CreateEvent = ({ user, onCancel, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    recipientName: initialData?.recipientName || '',
    unlockDate: initialData?.unlockDate || '',
    timezone: initialData?.timezone || 'UTC',
    theme: initialData?.theme || 'birthday',
    creatorMessage: initialData?.creatorMessage || '',
  });
  
  const [questions, setQuestions] = useState(
    initialData?.quizQuestions || [
      { id: 1, text: "What is my favorite food?", options: ["Pizza", "Sushi", "Tacos", "Burger"], correct: "Pizza" }
    ]
  );
  
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.recipientName || !formData.unlockDate) return;
    setSaving(true);
    try {
      const data = { ...formData, quizQuestions: questions, creatorId: user.uid, createdAt: serverTimestamp() };
      if (initialData?.id) {
        await updateDoc(doc(db, 'events', initialData.id), data);
      } else {
        await addDoc(collection(db, 'events'), data);
      }
      onSave(); 
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const updateQuestion = (id, field, value) => setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  const updateOption = (qId, idx, val) => setQuestions(questions.map(q => q.id === qId ? { ...q, options: q.options.map((o, i) => i === idx ? val : o) } : q));

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 pb-20">
      <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-800 mb-6 flex items-center gap-1">← Back to Dashboard</button>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
           <h2 className="text-2xl font-bold text-slate-900">{initialData ? 'Edit Greeting' : 'Create New Greeting'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Section 1: Basics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-slate-500 uppercase">Title</label><input className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Recipient</label><input className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200" value={formData.recipientName} onChange={e => setFormData({...formData, recipientName: e.target.value})} required /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Unlock Date</label><input type="datetime-local" className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200" value={formData.unlockDate} onChange={e => setFormData({...formData, unlockDate: e.target.value})} required /></div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Theme</label>
              <select className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200" value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})}>
                <option value="birthday">🎉 Birthday</option>
                <option value="travel">✈️ Travel</option>
                <option value="minimal">✨ Minimal</option>
              </select>
            </div>
          </div>

          <hr className="border-slate-100"/>
          
          {/* Section 2: Creator Message */}
          <div>
            <h3 className="font-bold mb-2 flex items-center gap-2"><MessageCircle size={18} className="text-blue-500"/> Your Private Letter</h3>
            <p className="text-sm text-slate-500 mb-2">This message will be locked behind the quiz. The guestbook wishes will be visible to everyone once the timer unlocks.</p>
            <textarea 
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 h-32 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Write your personal birthday letter here..."
              value={formData.creatorMessage}
              onChange={e => setFormData({...formData, creatorMessage: e.target.value})}
            />
          </div>

          <hr className="border-slate-100"/>

          {/* Section 3: Quiz */}
          <div className="space-y-4">
            <div className="flex justify-between"><h3 className="font-bold flex items-center gap-2"><Lock size={18} className="text-green-500"/> Quiz Lock</h3><button type="button" onClick={() => setQuestions([...questions, {id: Date.now(), text:'', options:['','','',''], correct:''}])} className="text-blue-600 text-sm flex items-center gap-1"><Plus size={16}/> Add Question</button></div>
            <p className="text-sm text-slate-500">The recipient must answer these to unlock <b>your private letter</b>.</p>
            {questions.map((q, i) => (
              <div key={q.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input placeholder={`Question ${i+1}`} className="w-full bg-transparent font-bold mb-2 outline-none" value={q.text} onChange={e => updateQuestion(q.id, 'text', e.target.value)} />
                <div className="grid grid-cols-2 gap-2 mb-2">{q.options.map((o, idx) => <input key={idx} placeholder={`Option ${idx+1}`} className="p-2 border rounded" value={o} onChange={e => updateOption(q.id, idx, e.target.value)} />)}</div>
                <select className="w-full p-2 border rounded" value={q.correct} onChange={e => updateQuestion(q.id, 'correct', e.target.value)}><option value="">Select Correct Answer</option>{q.options.map((o, idx) => o && <option key={idx} value={o}>{o}</option>)}</select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={onCancel} className="px-6 py-3 text-slate-500">Cancel</button><button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold">{saving ? 'Saving...' : 'Save Event'}</button></div>
        </form>
      </div>
    </div>
  );
};

// --- 4. GUESTBOOK ---
const Guestbook = ({ event, user, onBack, onLogin }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ name: '', text: '', image: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingWish, setEditingWish] = useState(null); // Track if editing a specific wish

  useEffect(() => {
    if (!event) return;
    const q = query(collection(db, 'events', event.id, 'wishes'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => setMessages(snap.docs.map(d => ({id: d.id, ...d.data()}))));
  }, [event]);

  // Open Form for Editing
  const handleEditClick = (msg) => {
    setEditingWish(msg);
    setNewMessage({ name: msg.name, text: msg.text, image: msg.image || '' });
    setIsFormOpen(true);
  };

  // Open Form for New Wish
  const handleNewClick = () => {
    setEditingWish(null);
    setNewMessage({ 
      name: user ? (user.displayName || user.email.split('@')[0]) : '', 
      text: '', 
      image: '' 
    });
    setIsFormOpen(true);
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 800 / Math.max(img.width, img.height);
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setNewMessage(prev => ({...prev, image: canvas.toDataURL('image/jpeg', 0.7)}));
        setUploading(false);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!user) return; // Should catch this before button click ideally

    try {
      if (editingWish) {
        // --- UPDATE EXISTING WISH ---
        const wishRef = doc(db, 'events', event.id, 'wishes', editingWish.id);
        await updateDoc(wishRef, {
          name: newMessage.name,
          text: newMessage.text,
          image: newMessage.image,
          updatedAt: serverTimestamp()
        });
      } else {
        // --- CREATE NEW WISH ---
        await addDoc(collection(db, 'events', event.id, 'wishes'), {
          ...newMessage, 
          userId: user.uid, // Store who posted it
          userPhoto: user.photoURL,
          createdAt: serverTimestamp(), 
          color: `bg-${['pink','blue','purple','yellow','green'][Math.floor(Math.random()*5)]}-100`
        });
      }
      setNewMessage({name:'', text:'', image:''}); 
      setIsFormOpen(false);
      setEditingWish(null);
    } catch(err) {
      console.error(err);
      alert("Error saving wish");
    }
  };

  const handleDelete = async (wishId) => {
    if(!confirm("Are you sure you want to delete this wish?")) return;
    try {
      await deleteDoc(doc(db, 'events', event.id, 'wishes', wishId));
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 px-6 py-6 sticky top-0 z-40 flex justify-between items-center">
        <div><button onClick={onBack} className="text-sm text-slate-500 mb-1">← Back</button><h1 className="text-2xl font-bold">{event.title}</h1></div>
        
        {user ? (
          <button onClick={handleNewClick} className="bg-slate-900 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition">
            <Plus size={18}/> Add Wish
          </button>
        ) : (
          <button onClick={onLogin} className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-blue-700 transition">
            Sign in to Post
          </button>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {messages.map(msg => (
          <div key={msg.id} className={`${msg.color} p-6 rounded-2xl relative group`}>
            {/* Edit/Delete Controls for Owner */}
            {user && msg.userId === user.uid && (
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEditClick(msg)}
                  className="p-1.5 bg-white/50 hover:bg-white rounded-full text-slate-600"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(msg.id)}
                  className="p-1.5 bg-white/50 hover:bg-white rounded-full text-red-500"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            <div className="font-bold mb-2 flex items-center gap-2">
              <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center overflow-hidden">
                {msg.userPhoto ? (
                  <img src={msg.userPhoto} alt={msg.name} className="w-full h-full object-cover"/>
                ) : (
                  msg.name[0]
                )}
              </div> 
              {msg.name}
            </div>
            {msg.image && <img src={msg.image} className="w-full h-48 object-cover rounded-lg mb-3" />}
            <p className="whitespace-pre-wrap">{msg.text}</p>
          </div>
        ))}
      </div>
      
      {/* ADD/EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-xl mb-4">{editingWish ? 'Edit Your Wish' : 'Add Wish'}</h3>
            <input className="w-full p-3 bg-slate-50 rounded-lg mb-3" placeholder="Name" value={newMessage.name} onChange={e => setNewMessage({...newMessage, name: e.target.value})} />
            <textarea className="w-full p-3 bg-slate-50 rounded-lg mb-3 h-24" placeholder="Message" value={newMessage.text} onChange={e => setNewMessage({...newMessage, text: e.target.value})} />
            <div className="relative mb-4">
               <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"/>
               <div className="p-3 bg-slate-50 border-2 border-dashed rounded-lg text-center text-slate-500">{uploading ? 'Compressing...' : newMessage.image ? 'Image Added!' : 'Upload Photo'}</div>
            </div>
            <button onClick={handlePost} disabled={uploading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">
              {editingWish ? 'Update Wish' : 'Post Wish'}
            </button>
            <button onClick={() => setIsFormOpen(false)} className="w-full mt-2 text-slate-400 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 5. RECIPIENT VIEW (THE FINAL EXPERIENCE) ---
const RecipientView = ({ event, onBack }) => {
  const [status, setStatus] = useState('loading'); // loading, locked, unlocked
  const [timeLeft, setTimeLeft] = useState('');
  
  // Specific States for Creator Letter
  const [quizOpen, setQuizOpen] = useState(false);
  const [creatorUnlocked, setCreatorUnlocked] = useState(false);
  const [quizStep, setQuizStep] = useState(0);

  const [wishes, setWishes] = useState([]);
  const [flying, setFlying] = useState(false);

  // Check Lock Status (Time Only)
  useEffect(() => {
    if (!event) return;
    const checkTime = () => {
      const now = new Date();
      const unlock = new Date(event.unlockDate);
      if (now >= unlock) {
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

  // Load Wishes (Only if unlocked)
  useEffect(() => {
    if (status === 'unlocked') {
      setTimeout(() => setFlying(true), 500);
      const q = query(collection(db, 'events', event.id, 'wishes'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => setWishes(snap.docs.map(d => ({id: d.id, ...d.data()}))));
      return () => unsub();
    }
  }, [status, event]);

  const handleQuizAnswer = (ans) => {
    if (ans === event.quizQuestions[quizStep].correct) {
      if (quizStep + 1 < event.quizQuestions.length) setQuizStep(s => s + 1);
      else {
        setCreatorUnlocked(true);
        setQuizOpen(false);
      }
    } else {
      alert("Oops! Wrong answer. Try again! 🙈");
    }
  };

  if (!event) return null;

  // --- VIEW 1: TIME LOCKED ---
  if (status === 'locked') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
        <button onClick={onBack} className="absolute top-6 left-6 text-slate-500 hover:text-white transition">Exit Preview</button>
        <Lock size={64} className="mb-6 text-blue-500 animate-pulse" />
        <h1 className="text-3xl font-bold mb-2">Not Yet!</h1>
        <p className="text-slate-400 mb-8">This surprise for {event.recipientName} is locked until {new Date(event.unlockDate).toLocaleDateString()}.</p>
        <div className="text-5xl md:text-7xl font-mono font-bold tracking-wider text-blue-400">
          {timeLeft}
        </div>
      </div>
    );
  }

  // --- VIEW 2: UNLOCKED (Wishes + Locked Creator Letter) ---
  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <button onClick={onBack} className="fixed top-6 left-6 z-50 bg-white/50 p-2 rounded-full hover:bg-white transition">Exit</button>
      
      {/* Hero Animation */}
      <div className="h-screen flex flex-col items-center justify-center text-center p-6 relative">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-4 animate-fadeIn">
          Happy Birthday, <span className="text-blue-600">{event.recipientName}!</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-lg animate-fadeIn">
          Surprise! Everyone you love has sent you a message. Scroll down to see them.
        </p>
        
        {/* Animated Element */}
        <div className="relative w-64 h-64 md:w-80 md:h-80">
          {event.theme === 'travel' ? (
             <div className={`transition-all duration-[3000ms] ease-out ${flying ? 'translate-x-full -translate-y-20' : '-translate-x-full translate-y-20'}`}>
                <Plane size={120} className="text-blue-500" />
             </div>
          ) : (
            <div className={`transition-all duration-[2000ms] ${flying ? 'scale-125 opacity-0' : 'scale-0'}`}>
               <Gift size={120} className="text-pink-500 mx-auto" />
            </div>
          )}
        </div>
        <div className="absolute bottom-10 animate-bounce text-slate-400">
           Scroll for Wishes ↓
        </div>
      </div>

      {/* Wishes Wall */}
      <div className="max-w-4xl mx-auto p-6 pb-20">
        <h2 className="text-2xl font-bold mb-8 text-center flex items-center justify-center gap-2">
          <Heart className="text-red-500 fill-red-500" /> From All of Us
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {wishes.map(msg => (
             <div key={msg.id} className={`${msg.color || 'bg-white'} p-6 rounded-2xl shadow-sm hover:scale-[1.02] transition duration-300`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center font-bold text-slate-700">
                     {msg.userPhoto ? (
                      <img src={msg.userPhoto} alt={msg.name} className="w-full h-full object-cover"/>
                    ) : (
                      msg.name[0]
                    )}
                  </div>
                  <span className="font-bold text-slate-800">{msg.name}</span>
                </div>
                {msg.image && <img src={msg.image} className="w-full h-auto rounded-lg mb-4 shadow-sm" />}
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{msg.text}</p>
             </div>
          ))}
        </div>

        {/* --- CREATOR'S SPECIAL LOCKED MESSAGE --- */}
        {event.creatorMessage && (
          <div className="max-w-2xl mx-auto mt-20 mb-20">
            {!creatorUnlocked ? (
              <div className="bg-slate-900 text-white rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                <Lock size={48} className="mx-auto mb-4 text-blue-400 relative z-10" />
                <h3 className="text-2xl font-bold mb-2 relative z-10">One Last Surprise</h3>
                <p className="text-slate-400 mb-6 relative z-10">I have written a special letter for you, but you need to answer a few questions first.</p>
                <button 
                  onClick={() => setQuizOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition shadow-lg shadow-blue-500/30 relative z-10"
                >
                  Unlock Secret Message
                </button>
              </div>
            ) : (
              <div className="bg-white border-2 border-blue-100 rounded-3xl p-8 md:p-12 shadow-xl animate-fadeIn relative">
                <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-2 rounded-lg rotate-12 shadow-lg">
                  <Unlock size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-slate-800 text-center">My Letter to You</h3>
                <div className="prose prose-slate mx-auto whitespace-pre-wrap leading-relaxed text-lg text-slate-700">
                  {event.creatorMessage}
                </div>
                <div className="mt-8 text-center">
                  <Heart className="mx-auto text-red-500 fill-red-500 animate-bounce" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QUIZ MODAL */}
      {quizOpen && event.quizQuestions && event.quizQuestions.length > 0 && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 text-center relative animate-scaleIn">
            <button onClick={() => setQuizOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            
            <div className="mb-6">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase">Question {quizStep + 1} of {event.quizQuestions.length}</span>
            </div>
            
            <h3 className="text-xl font-bold mb-6 text-slate-900">{event.quizQuestions[quizStep].text}</h3>
            
            <div className="grid gap-3">
              {event.quizQuestions[quizStep].options.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => handleQuizAnswer(opt)}
                  className="p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition font-medium text-slate-700"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 1s ease-out forwards; } .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; } @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
};