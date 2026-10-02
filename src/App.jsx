import React, { useState, useRef } from 'react';

export default function App() {
  const [user, setUser] = useState(null); 
  const [view, setView] = useState('login'); 
  
  // Marketers List (Admin management ke liye sample accounts)
  const [marketers, setMarketers] = useState([
    { id: 1, name: 'Ali Ashfaq', phone: '03001234567', pass: '1234' },
    { id: 2, name: 'Ahmad Khan', phone: '03119876543', pass: '5678' }
  ]);

  // Saved Visits (Admin portal par show karne ke liye)
  const [visits, setVisits] = useState([]);

  // New Marketer Form State (Admin ke liye)
  const [newMarketer, setNewMarketer] = useState({ name: '', phone: '', pass: '' });

  // Form States (Marketer visit add karne ke liye)
  const [formData, setFormData] = useState({
    schoolName: '',
    principalName: '',
    phone: '',
    address: '',
    purpose: '',
    remarks: '',
    image: null
  });

  // Filter States (Admin date range aur marketer filter ke liye)
  const [filter, setFilter] = useState({ startDate: '', endDate: '', marketerPhone: '' });

  // Camera States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = back, 'user' = front
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Login Handler
  const handleLogin = (e) => {
    e.preventDefault();
    const phone = e.target.phone.value;
    const pass = e.target.password.value;

    if (phone === 'admin' && pass === 'admin123') {
      setUser({ role: 'admin', name: 'Administrator' });
      setView('admin-dashboard');
    } else {
      const foundMarketer = marketers.find(m => m.phone === phone && m.pass === pass);
      if (foundMarketer) {
        setUser({ role: 'marketer', name: foundMarketer.name, phone: foundMarketer.phone });
        setView('add-visit');
      } else {
        alert('Ghalat Phone Number ya Password! Dobara koshish karein.');
      }
    }
  };

  // Start Camera (Sirf live camera allow karega)
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Camera access nahi mil saka ya device support nahi karta.');
      setIsCameraOpen(false);
    }
  };

  // Capture Image
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setFormData({ ...formData, image: dataUrl });
      
      const stream = video.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setIsCameraOpen(false);
    }
  };

  // Switch Camera (Back/Front)
  const switchCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Visit Handler
  const handleSaveVisit = (e) => {
    e.preventDefault();
    if (!formData.image) {
      alert('Meherbani kar ke school ki live picture lazmi capture karein!');
      return;
    }

    const currentDate = new Date();
    const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayString = currentDate.toLocaleDateString('en-US', { weekday: 'long' }); // Day Name

    const newVisitRecord = {
      ...formData,
      marketerName: user.name,
      marketerPhone: user.phone,
      date: dateString,
      day: dayString,
      timestamp: currentDate.getTime()
    };

    setVisits([newVisitRecord, ...visits]);
    alert('Visit kamyabi ke sath save ho gayi hai!');
    
    // Reset form
    setFormData({ schoolName: '', principalName: '', phone: '', address: '', purpose: '', remarks: '', image: null });
  };

  // Add New Marketer by Admin
  const handleAddMarketer = (e) => {
    e.preventDefault();
    const newEntry = {
      id: marketers.length + 1,
      name: newMarketer.name,
      phone: newMarketer.phone,
      pass: newMarketer.pass
    };
    setMarketers([...marketers, newEntry]);
    setNewMarketer({ name: '', phone: '', pass: '' });
    alert('Naya marketer account kamyabi se ban gaya hai!');
  };

  // Filtered visits for admin
  const filteredVisits = visits.filter(v => {
    let matches = true;
    if (filter.startDate && v.date < filter.startDate) matches = false;
    if (filter.endDate && v.date > filter.endDate) matches = false;
    if (filter.marketerPhone && v.marketerPhone !== filter.marketerPhone) matches = false;
    return matches;
  });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-blue-50 to-indigo-100">
      
      {/* Header */}
      <header className="bg-indigo-700 text-white py-4 px-6 shadow-md text-center">
        <h1 className="text-2xl font-bold tracking-wide">Javed Publishers</h1>
        <p className="text-xs text-indigo-200">School Visit Management Portal</p>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 md:p-8">
          
          {/* 1. LOGIN VIEW */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-center text-indigo-900 mb-6">Marketer / Admin Login</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number / Admin ID</label>
                <input 
                  type="text" 
                  name="phone" 
                  required 
                  placeholder="Enter phone number (e.g. 03001234567)" 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  placeholder="Enter password" 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition duration-200 shadow-md">
                Login
              </button>
            </form>
          )}

          {/* 2. MARKETER: ADD VISIT FORM */}
          {view === 'add-visit' && (
            <div>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <div>
                  <h2 className="text-lg font-bold text-indigo-900">Add New School Visit</h2>
                  <p className="text-xs text-slate-500">Welcome, {user.name}</p>
                </div>
                <button onClick={() => setView('login')} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 font-medium">Logout</button>
              </div>

              <form onSubmit={handleSaveVisit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">School Name</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-md text-sm" 
                      value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Principal Name</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-md text-sm"
                      value={formData.principalName} onChange={e => setFormData({...formData, principalName: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Phone Number</label>
                    <input type="tel" required className="w-full px-3 py-1.5 border rounded-md text-sm"
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Address</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-md text-sm"
                      value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Purpose</label>
                  <input type="text" required className="w-full px-3 py-1.5 border rounded-md text-sm"
                    value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Remarks</label>
                  <textarea rows="2" className="w-full px-3 py-1.5 border rounded-md text-sm"
                    value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})}></textarea>
                </div>

                {/* Camera Capture Section (Gallery completely blocked) */}
                <div className="pt-2 border-t">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">School Picture (Live Camera Only - Gallery Blocked)</label>
                  
                  {!isCameraOpen && !formData.image && (
                    <button type="button" onClick={startCamera} className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 shadow">
                      Open Camera
                    </button>
                  )}

                  {isCameraOpen && (
                    <div className="space-y-2 text-center bg-slate-900 p-3 rounded-lg">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-56 bg-black rounded-md object-cover"></video>
                      <div className="flex gap-2">
                        <button type="button" onClick={switchCamera} className="flex-1 bg-gray-600 text-white py-1.5 rounded text-xs font-medium">Switch Front/Back</button>
                        <button type="button" onClick={captureImage} className="flex-1 bg-green-600 text-white py-1.5 rounded text-xs font-bold">Capture Photo</button>
                      </div>
                    </div>
                  )}

                  <canvas ref={canvasRef} className="hidden"></canvas>

                  {formData.image && (
                    <div className="mt-2 text-center">
                      <img src={formData.image} alt="Captured School" className="h-32 mx-auto rounded-md border shadow mb-1" />
                      <button type="button" onClick={startCamera} className="text-xs text-indigo-600 font-medium underline">Retake Photo</button>
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 mt-3 shadow">
                  Save Visit
                </button>
              </form>
            </div>
          )}

          {/* 3. ADMIN DASHBOARD */}
          {view === 'admin-dashboard' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-2">
                <div>
                  <h2 className="text-lg font-bold text-indigo-900">Admin Control Panel</h2>
                  <p className="text-xs text-slate-500">Manage Marketers & View Reports</p>
                </div>
                <button onClick={() => setView('login')} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 font-medium">Logout</button>
              </div>

              {/* Section A: Create Marketer & View Passwords */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                <h3 className="text-xs font-bold text-indigo-900 uppercase mb-3">Create New Marketer Account & View Credentials</h3>
                <form onSubmit={handleAddMarketer} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                  <input type="text" placeholder="Marketer Name" required className="p-2 border rounded text-xs" 
                    value={newMarketer.name} onChange={e => setNewMarketer({...newMarketer, name: e.target.value})} />
                  <input type="tel" placeholder="Phone Number" required className="p-2 border rounded text-xs" 
                    value={newMarketer.phone} onChange={e => setNewMarketer({...newMarketer, phone: e.target.value})} />
                  <input type="text" placeholder="Password" required className="p-2 border rounded text-xs" 
                    value={newMarketer.pass} onChange={e => setNewMarketer({...newMarketer, pass: e.target.value})} />
                  <button type="submit" className="md:col-span-3 bg-indigo-600 text-white py-1.5 rounded text-xs font-medium hover:bg-indigo-700">Create Account</button>
                </form>

                <div className="bg-white p-2 rounded border max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Existing Marketers Login Info:</p>
                  <ul className="text-xs space-y-1">
                    {marketers.map(m => (
                      <li key={m.id} className="flex justify-between border-b pb-1">
                        <span>{m.name} ({m.phone})</span>
                        <span className="font-mono text-indigo-600 font-bold">Pass: {m.pass}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Section B: Date & Marketer Wise Report Filtering */}
              <div className="bg-slate-50 p-4 rounded-xl border">
                <h3 className="text-xs font-bold text-slate-800 uppercase mb-3">Filter Visit Reports (Date Range & Person Wise)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Start Date</label>
                    <input type="date" className="w-full p-1.5 border rounded text-xs" 
                      onChange={e => setFilter({...filter, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">End Date</label>
                    <input type="date" className="w-full p-1.5 border rounded text-xs" 
                      onChange={e => setFilter({...filter, endDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Select Marketer</label>
                    <select className="w-full p-1.5 border rounded text-xs" 
                      onChange={e => setFilter({...filter, marketerPhone: e.target.value})}>
                      <option value="">All Marketers</option>
                      {marketers.map(m => (
                        <option key={m.id} value={m.phone}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Visits List Display */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Saved Visits Records ({filteredVisits.length})</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredVisits.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Koi record nahi mila.</p>
                    ) : (
                      filteredVisits.map((v, index) => (
                        <div key={index} className="bg-white p-3 rounded border text-xs shadow-sm flex gap-3 items-center">
                          <img src={v.image} alt="School" className="w-16 h-16 object-cover rounded border flex-shrink-0" />
                          <div className="flex-grow">
                            <p className="font-bold text-indigo-900">{v.schoolName} <span className="text-[10px] text-slate-500 font-normal">({v.date} - {v.day})</span></p>
                            <p>Principal: {v.principalName} | Ph: {v.phone}</p>
                            <p className="text-slate-600">Purpose: {v.purpose}</p>
                            <p className="text-[10px] text-indigo-600 font-semibold mt-1">Marketer: {v.marketerName}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-xs text-slate-500 border-t bg-white">
        Created by Ali Ashfaq
      </footer>

    </div>
  );
}
