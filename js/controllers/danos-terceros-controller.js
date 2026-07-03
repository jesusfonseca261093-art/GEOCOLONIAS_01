// js/controllers/danos-terceros-controller.js

const DanosTercerosController = {
    
    collectData() {
        const data = {
            supervisor: document.getElementById('dt_supervisor')?.value || '',
            celular: document.getElementById('dt_celular')?.value || '',
            fecha: document.getElementById('dt_fecha')?.value || '',
            chofer: document.getElementById('dt_chofer')?.value || '',
            ayudante: document.getElementById('dt_ayudante')?.value || '',
            economico: document.getElementById('dt_economico')?.value || '',
            ruta: document.getElementById('dt_ruta')?.value || '',
            nombreTercero: document.getElementById('dt_nombre_tercero')?.value || '',
            telefonoTercero: document.getElementById('dt_telefono_tercero')?.value || '',
            domicilioAccidente: document.getElementById('dt_domicilio_accidente')?.value || '',
            danoCausado: document.getElementById('dt_dano_causado')?.value || '',
            acuerdo: document.getElementById('dt_acuerdo')?.value || '',
            fotos: DanosTercerosView.state.fotos || [],
            firmaSupervisor: App.appState.danosTercerosData?.firmaSupervisor || null
        };
        return data;
    },

    validateData(data) {
        const requiredFields = {
            supervisor: "Supervisor",
            celular: "Celular del supervisor",
            fecha: "Fecha",
            chofer: "Chofer",
            economico: "Económico",
            ruta: "Ruta",
            nombreTercero: "Nombre del tercero",
            telefonoTercero: "Teléfono del tercero",
            domicilioAccidente: "Domicilio del accidente",
            danoCausado: "Daño causado",
            acuerdo: "Acuerdo de reparación"
        };

        for (const field in requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                alert(`El campo "${requiredFields[field]}" es obligatorio.`);
                return false;
            }
        }

        if (!data.firmaSupervisor) {
            alert("La firma del supervisor es obligatoria.");
            return false;
        }

        return true;
    },

    async handleSubmit(event) {
        event.preventDefault();
        const data = this.collectData();

        if (!this.validateData(data)) {
            return;
        }

        App.appState.isSubmitting = true;
        App.render(); // Para mostrar el estado de carga en el botón

        try {
            const reporte = {
                id: Date.now().toString(),
                tipo: 'danos_terceros',
                ...data,
                timestamp: new Date().toISOString()
            };

            const saved = await StorageService.saveDanosTerceros(reporte);
            if (!saved) throw new Error("Error al guardar en la base de datos.");

            // Guardar para la pantalla de éxito
            App.appState.ultimoReporte = reporte;

            // Resetear
            App.appState.danosTercerosData = { firmaSupervisor: null };
            DanosTercerosView.init(); // Limpia el estado de la vista (fotos)

            App.goToStep('danos-terceros-success');

        } catch (error) {
            console.error("Error al guardar el reporte de daños a terceros:", error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            App.appState.isSubmitting = false;
            App.render();
        }
    }
};

if (typeof window !== 'undefined') {
    window.DanosTercerosController = DanosTercerosController;
}