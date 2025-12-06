import React, { useState } from 'react';
import { MessageCircle, Trash2, Upload, Lock, ToggleLeft, ToggleRight, Plus, Eye } from 'lucide-react';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function CreateEvent({ user, onCancel, onSave, onPreview, initialData }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    recipientName: initialData?.recipientName || '',
    unlockDate: initialData?.unlockDate || '',
    timezone: initialData?.timezone || 'UTC',
    theme: initialData?.theme || 'birthday',
    animation: initialData?.animation || 'balloons',
    creatorMessage: initialData?.creatorMessage || '',
    creatorImage: initialData?.creatorImage || '',
    secretTitle: initialData?.secretTitle || 'My Letter to You',
    isQuizEnabled: initialData?.isQuizEnabled !== false, 
  });
  
  const [questions, setQuestions] = useState(initialData?.quizQuestions || [{ id: 1, text: "What is my favorite food?", options: ["Pizza", "Sushi", "Tacos", "Burger"], correct: "Pizza" }]);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Updated Timezone List to match RecipientView support
  const timezones = [
    { value: 'UTC', label: 'UTC (Universal)' },
    { value: 'IST', label: 'IST (India)' },
    { value: 'CET', label: 'CET (Central Europe)' },
    { value: 'EST', label: 'EST (US Eastern)' },
    { value: 'PST', label: 'PST (US Pacific)' },
    { value: 'GMT', label: 'GMT (UK Winter)' },
    { value: 'BST', label: 'BST (UK Summer)' },
    { value: 'JST', label: 'JST (Japan)' },
    { value: 'AEDT', label: 'AEDT (Australia)' },
  ];

  const animations = [ 
    { value: 'balloons', label: '🎈 Balloons' }, 
    { value: 'confetti', label: '🎊 Confetti' }, 
    { value: 'hearts', label: '❤️ Floating Hearts' }, 
    { value: 'stars', label: '✨ Stars' } 
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 800 / Math.max(img.width, img.height);
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setFormData(prev => ({...prev, creatorImage: canvas.toDataURL('image/jpeg', 0.7)}));
        setUploadingImg(false);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.recipientName || !formData.unlockDate) return;
    setSaving(true);
    try {
      const data = { ...formData, quizQuestions: questions, creatorId: user.uid, createdAt: serverTimestamp() };
      // Check if updating real existing doc (not preview)
      if (initialData?.id && initialData.id !== 'preview') {
        await updateDoc(doc(db, 'events', initialData.id), data);
      } else {
        await addDoc(collection(db, 'events'), data);
      }
      onSave(); 
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const updateQuestion = (id, field, value) => setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  const updateOption = (qId, idx, val) => setQuestions(questions.map(q => q.id === qId ? { ...q, options: q.options.map((o, i) => i === idx ? val : o) } : q));

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">← Back to Dashboard</button>
        <button onClick={() => onPreview({ ...formData, quizQuestions: questions, id: initialData?.id })} className="text-sm bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-purple-200 transition"><Eye size={16}/> Preview Experience</button>
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
           <h2 className="text-2xl font-bold text-slate-900">{initialData ? 'Edit Greeting' : 'Create New Greeting'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-slate-500 uppercase">Title</label><input className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Recipient</label><input className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200" value={formData.recipientName} onChange={e => setFormData({...formData, recipientName: e.target.value})} required /></div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Unlock Date</label>
              <div className="flex gap-2">
                <input type="datetime-local" className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200" value={formData.unlockDate} onChange={e => setFormData({...formData, unlockDate: e.target.value})} required />
                <select className="w-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={formData.timezone} onChange={e => setFormData({...formData, timezone: e.target.value})}>
                  {timezones.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                </select>
              </div>
            </div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Theme</label><select className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200" value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})}><option value="birthday">🎉 Birthday</option><option value="travel">✈️ Travel</option><option value="minimal">✨ Minimal</option></select></div>
            <div className="md:col-span-2"><label className="text-xs font-bold text-slate-500 uppercase">Unlock Animation</label><select className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200" value={formData.animation} onChange={e => setFormData({...formData, animation: e.target.value})}>{animations.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}</select></div>
          </div>

          <hr className="border-slate-100"/>
          
          {/* Creator Message */}
          <div>
            <h3 className="font-bold mb-4 flex items-center gap-2"><MessageCircle size={18} className="text-blue-500"/> Your Private Letter</h3>
            
            {/* New Title Field */}
            <div className="mb-4">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Letter Title</label>
               <input className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200" placeholder="e.g. My Letter to You" value={formData.secretTitle} onChange={e => setFormData({...formData, secretTitle: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <textarea className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 h-40 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Write your personal birthday letter here..." value={formData.creatorMessage} onChange={e => setFormData({...formData, creatorMessage: e.target.value})}/>
              </div>
              <div>
                <div className="relative h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 transition overflow-hidden">
                  {formData.creatorImage ? (
                    <>
                      <img src={formData.creatorImage} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData({...formData, creatorImage: ''})} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><Trash2 size={12}/></button>
                    </>
                  ) : (
                    <>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                      <Upload size={24} className="mb-2"/> <span className="text-xs font-bold">{uploadingImg ? 'Uploading...' : 'Add Image'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100"/>

          {/* Quiz */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Lock size={18} className="text-green-500"/> Quiz Lock</h3>
              <button type="button" onClick={() => setFormData({...formData, isQuizEnabled: !formData.isQuizEnabled})} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition ${formData.isQuizEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {formData.isQuizEnabled ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>} {formData.isQuizEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            
            {formData.isQuizEnabled && (
              <div className="animate-fadeIn space-y-4">
                <p className="text-sm text-slate-500">The recipient must answer these to unlock <b>your private letter</b>.</p>
                {questions.map((q, i) => (
                  <div key={q.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <input placeholder={`Question ${i+1}`} className="w-full bg-transparent font-bold mb-2 outline-none" value={q.text} onChange={e => updateQuestion(q.id, 'text', e.target.value)} />
                    <div className="grid grid-cols-2 gap-2 mb-2">{q.options.map((o, idx) => <input key={idx} placeholder={`Option ${idx+1}`} className="p-2 border rounded" value={o} onChange={e => updateOption(q.id, idx, e.target.value)} />)}</div>
                    <select className="w-full p-2 border rounded" value={q.correct} onChange={e => updateQuestion(q.id, 'correct', e.target.value)}><option value="">Select Correct Answer</option>{q.options.map((o, idx) => o && <option key={idx} value={o}>{o}</option>)}</select>
                  </div>
                ))}
                <button type="button" onClick={() => setQuestions([...questions, {id: Date.now(), text:'', options:['','','',''], correct:''}])} className="text-blue-600 text-sm flex items-center gap-1 font-bold"><Plus size={16}/> Add Question</button>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={onCancel} className="px-6 py-3 text-slate-500">Cancel</button><button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold">{saving ? 'Saving...' : 'Save Event'}</button></div>
        </form>
      </div>
    </div>
  );
};