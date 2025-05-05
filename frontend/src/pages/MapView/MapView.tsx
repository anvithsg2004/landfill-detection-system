import { useState } from 'react';
import { MapPinned, Filter, Layers, Download } from 'lucide-react';
import MapComponent from '../../components/Map/MapComponent';
import { useAppContext } from '../../context/AppContext';

const MapView = () => {
  const { exportResults } = useAppContext();
  const [showFilters, setShowFilters] = useState(false);
  
  const filterOptions = [
    { id: 'active', label: 'Active Landfills', checked: true },
    { id: 'inactive', label: 'Inactive Landfills', checked: true },
    { id: 'potential', label: 'Potential Sites', checked: true },
  ];
  
  const [filters, setFilters] = useState(filterOptions);
  
  const toggleFilter = (id: string) => {
    setFilters(filters.map(filter => 
      filter.id === id ? { ...filter, checked: !filter.checked } : filter
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <MapPinned size={24} className="text-primary-500 mr-2" />
          <h1 className="text-2xl font-bold text-primary-500">Map View</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            className="btn btn-outline flex items-center space-x-1.5 text-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>
          
          <button 
            className="btn btn-primary flex items-center space-x-1.5 text-sm"
            onClick={exportResults}
          >
            <Download size={16} />
            <span>Export Data</span>
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow-card animate-fade-in">
          <h3 className="text-sm font-semibold mb-2">Filter Detections</h3>
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <label 
                key={filter.id}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input 
                  type="checkbox" 
                  className="rounded text-primary-500 focus:ring-primary-500"
                  checked={filter.checked}
                  onChange={() => toggleFilter(filter.id)}
                />
                <span className="text-sm">{filter.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex-1 min-h-0">
        <MapComponent />
      </div>
    </div>
  );
};

export default MapView;