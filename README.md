# 🌍 Planificador de Viajes (Sumamara)

Una aplicación universal (Web & Móvil) diseñada para planificar itinerarios de viaje de forma visual, rápida y fluida. Desarrollada con **Expo**, **React Native** y optimizada para la Web con **AG-Grid** y **Google Maps**.

## 🚀 Características Principales

### 🗺️ Mapa Interactivo
- Ubicación de puntos de interés con clic derecho/pulsación larga.
- Dibujo automático de rutas entre destinos.
- Integración con la API de Google Maps para búsquedas y vista satelital.

### 📊 Tabla de Itinerario Dinámica
- Edición en tiempo real de actividades, horarios y costos.
- Columnas personalizables (añadir/eliminar/renombrar).
- Reordenamiento de actividades mediante arrastrar y soltar (drag & drop).
- Cálculo automático de totales (costos, distancias) en la parte inferior.

### 💾 Persistencia de Datos
- **Guardar JSON**: Exporta todo tu plan de viaje a un archivo local.
- **Cargar JSON**: Importa tus planes guardados para seguir editando en cualquier momento.

### 📱 Diseño Premium & Responsivo
- Interfaz totalmente adaptada a dispositivos móviles.
- Panel superior ("Header") compacto en móviles con iconos inteligentes.
- Ajustes de visibilidad de paneles (Map/Table) optimizados para pantallas pequeñas.
- Tipografía limpia basada en **Arial** para una lectura clara.

## 🛠️ Desarrollo Local

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar Variables de Entorno**:
   Crea un archivo `.env` o usa las variables en `app.json` para tu API Key de Google Maps.

3. **Iniciar en Web**:
   ```bash
   npm run web
   ```

4. **Iniciar en Expo Go (Móvil)**:
   ```bash
   npx expo start
   ```

## 🌐 Despliegue

La aplicación está lista para desplegarse en **GitHub Pages**:

```bash
npm run deploy
```

La URL del proyecto es: `https://Sumamara.github.io/App-viajes/`

## 📦 Tecnologías

- **Fronend**: Expo / React Native (Web & Mobile).
- **Tablas**: AG-Grid Community.
- **Mapas**: @vis.gl/react-google-maps.
- **Estructura**: Expo Router.
- **Estado**: Zustan (Store).

---
*Creado con ❤️ para viajeros que aman la organización.*
