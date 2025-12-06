import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Gift, Users, ArrowRight, Layout, Trash2, CheckCircle, Clock, Edit } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

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
  
  // Track which event is being edited (null = creating new)
  const [editingEvent, setEditingEvent] = useState(null);

  // Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInAnonymously(auth);
      setCurrentView('dashboard');
    } catch (error) {
      console.error("Login failed", error);
    }
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
            onCreateClick={() => {
              setEditingEvent(null); // Clear editing state for new event
              setCurrentView('create-event');
            }}
            onEditClick={(event) => {
              setEditingEvent(event); // Set event to edit
              setCurrentView('create-event');
            }}
          />
        );
      case 'create-event':
        return (
          <CreateEvent 
            user={user} 
            initialData={editingEvent} // Pass data if editing
            onCancel={() => {
              setEditingEvent(null);
              setCurrentView('dashboard');
            }} 
            onSave={() => {
              setEditingEvent(null);
              setCurrentView('dashboard');
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
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div 
          className="flex items-center gap-2 font-bold text-xl text-blue-600 cursor-pointer"
          onClick={() => setCurrentView('landing')}
        >
          <Gift className="fill-blue-100" /> Wishes.io
        </div>
        
        {user ? (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`text-sm font-medium transition ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              My Dashboard
            </button>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
              {user.uid.slice(0, 2).toUpperCase()}
            </div>
          </div>
        ) : (
          <button onClick={handleLogin} className="text-sm font-semibold text-slate-600 hover:text-blue-600">Sign In</button>
        )}
      </header>

      <main>{renderView()}</main>
    </div>
  );
}

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
      {user ? "Go to Dashboard" : "Get Started for Free"} <ArrowRight size={20} />
    </button>
  </div>
);

// --- 2. DASHBOARD ---
const Dashboard = ({ user, onCreateClick, onEditClick }) => {
  const [events, setEvents] = useState([]);

  // Fetch events from Firestore where creatorId matches current user
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'events'),
      where('creatorId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(eventsData);
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
                <div className="flex items-start gap-2">
                   <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-bold uppercase">{event.theme}</span>
                   <button 
                    onClick={() => onEditClick(event)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Event"
                   >
                     <Edit size={16} />
                   </button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 mt-4 border-t border-slate-100 pt-4">
                 <div className="flex items-center gap-1"><Calendar size={14}/> {new Date(event.unlockDate).toLocaleDateString()}</div>
                 <div className="flex items-center gap-1"><Clock size={14}/> {new Date(event.unlockDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({event.timezone || 'UTC'})</div>
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
  // Initialize state with default values OR values from initialData if editing
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    recipientName: initialData?.recipientName || '',
    unlockDate: initialData?.unlockDate || '',
    timezone: initialData?.timezone || 'UTC',
    theme: initialData?.theme || 'birthday',
  });
  
  const [questions, setQuestions] = useState(
    initialData?.quizQuestions || [
      { id: 1, text: "What is my favorite food?", options: ["Pizza", "Sushi", "Tacos", "Burger"], correct: "Pizza" }
    ]
  );
  
  const [saving, setSaving] = useState(false);

  const timezones = [
    { value: 'UTC', label: 'UTC (Universal)' },
    { value: 'IST', label: 'IST (India)' },
    { value: 'CET', label: 'CET (Central Europe)' },
    { value: 'EST', label: 'EST (US Eastern)' },
    { value: 'PST', label: 'PST (US Pacific)' },
    { value: 'GMT', label: 'GMT (UK)' },
    { value: 'BST', label: 'BST (British Summer)' },
    { value: 'JST', label: 'JST (Japan)' },
    { value: 'AEDT', label: 'AEDT (Australia East)' },
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addQuestion = () => {
    const newId = questions.length + 1;
    setQuestions([...questions, { id: newId, text: "", options: ["", "", "", ""], correct: "" }]);
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateOption = (qId, optIndex, value) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      const newOptions = [...q.options];
      newOptions[optIndex] = value;
      return { ...q, options: newOptions };
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.recipientName || !formData.unlockDate) return;
    
    setSaving(true);
    try {
      if (initialData && initialData.id) {
        // --- EDIT MODE: UPDATE EXISTING ---
        const eventRef = doc(db, 'events', initialData.id);
        await updateDoc(eventRef, {
          ...formData,
          quizQuestions: questions,
          updatedAt: serverTimestamp()
        });
      } else {
        // --- CREATE MODE: ADD NEW ---
        await addDoc(collection(db, 'events'), {
          ...formData,
          creatorId: user.uid,
          quizQuestions: questions,
          createdAt: serverTimestamp()
        });
      }
      onSave(); 
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event. Check console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 pb-20">
      <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-800 mb-6 flex items-center gap-1">← Back to Dashboard</button>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
           <h2 className="text-2xl font-bold text-slate-900">{initialData ? 'Edit Greeting' : 'Create New Greeting'}</h2>
           <p className="text-slate-500">{initialData ? 'Update the details below.' : 'Configure the basics and set the lock.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Gift size={20} className="text-blue-500"/> The Basics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Title</label>
                <input 
                  name="title" 
                  value={formData.title} 
                  required 
                  placeholder="e.g. Sarah's 25th" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  onChange={handleInputChange} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recipient Name</label>
                <input 
                  name="recipientName" 
                  value={formData.recipientName} 
                  required 
                  placeholder="e.g. Sarah" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  onChange={handleInputChange} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unlock Date & Time</label>
                <div className="flex gap-2">
                  <input 
                    name="unlockDate" 
                    type="datetime-local" 
                    value={formData.unlockDate} 
                    required 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    onChange={handleInputChange} 
                  />
                  <select 
                    name="timezone" 
                    className="w-24 md:w-32 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                    onChange={handleInputChange} 
                    value={formData.timezone}
                  >
                    {timezones.map(tz => <option key={tz.value} value={tz.value}>{tz.value}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Theme</label>
                <select 
                  name="theme" 
                  value={formData.theme} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  onChange={handleInputChange}
                >
                  <option value="birthday">🎉 Birthday Party</option>
                  <option value="travel">✈️ Travel / Long Distance</option>
                  <option value="minimal">✨ Minimalist</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: The Quiz */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h3 className="font-bold text-lg flex items-center gap-2"><CheckCircle size={20} className="text-green-500"/> The Quiz Lock</h3>
               <button type="button" onClick={addQuestion} className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1"><Plus size={16}/> Add Question</button>
            </div>
            <p className="text-sm text-slate-500 bg-blue-50 p-3 rounded-lg">
              The recipient must answer these correctly to unlock their greeting.
            </p>

            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div key={q.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                  <div className="mb-3">
                    <input 
                      placeholder={`Question #${qIdx + 1}`}
                      className="w-full bg-transparent font-semibold placeholder:text-slate-400 focus:outline-none border-b border-transparent focus:border-blue-500 pb-1"
                      value={q.text}
                      onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {q.options.map((opt, optIdx) => (
                      <input 
                        key={optIdx}
                        placeholder={`Option ${optIdx + 1}`}
                        className="w-full p-2 bg-white border border-slate-200 rounded text-sm focus:border-blue-500 outline-none"
                        value={opt}
                        onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                      />
                    ))}
                  </div>
                  <div>
                    <select 
                      className="w-full p-2 bg-white border border-slate-200 rounded text-sm text-slate-600"
                      value={q.correct}
                      onChange={(e) => updateQuestion(q.id, 'correct', e.target.value)}
                    >
                      <option value="">Select Correct Answer...</option>
                      {q.options.map((opt, i) => opt && <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  {/* Delete button could go here */}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex justify-end gap-3">
             <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-50 transition">Cancel</button>
             <button disabled={saving} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50">
               {saving ? 'Saving...' : (initialData ? 'Update Event' : 'Create Event')} <ArrowRight size={20}/>
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};