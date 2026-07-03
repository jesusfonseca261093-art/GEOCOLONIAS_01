// js/views/danos-terceros.js - Vista para el formato de Daños a Terceros

const DanosTercerosView = {
    state: {
        fotos: []
    },

    render() {
        return `
            <div class="acta-hechos-view">
                <!-- Header -->
                <div class="header" style="background: #d97706; color: white;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button onclick="toggleMenu()" class="btn-icon" style="color: white;"><i class='bx bx-menu'></i></button>
                        <img src="img/Logo.png" onclick="toggleMenu()" alt="Logo" style="height: 35px; cursor: pointer; object-fit: contain;">
                        <div class="logo" style="color: white;">Bitácora de Daños a Terceros</div>
                    </div>
                    <button onclick="App.goToStep('home')" class="btn-icon" style="color: white;" title="Volver al inicio"><i class='bx bx-home-alt'></i></button>
                </div>
                
                <div id="danos-terceros-root" class="max-w-4xl mx-auto p-4 md:p-6">
                    <div class="bg-white p-6 rounded-xl shadow-lg border-t-8 border-amber-500">
                        <h1 class="text-xl sm:text-2xl font-bold text-gray-800 uppercase mb-6">Bitácora de Daños a Terceros</h1>

                        <form id="danosTercerosForm" onsubmit="DanosTercerosController.handleSubmit(event)" class="space-y-6">
                            
                            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <label class="block text-xs font-bold text-gray-600 mb-3 uppercase italic">1. Datos Generales</label>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label for="dt_supervisor" class="text-sm font-medium text-gray-700">Supervisor</label>
                                        <input type="text" id="dt_supervisor" required class="w-full border p-2 rounded mt-1">
                                    </div>
                                    <div>
                                        <label for="dt_celular" class="text-sm font-medium text-gray-700">Celular</label>
                                        <input type="tel" id="dt_celular" required class="w-full border p-2 rounded mt-1">
                                    </div>
                                    <div>
                                        <label for="dt_fecha" class="text-sm font-medium text-gray-700">Fecha</label>
                                        <input type="date" id="dt_fecha" value="${new Date().toISOString().split('T')[0]}" required class="w-full border p-2 rounded mt-1">
                                    </div>
                                </div>
                            </div>

                            <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <label class="block text-xs font-bold text-blue-800 mb-3 uppercase italic">2. Vehículo Gas Express Nieto</label>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="dt_chofer" class="text-sm font-medium text-gray-700">Chofer</label>
                                        <input type="text" id="dt_chofer" required class="w-full border p-2 rounded mt-1">
                                    </div>
                                    <div>
                                        <label for="dt_ayudante" class="text-sm font-medium text-gray-700">Ayudante</label>
                                        <input type="text" id="dt_ayudante" class="w-full border p-2 rounded mt-1">
                                    </div>
                                    <div>
                                        <label for="dt_economico" class="text-sm font-medium text-gray-700">Económico</label>
                                        <input type="text" id="dt_economico" required class="w-full border p-2 rounded mt-1">
                                    </div>
                                    <div>
                                        <label for="dt_ruta" class="text-sm font-medium text-gray-700">Ruta</label>
                                        <input type="text" id="dt_ruta" required class="w-full border p-2 rounded mt-1">
                                    </div>
                                </div>
                            </div>

                            <div class="p-4 bg-green-50 rounded-lg border border-green-200">
                                <label class="block text-xs font-bold text-green-800 mb-3 uppercase italic">3. Tercero Afectado</label>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="dt_nombre_tercero" class="text-sm font-medium text-gray-700">Nombre</label>
                                        <input type="text" id="dt_nombre_tercero" required class="w-full border p-2 rounded mt-1">
                                    </div>
                                    <div>
                                        <label for="dt_telefono_tercero" class="text-sm font-medium text-gray-700">Teléfono</label>
                                        <input type="tel" id="dt_telefono_tercero" required class="w-full border p-2 rounded mt-1">
                                    </div>
                                </div>
                            </div>

                            <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <label class="block text-xs font-bold text-yellow-800 mb-3 uppercase italic">4. Detalles del Accidente</label>
                                <div class="space-y-4">
                                    <div>
                                        <label for="dt_domicilio_accidente" class="text-sm font-medium text-gray-700">Domicilio del Accidente</label>
                                        <textarea id="dt_domicilio_accidente" rows="2" required class="w-full border p-2 rounded mt-1"></textarea>
                                    </div>
                                    <div>
                                        <label for="dt_dano_causado" class="text-sm font-medium text-gray-700">Daño Causado</label>
                                        <textarea id="dt_dano_causado" rows="3" required class="w-full border p-2 rounded mt-1"></textarea>
                                    </div>
                                    <div>
                                        <label for="dt_acuerdo" class="text-sm font-medium text-gray-700">Acuerdo de Reparación</label>
                                        <textarea id="dt_acuerdo" rows="3" required class="w-full border p-2 rounded mt-1"></textarea>
                                    </div>
                                </div>
                            </div>

                            <div class="p-4 bg-red-50 rounded-lg border border-red-200">
                                <label class="block text-xs font-bold text-red-800 mb-3 uppercase italic">5. Evidencias y Firma</label>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="text-sm font-medium text-gray-700">Anexar Fotos del Accidente (Máx 5)</label>
                                        <input type="file" id="dt_fotos" multiple accept="image/*" class="hidden" onchange="DanosTercerosView.handlePhotoUpload(this)">
                                        <button type="button" onclick="document.getElementById('dt_fotos').click()" class="w-full mt-2 bg-white border-2 border-dashed p-4 rounded-lg text-gray-500 hover:bg-gray-50">
                                            <i class='bx bx-image-add text-2xl'></i>
                                            <div>Seleccionar Fotos</div>
                                        </button>
                                        <div id="dt_fotos_preview" class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2"></div>
                                    </div>
                                    <div>
                                        <label class="text-sm font-medium text-gray-700">Nombre y Firma (Supervisor)</label>
                                        <canvas id="dt_firma_canvas" class="w-full h-32 rounded bg-white border-2 border-dashed mt-2"></canvas>
                                        <button type="button" onclick="SignatureController.clearCanvas('dt_firma_canvas')" class="text-xs bg-gray-200 px-2 py-1 rounded mt-1">Limpiar</button>
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end gap-4 pt-4">
                                <button type="button" class="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg" onclick="App.goToStep('home')">Cancelar</button>
                                <button type="submit" class="bg-amber-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-amber-600" ${App.appState.isSubmitting ? 'disabled' : ''}>
                                    ${App.appState.isSubmitting ? 'Guardando...' : 'Generar y Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        this.state.fotos = [];
        this.renderPhotoPreview();
        SignatureController.initCanvas('dt_firma_canvas', App.appState, 'danosTercerosData.firmaSupervisor');
    },

    handlePhotoUpload(input) {
        const files = Array.from(input.files);
        const maxFotos = 5;
        const espacios = maxFotos - this.state.fotos.length;

        if (files.length > espacios) {
            alert(`Solo puedes subir ${espacios} foto(s) más.`);
            files.splice(espacios);
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.state.fotos.push({ id: Date.now() + Math.random(), data: e.target.result });
                this.renderPhotoPreview();
            };
            reader.readAsDataURL(file);
        });
        input.value = '';
    },

    removePhoto(id) {
        this.state.fotos = this.state.fotos.filter(foto => foto.id !== id);
        this.renderPhotoPreview();
    },

    renderPhotoPreview() {
        const previewContainer = document.getElementById('dt_fotos_preview');
        if (!previewContainer) return;
        previewContainer.innerHTML = this.state.fotos.map(foto => `
            <div class="relative">
                <img src="${foto.data}" class="w-full h-24 object-cover rounded-md">
                <button type="button" onclick="DanosTercerosView.removePhoto(${foto.id})" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
            </div>
        `).join('');
    }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.DanosTercerosView = DanosTercerosView;
}