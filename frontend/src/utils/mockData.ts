import { Detection, HistoryItem, ProcessedImage } from '../types';

export const mockDetections: Detection[] = [
  {
    id: 'det-1',
    location: { lat: 34.0522, lng: -118.2437 },
    boundingBox: {
      topLeft: { lat: 34.0622, lng: -118.2537 },
      bottomRight: { lat: 34.0422, lng: -118.2337 }
    },
    confidence: 0.92,
    dateDetected: '2025-01-15T09:30:00Z',
    area: 15000,
    type: 'active'
  },
  {
    id: 'det-2',
    location: { lat: 34.1522, lng: -118.3437 },
    boundingBox: {
      topLeft: { lat: 34.1622, lng: -118.3537 },
      bottomRight: { lat: 34.1422, lng: -118.3337 }
    },
    confidence: 0.87,
    dateDetected: '2025-01-12T15:45:00Z',
    area: 8500,
    type: 'inactive'
  },
  {
    id: 'det-3',
    location: { lat: 33.9522, lng: -118.1437 },
    boundingBox: {
      topLeft: { lat: 33.9622, lng: -118.1537 },
      bottomRight: { lat: 33.9422, lng: -118.1337 }
    },
    confidence: 0.75,
    dateDetected: '2025-01-10T12:15:00Z',
    area: 12000,
    type: 'potential'
  },
  {
    id: 'det-4',
    location: { lat: 34.2522, lng: -118.4437 },
    boundingBox: {
      topLeft: { lat: 34.2622, lng: -118.4537 },
      bottomRight: { lat: 34.2422, lng: -118.4337 }
    },
    confidence: 0.95,
    dateDetected: '2025-01-08T08:20:00Z',
    area: 20000,
    type: 'active'
  },
  {
    id: 'det-5',
    location: { lat: 33.8522, lng: -118.0437 },
    boundingBox: {
      topLeft: { lat: 33.8622, lng: -118.0537 },
      bottomRight: { lat: 33.8422, lng: -118.0337 }
    },
    confidence: 0.68,
    dateDetected: '2025-01-05T14:10:00Z',
    area: 9800,
    type: 'potential'
  }
];

export const mockHistory: HistoryItem[] = [
  {
    id: 'hist-1',
    fileName: 'los_angeles_2025_01_15.tif',
    dateProcessed: '2025-01-15T10:30:00Z',
    detectionCount: 3,
    confidence: 0.92,
    status: 'complete'
  },
  {
    id: 'hist-2',
    fileName: 'san_diego_2025_01_12.jpg',
    dateProcessed: '2025-01-12T16:45:00Z',
    detectionCount: 5,
    confidence: 0.87,
    status: 'complete'
  },
  {
    id: 'hist-3',
    fileName: 'san_francisco_2025_01_10.png',
    dateProcessed: '2025-01-10T13:15:00Z',
    detectionCount: 2,
    confidence: 0.75,
    status: 'complete'
  },
  {
    id: 'hist-4',
    fileName: 'sacramento_2025_01_08.tif',
    dateProcessed: '2025-01-08T09:20:00Z',
    detectionCount: 4,
    confidence: 0.91,
    status: 'complete'
  },
  {
    id: 'hist-5',
    fileName: 'fresno_2025_01_05.jpg',
    dateProcessed: '2025-01-05T15:10:00Z',
    detectionCount: 1,
    confidence: 0.68,
    status: 'complete'
  }
];

export const mockProcessedImages: ProcessedImage[] = [
  {
    id: 'img-1',
    fileName: 'los_angeles_2025_01_15.tif',
    originalUrl: 'https://images.pexels.com/photos/1078983/pexels-photo-1078983.jpeg',
    processedUrl: 'https://images.pexels.com/photos/1078983/pexels-photo-1078983.jpeg',
    detections: mockDetections.slice(0, 3),
    dateProcessed: '2025-01-15T10:30:00Z',
    confidence: 0.92
  },
  {
    id: 'img-2',
    fileName: 'san_diego_2025_01_12.jpg',
    originalUrl: 'https://images.pexels.com/photos/269633/pexels-photo-269633.jpeg',
    processedUrl: 'https://images.pexels.com/photos/269633/pexels-photo-269633.jpeg',
    detections: mockDetections.slice(1, 4),
    dateProcessed: '2025-01-12T16:45:00Z',
    confidence: 0.87
  }
];

export const mockGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'det-1',
        confidence: 0.92,
        area: 15000,
        type: 'active'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-118.2537, 34.0622],
            [-118.2337, 34.0622],
            [-118.2337, 34.0422],
            [-118.2537, 34.0422],
            [-118.2537, 34.0622]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'det-2',
        confidence: 0.87,
        area: 8500,
        type: 'inactive'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-118.3537, 34.1622],
            [-118.3337, 34.1622],
            [-118.3337, 34.1422],
            [-118.3537, 34.1422],
            [-118.3537, 34.1622]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'det-3',
        confidence: 0.75,
        area: 12000,
        type: 'potential'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-118.1537, 33.9622],
            [-118.1337, 33.9622],
            [-118.1337, 33.9422],
            [-118.1537, 33.9422],
            [-118.1537, 33.9622]
          ]
        ]
      }
    }
  ]
};