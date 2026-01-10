
import React from 'react';

const DashboardHeader: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-6 py-4 glass-morphism sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <i className="fa-solid fa-shield-halved text-2xl"></i>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">GuardianVision AI</h1>
          <p className="text-xs text-blue-400 font-medium">REAL-TIME TRAFFIC INTELLIGENCE & RESPONSE</p>
        </div>
      </div>

      <div className="hidden md:flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium text-slate-300">System Active</span>
        </div>
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-server text-slate-400"></i>
          <span className="text-sm text-slate-300">Node: DXB-CENTRAL-01</span>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-semibold transition-all">
          <i className="fa-solid fa-gear mr-2"></i> Settings
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
