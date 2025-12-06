import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { doc, updateDoc, collection, addDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Guestbook({ event, user, onBack, onLogin }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ name: '', text: '', image: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingWish, setEditingWish] = useState(null); 

  useEffect(() => {
    if (!event) return;
    const q = query(collection(db, 'events', event.id, 'wishes'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => setMessages(snap.docs.map(d => ({id: d.id, ...d.data()}))));
  }, [event]);

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
    if (!user) return; 
    try {
      if (editingWish) {
        await updateDoc(doc(db, 'events', event.id, 'wishes', editingWish.id), { name: newMessage.name, text: newMessage.text, image: newMessage.image, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'events', event.id, 'wishes'), { ...newMessage, userId: user.uid, userPhoto: user.photoURL, createdAt: serverTimestamp(), color: `bg-${['pink','blue','purple','yellow','green'][Math.floor(Math.random()*5)]}-100` });
      }
      setNewMessage({name:'', text:'', image:''}); setIsFormOpen(false); setEditingWish(null);
    } catch(err) { console.error(err); alert("Error saving wish"); }
  };

  const handleDelete = async (wishId) => {
    if(!confirm("Are you sure?")) return;
    try { await deleteDoc(doc(db, 'events', event.id, 'wishes', wishId)); } catch(err) { console.error(err); }
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 px-6 py-6 sticky top-0 z-40 flex justify-between items-center">
        <div><button onClick={onBack} className="text-sm text-slate-500 mb-1">← Back</button><h1 className="text-2xl font-bold">{event.title}</h1></div>
        {user ? <button onClick={() => { setEditingWish(null); setNewMessage({ name: user.displayName, text: '', image: '' }); setIsFormOpen(true); }} className="bg-slate-900 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg"><Plus size={18}/> Add Wish</button> : <button onClick={onLogin} className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">Sign in to Post</button>}
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {messages.map(msg => (
          <div key={msg.id} className={`${msg.color} p-6 rounded-2xl relative group`}>
            {user && msg.userId === user.uid && <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setEditingWish(msg); setNewMessage({ name: msg.name, text: msg.text, image: msg.image || '' }); setIsFormOpen(true); }} className="p-1.5 bg-white/50 hover:bg-white rounded-full text-slate-600"><Edit size={14} /></button><button onClick={() => handleDelete(msg.id)} className="p-1.5 bg-white/50 hover:bg-white rounded-full text-red-500"><Trash2 size={14} /></button></div>}
            <div className="font-bold mb-2 flex items-center gap-2"><div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center overflow-hidden">{msg.userPhoto ? <img src={msg.userPhoto} className="w-full h-full object-cover"/> : msg.name[0]}</div> {msg.name}</div>
            {msg.image && <img src={msg.image} className="w-full h-48 object-cover rounded-lg mb-3" />}
            <p className="whitespace-pre-wrap">{msg.text}</p>
          </div>
        ))}
      </div>
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-xl mb-4">{editingWish ? 'Edit Wish' : 'Add Wish'}</h3>
            <input className="w-full p-3 bg-slate-50 rounded-lg mb-3" placeholder="Name" value={newMessage.name} onChange={e => setNewMessage({...newMessage, name: e.target.value})} />
            <textarea className="w-full p-3 bg-slate-50 rounded-lg mb-3 h-24" placeholder="Message" value={newMessage.text} onChange={e => setNewMessage({...newMessage, text: e.target.value})} />
            <div className="relative mb-4"><input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"/><div className="p-3 bg-slate-50 border-2 border-dashed rounded-lg text-center text-slate-500">{uploading ? 'Compressing...' : newMessage.image ? 'Image Added!' : 'Upload Photo'}</div></div>
            <button onClick={handlePost} disabled={uploading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">{editingWish ? 'Update' : 'Post'}</button>
            <button onClick={() => setIsFormOpen(false)} className="w-full mt-2 text-slate-400 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}