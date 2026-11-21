import { Building2, GraduationCap, HeartPulse, House, Layers3, Maximize2, TriangleAlert } from 'lucide-react';
import { mapLegend, mapLocations } from '../data/demoData';
import { Card, CardHeader, DemoLabel, TextButton } from './ui';

const markerIcons = {
  village: House,
  bridge: TriangleAlert,
  health: HeartPulse,
  school: GraduationCap,
};

export default function VillageMapPreview({ onOpenMap, expanded = false }) {
  return (
    <Card className={`map-card ${expanded ? 'map-card--expanded' : ''}`}>
      <CardHeader
        eyebrow="Infrastructure overview"
        title="Village map"
        description="Facilities, settlements and reported disruptions at a glance."
        action={<TextButton onClick={onOpenMap}>View full map</TextButton>}
      />
      <div className="map-preview" aria-label="Stylized demonstration map of village infrastructure">
        <div className="map-preview__controls" aria-hidden="true">
          <span><Layers3 size={16} /></span>
          <span><Maximize2 size={16} /></span>
        </div>
        <span className="map-preview__river" aria-hidden="true" />
        <span className="map-preview__road map-preview__road--one" aria-hidden="true" />
        <span className="map-preview__road map-preview__road--two" aria-hidden="true" />
        {mapLocations.map((location) => {
          const MarkerIcon = markerIcons[location.type] || Building2;
          return (
            <button
              key={location.id}
              className={`map-marker map-marker--${location.status}`}
              style={{ left: `${location.x}%`, top: `${location.y}%` }}
              type="button"
              aria-label={`${location.label}, ${location.status}`}
            >
              <span><MarkerIcon size={15} /></span>
              <strong>{location.label}</strong>
            </button>
          );
        })}
        <DemoLabel />
      </div>
      <div className="map-legend" aria-label="Map legend">
        {mapLegend.map(({ label, color, icon: Icon }) => (
          <span key={label}><i className={`legend-dot legend-dot--${color}`}><Icon size={11} /></i>{label}</span>
        ))}
      </div>
    </Card>
  );
}
