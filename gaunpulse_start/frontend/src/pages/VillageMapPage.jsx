import { useEffect, useState } from 'react';
import {
  Building2,
  Filter,
  GraduationCap,
  HeartPulse,
  Home,
  Layers,
  MapPin,
  RefreshCw,
  TriangleAlert,
  Waypoints,
} from 'lucide-react';
import InteractiveVillageMap from '../components/InteractiveVillageMap';
import { Card, CardHeader, DemoLabel, FeatureNotice, PageIntro } from '../components/ui';

export default function VillageMapPage() {
  const [villages, setVillages] = useState([]);
  const [selectedVillageId, setSelectedVillageId] = useState(1);
  const [villageData, setVillageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/villages')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVillages(data);
          setSelectedVillageId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to load villages:', err));
  }, []);

  useEffect(() => {
    if (!selectedVillageId) return;
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/villages/${selectedVillageId}/network`)
      .then((res) => res.json())
      .then((data) => {
        setVillageData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load village network:', err);
        setLoading(false);
      });
  }, [selectedVillageId]);

  const village = villageData?.village || {};
  const nodes = villageData?.nodes || [];
  const edges = villageData?.edges || [];

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Spatial GIS overview"
        title="Village Infrastructure Map"
        description="Interactive geographic visualization of village lifelines, settlements, essential facilities, and road connections powered by Leaflet and OpenStreetMap."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={selectedVillageId}
              onChange={(e) => setSelectedVillageId(Number(e.target.value))}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #dfe6df',
                background: '#fff',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.district})
                </option>
              ))}
            </select>
            <DemoLabel compact />
          </div>
        }
      />

      <FeatureNotice title="Georeferenced Infrastructure Network" icon={MapPin}>
        Showing validated nodes and edges for {village.name || 'Demonstration Village'}. Click any road, bridge, or facility pin to inspect its condition and length.
      </FeatureNotice>

      {/* Village Summary Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <Card style={{ padding: '14px', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Home size={22} color="#176342" />
            <div>
              <span style={{ fontSize: '11px', color: '#687c73', textTransform: 'uppercase', fontWeight: 'bold' }}>Settlements</span>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#092d22' }}>
                {nodes.filter((n) => n.node_type === 'settlement' || n.type === 'settlement' || n.settlement_group_id).length}
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '14px', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HeartPulse size={22} color="#0f766e" />
            <div>
              <span style={{ fontSize: '11px', color: '#687c73', textTransform: 'uppercase', fontWeight: 'bold' }}>Health Facilities</span>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#092d22' }}>
                {nodes.filter((n) => n.node_code === 'health_post' || n.type === 'health_post').length}
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '14px', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GraduationCap size={22} color="#1d4ed8" />
            <div>
              <span style={{ fontSize: '11px', color: '#687c73', textTransform: 'uppercase', fontWeight: 'bold' }}>Schools</span>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#092d22' }}>
                {nodes.filter((n) => n.node_code === 'school' || n.type === 'school').length}
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '14px', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Waypoints size={22} color="#b45309" />
            <div>
              <span style={{ fontSize: '11px', color: '#687c73', textTransform: 'uppercase', fontWeight: 'bold' }}>Bridges</span>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#092d22' }}>
                {edges.filter((e) => (e.infrastructure_type || e.type) === 'bridge').length}
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '14px', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={22} color="#248157" />
            <div>
              <span style={{ fontSize: '11px', color: '#687c73', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Road Segments</span>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#092d22' }}>
                {edges.filter((e) => (e.infrastructure_type || e.type) !== 'bridge').length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Full Interactive Map */}
      <Card>
        <CardHeader
          eyebrow="OpenStreetMap GIS"
          title={`${village.name || 'Demonstration Village'} Lifeline Layer`}
          description="Interactive map with OpenStreetMap tiles, geocoded infrastructure nodes, and condition-coded edges."
        />
        <InteractiveVillageMap
          villageData={villageData}
          height="620px"
          onSelectEdge={(edge) => setSelectedEdge(edge)}
          selectedEdgeId={selectedEdge?.id}
        />
      </Card>

      {/* Selected Infrastructure Detail Box (if clicked) */}
      {selectedEdge && (
        <Card style={{ background: '#f1f8f2', border: '1px solid #248157' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow" style={{ color: '#176342' }}>Selected Infrastructure Asset</span>
              <h3 style={{ margin: '2px 0 6px', color: '#092d22' }}>{selectedEdge.name}</h3>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#19392f' }}>
                <strong>Type:</strong> {selectedEdge.infrastructure_type || selectedEdge.type} · <strong>Surface:</strong> {selectedEdge.surface_type || 'Gravel'} · <strong>Length:</strong> {selectedEdge.length_meters || 0}m
              </p>
              {selectedEdge.notes && <p style={{ margin: 0, fontStyle: 'italic', color: '#475569', fontSize: '12.5px' }}>{selectedEdge.notes}</p>}
            </div>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => setSelectedEdge(null)}
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              Clear
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
