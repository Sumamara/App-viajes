import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTravelStore } from '../store/useTravelStore';
import { CheckCircle2, Circle, Star, Info, MapPin, Clock } from 'lucide-react-native';

export default function TravelChronogram() {
    const { locations, activeDayId, toggleLocationCompleted, updateLocationCategory, columns } = useTravelStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    // Filter by active day and sort: pending first, then completed.
    // Maintain original relative order within those groups if possible.
    const dayLocations = useMemo(() => {
        const filtered = locations.filter(l => l.dayId === activeDayId);
        
        // We need a stable index for the original order
        const indexed = filtered.map((l, i) => ({ ...l, originalIndex: i }));
        
        return indexed.sort((a, b) => {
            if (a.completed === b.completed) return a.originalIndex - b.originalIndex;
            return a.completed ? 1 : -1;
        });
    }, [locations, activeDayId]);

    // Find column IDs for display
    const colIds = useMemo(() => ({
        activity: columns.find(c => c.title === 'Actividad')?.id || 'activity',
        place: columns.find(c => c.title === 'Lugar')?.id || 'place',
        hours: columns.find(c => c.title === 'Hora')?.id || 'hours',
    }), [columns]);

    const renderLocation = (loc: any) => {
        const isPrincipal = loc.category === 'principal' || !loc.category;
        
        const cardStyle = [
            styles.card,
            isPrincipal ? styles.cardPrincipal : styles.cardOptional,
            loc.completed && styles.cardCompleted
        ];

        return (
            <View key={loc.id} style={cardStyle}>
                <View style={styles.cardMain}>
                    {/* Checkbox */}
                    <TouchableOpacity 
                        onPress={() => toggleLocationCompleted(loc.id)}
                        style={styles.checkArea}
                    >
                        {loc.completed ? (
                            <CheckCircle2 size={28} color="#10b981" fill="#ecfdf5" />
                        ) : (
                            <Circle size={28} color={isPrincipal ? "#4f46e5" : "#94a3b8"} />
                        )}
                    </TouchableOpacity>

                    {/* Content */}
                    <View style={styles.contentArea}>
                        <View style={styles.row}>
                            <Text style={[styles.placeText, loc.completed && styles.textCompleted]}>
                                {loc[colIds.place] || 'Lugar sin nombre'}
                            </Text>
                            {isPrincipal && !loc.completed && (
                                <View style={styles.badgePrincipal}>
                                    <Star size={10} color="#fff" fill="#fff" />
                                    <Text style={styles.badgeText}>Principal</Text>
                                </View>
                            )}
                        </View>
                        
                        <View style={styles.detailsRow}>
                            {loc[colIds.hours] && (
                                <View style={styles.detailItem}>
                                    <Clock size={12} color="#64748b" />
                                    <Text style={styles.detailText}>{loc[colIds.hours]}</Text>
                                </View>
                            )}
                            {loc[colIds.activity] && (
                                <View style={styles.detailItem}>
                                    <Info size={12} color="#64748b" />
                                    <Text style={styles.detailText}>{loc[colIds.activity]}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Category Toggle (Small pill) */}
                    <TouchableOpacity 
                        onPress={() => updateLocationCategory(loc.id, isPrincipal ? 'opcional' : 'principal')}
                        style={[styles.categoryToggle, isPrincipal ? styles.toggleActive : styles.toggleInactive]}
                    >
                        <Text style={styles.toggleText}>{isPrincipal ? 'VIP' : 'Opt'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Cronograma en Vivo</Text>
                <Text style={styles.subtitle}>Toca para marcar lo completado</Text>
            </View>

            {dayLocations.length === 0 ? (
                <View style={styles.emptyState}>
                    <MapPin size={48} color="#e2e8f0" />
                    <Text style={styles.emptyText}>No hay lugares planeados para hoy</Text>
                </View>
            ) : (
                dayLocations.map(renderLocation)
            )}
            
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContent: { padding: 16 },
    header: { marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    
    card: {
        borderRadius: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    cardPrincipal: {
        borderLeftWidth: 6,
        borderLeftColor: '#4f46e5',
        backgroundColor: '#ffffff',
    },
    cardOptional: {
        borderLeftWidth: 6,
        borderLeftColor: '#cbd5e1',
        backgroundColor: '#f1f5f9',
    },
    cardCompleted: {
        opacity: 0.6,
        borderLeftColor: '#10b981',
        backgroundColor: '#f8fafc',
    },
    
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    checkArea: {
        marginRight: 16,
    },
    contentArea: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    placeText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1e293b',
    },
    textCompleted: {
        textDecorationLine: 'line-through',
        color: '#94a3b8',
    },
    
    detailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    
    badgePrincipal: {
        backgroundColor: '#4f46e5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    
    categoryToggle: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 8,
    },
    toggleActive: {
        backgroundColor: '#eef2ff',
    },
    toggleInactive: {
        backgroundColor: '#f1f5f9',
    },
    toggleText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#4f46e5',
    },
    
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '500',
    }
});
