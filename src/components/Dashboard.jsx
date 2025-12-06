import React, { useState, useEffect } from 'react';
import { Plus, Gift, Users, Eye, Edit, Link, Calendar, Clock } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Dashboard({ user, onCreateClick, onEditClick, onViewGuestbook, onViewRecipient, onShareClick }) {
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
                   <button onClick={() => onShareClick(event)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Get Share Links"><Link size={18} /></button>
                   <button onClick={() => onViewGuestbook(event)} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Preview Guestbook"><Users size={18} /></button>
                   <button onClick={() => onViewRecipient(event)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Preview Recipient View"><Eye size={18} /></button>
                   <button onClick={() => onEditClick(event)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition" title="Edit Event"><Edit size={18} /></button>
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
}