import L from 'leaflet';

if (typeof window !== 'undefined') {
  window.L = L;
}

import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

export default L;
