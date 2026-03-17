import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTravelStore } from '../store/useTravelStore';

const ItineraryTableNative = ({ renderLeft }: { renderLeft?: React.ReactNode }) => {
    const locations = useTravelStore((state) => state.locations);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Itinerary Table Native</Text>
            <Text style={styles.subtext}>Interactive Drag & Drop Table is optimized for Web.</Text>
            <Text style={styles.count}>{locations.length} items</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        margin: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: { boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }
        }),
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    subtext: {
        color: '#6b7280',
        marginTop: 8,
    },
    count: {
        marginTop: 16,
        color: '#3b82f6',
        fontWeight: '600',
    }
});

export default ItineraryTableNative;
