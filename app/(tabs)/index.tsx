import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
// @ts-ignore
import MapComponent from '../../components/Map';
// @ts-ignore
import { usePathname, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Download, Upload } from 'lucide-react-native';
import ItineraryTableComponent from '../../components/ItineraryTable';
import { useTravelStore } from '../../store/useTravelStore';

export default function HomeScreen() {
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

  const [mapVisible, setMapVisible] = useState(true);
  const [tableVisible, setTableVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <View style={styles.container}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Planificador</Text>
              {isDesktop && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>🌍 Diseña tu ruta ideal punto por punto</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {/* Nav links on the right */}
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
            const isActive = pathname === path || (path === '/' && (pathname === '/' || pathname === '/index'));
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

      <View style={[styles.body, isDesktop ? styles.row : styles.column]}>

        {/* MAP PANEL */}
        {mapVisible && (
          <View style={[
            styles.panel,
            isDesktop ? (tableVisible ? styles.panelMap : styles.panelFull) : (tableVisible ? { flex: 0.4 } : styles.panelFull)
          ]}>
            <MapComponent />
            {tableVisible && (
              <div
                onClick={() => setMapVisible(false)}
                style={{
                  position: 'absolute', 
                  top: 10, 
                  left: 8,
                  zIndex: 20,
                  height: 36, padding: '0 12px',
                  backgroundColor: 'white', borderRadius: 8,
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = '#eef2ff'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = 'white'; }}
              >
                {isDesktop ? <ChevronLeft size={16} color="#64748b" /> : <ChevronUp size={16} color="#64748b" />}
              </div>
            )}
          </View>
        )}

        {/* Restore strip for map */}
        {!mapVisible && (
          <div
            onClick={() => setMapVisible(true)}
            style={{
              width: isDesktop ? 20 : '100%', 
              height: isDesktop ? 'auto' : 32,
              marginBottom: isDesktop ? 0 : 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: isDesktop ? '0 10px 10px 0' : 8, 
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'background 0.2s',
            }}
            onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = '#eef2ff'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
          >
            {isDesktop ? <ChevronRight size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
          </div>
        )}

        {/* Gap between panels or vertical separator */}
        {mapVisible && tableVisible && (
          <View style={isDesktop ? { width: 20 } : { height: 16 }} />
        )}

        {/* TABLE PANEL */}
        {tableVisible && (
          <View style={[
            styles.panel,
            isDesktop ? (mapVisible ? styles.panelTable : styles.panelFull) : (mapVisible ? { flex: 0.6 } : styles.panelFull)
          ]}>
            <ItineraryTableComponent renderLeft={
              !isDesktop && mapVisible ? (
                <div
                  onClick={() => setTableVisible(false)}
                  style={{
                    height: 36, padding: '0 12px',
                    backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <ChevronDown size={16} color="#64748b" />
                </div>
              ) : undefined
            } />
            {isDesktop && mapVisible && (
              <div
                onClick={() => setTableVisible(false)}
                style={{
                  position: 'absolute', 
                  top: 10,
                  right: 20,
                  zIndex: 20,
                  height: 36, padding: '0 12px',
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = '#eef2ff'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = 'white'; }}
              >
                <ChevronRight size={16} color="#64748b" />
              </div>
            )}
          </View>
        )}

        {/* Restore strip for table */}
        {!tableVisible && (
          <div
            onClick={() => setTableVisible(true)}
            style={{
              width: isDesktop ? 20 : '100%', 
              height: isDesktop ? 'auto' : 32,
              marginTop: isDesktop ? 0 : 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: isDesktop ? '10px 0 0 10px' : 8, 
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'background 0.2s',
            }}
            onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = '#eef2ff'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
          >
            {isDesktop ? <ChevronLeft size={16} color="#64748b" /> : <ChevronUp size={16} color="#64748b" />}
          </div>
        )}

      </View>
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
  body: { flex: 1, padding: 16 },
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
  panel: { flex: 1, position: 'relative', overflow: 'visible' },
  panelMap: { flex: 0.35 },
  panelTable: { flex: 0.65 },
  panelFull: { flex: 1 },
});
