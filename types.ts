
export interface Incident {
  id: string;
  timestamp: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Critical';
  location: { lat: number; lng: number; address: string };
  detectedLicensePlate?: string;
  vehicleCondition: string;
  actionTaken: string[];
  insuranceProvider?: string;
  imageUrl?: string;
  firstAidAdvice?: string;
  ambulanceStatus?: 'Pending' | 'Dispatched' | 'On Scene';
  nearestHospital?: string;
  nearestHospitalCoords?: { lat: number, lng: number };
  nearestTowing?: string;
  nearestTowingCoords?: { lat: number, lng: number };
  estimatedPayout?: number;
  driveabilityStatus: 'Driveable' | 'Restricted' | 'Immobile';
  groundingLinks?: { title: string; uri: string }[];
}

export type FeedSource = 'local' | 'public_1' | 'public_2';

export interface EmergencyService {
  name: string;
  type: 'Hospital' | 'Towing' | 'Police';
  distance: string;
  status: 'Dispatched' | 'On Route' | 'Pending';
  contact: string;
}

export interface AIState {
  isMonitoring: boolean;
  isProcessing: boolean;
  lastAnalysis: string;
  activeAlert: boolean;
}
