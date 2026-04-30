// Desarrollador :Ing Jose de Jesus Fonseca Chavez

const HomeView = {
    render() {
        return `
            <div>
                <!-- Header Moderno con Logo y MenÃº -->
                <div class="header" style="background: #1e40af; color: white; border-bottom: none; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <button onclick="toggleMenu()" class="btn-icon" style="color: white; font-size: 28px; width: auto; height: auto; display: flex; align-items: center; justify-content: center; padding: 4px;">
                            <i class='bx bx-menu'></i>
                        </button>
                        <img src="${CONFIG.LOGO_URL}" onclick="toggleMenu()" style="height: 32px; max-width: 200px; cursor: pointer; object-fit: contain;" alt="Logo">
                    </div>
                </div>

                <div class="container" style="margin-top: 15px;">
                    <div style="text-align: center; padding: 20px;">
                    <h1 style="font-size: 32px; font-weight: 800; color: #1e293b; margin-bottom: 8px;">
                        Gen <span style="color: #dc2626;">Checklist</span>
                    </h1>
                    <p style="color: #64748b; font-size: 12px; margin-bottom: 30px;">
                        Control de unidades - Planta Qro
                    </p>
                    
                    <div class="home-menu-grid">
                        <button onclick="App.goToStep('form')" class="btn btn-primary">
                            <i class='bx bx-list-check' style="font-size: 22px;"></i> Nuevo check list
                        </button>
                        
                        <button onclick="App.goToStep('orden-servicio')" class="btn btn-warning">
                            <i class='bx bx-wrench' style="font-size: 22px;"></i> Orden de servicio
                        </button>
                        
                        <button onclick="App.goToStep('admin-panel')" class="btn" style="background: #0f172a; color: white;">
                            <i class='bx bx-shield-quarter' style="font-size: 22px;"></i> Panel supervisor
                        </button>
                        
                        <button onclick="App.goToStep('taller-panel')" class="btn" style="background: #334155; color: white;">
                            <i class='bx bx-car' style="font-size: 22px;"></i> Panel taller
                        </button>

                        <button onclick="App.goToStep('geocercas')" class="btn" style="background: linear-gradient(135deg, #d946ef 0%, #9333ea 100%); color: white;">
                            <i class='bx bx-map-alt' style="font-size: 22px;"></i> Geocercas
                        </button>

                        <button onclick="App.goToStep('geocercas-edicion')" class="btn" style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: white;">
                            <i class='bx bx-edit-alt' style="font-size: 22px;"></i> EDICIÓN GEOCERCAS
                        </button>

                        <button onclick="App.goToStep('supervision-form')" class="btn" style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white;">
                            <i class='bx bx-user-pin' style="font-size: 22px;"></i> Supervisión en campo
                        </button>       

                        <button onclick="App.goToStep('acta-hechos')" class="btn" style="background: linear-gradient(135deg, #f70d0d 0%, #ff0505 100%); color: white;">
                            <i class='bx bx-file' style="font-size: 22px;"></i> Acta de hechos
                        </button>


                        <button onclick="AuthController.logout()" class="btn btn-secondary">
                            <i class='bx bx-log-out' style="font-size: 22px;"></i> Cerrar sesion
                        </button>

                    
                    </div>
                    
                    <div class="stats-grid home-stats-grid">
                        <div class="stat-card">
                            <div class="stat-value stat-checklist" id="stat-checklist">--</div>
                            <div class="stat-label">Check list de Hoy</div>
                            <div class="home-stat-date" id="todayDate"></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value stat-ordenes" id="stat-ordenes">--</div>
                            <div class="stat-label">&Oacute;rdenes de Hoy</div>
                            <div class="home-stat-date" id="todayDate2"></div>
                        </div>
                    </div>
                    
                    <div class="home-note-card">
                        <p class="home-note-text">
                            <strong>Nota importante:</strong> Este es un reporte de revisi&oacute;n diaria, por lo que no sustituye al reporte de fallas a taller. Para reportes de fallas, utiliza "Orden de servicio".
                        </p>
                    </div>

                </div>
            </div>
        `;
    },
    
    // FunciÃ³n para obtener la fecha actual en formato YYYY-MM-DD
    getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    // FunciÃ³n para obtener fecha en formato legible
    getTodayFormatted() {
        const today = new Date();
        return today.toLocaleDateString('es-MX', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    },
    
    // Actualizar estadÃ­sticas del dÃ­a
    async updateStats() {
        try {
            const reports = await StorageService.loadReports();
            const ordenes = await StorageService.loadOrdenes();
            
            const todayStr = this.getTodayDate();
            const todayFormatted = this.getTodayFormatted();
            
            const todayReports = reports.filter(report => {
                if (report.timestamp) {
                    const reportDate = new Date(report.timestamp);
                    const reportDateStr = reportDate.toISOString().split('T')[0];
                    return reportDateStr === todayStr;
                }
                else if (report.fecha) {
                    const parts = report.fecha.split('/');
                    if (parts.length === 3) {
                        const reportDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        return reportDateStr === todayStr;
                    }
                }
                return false;
            });
            
            const todayOrdenes = ordenes.filter(orden => {
                if (orden.timestamp) {
                    const ordenDate = new Date(orden.timestamp);
                    const ordenDateStr = ordenDate.toISOString().split('T')[0];
                    return ordenDateStr === todayStr;
                }
                else if (orden.fecha) {
                    const parts = orden.fecha.split('/');
                    if (parts.length === 3) {
                        const ordenDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        return ordenDateStr === todayStr;
                    }
                }
                return false;
            });
            
            const elCheck = document.getElementById('stat-checklist');
            const elOrden = document.getElementById('stat-ordenes');
            const elDate = document.getElementById('todayDate');
            const elDate2 = document.getElementById('todayDate2');
            
            if (elCheck) {
                elCheck.textContent = todayReports.length;
                elCheck.style.transform = 'scale(1.1)';
                setTimeout(() => elCheck.style.transform = 'scale(1)', 200);
            }
            
            if (elOrden) {
                elOrden.textContent = todayOrdenes.length;
                elOrden.style.transform = 'scale(1.1)';
                setTimeout(() => elOrden.style.transform = 'scale(1)', 200);
            }
            
            if (elDate) {
                const fechaCapitalized = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);
                elDate.textContent = fechaCapitalized;
            }
            
            if (elDate2) {
                elDate2.textContent = todayFormatted;
            }
            
        } catch (error) {
            console.error('Error actualizando estadÃ­sticas:', error);
            const elCheck = document.getElementById('stat-checklist');
            const elOrden = document.getElementById('stat-ordenes');
            if (elCheck) elCheck.textContent = '0';
            if (elOrden) elOrden.textContent = '0';
        }
    }
};

// Exportar vista para uso global
if (typeof window !== 'undefined') {
    window.HomeView = HomeView;
}




