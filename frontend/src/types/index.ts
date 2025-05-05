export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  topLeft: GeoPoint;
  bottomRight: GeoPoint;
}

export interface Detection {
  id: string;
  location: GeoPoint;
  boundingBox: BoundingBox;
  confidence: number;
  dateDetected: string;
  area: number;
  type: string; // e.g., "FULL container"
  segmentation?: number[][]; // Added segmentation field: array of [x1, y1, x2, y2, ...]
  metadata?: Record<string, any>;
}

export interface ProcessedImage {
  id: string;
  fileName: string;
  originalUrl: string;
  processedUrl: string;
  detections: Detection[];
  dateProcessed: string;
  confidence: number;
  metadata?: {
    size?: number;
    type?: string;
    lastModified?: string;
    [key: string]: any;
  };
}

export interface HistoryItem {
  id: string;
  fileName: string;
  original_url: string; // Changed from url to original_url
  annotated_url?: string; // Added annotated_url
  dateProcessed: string;
  detectionCount: number;
  confidence: number;
  status: 'pending' | 'processing' | 'complete' | 'error';
  detections?: Detection[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface StatisticItem {
  title: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}