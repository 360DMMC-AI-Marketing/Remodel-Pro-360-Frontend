import { useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import GeomanControl from './GeomanControl';

type ServiceAreaPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

interface MyMapProps {
  value?: ServiceAreaPolygon | null;
  onChange?: (polygon: ServiceAreaPolygon | null) => void;
}

const CHICAGO_POSITION: [number, number] = [41.8781, -87.6298];

const MyMap = ({ value, onChange }: MyMapProps) => {
  const handlePolygonComplete = useCallback(
    (polygon: ServiceAreaPolygon | null) => {
      onChange?.(polygon);
    },
    [onChange],
  );

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <MapContainer center={CHICAGO_POSITION} zoom={11} scrollWheelZoom={false} style={{ height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <GeomanControl value={value} onPolygonComplete={handlePolygonComplete} />
      </MapContainer>
    </div>
  );
};

export default MyMap;