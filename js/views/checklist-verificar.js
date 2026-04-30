// checklist-verificar.js - Vista de previsualización del checklist

const ChecklistVerificarView = {
    render(appState) {
        const now = new Date();
        
        // Construir un objeto "reporte" borrador para reutilizar la vista de detalles
        const draftReport = {
            id: 'preview',
            tipoRuta: appState.formData.tipoRuta || 'Utilitario',
            operador: appState.formData.operador?.toUpperCase() || '____________________',
            ecoUnidad: appState.formData.eco?.toUpperCase() || '__________',
            km: parseInt(appState.formData.km) || 0,
            ruta: appState.formData.ruta?.toUpperCase() || '',
            evaluaciones: { ...appState.evaluations },
            fotos: { ...appState.photos },
            observaciones: appState.formData.observaciones || 'Ninguna',
            firma: appState.signature || null,
            fecha: now.toLocaleDateString('es-MX'),
            hora: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        };

        // Aprovechamos la función de AdminView para generar el formato
        let html = AdminView.renderReportDetails(draftReport);

        return `
            <div>
                <style>
                    /* Ocultar botones originales del reporte (Cerrar / Descargar) */
                    #preview-container-wrapper button {
                        display: none !important;
                    }
                </style>
                <!-- Header -->
                <div class="header" style="background: #1e40af; border-bottom: none; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 12px 16px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button onclick="App.goToStep('form')" class="btn-icon" style="color: white; font-size: 26px; width: auto; height: auto;">
                            <i class='bx bx-arrow-back'></i>
                        </button>
                        <div class="logo" style="font-weight: 600; font-size: 16px; color: white;">Verificar Checklist</div>
                    </div>
                </div>
                
                <!-- Contenido de Previsualización -->
                <div id="preview-container-wrapper" style="background: #f1f5f9; min-height: 100vh; padding-top: 10px; padding-bottom: 90px;">
                    ${html}
                </div>

                <!-- Botones fijos inferiores de verificación -->
                <div style="position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 15px 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 15px; z-index: 9999; box-shadow: 0 -4px 10px rgba(0,0,0,0.05);">
                    <button type="button" onclick="App.goToStep('form')" class="btn btn-secondary" style="flex: 1; margin: 0; font-size: 15px; font-weight: bold; border-radius: 8px; padding: 12px;">
                        📝 Editar
                    </button>
                    <button type="button" onclick="FormController.submitFromPreview(App.appState)" class="btn btn-success" id="btnSubmitPreview" style="flex: 1; margin: 0; font-size: 15px; font-weight: bold; background: #10b981; color: white; border: none; border-radius: 8px; padding: 12px;">
                        ✅ Guardar
                    </button>
                </div>
            </div>
        `;
    }
};

if (typeof window !== 'undefined') {
    window.ChecklistVerificarView = ChecklistVerificarView;
}