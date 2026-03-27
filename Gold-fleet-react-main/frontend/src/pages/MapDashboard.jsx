import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { FaTimes, FaMapMarkerAlt, FaCar, FaRoute, FaGasPump, FaTachometerAlt, FaClock, FaMobileAlt, FaChevronUp, FaChevronDown } from 'react-icons/fa';

// Fix for marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom vehicle marker icon with gold color
const createVehicleIcon = (color = '#CFAF4B', isActive = true) => {
  return L.divIcon({
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
    className: 'vehicle-marker',
    html: `
      <div style="
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: white;
        pointer-events: auto;
        cursor: pointer;
        z-index: 1000;
        position: absolute;
        top: -19px;
        left: -19px;
        ${isActive ? `animation: pulse-active 2s infinite;` : ''}
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16" style="pointer-events: none;">
          <path d="M8 1a1 1 0 0 1 1 1v4h4a1 1 0 0 1 .82 1.573l-4 6A1 1 0 0 1 8 14a1 1 0 0 1-.82-.427l-4-6A1 1 0 0 1 3 6h4V2a1 1 0 0 1 1-1z"/>
        </svg>
      </div>
      <style>
        @keyframes pulse-active {
          0%, 100% { box-shadow: 0 0 10px rgba(207, 175, 75, 0.5); }
          50% { box-shadow: 0 0 20px rgba(207, 175, 75, 0.8); }
        }
      </style>
    `
  });
};

// Device location marker (blue)
const createDeviceIcon = () => {
  return L.divIcon({
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    className: 'device-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #3B82F6;
        border: 3px solid white;
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        cursor: pointer;
        z-index: 1001;
        position: absolute;
        top: -16px;
        left: -16px;
        animation: pulse-device 1.5s infinite;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16" style="pointer-events: none;">
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 1a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
        </svg>
      </div>
      <style>
        @keyframes pulse-device {
          0%, 100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); }
          50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.9); }
        }
      </style>
    `
  });
};

// Map control component to handle auto-pan 
function MapControl({ selectedVehicle, deviceLocation, map }) {
  // only recenter when the selected vehicle/device location actually changes
  const lastCenteredRef = useRef({ vehicleId: null, deviceKey: null });

  useEffect(() => {
    if (!map) return;

    if (selectedVehicle && selectedVehicle.lat && selectedVehicle.lng) {
      if (lastCenteredRef.current.vehicleId !== selectedVehicle.id) {
        map.setView([selectedVehicle.lat, selectedVehicle.lng], 15, { animate: true });
        lastCenteredRef.current.vehicleId = selectedVehicle.id;
        // reset device key so switching back will recenter correctly
        lastCenteredRef.current.deviceKey = null;
      }
    } else if (deviceLocation && deviceLocation.lat && deviceLocation.lng) {
      const deviceKey = `${deviceLocation.lat.toFixed(6)}|${deviceLocation.lng.toFixed(6)}`;
      if (lastCenteredRef.current.deviceKey !== deviceKey) {
        map.setView([deviceLocation.lat, deviceLocation.lng], 14, { animate: true });
        lastCenteredRef.current.deviceKey = deviceKey;
        lastCenteredRef.current.vehicleId = null;
      }
    }
  }, [selectedVehicle, deviceLocation, map]);

  return null;
}

// Click capture component - returns latitude, longitude and area name
function ClickCapture({ onPoint }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const onClick = async (e) => {
      const { lat, lng } = e.latlng;
      let address = '';
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );
        if (res.ok) {
          const data = await res.json();
          // prefer display_name, otherwise build from address parts
          if (data.display_name) {
            address = data.display_name;
          } else if (data.address) {
            const a = data.address;
            const parts = [a.road, a.neighbourhood, a.suburb, a.city_district, a.city, a.county, a.state, a.postcode, a.country].filter(Boolean);
            address = parts.join(', ');
          }
        }
      } catch (err) {
        console.error('Reverse geocode failed', err);
      }

      console.log('map clicked', lat, lng, address);
      onPoint({ lat, lng, address });

      // open popup immediately at click location with full address + coords
      try {
        const content = `
          <div class="text-sm">
            <p class="font-bold">Clicked Point</p>
            <p class="text-xs">Lat: ${lat.toFixed(6)}</p>
            <p class="text-xs">Lng: ${lng.toFixed(6)}</p>
            ${address ? `<p class="text-xs mt-1">${address}</p>` : '<p class="text-xs text-gray-500 mt-1">No address found</p>'}
          </div>`;

        L.popup({ maxWidth: 400 })
          .setLatLng([lat, lng])
          .setContent(content)
          .openOn(map);
      } catch (err) {
        console.warn('Popup open failed', err);
      }
    };

    map.on('click', onClick);
    return () => map.off('click', onClick);
  }, [map, onPoint]);

  return null;
}

export default function MapDashboard() {
  const [searchParams] = useSearchParams();
  const vehicleIdParam = searchParams.get('vehicleId');
  
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [clickedPoint, setClickedPoint] = useState(null);

  const mapRef = useRef(null); // ref attached to MapContainer
  const [mapObj, setMapObj] = useState(null); // actual Leaflet map instance

  const defaultCenter = [5.6037, -0.1870];
  const defaultZoom = 10;

  // when a point is clicked show a popup at that location
  useEffect(() => {
    // show a popup when clickedPoint updates, using the real map instance
    if (clickedPoint && mapObj) {
      L.popup()
        .setLatLng([clickedPoint.lat, clickedPoint.lng])
        .setContent(
          `<div class="text-sm">
            <p class="font-bold">Clicked Point</p>
            <p class="text-xs">Lat: ${clickedPoint.lat.toFixed(6)}</p>
            <p class="text-xs">Lng: ${clickedPoint.lng.toFixed(6)}</p>
            ${clickedPoint.address ? `<p class="text-xs">${clickedPoint.address}</p>` : ''}
          </div>`
        )
        .openOn(mapObj);
    }
  }, [clickedPoint, mapObj]);

  


  // Get actual device location with high precision
  const getDeviceLocation = useCallback(() => {
    console.log('📍 Getting device location...');
    setLoadingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      const msg = 'Geolocation not supported by your browser';
      console.error('❌', msg);
      setLocationError(msg);
      setLoadingLocation(false);
      return;
    }

    let watchId = null;
    let bestAccuracy = Infinity;
    let locationAttempts = 0;
    const maxAttempts = 5;

    // Use watchPosition for continuous, precise location updates
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, timestamp } = position.coords;
        locationAttempts++;
        
        console.log(`📍 Location attempt ${locationAttempts}:`, {
          lat: latitude.toFixed(7),
          lng: longitude.toFixed(7),
          accuracy: `±${Math.round(accuracy)}m`,
        });
        
        // Update location if accuracy improves or it's the first reading
        if (accuracy < bestAccuracy || locationAttempts === 1) {
          bestAccuracy = accuracy;
          const newLocation = {
            lat: latitude, 
            lng: longitude, 
            accuracy: Math.round(accuracy),
            timestamp: new Date(timestamp).toLocaleTimeString()
          };
          console.log('✅ Location updated:', newLocation);
          setDeviceLocation(newLocation);
          setLocationError('');
          setLoadingLocation(false);
        }

        // Stop watching after getting good accuracy (< 20m) or max attempts
        if (accuracy < 20 || locationAttempts >= maxAttempts) {
          console.log('🛑 Stopping location watch - accuracy good or max attempts reached');
          navigator.geolocation.clearWatch(watchId);
        }
      },
      (err) => {
        let errorMsg = 'Unable to get location';
        console.error('❌ Geolocation error code:', err.code, 'Message:', err.message);
        
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. Please enable location in browser settings.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = 'Location not available. Enable GPS and ensure you have clear sky view.';
        } else if (err.code === err.TIMEOUT) {
          errorMsg = 'Location timeout (30s). Move outdoors or try again.';
        }
        console.log('⚠️ Error message:', errorMsg);
        setLocationError(errorMsg);
        setLoadingLocation(false);
        if (watchId) navigator.geolocation.clearWatch(watchId);
      },
      { 
        enableHighAccuracy: true,      // Use GPS for maximum precision
        timeout: 30000,                // Allow up to 30 seconds for GPS lock
        maximumAge: 0                  // Don't use cached position
      }
    );

    console.log('🔍 Started watching position, watchId:', watchId);

    // Store watchId in ref to clear later if needed
    const timeoutId = setTimeout(() => {
      console.log('⏰ Location timeout reached - stopping watch');
      if (watchId) navigator.geolocation.clearWatch(watchId);
    }, 35000);

    return () => {
      clearTimeout(timeoutId);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Fetch live vehicle data
  const fetchVehicleData = useCallback(async () => {
    try {
      setError('');
      try {
        const response = await api.getVehicles();
        const data = Array.isArray(response) ? response : response?.data || [];
        
        const transformedVehicles = data.map(v => ({
          id: v.id,
          name: v.name,
          plate_number: v.plate_number,
          model: v.model,
          status: v.status || 'idle',
          lat: parseFloat(v.latitude || 5.6037),
          lng: parseFloat(v.longitude || -0.1870),
          speed: Math.floor(Math.random() * 120),
          fuel_level: Math.floor(Math.random() * 100) + 20,
          odometer: Math.floor(Math.random() * 150000) + 50000,
          driver_name: v.driver?.name || 'Unassigned',
          last_location_update: new Date().toISOString(),
          heading: Math.floor(Math.random() * 360),
        }));

        console.log('✅ Vehicles loaded from API:', transformedVehicles.length);
        setVehicles(transformedVehicles);
        // Don't auto-select vehicles - prioritize device location first
      } catch (apiError) {
        // Demo vehicles
        const demoVehicles = [
          { id: 1, name: 'Volvo FH16', plate_number: 'GF-001', model: 'Volvo FH16', status: 'active', lat: 5.6037, lng: -0.1870, speed: 85, fuel_level: 75, odometer: 125000, driver_name: 'John Kwame', last_location_update: new Date().toISOString(), heading: 45 },
          { id: 2, name: 'Mercedes Actros', plate_number: 'GF-002', model: 'Mercedes Actros', status: 'active', lat: 5.7433, lng: -0.2508, speed: 60, fuel_level: 85, odometer: 95000, driver_name: 'Ama Seidu', last_location_update: new Date().toISOString(), heading: 180 },
          { id: 3, name: 'Man Truck', plate_number: 'GF-003', model: 'Man Truck', status: 'idle', lat: 6.6945, lng: -0.1876, speed: 0, fuel_level: 45, odometer: 78000, driver_name: 'Kwesi Osei', last_location_update: new Date().toISOString(), heading: 0 },
          { id: 4, name: 'Scania R420', plate_number: 'GF-004', model: 'Scania R420', status: 'active', lat: 5.5520, lng: -0.1960, speed: 95, fuel_level: 60, odometer: 140000, driver_name: 'Yaw Mensah', last_location_update: new Date().toISOString(), heading: 270 },
        ];
        console.log('📦 Using demo vehicles:', demoVehicles.length);
        setVehicles(demoVehicles);
        // Don't auto-select demo vehicles - let device location show first
      }
    } catch (err) {
      setError('Failed to load vehicle data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVehicle]);

  useEffect(() => {
    fetchVehicleData();
    // Request device location on component mount
    const timer = setTimeout(() => {
      console.log('🗺️ Requesting device location on mount...');
      if (navigator.geolocation) {
        // This will be called after getDeviceLocation is accessible
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [fetchVehicleData]);

  // Auto-select vehicle from URL parameter
  useEffect(() => {
    if (vehicleIdParam && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.id === parseInt(vehicleIdParam));
      if (vehicle) {
        setSelectedVehicle(vehicle);
        console.log('Auto-selected vehicle from URL:', vehicle.id);
      }
    }
  }, [vehicleIdParam, vehicles]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setVehicles(prevVehicles =>
        prevVehicles.map(v => ({
          ...v,
          lat: v.lat + (Math.random() - 0.5) * 0.001,
          lng: v.lng + (Math.random() - 0.5) * 0.001,
          speed: Math.max(0, v.speed + Math.floor(Math.random() * 20) - 10),
          fuel_level: Math.max(0, Math.min(100, v.fuel_level - Math.random() * 0.5)),
          heading: (v.heading + Math.floor(Math.random() * 30) - 15) % 360,
          last_location_update: new Date().toISOString(),
        }))
      );

      if (selectedVehicle) {
        setVehicles(prev => {
          const updated = prev.find(v => v.id === selectedVehicle.id);
          if (updated) setSelectedVehicle(updated);
          return prev;
        });
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedVehicle]);

  const getStatusColor = (status) => {
    const statusMap = { 'active': 'text-green-500', 'inactive': 'text-gray-500', 'maintenance': 'text-yellow-500', 'idle': 'text-blue-500' };
    return statusMap[status?.toLowerCase()] || 'text-gray-500';
  };

  const getStatusBgColor = (status) => {
    const statusMap = { 'active': 'bg-green-50 border-green-200', 'inactive': 'bg-gray-50 border-gray-200', 'maintenance': 'bg-yellow-50 border-yellow-200', 'idle': 'bg-blue-50 border-blue-200' };
    return statusMap[status?.toLowerCase()] || 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="w-full h-full relative bg-white overflow-visible flex flex-col" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Control Bar */}
      <div className="z-10 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm p-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-full flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Fleet Tracking</h1>
            <div className="hidden sm:flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isLoading ? 'bg-gray-100 text-gray-600' : autoRefresh ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {isLoading ? 'Loading...' : autoRefresh ? '● Live' : '⏸ Paused'}
              </div>
              <span className="text-xs text-gray-500">{vehicles.length} vehicles</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${autoRefresh ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
            >
              {autoRefresh ? '▶ Live' : '⏸ Paused'}
            </button>
            <button
              onClick={() => fetchVehicleData()}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '⟳' : '⟳ Refresh'}
            </button>
            <button
              onClick={() => getDeviceLocation()}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${loadingLocation ? 'bg-purple-400 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
              disabled={loadingLocation}
              title="Get precise device location"
            >
              {loadingLocation ? '📍 Locating...' : '📍 My Location'}
            </button>
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 transition-all text-sm font-medium"
              title={panelOpen ? 'Hide info panel' : 'Show info panel'}
            >
              {panelOpen ? '✕ Info' : '☰ Info'}
            </button>
          </div>
        </div>
        {locationError && <p className="text-xs text-red-500 mt-2">{locationError}</p>}
      </div>

      {/* Fullscreen Map */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-100 to-gray-50 overflow-visible" style={{ width: '100%', height: '100%', flex: 1, position: 'relative' }}>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 max-w-sm">
              <p className="font-semibold">Error loading map</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <MapContainer
          ref={mapRef}
          whenCreated={(map) => {
            mapRef.current = map;
            setMapObj(map);
            console.log('🗺️ Map created and ready');
          }}
          center={deviceLocation ? [deviceLocation.lat, deviceLocation.lng] : selectedVehicle ? [selectedVehicle.lat, selectedVehicle.lng] : defaultCenter}
          zoom={deviceLocation ? 14 : selectedVehicle ? 15 : defaultZoom}
          style={{ height: '100%', width: '100%', display: 'block' }}
          className="map-fullscreen-wrapper"
          tap={false}
          scrollWheelZoom={true}
          key={`${deviceLocation?.lat || selectedVehicle?.id || 'default'}`}
          whenReady={(mapInstance) => {
            try {
              mapInstance.target.invalidateSize(true);
              console.log('🗺️ Map ready with size adjustment');
            } catch (e) {
              console.warn('Map invalidateSize error:', e);
            }
          }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' maxZoom={19} />

          {/* Vehicle Markers */}
          {vehicles.map(vehicle => (
            <Marker
              key={vehicle.id}
              position={[vehicle.lat, vehicle.lng]}
              icon={createVehicleIcon('#CFAF4B', vehicle.status === 'active')}
              eventHandlers={{ click: () => { setSelectedVehicle(vehicle); setPanelOpen(true); } }}
              pane="markerPane"
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-gray-900">{vehicle.plate_number}</p>
                  <p className="text-xs text-gray-600 mt-1">Speed: {vehicle.speed} km/h</p>
                  <p className="text-xs text-gray-600">Fuel: {vehicle.fuel_level}%</p>
                  <p className="text-xs text-gray-600">Driver: {vehicle.driver_name}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Device Location Marker */}
          {deviceLocation && (
            <Marker position={[deviceLocation.lat, deviceLocation.lng]} icon={createDeviceIcon()} pane="markerPane">
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-blue-600">📱 Your Device Location</p>
                  <p className="text-xs text-gray-600 mt-1">
                    <span className="font-mono">Lat: {deviceLocation.lat?.toFixed(7)}</span>
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-mono">Lng: {deviceLocation.lng?.toFixed(7)}</span>
                  </p>
                  {deviceLocation.accuracy && (
                    <p className="text-xs text-green-600 font-semibold mt-2">
                      ✓ Accuracy: ±{deviceLocation.accuracy}m
                    </p>
                  )}
                  {deviceLocation.timestamp && (
                    <p className="text-xs text-gray-500 mt-1">Updated: {deviceLocation.timestamp}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          <MapControl selectedVehicle={selectedVehicle} deviceLocation={deviceLocation} map={mapObj} />
          {/* Click handler - capture any map click, show coordinates/address */}
          <ClickCapture onPoint={(pt) => setClickedPoint(pt)} />
          {clickedPoint && (
            <Marker position={[clickedPoint.lat, clickedPoint.lng]} pane="markerPane">
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">Clicked Point</p>
                  <p className="text-xs text-gray-600">Lat: {clickedPoint.lat.toFixed(6)}</p>
                  <p className="text-xs text-gray-600">Lng: {clickedPoint.lng.toFixed(6)}</p>
                  {clickedPoint.address && <p className="text-xs text-gray-600">{clickedPoint.address}</p>}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Clicked point summary (top-right, below nav) */}
      {clickedPoint && (
        <div className="absolute top-20 right-4 z-50 bg-white/95 border border-gray-200 rounded p-3 shadow max-w-xs text-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="font-semibold text-sm">Clicked Point</div>
              <div className="text-gray-700 mt-1 font-mono">{clickedPoint.lat.toFixed(6)}, {clickedPoint.lng.toFixed(6)}</div>
              {clickedPoint.address ? (
                <div className="text-gray-600 mt-2 break-words">{clickedPoint.address}</div>
              ) : (
                <div className="text-gray-400 mt-2">No address found</div>
              )}
            </div>
            <button
              onClick={() => setClickedPoint(null)}
              className="ml-2 text-gray-500 hover:text-gray-800"
              title="Close">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Floating Vehicle Info Panel */}
      {panelOpen && (
        <div 
          className="absolute right-0 bottom-0 z-20 bg-white border-l border-gray-300 shadow-2xl transition-all duration-300 flex flex-col w-96 max-w-sm overflow-hidden"
          style={{ top: '76px' }}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between h-12 px-4 border-b border-gray-200 bg-gradient-to-r from-gray-100 to-gray-50 flex-shrink-0">
            <h2 className="text-sm font-bold text-gray-900">Vehicle Info</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPanelMinimized(!panelMinimized)}
                className="p-1 hover:bg-gray-200 rounded text-sm"
                title={panelMinimized ? 'Expand' : 'Minimize'}
              >
                {panelMinimized ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1 hover:bg-gray-200 rounded text-sm"
                title="Close"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Panel Content */}
          {!panelMinimized && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!selectedVehicle && !deviceLocation ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <FaCar className="text-3xl mb-2 opacity-30" />
                  <p className="text-xs text-center mb-3">Select a vehicle or get your device location</p>
                  <button
                    onClick={getDeviceLocation}
                    disabled={loadingLocation}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded text-xs font-medium w-full"
                  >
                    Get Current Device
                  </button>
                </div>
              ) : (
                <>
                  {/* Vehicle Info */}
                  {selectedVehicle && (
                    <>
                      <div className={`border rounded-lg p-3 ${getStatusBgColor(selectedVehicle.status)}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-sm">{selectedVehicle.plate_number}</h3>
                            <p className="text-xs text-gray-600">{selectedVehicle.model}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(selectedVehicle.status)}`}>{selectedVehicle.status}</span>
                        </div>
                      </div>

                      {selectedVehicle.lat && selectedVehicle.lng && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                          <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                            <FaMapMarkerAlt className="text-blue-600 flex-shrink-0" />
                            Location
                          </p>
                          <p className="text-xs text-gray-600 mt-1 font-mono">{selectedVehicle.lat?.toFixed(6)}, {selectedVehicle.lng?.toFixed(6)}</p>
                        </div>
                      )}

                      {selectedVehicle.speed !== undefined && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                          <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                            <FaTachometerAlt className="text-yellow-600" /> Speed
                          </p>
                          <p className="text-sm font-bold text-yellow-700 mt-1">{selectedVehicle.speed} km/h</p>
                        </div>
                      )}

                      {/* Fuel and Odometer info removed for driver UI simplification */}

                      {selectedVehicle.driver_name && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                          <p className="text-xs font-medium text-gray-700">Driver</p>
                          <p className="text-sm font-semibold text-orange-700 mt-1">{selectedVehicle.driver_name}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Device Location */}
                  {deviceLocation && (
                    <div className="bg-cyan-50 border-2 border-cyan-400 rounded-lg p-2">
                      <p className="text-xs font-medium text-gray-700 font-bold flex items-center gap-1">
                        <FaMobileAlt className="text-cyan-600 animate-pulse" /> Your Device (Live)
                      </p>
                      <p className="text-xs text-gray-600 mt-1 font-mono">{deviceLocation.lat?.toFixed(6)}, {deviceLocation.lng?.toFixed(6)}</p>
                      {deviceLocation.accuracy && <p className="text-xs text-cyan-600 mt-1">Accuracy: ±{Math.round(deviceLocation.accuracy)}m</p>}
                    </div>
                  )}

                  {/* Get Device Location Button */}
                  {!deviceLocation && (
                    <button
                      onClick={getDeviceLocation}
                      disabled={loadingLocation}
                      className={`w-full font-semibold py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm ${
                        loadingLocation 
                          ? 'bg-cyan-300 text-white cursor-wait'
                          : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                      }`}
                    >
                      <FaMobileAlt />
                      {loadingLocation ? 'Getting location...' : 'Get Device Location'}
                    </button>
                  )}

                  {/* Vehicle List */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2">All Vehicles ({vehicles.length})</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {vehicles.map(v => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVehicle(v)}
                          className={`w-full text-left px-2 py-1 rounded text-xs transition-all ${
                            selectedVehicle?.id === v.id ? 'bg-yellow-500 text-white font-semibold' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          <div className="truncate">{v.plate_number}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
