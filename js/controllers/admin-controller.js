// admin-controller.js - Controlador para el panel de administración

const AdminController = {
    chartInstance: null,
    SECRET_CLEAN_CODE: "Nieto2025",

    // Identificar si es un registro de prueba (para no contarlo ni exportarlo)
    isTestRecord(item) {
        if (!item) return false;
        const op = String(item.operador || '').toLowerCase();
        const sup = String(item.nombreSupervisor || '').toLowerCase();
        const cli = String(item.nombreCliente || '').toLowerCase();
        const uni = String(item.unidad || item.ecoUnidad || '').toLowerCase();
        return op.includes('prueba') || sup.includes('prueba') || cli.includes('prueba') || uni.includes('prueba');
    },

    // Cambiar pestaña
    switchTab(tab) {
        App.appState.activeTab = tab;
        App.appState.filterStatus = 'all'; // Limpiar el filtro de tarjetas al cambiar de pestaña
        this.updateTabStyles(tab);
        if (tab === 'mapas') {
            const c = document.getElementById('reportsList');
            if (c) { c.innerHTML = MapaQuejasView.render(); setTimeout(() => MapaQuejasView.initMapa?.(), 200); }
        } else this.loadReportsIntoPanel();
    },

    // Filtros
    updateFilterDate(date) { 
        App.appState.filterDate = date; 
        if (App.appState.activeTab !== 'mapas') this.loadReportsIntoPanel(); 
    },
    
    updateFilterMonth(m) { 
        App.appState.filterMonth = m; 
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
        App.render();
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
        
        if (ct) ct.textContent = App.appState.activeTab === 'checklists' ? '📊 Estado de Inspecciones' : 
                                  App.appState.activeTab === 'ordenes' ? '📊 Estado de Órdenes' : 
                                  '📊 Supervisiones en Campo';
        
        if (c) c.innerHTML = '<div class="spinner" style="margin:40px auto"></div><p style="text-align:center">Cargando...</p>';
        
        try {
            let items = App.appState.activeTab === 'checklists' ? await StorageService.loadReports() :
                        App.appState.activeTab === 'ordenes' ? await StorageService.loadOrdenes() :
                        await StorageService.loadSupervisiones();
                        
            // ---- NUEVA LÓGICA: CÁLCULO ESTÁTICO DE MES Y HOY ----
            const hoy = new Date();
            const mesActual = hoy.getMonth() + 1;
            const anioActual = hoy.getFullYear();
            const diaActual = hoy.getDate();
            
            let itemsMes = [];
            let itemsHoy = [];
            
            // Recorrer todos los elementos puros de la base de datos para dividirlos por fecha
            items.forEach(i => {
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
                }
            }
            // ---- FIN NUEVA LÓGICA ----
            
            let filtered = items.filter(i => {
                let itemYear, itemMonth, itemDay;
                
                if (i.timestamp) {
                    const fecha = new Date(i.timestamp);
                    itemYear = fecha.getFullYear();
                    itemMonth = fecha.getMonth() + 1;
                    itemDay = fecha.getDate();
                } else if (typeof i.fecha === 'string') {
                    if (i.fecha.includes('/')) {
                        const [dia, mes, año] = i.fecha.split('/').map(Number);
                        itemYear = año; itemMonth = mes; itemDay = dia;
                    } else if (i.fecha.includes('-')) {
                        const [año, mes, dia] = i.fecha.split('-').map(Number);
                        itemYear = año; itemMonth = mes; itemDay = dia;
                    }
                }
                
                // Filtro por Mes
                if (App.appState.filterMonth) {
                    if (!itemYear || !itemMonth) return false;
                    const [year, month] = App.appState.filterMonth.split('-').map(Number);
                    if (itemYear !== year || itemMonth !== month) return false;
                }
                
                // Filtro por Día Exacto
                if (App.appState.filterDate) {
                    if (!itemYear || !itemMonth || !itemDay) return false;
                    const [year, month, day] = App.appState.filterDate.split('-').map(Number);
                    if (itemYear !== year || itemMonth !== month || itemDay !== day) return false;
                }
                return true;
            }).filter(i => {
                // Filtro de búsqueda por texto (sin cambios)
                if (!App.appState.filterSearch) return true;
                const s = App.appState.filterSearch.toLowerCase();
                if (App.appState.activeTab === 'supervisiones') {
                    return (i.nombreSupervisor?.toLowerCase().includes(s) || 
                            i.nombreCliente?.toLowerCase().includes(s) || 
                            i.numeroPedido?.toLowerCase().includes(s) || 
                            i.telefonoCliente?.toLowerCase().includes(s) || 
                            i.motivoQueja?.toLowerCase().includes(s) || 
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
                    }
                    return true;
                });
            }
            
            if (t) t.textContent = finalFiltered.length;
            // Excluir los de prueba del conteo total que se muestra arriba de la lista
            if (t) t.textContent = finalFiltered.filter(i => !this.isTestRecord(i)).length;
            if (c) {
                c.innerHTML = AdminView.renderReportsList(finalFiltered, App.appState.activeTab);
                
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
                let itemYear, itemMonth, itemDay;
                if (i.timestamp) {
                    const fecha = new Date(i.timestamp);
                    itemYear = fecha.getFullYear(); itemMonth = fecha.getMonth() + 1; itemDay = fecha.getDate();
                } else if (typeof i.fecha === 'string') {
                    if (i.fecha.includes('/')) {
                        const [dia, mes, año] = i.fecha.split('/').map(Number);
                        itemYear = año; itemMonth = mes; itemDay = dia;
                    } else if (i.fecha.includes('-')) {
                        const [año, mes, dia] = i.fecha.split('-').map(Number);
                        itemYear = año; itemMonth = mes; itemDay = dia;
                    }
                }
                
                if (App.appState.filterTallerMonth) {
                    if (!itemYear || !itemMonth) return false;
                    const [year, month] = App.appState.filterTallerMonth.split('-').map(Number);
                    if (itemYear !== year || itemMonth !== month) return false;
                }
                
                if (App.appState.filterTallerDate) {
                    if (!itemYear || !itemMonth || !itemDay) return false;
                    const [year, month, day] = App.appState.filterTallerDate.split('-').map(Number);
                    if (itemYear !== year || itemMonth !== month || itemDay !== day) return false;
                }
                return true;
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
                    
                    <!-- Pedido y cliente -->
                    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin-bottom: 15px;">
                        <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">📦 PEDIDO</div>
                            <div style="font-weight: bold; font-size: 16px;">${s.numeroPedido || '16394332'}</div>
                        </div>
                        <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">👤 CLIENTE</div>
                            <div style="font-weight: bold; font-size: 14px;">${s.nombreCliente || 'GAS EXPRES NIETO'}</div>
                        </div>
                    </div>
                    
                    <!-- Teléfono -->
                    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                        <span style="background: #e2e8f0; padding: 8px; border-radius: 50%;">📞</span>
                        <div>
                            <div style="font-size: 11px; color: #64748b;">TELÉFONO</div>
                            <div style="font-weight: bold;">${s.telefonoCliente || '4421639433'}</div>
                        </div>
                    </div>
                    
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
                    ${s.comentario ? `
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
                    ${isTest ? `
                    <button onclick="AdminController.deleteTestRecord('${s.id}', 'supervisiones')"
                            style="flex: 1; padding: 12px; background: #dc2626; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                        🗑️ Eliminar Prueba
                    </button>
                    ` : ''}
                </div>
            </div>
        `; 
    },

    // Diálogo unificado para exportar PDF / CSV
    showExportDialog(format) {
        const isTaller = App.appState.step === 'taller-panel';
        const activeTab = isTaller ? 'ordenes' : App.appState.activeTab;
        
        if (activeTab === 'mapas') return alert('Esta función no aplica para el mapa.');

        const html = `
            <div style="padding: 25px; font-family: Arial, sans-serif; text-align: left;">
                <h3 style="color: #1e293b; margin-bottom: 15px; font-size: 18px;">Exportar a ${format.toUpperCase()}</h3>
                <p style="font-size: 13px; color: #64748b; margin-bottom: 20px;">Selecciona qué datos deseas descargar. Esta opción ignorará los filtros de la pantalla y descargará toda la información directa de la base de datos.</p>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; font-weight: bold; color: #334155;">
                        <input type="radio" name="exportMode" value="all" checked onchange="document.getElementById('exportDateDiv').style.display='none'" style="width: 18px; height: 18px;">
                        Descargar TODO el historial
                    </label>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; font-weight: bold; color: #334155;">
                        <input type="radio" name="exportMode" value="date" onchange="document.getElementById('exportDateDiv').style.display='block'" style="width: 18px; height: 18px;">
                        Descargar de un DÍA en específico
                    </label>
                    <div id="exportDateDiv" style="display: none; margin-top: 10px; padding-left: 28px;">
                        <input type="date" id="exportDateInput" style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; width: 100%; max-width: 200px; font-size: 14px; background: #f8fafc;">
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="ModalService.close()" class="btn btn-secondary" style="flex: 1;">Cancelar</button>
                    <button onclick="AdminController.executeExport('${format}', '${activeTab}')" class="btn btn-primary" style="flex: 1; background: ${format === 'pdf' ? '#ef4444' : '#10b981'}; border: none;">
                        ${format === 'pdf' ? '📄 Generar PDFs' : '📊 Descargar CSV'}
                    </button>
                </div>
            </div>
        `;
        ModalService.show(html);
    },

    // Ejecutar la exportación según la selección
    async executeExport(format, tab) {
        const mode = document.querySelector('input[name="exportMode"]:checked').value;
        let selectedDate = null;
        
        if (mode === 'date') {
            selectedDate = document.getElementById('exportDateInput').value;
            if (!selectedDate) return alert('Por favor, selecciona una fecha válida.');
        }
        
        ModalService.close();
        
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px 40px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;text-align:center;';
        loadingDiv.innerHTML = '<div class="spinner" style="margin:10px auto;"></div><p style="font-weight:bold;color:#475569;">Descargando datos de la nube...</p>';
        document.body.appendChild(loadingDiv);

        try {
            let items = tab === 'checklists' ? await StorageService.loadReports() :
                        tab === 'ordenes' ? await StorageService.loadOrdenes() :
                        await StorageService.loadSupervisiones();
            
            if (!items || items.length === 0) {
                document.body.removeChild(loadingDiv);
                return alert('No hay datos registrados en la base de datos.');
            }

            // Filtrar reportes de prueba para que NO sean exportables
            items = items.filter(i => !this.isTestRecord(i));

            if (selectedDate) {
                const [year, month, day] = selectedDate.split('-').map(Number);
                items = items.filter(i => {
                    let itemYear, itemMonth, itemDay;
                    if (i.timestamp) {
                        const d = new Date(i.timestamp);
                        itemYear = d.getFullYear(); itemMonth = d.getMonth() + 1; itemDay = d.getDate();
                    } else if (i.fecha) {
                        if (i.fecha.includes('/')) {
                            const parts = i.fecha.split('/').map(Number);
                            itemDay = parts[0]; itemMonth = parts[1]; itemYear = parts[2];
                        } else if (i.fecha.includes('-')) {
                            const parts = i.fecha.split('-').map(Number);
                            itemYear = parts[0]; itemMonth = parts[1]; itemDay = parts[2];
                        }
                    }
                    return itemYear === year && itemMonth === month && itemDay === day;
                });
            }
            
            document.body.removeChild(loadingDiv);

            if (items.length === 0) return alert('No hay registros para la fecha seleccionada.');
            
            if (format === 'csv') {
                this.generateCSV(items, tab);
            } else {
                this.generatePDFs(items, tab);
            }
        } catch (error) {
            if (document.body.contains(loadingDiv)) document.body.removeChild(loadingDiv);
            console.error(error);
            alert("Error al extraer los datos.");
        }
    },

    // Generar archivo CSV ultra-detallado idéntico al PDF
    generateCSV(items, tab) {
        let csv = '';
        const escapeCSV = str => `"${(str || '').toString().replace(/"/g, '""')}"`;
        
        if (tab === 'checklists') {
            let allPoints = [];
            if (window.CONFIG) {
                allPoints = [
                    ...(window.CONFIG.INSPECTION_POINTS_NORMAL || []),
                    ...(window.CONFIG.INSPECTION_POINTS_AUTOTANQUE || []),
                    ...(window.CONFIG.INSPECTION_POINTS_UTILITARIO || [])
                ].filter(p => !p.isHeader);
            }
            
            let uniquePoints = [];
            let seenIds = new Set();
            allPoints.forEach(p => {
                if (!seenIds.has(p.id)) {
                    seenIds.add(p.id);
                    uniquePoints.push(p);
                }
            });

            let header = ['Identificador_Reporte', 'Fecha', 'Hora', 'Operador', 'Unidad', 'Tipo_Ruta', 'Ruta', 'KM', 'Estado_General', 'Observaciones_Fallas_Detectadas'];
            uniquePoints.forEach(p => header.push(escapeCSV(p.label)));
            csv = header.join(',') + '\n';
            
            items.forEach(report => {
                const evaluaciones = report.evaluaciones || {};
                const rechazados = Object.values(evaluaciones).filter(e => e === 'rechazado').length;
                const estado = rechazados > 0 ? 'CON FALLAS' : 'APROBADO';
                
                let row = [
                    escapeCSV(report.id),
                    escapeCSV(report.fecha),
                    escapeCSV(report.hora),
                    escapeCSV(report.operador),
                    escapeCSV(report.ecoUnidad),
                    escapeCSV(report.tipoRuta || 'Utilitario'),
                    escapeCSV(report.ruta),
                    report.km || 0,
                    escapeCSV(estado),
                    escapeCSV(report.observaciones)
                ];
                
                uniquePoints.forEach(p => {
                    let val = evaluaciones[p.id];
                    let strVal = val === 'aprobado' ? 'Cumple' : (val === 'rechazado' ? 'No Cumple' : 'N/A');
                    row.push(escapeCSV(strVal));
                });
                
                csv += row.join(',') + '\n';
            });
            
        } else if (tab === 'ordenes') {
            let header = ['Folio_Orden', 'Fecha', 'Hora_Reporte', 'Hora_Termino', 'Tiempo_Muerto', 'Unidad', 'Operador', 'Kilometraje', 'Lugar_Mantenimiento', 'Tipo_Mantenimiento', 'Estado_Proceso', 'Descripcion_Falla_Reportada', 'Trabajo_Realizado_Taller', 'Puntos_Criticos_Revisados', 'Observaciones_Adicionales'];
            csv = header.join(',') + '\n';
            
            items.forEach(o => {
                let row = [
                    escapeCSV(o.folio),
                    escapeCSV(o.fecha),
                    escapeCSV(o.horaReporte),
                    escapeCSV(o.horaTermino),
                    escapeCSV(o.tiempoMuerto),
                    escapeCSV(o.unidad),
                    escapeCSV(o.operador),
                    o.kilometro || 0,
                    escapeCSV(o.mantenimientoLugar === 'taller' ? 'Taller' : 'Ruta'),
                    escapeCSV(o.tipoMantenimiento),
                    escapeCSV(o.estado),
                    escapeCSV(o.descripcionFalla),
                    escapeCSV(o.trabajoRealizado),
                    escapeCSV((o.puntosCriticos || []).join('; ')),
                    escapeCSV(o.observaciones)
                ];
                csv += row.join(',') + '\n';
            });
            
        } else if (tab === 'supervisiones') {
            let header = ['Fecha', 'Hora', 'Supervisor', 'Pedido', 'Cliente', 'Teléfono', 'Calle', 'Número', 'Colonia', 'Ubicación_Coordenadas_Google', 'Detalle_Visita', 'Motivo_Queja', 'Solución_Brindada', 'Comentarios_Adicionales', 'Enlace_Directo_Maps'];
            csv = header.join(',') + '\n';
            items.forEach(i => {
                let row = [
                    escapeCSV(i.fecha),
                    escapeCSV(i.hora),
                    escapeCSV(i.nombreSupervisor),
                    escapeCSV(i.numeroPedido),
                    escapeCSV(i.nombreCliente),
                    escapeCSV(i.telefonoCliente),
                    escapeCSV(i.calle),
                    escapeCSV(i.numero),
                    escapeCSV(i.colonia),
                    escapeCSV(i.ubicacion),
                    escapeCSV(i.detalleVisita),
                    escapeCSV(i.motivoQueja),
                    escapeCSV(i.solucion),
                    escapeCSV(i.comentario),
                    escapeCSV(i.enlaceMaps)
                ];
                csv += row.join(',') + '\n';
            });
        }
        
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = `Reporte_${tab.toUpperCase()}_${Date.now()}.csv`; 
        a.click(); 
        URL.revokeObjectURL(url);
    },

    // Generar PDFs secuenciales sin importar filtros de pantalla
    async generatePDFs(items, activeTab) {
        if (!confirm(`Se van a descargar ${items.length} archivos PDF individuales.\n\nIMPORTANTE: Tu navegador podría pedirte permiso para "Descargar múltiples archivos". Por favor dale en "Permitir".\n\n¿Deseas continuar?`)) return;

        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);color:white;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:99999;font-family:sans-serif;';
        loadingDiv.innerHTML = `
            <div class="spinner" style="margin-bottom:20px; width:50px; height:50px; border:5px solid #f3f3f3; border-top:5px solid #3b82f6; border-radius:50%; animation:spin 1s linear infinite;"></div>
            <h2 style="margin:0 0 10px 0;">Generando PDFs individuales...</h2>
            <p id="pdfProgress" style="font-size:18px; font-weight:bold; color:#32cd32;">Preparando 0 de ${items.length}</p>
            <p style="font-size:14px; margin-top:20px; color:#cbd5e1; text-align:center; max-width:80%;">Por favor, no cierres esta ventana mientras se descargan.<br>Asegúrate de permitir las descargas múltiples si el navegador te lo pregunta.</p>
        `;
        document.body.appendChild(loadingDiv);
        const progressText = document.getElementById('pdfProgress');

        const container = document.createElement('div');
        container.style.cssText = 'position:absolute; left:-9999px; top:0; width: 800px; background: white;';
        document.body.appendChild(container);

        try {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                progressText.innerText = `Descargando ${i + 1} de ${items.length}...`;

                let htmlContent = activeTab === 'checklists' ? AdminView.renderReportDetails(item) :
                                  activeTab === 'ordenes' ? AdminView.renderOrdenDetails(item) :
                                  this.renderSupervisionDetails(item);
                
                container.innerHTML = htmlContent;

                let elementToPrint;
                if (activeTab === 'checklists') {
                    elementToPrint = document.getElementById(`report-content-${item.id}`);
                } else if (activeTab === 'ordenes') {
                    elementToPrint = document.getElementById(`orden-content-${item.id}`);
                } else {
                    elementToPrint = container.firstElementChild; 
                }

                const style = document.createElement('style');
                style.innerHTML = '.btn, button { display: none !important; }';
                if (elementToPrint) elementToPrint.appendChild(style);
                
                let prefix = activeTab === 'checklists' ? 'Inspeccion_' + (item.ecoUnidad || '') :
                             activeTab === 'ordenes' ? 'Orden_' + (item.folio || '') :
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
            alert(`✅ Se han descargado ${items.length} archivos correctamente.`);
        } catch (error) {
            console.error('Error generando PDFs:', error);
            alert('Ocurrió un error al generar las descargas.');
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
        else await StorageService.clearSupervisiones();
        
        this.loadReportsIntoPanel();
    },

    // Gráfica
    updateStatsChart(d, t) {
        if (typeof Chart === 'undefined') return;
        const ctx = document.getElementById('statsChart');
        if (!ctx) return;
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
            backgroundColor = ['#f59e0b', '#3b82f6', '#22c55e'];
        } else {
            // supervisiones
            const supervisores = d.reduce((acc, curr) => {
                const nombre = curr.nombreSupervisor || 'Sin supervisor';
                acc[nombre] = (acc[nombre] || 0) + 1;
                return acc;
            }, {});
            
            labels = Object.keys(supervisores);
            values = Object.values(supervisores);
            backgroundColor = ['#0867ec', '#4f9ef7', '#7bb3f9', '#a8c4f0', '#cbdcf7'];
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
            alert("Error: La librería html2pdf no está cargada");
            return Promise.reject();
        }
        
        const element = document.getElementById(elementId);
        if (!element) {
            alert("Error: No se encontró el elemento a imprimir");
            return;
        }
        
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;text-align:center;';
        loadingDiv.innerHTML = '<div class="spinner" style="margin:10px auto;"></div><p>Generando PDF, por favor espera...</p>';
        document.body.appendChild(loadingDiv);
        
        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `${fileName}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, letterRendering: true, useCORS: true, logging: false, scrollY: 0, scrollX: 0 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        return html2pdf().set(opt).from(element).save()
            .then(() => {
                document.body.removeChild(loadingDiv);
            })
            .catch((error) => {
                document.body.removeChild(loadingDiv);
                console.error('Error generando PDF:', error);
                alert('Error al generar el PDF. Intenta de nuevo.');
            });
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