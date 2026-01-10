
import React, { useState } from 'react';
import { Incident } from '../types';

interface IncidentCardProps {
  incident: Incident;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident }) => {
  const [copied, setCopied] = useState(false);

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'border-red-500 text-red-500 bg-red-500/10';
      case 'Severe': return 'border-orange-500 text-orange-500 bg-orange-500/10';
      case 'Moderate': return 'border-yellow-500 text-yellow-500 bg-yellow-500/10';
      default: return 'border-blue-500 text-blue-500 bg-blue-500/10';
    }
  };

  const handleCopyAdvice = async () => {
    if (!incident.firstAidAdvice) return;
    try {
      await navigator.clipboard.writeText(incident.firstAidAdvice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatAdvice = (text: string) => {
    return text.split(/\n|(?=\d\.)/).filter(line => line.trim().length > 0);
  };

  const adviceSteps = incident.firstAidAdvice ? formatAdvice(incident.firstAidAdvice) : [];

  return (
    <div className="glass-morphism rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500/40 transition-all duration-300">
      <div className="relative h-48">
        <img src={incident.imageUrl} className="w-full h-full object-cover grayscale brightness-110 contrast-125" alt="Impact context" />
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black border backdrop-blur-md ${getSeverityStyle(incident.severity)}`}>
          {incident.severity.toUpperCase()}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black to-transparent"></div>
        <div className="absolute bottom-3 left-3 font-mono text-xs text-white flex items-center">
          <i className="fa-solid fa-car-side mr-2 text-blue-400"></i>
          {incident.detectedLicensePlate || "PLATE SCANNING..."}
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Emergency ID: {incident.id.slice(-8)}</h3>
            <p className="text-[10px] text-slate-500">{incident.location.address}</p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded">{incident.timestamp}</span>
        </div>
        
        <div className="bg-slate-900/80 rounded-lg border border-slate-800/50 overflow-hidden">
          <div className="bg-blue-600/10 px-3 py-2 border-b border-slate-800/50 flex justify-between items-center">
            <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center">
              <i className="fa-solid fa-kit-medical mr-2"></i> First Aid Protocol
            </h4>
            <button 
              onClick={handleCopyAdvice}
              className="text-[9px] font-bold text-slate-400 hover:text-blue-400 transition-colors flex items-center group"
            >
              {copied ? (
                <span className="text-green-400"><i className="fa-solid fa-check mr-1"></i> Copied</span>
              ) : (
                <>
                  <i className="fa-solid fa-copy mr-1 group-hover:scale-110 transition-transform"></i> Copy Steps
                </>
              )}
            </button>
          </div>
          <div className="p-3 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {adviceSteps.length > 0 ? (
              adviceSteps.map((step, idx) => (
                <div key={idx} className="flex space-x-2 items-start">
                  <span className="text-[10px] text-blue-500 font-mono mt-0.5">•</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {step.trim()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-500 italic">No instructions provided.</p>
            )}
          </div>
        </div>

        {incident.groundingLinks && incident.groundingLinks.length > 0 && (
          <div className="space-y-1">
             <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Verified Sources</div>
             <div className="flex flex-wrap gap-2">
                {incident.groundingLinks.slice(0, 2).map((link, idx) => (
                   <a 
                    key={idx} 
                    href={link.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[9px] text-blue-400 bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20 hover:bg-blue-400/20 transition-all flex items-center"
                   >
                     <i className="fa-solid fa-link mr-1"></i> {link.title.substring(0, 20)}...
                   </a>
                ))}
             </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
             <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Insurance Est.</div>
             <div className="text-xs font-bold text-green-400">${incident.estimatedPayout?.toLocaleString() || '0'}</div>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
             <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Driveability</div>
             <div className="text-xs font-bold text-blue-400">{incident.driveabilityStatus}</div>
          </div>
        </div>

        <div className="space-y-2 border-t border-slate-800 pt-3">
          <div className="flex items-center text-[10px] text-slate-400">
            <i className="fa-solid fa-truck-medical w-5 text-red-500"></i>
            EMS: <span className="text-white ml-2">{incident.nearestHospital || "Dispatching..."}</span>
          </div>
          <div className="flex items-center text-[10px] text-slate-400">
            <i className="fa-solid fa-wrench w-5 text-orange-400"></i>
            Tow: <span className="text-white ml-2">{incident.nearestTowing || "Locating..."}</span>
          </div>
        </div>

        <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest">
          Approve Stakeholder Dispatch
        </button>
      </div>
    </div>
  );
};

export default IncidentCard;
