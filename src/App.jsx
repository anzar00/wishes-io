import React, { useState, useEffect } from 'react';
import { Gift, LogOut } from 'lucide-react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

// Import Components
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import CreateEvent from './components/CreateEvent';
import Guestbook from './components/Guestbook';
import RecipientView from './components/RecipientView';
import ShareModal from './components/ShareModal';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState(null);
  const [shareEvent, setShareEvent] = useState(null);

  // Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!window.location.search) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // URL Routing
  useEffect(() => {
    const handleUrlRouting = async () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode'); 
      const eventId = params.get('eventId');

      if (eventId && (mode === 'guest' || mode === 'recipient')) {
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
      if (currentView === 'landing') setCurrentView('dashboard');
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentView('landing');
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      {currentView !== 'recipient-view' && (
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600 cursor-pointer" onClick={() => window.location.href = '/'}>
            <Gift className="fill-blue-100" /> Wishes.io
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <button onClick={() => { setActiveEvent(null); setCurrentView('dashboard'); }} className={`text-sm font-medium transition ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                My Dashboard
              </button>
              <div className="flex items-center gap-2">
                {user.photoURL ? <img src={user.photoURL} className="w-8 h-8 rounded-full border border-slate-200" alt="User" /> : <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">U</div>}
                <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500"><LogOut size={16} /></button>
              </div>
            </div>
          ) : (
            <button onClick={handleLogin} className="text-sm font-semibold text-slate-600 hover:text-blue-600">Sign In</button>
          )}
        </header>
      )}

      {/* Main Content Router */}
      <main>
        {currentView === 'landing' && <LandingPage onLogin={handleLogin} user={user} goToDashboard={() => setCurrentView('dashboard')} />}
        
        {currentView === 'dashboard' && (
          <Dashboard 
            user={user} 
            onCreateClick={() => { setActiveEvent(null); setCurrentView('create-event'); }}
            onEditClick={(event) => { setActiveEvent(event); setCurrentView('create-event'); }}
            onViewGuestbook={(event) => { setActiveEvent(event); setCurrentView('guestbook'); }}
            onViewRecipient={(event) => { setActiveEvent(event); setCurrentView('recipient-view'); }}
            onShareClick={(event) => setShareEvent(event)}
          />
        )}

        {currentView === 'create-event' && (
          <CreateEvent 
            user={user} 
            initialData={activeEvent}
            onCancel={() => { setActiveEvent(null); setCurrentView('dashboard'); }} 
            onSave={() => { setActiveEvent(null); setCurrentView('dashboard'); }} 
            onPreview={(previewData) => {
              const tempId = previewData.id && previewData.id !== 'preview' ? previewData.id : 'preview';
              setActiveEvent({ ...previewData, id: tempId, isPreview: true });
              setCurrentView('recipient-view');
            }}
          />
        )}

        {currentView === 'guestbook' && (
          <Guestbook 
            event={activeEvent} 
            user={user}
            onLogin={handleLogin}
            onBack={() => { 
               if (window.location.search) window.location.href = window.location.origin;
               else { setActiveEvent(null); setCurrentView('dashboard'); }
            }}
          />
        )}

        {currentView === 'recipient-view' && (
          <RecipientView 
            event={activeEvent}
            onBack={() => { 
              if (window.location.search) window.location.href = window.location.origin;
              else if (activeEvent?.isPreview) setCurrentView('create-event');
              else { setActiveEvent(null); setCurrentView('dashboard'); }
           }}
          />
        )}
      </main>

      {shareEvent && <ShareModal event={shareEvent} onClose={() => setShareEvent(null)} />}
    </div>
  );
}