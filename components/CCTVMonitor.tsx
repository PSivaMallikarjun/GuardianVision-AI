
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { aiService } from '../services/gemini';
import { Incident, FeedSource } from '../types';

interface CCTVMonitorProps {
  onIncidentDetected: (incident: Incident) => void;
  isMonitoring: boolean;
}

const CCTVMonitor: React.FC<CCTVMonitorProps> = ({ onIncidentDetected, isMonitoring }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameRef = useRef<ImageData | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAccidentTime = useRef<number>(0);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [motionIntensity, setMotionIntensity] = useState(0);
  const [feedSource, setFeedSource] = useState<FeedSource>('local');
  const [currentInterval, setCurrentInterval] = useState(6000);
  const [pulse, setPulse] = useState(false);
  const [lastStatus, setLastStatus] = useState<string>("Ready");

  // Constants for Adaptive Frame Rate (ms)
  const INTERVALS = {
    EMERGENCY: 1500, // Post-accident high speed
    ACTIVE: 3500,    // Motion detected
    STANDBY: 10000   // Static scene
  };
  const MOTION_THRESHOLD_ACTIVE = 15000; // Motion intensity to trigger ACTIVE interval
  const MOTION_THRESHOLD_ANALYSIS = 20000; // Motion intensity to trigger AI analysis

  const LOCATIONS = {
    local: { lat: 25.1972, lng: 55.2744, name: "DXB Downtown Hub" },
    public_1: { lat: 25.0744, lng: 55.1310, name: "Dubai Marina Gateway" },
    public_2: { lat: 25.2455, lng: 55.3376, name: "Creek Tunnel South" }
  };

  useEffect(() => {
    async function setupCamera() {
      if (feedSource !== 'local') return;
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720, facingMode: 'environment' } 
        });
        if (videoRef.current) videoRef.current.srcObject = userStream;
      } catch (err) {
        console.error("Camera access denied", err);
      }
    }
    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [feedSource]);

  const detectMotion = (currentFrame: ImageData): number => {
    if (!lastFrameRef.current) {
      lastFrameRef.current = currentFrame;
      return 0;
    }
    let diff = 0;
    const data1 = lastFrameRef.current.data;
    const data2 = currentFrame.data;
    // Sample every 120 pixels for performance
    for (let i = 0; i < data1.length; i += 120) { 
      diff += Math.abs(data1[i] - data2[i]);
    }
    lastFrameRef.current = currentFrame;
    return diff;
  };

  const performAnalysis = useCallback(async (isManual: boolean, currentModeInterval: number) => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return; // Prevent overlapping AI calls

    setIsProcessing(true);
    setLastStatus("Evaluating Scene...");
    const context = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!context) {
      setIsProcessing(false);
      return;
    }

    let frameToAnalyzeBase64: string;

    // --- Image Stabilization (Frame Averaging) for STANDBY mode when not manual override ---
    if (currentModeInterval === INTERVALS.STANDBY && !isManual) {
      setLastStatus("Stabilizing Frame...");
      const numFramesToAverage = 3; // Number of frames to average
      const captureDelay = 50; // ms between frame captures for slight variations
      
      const averagedData = new Float32Array(canvasRef.current.width * canvasRef.current.height * 4);
      const tempImageData = context.createImageData(canvasRef.current.width, canvasRef.current.height);

      for (let i = 0; i < numFramesToAverage; i++) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const frameData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height).data;
        for (let j = 0; j < frameData.length; j++) {
            averagedData[j] += frameData[j];
        }
        if (i < numFramesToAverage - 1) { // Don't delay after the last frame capture
            await new Promise(resolve => setTimeout(resolve, captureDelay));
        }
      }

      for (let j = 0; j < averagedData.length; j++) {
          tempImageData.data[j] = Math.round(averagedData[j] / numFramesToAverage);
      }
      context.putImageData(tempImageData, 0, 0); // Put averaged data back on canvas for analysis
      frameToAnalyzeBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
      setLastStatus("Stabilized Frame Ready");

    } else {
      // Standard single frame capture for active/emergency/manual scan
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      frameToAnalyzeBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
    }
    
    const currentLocation = LOCATIONS[feedSource];
    const result = await aiService.analyzeCCTVFrame(frameToAnalyzeBase64, currentLocation);

    if (result && result.accidentDetected) {
      setLastStatus("Incident Detected!");
      lastAccidentTime.current = Date.now();
      const jitteredLocation = {
        lat: currentLocation.lat + (Math.random() - 0.5) * 0.005,
        lng: currentLocation.lng + (Math.random() - 0.5) * 0.005
      };

      onIncidentDetected({
        id: `INC-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        severity: result.severity,
        location: { ...jitteredLocation, address: result.locationDetails || currentLocation.name },
        detectedLicensePlate: result.licensePlate,
        vehicleCondition: result.damageDetails,
        actionTaken: result.stakeholderNotifications || ["System Alert Triggered"],
        firstAidAdvice: result.firstAidAdvice,
        imageUrl: canvasRef.current.toDataURL('image/jpeg'),
        ambulanceStatus: 'Dispatched',
        nearestHospital: result.nearestHospital,
        nearestHospitalCoords: result.nearestHospitalCoords,
        nearestTowing: result.nearestTowing,
        nearestTowingCoords: result.nearestTowingCoords,
        estimatedPayout: result.estimatedPayout,
        driveabilityStatus: result.driveability,
        groundingLinks: result.groundingLinks
      });
    } else {
      setLastStatus(isManual ? "No Incident Found" : "Clear");
    }
    setIsProcessing(false);
  }, [isProcessing, onIncidentDetected, feedSource, INTERVALS.STANDBY]);

  const runAnalysisCycle = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isMonitoring) return;

    setPulse(true);
    setTimeout(() => setPulse(false), 300);

    const context = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    // Always draw current frame for motion detection first
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const currentFrame = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    const intensity = detectMotion(currentFrame); // Motion detection always on raw frame
    setMotionIntensity(intensity);

    // Determine next interval
    let nextInterval = INTERVALS.STANDBY;
    const isEmergencyMode = (Date.now() - lastAccidentTime.current) < 120000; // 2 min emergency mode

    if (isEmergencyMode) {
      nextInterval = INTERVALS.EMERGENCY;
    } else if (intensity > MOTION_THRESHOLD_ACTIVE) { 
      nextInterval = INTERVALS.ACTIVE;
    }

    setCurrentInterval(nextInterval);

    // Trigger AI analysis if motion is significant and not currently processing
    if (intensity > MOTION_THRESHOLD_ANALYSIS && !isProcessing && isMonitoring) {
      await performAnalysis(false, nextInterval); // Pass nextInterval to performAnalysis for conditional stabilization
    }

    timerRef.current = setTimeout(runAnalysisCycle, nextInterval);
  }, [isProcessing, isMonitoring, performAnalysis, INTERVALS.STANDBY, INTERVALS.ACTIVE, INTERVALS.EMERGENCY]);

  useEffect(() => {
    if (isMonitoring) {
      timerRef.current = setTimeout(runAnalysisCycle, 1000); // Initial kick-off
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isMonitoring, runAnalysisCycle]);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-microchip text-blue-500 text-[10px] ml-2"></i>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Adaptive Scan Engine</span>
        </div>
        <div className="flex space-x-2">
          {Object.keys(LOCATIONS).map((key) => (
            <button 
              key={key}
              onClick={() => {
                setFeedSource(key as FeedSource);
                // Reset timer for immediate update with new feed source
                if (timerRef.current) {
                  clearTimeout(timerRef.current);
                  timerRef.current = setTimeout(runAnalysisCycle, 100);
                }
              }}
              className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all ${feedSource === key ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
            >
              {key === 'local' ? 'LOCAL' : `HUB ${key.split('_')[1]}`}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full h-[450px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 group">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all duration-700"
        />
        <canvas ref={canvasRef} className="hidden" width="1280" height="720" />
        
        <div className={`absolute inset-0 border-4 border-blue-500/20 pointer-events-none transition-opacity duration-300 ${pulse ? 'opacity-100' : 'opacity-0'}`}></div>

        <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2">
          <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
            <div className={`w-2 h-2 rounded-full ${currentInterval === INTERVALS.EMERGENCY ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></div>
            <span className="text-[10px] font-black text-white tracking-widest uppercase">
              {feedSource === 'local' ? 'VISION-NODE-01' : `PUB-STREAM-${feedSource.toUpperCase()}`}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded border border-white/10">
              <span className="text-[8px] text-slate-500 font-bold uppercase block">Scan Freq</span>
              <span className="text-[10px] text-blue-400 font-mono">{(1000/currentInterval).toFixed(2)}Hz</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded border border-white/10">
              <span className="text-[8px] text-slate-500 font-bold uppercase block">Activity</span>
              <span className={`text-[10px] font-mono ${motionIntensity > MOTION_THRESHOLD_ANALYSIS ? 'text-green-400' : 'text-slate-400'}`}>
                {(motionIntensity / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
        </div>

        {/* Forced Manual Scan Button for Testing */}
        <button 
          onClick={() => performAnalysis(true, currentInterval)} // Pass currentInterval
          disabled={isProcessing}
          className="absolute bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-[10px] font-black px-4 py-2 rounded-xl border border-blue-400/50 shadow-xl transition-all active:scale-95 uppercase tracking-widest flex items-center"
        >
          <i className={`fa-solid ${isProcessing ? 'fa-spinner animate-spin' : 'fa-magnifying-glass-chart'} mr-2`}></i>
          {isProcessing ? 'Analyzing...' : 'Force Analysis'}
        </button>

        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/20 backdrop-blur-sm z-30">
             <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <i className="fa-solid fa-brain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 text-xs"></i>
             </div>
             <span className="mt-4 text-[9px] font-black text-white uppercase tracking-[0.3em] bg-blue-600 px-3 py-1 rounded-full shadow-lg">Deep Vision Inference</span>
             <span className="mt-2 text-[8px] text-blue-300 animate-pulse uppercase">Correlating Incident Patterns...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
         <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
            <div className="text-[8px] text-slate-500 font-bold uppercase">Status</div>
            <div className={`text-[10px] font-mono font-bold ${lastStatus.includes('Detected') ? 'text-red-400' : lastStatus.includes('Stabilizing') ? 'text-yellow-400' : 'text-green-400'}`}>{lastStatus}</div>
         </div>
         <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
            <div className="text-[8px] text-slate-500 font-bold uppercase">Mode</div>
            <div className={`text-[10px] font-bold uppercase ${currentInterval < 3000 ? 'text-red-400' : currentInterval < 9000 ? 'text-blue-400' : 'text-slate-400'}`}>
               {currentInterval === INTERVALS.EMERGENCY ? 'Emergency' : currentInterval === INTERVALS.ACTIVE ? 'Follow' : 'Static'}
            </div>
         </div>
         <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
            <div className="text-[8px] text-slate-500 font-bold uppercase">Sensitivity</div>
            <div className="text-[10px] text-blue-400 font-mono font-bold">{(MOTION_THRESHOLD_ACTIVE / 1000).toFixed(0)}k | {(MOTION_THRESHOLD_ANALYSIS / 1000).toFixed(0)}k</div>
         </div>
      </div>
    </div>
  );
};

export default CCTVMonitor;
