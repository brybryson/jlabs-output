"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
                duration: 0.8,
                easeLinearity: 0.5
            });
        }
    }, [center, map]);
    return null;
}

// Manual Zoom Control for stability
function ManualZoomControl() {
    const map = useMap();
    useEffect(() => {
        // Defensive check: only add if the map is ready and has its container initialized
        if (!map || !map.getContainer()) return;

        const control = L.control.zoom({ position: 'topright' });

        try {
            control.addTo(map);
        } catch (e) {
            console.warn('Zoom control addition failed:', e);
        }

        return () => {
            try {
                map.removeControl(control);
            } catch (e) {
                // Ignore removal errors on unmount
            }
        };
    }, [map]);
    return null;
}

// Safe Wrapper to ensure children only render when the map is fully ready
function SafeMapContent({ children }: { children: React.ReactNode }) {
    const map = useMap();
    const [ready, setReady] = useState(false); // Just use standard useState

    useEffect(() => {
        if (map && map.getContainer()) {
            setReady(true);
        }
    }, [map]);

    return ready ? <>{children}</> : null;
}

export default function Map({ lat, lng, ip }: MapProps) {
    const position: [number, number] = [lat, lng];
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    // If coordinates are invalid or not mounted yet, don't render
    if (!isMounted || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
        return <div className="w-full h-full bg-[#0B0F17] flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-xs">Awaiting Coordinates...</div>;
    }

    return (
        <MapContainer
            key={ip}
            center={position}
            zoom={15}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", zIndex: 10 }}
            zoomControl={false}
        >
            <SafeMapChildren lat={lat} lng={lng} ip={ip} />
        </MapContainer>
    );
}

function SafeMapChildren({ lat, lng, ip }: MapProps) {
    const map = useMap();
    const [ready, setReady] = useState(false);
    const position: [number, number] = [lat, lng];

    useEffect(() => {
        if (map) {
            // Give the browser one tick to ensure the DOM container is attached
            const timer = setTimeout(() => setReady(true), 10);
            return () => clearTimeout(timer);
        }
    }, [map]);

    if (!ready) return null;

    return (
        <>
            <ManualZoomControl />
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
        </>
    );
}
