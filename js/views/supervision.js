// supervision.js - Vistas para el módulo de Supervisión en Campo

const SupervisionView = {
    SUPERVISORES: [
        'SABIDO QUINTERO ILSSE MARIANA',
        'MOLINA AGUILAR JULIO ALFREDO',
        'BALTAZAR DEMETRIO CARLOS',
        'TREJO CHAVEZ JOSE GUADALUPE',
        'SANCHEZ ROMERO ROBERTO',
        'MARTINEZ CABRERA ARTURO',
        'LOPEZ SORIA JOSE ALBERTO',
        "FONSECA CHAVEZ JOSE DE JESUS"

    ],

    renderSupervisorOptions(selectedSupervisor = '') {
        return this.SUPERVISORES.map(supervisor => `
            <option value="${supervisor}" ${selectedSupervisor === supervisor ? 'selected' : ''}>
                ${supervisor}
            </option>
        `).join('');
    },

    renderEscalaVendedorOptions(selectedScore = '') {
        return Array.from({ length: 10 }, (_, index) => {
            const score = String(index + 1);
            const label = score === '1' ? '1 - Deficiente' : score === '10' ? '10 - Excelente' : score;
            return `<option value="${score}" ${selectedScore === score ? 'selected' : ''}>${label}</option>`;
        }).join('');
    },

    renderEncuestaPregunta(field, label, data, required = false) {
        return `
            <div class="form-group">
                <label>${label}</label>
                <select id="${field}"
                        onchange="SupervisionController.updateFormData('${field}', this.value, App.appState)"
                        ${required ? 'required' : ''}>
                    <option value="" ${data[field] ? '' : 'selected'} disabled>Selecciona una calificación</option>
                    ${this.renderEscalaVendedorOptions(data[field] || '')}
                </select>
            </div>
        `;
    },

    renderSiNoOptions(selectedValue = '') {
        return ['Sí', 'No'].map(value => `
            <option value="${value}" ${selectedValue === value ? 'selected' : ''}>${value}</option>
        `).join('');
    },

    renderRevisionOperadorPregunta(field, label, data, required = false) {
        return `
            <div class="form-group">
                <label>${label}</label>
                <select id="${field}"
                        onchange="SupervisionController.updateFormData('${field}', this.value, App.appState)"
                        ${required ? 'required' : ''}>
                    <option value="" ${data[field] ? '' : 'selected'} disabled>Selecciona Sí o No</option>
                    ${this.renderSiNoOptions(data[field] || '')}
                </select>
            </div>
        `;
    },

    isSupervisionDomicilio(tipoVisita = '') {
        return this.formatTipoVisita(tipoVisita) === 'Supervisión en Domicilio';
    },

    isSupervisionRuta(tipoVisita = '') {
        return this.formatTipoVisita(tipoVisita) === 'Supervisión en Ruta';
    },

    formatTipoVisita(tipoVisita = '') {
        const value = (tipoVisita || '').trim();
        if (!value) return 'Atención a Queja';
        return value === 'Supervisión de Ruta' ? 'Supervisión en Domicilio' : value;
    },

    // Vista del formulario de supervisión
    renderForm(appState) {
        const data = appState.supervisionData;
        data.tipoVisita = this.formatTipoVisita(data.tipoVisita);
        const esAtencionQueja = data.tipoVisita === 'Atención a Queja';
        const esSupervisionDomicilio = this.isSupervisionDomicilio(data.tipoVisita);
        const esSupervisionRuta = this.isSupervisionRuta(data.tipoVisita);
        const esSupervisionCampo = esSupervisionDomicilio || esSupervisionRuta;
        if (!data.servicioCalleRecibido) {
            data.servicioCalleRecibido = 'No';
        }
        const mostrarDatosPedidos = esSupervisionDomicilio && data.servicioCalleRecibido === 'Sí';
        const tituloDatosPersona = esSupervisionRuta ? 'Datos del Operador / Chofer' : 'Datos del Cliente';
        const etiquetaPedido = esSupervisionRuta ? 'Económico de Unidad' : 'Número de Pedido';
        const etiquetaNombrePersona = esSupervisionRuta ? 'Nombre del Operador / Chofer' : 'Nombre del Cliente';
        const etiquetaTelefonoPersona = esSupervisionRuta ? 'Teléfono del Operador' : 'Teléfono del Cliente';
        const placeholderPedido = esSupervisionRuta ? 'Ej: QI-1235' : 'Ej: 12345';
        const placeholderNombrePersona = esSupervisionRuta ? 'Nombre del operador o chofer' : 'Nombre completo';
        
        // Actualizar fecha y hora si no existen
        const now = new Date();
        if (!data.fecha) {
            data.fecha = now.toISOString().split('T')[0];
        }
        if (!data.hora) {
            data.hora = now.toLocaleTimeString('es-MX', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        }

        return `
            <div>
                <div class="header" style="background: #1e40af; border-bottom: none; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button onclick="toggleMenu()" class="btn-icon" style="color: white; font-size: 26px;">
                            <i class='bx bx-menu'></i>
                        </button>
                        <img src="${CONFIG.LOGO_URL}" onclick="toggleMenu()" alt="Logo" style="height: 35px; cursor: pointer; object-fit: contain;">
                        <div class="logo" style="font-weight: 600; font-size: 16px; color: white;">Supervisión en Campo</div>
                    </div>
                    <button onclick="App.goToStep('home')" class="btn-icon" title="Volver al inicio" style="color: white;">
                        <i class='bx bx-home-alt'></i>
                    </button>
                </div>
                
                <div class="container">
                    <form id="supervisionForm" onsubmit="SupervisionController.handleSubmit(event, App.appState)">
                        <!-- Datos del Supervisor -->
                        <div class="card">
                            <h3 style="margin-bottom: 16px; color: #1e293b;">👤 Datos del Supervisor</h3>
                            
                            <div class="form-group">
                                <label>Nombre del Supervisor</label>
                                <select id="nombreSupervisor"
                                        onchange="SupervisionController.updateFormData('nombreSupervisor', this.value, App.appState)"
                                        required>
                                    <option value="" ${data.nombreSupervisor ? '' : 'selected'} disabled>Selecciona un supervisor</option>
                                    ${this.renderSupervisorOptions(data.nombreSupervisor || '')}
                                </select>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="form-group">
                                    <label>Fecha</label>
                                    <input type="date" 
                                           id="fechaSupervision"
                                           value="${data.fecha}"
                                           onchange="SupervisionController.updateFormData('fecha', this.value, App.appState)"
                                           style="background: #f8fafc; font-weight: bold;">
                                    <p style="font-size: 10px; color: #64748b; margin-top: 2px;">Puedes modificar si es necesario</p>
                                </div>
                                <div class="form-group">
                                    <label>Hora</label>
                                    <input type="time" 
                                           id="horaSupervision"
                                           value="${data.hora}"
                                           onchange="SupervisionController.updateFormData('hora', this.value, App.appState)"
                                           style="background: #f8fafc; font-weight: bold;">
                                    <p style="font-size: 10px; color: #64748b; margin-top: 2px;">Puedes modificar si es necesario</p>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="form-group">
                                    <label>Ruta</label>
                                    <input type="text"
                                           id="rutaSupervision"
                                           value="${data.ruta || ''}"
                                           oninput="SupervisionController.updateFormData('ruta', this.value, App.appState)"
                                           placeholder="Ej: C002">
                                </div>
                                <div class="form-group">
                                    <label>Tipo de Visita</label>
                                    <select id="tipoVisita"
                                            onchange="SupervisionController.handleTipoVisitaChange(this.value, App.appState)"
                                            required>
                                        <option value="Atención a Queja" ${data.tipoVisita === 'Atención a Queja' ? 'selected' : ''}>Atención a Queja</option>
                                        <option value="Supervisión en Domicilio" ${esSupervisionDomicilio ? 'selected' : ''}>Supervisión en Domicilio</option>
                                        <option value="Supervisión en Ruta" ${esSupervisionRuta ? 'selected' : ''}>Supervisión en Ruta</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Datos del Cliente / Operador -->
                        <div class="card">
                            <h3 id="datosPersonaTitle" style="margin-bottom: 16px; color: #1e293b;">👤 ${tituloDatosPersona}</h3>
                            
                            <div class="form-group">
                                <label id="numeroPedidoLabel">${etiquetaPedido}</label>
                                <input type="text" 
                                       id="numeroPedido"
                                       value="${data.numeroPedido || ''}"
                                       oninput="SupervisionController.updateFormData('numeroPedido', this.value, App.appState)"
                                       placeholder="${placeholderPedido}"
                                       ${esSupervisionRuta ? '' : 'required'}>
                            </div>

                            <div class="form-group">
                                <label id="telefonoClienteLabel">${etiquetaTelefonoPersona}</label>
                                <input type="tel" 
                                       id="telefonoCliente"
                                       value="${data.telefonoCliente || ''}"
                                       oninput="SupervisionController.updateFormData('telefonoCliente', this.value, App.appState)"
                                       placeholder="Ej: 4421234567"
                                       required>
                            </div>

                            <div class="form-group">
                                <label id="nombreClienteLabel">${etiquetaNombrePersona}</label>
                                <input type="text" 
                                       id="nombreCliente"
                                       value="${data.nombreCliente || ''}"
                                       oninput="SupervisionController.updateFormData('nombreCliente', this.value, App.appState)"
                                       placeholder="${placeholderNombrePersona}"
                                       required>
                            </div>

                            <div class="form-group">
                                <label>Calle</label>
                                <input type="text" 
                                       id="calle"
                                       value="${data.calle || ''}"
                                       oninput="SupervisionController.updateFormData('calle', this.value, App.appState)"
                                       placeholder="Calle de la dirección"
                                       required>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px;">
                                <div class="form-group">
                                    <label>Número</label>
                                    <input type="text" 
                                           id="numero"
                                           value="${data.numero || ''}"
                                           oninput="SupervisionController.updateFormData('numero', this.value, App.appState)"
                                           placeholder="123"
                                           required>
                                </div>
                                <div class="form-group">
                                    <label>Colonia</label>
                                    <input type="text" 
                                           id="colonia"
                                           value="${data.colonia || ''}"
                                           oninput="SupervisionController.updateFormData('colonia', this.value, App.appState)"
                                           placeholder="Colonia"
                                           required>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>📍 Ubicación (automática o manual)</label>
                                <textarea id="ubicacion"
                                          oninput="SupervisionController.updateFormData('ubicacion', this.value, App.appState)"
                                          placeholder="Esperando ubicación automática..."
                                          rows="2"
                                          required>${data.ubicacion || ''}</textarea>
                                <p style="font-size: 10px; color: #64748b; margin-top: 2px;">
                                    La ubicación se detecta automáticamente al entrar
                                </p>
                            </div>
                            
                            <!-- Botones de ubicación -->
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button type="button" 
                                        onclick="SupervisionController.obtenerUbicacionActual()"
                                        style="flex: 1; padding: 8px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 12px;">
                                    📍 Refrescar ubicación
                                </button>
                            </div>
                        </div>

                        <!-- Detalles de la Visita -->
                        <div class="card" id="detallesQuejaCard" style="${esAtencionQueja ? '' : 'display: none;'}">
                            <h3 style="margin-bottom: 16px; color: #1e293b;">📝 Detalles de la Visita</h3>
                      
                            <div class="form-group">
                                <label>Motivo de la Queja del Cliente</label>
                                <textarea id="motivoQueja"
                                          oninput="SupervisionController.updateFormData('motivoQueja', this.value, App.appState)"
                                          placeholder="¿Cuál fue el motivo de la queja?"
                                          rows="3"
                                          ${esAtencionQueja ? 'required' : ''}>${data.motivoQueja || ''}</textarea>
                            </div>

                            <div class="form-group">
                                <label>Solución brindada al Cliente</label>
                                <textarea id="solucion"
                                          oninput="SupervisionController.updateFormData('solucion', this.value, App.appState)"
                                          placeholder="¿Qué solución se le dio al cliente?"
                                          rows="3"
                                          ${esAtencionQueja ? 'required' : ''}>${data.solucion || ''}</textarea>
                            </div>
                        </div>

                        <!-- Detalles de Supervisión en Domicilio / Ruta -->
                        <div class="card" id="detallesRutaCard" style="${esSupervisionCampo ? '' : 'display: none;'}">
                            <h3 id="detallesRutaTitle" style="margin-bottom: 16px; color: #1e293b;">${esSupervisionRuta ? 'Supervisión en Ruta' : 'Supervisión en Domicilio'}</h3>

                            <div class="form-group">
                                <label>Comentarios de lo encontrado en sitio</label>
                                <textarea id="comentario"
                                          oninput="SupervisionController.updateFormData('comentario', this.value, App.appState)"
                                          placeholder="Describe qué encontró el supervisor en sitio, condiciones del servicio, atención y observaciones."
                                          rows="4"
                                          ${esSupervisionCampo ? 'required' : ''}>${data.comentario || ''}</textarea>
                            </div>

                            <div class="form-group" id="servicioCalleBlock" style="${esSupervisionDomicilio ? '' : 'display: none;'}">
                                <label>¿El servicio es de calle?</label>
                                <select id="servicioCalleRecibido"
                                        onchange="SupervisionController.handleServicioCalleChange(this.value, App.appState)">
                                    <option value="No" ${data.servicioCalleRecibido !== 'Sí' ? 'selected' : ''}>No</option>
                                    <option value="Sí" ${data.servicioCalleRecibido === 'Sí' ? 'selected' : ''}>Sí</option>
                                </select>
                            </div>

                            <div id="datosPedidosCliente" style="${mostrarDatosPedidos ? '' : 'display: none;'}">
                                <div style="padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px;">
                                    <div style="font-weight: 600; color: #1e293b; font-size: 13px; margin-bottom: 10px;">Datos para registrar cliente</div>

                                    <div class="form-group">
                                        <label>Nombre para pedidos</label>
                                        <input type="text"
                                               id="datosPedidosNombre"
                                               value="${data.datosPedidosNombre || ''}"
                                               oninput="SupervisionController.updateFormData('datosPedidosNombre', this.value, App.appState)"
                                               placeholder="Nombre completo del cliente"
                                               ${mostrarDatosPedidos ? 'required' : ''}>
                                    </div>

                                    <div class="form-group">
                                        <label>Teléfono para pedidos</label>
                                        <input type="tel"
                                               id="datosPedidosTelefono"
                                               value="${data.datosPedidosTelefono || ''}"
                                               oninput="SupervisionController.updateFormData('datosPedidosTelefono', this.value, App.appState)"
                                               placeholder="Ej: 4421234567"
                                               ${mostrarDatosPedidos ? 'required' : ''}>
                                    </div>

                                    <div class="form-group">
                                        <label>Dirección / referencias para pedidos</label>
                                        <textarea id="datosPedidosDireccion"
                                                  oninput="SupervisionController.updateFormData('datosPedidosDireccion', this.value, App.appState)"
                                                  placeholder="Dirección completa, referencias y datos útiles para levantar pedidos."
                                                  rows="3"
                                                  ${mostrarDatosPedidos ? 'required' : ''}>${data.datosPedidosDireccion || ''}</textarea>
                                    </div>
                                </div>
                            </div>

                            <div id="encuestaClienteCard" style="${esSupervisionDomicilio ? '' : 'display: none;'} padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <div style="font-weight: 600; color: #1e293b; font-size: 13px; margin-bottom: 10px;">Encuesta al cliente</div>
                                <p style="font-size: 10px; color: #64748b; margin: 0 0 10px;">1 = Deficiente · 10 = Excelente</p>

                                ${this.renderEncuestaPregunta('encuestaTratoVendedor', '¿Cómo fue el trato del vendedor?', data, esSupervisionDomicilio)}
                                ${this.renderEncuestaPregunta('encuestaClaridadVendedor', '¿El vendedor explicó claramente la información del servicio?', data, esSupervisionDomicilio)}
                                ${this.renderEncuestaPregunta('encuestaTiempoServicio', '¿Cómo califica el tiempo de atención del servicio?', data, esSupervisionDomicilio)}
                                ${this.renderEncuestaPregunta('encuestaPresentacionVendedor', '¿Cómo fue la presentación e identificación del vendedor?', data, esSupervisionDomicilio)}
                                ${this.renderEncuestaPregunta('encuestaSatisfaccionCliente', '¿Qué tan satisfecho quedó con el servicio recibido?', data, esSupervisionDomicilio)}
                            </div>

                            <div id="revisionOperadorCard" style="${esSupervisionRuta ? '' : 'display: none;'} padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <div style="font-weight: 600; color: #1e293b; font-size: 13px; margin-bottom: 10px;">Revisión del supervisor al operador</div>
                                <p style="font-size: 10px; color: #64748b; margin: 0 0 10px;">Marca Sí o No según lo observado en sitio.</p>

                                ${this.renderRevisionOperadorPregunta('revisionEquipoSeguridad', '¿Cuenta con equipo de seguridad completo?', data, esSupervisionRuta)}
                                ${this.renderRevisionOperadorPregunta('revisionPresentacionIdentificacion', '¿Tiene buena presentación e identificación visible?', data, esSupervisionRuta)}
                                ${this.renderRevisionOperadorPregunta('revisionUnidadCondiciones', '¿La unidad está limpia y en condiciones adecuadas?', data, esSupervisionRuta)}
                                ${this.renderRevisionOperadorPregunta('revisionDocumentacionServicio', '¿Trae documentación, notas o datos del servicio en orden?', data, esSupervisionRuta)}
                                ${this.renderRevisionOperadorPregunta('revisionManejoSeguro', '¿Realiza la atención y maniobras de forma segura?', data, esSupervisionRuta)}
                                ${this.renderRevisionOperadorPregunta('revisionCajaSeguridad', '¿Tiene caja de seguridad?', data, esSupervisionRuta)}
                            </div>
                        </div>
                        
                        <!-- Evidencia Fotográfica (Múltiples fotos) -->
                        <div class="card">
                            <h3 style="margin-bottom: 16px; color: #1e293b;">📸 Evidencia Fotográfica (Máximo 5)</h3>
                            
                            <div class="form-group">
                                <input type="file" 
                                       id="supervisionFotoCamara" 
                                       accept="image/*" 
                                       capture="environment"
                                       style="display: none;"
                                       onchange="SupervisionController.handlePhotoUpload(this, App.appState)">

                                <input type="file" 
                                       id="supervisionFotoGaleria" 
                                       accept="image/*" 
                                       multiple
                                       style="display: none;"
                                       onchange="SupervisionController.handlePhotoUpload(this, App.appState)">
                                
                                <button type="button" 
                                        onclick="document.getElementById('supervisionFotoCamara').click()"
                                        style="width: 100%; padding: 12px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; font-size: 14px; color: #64748b; margin-bottom: 10px;">
                                    <i class='bx bx-camera'></i> Tomar foto
                                </button>

                                <button type="button" 
                                        onclick="document.getElementById('supervisionFotoGaleria').click()"
                                        style="width: 100%; padding: 12px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; font-size: 14px; color: #64748b; margin-bottom: 10px;">
                                    <i class='bx bx-image-add'></i> Seleccionar de galeria
                                </button>
                                
                                <!-- Grid de fotos seleccionadas -->
                                <div id="supervisionFotosPreview" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-top: 10px;">
                                    ${appState.supervisionData.evidenciasFotos ? appState.supervisionData.evidenciasFotos.map((foto, index) => `
                                        <div style="position: relative; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; aspect-ratio: 1/1;">
                                            <img src="${foto.data}" style="width: 100%; height: 100%; object-fit: cover;">
                                            <button type="button"
                                                    onclick="SupervisionController.removeSpecificPhoto(App.appState, ${foto.id})"
                                                    style="position: absolute; top: 5px; right: 5px; background: #dc2626; color: white; border: none; width: 24px; height: 24px; border-radius: 12px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                                ✕
                                            </button>
                                            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: white; padding: 2px; font-size: 9px; text-align: center;">
                                                Foto ${index + 1}
                                            </div>
                                        </div>
                                    `).join('') : ''}
                                </div>
                                
                                <!-- Contador y botón para eliminar todas -->
                                <div id="supervisionFotosCounter">
                                    ${appState.supervisionData.evidenciasFotos?.length > 0 ? `
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding: 8px; background: #f8fafc; border-radius: 6px;">
                                        <span style="font-size: 12px; color: #64748b;">
                                            📸 ${appState.supervisionData.evidenciasFotos.length} de 5 fotos
                                        </span>
                                        <button type="button"
                                                onclick="SupervisionController.removePhoto(App.appState)"
                                                style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                                            Eliminar todas
                                        </button>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Firma del Supervisor -->
                        <div class="card">
                            <h3 style="margin-bottom: 16px; color: #1e293b;">✍️ Firma del Supervisor</h3>
                            
                            <div class="signature-container" style="height: 150px;">
                                <canvas id="supervisionSigCanvas"></canvas>
                            </div>
                            
                            <div style="text-align: center; margin: 10px 0;">
                                <button type="button" 
                                        onclick="SignatureController.clearSupervisionSignature(App.appState)"
                                        style="padding: 8px 16px; background: #64748b; color: white; border: none; border-radius: 6px; font-size: 12px;">
                                    Limpiar Firma
                                </button>
                            </div>
                            
                            <p style="text-align: center; font-size: 11px; color: #64748b;">
                                Firma para validar el reporte de supervisión
                            </p>
                        </div>

                        <!-- Botón de envío -->
                        <div style="padding: 20px;">
                            <button type="submit" 
                                    class="btn" 
                                    style="background: #0867ec; color: white; font-size: 18px;"
                                    ${appState.isSubmitting ? 'disabled' : ''}>
                                ${appState.isSubmitting ? 'Enviando...' : '✅ Guardar Reporte de Supervisión'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
};

// Exportar vista
if (typeof window !== 'undefined') {
    window.SupervisionView = SupervisionView;
}
