import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, RotateCcw } from 'lucide-react';

export default function LocationPicker({ latitude, longitude, onChange }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return;

    // Default to Mahabu centroid if not provided
    const initial = latitude && longitude
      ? [Number(latitude), Number(longitude)]
      : [28.9242, 81.7125];

    const map = L.map(mapElement.current).setView(initial, latitude && longitude ? 16 : 13);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    function createMarker(lat, lng) {
      if (markerInstance.current) {
        markerInstance.current.setLatLng([lat, lng]);
      } else {
        markerInstance.current = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerInstance.current.on('dragend', () => {
          const pos = markerInstance.current.getLatLng();
          onChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
        });
      }
      onChange(lat.toFixed(6), lng.toFixed(6));
    }

    map.on('click', (event) => {
      createMarker(event.latlng.lat, event.latlng.lng);
    });

    if (latitude && longitude) {
      createMarker(Number(latitude), Number(longitude));
    }

    return () => {
      map.remove();
      mapInstance.current = null;
      markerInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !latitude || !longitude) return;
    const position = [Number(latitude), Number(longitude)];
    if (!markerInstance.current) {
      markerInstance.current = L.marker(position, { draggable: true }).addTo(mapInstance.current);
      markerInstance.current.on('dragend', () => {
        const value = markerInstance.current.getLatLng();
        onChange(value.lat.toFixed(6), value.lng.toFixed(6));
      });
    } else {
      markerInstance.current.setLatLng(position);
    }
  }, [latitude, longitude]);

  function useCurrentLocation() {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        onChange(lat.toFixed(6), lng.toFixed(6));
        mapInstance.current?.setView([lat, lng], 16);
      },
      () => setGeoError('Location permission was denied. You can click anywhere on the map to place the marker.')
    );
  }

  function clearLocation() {
    markerInstance.current?.remove();
    markerInstance.current = null;
    onChange('', '');
  }

  return (
    <section className="citizen-location">
      <div className="citizen-field-heading">
        <div>
          <strong>Problem Location (GPS Map)</strong>
          <span>Click on the map or drag the pin directly onto the damaged infrastructure.</span>
        </div>
        <div className="location-actions">
          <button type="button" className="citizen-secondary" onClick={useCurrentLocation}>
            <Navigation size={14} /> Use My GPS
          </button>
          <button type="button" className="citizen-text-button" onClick={clearLocation}>
            <RotateCcw size={14} /> Clear Pin
          </button>
        </div>
      </div>

      <div ref={mapElement} className="complaint-location-map" />

      <div className="coordinate-row">
        <label>
          Latitude
          <input value={latitude || ''} readOnly placeholder="Not selected" />
        </label>
        <label>
          Longitude
          <input value={longitude || ''} readOnly placeholder="Not selected" />
        </label>
      </div>

      {geoError && <p className="citizen-message error">{geoError}</p>}
    </section>
  );
}
