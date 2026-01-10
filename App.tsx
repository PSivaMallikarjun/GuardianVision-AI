
import React, { useState } from 'react';
import DashboardHeader from './components/DashboardHeader';
import CCTVMonitor from './components/CCTVMonitor';
import IncidentCard from './components/IncidentCard';
import IncidentMap from './components/IncidentMap';
import { Incident } from './types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SAFETY_DATA = [
  { time: '08:00', incidents: 2 },
  { time: '10:00', incidents: 1 },
  { time: '12:00', incidents: 4 },
  { time: '14:00', incidents: 0 },
  { time: '16:00', incidents: 3 },
  { time: '18:00', incidents: 6 },
];

const App: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeTab, setActiveTab] = useState<'monitor' | 'nexus'>('monitor');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const handleIncidentDetected = (incident: Incident) => {
    setIncidents(prev => {
      const isDuplicate = prev.some(i => i.detectedLicensePlate === incident.detectedLicensePlate && !!incident.detectedLicensePlate);
      if (isDuplicate) return prev;
      return [incident, ...prev];
    });
    setSelectedIncidentId(incident.id);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 text-slate-200">
      <DashboardHeader />

      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
        
        {/* Left Control Column */}
        <div className="flex-[1.5] flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveTab('monitor')}
                className={`flex items-center space-x-2 px-6 py-2 rounded-xl transition-all border ${activeTab === 'monitor' ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
              >
                <i className="fa-solid fa-eye text-xs"></i>
                <span className="text-xs font-black uppercase tracking-widest">Live Operations</span>
              </button>
              <button 
                onClick={() => setActiveTab('nexus')}
                className={`flex items-center space-x-2 px-6 py-2 rounded-xl transition-all border ${activeTab === 'nexus' ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-500/20' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
              >
                <i className="fa-solid fa-network-wired text-xs"></i>
                <span className="text-xs font-black uppercase tracking-widest">Stakeholder Nexus</span>
              </button>
            </div>
            
            <div className="hidden sm:flex items-center space-x-3 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
               <div className="flex items-center space-x-2 px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-slate-400">VISION ACTIVE</span>
               </div>
               <div className="flex items-center space-x-2 px-3 py-1 border-l border-slate-800">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-[10px] font-bold text-slate-400">MAP ENGINE: OK</span>
               </div>
            </div>
          </div>

          {activeTab === 'monitor' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Primary CCTV Feed</h3>
                  <CCTVMonitor isMonitoring={true} onIncidentDetected={handleIncidentDetected} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operational Map View</h3>
                  <IncidentMap incidents={incidents} activeIncidentId={selectedIncidentId} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-morphism p-5 rounded-2xl">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Incident Intensity (24h)</h3>
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={SAFETY_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                        <Bar dataKey="incidents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="glass-morphism p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Nexus Core Status</h3>
                    <div className="space-y-3">
                       <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-800 pb-2">
                          <span className="flex items-center"><i className="fa-solid fa-map-location-dot text-indigo-500 mr-2"></i> Geo-Spatial Linking</span>
                          <span className="font-mono text-green-400">SYNCED</span>
                       </div>
                       <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-800 pb-2">
                          <span className="flex items-center"><i className="fa-solid fa-truck-medical text-red-500 mr-2"></i> EMS API Grounding</span>
                          <span className="font-mono text-green-400">CONNECTED</span>
                       </div>
                    </div>
                  </div>
                  <div className="bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20 text-[10px] text-indigo-400 mt-4 leading-relaxed">
                    <strong>AI Recommendation:</strong> High density detected in Area 02. Pre-emptive towing deployment suggested at Heliport Junction.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-morphism p-8 rounded-2xl">
              <h3 className="text-xl font-black text-white mb-6">Automated Stakeholder Dispatch</h3>
              <div className="space-y-4">
                {incidents.length > 0 ? incidents.map(inc => (
                  <div key={inc.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                         <i className="fa-solid fa-file-invoice-dollar text-blue-500 text-xl"></i>
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">{inc.detectedLicensePlate || 'UNKNOWN'} | ${inc.estimatedPayout?.toLocaleString()} CLAIM</div>
                        <div className="text-[10px] text-slate-500">{inc.actionTaken.join(' | ')}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded">MAIL SENT</span>
                      <span className="text-[10px] px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">API TRIGGERED</span>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center text-slate-500 italic text-sm">Waiting for live detections to populate stakeholder bus...</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Feed */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Incident Pipeline</h2>
            <div className="bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded flex items-center animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
              <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Live Monitor</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {incidents.length > 0 ? (
              incidents.map(inc => (
                <div key={inc.id} onClick={() => setSelectedIncidentId(inc.id)} className={`cursor-pointer transition-all ${selectedIncidentId === inc.id ? 'ring-2 ring-blue-500 rounded-2xl' : ''}`}>
                  <IncidentCard incident={inc} />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-30 py-20 grayscale">
                <i className="fa-solid fa-radar text-5xl text-slate-600 mb-4"></i>
                <p className="text-xs font-bold text-slate-400 px-10">NO ANOMALIES DETECTED IN LAST 60 CYCLES</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Nexus Command</h3>
             <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-red-500 hover:bg-red-500/5 transition-all group">
                  <i className="fa-solid fa-ambulance text-red-500 mb-1 group-hover:scale-110 transition-transform"></i>
                  <span className="text-[9px] font-bold text-slate-300">EMS CALL</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 transition-all group">
                  <i className="fa-solid fa-envelope-shield text-blue-400 mb-1 group-hover:scale-110 transition-transform"></i>
                  <span className="text-[9px] font-bold text-slate-300">ADJUSTER</span>
                </button>
             </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900/50 backdrop-blur-xl px-6 py-2 flex items-center justify-between text-[10px] border-t border-slate-800">
        <div className="flex items-center space-x-6">
          <span className="text-slate-500 font-bold tracking-tighter">GUARDIAN_VISION_NODE_01_PROD</span>
          <div className="flex space-x-3">
            <span className="text-blue-400">FPS: 30</span>
            <span className="text-blue-400">LATENCY: 85ms</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
           <span className="text-slate-400 font-black tracking-widest uppercase">Encryption: AES-256-GCM</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
};

export default App;
