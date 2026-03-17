import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerMapProps {
  value?: [number, number] | null;
  onChange?: (coordinates: [number, number] | null) => void;
}

const CHICAGO_POSITION: [number, number] = [41.8781, -87.6298];

const ClickHandler = ({
  onPick,
}: {
  onPick: (coordinates: [number, number]) => void;
}) => {
  useMapEvents({
    click: (event) => {
      onPick([event.latlng.lng, event.latlng.lat]);
    },
  });

  return null;
};

const LocationPickerMap = ({ value, onChange }: LocationPickerMapProps) => {
  const markerPosition = value
    ? ([value[1], value[0]] as [number, number])
    : null;

  return (
    <div style={{ height: "320px", width: "100%" }}>
      <MapContainer
        center={markerPosition ?? CHICAGO_POSITION}
        zoom={markerPosition ? 13 : 11}
        scrollWheelZoom
        style={{ height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler onPick={(coordinates) => onChange?.(coordinates)} />

        {markerPosition && (
          <CircleMarker
            center={markerPosition}
            radius={8}
            pathOptions={{
              color: "#1d4ed8",
              fillColor: "#1d4ed8",
              fillOpacity: 0.35,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default LocationPickerMap;