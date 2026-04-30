// mapa-quejas.js - Versión con actualización automática

const MapaQuejasView = {
    map: null,
    markers: [],
    allGeocercas: null,
    currentGeocercaLayer: null,
    
    render() {
        return `
            <div style="height: 70vh; position: relative; background: #f1f5f9; border-radius: 12px; overflow: hidden; margin-top: 16px;">
                <!-- Controles del mapa -->
                <div style="position: absolute; top: 10px; right: 10px; z-index: 10; display: flex; gap: 8px;">
                    <button onclick="MapaQuejasView.centrarMapa()" 
                            style="background: white; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        📍 Centrar mapa
                    </button>
                    <button onclick="MapaQuejasView.actualizarMapa()" 
                            style="background: white; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        🔄 Actualizar
                    </button>
                </div>
                
                <!-- Leyenda -->
                <div style="position: absolute; bottom: 20px; left: 10px; z-index: 10; background: white; padding: 8px 12px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-size: 11px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-block; width: 12px; height: 12px; background: #0867ec; border-radius: 50%;"></span>
                        <span>Ubicación de quejas</span>
                    </div>
                </div>
                
                <!-- Contenedor del mapa -->
                <div id="mapa-quejas" style="width: 100%; height: 100%;"></div>
                
                <!-- Estadísticas -->
                <div style="position: absolute; top: 10px; left: 10px; z-index: 10; background: white; padding: 8px 16px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <span id="mapaStats" style="font-size: 12px; font-weight: bold;">Cargando...</span>
                </div>
            </div>
        `;
    },
    
    // Inicializar mapa
    async initMapa() {
        console.log('Inicializando mapa...');
        const mapElement = document.getElementById('mapa-quejas');
        if (!mapElement) {
            console.error('No se encontró el elemento mapa-quejas');
            return;
        }
        
        // Limpiar mapa anterior
        mapElement.innerHTML = '';
        
        // Verificar que Leaflet está cargado
        if (typeof L === 'undefined') {
            console.error('Leaflet no está cargado');
            alert('Error: Leaflet no está cargado. Verifica la conexión a internet.');
            return;
        }
        
        // Inicializar mapa con Leaflet
        this.map = L.map('mapa-quejas').setView([20.588793, -100.389889], 8);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Evento para limpiar la geocerca cuando se cierra la ventana de información
        this.map.on('popupclose', () => {
            if (this.currentGeocercaLayer) {
                this.map.removeLayer(this.currentGeocercaLayer);
                this.currentGeocercaLayer = null;
            }
        });
        
        // Cargar geocercas de fondo para cálculos matemáticos
        this.cargarGeocercasSilencioso();
        
        // Cargar supervisiones
        await this.cargarSupervisiones();
    },
    
    // Carga las geocercas en segundo plano para no alentar el mapa
    async cargarGeocercasSilencioso() {
        try {
            const client = StorageService.init();
            if (!client) return;
            const { data } = await client.rpc('obtener_geocercas_geojson');
            let parsed = data;
            
            // Parseo defensivo por si Supabase lo devuelve como texto
            if (typeof parsed === 'string') {
                try { parsed = JSON.parse(parsed); } catch(e) {}
            }
            if (Array.isArray(parsed) && parsed.length > 0) parsed = parsed[0];
            if (parsed && parsed.obtener_geocercas_geojson) parsed = parsed.obtener_geocercas_geojson;
            if (parsed && typeof parsed.features === 'string') {
                try { parsed.features = JSON.parse(parsed.features); } catch(e) {}
            }
            
            this.allGeocercas = parsed?.features || [];
        } catch (e) {
            console.warn("Geocercas de fondo no disponibles:", e);
        }
    },
    
    // Cargar supervisiones y crear marcadores
    async cargarSupervisiones() {
        // Limpiar marcadores anteriores
        if (this.markers.length > 0) {
            this.markers.forEach(marker => this.map.removeLayer(marker));
            this.markers = [];
        }
        
        // Cargar supervisiones desde Supabase
        const supervisiones = await StorageService.loadSupervisiones();
        console.log('Supervisiones cargadas:', supervisiones.length);
        
        // 🛡️ Integración de Filtros Inteligentes del Panel Principal
        let filteredSupervisiones = supervisiones.filter(sup => {
            // 2. Filtro de Fechas
            let itemYear, itemMonth, itemDay;
            if (sup.timestamp) {
                const fecha = new Date(sup.timestamp);
                itemYear = fecha.getFullYear(); itemMonth = fecha.getMonth() + 1; itemDay = fecha.getDate();
            } else if (typeof sup.fecha === 'string') {
                if (sup.fecha.includes('/')) {
                    const [dia, mes, año] = sup.fecha.split('/').map(Number);
                    itemYear = año; itemMonth = mes; itemDay = dia;
                } else if (sup.fecha.includes('-')) {
                    const [año, mes, dia] = sup.fecha.split('-').map(Number);
                    itemYear = año; itemMonth = mes; itemDay = dia;
                }
            }
            
            if (App.appState.filterMonth) {
                const [year, month] = App.appState.filterMonth.split('-').map(Number);
                if (itemYear !== year || itemMonth !== month) return false;
            }
            if (App.appState.filterDate) {
                const [year, month, day] = App.appState.filterDate.split('-').map(Number);
                if (itemYear !== year || itemMonth !== month || itemDay !== day) return false;
            }
            
            // 3. Filtro de Búsqueda
            if (App.appState.filterSearch) {
                const s = App.appState.filterSearch.toLowerCase();
                return (sup.nombreSupervisor?.toLowerCase().includes(s) || sup.nombreCliente?.toLowerCase().includes(s) || sup.motivoQueja?.toLowerCase().includes(s) || sup.ubicacion?.toLowerCase().includes(s));
            }

            // 4. Filtro de Tarjetas Estadísticas (Con Evidencia / Sin Evidencia)
            if (App.appState.filterStatus && App.appState.filterStatus !== 'all') {
                const conEvidencia = (sup.evidenciasFotos && sup.evidenciasFotos.length > 0) || sup.evidenciaFoto;
                return App.appState.filterStatus === 'approved' ? conEvidencia : !conEvidencia;
            }
            
            return true;
        });

        let conCoordenadas = 0;
        
        // Crear marcadores para cada supervisión con coordenadas
        filteredSupervisiones.forEach(sup => {
            if (sup.coordenadas && sup.coordenadas.lat && sup.coordenadas.lng) {
                conCoordenadas++;
                
                const isTest = AdminController.isTestRecord(sup);
                let marker;

                if (isTest) {
                    const testIcon = L.divIcon({
                        className: 'custom-test-icon',
                        html: "<div style='background-color:#a855f7; width:30px; height:30px; border-radius:50%; border:2px solid white; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.4); font-size:16px;'>🧪</div>",
                        iconSize: [30, 30],
                        iconAnchor: [15, 15],
                        popupAnchor: [0, -15]
                    });
                    marker = L.marker([sup.coordenadas.lat, sup.coordenadas.lng], { icon: testIcon }).addTo(this.map);
                } else {
                    marker = L.marker([sup.coordenadas.lat, sup.coordenadas.lng]).addTo(this.map);
                }
                
                // Crear popup con información completa
                marker.bindPopup(this.crearPopupContent(sup));
                
                // Al dar clic, buscar en qué geocerca está y dibujarla
                marker.on('click', () => {
                    this.mostrarGeocerca(sup.coordenadas.lat, sup.coordenadas.lng);
                });
                
                this.markers.push(marker);
            }
        });
        
        // Actualizar estadísticas
        const statsElement = document.getElementById('mapaStats');
        if (statsElement) {
            statsElement.innerHTML = `📍 ${conCoordenadas} ubicaciones encontradas`;
        }
        
        // Si hay coordenadas, centrar el mapa
        if (this.markers.length > 0) {
            const group = L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    },
    
    // Crear contenido del popup
    crearPopupContent(sup) {
        const isTest = AdminController.isTestRecord(sup);
        let fotoHtml = '';
        if (sup.evidenciasFotos && sup.evidenciasFotos.length > 0) {
            fotoHtml = `<img src="${sup.evidenciasFotos[0].data}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 6px; margin-bottom: 10px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">`;
        } else if (sup.evidenciaFoto) {
            fotoHtml = `<img src="${sup.evidenciaFoto}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 6px; margin-bottom: 10px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">`;
        }

        return `
            <div style="min-width: 250px; max-width: 300px; ${isTest ? 'background-color: #faf5ff; padding: 10px; border: 2px solid #d8b4fe; border-radius: 8px;' : ''}">
                ${isTest ? `
                <div style="background:#a855f7; color:white; text-align:center; font-size:12px; font-weight:bold; padding:6px; border-radius:4px; margin-bottom:10px;">
                    🧪 REGISTRO DE PRUEBA
                </div>` : ''}
                <h4 style="margin: 0 0 8px 0; color: ${isTest ? '#9333ea' : '#0867ec'}; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">
                    👨‍🔧 ${sup.nombreSupervisor || 'Sin supervisor'}
                </h4>
                
                ${fotoHtml}
                
                <div style="font-size: 12px;">
                    <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${sup.fecha || ''} ${sup.hora || ''}</p>
                    <p style="margin: 5px 0;"><strong>🆔 Pedido:</strong> ${sup.numeroPedido || 'N/A'}</p>
                    <p style="margin: 5px 0;"><strong>👤 Cliente:</strong> ${sup.nombreCliente || ''}</p>
                    <p style="margin: 5px 0;"><strong>📞 Teléfono:</strong> ${sup.telefonoCliente || ''}</p>
                    
                    <div style="margin: 8px 0; padding: 5px; background: #fef3c7; border-radius: 4px;">
                        <strong>📍 Motivo:</strong> ${sup.motivoQueja || 'No especificado'}
                    </div>
                    
                    <div style="margin: 8px 0; padding: 5px; background: #dcfce7; border-radius: 4px;">
                        <strong>✅ Solución:</strong> ${sup.solucion || 'No especificada'}
                    </div>
                    
                    ${sup.ubicacion ? `
                        <p style="margin: 5px 0;"><strong>📍 Dirección:</strong> ${sup.ubicacion}</p>
                    ` : ''}
                    
                    ${sup.enlaceMaps ? `
                        <div style="margin-top: 8px; text-align: center;">
                            <a href="${sup.enlaceMaps}" target="_blank" style="color: #0867ec; text-decoration: none; font-size: 11px;">
                                🗺️ Ver en Google Maps
                            </a>
                        </div>
                    ` : ''}
                    
                    <button onclick="AdminController.viewSupervision('${sup.id}')" 
                            style="width: 100%; background: #0867ec; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 15px; font-size: 12px; box-shadow: 0 2px 4px rgba(8, 103, 236, 0.3); transition: all 0.2s;">
                        📄 Ver reporte completo
                    </button>
                </div>
            </div>
        `;
    },
    
    // Centrar mapa en todos los marcadores
    centrarMapa() {
        if (this.markers.length > 0) {
            const group = L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    },
    
    // Algoritmo para encontrar y dibujar la geocerca exacta
    mostrarGeocerca(lat, lng) {
        if (this.currentGeocercaLayer) {
            this.map.removeLayer(this.currentGeocercaLayer);
            this.currentGeocercaLayer = null;
        }
        if (!this.allGeocercas || this.allGeocercas.length === 0) return;
        
        const pt = [lng, lat]; // GeoJSON usa [Longitud, Latitud]
        let foundFeature = null;
        
        for (let feature of this.allGeocercas) {
            let geom = feature.geometry;
            if (!geom) continue;
            if (typeof geom === 'string') {
                try { geom = JSON.parse(geom); } catch(e) { continue; }
            }
            
            if (geom.type === 'Polygon') {
                if (this.isPointInPolygon(pt, geom.coordinates[0])) { foundFeature = feature; break; }
            } else if (geom.type === 'MultiPolygon') {
                for (let poly of geom.coordinates) {
                    if (this.isPointInPolygon(pt, poly[0])) { foundFeature = feature; break; }
                }
                if (foundFeature) break;
            }
        }
        
        if (foundFeature) {
            this.currentGeocercaLayer = L.geoJSON(foundFeature, {
                style: { color: '#ef4444', weight: 3, opacity: 0.8, fillColor: '#ef4444', fillOpacity: 0.15 }
            }).bindTooltip(`<b>${foundFeature.properties?.name || 'Ruta'}</b><br>Supervisor: ${foundFeature.properties?.SUPERVISOR || 'N/A'}`, { sticky: true }).addTo(this.map);
        }
    },
    
    // Ray-casting algorithm: Verifica matemáticamente si una coordenada está dentro de un polígono
    isPointInPolygon(point, vs) {
        let x = point[0], y = point[1];
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            let xi = vs[i][0], yi = vs[i][1];
            let xj = vs[j][0], yj = vs[j][1];
            let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    },

    // Actualizar mapa (recargar supervisiones)
    async actualizarMapa() {
        await this.cargarSupervisiones();
    }
};

// Escuchar cambios en localStorage (para actualizar cuando se agregue una nueva supervisión)
window.addEventListener('storage', (e) => {
    if (e.key === 'supervisiones' && App.appState.activeTab === 'mapas') {
        console.log('Nueva supervisión detectada, actualizando mapa...');
        MapaQuejasView.actualizarMapa();
    }
});

// Exportar vista
if (typeof window !== 'undefined') {
    window.MapaQuejasView = MapaQuejasView;
}