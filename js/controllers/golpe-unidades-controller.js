// js/controllers/golpe-unidades-controller.js

const GolpeUnidadesController = {

    collectData() {
        const data = {
            supervisor: document.getElementById('gu_supervisor')?.value || '',
            telefono: document.getElementById('gu_telefono')?.value || '',
            fecha: document.getElementById('gu_fecha')?.value || '',
            // Vehículo de tercero
            v1_marca: document.getElementById('gu_v1_marca')?.value || '',
            v1_modelo: document.getElementById('gu_v1_modelo')?.value || '',
            v1_ano: document.getElementById('gu_v1_ano')?.value || '',
            v1_placas: document.getElementById('gu_v1_placas')?.value || '',
            v1_propietario: document.getElementById('gu_v1_propietario')?.value || '',
            v1_cel: document.getElementById('gu_v1_cel')?.value || '',
            // Datos GEN
            chofer: document.getElementById('gu_chofer')?.value || '',
            ayudante: document.getElementById('gu_ayudante')?.value || '',
            economico: document.getElementById('gu_economico')?.value || '',
            ruta: document.getElementById('gu_ruta')?.value || '',
            nombreFirmaChofer: document.getElementById('gu_nombre_firma_chofer')?.value || '',
            firmaChofer: App.appState.golpeUnidadesData?.firmaChofer || null,
            // Vehículo nuestro
            v2_marca: document.getElementById('gu_v2_marca')?.value || '',
            v2_modelo: document.getElementById('gu_v2_modelo')?.value || '',
            v2_ano: document.getElementById('gu_v2_ano')?.value || '',
            v2_placas: document.getElementById('gu_v2_placas')?.value || '',
            v2_propietario: document.getElementById('gu_v2_propietario')?.value || '',
            v2_cel: document.getElementById('gu_v2_cel')?.value || '',
            // Detalles
            domicilio: document.getElementById('gu_domicilio')?.value || '',
            danos_v1: document.getElementById('gu_danos_v1')?.value || '',
            danos_gen: document.getElementById('gu_danos_gen')?.value || '',
            infraccion: document.getElementById('gu_infraccion')?.value || '',
            garantia: document.getElementById('gu_garantia')?.value || '',
            observaciones: document.getElementById('gu_observaciones')?.value || '',
        };
        return data;
    },

    validateData(data) {
        const requiredFields = {
            supervisor: "Supervisor",
            telefono: "Teléfono del supervisor",
            fecha: "Fecha",
            chofer: "Chofer de Gas Express",
            economico: "Económico de Gas Express",
            ruta: "Ruta de Gas Express",
            nombreFirmaChofer: "Nombre del chofer para la firma",
            domicilio: "Domicilio del accidente",
            danos_gen: "Daños al vehículo de Gas Express Nieto"
        };

        for (const field in requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                alert(`El campo "${requiredFields[field]}" es obligatorio.`);
                return false;
            }
        }

        if (!data.firmaChofer) {
            alert("La firma del chofer es obligatoria.");
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
        App.render();

        try {
            const reporte = {
                id: Date.now().toString(),
                tipo: 'golpe_unidades',
                ...data,
                timestamp: new Date().toISOString()
            };

            const saved = await StorageService.saveGolpeUnidades(reporte);
            if (!saved) throw new Error("Error al guardar en la base de datos.");

            App.appState.ultimoReporte = reporte;
            App.appState.golpeUnidadesData = { firmaChofer: null };
            
            App.goToStep('golpe-unidades-success');

        } catch (error) {
            console.error("Error al guardar el reporte de golpe a unidades:", error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            App.appState.isSubmitting = false;
            App.render();
        }
    }
};

if (typeof window !== 'undefined') {
    window.GolpeUnidadesController = GolpeUnidadesController;
}