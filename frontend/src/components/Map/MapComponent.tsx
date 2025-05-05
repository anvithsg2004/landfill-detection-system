import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAppContext } from '../../context/AppContext';
import { mockGeoJSON } from '../../utils/mockData';
import { Layers, Map } from 'lucide-react';

const MapComponent = () => {
  const { detections } = useAppContext();
  const [map, setMap] = useState<L.Map | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [activeLayer, setActiveLayer] = useState('satellite');

  const baseLayers = [
    { id: 'satellite', name: 'Satellite', url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', attribution: '© Google' },
    { id: 'terrain', name: 'Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '© OpenTopoMap' },
    { id: 'streets', name: 'Streets', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap' },
  ];

  const center: [number, number] = [34.0522, -118.2437]; // Los Angeles
  
  // Style function for GeoJSON features
  const getFeatureStyle = (feature: any) => {
    // Style based on landfill type
    switch (feature.properties.type) {
      case 'active':
        return {
          fillColor: '#E74C3C',
          color: '#C0392B',
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.6
        };
      case 'inactive':
        return {
          fillColor: '#3498DB',
          color: '#2980B9',
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.6
        };
      case 'potential':
        return {
          fillColor: '#F1C40F',
          color: '#F39C12',
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.5
        };
      default:
        return {
          fillColor: '#95A5A6',
          color: '#7F8C8D',
          weight: 1,
          opacity: 0.7,
          fillOpacity: 0.4
        };
    }
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      const { confidence, area, type } = feature.properties;
      layer.bindPopup(`
        <div class="text-sm">
          <h4 class="font-semibold">${type.charAt(0).toUpperCase() + type.slice(1)} Landfill</h4>
          <p>Confidence: ${(confidence * 100).toFixed(0)}%</p>
          <p>Area: ${area.toLocaleString()} m²</p>
        </div>
      `);
    }
  };

  const changeBaseLayer = (layerId: string) => {
    setActiveLayer(layerId);
    setShowLayers(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden rounded-lg shadow-card">
      <MapContainer 
        center={center}
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
        whenCreated={setMap}
      >
        {/* Active base layer */}
        {baseLayers.find(layer => layer.id === activeLayer) && (
          <TileLayer
            url={baseLayers.find(layer => layer.id === activeLayer)!.url}
            attribution={baseLayers.find(layer => layer.id === activeLayer)!.attribution}
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          />
        )}
        
        {/* GeoJSON overlay */}
        <GeoJSON 
          data={mockGeoJSON as any}
          style={getFeatureStyle}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
      
      {/* Layer controls */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button 
          className="p-2 bg-white rounded-md shadow-md flex items-center"
          onClick={() => setShowLayers(!showLayers)}
        >
          <Layers size={18} className="text-primary-500" />
        </button>
        
        {showLayers && (
          <div className="mt-2 p-2 bg-white rounded-md shadow-md">
            <p className="text-xs font-semibold mb-1 text-neutral-500">Base Maps</p>
            <div className="space-y-1">
              {baseLayers.map(layer => (
                <button 
                  key={layer.id}
                  className={`w-full text-left px-2 py-1 text-sm rounded ${activeLayer === layer.id ? 'bg-primary-50 text-primary-500' : 'hover:bg-neutral-100'}`}
                  onClick={() => changeBaseLayer(layer.id)}
                >
                  {layer.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapComponent;