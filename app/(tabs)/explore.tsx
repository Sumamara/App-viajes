import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Download, Upload } from 'lucide-react-native';
import { useTravelStore } from '../../store/useTravelStore';

export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const router = useRouter();
  const pathname = usePathname();
  const { locations, columns, days, activeDayId, importData } = useTravelStore();

  const handleExport = () => {
    const data = { locations, columns, days, activeDayId };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `itinerario-viaje.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        importData(json);
      } catch (err) {
        alert('Error al cargar el archivo JSON. Asegúrate de que es un archivo válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <View style={styles.container}>
      {/* Shared header — same as Planificador */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Planificador de viajes</Text>
              {isDesktop && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>🌍 Diseña tu ruta ideal punto por punto</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <div style={{ display: 'flex', gap: isDesktop ? '10px' : '4px', alignItems: 'center' }}>
            <button
              onClick={handleExport}
              style={{
                display: 'flex', alignItems: 'center', gap: isDesktop ? '8px' : '4px', padding: isDesktop ? '8px 16px' : '8px 12px',
                borderRadius: '10px', cursor: 'pointer', border: '1px solid #e0e7ff',
                backgroundColor: '#ffffff', color: '#4f46e5', fontWeight: '700',
                fontSize: '13px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 3px rgba(79, 70, 229, 0.1)', fontFamily: 'Arial'
              }}
              title="Guardar Itinerario"
              onMouseEnter={(e: any) => {
                e.currentTarget.style.backgroundColor = '#4f46e5';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(79, 70, 229, 0.2)';
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#4f46e5';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(79, 70, 229, 0.1)';
              }}
            >
              <Download size={15} color="currentColor" />
              {isDesktop && "Guardar"}
            </button>

            <label
              style={{
                display: 'flex', alignItems: 'center', gap: isDesktop ? '8px' : '4px', padding: isDesktop ? '8px 16px' : '8px 12px',
                borderRadius: '10px', cursor: 'pointer', border: '1px solid #e0e7ff',
                backgroundColor: '#ffffff', color: '#4f46e5', fontWeight: '700',
                fontSize: '13px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontFamily: 'Arial'
              }}
              title="Cargar Itinerario"
              onMouseEnter={(e: any) => {
                e.currentTarget.style.backgroundColor = '#4f46e5';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(79, 70, 229, 0.2)';
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#4f46e5';
                e.currentTarget.style.borderColor = '#e0e7ff';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(79, 70, 229, 0.1)';
              }}
            >
              <Upload size={15} color="currentColor" />
              {isDesktop && "Cargar"}
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            </label>
          </div>
        </View>

        <View style={styles.headerNav}>
          {[{ label: 'Planificador', path: '/' }, { label: 'Explorar', path: '/explore' }].map(({ label, path }) => {
            const isActive = pathname === path || (path === '/explore' && pathname?.includes('explore'));
            return (
              <TouchableOpacity
                key={path}
                onPress={() => router.push(path as any)}
                style={[styles.navBtn, isActive && styles.navBtnActive]}
              >
                <Text style={[styles.navBtnText, isActive && styles.navBtnTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Page content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>🧭 Explorar</Text>
        <Text style={styles.pageSubtitle}>Próximamente: descubre destinos, rutas populares y más.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 1px 4px rgba(0,0,0,0.04)',
    elevation: 2, zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAccent: { width: 4, height: 28, borderRadius: 2, backgroundColor: '#6366f1' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  headerBadge: { backgroundColor: '#eef2ff', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: '#6366f1' },
  headerNav: { flexDirection: 'row', gap: 4, marginLeft: 8 },
  headerActions: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' },
  navBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  navBtnActive: { backgroundColor: '#eef2ff' },
  navBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  navBtnTextActive: { color: '#4f46e5' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  pageTitle: { fontSize: 32, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  pageSubtitle: { fontSize: 16, color: '#64748b', textAlign: 'center' },
});
