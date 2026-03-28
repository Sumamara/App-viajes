import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

export type ColumnType = 'text' | 'date';

export interface DynamicColumn {
  id: string;
  title: string;
  type: ColumnType;
}

export interface Day {
  id: string;
  title: string;
}

export interface TravelLocation {
  id: string;
  dayId: string;
  coordinates: [number, number]; // [lat, lng]
  completed?: boolean;
  category?: 'principal' | 'opcional';
  [key: string]: any; // Keys correspond to DynamicColumn.id
}

export interface MapConfig {
  lineStyle: 'solid' | 'arrows' | 'none';
}

interface TravelState {
  locations: TravelLocation[];
  columns: DynamicColumn[];
  days: Day[];
  activeDayId: string;
  mapConfig: MapConfig;
  columnState: any[] | null;
  importTrigger: number;

  // Actions
  addLocation: (location: Partial<TravelLocation>) => void;
  updateLocation: (id: string, updates: Partial<TravelLocation>) => void;
  duplicateLocation: (id: string) => void;
  removeLocation: (id: string) => void;
  reorderLocations: (newLocations: TravelLocation[]) => void;
  toggleLocationCompleted: (id: string) => void;
  updateLocationCategory: (id: string, category: 'principal' | 'opcional') => void;

  addColumn: (title: string, type: ColumnType) => void;
  removeColumn: (id: string) => void;
  updateColumnType: (id: string, newType: ColumnType) => void;
  reorderColumns: (newColumns: DynamicColumn[]) => void;

  addDay: (title: string) => void;
  renameDay: (id: string, newTitle: string) => void;
  duplicateDay: (id: string) => void;
  removeDay: (id: string) => void;
  reorderDays: (newDays: Day[]) => void;
  setActiveDay: (id: string) => void;
  importData: (data: any) => void;
  updateColumnState: (state: any[]) => void;

  updateMapConfig: (config: Partial<MapConfig>) => void;
}

// Fixed IDs for initial columns so they align by default
const COL_IDS = {
  day: uuidv4(),
  title: uuidv4(),
  activity: uuidv4(),
  hours: uuidv4(),
  distance: uuidv4(),
  desc: uuidv4(),
  transport: uuidv4(),
  cost: uuidv4()
};

const initialColumns: DynamicColumn[] = [
  { id: COL_IDS.day, title: 'Día', type: 'date' },
  { id: COL_IDS.activity, title: 'Actividad', type: 'text' },
  { id: COL_IDS.title, title: 'Lugar', type: 'text' },
  { id: COL_IDS.hours, title: 'Hora', type: 'text' },
  { id: COL_IDS.distance, title: 'Distancia', type: 'text' },
  { id: COL_IDS.desc, title: 'Descripción', type: 'text' },
  { id: COL_IDS.transport, title: 'Transporte', type: 'text' },
  { id: COL_IDS.cost, title: 'Costo', type: 'text' },
];

const initialDays: Day[] = [
  { id: 'day-1', title: 'Día 1' }
];

const initialLocations: TravelLocation[] = [];

const initialMapConfig: MapConfig = {
  lineStyle: 'arrows'
};

// Haversine formula for distance
function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function applyDistances(locations: TravelLocation[], columns: DynamicColumn[]) {
  const distanceCol = columns.find(c => c.title === 'Distancia');
  const distanceColId = distanceCol ? distanceCol.id : COL_IDS.distance;

  const newLocations: TravelLocation[] = [];
  const prevByDay: Record<string, TravelLocation> = {};

  locations.forEach((loc) => {
    const prev = prevByDay[loc.dayId];
    if (!prev) {
      newLocations.push({ ...loc, [distanceColId]: '0 km' });
    } else {
      const dist = getDistanceFromLatLonInKm(
        prev.coordinates[0], prev.coordinates[1],
        loc.coordinates[0], loc.coordinates[1]
      );
      const distText = dist < 1 ? '< 1 km' : Math.round(dist) + ' km';
      newLocations.push({ ...loc, [distanceColId]: distText });
    }
    prevByDay[loc.dayId] = loc;
  });

  return newLocations;
}

const STORAGE_KEY = 'travel-itinerary-storage';

function loadFromStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return null;
}

function saveToStorage(state: Pick<TravelState, 'locations' | 'columns' | 'days' | 'activeDayId' | 'mapConfig'>) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        locations: state.locations,
        columns: state.columns,
        days: state.days,
        activeDayId: state.activeDayId,
        mapConfig: state.mapConfig,
      }));
    }
  } catch {}
}

const saved = loadFromStorage();
export const useTravelStore = create<TravelState>((set) => ({
  locations: saved?.locations ?? initialLocations,
  columns: saved?.columns ?? initialColumns,
  days: saved?.days ?? [{ id: '1', title: 'Día 1' }],
  activeDayId: saved?.activeDayId ?? '1',
  mapConfig: saved?.mapConfig ?? { lineStyle: 'solid' },
  columnState: saved?.columnState ?? null,
  importTrigger: saved?.importTrigger ?? 0,

      addLocation: (location) => set((state) => {
        const newLocs = [...state.locations, {
          id: uuidv4(),
          dayId: state.activeDayId,
          coordinates: [40.7306, -73.9352], // Default
          ...location
        }];
        return { locations: applyDistances(newLocs as TravelLocation[], state.columns) };
      }),

      updateLocation: (id, updates) => set((state) => {
        const newLocs = state.locations.map(loc =>
          loc.id === id ? { ...loc, ...updates } : loc
        );
        return { locations: applyDistances(newLocs, state.columns) };
      }),

      duplicateLocation: (id) => set((state) => {
        const index = state.locations.findIndex(l => l.id === id);
        if (index === -1) return state;
        const locToCopy = state.locations[index];
        const newLoc = { ...locToCopy, id: uuidv4() };
        const newLocs = [...state.locations];
        newLocs.splice(index + 1, 0, newLoc);
        return { locations: applyDistances(newLocs as TravelLocation[], state.columns) };
      }),

      removeLocation: (id) => set((state) => {
        const newLocs = state.locations.filter(loc => loc.id !== id);
        return { locations: applyDistances(newLocs, state.columns) };
      }),

      reorderLocations: (newActiveDayLocations) => set((state) => {
        const otherDays = state.locations.filter(loc => loc.dayId !== state.activeDayId);
        const combined = [...otherDays, ...newActiveDayLocations];
        return { locations: applyDistances(combined, state.columns) };
      }),
      
      toggleLocationCompleted: (id) => set((state) => ({
        locations: state.locations.map(loc => 
          loc.id === id ? { ...loc, completed: !loc.completed } : loc
        )
      })),

      updateLocationCategory: (id, category) => set((state) => ({
        locations: state.locations.map(loc => 
          loc.id === id ? { ...loc, category } : loc
        )
      })),

      addColumn: (title, type) => set((state) => ({
        columns: [...state.columns, { id: uuidv4(), title, type }]
      })),

      removeColumn: (id) => set((state) => {
        const newCols = state.columns.filter(col => col.id !== id);
        const newLocs = state.locations.map(loc => {
          const { [id]: _, ...rest } = loc; // Remove the prop
          return rest as TravelLocation;
        });
        return { columns: newCols, locations: newLocs };
      }),

      updateColumnType: (id, newType) => set((state) => ({
        columns: state.columns.map(col => col.id === id ? { ...col, type: newType } : col)
      })),

      reorderColumns: (newColumns) => set({ columns: newColumns }),

      addDay: (title) => set((state) => {
        const newDayId = uuidv4();
        return {
          days: [...state.days, { id: newDayId, title }],
          activeDayId: newDayId
        };
      }),

      renameDay: (id, newTitle) => set((state) => ({
        days: state.days.map(d => d.id === id ? { ...d, title: newTitle } : d)
      })),

      duplicateDay: (id) => set((state) => {
        const dayIndex = state.days.findIndex(d => d.id === id);
        if (dayIndex === -1) return state;
        const dayToCopy = state.days[dayIndex];

        const newDayId = uuidv4();
        const newDay = { id: newDayId, title: `${dayToCopy.title} (Copia)` };
        
        const locsToCopy = state.locations.filter(l => l.dayId === id);
        const duplicatedLocs = locsToCopy.map((loc) => ({
          ...loc,
          id: uuidv4(),
          dayId: newDayId
        }));
        
        const newDays = [...state.days];
        newDays.splice(dayIndex + 1, 0, newDay); // Insert right after original
        
        return {
          days: newDays,
          locations: applyDistances([...state.locations, ...duplicatedLocs], state.columns),
          activeDayId: newDayId
        };
      }),

      removeDay: (id) => set((state) => {
        if (state.days.length <= 1) return state; // Prevent deleting the last day
        const newDays = state.days.filter(d => d.id !== id);
        const newLocations = state.locations.filter(l => l.dayId !== id);
        const newActiveDayId = state.activeDayId === id ? newDays[0].id : state.activeDayId;
        return { days: newDays, locations: applyDistances(newLocations, state.columns), activeDayId: newActiveDayId };
      }),

      reorderDays: (newDays) => set({ days: newDays }),

      setActiveDay: (id: string) => set({ activeDayId: id }),

      importData: (data: any) => set((state) => ({
        locations: data.locations || state.locations,
        columns: data.columns || state.columns,
        days: data.days || state.days,
        activeDayId: data.activeDayId || (data.days && data.days.length > 0 ? data.days[0].id : state.activeDayId),
        mapConfig: data.mapConfig || state.mapConfig,
        columnState: data.columnState || state.columnState,
        importTrigger: state.importTrigger + 1,
      })),

      updateColumnState: (stateUpdate) => set({ columnState: stateUpdate }),

      updateMapConfig: (config) => set((state) => ({
        mapConfig: { ...state.mapConfig, ...config }
      }))
}));

// Subscribe to state changes and persist to localStorage
useTravelStore.subscribe((state) => saveToStorage(state));
