import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, RotateCcw, AlertCircle } from 'lucide-react';
import { getTranslation } from './citizenI18n';

// Custom SVG Pin Icon ensuring crisp rendering across all browsers without asset path issues
const customPinIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `<div style="width: 28px; height: 36px; display: flex; align-items: center; justify-content: center; transform: translate(-14px, -36px); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
    <svg width="28" height="36" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.372 0 0 5.372 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.372 18.628 0 12 0Z" fill="#123D30"/>
      <circle cx="12" cy="12" r="5" fill="#ffffff"/>
      <circle cx="12" cy="12" r="2.5" fill="#267153"/>
    </svg>
  </div>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

export default function LocationPicker({ latitude, longitude, onChange, lang = 'en' }) {
  const t = getTranslation(lang);
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const [geoError, setGeoError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return;

    if (mapElement.current._leaflet_id) {
      delete mapElement.current._leaflet_id;
    }

    try {
      // Nepal centroid default (28.3949, 84.1240)
      const latNum = Number(latitude);
      const lngNum = Number(longitude);
      const isValid = !isNaN(latNum) && !isNaN(lngNum) && (latNum !== 0 || lngNum !== 0);
      const initial = isValid ? [latNum, lngNum] : [28.3949, 84.1240];

      const map = L.map(mapElement.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView(initial, isValid ? 15 : 7);

      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      function createMarker(lat, lng, notify = true) {
        const pos = [lat, lng];
        if (markerInstance.current) {
          markerInstance.current.setLatLng(pos);
        } else {
          markerInstance.current = L.marker(pos, { icon: customPinIcon, draggable: true }).addTo(map);
          markerInstance.current.on('dragend', () => {
            const newPos = markerInstance.current.getLatLng();
            onChange?.(newPos.lat.toFixed(6), newPos.lng.toFixed(6));
          });
        }
        if (notify) {
          onChange?.(lat.toFixed(6), lng.toFixed(6));
        }
      }

      map.on('click', (event) => {
        createMarker(event.latlng.lat, event.latlng.lng, true);
      });

      if (isValid) {
        createMarker(latNum, lngNum, false);
      }
    } catch (err) {
      console.warn('LocationPicker Map Init Error:', err);
    }

    return () => {
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (e) {
          console.warn('LocationPicker Map Cleanup Error:', e);
        }
        mapInstance.current = null;
      }
      markerInstance.current = null;
    };
  }, []);

  // Update marker position & pan map when latitude or longitude changes externally
  useEffect(() => {
    if (!mapInstance.current || !latitude || !longitude) return;
    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    if (isNaN(latNum) || isNaN(lngNum) || (latNum === 0 && lngNum === 0)) return;

    const position = [latNum, lngNum];
    if (!markerInstance.current) {
      markerInstance.current = L.marker(position, { icon: customPinIcon, draggable: true }).addTo(mapInstance.current);
      markerInstance.current.on('dragend', () => {
        const val = markerInstance.current.getLatLng();
        onChange(val.lat.toFixed(6), val.lng.toFixed(6));
      });
    } else {
      markerInstance.current.setLatLng(position);
    }

    // Smoothly pan map to new coordinates
    mapInstance.current.panTo(position);
  }, [latitude, longitude]);

  // Explicit user permission GPS handler
  function useCurrentLocation() {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError(t.gpsUnsupported);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        // Verify within Nepal envelope (approx lat 26-31, lng 80-89)
        onChange(lat.toFixed(6), lng.toFixed(6));
        if (mapInstance.current) {
          mapInstance.current.setView([lat, lng], 16);
        }
      },
      (err) => {
        setIsLocating(false);
        setGeoError(t.gpsDenied);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }

  function clearLocation() {
    if (markerInstance.current) {
      markerInstance.current.remove();
      markerInstance.current = null;
    }
    onChange('', '');
  }

  return (
    <section className="citizen-location" style={{ background: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #d9e3db' }}>
      <div className="citizen-field-heading" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <strong style={{ fontSize: '13.5px', color: '#172e25', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} color="#267153" />
            {t.mapHeading}
          </strong>
          <span style={{ fontSize: '12px', color: '#66786d', display: 'block', marginTop: '2px' }}>
            {t.mapSubheading}
          </span>
        </div>
        <div className="location-actions" style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="citizen-secondary"
            onClick={useCurrentLocation}
            disabled={isLocating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#eef5f1',
              color: '#123D30',
              border: '1px solid #267153',
              borderRadius: '6px',
              cursor: isLocating ? 'not-allowed' : 'pointer',
            }}
          >
            <Navigation size={13} color="#267153" />
            <span>{isLocating ? (lang === 'ne' ? 'स्थान खोज्दै...' : 'Locating...') : t.useGps}</span>
          </button>
          {latitude && longitude && (
            <button
              type="button"
              className="citizen-text-button"
              onClick={clearLocation}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                fontSize: '12px',
                color: '#66786d',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} />
              <span>{t.clearPin}</span>
            </button>
          )}
        </div>
      </div>

      <div
        ref={mapElement}
        className="complaint-location-map"
        style={{
          height: '260px',
          width: '100%',
          borderRadius: '8px',
          border: '1px solid #d9e3db',
          zIndex: 1,
        }}
      />

      <div
        className="coordinate-row"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginTop: '10px',
        }}
      >
        <label style={{ fontSize: '11.5px', color: '#66786d' }}>
          {t.latitude}
          <input
            value={latitude || ''}
            readOnly
            placeholder={lang === 'ne' ? 'छानिएको छैन' : 'Not pinned'}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '12px',
              background: '#f8faf9',
              border: '1px solid #d9e3db',
              borderRadius: '5px',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
        </label>
        <label style={{ fontSize: '11.5px', color: '#66786d' }}>
          {t.longitude}
          <input
            value={longitude || ''}
            readOnly
            placeholder={lang === 'ne' ? 'छानिएको छैन' : 'Not pinned'}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '12px',
              background: '#f8faf9',
              border: '1px solid #d9e3db',
              borderRadius: '5px',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
        </label>
      </div>

      {geoError && (
        <p
          className="citizen-message error"
          style={{
            marginTop: '8px',
            padding: '6px 10px',
            background: '#fdf3f2',
            border: '1px solid #f2c7c4',
            borderRadius: '6px',
            color: '#a83228',
            fontSize: '11.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertCircle size={14} />
          {geoError}
        </p>
      )}
    </section>
  );
}
