const SegurosUnidadesView = {
    render() {
        const role = (App?.appState?.userRole || '').toLowerCase();
        const isSupervisor = role === 'supervisor';

        return `
            <div id="seguros-unidades-root" style="min-height:100vh; background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%); padding: 20px;">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 20px;">
                        <div>
                            <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color:#6366f1; font-weight:700;">Seguros de unidades</div>
                            <h1 style="margin: 4px 0 0; font-size: 28px; color:#0f172a;">Gestión de pólizas y PDFs</h1>
                            <p style="margin: 6px 0 0; color:#64748b;">Consulta, busca y administra los seguros de las unidades con permisos diferenciales por rol.</p>
                        </div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap;">
                            <button onclick="App.goToStep('home')" style="padding:10px 14px; border:none; border-radius:10px; background:#e2e8f0; color:#0f172a; cursor:pointer;">← Regresar</button>
                            ${!isSupervisor ? `<button onclick="SegurosUnidadesController.openModal()" style="padding:10px 14px; border:none; border-radius:10px; background:#2563eb; color:white; cursor:pointer;">＋ Subir seguro</button>` : ''}
                        </div>
                    </div>

                    <div style="background:white; border-radius: 20px; padding: 20px; box-shadow: 0 10px 30px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom: 16px;">
                            <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:260px;">
                                <i class='bx bx-search' style="font-size: 20px; color:#64748b;"></i>
                                <input id="seguros-search" placeholder="Buscar por unidad, aseguradora o número de póliza" style="width:100%; padding:12px 14px; border:1px solid #cbd5e1; border-radius: 999px; outline:none;" />
                            </div>
                            <div id="seguros-count" style="font-size: 14px; color:#64748b; font-weight:600;">0 registros</div>
                        </div>

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
