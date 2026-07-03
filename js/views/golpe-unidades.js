// js/views/golpe-unidades.js - Vista para el formato de Golpe a Unidades

const GolpeUnidadesView = {
    render() {
        return `
            <div class="acta-hechos-view">
                <!-- Header -->
                <div class="header" style="background: #be123c; color: white;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button onclick="toggleMenu()" class="btn-icon" style="color: white;"><i class='bx bx-menu'></i></button>
                        <img src="img/Logo.png" onclick="toggleMenu()" alt="Logo" style="height: 35px; cursor: pointer; object-fit: contain;">
                        <div class="logo" style="color: white;">Bitácora de Golpe a Unidades</div>
                    </div>
                    <button onclick="App.goToStep('home')" class="btn-icon" style="color: white;" title="Volver al inicio"><i class='bx bx-home-alt'></i></button>
                </div>
                
                <div id="golpe-unidades-root" class="max-w-4xl mx-auto p-4 md:p-6">
                    <div class="bg-white p-6 rounded-xl shadow-lg border-t-8 border-rose-700">
                        <h1 class="text-xl sm:text-2xl font-bold text-gray-800 uppercase mb-6">Bitácora de Golpe a Unidades</h1>

                        <form id="golpeUnidadesForm" onsubmit="GolpeUnidadesController.handleSubmit(event)" class="space-y-6">

                            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <label class="block text-xs font-bold text-gray-600 mb-3 uppercase italic">Datos Generales</label>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div><label for="gu_supervisor" class="text-sm font-medium">Supervisor</label><input type="text" id="gu_supervisor" required class="w-full border p-2 rounded mt-1"></div>
                                    <div><label for="gu_telefono" class="text-sm font-medium">Teléfono</label><input type="tel" id="gu_telefono" required class="w-full border p-2 rounded mt-1"></div>
                                    <div><label for="gu_fecha" class="text-sm font-medium">Fecha</label><input type="date" id="gu_fecha" value="${new Date().toISOString().split('T')[0]}" required class="w-full border p-2 rounded mt-1"></div>
                                </div>
                            </div>

                            <div class="p-4 bg-sky-50 rounded-lg border border-sky-200">
                                <label class="block text-xs font-bold text-sky-800 mb-3 uppercase italic">1. Vehículo de Tercero</label>
                                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div><label for="gu_v1_marca" class="text-sm font-medium">Marca</label><input type="text" id="gu_v1_marca" class="w-full border p-2 rounded mt-1"></div>
                                    <div><label for="gu_v1_modelo" class="text-sm font-medium">Modelo</label><input type="text" id="gu_v1_modelo" class="w-full border p-2 rounded mt-1"></div>
                                    <div><label for="gu_v1_ano" class="text-sm font-medium">Año</label><input type="number" id="gu_v1_ano" class="w-full border p-2 rounded mt-1"></div>
                                    <div><label for="gu_v1_placas" class="text-sm font-medium">Placas</label><input type="text" id="gu_v1_placas" class="w-full border p-2 rounded mt-1"></div>
                                    <div class="col-span-2"><label for="gu_v1_propietario" class="text-sm font-medium">Propietario</label><input type="text" id="gu_v1_propietario" class="w-full border p-2 rounded mt-1"></div>
                                    <div><label for="gu_v1_cel" class="text-sm font-medium">Celular</label><input type="tel" id="gu_v1_cel" class="w-full border p-2 rounded mt-1"></div>
                                </div>
                            </div>

                            <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <label class="block text-xs font-bold text-blue-800 mb-3 uppercase italic">Datos del Chofer Gas Express Nieto</label>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label for="gu_chofer" class="text-sm font-medium">Chofer</label><input type="text" id="gu_chofer" required class="w-full border p-2 rounded mt-1"></div>
                                    <div><label for="gu_ayudante" class="text-sm font-medium">Ayudante</label><input type="text" id="gu_ayudante" class="w-full border p-2 rounded mt-1"></div>
                                    <div><label for="gu_economico" class="text-sm font-medium">Económico</label><input type="text" id="gu_economico" required class="w-full border p-2 rounded mt-1"></div>
                                    <div><label for="gu_ruta" class="text-sm font-medium">Ruta</label><input type="text" id="gu_ruta" required class="w-full border p-2 rounded mt-1"></div>
                                </div>
                                <div class="mt-4">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label for="gu_nombre_firma_chofer" class="text-sm font-medium">Nombre del Chofer (para firma)</label>
                                            <input type="text" id="gu_nombre_firma_chofer" required class="w-full border p-2 rounded mt-1" placeholder="Escribe el nombre completo del chofer">
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium">Firma del Chofer</label>
                                            <canvas id="gu_firma_chofer_canvas" class="w-full h-32 rounded bg-white border-2 border-dashed mt-2"></canvas>
                                            <button type="button" onclick="SignatureController.clearCanvas('gu_firma_chofer_canvas')" class="text-xs bg-gray-200 px-2 py-1 rounded mt-1">Limpiar Firma</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="p-4 bg-sky-50 rounded-lg border border-sky-200">
                                <label class="block text-xs font-bold text-gray-700 mb-3 uppercase italic">2. Vehículo Nuestro</label>
                                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div><label for="gu_v2_marca" class="text-sm font-medium">Marca</label><input type="text" id="gu_v2_marca" class="w-full border p-2 rounded mt-1"></div>
                                    <div><label for="gu_v2_modelo" class="text-sm font-medium">Modelo</label><input type="text" id="gu_v2_modelo" class="w-full border p-2 rounded mt-1"></div>
                                    <div><label for="gu_v2_ano" class="text-sm font-medium">Año</label><input type="number" id="gu_v2_ano" class="w-full border p-2 rounded mt-1"></div>
                                    <div><label for="gu_v2_placas" class="text-sm font-medium">Placas</label><input type="text" id="gu_v2_placas" class="w-full border p-2 rounded mt-1"></div>
                                    <div class="col-span-2"><label for="gu_v2_propietario" class="text-sm font-medium">Propietario</label><input type="text" id="gu_v2_propietario" class="w-full border p-2 rounded mt-1"></div>
                                    <div><label for="gu_v2_cel" class="text-sm font-medium">Celular</label><input type="tel" id="gu_v2_cel" class="w-full border p-2 rounded mt-1"></div>
                                </div>
                            </div>

                            <div class="p-4 bg-red-50 rounded-lg border border-red-200">
                                <label class="block text-xs font-bold text-red-800 mb-3 uppercase italic">3. Detalles del Accidente</label>
                                <div class="space-y-4">
                                    <div>
                                        <label for="gu_domicilio" class="text-sm font-medium">Domicilio del Accidente</label>
                                        <textarea id="gu_domicilio" rows="2" required class="w-full border p-2 rounded mt-1"></textarea>
                                    </div>
                                    <div>
                                        <label for="gu_danos_v1" class="text-sm font-medium">Daños a Vehículo de Tercero</label>
                                        <textarea id="gu_danos_v1" rows="2" class="w-full border p-2 rounded mt-1"></textarea>
                                    </div>
                                    <div>
                                        <label for="gu_danos_gen" class="text-sm font-medium">Daños a Vehículo Gas Express Nieto</label>
                                        <textarea id="gu_danos_gen" rows="2" required class="w-full border p-2 rounded mt-1"></textarea>
                                    </div>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label for="gu_infraccion" class="text-sm font-medium">Infracción</label><input type="text" id="gu_infraccion" class="w-full border p-2 rounded mt-1"></div>
                                        <div><label for="gu_garantia" class="text-sm font-medium">Garantía</label><input type="text" id="gu_garantia" class="w-full border p-2 rounded mt-1"></div>
                                    </div>
                                    <div>
                                        <label for="gu_observaciones" class="text-sm font-medium">Observaciones</label>
                                        <textarea id="gu_observaciones" rows="3" class="w-full border p-2 rounded mt-1"></textarea>
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end gap-4 pt-4">
                                <button type="button" class="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg" onclick="App.goToStep('home')">Cancelar</button>
                                <button type="submit" class="bg-rose-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-700" ${App.appState.isSubmitting ? 'disabled' : ''}>
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
        SignatureController.initCanvas('gu_firma_chofer_canvas', App.appState, 'golpeUnidadesData.firmaChofer');
    }
};

if (typeof window !== 'undefined') {
    window.GolpeUnidadesView = GolpeUnidadesView;
}