import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Gift, Users, ArrowRight, Layout, LogIn } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- APP COMPONENT (The Shell) ---
export default function App() {
  // 1. ROUTING STATE: Controls which "Page" is visible
  // Options: 'landing', 'dashboard', 'create-event', 'guestbook', 'recipient-view'
  const [currentView, setCurrentView] = useState('landing');
  
  // 2. AUTH STATE: Who is the current user?
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth
  useEffect(() => {
    // In a real SaaS, you'd use Google Auth. For this demo, we use Anon + Profile Update
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    // Simulating a login flow
    try {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        // This is specific to the preview environment
         const { user } = await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        const { user } = await signInAnonymously(auth);
      }
      // After login, go to dashboard
      setCurrentView('dashboard');
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  // --- RENDER CURRENT VIEW ---
  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onLogin={handleLogin} user={user} goToDashboard={() => setCurrentView('dashboard')} />;
      case 'dashboard':
        return <Dashboard user={user} onCreateClick={() => setCurrentView('create-event')} />;
      case 'create-event':
        return <CreateEventPlaceholder onCancel={() => setCurrentView('dashboard')} />;
      default:
        return <LandingPage onLogin={handleLogin} />;
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading Platform...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Universal Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
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
              className={`text-sm font-medium ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-500'}`}
            >
              My Dashboard
            </button>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
              {user.uid.slice(0, 2).toUpperCase()}
            </div>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="text-sm font-semibold text-slate-600 hover:text-blue-600"
          >
            Sign In
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main>
        {renderView()}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS (PAGES) ---

// 1. LANDING PAGE
const LandingPage = ({ onLogin, user, goToDashboard }) => (
  <div className="flex flex-col items-center justify-center pt-20 px-6 text-center">
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
    
    {user ? (
       <button 
        onClick={goToDashboard}
        className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-xl shadow-blue-200"
      >
        Go to Dashboard <ArrowRight size={20} />
      </button>
    ) : (
      <button 
        onClick={onLogin}
        className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition flex items-center gap-2 shadow-xl"
      >
        Get Started for Free <ArrowRight size={20} />
      </button>
    )}

    {/* Feature Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full max-w-5xl">
      <FeatureCard 
        icon={<Layout />} 
        title="Custom Themes" 
        desc="Choose from Travel, Party, or Minimalist themes to match their vibe." 
      />
      <FeatureCard 
        icon={<Users />} 
        title="Group Wishes" 
        desc="Share one link. Friends add text, photos, and voice notes instantly." 
      />
      <FeatureCard 
        icon={<Calendar />} 
        title="Time Capsule" 
        desc="Lock the greeting. It only opens when the clock strikes midnight." 
      />
    </div>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
    <div className="bg-slate-50 w-12 h-12 rounded-lg flex items-center justify-center text-slate-700 mb-4">
      {icon}
    </div>
    <h3 className="font-bold text-lg mb-2">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

// 2. DASHBOARD (Placeholder)
const Dashboard = ({ user, onCreateClick }) => (
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

    {/* Empty State for now */}
    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
        <Gift size={32} />
      </div>
      <h3 className="font-bold text-slate-900 mb-1">No greetings created yet</h3>
      <p className="text-slate-500 mb-6 max-w-xs">Start by creating a new event for a birthday, anniversary, or farewell.</p>
    </div>
  </div>
);

// 3. CREATE EVENT (Placeholder)
const CreateEventPlaceholder = ({ onCancel }) => (
  <div className="max-w-2xl mx-auto py-10 px-6">
    <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-800 mb-6">← Back to Dashboard</button>
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Create New Greeting</h2>
      <p className="text-slate-500 italic">This is where the form will go in Step 2!</p>
    </div>
  </div>
);