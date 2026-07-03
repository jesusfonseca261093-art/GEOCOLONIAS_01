// admin-controller.js - Controlador para el panel de administración

const AdminController = {
    chartInstance: null,
    SECRET_CLEAN_CODE: "Nieto2025",

    // Constantes para estandarizar tipos de visita
    TIPO_SUPERVISION_DOMICILIO: 'Supervisión en Domicilio',
    TIPO_SUPERVISION_RUTA: 'Supervisión en Ruta',
    TIPO_ATENCION_QUEJA: 'Atención a Queja',

    // Identificar si es un registro de prueba (para no contarlo ni exportarlo)
    isTestRecord(item) {
        if (!item) return false;
        const op = String(item.operador || '').toLowerCase();
        const sup = String(item.nombreSupervisor || '').toLowerCase();
        const cli = String(item.nombreCliente || '').toLowerCase();
        const uni = String(item.unidad || item.ecoUnidad || '').toLowerCase();
        return op.includes('prueba') || sup.includes('prueba') || cli.includes('prueba') || uni.includes('prueba');
    },

    // Helper para escapar strings para ser usados en atributos onclick
    escapeForJs(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '&quot;')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    },

    getItemDateParts(item) {
        let itemYear, itemMonth, itemDay;

        if (item?.timestamp) {
            const fecha = new Date(item.timestamp);
            itemYear = fecha.getFullYear();
            itemMonth = fecha.getMonth() + 1;
            itemDay = fecha.getDate();
        } else if (typeof item?.fecha === 'string') {
            if (item.fecha.includes('/')) {
                const [dia, mes, anio] = item.fecha.split('/').map(Number);
                itemYear = anio;
                itemMonth = mes;
                itemDay = dia;
            } else if (item.fecha.includes('-')) {
                const [anio, mes, dia] = item.fecha.split('-').map(Number);
                itemYear = anio;
                itemMonth = mes;
                itemDay = dia;
            }
        }

        return { itemYear, itemMonth, itemDay };
    },

    matchesDateFilters(item, monthFilter, dateFilter) {
        if (!monthFilter && !dateFilter) return true;

        const { itemYear, itemMonth, itemDay } = this.getItemDateParts(item);

        if (monthFilter) {
            if (!itemYear || !itemMonth) return false;
            const [year, month] = monthFilter.split('-').map(Number);
            if (itemYear !== year || itemMonth !== month) return false;
        }

        if (dateFilter) {
            if (!itemYear || !itemMonth || !itemDay) return false;
            const [year, month, day] = dateFilter.split('-').map(Number);
            if (itemYear !== year || itemMonth !== month || itemDay !== day) return false;
        }

        return true;
    },

    formatTipoVisita(tipoVisita = '') {
        return tipoVisita === 'Supervisión de Ruta' ? 'Supervisión en Domicilio' : (tipoVisita || 'Atención a Queja');
    },

    isSupervisionRuta(tipoVisita = '') {
        return tipoVisita === this.TIPO_SUPERVISION_RUTA;
    },

    isSupervisionDomicilio(tipoVisita = '') {
        return this.formatTipoVisita(tipoVisita) === this.TIPO_SUPERVISION_DOMICILIO;
    },

    getRevisionOperadorFields() {
        return [
            'revisionEquipoSeguridad',
            'revisionPresentacionIdentificacion',
            'revisionUnidadCondiciones',
            'revisionDocumentacionServicio',
            'revisionManejoSeguro',
            'revisionCajaSeguridad'
        ];
    },

    getRevisionOperadorSummary(item) {
        const valores = this.getRevisionOperadorFields().map(field => item?.[field]).filter(Boolean);
        if (!valores.length) return '';
        const cumplidos = valores.filter(value => value === 'Sí').length;
        return `${cumplidos}/${valores.length} puntos cumplidos`;
    },

    // Cambiar pestaña
    switchTab(tab) {
        App.appState.activeTab = tab;
        App.appState.filterStatus = 'all'; // Limpiar el filtro de tarjetas al cambiar de pestaña
        if (tab !== 'supervisiones') App.appState.selectedSupervisionIds = [];
        this.updateTabStyles(tab);
        if (tab === 'mapas') {
            const c = document.getElementById('reportsList');
            if (c) { c.innerHTML = MapaQuejasView.render(); setTimeout(() => MapaQuejasView.initMapa?.(), 200); }
        } else this.loadReportsIntoPanel();
    },

    // Filtros
    updateFilterDate(date) { 
        App.appState.filterDate = date; 
        if (date) {
            App.appState.filterMonth = '';
            const monthInput = document.getElementById('filterMonth');
            if (monthInput) monthInput.value = '';
        }
        if (App.appState.activeTab !== 'mapas') this.loadReportsIntoPanel(); 
    },
    
    updateFilterMonth(m) { 
        App.appState.filterMonth = m; 
        if (m) {
            App.appState.filterDate = '';
            const dateInput = document.getElementById('filterDate');
            if (dateInput) dateInput.value = '';
        }
        if (App.appState.activeTab !== 'mapas') this.loadReportsIntoPanel(); 
    },
    
    updateFilterSearch(s) { 
        App.appState.filterSearch = s; 
        if (App.appState.activeTab !== 'mapas') this.loadReportsIntoPanel(); 
    },
    
    updateFilterTipoRuta(tipo) {
        App.appState.filterTipoRuta = tipo;
        App.render(); // Re-renderiza para actualizar tanto los estilos del botón activo como los datos
    },
    
    updateFilterStatus(status) {
        App.appState.filterStatus = status;
        App.render(); // Re-renderiza para actualizar el color de las tarjetas y filtrar la lista
    },
    
    applyQuickFilter(period, status) {
        const hoy = new Date();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        const anio = hoy.getFullYear();

        if (period === 'month') {
            App.appState.filterMonth = `${anio}-${mes}`;
            App.appState.filterDate = '';
        } else if (period === 'today') {
            App.appState.filterDate = `${anio}-${mes}-${dia}`;
            App.appState.filterMonth = '';
        }
        
        App.appState.filterStatus = status;
        App.render(); 
    },

    resetFilters() {
        App.appState.filterMonth = '';
        App.appState.filterDate = '';
        App.appState.filterSearch = '';
        App.appState.filterStatus = 'all';
        App.appState.filterTipoRuta = 'Todos';
        App.appState.selectedSupervisionIds = [];
        App.render();
    },

    getSelectedSupervisionIds() {
        if (!Array.isArray(App.appState.selectedSupervisionIds)) {
            App.appState.selectedSupervisionIds = [];
        }
        return App.appState.selectedSupervisionIds.map(String);
    },

    pruneSelectedSupervisions(visibleItems) {
        const visibleIds = new Set((visibleItems || []).map(item => String(item.id || '')).filter(Boolean));
        App.appState.selectedSupervisionIds = this.getSelectedSupervisionIds().filter(id => visibleIds.has(id));
    },

    updateSupervisionSelection(id, checked) {
        if (!id) return;
        const selected = new Set(this.getSelectedSupervisionIds());
        const normalizedId = String(id);

        if (checked) selected.add(normalizedId);
        else selected.delete(normalizedId);

        App.appState.selectedSupervisionIds = Array.from(selected);
        this.updateSelectedSupervisionCounter();
    },

    selectVisibleSupervisions() {
        const boxes = Array.from(document.querySelectorAll('.supervision-select-checkbox'));
        App.appState.selectedSupervisionIds = boxes
            .map(box => String(box.dataset.supervisionId || ''))
            .filter(Boolean);
        this.updateSelectedSupervisionCounter();
    },

    clearSelectedSupervisions() {
        App.appState.selectedSupervisionIds = [];
        this.updateSelectedSupervisionCounter();
    },

    updateSelectedSupervisionCounter() {
        const selected = new Set(this.getSelectedSupervisionIds());
        const boxes = Array.from(document.querySelectorAll('.supervision-select-checkbox'));
        let visibleSelected = 0;

        boxes.forEach(box => {
            const isSelected = selected.has(String(box.dataset.supervisionId || ''));
            box.checked = isSelected;
            if (isSelected) visibleSelected++;

            const card = box.closest('.report-card');
            if (card) {
                card.style.boxShadow = isSelected ? '0 0 0 2px rgba(8, 103, 236, 0.28)' : '';
            }
        });

        const counter = document.getElementById('supervisionSelectionCounter');
        if (counter) counter.textContent = `${visibleSelected} de ${boxes.length} seleccionadas`;

        const hint = document.getElementById('supervisionSelectionHint');
        if (hint) {
            hint.textContent = visibleSelected > 0
                ? 'Se exportaran solo las supervisiones seleccionadas.'
                : 'Sin seleccion: se exportan todas las supervisiones filtradas.';
        }
    },

    applyTallerQuickFilter(period, status) {
        const hoy = new Date();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        const anio = hoy.getFullYear();

        if (period === 'month') {
            App.appState.filterTallerMonth = `${anio}-${mes}`;
            App.appState.filterTallerDate = '';
        } else if (period === 'today') {
            App.appState.filterTallerDate = `${anio}-${mes}-${dia}`;
            App.appState.filterTallerMonth = '';
        }
        
        App.appState.filterTallerStatus = status;
        App.render(); 
    },

    resetTallerFilters() {
        App.appState.filterSearch = '';
        App.appState.filterTallerStatus = 'all';
        App.appState.filterTallerMonth = '';
        App.appState.filterTallerDate = '';
        App.render();
    },

    applyTallerStatusFilter(status) {
        App.appState.filterTallerStatus = status;
        App.render();
    },

    updateTallerFilter(s) { 
        App.appState.filterSearch = s; 
        this.loadTallerPanel(); 
    },

    // Estilos de pestañas
    updateTabStyles(active) {
        ['tabChecklistsBtn','tabOrdenesBtn','tabSupervisionesBtn','tabMapasBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) { 
                btn.style.background = '#f8fafc'; 
                btn.style.color = '#475569'; 
            }
        });
        const activeBtn = document.getElementById(
            active === 'checklists' ? 'tabChecklistsBtn' :
            active === 'ordenes' ? 'tabOrdenesBtn' :
            active === 'supervisiones' ? 'tabSupervisionesBtn' : 'tabMapasBtn'
        );
        if (activeBtn) {
            activeBtn.style.background = active === 'mapas' ? '#10b981' : active === 'ordenes' ? '#f59e0b' : active === 'supervisiones' ? '#0867ec' : '#1e40af';
            activeBtn.style.color = 'white';
        }
    },

    // ✅ Cargar panel supervisor - CORREGIDO FILTRO DE FECHA
    async loadReportsIntoPanel() {
        const c = document.getElementById('reportsList');
        const t = document.getElementById('totalReports');
        const ct = document.getElementById('chartTitle');

        if (ct) {
            switch(App.appState.activeTab) {
                case 'checklists': ct.textContent = '📊 Estado de Inspecciones'; break;
                case 'ordenes': ct.textContent = '📊 Estado de Órdenes'; break;
                case 'supervisiones': ct.textContent = '📊 Supervisiones en Campo'; break;
                case 'danos-terceros': ct.textContent = '📊 Resumen de Daños a Terceros'; break;
                case 'golpe-unidades': ct.textContent = '📊 Resumen de Golpes a Unidades'; break;
                default: ct.textContent = '📊 Resumen';
            }
        }
        
        if (c) c.innerHTML = '<div class="spinner" style="margin:40px auto"></div><p style="text-align:center">Cargando...</p>';
        
        try {
            let items;
            const activeTab = App.appState.activeTab;

            switch (activeTab) {
                case 'checklists':
                    items = await StorageService.loadReports(); break;
                case 'ordenes':
                    items = await StorageService.loadOrdenes(); break;
                case 'danos-terceros':
                    items = await StorageService.loadDanosTerceros(); break;
                case 'golpe-unidades':
                    items = await StorageService.loadGolpesUnidades(); break;
                case 'supervisiones':
                default:
                    items = await StorageService.loadSupervisiones(); break;
            }
                        
            // ---- NUEVA LÓGICA: CÁLCULO ESTÁTICO DE MES Y HOY ----
            const hoy = new Date();
            const mesActual = hoy.getMonth() + 1;
            const anioActual = hoy.getFullYear();
            const diaActual = hoy.getDate();
            
            let itemsMes = [];
            let itemsHoy = [];
            
            // Recorrer todos los elementos puros de la base de datos para dividirlos por fecha
            items.forEach(i => {
                if (this.isTestRecord(i)) return;

                const { itemYear, itemMonth, itemDay } = this.getItemDateParts(i);
                if (itemYear === anioActual && itemMonth === mesActual) {
                    itemsMes.push(i);
                    if (itemDay === diaActual) itemsHoy.push(i);
                }
            });
            
            // Inyectar resultados en la vista
            const smTotal = document.getElementById('statMonthTotal'); const smApp = document.getElementById('statMonthApp'); const smRej = document.getElementById('statMonthRej');
            const lmApp = document.getElementById('lblMonthApp'); const lmRej = document.getElementById('lblMonthRej');
            const stTotal = document.getElementById('statTodayTotal'); const stApp = document.getElementById('statTodayApp'); const stRej = document.getElementById('statTodayRej');
            const ltApp = document.getElementById('lblTodayApp'); const ltRej = document.getElementById('lblTodayRej');

            if (smTotal && stTotal) {
                smTotal.textContent = itemsMes.length;
                stTotal.textContent = itemsHoy.length;
                
                if (App.appState.activeTab === 'checklists') {
                    if(lmApp) { lmApp.textContent = 'Aprobados'; lmRej.textContent = 'Fallas'; }
                    if(ltApp) { ltApp.textContent = 'Aprobados'; ltRej.textContent = 'Fallas'; }
                    if(smApp) smApp.textContent = itemsMes.filter(r => !Object.values(r.evaluaciones || {}).includes('rechazado')).length;
                    if(smRej) smRej.textContent = itemsMes.filter(r => Object.values(r.evaluaciones || {}).includes('rechazado')).length;
                    if(stApp) stApp.textContent = itemsHoy.filter(r => !Object.values(r.evaluaciones || {}).includes('rechazado')).length;
                    if(stRej) stRej.textContent = itemsHoy.filter(r => Object.values(r.evaluaciones || {}).includes('rechazado')).length;
                } else if (App.appState.activeTab === 'ordenes') {
                    if(lmApp) { lmApp.textContent = 'Completadas'; lmRej.textContent = 'Proceso'; }
                    if(ltApp) { ltApp.textContent = 'Completadas'; ltRej.textContent = 'Proceso'; }
                    if(smApp) smApp.textContent = itemsMes.filter(o => o.estado === 'completado' || o.estado === 'terminado').length;
                    if(smRej) smRej.textContent = itemsMes.filter(o => o.estado === 'pendiente' || o.estado === 'en_proceso').length;
                    if(stApp) stApp.textContent = itemsHoy.filter(o => o.estado === 'completado' || o.estado === 'terminado').length;
                    if(stRej) stRej.textContent = itemsHoy.filter(o => o.estado === 'pendiente' || o.estado === 'en_proceso').length;
                } else { // Supervisiones, Daños, Golpes
                    if(lmApp) { lmApp.textContent = 'Con Evidencia'; lmRej.textContent = 'Sin Evidencia'; }
                    if(ltApp) { ltApp.textContent = 'Con Evidencia'; ltRej.textContent = 'Sin Evidencia'; }
                    if(smApp) smApp.textContent = itemsMes.filter(i => (i.evidenciasFotos && i.evidenciasFotos.length > 0) || i.evidenciaFoto || (i.fotos && i.fotos.length > 0)).length;
                    if(smRej) smRej.textContent = itemsMes.filter(i => !((i.evidenciasFotos && i.evidenciasFotos.length > 0) || i.evidenciaFoto || (i.fotos && i.fotos.length > 0))).length;
                    if(stApp) stApp.textContent = itemsHoy.filter(i => (i.evidenciasFotos && i.evidenciasFotos.length > 0) || i.evidenciaFoto || (i.fotos && i.fotos.length > 0)).length;
                    if(stRej) stRej.textContent = itemsHoy.filter(i => !((i.evidenciasFotos && i.evidenciasFotos.length > 0) || i.evidenciaFoto || (i.fotos && i.fotos.length > 0))).length;
                }
            }
            // ---- FIN NUEVA LÓGICA ----
            
            let filtered = items.filter(i => {
                // Reutilizar la lógica de filtrado de fecha
                return this.matchesDateFilters(i, App.appState.filterMonth, App.appState.filterDate);
            }).filter(i => {
                // Filtro de búsqueda por texto (sin cambios)
                if (!App.appState.filterSearch) return true;
                const s = App.appState.filterSearch.toLowerCase();
                if (App.appState.activeTab === 'supervisiones') {
                    return (i.nombreSupervisor?.toLowerCase().includes(s) || 
                            this.formatTipoVisita(i.tipoVisita).toLowerCase().includes(s) ||
                            i.ruta?.toLowerCase().includes(s) ||
                            i.nombreCliente?.toLowerCase().includes(s) || 
                            i.numeroPedido?.toLowerCase().includes(s) || 
                            i.telefonoCliente?.toLowerCase().includes(s) || 
                            i.motivoQueja?.toLowerCase().includes(s) || 
                            i.comentario?.toLowerCase().includes(s) ||
                            i.datosPedidosNombre?.toLowerCase().includes(s) ||
                            i.datosPedidosTelefono?.toLowerCase().includes(s) ||
                            i.nombreTercero?.toLowerCase().includes(s) ||
                            i.economico?.toLowerCase().includes(s) ||
                            i.danoCausado?.toLowerCase().includes(s) ||
                            i.danos_gen?.toLowerCase().includes(s) ||
                            i.ubicacion?.toLowerCase().includes(s));
                } else {
                    return (i.operador?.toLowerCase().includes(s) || 
                            i.unidad?.toLowerCase().includes(s) || 
                            i.ecoUnidad?.toLowerCase().includes(s) || 
                            i.ruta?.toLowerCase().includes(s) || 
                            i.descripcion?.toLowerCase().includes(s) || 
                            i.descripcionFalla?.toLowerCase().includes(s) || 
                            i.folio?.toString().includes(s));
                }
            }).filter(i => {
                // Filtro por tipo de ruta/unidad (Inspecciones)
                if (App.appState.activeTab === 'checklists' && App.appState.filterTipoRuta && App.appState.filterTipoRuta !== 'Todos') {
                    return (i.tipoRuta || 'Utilitario') === App.appState.filterTipoRuta;
                }
                return true;
            });
            

            // Aplicar Filtro de Status (Click en Tarjetas)
            let finalFiltered = filtered;
            if (App.appState.filterStatus && App.appState.filterStatus !== 'all') {
                finalFiltered = filtered.filter(i => {
                    if (App.appState.activeTab === 'checklists') {
                        const hasFallas = Object.values(i.evaluaciones || {}).includes('rechazado');
                        return App.appState.filterStatus === 'approved' ? !hasFallas : hasFallas;
                    } else if (App.appState.activeTab === 'ordenes') {
                        const completada = i.estado === 'completado' || i.estado === 'terminado';
                        return App.appState.filterStatus === 'approved' ? completada : !completada;
                    } else if (App.appState.activeTab === 'supervisiones') {
                        const conEvidencia = (i.evidenciasFotos && i.evidenciasFotos.length > 0) || i.evidenciaFoto;
                        return App.appState.filterStatus === 'approved' ? conEvidencia : !conEvidencia;
                } else if (App.appState.activeTab === 'danos-terceros' || App.appState.activeTab === 'golpe-unidades') {
                    const conEvidencia = (i.fotos && i.fotos.length > 0);
                    return App.appState.filterStatus === 'approved' ? conEvidencia : !conEvidencia;
                    }
                    return true;
                });
            }
            
            if (t) t.textContent = finalFiltered.length;
            // Excluir los de prueba del conteo total que se muestra arriba de la lista
            if (t) t.textContent = finalFiltered.filter(i => !this.isTestRecord(i)).length;
            if (App.appState.activeTab === 'supervisiones') {
                this.pruneSelectedSupervisions(finalFiltered);
            }
            if (c) {
                c.innerHTML = AdminView.renderReportsList(finalFiltered, App.appState.activeTab);
                if (App.appState.activeTab === 'supervisiones') {
                    setTimeout(() => this.updateSelectedSupervisionCounter(), 0);
                }
                
                // 🎨 Post-procesamiento para pintar de morado las tarjetas de prueba en las listas
                setTimeout(() => {
                    const cards = c.querySelectorAll('.card, .report-card');
                    cards.forEach(card => {
                        if (card.innerText.toLowerCase().includes('prueba')) {
                            card.style.backgroundColor = '#faf5ff';
                            card.style.border = '2px solid #d8b4fe';
                            if (!card.querySelector('.test-banner')) {
                                const banner = document.createElement('div');
                                banner.className = 'test-banner';
                                banner.style.cssText = 'background:#a855f7; color:white; text-align:center; font-size:13px; font-weight:bold; padding:8px; border-radius:6px; margin-bottom:15px;';
                                banner.innerText = '🧪 REGISTRO DE PRUEBA (HACER CASO OMISO)';
                                card.insertBefore(banner, card.firstChild);
                            }
                        }
                    });
                }, 100);
            }
            
            try { this.updateStatsChart(filtered.filter(i => !this.isTestRecord(i)), App.appState.activeTab); } catch (e) {}
        } catch (error) {
            console.error("Error cargando reportes:", error);
            if (c) c.innerHTML = `<div class="card"><p>Error: ${error.message}</p><button onclick="AdminController.loadReportsIntoPanel()" class="btn btn-primary">Reintentar</button></div>`;
        }
    },

    // ===== PANEL TALLER =====
    async loadTallerPanel() {
        const c = document.getElementById('reportsList');
        if (c) c.innerHTML = '<div class="spinner" style="margin:40px auto"></div><p style="text-align:center">Cargando órdenes...</p>';
        
        try {
            const allItems = await StorageService.loadOrdenes();
            
            // ---- LÓGICA ESTÁTICA DE MES Y HOY ----
            const hoy = new Date();
            const mesActual = hoy.getMonth() + 1;
            const anioActual = hoy.getFullYear();
            const diaActual = hoy.getDate();
            
            let itemsMes = [];
            let itemsHoy = [];
            
            allItems.forEach(i => {
                // Excluir registros de prueba de los contadores KPI
                if (this.isTestRecord(i)) return;

                let y, m, d;
                if (i.timestamp) {
                    const date = new Date(i.timestamp);
                    y = date.getFullYear(); m = date.getMonth() + 1; d = date.getDate();
                } else if (i.fecha) {
                    if (i.fecha.includes('/')) {
                        const parts = i.fecha.split('/').map(Number);
                        d = parts[0]; m = parts[1]; y = parts[2];
                    } else if (i.fecha.includes('-')) {
                        const parts = i.fecha.split('-').map(Number);
                        y = parts[0]; m = parts[1]; d = parts[2];
                    }
                }
                if (y === anioActual && m === mesActual) {
                    itemsMes.push(i);
                    if (d === diaActual) itemsHoy.push(i);
                }
            });
            
            // Inyectar resultados en la vista
            const mt = document.getElementById('tMonthTotal'); const mp = document.getElementById('tMonthPend'); 
            const mpr = document.getElementById('tMonthProc'); const mc = document.getElementById('tMonthComp');
            
            const tt = document.getElementById('tTodayTotal'); const tp = document.getElementById('tTodayPend'); 
            const tpr = document.getElementById('tTodayProc'); const tc = document.getElementById('tTodayComp');

            if (mt && tt) {
                mt.textContent = itemsMes.length;
                mp.textContent = itemsMes.filter(o => o.estado === 'pendiente').length;
                mpr.textContent = itemsMes.filter(o => o.estado === 'en_proceso').length;
                mc.textContent = itemsMes.filter(o => o.estado === 'completado' || o.estado === 'terminado').length;

                tt.textContent = itemsHoy.length;
                tp.textContent = itemsHoy.filter(o => o.estado === 'pendiente').length;
                tpr.textContent = itemsHoy.filter(o => o.estado === 'en_proceso').length;
                tc.textContent = itemsHoy.filter(o => o.estado === 'completado' || o.estado === 'terminado').length;
            }
            // ---- FIN LÓGICA ESTADÍSTICAS ----
            
            let filteredItems = allItems;
            
            // 1. Filtro por Fecha (Mes/Dia) para Taller
            filteredItems = filteredItems.filter(i => {
                return this.matchesDateFilters(i, App.appState.filterTallerMonth, App.appState.filterTallerDate);
            });

            // 2. Aplicar filtro de búsqueda de texto
            if (App.appState.filterSearch) {
                const s = App.appState.filterSearch.toLowerCase();
                filteredItems = filteredItems.filter(i => i.unidad?.toLowerCase().includes(s) || 
                                         i.folio?.toString().toLowerCase().includes(s) || 
                                         i.operador?.toLowerCase().includes(s));
            }
            
            // 3. Aplicar filtro de estado (tarjetas)
            if (App.appState.filterTallerStatus && App.appState.filterTallerStatus !== 'all') {
                const status = App.appState.filterTallerStatus;
                if (status === 'completado') {
                    filteredItems = filteredItems.filter(o => o.estado === 'completado' || o.estado === 'terminado');
                } else {
                    filteredItems = filteredItems.filter(o => o.estado === status);
                }
            }
            
            filteredItems.sort((a,b) => (b.timestamp||0) - (a.timestamp||0));
            
            if (c) c.innerHTML = this.renderTallerOrdersList(filteredItems);
        } catch (error) {
            console.error("Error cargando taller:", error);
            if (c) c.innerHTML = '<div class="card"><p>Error al cargar las órdenes</p><button onclick="AdminController.loadTallerPanel()" class="btn btn-primary">Reintentar</button></div>';
        }
    },

    // Renderizar órdenes en taller
    renderTallerOrdersList(ordenes) {
        if (!ordenes.length) return `<div class="card" style="text-align:center;padding:40px;"><div style="font-size:40px;">🔧</div><p>No hay órdenes</p></div>`;
        
        return ordenes.map(o => {
            const isTest = AdminController.isTestRecord(o);
            const baseColor = o.estado === 'pendiente' ? '#dc2626' : o.estado === 'en_proceso' ? '#2563eb' : '#16a34a';
            const baseBg = o.estado === 'pendiente' ? '#fee2e2' : o.estado === 'en_proceso' ? '#dbeafe' : '#dcfce7';
            
            const color = isTest ? '#a855f7' : baseColor;
            const bg = isTest ? '#f3e8ff' : baseBg;
            
            return `<div class="report-card" style="border-left:4px solid ${color};margin-bottom:15px; ${isTest ? 'background-color: #faf5ff; border: 2px solid #d8b4fe; border-left: 6px solid #a855f7; border-radius: 8px;' : ''}">
                ${isTest ? `
                <div style="background:#a855f7; color:white; text-align:center; font-size:13px; font-weight:bold; padding:8px; border-radius:6px; margin-bottom:15px;">
                    🧪 REGISTRO DE PRUEBA (HACER CASO OMISO)
                </div>` : ''}
                <div class="report-header">
                    <div>
                        <div class="report-date">${o.fecha || ''} ${o.hora || ''}</div>
                        <div style="font-weight:bold;">Folio: ${o.folio || 'N/A'}</div>
                    </div>
                    <div style="text-align:right;">
                        <div class="report-unit">${o.unidad || ''}</div>
                        <div style="font-size:12px;color:#64748b;">${o.operador || ''}</div>
                    </div>
                </div>
                
                <div style="margin:10px 0;padding:10px;background:#f8fafc;border-radius:6px;">
                    <div style="margin-bottom:8px;"><strong>🔧 Falla reportada:</strong> ${o.descripcionFalla || 'Sin descripción'}</div>
                    
                    ${o.estado === 'en_proceso' ? `
                        <div style="margin-top:10px;">
                            <label style="font-weight:bold;display:block;margin-bottom:5px;">⚙️ Trabajo realizado:</label>
                            <textarea id="trabajo-${o.id}" rows="3" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:6px;margin-bottom:8px;" placeholder="Describe el trabajo realizado...">${o.trabajoRealizado || ''}</textarea>
                            <button onclick="AdminController.guardarTrabajoRealizado('${o.id}')" 
                                    class="btn btn-success" style="width:100%;padding:8px;font-size:13px;margin:0;">
                                💾 Guardar trabajo realizado
                            </button>
                        </div>
                    ` : o.trabajoRealizado ? `
                        <div style="margin-top:10px;padding:8px;background:#ecfdf5;border-radius:4px;">
                            <strong>✅ Trabajo realizado:</strong> ${o.trabajoRealizado}
                        </div>
                    ` : ''}
                </div>
                
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
                    <span style="background:${bg};color:${color};padding:4px 8px;border-radius:12px;font-size:12px;font-weight:bold;">
                        ${isTest ? '🧪 PRUEBA - ' : ''}${o.estado === 'pendiente' ? '⏳ PENDIENTE' : o.estado === 'en_proceso' ? '🔄 EN PROCESO' : '✅ COMPLETADO'}
                    </span>
                    
                    <div style="display:flex;gap:5px;">
                        ${o.estado === 'pendiente' ? `
                            <button onclick="AdminController.updateTallerOrderStatus('${o.id}','en_proceso')" 
                                    class="btn btn-primary" style="padding:6px 12px;font-size:12px;width:auto;margin:0;">
                                ▶ Iniciar
                            </button>
                        ` : ''}
                        
                        ${o.estado === 'en_proceso' ? `
                            <button onclick="AdminController.updateTallerOrderStatus('${o.id}','completado')" 
                                    class="btn btn-success" style="padding:6px 12px;font-size:12px;width:auto;margin:0;">
                                ✓ Completar
                            </button>
                        ` : ''}
                        
                        <button onclick="AdminController.viewOrden('${o.id}')" 
                                class="btn btn-secondary" style="padding:6px 12px;font-size:12px;width:auto;margin:0;">
                            Ver
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    // Guardar trabajo realizado
    async guardarTrabajoRealizado(ordenId) {
        const textarea = document.getElementById(`trabajo-${ordenId}`);
        if (!textarea) {
            alert("Error: No se encontró el campo de texto");
            return false;
        }
        
        const trabajo = textarea.value;
        
        if (!trabajo?.trim()) {
            alert("❌ El trabajo realizado no puede estar vacío");
            return false;
        }
        
        const btn = document.activeElement;
        const originalText = btn.innerText;
        btn.innerText = 'Guardando...'; 
        btn.disabled = true;
        
        try {
            const ordenes = await StorageService.loadOrdenes();
            const ordenIndex = ordenes.findIndex(o => o.id == ordenId);
            
            if (ordenIndex === -1) {
                alert("Orden no encontrada");
                return false;
            }
            
            ordenes[ordenIndex].trabajoRealizado = trabajo;
            localStorage.setItem('ordenes', JSON.stringify(ordenes));
            
            if (typeof StorageService.updateOrden === 'function') {
                await StorageService.updateOrden(ordenId, { trabajoRealizado: trabajo });
            }
            
            await this.loadTallerPanel();
            alert("✅ Trabajo guardado correctamente");
            return true;
            
        } catch (error) {
            console.error("Error guardando trabajo:", error);
            alert("Error al guardar el trabajo realizado");
            return false;
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    },

    // Actualizar estado de orden
    async updateTallerOrderStatus(id, status) {
        if (!confirm(status === 'en_proceso' ? '¿Iniciar esta orden?' : '¿Completar esta orden?')) return;
        
        if (status === 'completado') {
            const ordenes = await StorageService.loadOrdenes();
            const orden = ordenes.find(o => o.id == id);
            
            if (!orden.trabajoRealizado || orden.trabajoRealizado.trim() === '') {
                alert("❌ Debes guardar el trabajo realizado antes de completar la orden");
                return;
            }
        }
        
        const btn = document.activeElement;
        const originalText = btn.innerText;
        btn.innerText = '...'; 
        btn.disabled = true;
        
        try {
            const ordenes = await StorageService.loadOrdenes();
            const ordenIndex = ordenes.findIndex(o => o.id == id);
            
            if (ordenIndex === -1) {
                alert("Orden no encontrada");
                return;
            }
            
            ordenes[ordenIndex].estado = status;
            localStorage.setItem('ordenes', JSON.stringify(ordenes));
            
            if (typeof StorageService.updateOrden === 'function') {
                await StorageService.updateOrden(id, { estado: status });
            }
            
            await this.loadTallerPanel();
            
        } catch (error) {
            console.error('Error actualizando orden:', error);
            alert('Error al actualizar la orden. Intenta de nuevo.');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    },

    // Ver detalles
    async viewReport(id) {
        const r = (await StorageService.loadReports()).find(r=>r.id==id);
        if (r) {
            ModalService.show(AdminView.renderReportDetails(r)); 
            if (this.isTestRecord(r)) this.highlightModalAsTest(id, 'checklists');
        } else alert("No encontrado");
    },
    
    async viewOrden(id) {
        const o = (await StorageService.loadOrdenes()).find(o=>o.id==id);
        if (o) {
            ModalService.show(AdminView.renderOrdenDetails(o)); 
            if (this.isTestRecord(o)) this.highlightModalAsTest(id, 'ordenes');
        } else alert("No encontrado");
    },
    
    async viewDanosTerceros(id) {
        const r = (await StorageService.loadDanosTerceros()).find(r => r.id == id);
        if (r) {
            ModalService.show(this.renderDanosTercerosDetails(r));
            if (this.isTestRecord(r)) this.highlightModalAsTest(id, 'danos-terceros');
        } else {
            alert("Registro de Daños a Terceros no encontrado.");
        }
    },

    async viewGolpeUnidades(id) {
        const r = (await StorageService.loadGolpesUnidades()).find(r => r.id == id);
        if (r) {
            ModalService.show(this.renderGolpeUnidadesDetails(r));
            if (this.isTestRecord(r)) this.highlightModalAsTest(id, 'golpe-unidades');
        } else {
            alert("Registro de Golpe a Unidades no encontrado.");
        }
    },

    // Función para pintar de morado las ventanas modales al darle "Ver"
    highlightModalAsTest(id, type) {
        setTimeout(() => {
            if (ModalService.currentModal) {
                const container = ModalService.currentModal.firstElementChild;
                if (container) {
                    container.style.backgroundColor = '#faf5ff';
                    container.style.border = '3px solid #a855f7';
                    
                    if (!container.querySelector('.test-banner-modal')) {
                        const banner = document.createElement('div');
                        banner.className = 'test-banner-modal';
                        banner.style.cssText = 'background:#a855f7; color:white; text-align:center; font-size:15px; font-weight:bold; padding:12px; border-radius:8px; margin: 15px;';
                        banner.innerText = '🧪 REGISTRO DE PRUEBA (HACER CASO OMISO)';
                        container.insertBefore(banner, container.firstChild);
                    }

                    // Inyectar botón de eliminar al final
                    if (id && type && !container.querySelector('.btn-delete-test')) {
                        const delBtn = document.createElement('button');
                        delBtn.className = 'btn-delete-test';
                        delBtn.style.cssText = 'padding: 12px; background: #dc2626; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; flex: 1;';
                        delBtn.innerHTML = '🗑️ Eliminar Prueba';
                        delBtn.onclick = () => AdminController.deleteTestRecord(id, type);
                        
                        const actionContainers = Array.from(container.querySelectorAll('div')).filter(d => 
                            d.hasAttribute('data-html2canvas-ignore') || (d.style.display === 'flex' && d.style.gap)
                        );
                        
                        if (actionContainers.length > 0) {
                            const lastContainer = actionContainers[actionContainers.length - 1];
                            lastContainer.appendChild(delBtn);
                        } else {
                            delBtn.style.width = 'calc(100% - 30px)';
                            delBtn.style.margin = '0 15px 15px 15px';
                            container.appendChild(delBtn);
                        }
                    }
                    // El botón de eliminar ahora se inyecta directamente en las funciones render...Details
                    // para mayor consistencia.
                }
            }
        }, 50);
    },
    
    // Borrar registro de prueba en la BD
    async deleteTestRecord(id, tab) {
        if (!confirm("🚨 ¿Estás seguro de eliminar PERMANENTEMENTE este registro de prueba?\nEsta acción no se puede deshacer.")) return;
        
        ModalService.close();
        const loadingMsg = document.createElement('div');
        loadingMsg.innerHTML = '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;text-align:center;font-weight:bold;">Borrando...</div>';
        document.body.appendChild(loadingMsg);
        
        try {
            let success = false;
            if (tab === 'checklists') success = await StorageService.deleteReport(id);
            else if (tab === 'ordenes') success = await StorageService.deleteOrden(id);
            else if (tab === 'supervisiones') success = await StorageService.deleteSupervision(id);
            else if (tab === 'danos-terceros') success = await StorageService.deleteDanosTerceros(id);
            else if (tab === 'golpe-unidades') success = await StorageService.deleteGolpeUnidades(id);
            
            if (success) {
                setTimeout(() => {
                    document.body.removeChild(loadingMsg);
                    if (App.appState.step === 'taller-panel') AdminController.loadTallerPanel();
                    else AdminController.loadReportsIntoPanel();
                }, 500);
            } else {
                document.body.removeChild(loadingMsg);
                alert("❌ No se pudo eliminar el registro en la base de datos.");
            }
        } catch(e) {
            console.error(e);
            if (document.body.contains(loadingMsg)) document.body.removeChild(loadingMsg);
            alert("❌ Error de conexión al intentar eliminar.");
        }
    },

    async deleteSingleSupervision(id) {
        if (!id) return alert("❌ No se encontró el ID de la supervisión.");
        if (!confirm("¿Eliminar solo esta supervisión?\n\nNo se borrarán las demás supervisiones.")) return;

        const loadingMsg = document.createElement('div');
        loadingMsg.innerHTML = '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;text-align:center;font-weight:bold;">Eliminando supervisión...</div>';
        document.body.appendChild(loadingMsg);

        try {
            const success = await StorageService.deleteSupervision(id);
            if (!success) {
                alert("❌ No se pudo eliminar la supervisión en la base de datos.");
                return;
            }

            if (ModalService.currentModal) ModalService.close();
            if (App.appState.activeTab !== 'supervisiones') {
                App.appState.activeTab = 'supervisiones';
            }
            await this.loadReportsIntoPanel();
            alert("✅ Supervisión eliminada correctamente.");
        } catch (error) {
            console.error("Error eliminando supervisión:", error);
            alert("❌ Error de conexión al intentar eliminar la supervisión.");
        } finally {
            if (document.body.contains(loadingMsg)) {
                document.body.removeChild(loadingMsg);
            }
        }
    },

    // Ver supervisiones
    async viewSupervision(id) { 
        const supervisiones = await StorageService.loadSupervisiones();
        const s = supervisiones.find(s => s.id == id);
        if (s) {
            ModalService.show(this.renderSupervisionDetails(s)); 
        } else {
            alert("No encontrado");
        }
    },

    // Renderizar detalles de supervisión
    renderSupervisionDetails(s) {
        const isTest = this.isTestRecord(s);
        const contentId = `supervision-content-${s.id || Date.now()}`;
        const tipoVisita = this.formatTipoVisita(s.tipoVisita);
        const esAtencionQueja = tipoVisita === 'Atención a Queja';
        const esSupervisionRuta = this.isSupervisionRuta(tipoVisita);
        return `
            <div id="${contentId}" style="padding: 25px; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: ${isTest ? '#faf5ff' : 'white'}; ${isTest ? 'border: 2px solid #d8b4fe; border-radius: 12px;' : ''}">
                ${isTest ? `
                <div style="background: #a855f7; color: white; padding: 12px; text-align: center; font-weight: bold; font-size: 15px; border-radius: 8px; margin-bottom: 20px;">
                    🧪 REGISTRO DE PRUEBA - HACER CASO OMISO
                </div>
                ` : ''}
                <!-- Encabezado con nombre del supervisor -->
                <div style="background: ${isTest ? '#9333ea' : '#0867ec'}; color: white; padding: 20px; border-radius: 12px 12px 0 0; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: bold;">${s.nombreSupervisor || 'ALBERTO SORIA'}</h2>
                </div>
                
                <!-- Contenido principal -->
                <div style="padding: 0 10px;">
                    <!-- Fecha y hora -->
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; font-size: 14px; color: #475569;">
                        <strong>📅 Fecha:</strong> ${s.fecha || ''} ${s.hora || ''}
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">📝 TIPO DE VISITA</div>
                            <div style="font-weight: bold; font-size: 14px;">${tipoVisita}</div>
                        </div>
                        <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">🛣️ RUTA</div>
                            <div style="font-weight: bold; font-size: 14px;">${s.ruta || 'No especificada'}</div>
                        </div>
                    </div>
                    
                    <!-- Pedido y persona revisada -->
                    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin-bottom: 15px;">
                        <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">📦 ${esSupervisionRuta ? 'ECONÓMICO DE UNIDAD' : 'PEDIDO'}</div>
                            <div style="font-weight: bold; font-size: 16px;">${s.numeroPedido || 'N/A'}</div>
                        </div>
                        <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">👤 ${esSupervisionRuta ? 'OPERADOR / CHOFER' : 'CLIENTE'}</div>
                            <div style="font-weight: bold; font-size: 14px;">${s.nombreCliente || 'No especificado'}</div>
                        </div>
                    </div>
                    
                    <!-- Teléfono -->
                    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                        <span style="background: #e2e8f0; padding: 8px; border-radius: 50%;">📞</span>
                        <div>
                            <div style="font-size: 11px; color: #64748b;">${esSupervisionRuta ? 'TELÉFONO DEL OPERADOR' : 'TELÉFONO'}</div>
                            <div style="font-weight: bold;">${s.telefonoCliente || 'No especificado'}</div>
                        </div>
                    </div>
                    
                    ${esAtencionQueja ? `
                        <!-- Motivo de la queja (en rojo) -->
                        <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #dc2626;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                <span style="color: #dc2626; font-size: 18px;">🔴</span>
                                <span style="font-weight: bold; color: #991b1b;">MOTIVO DE LA QUEJA</span>
                            </div>
                            <p style="margin: 5px 0 0 0; color: #7f1d1d; font-size: 14px;">
                                ${s.motivoQueja || 'EL CLIENTE SE QUEJA PORQUE NO LE DURA EL GAS'}
                            </p>
                        </div>

                        <!-- Solución brindada (en verde) -->
                        <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #16a34a;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                <span style="color: #16a34a; font-size: 18px;">✅</span>
                                <span style="font-weight: bold; color: #166534;">SOLUCIÓN BRINDADA</span>
                            </div>
                            <p style="margin: 5px 0 0 0; color: #14532d; font-size: 14px;">
                                ${s.solucion || 'SE REVISA NOTAS DE CONSUMO Y SE REALIZA REPOSICIÓN DE GAS 20 KG.'}
                            </p>
                        </div>
                    ` : esSupervisionRuta ? `
                        <div style="background: #eef2ff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #4f46e5;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                <span style="color: #4f46e5; font-size: 18px;">🔎</span>
                                <span style="font-weight: bold; color: #312e81;">HALLAZGOS EN SITIO</span>
                            </div>
                            <p style="margin: 5px 0 0 0; color: #312e81; font-size: 14px;">
                                ${s.comentario || 'No especificado'}
                            </p>
                        </div>

                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #64748b;">
                            <div style="font-weight: bold; color: #0f172a; margin-bottom: 8px;">Revisión del supervisor al operador</div>
                            <p style="margin: 5px 0; color: #334155; font-size: 14px;"><strong>Equipo de seguridad completo:</strong> ${s.revisionEquipoSeguridad || 'No especificado'}</p>
                            <p style="margin: 5px 0; color: #334155; font-size: 14px;"><strong>Presentación e identificación:</strong> ${s.revisionPresentacionIdentificacion || 'No especificado'}</p>
                            <p style="margin: 5px 0; color: #334155; font-size: 14px;"><strong>Unidad limpia/en condiciones:</strong> ${s.revisionUnidadCondiciones || 'No especificado'}</p>
                            <p style="margin: 5px 0; color: #334155; font-size: 14px;"><strong>Documentación del servicio:</strong> ${s.revisionDocumentacionServicio || 'No especificado'}</p>
                            <p style="margin: 5px 0; color: #334155; font-size: 14px;"><strong>Atención y maniobras seguras:</strong> ${s.revisionManejoSeguro || 'No especificado'}</p>
                            <p style="margin: 5px 0; color: #334155; font-size: 14px;"><strong>Caja de seguridad:</strong> ${s.revisionCajaSeguridad || 'No especificado'}</p>
                        </div>
                    ` : `
                        <div style="background: #eef2ff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #4f46e5;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                <span style="color: #4f46e5; font-size: 18px;">🔎</span>
                                <span style="font-weight: bold; color: #312e81;">HALLAZGOS EN SITIO</span>
                            </div>
                            <p style="margin: 5px 0 0 0; color: #312e81; font-size: 14px;">
                                ${s.comentario || 'No especificado'}
                            </p>
                        </div>

                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #64748b;">
                            <p style="margin: 5px 0; color: #334155; font-size: 14px;"><strong>⭐ Trato del vendedor:</strong> ${s.encuestaTratoVendedor ? `${s.encuestaTratoVendedor}/10` : 'No especificado'}</p>
                            <p style="margin: 5px 0; color: #334155; font-size: 14px;"><strong>⭐ Claridad de información:</strong> ${s.encuestaClaridadVendedor ? `${s.encuestaClaridadVendedor}/10` : 'No especificado'}</p>
                            <p style="margin: 5px 0; color: #334155; font-size: 14px;"><strong>⭐ Tiempo de atención:</strong> ${s.encuestaTiempoServicio ? `${s.encuestaTiempoServicio}/10` : 'No especificado'}</p>
                            <p style="margin: 5px 0; color: #334155; font-size: 14px;"><strong>⭐ Presentación del vendedor:</strong> ${s.encuestaPresentacionVendedor ? `${s.encuestaPresentacionVendedor}/10` : 'No especificado'}</p>
                            <p style="margin: 5px 0; color: #334155; font-size: 14px;"><strong>⭐ Satisfacción general:</strong> ${s.encuestaSatisfaccionCliente ? `${s.encuestaSatisfaccionCliente}/10` : 'No especificado'}</p>
                            <p style="margin: 5px 0; color: #334155; font-size: 14px;"><strong>🧾 Servicio de calle recibido:</strong> ${s.servicioCalleRecibido || 'No'}</p>
                            ${s.servicioCalleRecibido === 'Sí' ? `
                                <div style="border-top: 1px dashed #cbd5e1; margin-top: 10px; padding-top: 10px;">
                                    <div style="font-weight: bold; color: #0f172a; margin-bottom: 5px;">Datos para registrar en pedidos</div>
                                    <p style="margin: 4px 0; color: #334155; font-size: 13px;"><strong>Nombre:</strong> ${s.datosPedidosNombre || 'No especificado'}</p>
                                    <p style="margin: 4px 0; color: #334155; font-size: 13px;"><strong>Teléfono:</strong> ${s.datosPedidosTelefono || 'No especificado'}</p>
                                    <p style="margin: 4px 0; color: #334155; font-size: 13px;"><strong>Dirección / referencias:</strong> ${s.datosPedidosDireccion || 'No especificado'}</p>
                                </div>
                            ` : ''}
                        </div>
                    `}
                    
                    <!-- Dirección (en azul) -->
                    <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2563eb;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                            <span style="color: #2563eb; font-size: 18px;">❌</span>
                            <span style="font-weight: bold; color: #1e40af;">DIRECCIÓN</span>
                        </div>
                        <p style="margin: 5px 0 0 0; color: #1e3a8a; font-size: 14px;">
                            ${s.ubicacion || (s.calle ? `${s.calle} ${s.numero || ''}, ${s.colonia || ''}` : 'Dirección no disponible')}
                        </p>
                    </div>
                    
                    <!-- Enlace a Google Maps -->
                    ${s.enlaceMaps ? `
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${s.enlaceMaps}" 
                               target="_blank"
                               style="display: inline-flex; align-items: center; gap: 8px; background: #1e40af; color: white; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: bold;">
                                📷 Ver en Google Maps
                            </a>
                        </div>
                    ` : s.coordenadas ? `
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="https://www.google.com/maps?q=${s.coordenadas.lat},${s.coordenadas.lng}" 
                               target="_blank"
                               style="display: inline-flex; align-items: center; gap: 8px; background: #1e40af; color: white; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: bold;">
                                📷 Ver en Google Maps
                            </a>
                        </div>
                    ` : ''}
                    
                    <!-- Fotos de evidencia (si existen) -->
                    ${s.evidenciasFotos?.length > 0 ? `
                        <div style="margin-top: 20px;">
                            <h4 style="color: #1e293b; margin-bottom: 10px;">📸 Evidencia fotográfica</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">
                                ${s.evidenciasFotos.map(foto => `
                                    <img src="${foto.data}" style="width: 100%; border-radius: 8px; border: 1px solid #e2e8f0;">
                                `).join('')}
                            </div>
                        </div>
                    ` : s.evidenciaFoto ? `
                        <div style="margin-top: 20px;">
                            <h4 style="color: #1e293b; margin-bottom: 10px;">📸 Evidencia fotográfica</h4>
                            <img src="${s.evidenciaFoto}" style="max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0;">
                        </div>
                    ` : ''}
                    
                    <!-- Firma del supervisor -->
                    ${s.firmaSupervisor ? `
                        <div style="margin-top: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; text-align: center;">
                            <div style="font-size: 11px; color: #64748b; margin-bottom: 5px;">FIRMA DEL SUPERVISOR</div>
                            <img src="${s.firmaSupervisor}" style="max-height: 60px; max-width: 100%; object-fit: contain;">
                        </div>
                    ` : ''}
                    
                    <!-- Comentario adicional -->
                    ${esAtencionQueja && s.comentario ? `
                        <div style="margin-top: 15px; padding: 12px; background: #fff3cd; border-radius: 8px; font-size: 13px;">
                            <strong>📝 Comentario:</strong> ${s.comentario}
                        </div>
                    ` : ''}
                </div>
                
                <!-- Botones de acción -->
                <div style="display: flex; gap: 10px; margin-top: 30px; padding: 0 10px 20px 10px;" data-html2canvas-ignore>
                    <button onclick="ModalService.close()"
                            style="flex: 1; padding: 12px; background: #e2e8f0; color: #475569; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                        Cerrar
                    </button>
                    <button onclick="AdminController.downloadPDF('${contentId}', 'Supervision_${(s.nombreSupervisor || '').split(' ')[0]}_${(s.fecha || '').replace(/\//g, '-')}')"
                            style="flex: 1; padding: 12px; background: #ef4444; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                        📄 Descargar PDF
                    </button>
                    <button onclick="AdminController.deleteSingleSupervision('${s.id}')"
                            style="flex: 1; padding: 12px; background: #dc2626; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `; 
    },

    // Render detalles de Daños a Terceros (modal) usando la plantilla real del formulario
    renderDanosTercerosDetails(r) {
        try {
            const isTest = this.isTestRecord(r);
            const contentId = `danos-terceros-content-${r.id}`;

            const detailRow = (label, value) => {
                if (!value && value !== 0) return '';
                return `<div style="margin-bottom: 8px; display: flex; flex-wrap: wrap;"><strong style="color: #475569; min-width: 180px; padding-right: 10px;">${label}:</strong> <span style="color: #1e293b; flex: 1;">${value}</span></div>`;
            };
            
            const section = (title, content) => {
                if (!content || typeof content !== 'string' || !content.trim()) return '';
                return `<div style="margin-bottom: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #1e40af; border-bottom: 1px solid #dbeafe; padding-bottom: 8px; font-weight: bold;">${title}</h4>
                            ${content}
                        </div>`;
            };

            let photosHtml = '';
            if (r.fotos && r.fotos.length > 0) {
                const photoGrid = r.fotos.map(foto => `
                    <div style="position: relative;">
                        <a href="${foto.data}" target="_blank" title="Ver imagen completa">
                            <img src="${foto.data}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;">
                        </a>
                    </div>
                `).join('');
                photosHtml = section('Evidencia Fotográfica', `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">${photoGrid}</div>`);
            }

            const contentHtml = `
                <div style="text-align:center; margin-bottom:24px;">
                    <h1 style="margin:0; font-size:24px; color:#d97706;">Bitácora de Daños a Terceros</h1>
                    <p style="margin:4px 0 0 0; color:#64748b;">Detalles del Reporte</p>
                </div>

                ${section('1. Datos Generales',
                    detailRow('Supervisor', r.supervisor) +
                    detailRow('Celular', r.celular) +
                    detailRow('Fecha', r.fecha)
                )}
                
                ${section('2. Vehículo Gas Express Nieto',
                    detailRow('Chofer', r.chofer) +
                    detailRow('Ayudante', r.ayudante) +
                    detailRow('Económico', r.economico) +
                    detailRow('Ruta', r.ruta)
                )}

                ${section('3. Tercero Afectado',
                    detailRow('Nombre', r.nombreTercero) +
                    detailRow('Teléfono', r.telefonoTercero)
                )}

                ${section('4. Detalles del Accidente',
                    detailRow('Domicilio del Accidente', `<div style="white-space: pre-wrap; font-size: 14px;">${r.domicilioAccidente || ''}</div>`) +
                    detailRow('Daño Causado', `<div style="white-space: pre-wrap; font-size: 14px;">${r.danoCausado || ''}</div>`) +
                    detailRow('Acuerdo de Reparación', `<div style="white-space: pre-wrap; font-size: 14px;">${r.acuerdo || ''}</div>`)
                )}

                ${photosHtml}

                ${r.firmaSupervisor ? section('5. Firma del Supervisor', `<div style="text-align:center;"><img src="${r.firmaSupervisor}" style="max-height: 80px; border: 1px solid #e2e8f0; border-radius: 8px; display: inline-block;"></div>`) : ''}
            `;

            const buttonsHtml = `
                <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap; padding: 0 20px 20px; max-width: 940px; margin: 0 auto;" data-html2canvas-ignore>
                    <button onclick="ModalService.close()" style="flex:1;min-width:120px;padding:10px;background:#e2e8f0;color:#475569;border:none;border-radius:8px;">Cerrar</button>
                    <button onclick="AdminController.downloadPDF('${contentId}', 'Danos_Terceros_${this.escapeForJs(r.economico || r.id)}')" style="flex:1;min-width:120px;padding:10px;background:#f59e0b;color:white;border:none;border-radius:8px;">📄 Descargar PDF</button>
                    <button onclick="AdminController.exportDanosTercerosToExcel('${r.id}')" style="flex:1;min-width:120px;padding:10px;background:#10b981;color:white;border:none;border-radius:8px;">📊 Descargar Excel</button>
                    ${isTest ? `<button onclick="AdminController.deleteTestRecord('${r.id}','danos-terceros')" style="flex:1;min-width:120px;padding:10px;background:#dc2626;color:white;border:none;border-radius:8px;">🗑️ Eliminar</button>` : ''}
                </div>
            `;

            return `
                <div id="${contentId}" style="padding:20px; max-width:940px; margin:0 auto; font-family: Arial, sans-serif; background:${isTest ? '#faf5ff' : 'white'}; ${isTest ? 'border: 2px solid #d8b4fe; border-radius: 12px;' : ''}">
                    ${isTest ? `<div style="background:#a855f7;color:white;padding:12px;font-weight:bold;margin-bottom:12px;border-radius:8px;">🧪 REGISTRO DE PRUEBA - HACER CASO OMISO</div>` : ''}
                    ${contentHtml}
                </div>
                ${buttonsHtml}
            `;
        } catch (e) {
            console.error("Error al renderizar detalles de Daños a Terceros:", e, r);
            const logoUrl = (typeof CONFIG !== 'undefined' && CONFIG.LOGO_URL) ? CONFIG.LOGO_URL : 'img/logo.png';
            return `<div style="padding: 20px; font-family: Arial, sans-serif;">
                        <div style="background: white; border-radius: 12px; border-top: 8px solid #ef4444; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; padding: 30px 25px;">
                            <img src="${logoUrl}" alt="Logo" style="height: 40px; margin-bottom: 20px; opacity: 0.7;">
                            <h3 style="color: #b91c1c; font-size: 22px; margin: 0 0 10px 0;">Ocurrió un Error</h3>
                            <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                                No se pudieron cargar los detalles de este reporte. Esto puede deberse a datos corruptos o a un problema inesperado.
                            </p>
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: left; font-size: 12px; color: #334155; margin-bottom: 25px;">
                                <strong style="display: block; margin-bottom: 5px; color: #991b1b;">Detalle técnico (para soporte):</strong>
                                <pre style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace; margin: 0;">${e.message}</pre>
                            </div>
                            <button onclick="ModalService.close()" style="background: #64748b; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                                Cerrar
                            </button>
                        </div>
                    </div>`;
        }
    },

    // Render detalles de Golpe a Unidades (modal) usando la plantilla real del formulario
    renderGolpeUnidadesDetails(r) {
        try {
            const isTest = this.isTestRecord(r);
            const contentId = `golpe-unidades-content-${r.id}`;

            const detailRow = (label, value) => {
                if (!value && value !== 0) return '';
                return `<div style="margin-bottom: 8px; display: flex; flex-wrap: wrap;"><strong style="color: #475569; min-width: 180px; padding-right: 10px;">${label}:</strong> <span style="color: #1e293b; flex: 1;">${value}</span></div>`;
            };
            
            const section = (title, content) => {
                if (!content || typeof content !== 'string' || !content.trim()) return '';
                return `<div style="margin-bottom: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #1e40af; border-bottom: 1px solid #dbeafe; padding-bottom: 8px; font-weight: bold;">${title}</h4>
                            ${content}
                        </div>`;
            };

            const contentHtml = `
                <div style="text-align:center; margin-bottom:24px;">
                    <h1 style="margin:0; font-size:24px; color:#be123c;">Bitácora de Golpe a Unidades</h1>
                    <p style="margin:4px 0 0 0; color:#64748b;">Detalles del Reporte</p>
                </div>

                ${section('Datos Generales',
                    detailRow('Supervisor', r.supervisor) +
                    detailRow('Teléfono', r.telefono) +
                    detailRow('Fecha', r.fecha)
                )}
                
                ${section('1. Vehículo de Tercero',
                    detailRow('Marca', r.v1_marca) +
                    detailRow('Modelo', r.v1_modelo) +
                    detailRow('Año', r.v1_ano) +
                    detailRow('Placas', r.v1_placas) +
                    detailRow('Propietario', r.v1_propietario) +
                    detailRow('Celular', r.v1_cel)
                )}

                ${section('Datos del Chofer Gas Express Nieto',
                    detailRow('Chofer', r.chofer) +
                    detailRow('Ayudante', r.ayudante) +
                    detailRow('Económico', r.economico) +
                    detailRow('Ruta', r.ruta) +
                    detailRow('Nombre para firma', r.nombreFirmaChofer)
                )}
                
                ${section('2. Vehículo Nuestro',
                    detailRow('Marca', r.v2_marca) +
                    detailRow('Modelo', r.v2_modelo) +
                    detailRow('Año', r.v2_ano) +
                    detailRow('Placas', r.v2_placas) +
                    detailRow('Propietario', r.v2_propietario) +
                    detailRow('Celular', r.v2_cel)
                )}

                ${section('3. Detalles del Accidente',
                    detailRow('Domicilio del Accidente', `<div style="white-space: pre-wrap; font-size: 14px;">${r.domicilio || ''}</div>`) +
                    detailRow('Daños a Vehículo de Tercero', `<div style="white-space: pre-wrap; font-size: 14px;">${r.danos_v1 || ''}</div>`) +
                    detailRow('Daños a Vehículo Gas Express Nieto', `<div style="white-space: pre-wrap; font-size: 14px;">${r.danos_gen || ''}</div>`) +
                    detailRow('Infracción', r.infraccion) +
                    detailRow('Garantía', r.garantia) +
                    detailRow('Observaciones', `<div style="white-space: pre-wrap; font-size: 14px;">${r.observaciones || ''}</div>`)
                )}

                ${r.firmaChofer ? section('Firma del Chofer', `<div style="text-align:center;"><img src="${r.firmaChofer}" style="max-height: 80px; border: 1px solid #e2e8f0; border-radius: 8px; display: inline-block;"></div>`) : ''}
            `;

            const buttonsHtml = `
                <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap; padding: 0 20px 20px; max-width: 940px; margin: 0 auto;" data-html2canvas-ignore>
                    <button onclick="ModalService.close()" style="flex:1;min-width:120px;padding:10px;background:#e2e8f0;color:#475569;border:none;border-radius:8px;">Cerrar</button>
                    <button onclick="AdminController.downloadPDF('${contentId}', 'Golpe_Unidad_${this.escapeForJs(r.economico || r.id)}')" style="flex:1;min-width:120px;padding:10px;background:#ef4444;color:white;border:none;border-radius:8px;">📄 Descargar PDF</button>
                    <button onclick="AdminController.exportGolpeUnidadesToExcel('${r.id}')" style="flex:1;min-width:120px;padding:10px;background:#10b981;color:white;border:none;border-radius:8px;">📊 Descargar Excel</button>
                    ${isTest ? `<button onclick="AdminController.deleteTestRecord('${r.id}','golpe-unidades')" style="flex:1;min-width:120px;padding:10px;background:#dc2626;color:white;border:none;border-radius:8px;">🗑️ Eliminar</button>` : ''}
                </div>
            `;

            return `
                <div id="${contentId}" style="padding:20px; max-width:940px; margin:0 auto; font-family: Arial, sans-serif; background:${isTest ? '#faf5ff' : 'white'}; ${isTest ? 'border: 2px solid #d8b4fe; border-radius: 12px;' : ''}">
                    ${isTest ? `<div style="background:#a855f7;color:white;padding:12px;font-weight:bold;margin-bottom:12px;border-radius:8px;">🧪 REGISTRO DE PRUEBA - HACER CASO OMISO</div>` : ''}
                    ${contentHtml}
                </div>
                ${buttonsHtml}
            `;
        } catch (e) {
            console.error("Error al renderizar detalles de Golpe a Unidades:", e, r);
            const logoUrl = (typeof CONFIG !== 'undefined' && CONFIG.LOGO_URL) ? CONFIG.LOGO_URL : 'img/logo.png';
            return `<div style="padding: 20px; font-family: Arial, sans-serif;">
                        <div style="background: white; border-radius: 12px; border-top: 8px solid #ef4444; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; padding: 30px 25px;">
                            <img src="${logoUrl}" alt="Logo" style="height: 40px; margin-bottom: 20px; opacity: 0.7;">
                            <h3 style="color: #b91c1c; font-size: 22px; margin: 0 0 10px 0;">Ocurrió un Error</h3>
                            <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                                No se pudieron cargar los detalles de este reporte. Esto puede deberse a datos corruptos o a un problema inesperado.
                            </p>
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: left; font-size: 12px; color: #334155; margin-bottom: 25px;">
                                <strong style="display: block; margin-bottom: 5px; color: #991b1b;">Detalle técnico (para soporte):</strong>
                                <pre style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace; margin: 0;">${e.message}</pre>
                            </div>
                            <button onclick="ModalService.close()" style="background: #64748b; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                                Cerrar
                            </button>
                        </div>
                    </div>`;
        }
    },

    // --- NUEVO: Puente para los botones de exportación de tu compañero ---
    showExportDialog(format) {
        if (format === 'pdf') {
            this.exportAllToPDF();
        } else if (format === 'excel') {
            this.exportToExcel();
        } else if (format === 'csv') {
            this.exportToCSV();
        }
    },

    // --- NUEVAS FUNCIONES DE EXPORTACIÓN FUSIONADAS ---
    async getFilteredDataForExport() {
        let data;
        const activeTab = App.appState.activeTab;
        const isTaller = App.appState.step === 'taller-panel';

        if (isTaller) {
            data = await StorageService.loadOrdenes();
        } else {
            switch (activeTab) {
                case 'checklists':
                    data = await StorageService.loadReports(); break;
                case 'ordenes':
                    data = await StorageService.loadOrdenes(); break;
                case 'danos-terceros':
                    data = await StorageService.loadDanosTerceros(); break;
                case 'golpe-unidades':
                    data = await StorageService.loadGolpesUnidades(); break;
                case 'supervisiones':
                default:
                    data = await StorageService.loadSupervisiones(); break;
            }
        }
        
        if (!data.length) return [];
        
        // Descartar registros de prueba para no exportarlos
        let filtered = data.filter(i => !this.isTestRecord(i));

        filtered = filtered.filter(i => this.matchesDateFilters(
            i,
            App.appState.step === 'taller-panel' ? App.appState.filterTallerMonth : App.appState.filterMonth,
            App.appState.step === 'taller-panel' ? App.appState.filterTallerDate : App.appState.filterDate
        ));

        if (App.appState.step !== 'taller-panel' && App.appState.activeTab === 'supervisiones') {
            const selectedIds = new Set(this.getSelectedSupervisionIds());
            if (selectedIds.size > 0) {
                filtered = filtered.filter(i => selectedIds.has(String(i.id || '')));
            }
        }
        
        if (App.appState.filterSearch) {
            const s = App.appState.filterSearch.toLowerCase();
            filtered = filtered.filter(i => i.operador?.toLowerCase().includes(s) || 
                                           i.unidad?.toLowerCase().includes(s) || 
                                           i.folio?.toString().includes(s) || 
                                           i.nombreSupervisor?.toLowerCase().includes(s) ||
                                           this.formatTipoVisita(i.tipoVisita).toLowerCase().includes(s) ||
                                           i.ruta?.toLowerCase().includes(s) ||
                                           i.comentario?.toLowerCase().includes(s) ||
                                           i.datosPedidosNombre?.toLowerCase().includes(s) ||
                                           i.datosPedidosTelefono?.toLowerCase().includes(s) ||
                                           i.nombreTercero?.toLowerCase().includes(s) ||
                                           i.economico?.toLowerCase().includes(s)
                                           );
        }
        
        if (App.appState.activeTab === 'checklists' && App.appState.filterTipoRuta && App.appState.filterTipoRuta !== 'Todos') {
            filtered = filtered.filter(i => (i.tipoRuta || 'Utilitario') === App.appState.filterTipoRuta);
        }
        
        if (App.appState.filterStatus && App.appState.filterStatus !== 'all') {
            filtered = filtered.filter(i => {
                if (App.appState.activeTab === 'checklists') {
                    const hasFallas = Object.values(i.evaluaciones || {}).includes('rechazado');
                    return App.appState.filterStatus === 'approved' ? !hasFallas : hasFallas;
                } else if (App.appState.activeTab === 'ordenes') {
                    const completada = i.estado === 'completado' || i.estado === 'terminado';
                    return App.appState.filterStatus === 'approved' ? completada : !completada;
                } else if (App.appState.activeTab === 'supervisiones') {
                    const conEvidencia = (i.evidenciasFotos && i.evidenciasFotos.length > 0) || i.evidenciaFoto;
                    return App.appState.filterStatus === 'approved' ? conEvidencia : !conEvidencia;
                } else if (App.appState.activeTab === 'danos-terceros' || App.appState.activeTab === 'golpe-unidades') {
                    const conEvidencia = (i.fotos && i.fotos.length > 0);
                    return App.appState.filterStatus === 'approved' ? conEvidencia : !conEvidencia;
                }
                return true;
            });
        }
        return filtered;
    },

    getCSVForExport(filtered) {
        return App.appState.activeTab === 'supervisiones' ? this.exportSupervisionesToExcelFormat(filtered) : 
               (App.appState.activeTab === 'danos-terceros' || App.appState.activeTab === 'golpe-unidades') ? this.exportGenericToExcel(filtered) :
               StorageService.exportToCSV(filtered, App.appState.activeTab === 'checklists' ? 'checklists' : 'ordenes');
    },
    
    exportSupervisionesToExcelFormat(supervisiones) {
        const header = [
            "Fecha", "Supervisor", "Tipo de visita", "Pedido", "Ruta", "Unidad", "Cliente", "Operador",
            "Calificacion promedio", "Trato del vendedor", "Claridad de informacion", "Tiempo de atencion",
            "Presentacion", "Satisfaccion general", "Servicio de calle recibido",
            "Equipo de seguridad completo", "Presentación e identificación", "Unidad limpia/en condiciones",
            "Documentación del servicio", "Atención y maniobras seguras",
            "Hallazgo", "Queja", "Solucion", "Direccion servicio", "Telefono",
            "clasificacion", "Hallazgo clasificacion", "clasificacion quejas",
            "Longitud", "Latitud"
        ].join(',');

        const rows = supervisiones.map(s => {
            const tipoVisita = this.formatTipoVisita(s.tipoVisita);
            const esQueja = tipoVisita === this.TIPO_ATENCION_QUEJA;
            const esDomicilio = tipoVisita === this.TIPO_SUPERVISION_DOMICILIO;
            const esRuta = tipoVisita === this.TIPO_SUPERVISION_RUTA;

            const encuestaFields = [
                s.encuestaTratoVendedor, s.encuestaClaridadVendedor, s.encuestaTiempoServicio,
                s.encuestaPresentacionVendedor, s.encuestaSatisfaccionCliente
            ];
            const calificaciones = esDomicilio ? encuestaFields.map(Number).filter(n => !isNaN(n) && n > 0) : [];
            const promedio = calificaciones.length > 0 ? (calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length).toFixed(2) : 'N/A';

            const revisionFields = [
                s.revisionEquipoSeguridad, s.revisionPresentacionIdentificacion, s.revisionUnidadCondiciones,
                s.revisionDocumentacionServicio, s.revisionManejoSeguro
            ];

            const escapeCSV = (val) => `"${(val || '').toString().replace(/"/g, '""')}"`;

            const rowData = [
                s.fecha,
                s.nombreSupervisor,
                tipoVisita,
                esRuta ? 'N/A' : s.numeroPedido,
                s.ruta,
                esRuta ? s.numeroPedido : 'N/A', // numeroPedido es la unidad en ruta
                esRuta ? 'N/A' : s.nombreCliente,
                esRuta ? s.nombreCliente : 'N/A', // nombreCliente es el operador en ruta
                promedio,
                esDomicilio ? s.encuestaTratoVendedor || 'N/A' : 'N/A',
                esDomicilio ? s.encuestaClaridadVendedor || 'N/A' : 'N/A',
                esDomicilio ? s.encuestaTiempoServicio || 'N/A' : 'N/A',
                esDomicilio ? s.encuestaPresentacionVendedor || 'N/A' : 'N/A',
                esDomicilio ? s.encuestaSatisfaccionCliente || 'N/A' : 'N/A',
                esDomicilio ? s.servicioCalleRecibido || 'No' : 'N/A',
                esRuta ? s.revisionEquipoSeguridad || 'N/A' : 'N/A',
                esRuta ? s.revisionPresentacionIdentificacion || 'N/A' : 'N/A',
                esRuta ? s.revisionUnidadCondiciones || 'N/A' : 'N/A',
                esRuta ? s.revisionDocumentacionServicio || 'N/A' : 'N/A',
                esRuta ? s.revisionManejoSeguro || 'N/A' : 'N/A',
                esQueja ? 'N/A' : s.comentario,
                esQueja ? s.motivoQueja : 'N/A',
                esQueja ? s.solucion : 'N/A',
                s.ubicacion,
                s.telefonoCliente,
                s.ruta, // clasificacion
                esDomicilio ? 'Sin observación / OK' : (esRuta ? 'Surtido / carga / abastecimiento' : 'N/A'), // Hallazgo clasificacion
                esQueja ? 'V' : 'N/A', // clasificacion quejas
                s.coordenadas?.lng || '',
                s.coordenadas?.lat || ''
            ];
            return rowData.map(escapeCSV).join(',');
        });

        return `${header}\n${rows.join('\n')}`;
    },

    exportGenericToExcel(items) {
        if (!items || items.length === 0) return '';
        
        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '""';
            let str = String(val);
            if (typeof val === 'object' && val !== null) {
                if (Array.isArray(val) && val.length > 0) return `"${val.length} foto(s)"`;
                return '"[Dato complejo]"';
            }
            if (str.includes('"') || str.includes(',') || str.includes('\n')) {
                str = `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const allHeaders = new Set();
        items.forEach(item => Object.keys(item).forEach(key => allHeaders.add(key)));

        const headers = Array.from(allHeaders).filter(h => !['fotos', 'firmaSupervisor', 'firmaChofer'].includes(h));
        const rows = items.map(item => headers.map(h => escapeCSV(item[h])).join(','));
        
        return `${headers.join(',')}\n${rows.join('\n')}`;
    },

    async exportToCSV() {
        if (App.appState.step !== 'taller-panel' && App.appState.activeTab === 'mapas') return alert('Esta función no aplica para el mapa.');
        const filtered = await this.getFilteredDataForExport();
        if (!filtered.length) return alert('Sin datos');
        
        const csv = this.getCSVForExport(filtered);
        const url = URL.createObjectURL(new Blob(['\uFEFF'+csv], {type:'text/csv'}));
        const a = document.createElement('a'); 
        a.href = url; a.download = `export_${Date.now()}.csv`; a.click(); 
        URL.revokeObjectURL(url);
        alert(`Exportados ${filtered.length} registros`);
    },

    async exportToExcel() {
        if (App.appState.step !== 'taller-panel' && App.appState.activeTab === 'mapas') return alert('Esta función no aplica para el mapa.');
        const filtered = await this.getFilteredDataForExport();
        if (!filtered.length) return alert('Sin datos');

        const csv = this.getCSVForExport(filtered);
        const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'application/vnd.ms-excel;charset=utf-8;' }));
        const a = document.createElement('a');
        a.href = url; a.download = `export_${Date.now()}.xls`; a.click();
        URL.revokeObjectURL(url);
        alert(`Exportados ${filtered.length} registros a Excel`);
    },
    
    exportToCSVFormat(d,t) { 
        if (t === 'supervisiones') {
            return 'Fecha,Hora,Supervisor,Tipo de Visita,Ruta,Pedido/Económico,Cliente/Operador,Teléfono,Motivo,Solución,Hallazgos,Trato Vendedor,Claridad Información,Tiempo Atención,Presentación Vendedor,Satisfacción General,Servicio Calle Recibido,Nombre Pedidos,Teléfono Pedidos,Dirección Pedidos,Equipo Seguridad,Identificación Operador,Unidad Condiciones,Documentación Servicio,Manejo Seguro,Ubicación\n' +
                   d.map(i => `"${i.fecha}","${i.hora}","${i.nombreSupervisor}","${this.formatTipoVisita(i.tipoVisita)}","${i.ruta || ''}","${i.numeroPedido || ''}","${i.nombreCliente || ''}","${i.telefonoCliente || ''}","${i.motivoQueja || ''}","${i.solucion || ''}","${i.comentario || ''}","${i.encuestaTratoVendedor || ''}","${i.encuestaClaridadVendedor || ''}","${i.encuestaTiempoServicio || ''}","${i.encuestaPresentacionVendedor || ''}","${i.encuestaSatisfaccionCliente || ''}","${i.servicioCalleRecibido || ''}","${i.datosPedidosNombre || ''}","${i.datosPedidosTelefono || ''}","${i.datosPedidosDireccion || ''}","${i.revisionEquipoSeguridad || ''}","${i.revisionPresentacionIdentificacion || ''}","${i.revisionUnidadCondiciones || ''}","${i.revisionDocumentacionServicio || ''}","${i.revisionManejoSeguro || ''}","${i.ubicacion || ''}"`).join('\n');
        }
        return '';
    },

    async exportAllToPDF() {
        const isTaller = App.appState.step === 'taller-panel';
        const activeTab = isTaller ? 'ordenes' : App.appState.activeTab;
        const usingSelection = activeTab === 'supervisiones' && this.getSelectedSupervisionIds().length > 0;
        if (activeTab === 'mapas') return alert('Esta función no aplica para el mapa.');

        const filtered = await this.getFilteredDataForExport();
        if (!filtered.length) return alert('No hay registros para exportar con los filtros actuales.');
        const exportScope = usingSelection ? 'supervisiones seleccionadas' : 'registros filtrados';
        if (!confirm(`Se van a descargar ${filtered.length} archivos PDF individuales (${exportScope}).\n\nIMPORTANTE: Tu navegador podría pedirte permiso para "Descargar múltiples archivos". Por favor dale en "Permitir".\n\n¿Deseas continuar?`)) return;

        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);color:white;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:99999;font-family:sans-serif;';
        loadingDiv.innerHTML = `
            <div class="spinner" style="margin-bottom:20px; width:50px; height:50px; border:5px solid #f3f3f3; border-top:5px solid #3b82f6; border-radius:50%; animation:spin 1s linear infinite;"></div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            <h2 style="margin:0 0 10px 0;">Generando PDFs individuales...</h2>
            <p id="pdfProgress" style="font-size:18px; font-weight:bold; color:#32cd32;">Preparando 0 de ${filtered.length}</p>
            <p style="font-size:14px; margin-top:20px; color:#cbd5e1; text-align:center; max-width:80%;">Por favor, no cierres esta ventana mientras se descargan.<br>Asegúrate de permitir las descargas múltiples si el navegador te lo pregunta.</p>
        `;
        document.body.appendChild(loadingDiv);
        const progressText = document.getElementById('pdfProgress');

        const container = document.createElement('div');
        container.style.cssText = 'position:absolute; left:-9999px; top:0; width: 800px; background: white;';
        document.body.appendChild(container);

        try {
            for (let i = 0; i < filtered.length; i++) {
                const item = filtered[i];
                progressText.innerText = `Descargando ${i + 1} de ${filtered.length}...`;

                let htmlContent = activeTab === 'checklists' ? AdminView.renderReportDetails(item) :
                                  activeTab === 'ordenes' ? AdminView.renderOrdenDetails(item) :
                                  activeTab === 'danos-terceros' ? this.renderDanosTercerosDetails(item) :
                                  activeTab === 'golpe-unidades' ? this.renderGolpeUnidadesDetails(item) :
                                  this.renderSupervisionDetails(item);
                
                container.innerHTML = htmlContent;
                let elementToPrint = activeTab === 'checklists' ? document.getElementById(`report-content-${item.id}`) :
                                     activeTab === 'ordenes' ? document.getElementById(`orden-content-${item.id}`) :
                                     activeTab === 'danos-terceros' ? document.getElementById(`danos-terceros-content-${item.id}`) :
                                     activeTab === 'golpe-unidades' ? document.getElementById(`golpe-unidades-content-${item.id}`) :
                                     container.firstElementChild;

                const style = document.createElement('style');
                style.innerHTML = '.btn, button { display: none !important; }';
                if (elementToPrint) elementToPrint.appendChild(style);
                
                let prefix = activeTab === 'checklists' ? 'Inspeccion_' + (item.ecoUnidad || '') :
                             activeTab === 'ordenes' ? 'Orden_' + (item.folio || '') :
                             activeTab === 'danos-terceros' ? 'Danos_Terceros_' + (item.economico || '') :
                             activeTab === 'golpe-unidades' ? 'Golpe_Unidad_' + (item.economico || '') :
                             'Supervision_' + ((item.nombreSupervisor || '').split(' ')[0]);
                
                let filename = `${prefix}_${(item.fecha || '').replace(/\//g, '-')}_${item.id || i}`;

                const opt = {
                    margin: [0.5, 0.5, 0.5, 0.5],
                    filename: `${filename}.pdf`,
                    image: { type: 'jpeg', quality: 0.95 },
                    html2canvas: { scale: 2, letterRendering: true, useCORS: true, logging: false, scrollY: 0, scrollX: 0 },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                };

                await html2pdf().set(opt).from(elementToPrint || container).save();
                await new Promise(resolve => setTimeout(resolve, 1200));
            }
            alert(`✅ Se han descargado ${filtered.length} PDFs correctamente.`);
        } catch (error) {
            console.error('Error generando PDFs:', error);
            alert('Ocurrió un error al generar los PDFs. Verifica la consola para más detalles.');
        } finally {
            document.body.removeChild(loadingDiv);
            document.body.removeChild(container);
        }
    },

    // Limpiar todo
    async clearAllReports() {
        const code = prompt("Código de seguridad:");
        if (code !== this.SECRET_CLEAN_CODE) return alert("❌ Código incorrecto");
        if (!confirm("¿Eliminar todos los registros?")) return;
        
        if (App.appState.activeTab === 'checklists') await StorageService.clearReports();
        else if (App.appState.activeTab === 'ordenes') await StorageService.clearOrdenes();
        else if (App.appState.activeTab === 'danos-terceros') await StorageService.clearDanosTerceros();
        else if (App.appState.activeTab === 'golpe-unidades') await StorageService.clearGolpeUnidades();
        else await StorageService.clearSupervisiones();
        
        this.loadReportsIntoPanel();
    },

    // Gráfica
    updateStatsChart(d, t) {
        if (typeof Chart === 'undefined') {
            console.warn("Chart.js no está cargado. No se puede mostrar la gráfica.");
            return;
        }

        const chartContainer = document.querySelector('#statsChart')?.parentElement;
        if (!chartContainer) {
            return;
        }

        let ctx = document.getElementById('statsChart');

        if (['danos-terceros', 'golpe-unidades'].includes(t)) {
            if (this.chartInstance) this.chartInstance.destroy();
            this.chartInstance = null;
            chartContainer.innerHTML = '<p style="text-align:center; color:#64748b; padding-top: 70px;">No hay gráfica disponible para esta sección.</p>';
            return;
        }

        if (!ctx) {
            chartContainer.innerHTML = '<canvas id="statsChart"></canvas>';
            ctx = document.getElementById('statsChart');
        }

        if (this.chartInstance) this.chartInstance.destroy();
        
        let labels, values, backgroundColor;
        
        if (t === 'checklists') {
            labels = ['✅ Aprobados', '❌ Con Fallas'];
            values = [
                d.filter(r => !Object.values(r.evaluaciones || {}).includes('rechazado')).length,
                d.filter(r => Object.values(r.evaluaciones || {}).includes('rechazado')).length
            ];
            backgroundColor = ['#22c55e', '#dc2626'];
        } else if (t === 'ordenes') {
            labels = ['⏳ Pendientes', '🔄 En Proceso', '✅ Completados'];
            values = [
                d.filter(o => o.estado === 'pendiente').length,
                d.filter(o => o.estado === 'en_proceso').length,
                d.filter(o => o.estado === 'completado' || o.estado === 'terminado').length
            ];
            backgroundColor = ['#ef4444', '#3b82f6', '#22c55e'];
        } else {
            // supervisiones
            const supervisores = d.reduce((acc, curr) => {
                const nombre = curr.nombreSupervisor || 'Sin supervisor';
                acc[nombre] = (acc[nombre] || 0) + 1;
                return acc;
            }, {});
            
            labels = Object.keys(supervisores);
            values = Object.values(supervisores);
            const defaultColors = ['#0867ec', '#4f9ef7', '#7bb3f9', '#a8c4f0', '#cbdcf7', '#d97706', '#be123c'];
            backgroundColor = labels.map((_, i) => defaultColors[i % defaultColors.length]);
        }

        this.chartInstance = new Chart(ctx, {
            type: t === 'supervisiones' ? 'bar' : 'doughnut',
            data: { 
                labels, 
                datasets: [{ 
                    data: values, 
                    backgroundColor: backgroundColor 
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { 
                        position: 'bottom' 
                    } 
                } 
            }
        });
    },

    // FUNCIÓN PARA DESCARGAR PDF
    downloadPDF(elementId, fileName) {
        if (typeof html2pdf === 'undefined') {
            alert("Error: La librería html2pdf no está cargada. Verifica la conexión a internet.");
            return;
        }
        
        const element = document.getElementById(elementId);
        if (!element) {
            alert("Error: No se encontró el elemento a imprimir.");
            return;
        }
        
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10001;text-align:center;';
        loadingDiv.innerHTML = '<div class="spinner" style="margin:10px auto;"></div><p>Generando PDF, por favor espera...</p>';
        document.body.appendChild(loadingDiv);
        
        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `${fileName}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, letterRendering: true, useCORS: true, logging: false, scrollY: 0, scrollX: 0 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(element).save()
            .then(() => {
                if (document.body.contains(loadingDiv)) {
                    document.body.removeChild(loadingDiv);
                }
            })
            .catch((error) => {
                if (document.body.contains(loadingDiv)) {
                    document.body.removeChild(loadingDiv);
                }
                console.error('Error generando PDF:', error);
                alert('Ocurrió un error al generar el PDF. Revisa la consola para más detalles.');
            });
    },

    // Exportar un único reporte de daños a terceros a Excel
    async exportDanosTercerosToExcel(id) {
        try {
            const items = await StorageService.loadDanosTerceros();
            const item = items.find(i => i.id == id);
            if (!item) return alert('No se encontró el registro');

            const csv = this.exportGenericToExcel([item]);
            const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'application/vnd.ms-excel;charset=utf-8;' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `Danos_Terceros_${item.economico || item.id}.xls`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Error al exportar a Excel');
        }
    },

    // Exportar un único reporte de golpe a unidades a Excel
    async exportGolpeUnidadesToExcel(id) {
        try {
            const items = await StorageService.loadGolpesUnidades();
            const item = items.find(i => i.id == id);
            if (!item) return alert('No se encontró el registro');

            const csv = this.exportGenericToExcel([item]);
            const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'application/vnd.ms-excel;charset=utf-8;' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `Golpe_Unidad_${item.economico || item.id}.xls`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Error al exportar a Excel');
        }
    },

    async generatePdfBlob(eId) { 
        return typeof html2pdf !== 'undefined' ? html2pdf().from(document.getElementById(eId)).output('blob') : null; 
    },
    
    async sendOrdenEmail(oId) { 
        console.log('Enviar email', oId); 
    },
    
    // Agrega estas dos funciones al final del objeto AdminController
    showPasswordModal() {
        if (App.appState.userRole !== 'admin') return alert("❌ Solo los administradores principales pueden cambiar contraseñas.");
        
        const html = `
            <div style="padding: 20px; text-align: left; font-family: Arial, sans-serif;">
                <h3 style="margin-bottom: 10px; color: #1e293b; font-size: 18px;">🔐 Cambiar Contraseña</h3>
                <p style="font-size: 12px; color: #64748b; margin-bottom: 15px;">
                    Ingresa el correo del empleado y su nueva contraseña.
                </p>
                <form onsubmit="AdminController.handlePasswordReset(event)">
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 12px; font-weight: bold;">Correo</label>
                        <input type="email" id="resetEmail" required style="width: 100%; padding: 10px; border-radius: 6px;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 12px; font-weight: bold;">Nueva Contraseña</label>
                        <input type="password" id="resetPassword" required minlength="6" style="width: 100%; padding: 10px; border-radius: 6px;">
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button type="button" onclick="ModalService.close()" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" id="btnResetPwd" class="btn btn-primary">Actualizar</button>
                    </div>
                </form>
            </div>
        `;
        ModalService.show(html);
    },

    async handlePasswordReset(e) {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value.trim();
        const password = document.getElementById('resetPassword').value;
        const btn = document.getElementById('btnResetPwd');

        if(!confirm(`¿Estás seguro de cambiar la contraseña de "${email}"?`)) return;

        btn.disabled = true;
        btn.innerText = "Actualizando...";

        try {
            await StorageService.resetUserPassword(email, password);
            alert(`✅ Contraseña actualizada correctamente para ${email}`);
            ModalService.close();
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            btn.disabled = false;
            btn.innerText = "Actualizar";
        }
    }
};

if (typeof window !== 'undefined') window.AdminController = AdminController;
