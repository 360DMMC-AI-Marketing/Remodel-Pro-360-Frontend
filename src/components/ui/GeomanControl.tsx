import { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free';
import L from 'leaflet';

type ServiceAreaPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

interface GeomanControlProps {
  value?: ServiceAreaPolygon | null;
  onPolygonComplete: (polygon: ServiceAreaPolygon | null) => void;
}

const toClosedGeoJsonRing = (latLngs: L.LatLng[]): number[][] => {
  const ring = latLngs.map((point) => [point.lng, point.lat]);
  if (ring.length === 0) {
    return ring;
  }

  const [firstLng, firstLat] = ring[0];
  const [lastLng, lastLat] = ring[ring.length - 1];
  if (firstLng !== lastLng || firstLat !== lastLat) {
    ring.push([firstLng, firstLat]);
  }

  return ring;
};

const stripClosingPoint = (ring: number[][]): number[][] => {
  if (ring.length <= 1) {
    return ring;
  }

  const [firstLng, firstLat] = ring[0];
  const [lastLng, lastLat] = ring[ring.length - 1];
  if (firstLng === lastLng && firstLat === lastLat) {
    return ring.slice(0, -1);
  }

  return ring;
};

const GeomanControl = ({ value, onPolygonComplete }: GeomanControlProps) => {
  const map = useMap();
  const activeLayerRef = useRef<L.Polygon | null>(null);

  const emitPolygon = useCallback((layer: L.Polygon | null) => {
    if (!layer) {
      onPolygonComplete(null);
      return;
    }

    const latLngGroups = layer.getLatLngs() as L.LatLng[][];
    const outerRing = latLngGroups[0] ?? [];
    const closedRing = toClosedGeoJsonRing(outerRing);

    if (closedRing.length < 4) {
      onPolygonComplete(null);
      return;
    }

    onPolygonComplete({
      type: 'Polygon',
      coordinates: [closedRing],
    });
  }, [onPolygonComplete]);

  useEffect(() => {
    const pmMap = map as L.Map & {
      pm: {
        addControls: (options: {
          position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
          drawMarker: boolean;
          drawCircleMarker: boolean;
          drawPolyline: boolean;
          drawRectangle: boolean;
          drawPolygon: boolean;
          editMode: boolean;
          dragMode: boolean;
          removalMode: boolean;
        }) => void;
        removeControls: () => void;
      };
    };
    pmMap.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      editMode: true,
      dragMode: true,
      removalMode: true,
    });

    const handleCreate = (event: L.LeafletEvent & { layer?: L.Layer }) => {
      const layer = event.layer;
      if (!(layer instanceof L.Polygon)) {
        return;
      }

      if (activeLayerRef.current && activeLayerRef.current !== layer) {
        map.removeLayer(activeLayerRef.current);
      }

      activeLayerRef.current = layer;
      emitPolygon(layer);
    };

    const handleEdit = (event: L.LeafletEvent & { layers?: L.LayerGroup }) => {
      event.layers?.eachLayer((layer) => {
        if (layer === activeLayerRef.current && layer instanceof L.Polygon) {
          emitPolygon(layer);
        }
      });
    };

    const handleDragEnd = (event: L.LeafletEvent & { layer?: L.Layer }) => {
      const layer = event.layer;
      if (layer === activeLayerRef.current && layer instanceof L.Polygon) {
        emitPolygon(layer);
      }
    };

    const handleRemove = (event: L.LeafletEvent & { layer?: L.Layer }) => {
      if (event.layer === activeLayerRef.current) {
        activeLayerRef.current = null;
        onPolygonComplete(null);
      }
    };

    map.on('pm:create', handleCreate);
    map.on('pm:edit', handleEdit);
    map.on('pm:dragend', handleDragEnd);
    map.on('pm:remove', handleRemove);

    return () => {
      map.off('pm:create', handleCreate);
      map.off('pm:edit', handleEdit);
      map.off('pm:dragend', handleDragEnd);
      map.off('pm:remove', handleRemove);
      pmMap.pm.removeControls();

      if (activeLayerRef.current) {
        map.removeLayer(activeLayerRef.current);
        activeLayerRef.current = null;
      }
    };
  }, [emitPolygon, map, onPolygonComplete]);

  useEffect(() => {
    const incomingRing = value?.coordinates?.[0];

    if (!incomingRing || incomingRing.length < 4) {
      if (activeLayerRef.current) {
        map.removeLayer(activeLayerRef.current);
        activeLayerRef.current = null;
      }
      return;
    }

    const ringWithoutClosingPoint = stripClosingPoint(incomingRing);
    const latLngRing = ringWithoutClosingPoint.map(([lng, lat]) => [lat, lng] as [number, number]);
    if (latLngRing.length < 3) {
      return;
    }

    if (!activeLayerRef.current) {
      const layer = L.polygon(latLngRing, {
        color: "#4f46e5",
        fillColor: "#6366f1",
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(map);
      activeLayerRef.current = layer;
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
      return;
    }

    const currentLatLngGroups = activeLayerRef.current.getLatLngs() as L.LatLng[][];
    const currentRing = toClosedGeoJsonRing(currentLatLngGroups[0] ?? []);
    if (JSON.stringify(currentRing) !== JSON.stringify(incomingRing)) {
      activeLayerRef.current.setLatLngs(latLngRing);
    }

    map.fitBounds(activeLayerRef.current.getBounds(), { padding: [20, 20] });
  }, [map, value]);

  return null;
};

export default GeomanControl;