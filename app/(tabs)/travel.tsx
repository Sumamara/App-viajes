import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
// @ts-ignore
import MapComponent from '../../components/Map';
// @ts-ignore
import { usePathname, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Menu, Download, Upload, Link as ShareIcon } from 'lucide-react-native';
import ItineraryTableComponent from '../../components/ItineraryTable';
import { useTravelStore } from '../../store/useTravelStore';
import { savePlan, loadPlan, checkPlanExists } from '../../lib/planService';

export default function TravelScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const router = useRouter();
  const pathname = usePathname();
  const { locations, columns, days, activeDayId, importData } = useTravelStore();

  const [isSharing, setIsSharing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectName, setProjectName] = useState('mi-viaje');
  const [editingName, setEditingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const planId = projectName.toLowerCase().trim().replace(/\s+/g, '-');
      if (!planId) { alert('Por favor pon un nombre al proyecto primero.'); return; }
      const data = { locations, columns, days, activeDayId };
      const savedId = await savePlan(data, planId);
      const url = new URL(window.location.href);
      url.searchParams.delete('data');
      url.searchParams.set('plan', savedId);
      const shareUrl = url.toString();
      await navigator.clipboard.writeText(shareUrl);
      alert(`¡Enlace copiado! 🌍\n\n${shareUrl}`);
    } catch (err) {
      console.error('Error al compartir:', err);
      alert('Error al guardar el plan.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleNameSave = async (newName: string) => {
    setEditingName(false);
    const cleaned = newName.toLowerCase().trim().replace(/\s+/g, '-');
    if (!cleaned || cleaned === projectName) return;
    try {
      const exists = await checkPlanExists(cleaned);
      if (exists) {
        setNameError(`"${cleaned}" ya está en uso.`);
        setTimeout(() => setNameError(''), 3000);
        return;
      }
      setProjectName(cleaned);
      setNameError('');
    } catch {
      setProjectName(cleaned);
    }
  };

  const [mapVisible, setMapVisible] = useState(true);
  const [tableVisible, setTableVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => { 
    setMounted(true); 
    const params = new URLSearchParams(window.location.search);
    const planId = params.get('plan');
    if (planId) {
      setProjectName(planId);
    }
  }, []);

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
          <View style={styles.headerTitleRow}>
            {editingName ? (
              <input
                autoFocus
                defaultValue={projectName}
                onBlur={(e: any) => handleNameSave(e.target.value)}
                onKeyDown={(e: any) => { if (e.key === 'Enter') { e.target.blur(); } if (e.key === 'Escape') { setEditingName(false); } }}
                style={{
                  fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3,
                  border: 'none', borderBottom: '2px solid #4f46e5', outline: 'none',
                  background: 'transparent', fontFamily: 'Arial', width: '180px',
                  padding: '2px 4px'
                }}
              />
            ) : (
              <TouchableOpacity onPress={() => setEditingName(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.headerTitle}>{projectName}</Text>
                <Text style={{ fontSize: 13, color: '#94a3b8' }}>✏️</Text>
              </TouchableOpacity>
            )}
            {nameError ? (
              <Text style={{ fontSize: 11, color: '#ef4444', marginLeft: 8 }}>{nameError}</Text>
            ) : isDesktop && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>🗺️ Modo Viaje Activo - Siguiendo el Cronograma</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={handleShare}
              disabled={isSharing}
              style={{
                display: 'flex', alignItems: 'center', gap: isDesktop ? '8px' : '4px',
                padding: isDesktop ? '8px 16px' : '8px 12px',
                borderRadius: '10px', cursor: 'pointer', border: '1px solid #e0e7ff',
                backgroundColor: '#ffffff', color: '#4f46e5', fontWeight: '700',
                fontSize: '13px', transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(79,70,229,0.1)', fontFamily: 'Arial'
              }}
            >
              <ShareIcon size={15} color="currentColor" />
              {isDesktop && (isSharing ? 'Guardando...' : 'Compartir')}
            </button>

            <View style={styles.headerNav}>
              {[
                { label: 'Planificador', path: '/' },
                { label: 'Viajando', path: '/travel' },
                { label: 'Explorar', path: '/explore' }
              ].map(({ label, path }) => {
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
          </div>
        </View>
      </View>

      <View style={[styles.body, isDesktop ? styles.row : styles.column]}>
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
                  position: 'absolute', top: 12, left: 12, zIndex: 20,
                  height: 32, width: 32,
                  backgroundColor: 'white', borderRadius: 8, border: '1px solid #e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                }}
              >
                {isDesktop ? <ChevronLeft size={16} color="#64748b" /> : <ChevronUp size={16} color="#64748b" />}
              </div>
            )}
          </View>
        )}

        {!mapVisible && (
          <div
            onClick={() => setMapVisible(true)}
            style={{
              width: isDesktop ? 24 : '100%', height: isDesktop ? 'auto' : 32,
              marginBottom: isDesktop ? 0 : 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: isDesktop ? '0 10px 10px 0' : 8, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'background 0.2s',
            }}
          >
            {isDesktop ? <ChevronRight size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
          </div>
        )}

        {mapVisible && tableVisible && (
          <View style={isDesktop ? { width: 12 } : { height: 12 }} />
        )}

        {tableVisible && (
          <View style={[
            styles.panel,
            isDesktop ? (mapVisible ? styles.panelTable : styles.panelFull) : (mapVisible ? { flex: 0.6 } : styles.panelFull)
          ]}>
            <ItineraryTableComponent mode="travel" renderLeft={
              !isDesktop && mapVisible ? (
                <div
                  onClick={() => setTableVisible(false)}
                  style={{
                    height: 32, padding: '0 12px',
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
                  position: 'absolute', top: 12, right: 12, zIndex: 20,
                  height: 32, width: 32,
                  backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                }}
              >
                <ChevronRight size={16} color="#64748b" />
              </div>
            )}
          </View>
        )}

        {!tableVisible && (
          <div
            onClick={() => setTableVisible(true)}
            style={{
              width: isDesktop ? 20 : '100%', height: isDesktop ? 'auto' : 32,
              marginTop: isDesktop ? 0 : 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: isDesktop ? '10px 0 0 10px' : 8, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'background 0.2s',
            }}
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
  headerBadge: { backgroundColor: '#f0fdf4', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: '#10b981' },
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
