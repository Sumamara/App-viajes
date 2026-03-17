import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Copy, GripVertical, MapPin, MoreVertical, Plus, Trash, Trash2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTravelStore } from '../store/useTravelStore';

let AgGridReact: any;
let themeQuartz: any;
const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
if (isWeb) {
    AgGridReact = require('ag-grid-react').AgGridReact;
    const { ModuleRegistry, AllCommunityModule, themeQuartz: tq } = require('ag-grid-community');
    ModuleRegistry.registerModules([AllCommunityModule]);
    // Theming for AG-Grid v35
    themeQuartz = tq.withParams({
        accentColor: '#4f46e5',
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderRadius: 12,
        browserColorScheme: 'light',
        chromeBackgroundColor: '#f8fafc',
        fontFamily: '"Inter", "system-ui", -apple-system, sans-serif',
        fontSize: 14,
        foregroundColor: '#334155',
        headerBackgroundColor: '#f8fafc',
        headerFontSize: 13,
        headerFontWeight: 700,
        headerTextColor: '#64748b',
        rowBorderColor: '#f1f5f9',
        rowHoverColor: '#f8fafc',
        selectedRowBackgroundColor: '#eef2ff',
        spacing: 10,
        wrapperBorder: false,
    });
}

// Custom Header to allow editing/deleting columns
const CustomHeader = (props: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [newColName, setNewColName] = useState('');
    const [colType, setColType] = useState<'text' | 'date'>('text');

    const toggleMenu = (e: any) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + (typeof window !== 'undefined' ? window.scrollY : 0) + 4,
            left: rect.left + (typeof window !== 'undefined' ? window.scrollX : 0) - 150
        });
        setIsOpen(!isOpen);
    };

    const handleAddCol = () => {
        if (newColName.trim()) {
            props.context.addColumn(newColName.trim(), colType);
            setNewColName('');
            setIsOpen(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', paddingRight: '24px' }}>
            <span style={{ color: '#475569', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold' }}>{props.displayName}</span>
            <div
                onClick={toggleMenu}
                style={{
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    marginRight: '4px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
            >
                <MoreVertical size={14} />
            </div>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
                    <div style={{
                        position: 'absolute', top: menuPosition.top, left: menuPosition.left,
                        backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                        zIndex: 99999, minWidth: 200, overflow: 'hidden', padding: '10px',
                        display: 'flex', flexDirection: 'column', gap: '8px'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase', padding: '0 4px', letterSpacing: '0.5px' }}>Agregar Columna</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                            <select
                                style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', fontWeight: '700', color: '#334155', backgroundColor: '#ffffff' }}
                                value={colType}
                                onChange={(e) => setColType(e.target.value as any)}
                            >
                                <option value="text">Texto Libre</option>
                                <option value="date">Formato Fecha</option>
                            </select>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <input
                                    style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', fontWeight: '700', color: '#334155', backgroundColor: '#ffffff' }}
                                    placeholder="Nombre..."
                                    value={newColName}
                                    onChange={(e) => setNewColName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddCol();
                                    }}
                                />
                                <button
                                    style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', padding: '0 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={handleAddCol}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase', padding: '0 4px', letterSpacing: '0.5px', fontFamily: 'Arial' }}>Modificar Columna</div>

                        <div
                            style={{ padding: '8px 10px', fontSize: 13, cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', fontWeight: '700', color: '#4f46e5', fontFamily: 'Arial' }}
                            onClick={(e) => { e.stopPropagation(); props.context.updateColumnType(props.column.colId, 'text'); setIsOpen(false); }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            ✏️ Cambiar a Texto
                        </div>
                        <div
                            style={{ padding: '8px 10px', fontSize: 13, cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', fontWeight: '700', color: '#4f46e5', fontFamily: 'Arial' }}
                            onClick={(e) => { e.stopPropagation(); props.context.updateColumnType(props.column.colId, 'date'); setIsOpen(false); }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            📅 Cambiar a Fecha
                        </div>
                        <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />
                        <div
                            style={{ padding: '8px 10px', fontSize: 13, cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', fontWeight: '700', color: '#ef4444', fontFamily: 'Arial' }}
                            onClick={(e) => { e.stopPropagation(); props.context.removeColumn(props.column.colId); setIsOpen(false); }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            🗑️ Eliminar Columna
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

// Cell Renderer for Delete Action
const DeleteButton = (props: any) => {
    if (!props.context.isEditing) return null;
    return (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
            <button
                onClick={() => props.context.removeLocation(props.data.id)}
                style={{
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: '8px',
                    padding: '4px 12px',
                    cursor: 'pointer',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '600',
                    fontSize: '12px',
                    fontFamily: 'Arial',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
            >
                <Trash2 size={14} color="#dc2626" />
                Eliminar
            </button>
        </div>
    );
};

// Cell Renderer for Places (Link to Google Maps)
const PlaceRenderer = (props: any) => {
    const url = props.data?.googleMapsUrl;
    if (url && props.value) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: '#4f46e5',
                        textDecoration: 'none',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                    <div style={{ background: '#e0e7ff', padding: '4px', borderRadius: '8px', display: 'flex' }}>
                        <MapPin size={14} color="#4f46e5" />
                    </div>
                    {props.value}
                </a>
            </div>
        );
    }
    return <span style={{ fontWeight: '500', color: '#334155' }}>{props.value}</span>;
};

// Custom Cell Editor for Places Autocomplete
const PlaceEditor = React.forwardRef((props: any, ref) => {
    const [value, setValue] = useState(props.value || '');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const placesLib = useMapsLibrary('places');

    React.useImperativeHandle(ref, () => ({
        getValue: () => value,
        afterGuiAttached: () => inputRef.current?.focus(),
    }));

    const fetchSuggestions = async (text: string) => {
        setValue(text);
        if (!text) { setSuggestions([]); return; }

        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;

        try {
            const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                },
                body: JSON.stringify({ input: text })
            });

            const data = await response.json();
            if (data.suggestions) {
                setSuggestions(data.suggestions.map((s: any) => ({
                    place_id: s.placePrediction.placeId,
                    description: s.placePrediction.text.text,
                    main_text: s.placePrediction.structuredFormat?.mainText?.text
                })));
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.warn('Autocomplete fetch error:', error);
            setSuggestions([]);
        }
    };

    const handleSelect = (suggestion: any) => {
        setValue(suggestion.main_text || suggestion.description.split(',')[0]);
        setSuggestions([]);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => fetchSuggestions(e.target.value)}
                style={{
                    width: '100%',
                    height: 'calc(100% - 12px)',
                    border: '2px solid #6366f1',
                    borderRadius: '8px',
                    outline: 'none',
                    padding: '0 12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
                    backgroundColor: '#ffffff'
                }}
            />
            {suggestions.length > 0 && (
                <ul style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    backgroundColor: 'white', zIndex: 9999,
                    border: '1px solid #e2e8f0', listStyle: 'none',
                    padding: 0, margin: '8px 0 0 0', maxHeight: 200,
                    overflowY: 'auto', borderRadius: '10px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
                }}>
                    {suggestions.map((s) => (
                        <li
                            key={s.place_id}
                            onClick={() => handleSelect(s)}
                            style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '13px', backgroundColor: 'white', color: '#334155' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                            <strong style={{ color: '#0f172a', fontSize: '14px' }}>{s.main_text || s.description.split(',')[0]}</strong><br />
                            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>{s.description}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
});

const RowActionCell = (props: any) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 });
    const context = props.context;
    const dragRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (dragRef.current && props.registerRowDragger) {
            props.registerRowDragger(dragRef.current);
        }
    }, [dragRef.current, props]);

    const toggleMenu = (e: any) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + (typeof window !== 'undefined' ? window.scrollY : 0),
            left: rect.left + (typeof window !== 'undefined' ? window.scrollX : 0)
        });
        setIsOpen(!isOpen);
    };

    const handleNumberClick = (e: any) => {
        e.stopPropagation();
        if (props.data && props.data.coordinates) {
            window.dispatchEvent(new CustomEvent('centerMapOnLocation', {
                detail: { lat: props.data.coordinates[0], lng: props.data.coordinates[1] }
            }));
        }
    };

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '100%', gap: 4 }}>
            {props.node.rowPinned !== 'bottom' && (
                <div
                    ref={dragRef}
                    style={{ cursor: 'grab', display: 'flex', color: '#cbd5e1', padding: '3px', borderRadius: '6px', transition: 'all 0.2s' }}
                    title="Arrastrar fila - Clic para opciones"
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#94a3b8'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                    onClick={toggleMenu}
                >
                    <GripVertical size={16} />
                </div>
            )}

            {props.node.rowPinned === 'bottom' ? (
                <div style={{ fontWeight: '800', color: '#4f46e5', fontSize: '11px', letterSpacing: '0.5px', flexShrink: 0 }}>TOTAL</div>
            ) : (
                <div
                    style={{
                        cursor: 'pointer',
                        backgroundColor: '#e0e7ff',
                        color: '#4338ca',
                        fontWeight: '800',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(67, 56, 202, 0.1)',
                        flexShrink: 0
                    }}
                    onClick={handleNumberClick}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#4f46e5'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#e0e7ff'; e.currentTarget.style.color = '#4338ca'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    title="Centrar en el Mapa"
                >
                    {props.value}
                </div>
            )}

            {/* Se elimina el ícono de Configuración ya que el click está en el GripVertical */}


            {isOpen && typeof document !== 'undefined' && createPortal(
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
                    <div style={{
                        position: 'absolute', top: menuPosition.top + 8, left: menuPosition.left,
                        backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                        zIndex: 99999, minWidth: 180, overflow: 'hidden', padding: '6px'
                    }}>
                        <div
                            style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 10, fontWeight: '700', color: '#4f46e5', fontFamily: 'Arial' }}
                            onClick={(e) => { e.stopPropagation(); context.duplicateLocation(props.data.id); setIsOpen(false); }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <Copy size={16} color="#4f46e5" />
                            <span>Duplicar Fila</span>
                        </div>
                        <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />
                        <div
                            style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 10, fontWeight: '700', fontFamily: 'Arial' }}
                            onClick={(e) => { e.stopPropagation(); context.removeLocation(props.data.id); setIsOpen(false); }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <Trash size={16} color="#ef4444" />
                            <span style={{ color: '#ef4444' }}>Eliminar Fila</span>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

const DayTabs = () => {
    const { locations, columns, days, activeDayId, setActiveDay, addDay, removeDay, renameDay, duplicateDay, reorderDays, importData } = useTravelStore();
    const [editingDayId, setEditingDayId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [menuOpenDayId, setMenuOpenDayId] = useState<string | null>(null);
    const [draggedDayId, setDraggedDayId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

    const startEdit = (day: any) => {
        setEditingDayId(day.id);
        setEditTitle(day.title);
        setMenuOpenDayId(null);
    };

    const saveEdit = (dayId: string) => {
        if (editTitle.trim() && editTitle.trim() !== days.find(d => d.id === dayId)?.title) {
            renameDay(dayId, editTitle.trim());
        }
        setEditingDayId(null);
    };

    const handleDrop = (e: React.DragEvent, targetDayId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('dayId');
        if (!draggedId || draggedId === targetDayId) return;

        const draggedIndex = days.findIndex(d => d.id === draggedId);
        const targetIndex = days.findIndex(d => d.id === targetDayId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newDays = [...days];
        const [movedDay] = newDays.splice(draggedIndex, 1);
        newDays.splice(targetIndex, 0, movedDay);

        reorderDays(newDays);
        setDraggedDayId(null);
    };

    return (
        <div style={{ position: 'relative' }}>
            {menuOpenDayId && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => setMenuOpenDayId(null)}
                    onContextMenu={(e) => { e.preventDefault(); setMenuOpenDayId(null); }}
                />
            )}
            <div style={{
                display: 'flex', gap: '8px', padding: '16px 28px 0px 28px', backgroundColor: '#ffffff',
                alignItems: 'center', overflowX: 'auto', overflowY: 'hidden', borderBottom: '1px solid transparent',
                scrollbarWidth: 'none', msOverflowStyle: 'none'
            }} className="hide-scrollbar">
                {days.map((day) => {
                    const isActive = day.id === activeDayId;
                    const isEditing = editingDayId === day.id;
                    const isDragged = draggedDayId === day.id;

                    return (
                        <div
                            key={day.id}
                            draggable={!isEditing}
                            onDragStart={(e) => {
                                e.dataTransfer.setData('dayId', day.id);
                                setDraggedDayId(day.id);
                            }}
                            onDragEnd={() => setDraggedDayId(null)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, day.id)}
                            onClick={() => { if (!isEditing) setActiveDay(day.id); }}
                            onDoubleClick={(e) => { e.stopPropagation(); startEdit(day); }}
                            style={{
                                padding: '10px 20px', borderRadius: '12px 12px 0 0', cursor: isEditing ? 'text' : 'grab',
                                backgroundColor: isActive ? '#f8fafc' : 'transparent',
                                color: isActive ? '#4f46e5' : '#64748b',
                                fontWeight: isActive ? '700' : '500',
                                border: '1px solid',
                                borderColor: isActive ? '#e2e8f0' : 'transparent',
                                borderBottom: isActive ? '2px solid #4f46e5' : 'transparent',
                                marginBottom: '-1px',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                minWidth: 'max-content',
                                position: 'relative',
                                opacity: isDragged ? 0.5 : 1,
                                fontFamily: '"Inter", "system-ui", -apple-system, sans-serif',
                                textTransform: 'uppercase',
                                fontSize: '12px'
                            }}
                            onMouseEnter={e => { if (!isActive && !isEditing) e.currentTarget.style.color = '#334155'; }}
                            onMouseLeave={e => { if (!isActive && !isEditing) e.currentTarget.style.color = '#64748b'; }}
                        >
                            {isEditing ? (
                                <input
                                    autoFocus
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    onBlur={() => saveEdit(day.id)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') saveEdit(day.id);
                                        if (e.key === 'Escape') setEditingDayId(null);
                                    }}
                                    style={{
                                        border: '1px solid #cbd5e1', borderRadius: 4, padding: '2px 6px',
                                        fontSize: 14, fontWeight: '600', color: '#0f172a', outline: 'none',
                                        width: Math.max(80, editTitle.length * 8 + 20),
                                        fontFamily: '"Inter", "system-ui", -apple-system, sans-serif'
                                    }}
                                />
                            ) : (
                                <span title="Doble clic para renombrar">{day.title}</span>
                            )}
                            {days.length > 0 && !isEditing && (
                                <div>
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (menuOpenDayId === day.id) {
                                                setMenuOpenDayId(null);
                                            } else {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setMenuPos({ top: rect.bottom + 4, left: rect.left });
                                                setMenuOpenDayId(day.id);
                                            }
                                        }}
                                        style={{ padding: '2px', borderRadius: '4px', display: 'flex', cursor: 'pointer' }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <MoreVertical size={14} color={isActive ? "#4f46e5" : "#94a3b8"} />
                                    </div>

                                    {menuOpenDayId === day.id && createPortal(
                                        <div style={{
                                            position: 'absolute', top: menuPos.top, left: menuPos.left,
                                            backgroundColor: '#ffffff', borderRadius: '8px', padding: '4px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                            border: '1px solid #e2e8f0', zIndex: 9999, minWidth: '140px'
                                        }}>
                                            <div
                                                onClick={(e) => { e.stopPropagation(); duplicateDay(day.id); setMenuOpenDayId(null); }}
                                                style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 10, color: '#4f46e5', fontWeight: '700', fontFamily: 'Arial' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <Copy size={14} color="#4f46e5" />
                                                Duplicar Día
                                            </div>
                                            {days.length > 1 && (
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); removeDay(day.id); setMenuOpenDayId(null); }}
                                                    style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', fontWeight: '700', marginTop: '2px', fontFamily: 'Arial' }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <Trash2 size={14} color="#ef4444" />
                                                    Eliminar Día
                                                </div>
                                            )}
                                        </div>,
                                        document.body
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                <button
                    onClick={() => addDay(`Día ${days.length + 1}`)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                        borderRadius: '12px', cursor: 'pointer', border: '1px dashed #cbd5e1',
                        backgroundColor: 'transparent', color: '#64748b', fontWeight: '600',
                        fontSize: '13px', transition: 'all 0.2s ease', minWidth: 'max-content'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; }}
                >
                    <Plus size={14} />

                </button>
            </div>
        </div>
    );
};

const ItineraryTableWeb = () => {
    const { locations, activeDayId, columns, updateLocation, reorderLocations, addLocation, removeLocation, addColumn, removeColumn, duplicateLocation, updateColumnType } = useTravelStore();

    const activeLocations = useMemo(() => {
        return locations.filter(loc => loc.dayId === activeDayId);
    }, [locations, activeDayId]);

    const pinnedBottomRowData = useMemo(() => {
        if (activeLocations.length === 0) return [];

        const totals: any = { isTotal: true };
        columns.forEach(col => {
            const title = col.title.toLowerCase();
            // Columns that we should try to sum
            const isNumericCol = title.includes('costo') ||
                title.includes('precio') ||
                title.includes('gasto') ||
                title.includes('distancia') ||
                title.includes('total') ||
                title.includes('monto');

            if (isNumericCol) {
                const sum = activeLocations.reduce((acc, loc) => {
                    const val = loc[col.id];
                    if (!val) return acc;
                    // Extract numbers from string (handles "$100", "10.5 km", etc)
                    const numMatch = String(val).match(/[-+]?[0-9]*\.?[0-9]+/);
                    return acc + (numMatch ? parseFloat(numMatch[0]) : 0);
                }, 0);

                // Format if it was distance
                if (title.includes('distancia')) {
                    totals[col.id] = sum > 0 ? `${sum.toFixed(1)} km` : '-';
                } else if (sum > 0) {
                    totals[col.id] = sum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                } else {
                    totals[col.id] = '-';
                }
            } else {
                totals[col.id] = '';
            }
        });
        return [totals];
    }, [activeLocations, columns]);

    // Auto-scroll logic variables
    const [gridApi, setGridApi] = useState<any>(null);
    const prevLocationsLengthRef = React.useRef(activeLocations.length);

    React.useEffect(() => {
        if (gridApi && activeLocations.length > prevLocationsLengthRef.current) {
            // Un nuevo lugar fue añadido
            setTimeout(() => {
                gridApi.ensureIndexVisible(activeLocations.length - 1, 'bottom');
            }, 100); // Pequeño retraso para asegurar que AG-Grid ya renderizó la nueva fila
        }
        prevLocationsLengthRef.current = activeLocations.length;
    }, [activeLocations.length, gridApi]);

    const colDefs = useMemo(() => {
        const defs: any[] = [
            {
                headerName: '',
                valueGetter: (params: any) => params.node.rowPinned === 'bottom' ? '' : params.node.rowIndex + 1,
                width: 80,
                minWidth: 80,
                maxWidth: 80,
                rowDrag: false,
                pinned: 'left',
                editable: false,
                sortable: false,
                filter: false,
                resizable: false,
                cellRenderer: RowActionCell,
                cellStyle: { paddingLeft: '8px', borderRight: '1px solid #f1f5f9' }
            }
        ];

        columns.forEach((col) => {
            const isPlace = col.title === 'Lugar';
            const isDate = col.type === 'date';

            defs.push({
                field: col.id,
                headerName: col.title,
                flex: 1,
                minWidth: 180,
                suppressMenu: true,
                editable: (params: any) => !params.node.rowPinned,
                headerComponent: CustomHeader,
                cellEditor: isPlace ? PlaceEditor : (isDate ? 'agDateStringCellEditor' : 'agTextCellEditor'),
                cellRenderer: isPlace ? PlaceRenderer : undefined,
                valueFormatter: isDate ? (params: any) => {
                    if (!params.value) return '';
                    const d = new Date(params.value);
                    if (isNaN(d.getTime())) return params.value;
                    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                    return `${days[d.getDay()]} ${d.getDate()}`;
                } : undefined,
                cellStyle: { display: 'flex', alignItems: 'center' }
            });
        });

        return defs;
    }, [columns]);

    const onRowDragEnd = (e: any) => {
        const newLocations: any[] = [];
        e.api.forEachNode((node: any) => newLocations.push(node.data));
        reorderLocations(newLocations);
    };

    if (!isWeb || !AgGridReact) return <View style={styles.loadingContainer}><Text style={{ color: '#64748b', fontSize: 16, fontWeight: '500' }}>Cargando Itinerario Increíble...</Text></View>;

    return (
        <View style={styles.container}>
            <DayTabs />

            <div style={{ flex: 1, width: '100%', position: 'relative', background: '#f8fafc' }}>
                <APIProvider apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                    <AgGridReact
                        theme={themeQuartz}
                        rowData={activeLocations}
                        columnDefs={colDefs}
                        getRowId={(params: any) => params.data.id}
                        rowDragManaged={true}
                        animateRows={true}
                        context={{ removeLocation, removeColumn, updateColumnType, duplicateLocation, addColumn }}
                        onRowDragEnd={onRowDragEnd}
                        onGridReady={(params: any) => setGridApi(params.api)}
                        onCellValueChanged={(e: any) => updateLocation(e.data.id, { [e.column.colId]: e.newValue })}
                        getRowHeight={(params: any) => {
                            if (params.node.rowPinned === 'bottom') return 40;
                            return 48;
                        }}
                        pinnedBottomRowData={pinnedBottomRowData}
                        getRowStyle={(params: any) => {
                            if (params.node.rowPinned === 'bottom') {
                                return {
                                    fontWeight: 'bold',
                                    backgroundColor: '#f1f5f9',
                                    borderTop: '2px solid #e2e8f0',
                                    color: '#1e293b',
                                    display: 'flex',
                                    alignItems: 'center'
                                };
                            }
                            return undefined;
                        }}
                    />
                </APIProvider>
            </div>
        </View>
    );
};

const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    fontWeight: 500,
    outline: 'none',
    color: '#334155',
    background: 'white',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

const addActionStyle: React.CSSProperties = {
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    background: '#4f46e5',
    color: 'white',
    fontWeight: 'bold',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1)'
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        // @ts-ignore
        boxShadow: Platform.OS === 'web' ? '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)' : undefined
    },
    loadingContainer: { flex: 1, minHeight: 400, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 24 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 28,
        paddingBottom: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
        flexWrap: 'wrap',
        gap: 20,
        backgroundColor: '#ffffff'
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
    },
    title: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 10,
        // @ts-ignore
        transition: 'all 0.2s ease',
        // @ts-ignore
        cursor: 'pointer'
    },
    btnText: { fontWeight: '700', fontSize: 15 }
});

export default ItineraryTableWeb;
