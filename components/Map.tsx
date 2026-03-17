import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTravelStore } from '../store/useTravelStore';

const MapNative = () => {
    const locations = useTravelStore((state) => state.locations);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Map is rendering natively.</Text>
            <Text style={styles.subtext}>
                (Native Mapbox / react-native-maps integration mapped later. Web is priority.)
            </Text>
            <Text style={styles.count}>{locations.length} Locations</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 400,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        borderWidth: 1,
        margin: 16,
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        elevation: 5,
    },
    text: {
        color: '#1f2937',
        fontSize: 18,
        fontWeight: '600',
    },
    subtext: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    count: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3b82f6',
    }
});

export default MapNative;
