import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaRoad, FaMapMarkerAlt, FaSearch } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { ModernFormLayout, ModernTextInput, ModernSelectInput, FormFieldGroup } from '../components/ModernFormLayout';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Haversine distance calculation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Geocode location name to coordinates using backend
const geocodeLocation = async (locationString) => {
  if (!locationString) return null;
  
  try {
    const response = await api.geocode(locationString);
    
    if (response.success && response.data && response.data.length > 0) {
      const firstResult = response.data[0];
      return {
        name: firstResult.name || locationString,
        lat: firstResult.lat,
        lon: firstResult.lon,
      };
    }
  } catch (err) {
    console.error('Geocoding error:', err);
  }
  return null;
};

// Location Picker Component
function LocationPicker({ label, value, location, onLocationChange, onCoordinatesChange }) {
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [tempMarker, setTempMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState([5.6037, -0.1870]); // Ghana center by default
  const mapRef = useRef(null);
  const searchResultsRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && 
          searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Force map to render when showMap changes
  useEffect(() => {
    if (showMap) {
      // Delay to ensure DOM is updated
      const timer = setTimeout(() => {
        // Trigger map resize if it exists
        const mapElement = document.querySelector(`[data-map-id="${label}"]`)?.querySelector('.leaflet-container');
        if (mapElement && mapElement._leaflet_map) {
          mapElement._leaflet_map.invalidateSize();
          // Center on the map center state
          mapElement._leaflet_map.setView([mapCenter[0], mapCenter[1]], 13);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showMap, mapCenter, label]);

  // Common Ghana locations for fallback
  const GHANA_LOCATIONS = [
    { name: 'Accra', lat: 5.6037, lon: -0.1870, type: 'city' },
    { name: 'Kumasi', lat: 6.6924, lon: -1.6243, type: 'city' },
    { name: 'Tema', lat: 5.7152, lon: -0.0145, type: 'city' },
    { name: 'Sekondi-Takoradi', lat: 4.9265, lon: -1.7554, type: 'city' },
    { name: 'Cape Coast', lat: 5.1030, lon: -1.2457, type: 'city' },
    { name: 'Tamale', lat: 9.4077, lon: -0.8789, type: 'city' },
  ];

  // Perform actual search with Mapbox as primary, GHANA_LOCATIONS as fallback
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      onLocationChange('');
      onCoordinatesChange(null);
      return;
    }

    setShowDropdown(true);
    setSearching(true);
    setSearchResults([]);
    
    try {
      let results = [];
      
      // Step 1: Try Mapbox API first
      try {
        console.log('🔍 [Mapbox] Searching for:', query);
        const mapboxResponse = await api.mapboxGeocode(query);
        console.log('📍 [Mapbox Response] Received:', mapboxResponse);
        
        // Normalize Mapbox results to consistent structure
        if (mapboxResponse && mapboxResponse.features && Array.isArray(mapboxResponse.features)) {
          results = mapboxResponse.features
            .slice(0, 5) // Limit to 5 results
            .map(feature => ({
              name: feature.place_name || feature.text,
              lat: feature.center[1], // Mapbox uses [lon, lat]
              lon: feature.center[0],
              type: feature.place_type?.[0] || 'place',
            }));
          console.log('✅ [Mapbox] Found:', results.length, 'results');
        } else if (mapboxResponse && mapboxResponse.success) {
          // Handle API proxy wrapper response
          if (mapboxResponse.data && Array.isArray(mapboxResponse.data)) {
            results = mapboxResponse.data;
            console.log('✅ [Mapbox Proxy] Found:', results.length, 'results');
          }
        }
      } catch (mapboxErr) {
        console.warn('⚠️ [Mapbox] API call failed, trying fallback:', mapboxErr.message);
        // Continue to fallback instead of throwing
      }
      
      // Step 2: If Mapbox returns no results, fallback to GHANA_LOCATIONS
      if (!results || results.length === 0) {
        console.log('📍 [Fallback] Mapbox had no results, checking GHANA_LOCATIONS...');
        const queryLower = query.toLowerCase();
        const matchedLocations = GHANA_LOCATIONS.filter(loc => 
          loc.name.toLowerCase().includes(queryLower) || 
          queryLower.includes(loc.name.toLowerCase())
        );
        
        if (matchedLocations.length > 0) {
          results = matchedLocations.map(loc => ({
            name: loc.name,
            lat: loc.lat,
            lon: loc.lon,
            type: loc.type || 'city',
          }));
          console.log('✅ [Fallback] Found Ghana locations:', results.length);
        }
      }
      
      console.log('📊 [Final] Total results:', results.length);
      setSearchResults(results);
      setSearching(false);
      
      // Auto-show map when we have results
      if (results.length > 0) {
        setShowMap(true);
        const firstResult = results[0];
        setMapCenter([parseFloat(firstResult.lat), parseFloat(firstResult.lon)]);
      } else {
        // No results but still show map centered on Ghana for manual selection
        console.log('📍 [Fallback] Showing Ghana map for manual selection');
        setShowMap(true);
        setMapCenter([6.5, -1.0]); // Center of Ghana
      }
    } catch (err) {
      console.error('❌ [Error] Search failed:', err.message);
      console.error('Full error:', err);
      setSearchResults([]);
      setSearching(false);
      setShowDropdown(true); // Keep dropdown visible to show error
      // Show Ghana map anyway for fallback selection
      setShowMap(true);
      setMapCenter([6.5, -1.0]);
    }
  };

  // Debounced search handler (300ms)
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new debounce timer (300ms for faster feedback)
    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, 300); // 300ms debounce for faster response
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSelectResult = (result) => {
    const locationObj = {
      name: result.name || result.display_name || 'Location',
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
    };
    // Update to show the selected location name in the input
    setSearchQuery(locationObj.name);
    onLocationChange(locationObj.name);
    onCoordinatesChange(locationObj);
    setSearchResults([]);
    setShowDropdown(false);
    setShowMap(false);
    console.log('Selected location:', locationObj);
  };

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    
    // Show temporary marker immediately for visual feedback
    setTempMarker({ lat, lon: lng });
    
    try {
      // Reverse geocode to get location name using backend
      const response = await api.reverseGeocode(lat, lng);
      
      let locationName = 'Selected Location';
      
      // Try to get name from response
      if (response && response.data && response.data.name) {
        locationName = response.data.name;
      } else if (response && response.data && response.data.display_name) {
        locationName = response.data.display_name;
      }
      
      const locationObj = {
        name: locationName,
        lat,
        lon: lng,
      };
      onLocationChange(locationObj.name);
      onCoordinatesChange(locationObj);
      setTempMarker(null);
      setShowMap(false);
      setShowDropdown(false);
      console.log('Map location selected:', locationObj);
    } catch (err) {
      console.error('Reverse geocode error:', err);
      // Still set the location even if reverse geocoding fails
      const fallbackObj = {
        name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat,
        lon: lng,
      };
      onLocationChange(fallbackObj.name);
      onCoordinatesChange(fallbackObj);
      setTempMarker(null);
      setShowMap(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label} *</label>
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                placeholder={`Search for ${label.toLowerCase()}... (e.g., Accra, Kumasi)`}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                autoComplete="off"
              />
              {searching && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2 whitespace-nowrap"
            >
              <FaMapMarkerAlt /> Map
            </button>
          </div>

          {/* Search Results Dropdown - Show if dropdown is open and (we're searching or have results) */}
          {showDropdown && searchQuery.trim() && (searchResults.length > 0 || searching) && (
            <div 
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-yellow-300 rounded-lg shadow-2xl z-[9999] max-h-80 overflow-y-auto"
              style={{ 
                pointerEvents: 'auto',
              }}
            >
              {searching && searchResults.length === 0 && (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500 mb-2"></div>
                  <p className="text-sm text-gray-600 font-medium">Searching for "{searchQuery}"...</p>
                  <p className="text-xs text-gray-400 mt-1">Finding locations matching your search</p>
                </div>
              )}
              
              {searchResults.length > 0 && (
                <>
                  <div className="p-2 bg-yellow-50 border-b border-yellow-100 sticky top-0">
                    <p className="text-xs text-yellow-700 font-semibold">
                      ✨ Found {searchResults.length} location{searchResults.length > 1 ? 's' : ''} - Click to select or use map
                    </p>
                  </div>
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      className="w-full text-left px-4 py-3 hover:bg-yellow-100 active:bg-yellow-200 border-b border-gray-100 last:border-b-0 text-sm flex items-start gap-3 transition-all duration-100"
                    >
                      <FaMapMarkerAlt className="text-yellow-600 mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{result.name || result.display_name}</p>
                        <p className="text-xs text-gray-500 truncate">{result.type || 'Location'}</p>
                        <p className="text-xs text-yellow-600 mt-1">
                          📍 Lat: {parseFloat(result.lat).toFixed(4)}, Lon: {parseFloat(result.lon).toFixed(4)}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Show "No results" message with Ghana fallback options */}
          {showDropdown && searchQuery.trim() && !searching && searchResults.length === 0 && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-yellow-300 rounded-lg shadow-2xl z-[9999] p-4"
            >
              <p className="text-sm text-gray-600 mb-3">⚠️ No locations found for "{searchQuery}"</p>
              <p className="text-xs text-gray-500 mb-3">Suggested Ghana locations:</p>
              <div className="space-y-2">
                {GHANA_LOCATIONS.map((location, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectResult(location)}
                    className="w-full text-left px-3 py-2 hover:bg-yellow-100 text-sm flex items-center gap-2 rounded transition-all"
                  >
                    <FaMapMarkerAlt className="text-yellow-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{location.name}</p>
                      <p className="text-xs text-gray-500">
                        {parseFloat(location.lat).toFixed(4)}, {parseFloat(location.lon).toFixed(4)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-yellow-600 mt-4 font-semibold">💡 Or use the Map button and click to select your location</p>
            </div>
          )}
        </div>

        {/* Display Selected Location */}
        {location && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm font-medium text-yellow-900">✓ Selected:</p>
            <p className="text-sm text-yellow-800 font-semibold">
              {typeof location === 'object' ? location.name : location}
            </p>
            {typeof location === 'object' && location.lat && (
              <p className="text-xs text-yellow-700 mt-1">
                📍 Lat: {parseFloat(location.lat).toFixed(5)}, Lon: {parseFloat(location.lon).toFixed(5)}
              </p>
            )}
          </div>
        )}

        {/* Map Selector - Auto-open when results appear OR for fallback */}
        {(showMap || (searchResults.length > 0 && !searching)) && (
          <div className="mt-4 border-2 border-yellow-300 rounded-md overflow-hidden bg-white shadow-lg" data-map-id={label}>
            {/* Map Instructions */}
            <div className="bg-yellow-50 border-b border-yellow-200 p-3 flex items-start gap-2">
              <FaMapMarkerAlt className="text-yellow-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">
                  {searchResults.length > 0 ? 
                    `🎯 Interactive Map - ${searchResults.length} location${searchResults.length > 1 ? 's' : ''} shown` :
                    `📍 Ghana Map - Click to select ${label.toLowerCase()}`
                  }
                </p>
                <p className="text-xs text-yellow-700">
                  {searchResults.length > 0 ? 
                    `Click a marker on the map to select` : 
                    `Click anywhere on the map to select your location and auto-detect address`
                  }
                </p>
              </div>
            </div>
            {/* Map Container */}
            <div style={{ width: '100%', height: '500px', position: 'relative' }}>
              <MapContainer
                center={mapCenter}
                zoom={searchResults.length > 0 ? 13 : 7}
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                
                {/* Show ALL search results as markers on map */}
                {searchResults.length > 0 && (
                  searchResults.map((result, idx) => {
                    const lat = parseFloat(result.lat);
                    const lon = parseFloat(result.lon);
                    return (
                      <Marker
                        key={`${label}-result-${idx}`}
                        position={[lat, lon]}
                        eventHandlers={{
                          click: () => {
                            console.log('📍 Marker clicked:', result.name);
                            handleSelectResult(result);
                          },
                        }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold text-yellow-700">{result.name || result.display_name}</p>
                            <p className="text-xs text-gray-600 mb-2">{result.type || 'Location'}</p>
                            <p className="text-xs text-gray-500 mb-2">
                              📍 {lat.toFixed(5)}, {lon.toFixed(5)}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                console.log('🔘 Button clicked in popup:', result.name);
                                handleSelectResult(result);
                              }}
                              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-2 rounded text-xs font-medium"
                            >
                              ✓ Select This
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })
                )}
                
                {/* Show all Ghana locations as reference points when no search results */}
                {searchResults.length === 0 && (
                  GHANA_LOCATIONS.map((location, idx) => (
                    <Marker
                      key={`ghana-ref-${idx}`}
                      position={[location.lat, location.lon]}
                      eventHandlers={{
                        click: () => {
                          console.log('📍 Reference location clicked:', location.name);
                          handleSelectResult(location);
                        },
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold text-yellow-700">{location.name}</p>
                          <button
                            type="button"
                            onClick={() => handleSelectResult(location)}
                            className="w-full mt-2 bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-2 rounded text-xs font-medium"
                          >
                            ✓ Select {location.name}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))
                )}
                
                {/* Show previously selected location */}
                {location && location.lat && searchResults.length === 0 && !tempMarker && (
                  <Marker position={[parseFloat(location.lat), parseFloat(location.lon)]}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">✓ Selected</p>
                        <p className="text-xs text-gray-600">{location.name}</p>
                        <p className="text-xs text-gray-500">
                          {parseFloat(location.lat).toFixed(4)}, {parseFloat(location.lon).toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Show temporary marker while selecting */}
                {tempMarker && (
                  <>
                    <Marker position={[tempMarker.lat, tempMarker.lon]}>
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">🔍 Detecting location...</p>
                          <p className="text-xs text-gray-600">
                            {parseFloat(tempMarker.lat).toFixed(4)}, {parseFloat(tempMarker.lon).toFixed(4)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={[tempMarker.lat, tempMarker.lon]}
                      radius={50}
                      pathOptions={{ color: 'red', fillOpacity: 0.1, weight: 2 }}
                    />
                  </>
                )}
                
                <ClickableMap onClick={handleMapClick} />
              </MapContainer>
            </div>
            {/* Map Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-3 flex justify-between items-center">
              <p className="text-xs text-gray-600">
                {tempMarker ? '⏳ Detecting location...' : 
                 searching ? `🔄 Searching (${searchResults.length} results loaded)` :
                 searchResults.length > 0 ? `✨ ${searchResults.length} location${searchResults.length > 1 ? 's' : ''} on map - click marker to select` :
                 `👆 Click on a location marker or anywhere on the map to select`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowMap(false);
                  setTempMarker(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
              >
                Close Map
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component to handle map clicks using proper Leaflet event handling
function ClickableMap({ onClick }) {
  useMapEvents({
    click: (e) => {
      onClick(e);
    },
  });
  return null;
}

export default function TripForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    start_location: '',
    end_location: '',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: '',
    start_mileage: '',
    end_mileage: '',
    distance: '',
    trip_date: new Date().toISOString().split('T')[0],
    status: 'planned',
  });

  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);

  useEffect(() => {
    fetchVehiclesAndDrivers();
    if (id) {
      fetchTrip();
    }
  }, [id]);

  // Auto-calculate distance when both coordinates are set
  useEffect(() => {
    if (startCoords && endCoords) {
      const distance = calculateDistance(startCoords.lat, startCoords.lon, endCoords.lat, endCoords.lon);
      setFormData(prev => ({ ...prev, distance: distance.toFixed(2) }));
    }
  }, [startCoords, endCoords]);

  // Auto-set start_mileage when vehicle is selected
  useEffect(() => {
    if (formData.vehicle_id) {
      const selectedVehicle = vehicles.find(v => v.id === parseInt(formData.vehicle_id));
      if (selectedVehicle && selectedVehicle.mileage && !id) {
        // Only auto-fill on create (not edit)
        setFormData(prev => ({
          ...prev,
          start_mileage: selectedVehicle.mileage.toString()
        }));
      }
    }
  }, [formData.vehicle_id, vehicles, id]);

  // Auto-calculate end_mileage when distance is set
  useEffect(() => {
    if (formData.start_mileage && formData.distance) {
      const startMileage = parseFloat(formData.start_mileage);
      const distance = parseFloat(formData.distance);
      if (!isNaN(startMileage) && !isNaN(distance)) {
        const calculatedEndMileage = (startMileage + distance).toFixed(2);
        setFormData(prev => ({
          ...prev,
          end_mileage: calculatedEndMileage
        }));
      }
    }
  }, [formData.start_mileage, formData.distance]);

  const fetchVehiclesAndDrivers = async () => {
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        api.getVehicles(),
        api.getDrivers(),
      ]);
      setVehicles(vehiclesRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (err) {
      setError('Failed to load vehicles and drivers');
    }
  };

  const fetchTrip = async () => {
    try {
      const trip = await api.getTrip(id);
      if (trip) {
        const tripData = trip.data || trip;
        const safeData = {
          vehicle_id: tripData.vehicle_id ?? '',
          driver_id: tripData.driver_id ?? '',
          start_location: tripData.start_location ?? '',
          end_location: tripData.end_location ?? '',
          start_time: tripData.start_time ?? new Date().toISOString().slice(0, 16),
          end_time: tripData.end_time ?? '',
          start_mileage: tripData.start_mileage ?? '',
          end_mileage: tripData.end_mileage ?? '',
          distance: tripData.distance ?? '',
          trip_date: tripData.trip_date ?? new Date().toISOString().split('T')[0],
          status: tripData.status ?? 'planned',
        };
        setFormData(safeData);

        // Load coordinates if locations exist
        if (tripData.start_location) {
          const startGeo = await geocodeLocation(tripData.start_location);
          if (startGeo) setStartCoords(startGeo);
        }
        if (tripData.end_location) {
          const endGeo = await geocodeLocation(tripData.end_location);
          if (endGeo) setEndCoords(endGeo);
        }
      }
    } catch (err) {
      setError('Failed to load trip');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.vehicle_id) {
      setError('Please select a vehicle');
      setLoading(false);
      return;
    }
    if (!formData.driver_id) {
      setError('Please select a driver');
      setLoading(false);
      return;
    }
    if (!formData.start_location) {
      setError('Please set start location (type or use map)');
      setLoading(false);
      return;
    }
    if (!formData.end_location) {
      setError('Please set end location (type or use map)');
      setLoading(false);
      return;
    }
    if (!formData.trip_date) {
      setError('Please select a trip date');
      setLoading(false);
      return;
    }

    // Validate numeric fields
    const startMileage = parseFloat(formData.start_mileage);
    const endMileage = parseFloat(formData.end_mileage);
    const distance = parseFloat(formData.distance);

    if (formData.start_mileage && (isNaN(startMileage) || startMileage < 0)) {
      setError('Start mileage must be a valid positive number');
      setLoading(false);
      return;
    }
    if (formData.end_mileage && (isNaN(endMileage) || endMileage < 0)) {
      setError('End mileage must be a valid positive number');
      setLoading(false);
      return;
    }
    if (formData.distance && (isNaN(distance) || distance < 0)) {
      setError('Distance must be a valid positive number');
      setLoading(false);
      return;
    }
    if (formData.start_mileage && formData.end_mileage && endMileage < startMileage) {
      setError('End mileage cannot be less than start mileage');
      setLoading(false);
      return;
    }

    try {
      // Format time to Y-m-d\TH:i format (remove seconds if present)
      const formatTimeForBackend = (timeString) => {
        if (!timeString) return '';
        // Handle both ISO format and datetime-local format
        if (timeString.includes('T')) {
          // Remove seconds if present - just keep YYYY-MM-DDTHH:MM
          return timeString.substring(0, 16);
        }
        return timeString;
      };

      // Create a copy of formData with properly formatted values
      const submitData = {
        vehicle_id: parseInt(formData.vehicle_id),
        driver_id: parseInt(formData.driver_id),
        start_location: formData.start_location?.toString() || '',
        end_location: formData.end_location?.toString() || '',
        start_time: formatTimeForBackend(formData.start_time),
        end_time: formatTimeForBackend(formData.end_time),
        start_mileage: formData.start_mileage ? parseFloat(formData.start_mileage) : 0,
        end_mileage: formData.end_mileage ? parseFloat(formData.end_mileage) : 0,
        distance: formData.distance ? parseFloat(formData.distance) : 0,
        trip_date: formData.trip_date,
        status: formData.status,
        // Add coordinates to the trip data
        origin_lat: startCoords ? parseFloat(startCoords.lat) : null,
        origin_lng: startCoords ? parseFloat(startCoords.lon) : null,
        destination_lat: endCoords ? parseFloat(endCoords.lat) : null,
        destination_lng: endCoords ? parseFloat(endCoords.lon) : null,
      };

      console.log('Submitting trip:', submitData);

      if (id) {
        await api.updateTrip(id, submitData);
      } else {
        await api.createTrip(submitData);
      }
      navigate('/trips');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 
                      (err.response?.data?.errors && Object.values(err.response.data.errors).flat().join(', ')) ||
                      err.message || 
                      'Failed to save trip';
      setError(errorMsg);
      console.error('Trip submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const leftBlock = (
    <FormFieldGroup>
      <ModernSelectInput
        label="Vehicle"
        name="vehicle_id"
        value={formData.vehicle_id ?? ''}
        onChange={handleChange}
        options={[
          { value: '', label: 'Select a vehicle' },
          ...vehicles.map((v) => ({
            value: v.id,
            label: `${v.make} ${v.model} (${v.license_plate})`
          }))
        ]}
        required
      />
      <ModernSelectInput
        label="Driver"
        name="driver_id"
        value={formData.driver_id ?? ''}
        onChange={handleChange}
        options={[
          { value: '', label: 'Select a driver' },
          ...drivers.map((d) => ({
            value: d.id,
            label: d.user?.name || d.name || 'Unknown Driver'
          }))
        ]}
        required
      />
      <ModernTextInput
        label="Start Time"
        name="start_time"
        type="datetime-local"
        value={formData.start_time ?? ''}
        onChange={handleChange}
        required
      />
      <ModernTextInput
        label="End Time"
        name="end_time"
        type="datetime-local"
        value={formData.end_time ?? ''}
        onChange={handleChange}
      />
      <ModernTextInput
        label="Start Mileage (km)"
        name="start_mileage"
        type="number"
        value={formData.start_mileage ?? ''}
        onChange={handleChange}
        step="0.01"
        required
        helperText="Auto-filled from vehicle's current mileage"
      />
      <ModernTextInput
        label="End Mileage (km)"
        name="end_mileage"
        type="number"
        value={formData.end_mileage ?? ''}
        onChange={handleChange}
        step="0.01"
        helperText="Auto-calculated from distance (editable)"
      />
      <ModernTextInput
        label="Trip Date"
        name="trip_date"
        type="date"
        value={formData.trip_date ?? ''}
        onChange={handleChange}
        required
      />
    </FormFieldGroup>
  );

  const rightBlock = (
    <FormFieldGroup>
      <LocationPicker
        label="Start Location"
        value={formData.start_location}
        location={startCoords}
        onLocationChange={(location) => setFormData(prev => ({ ...prev, start_location: location }))}
        onCoordinatesChange={setStartCoords}
      />
      
      <LocationPicker
        label="End Location"
        value={formData.end_location}
        location={endCoords}
        onLocationChange={(location) => setFormData(prev => ({ ...prev, end_location: location }))}
        onCoordinatesChange={setEndCoords}
      />

      <ModernTextInput
        label="Calculated Distance (km)"
        name="distance"
        type="number"
        value={formData.distance ?? ''}
        readOnly
        disabled
        step="0.01"
        helperText="Auto-calculated from coordinates if available"
      />

      <ModernSelectInput
        label="Status"
        name="status"
        value={formData.status ?? 'planned'}
        onChange={handleChange}
        options={[
          { value: 'planned', label: 'Planned' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ]}
      />
    </FormFieldGroup>
  );

  return (
    <ModernFormLayout
      title={id ? 'Edit Trip' : 'Add New Trip'}
      subtitle="Manage trip information and details"
      icon={FaRoad}
      isEditing={!!id}
      isLoading={loading}
      error={error}
      onSubmit={handleSubmit}
      backUrl="/trips"
      leftBlock={leftBlock}
      rightBlock={rightBlock}
    />
  );
}
