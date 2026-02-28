"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapProps {
    lat: number;
    lng: number;
    ip: string;
}

// Helper to update map view when props change
function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center[0] !== 0 && center[1] !== 0) {
            map.flyTo(center, map.getZoom(), {
                duration: 0.8, // Faster duration feels less shaky
                easeLinearity: 0.5
            });
        }
    }, [center, map]);
    return null;
}

export default function Map({ lat, lng, ip }: MapProps) {
    const position: [number, number] = [lat, lng];

    // If coordinates are invalid, don't render to avoid Leaflet crashes
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
        return <div className="w-full h-full bg-[#0B0F17] flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-xs">Awaiting Coordinates...</div>;
    }

    return (
        <MapContainer
            center={position}
            zoom={15}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", zIndex: 10 }}
            zoomControl={false}
        >
            <ZoomControl position="topright" />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={position} />
            <Marker position={position}>
                <Popup>
                    <div className="text-xs font-bold font-sans">
                        IP: {ip} <br />
                        {lat.toFixed(4)}, {lng.toFixed(4)}
                    </div>
                </Popup>
            </Marker>
        </MapContainer>
    );
}
