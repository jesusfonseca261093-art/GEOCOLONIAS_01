const SegurosUnidadesView = {
    render() {
        const role = (App?.appState?.userRole || '').toLowerCase();
        const isSupervisor = role === 'supervisor';

        return `
            <style>
                @media (max-width: 768px) {
                    #seguros-header { flex-direction: column !important; align-items: flex-start !important; }
                    #seguros-header-title h1 { font-size: 22px !important; }
                    #seguros-header-title p { font-size: 13px !important; }
                    #seguros-buttons { width: 100% !important; }
                    #seguros-buttons button { width: 100% !important; }
                    #seguros-search-container { flex-direction: column !important; }
                    #seguros-search-input { width: 100% !important; }
                    #seguros-count { width: 100% !important; text-align: left !important; margin-top: 8px !important; }
                }
            </style>

            <div id="seguros-unidades-root" style="min-height: 100vh; background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%); padding: 16px;">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <!-- Header -->
                    <div id="seguros-header" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px;">
                        <div id="seguros-header-title">
                            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6366f1; font-weight: 700;"></div>
                            <h1 style="margin: 4px 0 0; font-size: 28px; color: #0f172a; font-weight: 800;">Gestión de pólizas de parque vehicular</h1>
                            <p style="margin: 6px 0 0; color: #64748b; font-size: 14px;">.</p>
                        </div>
                        <div id="seguros-buttons" style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button onclick="App.goToStep('home')" style="padding: 12px 16px; border: none; border-radius: 10px; background: #e2e8f0; color: #0f172a; cursor: pointer; font-weight: 600; font-size: 14px;">← Regresar</button>
                            ${!isSupervisor ? `<button onclick="SegurosUnidadesController.openModal()" style="padding: 12px 16px; border: none; border-radius: 10px; background: #2563eb; color: white; cursor: pointer; font-weight: 600; font-size: 14px;">＋ Subir seguro</button>` : ''}
                        </div>
                    </div>

                    <!-- Main Content -->
                    <div style="background: white; border-radius: 16px; padding: 16px; box-shadow: 0 10px 30px rgba(15,23,42,0.08);">
                        <!-- Search Bar -->
                        <div id="seguros-search-container" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
                            <div id="seguros-search-input" style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 240px;">
                                <i class='bx bx-search' style="font-size: 20px; color: #64748b; flex-shrink: 0;"></i>
                                <input id="seguros-search" placeholder="Buscar unidad, aseguradora..." style="width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 999px; outline: none; font-size: 14px;" />
                            </div>
                            <div id="seguros-count" style="font-size: 13px; color: #64748b; font-weight: 600; white-space: nowrap;">0 registros</div>
                        </div>

                        <!-- List -->
                        <div id="seguros-unidades-list"></div>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        if (typeof SegurosUnidadesController !== 'undefined') {
            SegurosUnidadesController.init();
        }
    }
};

if (typeof window !== 'undefined') window.SegurosUnidadesView = SegurosUnidadesView;
