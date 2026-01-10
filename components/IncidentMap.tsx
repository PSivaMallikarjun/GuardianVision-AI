
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Incident } from '../types';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const incidentIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style='background-color: #ef4444; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px #ef4444;' class='animate-pulse'></div>`,
  iconSize: [15, 15],
  iconAnchor: [7, 7]
});

const hospitalIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style='background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px #3b82f6;'></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const towingIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style='background-color: #f59e0b; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px #f59e0b;'></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

interface IncidentMapProps {
  incidents: Incident[];
  activeIncidentId?: string | null;
}

const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const IncidentMap: React.FC<IncidentMapProps> = ({ incidents, activeIncidentId }) => {
  const [showTraffic, setShowTraffic] = useState(true);
  const defaultCenter: [number, number] = [25.1972, 55.2744]; // Dubai default
  const activeIncident = incidents.find(i => i.id === activeIncidentId);
  const center = activeIncident ? [activeIncident.location.lat, activeIncident.location.lng] as [number, number] : defaultCenter;

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'Critical': return '#ef4444';
      case 'Severe': return '#f97316';
      case 'Moderate': return '#eab308';
      default: return '#3b82f6';
    }
  };

  // TomTom Traffic Flow API Key placeholder structure.
  const TOMTOM_KEY = 'YOUR_TOMTOM_KEY'; 
  const trafficUrl = `https://{s}.api.tomtom.com/traffic/map/4/tile/flow/absolute/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`;

  return (
    <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-slate-800 relative shadow-2xl bg-slate-900">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {showTraffic && (
          <TileLayer
            url={trafficUrl}
            opacity={0.6}
            zIndex={10}
            attribution='&copy; <a href="https://www.tomtom.com/">TomTom</a>'
          />
        )}

        <ChangeView center={center} />
        
        {incidents.map(inc => (
          <React.Fragment key={inc.id}>
            <Marker position={[inc.location.lat, inc.location.lng]} icon={incidentIcon}>
              <Popup>
                <div className="w-64 space-y-3 font-sans">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded" style={{ backgroundColor: `${getSeverityColor(inc.severity)}20`, color: getSeverityColor(inc.severity), border: `1px solid ${getSeverityColor(inc.severity)}40` }}>
                      {inc.severity}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">ID: {inc.id.slice(-6)}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Status</div>
                    <div className="text-xs text-slate-200">
                      <i className="fa-solid fa-car-burst mr-2 text-slate-500"></i>
                      {inc.detectedLicensePlate || 'Plate Unknown'} • {inc.driveabilityStatus}
                    </div>
                    <p className="text-[11px] text-slate-400 italic bg-slate-800/50 p-1.5 rounded mt-1 border border-slate-700/50">
                      {inc.vehicleCondition}
                    </p>
                  </div>

                  {inc.firstAidAdvice && (
                    <div className="space-y-1 bg-blue-500/5 p-2 rounded-lg border border-blue-500/20">
                      <div className="text-[10px] font-black text-blue-400 uppercase flex items-center">
                        <i className="fa-solid fa-kit-medical mr-1.5"></i> Emergency Response
                      </div>
                      <p className="text-[10px] text-slate-300 leading-tight line-clamp-3">
                        {inc.firstAidAdvice}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1">
                    <div className="text-[9px] text-slate-500 flex items-center">
                      <i className="fa-solid fa-clock mr-1"></i> {inc.timestamp}
                    </div>
                    <button className="text-[9px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-500 transition-colors">
                      View Full Details
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>

            {inc.nearestHospitalCoords && (
              <>
                <Marker position={[inc.nearestHospitalCoords.lat, inc.nearestHospitalCoords.lng]} icon={hospitalIcon}>
                  <Popup>
                    <div className="text-xs">
                      <strong className="text-blue-500">Hospital (EMS Dispatch)</strong><br/>
                      {inc.nearestHospital}<br/>
                      <span className="text-[10px] text-slate-500 italic">Dispatched to Incident {inc.id.slice(-6)}</span>
                    </div>
                  </Popup>
                </Marker>
                <Polyline 
                  positions={[
                    [inc.location.lat, inc.location.lng],
                    [inc.nearestHospitalCoords.lat, inc.nearestHospitalCoords.lng]
                  ]}
                  pathOptions={{ color: '#3b82f6', weight: 1, dashArray: '5, 5', opacity: 0.5 }}
                />
              </>
            )}

            {inc.nearestTowingCoords && (
              <>
                <Marker position={[inc.nearestTowingCoords.lat, inc.nearestTowingCoords.lng]} icon={towingIcon}>
                  <Popup>
                    <div className="text-xs">
                      <strong className="text-amber-500">Towing Station</strong><br/>
                      {inc.nearestTowing}<br/>
                      <span className="text-[10px] text-slate-500 italic">Route Optimized for Driveability: {inc.driveabilityStatus}</span>
                    </div>
                  </Popup>
                </Marker>
                <Polyline 
                  positions={[
                    [inc.location.lat, inc.location.lng],
                    [inc.nearestTowingCoords.lat, inc.nearestTowingCoords.lng]
                  ]}
                  pathOptions={{ color: '#f59e0b', weight: 1, dashArray: '5, 5', opacity: 0.5 }}
                />
              </>
            )}
          </React.Fragment>
        ))}
      </MapContainer>

      <div className="absolute top-4 right-4 z-[1000]">
        <button 
          onClick={() => setShowTraffic(!showTraffic)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-xl glass-morphism border transition-all ${showTraffic ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-slate-900/80 border-slate-700 text-slate-500'}`}
        >
          <i className={`fa-solid fa-traffic-light ${showTraffic ? 'animate-pulse' : ''}`}></i>
          <span className="text-[10px] font-black uppercase tracking-widest">{showTraffic ? 'Traffic ON' : 'Traffic OFF'}</span>
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-[1000] glass-morphism p-3 rounded-xl border border-white/10 text-[10px] space-y-2 pointer-events-none">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></div>
          <span className="text-slate-200 font-bold uppercase tracking-tighter">Incident</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div>
          <span className="text-slate-200 font-bold uppercase tracking-tighter">EMS/Hospital</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></div>
          <span className="text-slate-200 font-bold uppercase tracking-tighter">Towing Service</span>
        </div>
        
        {showTraffic && (
          <div className="pt-2 border-t border-white/5 space-y-1">
            <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Live Congestion</div>
            <div className="flex items-center space-x-1 h-1 rounded-full overflow-hidden w-full">
              <div className="h-full w-1/3 bg-green-500"></div>
              <div className="h-full w-1/3 bg-yellow-500"></div>
              <div className="h-full w-1/3 bg-red-600"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentMap;
