import { AdvancedMarker, APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Maximize2, Search, Settings, Check } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { TravelLocation, useTravelStore } from '../store/useTravelStore';

const isWebClient = Platform.OS === 'web' && typeof window !== 'undefined';

// Helper para calcular rumbo (heading) entre dos puntos
const computeHeading = (p1: [number, number], p2: [number, number]) => {
    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    // Usamos atan2(x, y) donde x es el eje vertical (lat) y y el horizontal (lng)
    // Pero en Google Maps rotation 0 es Norte (dy positivo), 90 es Este (dx positivo)
    // Así que atan2(dx, dy) nos da el ángulo desde el Norte.
    return (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;
};

// --- Polylines no vienen por defecto en vis.gl, así que creamos un componente auxiliar ---
const MapPolyline = ({ positions }: { positions: [number, number][] }) => {
    const map = useMap();
    const mapConfig = useTravelStore(state => state.mapConfig);
    const polylineRef = useRef<google.maps.Polyline | null>(null);
    const arrowsRef = useRef<google.maps.Polyline[]>([]);

    useEffect(() => {
        if (!map) return;

        if (!polylineRef.current) {
            polylineRef.current = new google.maps.Polyline({
                map,
                path: positions.map(p => ({ lat: p[0], lng: p[1] })),
                strokeColor: '#4f46e5',
                strokeOpacity: 1.0,
                strokeWeight: 4,
            });
        }

        // Cleanup arrows
        arrowsRef.current.forEach(a => a.setMap(null));
        arrowsRef.current = [];

        if (mapConfig.lineStyle === 'none') {
            polylineRef.current.setMap(null);
        } else if (mapConfig.lineStyle === 'arrows') {
            polylineRef.current.setMap(null); // Ocultar línea sólida
            
            positions.forEach((p, index) => {
                if (index === positions.length - 1) return;
                const nextP = positions[index + 1];
                
                // Evitar dibujar flechas para segmentos de longitud 0 (duplicados)
                const distSq = Math.pow(nextP[0] - p[0], 2) + Math.pow(nextP[1] - p[1], 2);
                if (distSq < 1e-10) return;

                const heading = computeHeading(p, nextP);
                
                // Usar un Marcador para la flecha: más fiable que los iconos de polilínea
                const arrowMarker = new google.maps.Marker({
                    map,
                    position: { lat: p[0], lng: p[1] },
                    zIndex: 2000 - index, // Asegurar que flechas tempranas estén encima
                    icon: {
                        // Estilo "Mars" (♂): Línea alargada + punta de flecha minimalista
                        path: 'M 0,0 L 0,-12 M -1.5,-10.5 L 0,-12 L 1.5,-10.5',
                        scale: 3,
                        strokeColor: '#1e1b4b',
                        strokeWeight: 2,
                        fillOpacity: 0,
                        rotation: heading,
                        anchor: new google.maps.Point(0, 0) // Centrado exacto sobre el marcador
                    },
                    clickable: false
                });
                arrowsRef.current.push(arrowMarker as any);
            });
        } else {
            polylineRef.current.setMap(map);
            polylineRef.current.setOptions({
                strokeOpacity: 1.0,
                icons: [],
                path: positions.map(p => ({ lat: p[0], lng: p[1] })),
            });
        }
    }, [map, positions, mapConfig.lineStyle]);

    useEffect(() => {
        return () => {
            if (polylineRef.current) polylineRef.current.setMap(null);
            arrowsRef.current.forEach(a => a.setMap(null));
        };
    }, []);

    return null;
};

// --- Componente de Auto-ajuste visual (Bounds) ---
const MapBoundsUpdater = ({ locations }: { locations: any[] }) => {
    const map = useMap();
    const hasZoomedRef = useRef(false);

    useEffect(() => {
        if (!map) return;
        const handleCenter = (e: any) => {
            const { lat, lng } = e.detail;
            map.panTo({ lat, lng });
            map.setZoom(15);
        };
        window.addEventListener('centerMapOnLocation', handleCenter);
        return () => window.removeEventListener('centerMapOnLocation', handleCenter);
    }, [map]);

    useEffect(() => {
        if (!map || locations.length === 0 || hasZoomedRef.current) return;

        hasZoomedRef.current = true;
        const bounds = new google.maps.LatLngBounds();
        locations.forEach(loc => bounds.extend({ lat: loc.coordinates[0], lng: loc.coordinates[1] }));

        if (locations.length > 1) {
            map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
        } else {
            map.setCenter({ lat: locations[0].coordinates[0], lng: locations[0].coordinates[1] });
            map.setZoom(12);
        }
    }, [map, locations]);

    return null;
};


// --- Buscador integrado ---
const PlacesAutocompleteUI = () => {
    const map = useMap();
    const addLocation = useTravelStore((state) => state.addLocation);
    const [value, setValue] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const fetchSuggestions = async (text: string) => {
        setValue(text);
        if (!text) {
            setSuggestions([]);
            return;
        }
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;

        try {
            let locationRestriction;
            if (map && map.getBounds()) {
                const bounds = map.getBounds();
                if (bounds) {
                    locationRestriction = {
                        rectangle: {
                            low: { latitude: bounds.getSouthWest().lat(), longitude: bounds.getSouthWest().lng() },
                            high: { latitude: bounds.getNorthEast().lat(), longitude: bounds.getNorthEast().lng() }
                        }
                    };
                }
            }
            const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
                body: JSON.stringify({ input: text, locationRestriction })
            });
            const data = await response.json();
            if (data.suggestions) {
                setSuggestions(data.suggestions.map((s: any) => ({
                    place_id: s.placePrediction.placeId,
                    description: s.placePrediction.text.text,
                    main_text: s.placePrediction.structuredFormat?.mainText?.text
                })));
            } else { setSuggestions([]); }
        } catch (error) { console.warn('Autocomplete error', error); }
    };

    const handleSelect = async (suggestion: any) => {
        setValue(suggestion.description);
        setSuggestions([]);
        try {
            const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
            if (!apiKey) return;

            const resDetails = await fetch(`https://places.googleapis.com/v1/places/${suggestion.place_id}`, {
                headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'location,photos' }
            });
            const dataDetails = await resDetails.json();
            if (!dataDetails.location) return;

            const lat = dataDetails.location.latitude;
            const lng = dataDetails.location.longitude;
            let imageUrl = '';
            if (dataDetails.photos?.length > 0) {
                const photoName = dataDetails.photos[0].name;
                imageUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`;
            }

            const cols = useTravelStore.getState().columns;
            const tColId = cols.find(c => c.title === 'Lugar')?.id;
            const dColId = cols.find(c => c.title === 'Descripción')?.id;

            const placeName = suggestion.main_text || suggestion.description.split(',')[0];
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${suggestion.place_id}`;

            const newLoc: any = {
                title: placeName || 'Destino Buscado',
                coordinates: [lat, lng],
                description: '',
                imageUrl: imageUrl,
                googleMapsUrl: googleMapsUrl
            };

            if (tColId) newLoc[tColId] = placeName;
            if (dColId) newLoc[dColId] = '';

            addLocation(newLoc);
            window.dispatchEvent(new CustomEvent('travel-scroll-to-bottom'));
            if (map) { map.panTo({ lat, lng }); map.setZoom(14); }
        } catch (error) { console.error("Error: ", error); }
    };

    return (
        <div style={{ position: 'absolute', top: 10, left: 50, right: 10, maxWidth: 480, zIndex: 1000, fontFamily: 'system-ui', display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: 40, backgroundColor: 'white', borderRadius: 8, padding: '0 12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <Search color="#6b7280" size={20} style={{ marginRight: 8, flexShrink: 0 }} />
                <input
                    value={value}
                    onChange={(e) => fetchSuggestions(e.target.value)}
                    placeholder="Buscar dirección o lugar..."
                    style={{ flex: 1, border: 'none', outline: 'none', padding: '8px 4px', fontSize: 16 }}
                />
            </div>
            <MapSettingsBtn />
            <FitBoundsBtn />
            {suggestions.length > 0 && (
                <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, listStyle: 'none', margin: '8px 0 0', padding: 0, backgroundColor: 'white', borderRadius: 8, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
                    {suggestions.map((suggestion) => (
                        <li key={suggestion.place_id} onClick={() => handleSelect(suggestion)} style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', fontSize: 14 }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <strong>{suggestion.main_text || suggestion.description.split(',')[0]}</strong> <br />
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{suggestion.description}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

let globalIsDragging = false;

const CustomMarker = ({ loc, index, columns }: { loc: any, index: number, columns: any[] }) => {
    const [selected, setSelected] = useState(false);

    const titleColId = columns.find(c => c.title === 'Lugar')?.id || '';
    const descColId = columns.find(c => c.title === 'Descripción')?.id || '';
    const hourColId = columns.find(c => c.title === 'Hora')?.id || '';

    const handleDragStart = () => {
        globalIsDragging = true;
    };

    const handleDragEnd = async (e: google.maps.MapMouseEvent) => {
        setTimeout(() => { globalIsDragging = false; }, 200);
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        useTravelStore.getState().updateLocation(loc.id, {
            coordinates: [lat, lng]
        });

        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;

        try {
            // First try to find a Point of Interest (POI) to get its real name
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=point_of_interest|establishment&key=${apiKey}&language=es`);
            const data = await response.json();

            let placeResult;
            if (data.results && data.results.length > 0) {
                placeResult = data.results[0];
            } else {
                // Fallback to standard geocoding
                const resNormal = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`);
                const dataNormal = await resNormal.json();
                placeResult = dataNormal.results?.[0];
            }

            if (placeResult) {
                // Si el fetch con point_of_interest funcionó, el formatted_address o address_components tendrán el nombre.
                let placeName = '';
                const estComp = placeResult.address_components?.find((comp: any) => comp.types.includes('establishment') || comp.types.includes('point_of_interest'));

                if (estComp) {
                    placeName = estComp.long_name;
                } else {
                    // Fallback to Nearby Search to find a POI name
                    // Fallback to REST API Nearby Search (New) to avoid Places JS deprecation warnings
                    const nearbyRes = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Goog-Api-Key': apiKey,
                            'X-Goog-FieldMask': 'places.displayName'
                        },
                        body: JSON.stringify({
                            maxResultCount: 1,
                            locationRestriction: {
                                circle: { center: { latitude: lat, longitude: lng }, radius: 25.0 }
                            }
                        })
                    });
                    const nearbyData = await nearbyRes.json();
                    const nearbyName = nearbyData.places?.[0]?.displayName?.text || null;

                    if (nearbyName) {
                        placeName = nearbyName;
                    } else {
                        const firstPart = placeResult.formatted_address.split(',')[0];
                        if (/^\d/.test(firstPart) && placeResult.formatted_address.split(',').length > 1) {
                            const streetComp = placeResult.address_components?.find((c: any) => c.types.includes('route'));
                            placeName = streetComp ? streetComp.long_name : placeResult.formatted_address.split(',')[1].trim();
                        } else {
                            placeName = firstPart;
                        }
                    }
                }
                const pId = placeResult.place_id;

                let newImageUrl = loc.imageUrl;

                if (pId) {
                    try {
                        const resDetails = await fetch(`https://places.googleapis.com/v1/places/${pId}`, {
                            headers: {
                                'X-Goog-Api-Key': apiKey,
                                'X-Goog-FieldMask': 'photos'
                            }
                        });
                        const dataDetails = await resDetails.json();
                        if (dataDetails.photos && dataDetails.photos.length > 0) {
                            const photoName = dataDetails.photos[0].name;
                            newImageUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`;
                        }
                    } catch (err) {
                        console.warn('Failed to fetch photo from new Places API', err);
                    }
                }

                const cols = useTravelStore.getState().columns;
                const tId = cols.find(c => c.title === 'Lugar')?.id;

                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${pId}`;

                const updates: any = { imageUrl: newImageUrl, googleMapsUrl: googleMapsUrl };
                if (tId) updates[tId] = placeName;

                useTravelStore.getState().updateLocation(loc.id, updates);
            }
        } catch (error) {
            console.warn('Reverse geocoding failed', error);
        }
    };

    const onMarkerClick = (e: any) => {
        // Prevent map click from firing
        setSelected(!selected);
    };

    return (
        <AdvancedMarker
            position={{ lat: loc.coordinates[0], lng: loc.coordinates[1] }}
            draggable={true}
            zIndex={selected ? 5000 : 1000 - index}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={onMarkerClick}
        >
            <div style={{ position: 'relative', transform: 'translateY(50%)' }}>
                <div style={{
                    backgroundColor: loc.category === 'opcional' ? '#9333ea' : '#4f46e5', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: 30, 
                    height: 30,
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    fontWeight: 'bold',
                    border: '2px solid white', 
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)', 
                    fontFamily: 'system-ui',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                }}>
                    {loc.planNumber || index + 1}
                </div>

                {selected && (
                    <div style={{
                        position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
                        backgroundColor: 'white', padding: 12, borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        width: 220, fontFamily: 'system-ui', zIndex: 100
                    }}>
                        {loc.imageUrl && (
                            <div style={{ width: '100%', height: 120, marginBottom: 8, borderRadius: 8, overflow: 'hidden' }}>
                                <img src={loc.imageUrl} alt="Lugar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                        <strong style={{ fontSize: '1.1em', color: '#111827' }}>{index + 1}. {titleColId && loc[titleColId] ? loc[titleColId] : 'Destino'}</strong><br />
                        <span style={{ color: '#4b5563', fontSize: '0.85em', display: 'block', marginTop: 4 }}>{descColId && loc[descColId]}</span>
                        <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.9em', display: 'block', marginTop: 4 }}>{hourColId && loc[hourColId]}</span>

                        {/* Close button cross */}
                        <div
                            onClick={(e) => { e.stopPropagation(); setSelected(false); }}
                            style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12 }}
                        >
                            ✕
                        </div>
                    </div>
                )}
            </div>
        </AdvancedMarker>
    );
};


const MapSettingsBtn = () => {
    const { mapConfig, updateMapConfig } = useTravelStore();
    const [isOpen, setIsOpen] = useState(false);

    const options = [
        { id: 'solid', label: 'Líneas Continuas', icon: '⎯' },
        { id: 'arrows', label: 'Flechas Indicadoras', icon: '➔' },
        { id: 'none', label: 'Sin Líneas', icon: '•' },
    ];

    return (
        <div style={{ position: 'relative' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                title="Configuración del Mapa"
                style={{
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 12px', height: 40, flexShrink: 0,
                    backgroundColor: 'white', borderRadius: 8,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    color: isOpen ? '#4f46e5' : '#6b7280', transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = '#eef2ff'; e.currentTarget.style.color = '#4f46e5'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = 'white'; if (!isOpen) e.currentTarget.style.color = '#6b7280'; }}
            >
                <Settings size={18} />
            </div>

            {isOpen && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setIsOpen(false)} />
                    <div style={{
                        position: 'absolute', top: 48, right: 0, width: 200, zIndex: 1000,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
                        borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        padding: '6px', fontFamily: 'system-ui'
                    }}>
                        <div style={{ fontSize: 11, fontWeight: 'bold', color: '#94a3b8', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Estilo de Ruta
                        </div>
                        {options.map((opt) => (
                            <div
                                key={opt.id}
                                onClick={() => { updateMapConfig({ lineStyle: opt.id as any }); setIsOpen(false); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
                                    backgroundColor: mapConfig.lineStyle === opt.id ? '#eef2ff' : 'transparent',
                                    color: mapConfig.lineStyle === opt.id ? '#4f46e5' : '#374151',
                                    fontWeight: mapConfig.lineStyle === opt.id ? '700' : '500',
                                    fontSize: 13
                                }}
                                onMouseEnter={(e: any) => { if (mapConfig.lineStyle !== opt.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                                onMouseLeave={(e: any) => { if (mapConfig.lineStyle !== opt.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{opt.icon}</span>
                                <span style={{ flex: 1 }}>{opt.label}</span>
                                {mapConfig.lineStyle === opt.id && <Check size={14} color="#4f46e5" />}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};


const FitBoundsBtn = () => {
    const map = useMap();
    const { locations, activeDayId } = useTravelStore();

    const handleFit = () => {
        if (!map) return;
        const dayLocs = locations.filter(l => l.dayId === activeDayId);
        if (dayLocs.length === 0) return;
        if (dayLocs.length === 1) {
            map.panTo({ lat: dayLocs[0].coordinates[0], lng: dayLocs[0].coordinates[1] });
            map.setZoom(14);
            return;
        }
        const bounds = new window.google.maps.LatLngBounds();
        dayLocs.forEach(loc => bounds.extend({ lat: loc.coordinates[0], lng: loc.coordinates[1] }));
        map.fitBounds(bounds, 60); // 60px padding
    };

    return (
        <div
            onClick={handleFit}
            title="Ajustar a todos los puntos"
            style={{
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 12px', height: 40, flexShrink: 0,
                backgroundColor: 'white', borderRadius: 8,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                color: '#6b7280', transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = '#eef2ff'; e.currentTarget.style.color = '#4f46e5'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#6b7280'; }}
        >
            <Maximize2 size={18} />
        </div>
    );
};

const MapWeb = () => {
    const { locations, activeDayId, columns, addLocation } = useTravelStore();
    const [mounted, setMounted] = useState(false);

    const activeLocations = useMemo(() => {
        const filtered = locations.filter(loc => loc.dayId === activeDayId);
        // Enrich with planNumber based on original store order for this day
        return filtered.map((l, i) => ({ ...l, planNumber: i + 1 }));
    }, [locations, activeDayId]);

    useEffect(() => {
        if (isWebClient) {
            setMounted(true);
        }
    }, []);

    // Lógica para separar marcadores en la misma posición (Option 1: Deterministic Offset)
    const displayLocations = useMemo(() => {
        const counts: Record<string, number> = {};
        return activeLocations.map((loc) => {
            const key = `${loc.coordinates[0]},${loc.coordinates[1]}`;
            const occurrence = counts[key] || 0;
            counts[key] = occurrence + 1;

            if (occurrence > 0) {
                // Aplicar un pequeño desplazamiento North-East (aprox 15-20m por ocurrencia)
                return {
                    ...loc,
                    displayCoordinates: [
                        loc.coordinates[0] - (occurrence * 0.00012), // Un poco al sur
                        loc.coordinates[1] + (occurrence * 0.00018)  // Un poco al este
                    ] as [number, number]
                };
            }
            return { ...loc, displayCoordinates: loc.coordinates };
        });
    }, [activeLocations]);

    const polylinePositions = useMemo(() => 
        displayLocations.map((loc: any) => loc.displayCoordinates) as [number, number][], 
    [displayLocations]);

    const defaultCenter = useMemo(() => 
        displayLocations.length > 0 
            ? { lat: displayLocations[0].displayCoordinates[0], lng: displayLocations[0].displayCoordinates[1] } 
            : { lat: 30.0, lng: 0.0 }, 
    [displayLocations]);

    const handleMapClick = async (e: any) => {
        if (globalIsDragging) return;
        if (!e.detail || !e.detail.latLng) return;
        const lat = e.detail.latLng.lat;
        const lng = e.detail.latLng.lng;
        // Si el usuario da clic exacto en el icono de un lugar, el evento trae placeId
        const clickedPlaceId = e.detail.placeId;

        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        let placeName = 'Nuevo Destino';
        let googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        let finalPlaceId = clickedPlaceId || '';

        if (apiKey) {
            try {
                let placeResult;

                if (clickedPlaceId) {
                    // Búsqueda directa por PlaceID si está garantizado
                    const resDirect = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?place_id=${clickedPlaceId}&key=${apiKey}&language=es`);
                    const dataDirect = await resDirect.json();
                    if (dataDirect.results && dataDirect.results.length > 0) {
                        placeResult = dataDirect.results[0];
                    }
                }

                if (!placeResult) {
                    // Try POI First to get real commercial names
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=point_of_interest|establishment&key=${apiKey}&language=es`);
                    const data = await response.json();

                    if (data.results && data.results.length > 0) {
                        placeResult = data.results[0];
                    } else {
                        const resNormal = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`);
                        const dataNormal = await resNormal.json();
                        placeResult = dataNormal.results?.[0];
                    }
                }

                if (placeResult) {
                    finalPlaceId = placeResult.place_id;
                    const estComp = placeResult.address_components?.find((comp: any) => comp.types.includes('establishment') || comp.types.includes('point_of_interest'));

                    if (estComp) {
                        placeName = estComp.long_name;
                    } else {
                        // Fallback: Si Geocoding normal no tira un nombre, forzamos un REST Nearby Search (radio de 25m)
                        const nearbyRes = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Goog-Api-Key': apiKey,
                                'X-Goog-FieldMask': 'places.displayName'
                            },
                            body: JSON.stringify({
                                maxResultCount: 1,
                                locationRestriction: {
                                    circle: { center: { latitude: lat, longitude: lng }, radius: 25.0 }
                                }
                            })
                        });
                        const nearbyData = await nearbyRes.json();
                        const nearbyName = nearbyData.places?.[0]?.displayName?.text || null;

                        if (nearbyName) {
                            placeName = nearbyName;
                        } else {
                            // Ultimate fallback: street names
                            const firstPart = placeResult.formatted_address.split(',')[0];
                            if (/^\d/.test(firstPart) && placeResult.formatted_address.split(',').length > 1) {
                                const streetComp = placeResult.address_components?.find((c: any) => c.types.includes('route'));
                                placeName = streetComp ? streetComp.long_name : placeResult.formatted_address.split(',')[1].trim();
                            } else {
                                placeName = firstPart;
                            }
                        }
                    }
                    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${finalPlaceId}`;
                }
            } catch (error) {
                console.warn('Reverse geocoding failed', error);
            }
        }

        const tColId = columns.find(c => c.title === 'Lugar')?.id;
        const dColId = columns.find(c => c.title === 'Descripción')?.id;

        const newLoc: any = {
            title: placeName,
            coordinates: [lat, lng],
            description: '',
            googleMapsUrl: googleMapsUrl
        };

        if (tColId) newLoc[tColId] = placeName;
        if (dColId) newLoc[dColId] = '';

        addLocation(newLoc);
        window.dispatchEvent(new CustomEvent('travel-scroll-to-bottom'));
    };

    if (!mounted || !isWebClient) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Cargando Mapa...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <APIProvider apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                <Map
                    defaultCenter={defaultCenter}
                    defaultZoom={activeLocations.length > 0 ? 10 : 2}
                    mapId="DEMO_MAP_ID"
                    style={{ width: '100%', height: '100%' }}
                    gestureHandling={'greedy'}
                    disableDefaultUI={true}
                    onClick={handleMapClick}
                >
                    <MapBoundsUpdater locations={activeLocations} />
                    <PlacesAutocompleteUI />

                    {activeLocations.length === 0 && (
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(79, 70, 229, 0.95)', color: 'white', padding: '16px 24px',
                            borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
                            zIndex: 500, fontFamily: 'system-ui', textAlign: 'center', pointerEvents: 'none',
                            backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>📍 Día Vacío</h3>
                            <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.9 }}>
                                Busca o haz clic en el mapa<br />para elegir un destino.
                            </p>
                        </div>
                    )}

                    {displayLocations.map((loc: any, index: number) => (
                        <CustomMarker 
                            key={loc.id} 
                            loc={{...loc, coordinates: loc.displayCoordinates}} 
                            index={index} 
                            columns={columns} 
                        />
                    ))}

                    {activeLocations.length > 1 && (
                        <MapPolyline positions={polylinePositions} />
                    )}
                </Map>
            </APIProvider>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, minHeight: 400, width: '100%', borderRadius: 16, overflow: 'hidden',
        // @ts-ignore
        boxShadow: Platform.OS === 'web' ? '0px 8px 24px rgba(0, 0, 0, 0.1)' : undefined,
        backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb'
    },
    loadingContainer: { flex: 1, minHeight: 400, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 16 }
});

export default MapWeb;
