import { Detection } from '../../types';
import { MapPin, Calendar, ArrowUpRight } from 'lucide-react';

interface DetectionListProps {
  detections: Detection[];
}

const DetectionList = ({ detections }: DetectionListProps) => {
  const getTypeColor = (type: string) => {
    // Map the API's type (e.g., "FULL container") to your frontend's type values
    const normalizedType = type.toLowerCase().includes('full') ? 'active' : 'potential';
    switch (normalizedType) {
      case 'active':
        return 'text-error bg-error bg-opacity-10';
      case 'potential':
        return 'text-accent-600 bg-accent-100';
      default:
        return 'text-neutral-500 bg-neutral-100';
    }
  };

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-primary-500 mb-4">
        Detections ({detections.length})
      </h3>

      {detections.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-neutral-500">No detections found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {detections.map((detection) => (
            <div
              key={detection.id}
              className="p-3 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTypeColor(
                    detection.type
                  )}`}
                >
                  {detection.type}
                </span>
                <span className="text-sm font-medium text-primary-500">
                  {(detection.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>

              <div className="mt-2 space-y-1">
                <div className="flex items-center text-sm text-neutral-600">
                  <MapPin size={14} className="mr-1.5" />
                  <span>
                    {detection.location.lat.toFixed(4)}, {detection.location.lng.toFixed(4)}
                  </span>
                </div>

                <div className="flex items-center text-sm text-neutral-600">
                  <Calendar size={14} className="mr-1.5" />
                  <span>{new Date(detection.dateDetected).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-neutral-500">
                  Area: {detection.area.toLocaleString()} m²
                </span>
                {/* <button className="text-sm text-primary-500 hover:text-primary-600 flex items-center">
                  View on map <ArrowUpRight size={14} className="ml-1" />
                </button> */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DetectionList;