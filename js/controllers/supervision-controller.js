// supervision-controller.js - Controlador para el módulo de Supervisión en Campo

const SupervisionController = {
    // Clave de acceso para supervisión
    SUPERVISION_KEY: "nieto2025",

    ENCUESTA_DOMICILIO_FIELDS: [
        'encuestaTratoVendedor',
        'encuestaClaridadVendedor',
        'encuestaTiempoServicio',
        'encuestaPresentacionVendedor',
        'encuestaSatisfaccionCliente'
    ],

    REVISION_OPERADOR_FIELDS: [
        'revisionEquipoSeguridad',
        'revisionPresentacionIdentificacion',
        'revisionUnidadCondiciones',
        'revisionDocumentacionServicio',
        'revisionManejoSeguro',
        'revisionCajaSeguridad'
    ],

    TIPO_SUPERVISION_DOMICILIO: 'Supervisión en Domicilio',
    TIPO_SUPERVISION_RUTA: 'Supervisión en Ruta',
    TIPO_SUPERVISION_RUTA_ANTERIOR: 'Supervisión de Ruta',

    isSupervisionDomicilio(tipoVisita = '') {
        return this.formatTipoVisita(tipoVisita) === this.TIPO_SUPERVISION_DOMICILIO;
    },

    isSupervisionRuta(tipoVisita = '') {
        return this.formatTipoVisita(tipoVisita) === this.TIPO_SUPERVISION_RUTA;
    },

    isSupervisionCampo(tipoVisita = '') {
        return this.isSupervisionDomicilio(tipoVisita) || this.isSupervisionRuta(tipoVisita);
    },

    formatTipoVisita(tipoVisita = '') {
        const value = (tipoVisita || '').trim();
        if (!value) return 'Atención a Queja';
        return value === this.TIPO_SUPERVISION_RUTA_ANTERIOR ? this.TIPO_SUPERVISION_RUTA : value;
    },
    
    // Variable para almacenar las coordenadas actuales
    currentLocation: {
        lat: null,
        lng: null,
        address: ''
    },

    // Verificar contraseña
    checkPassword() {
        const password = document.getElementById('supervisionPassword').value;
        
        if (password === this.SUPERVISION_KEY) {
            // Obtener ubicación automáticamente al entrar
            this.obtenerUbicacionActual();
            App.goToStep('supervision-form');
        } else {
            alert("❌ Clave incorrecta. La clave es: " + this.SUPERVISION_KEY);
        }
    },

    // Obtener ubicación actual del dispositivo
    obtenerUbicacionActual() {
        if (navigator.geolocation) {
            // Mostrar indicador de carga
            const ubicacionField = document.getElementById('ubicacion');
            if (ubicacionField) {
                ubicacionField.placeholder = "Obteniendo ubicación...";
                ubicacionField.value = "Obteniendo dirección...";
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation.lat = position.coords.latitude;
                    this.currentLocation.lng = position.coords.longitude;
                    
                    // Mostrar coordenadas mientras se obtiene la dirección
                    const ubicacionField = document.getElementById('ubicacion');
                    if (ubicacionField) {
                        ubicacionField.value = `Coordenadas: ${this.currentLocation.lat}, ${this.currentLocation.lng} (obteniendo dirección...)`;
                    }
                    
                    // Obtener dirección a partir de coordenadas
                    this.obtenerDireccionDesdeCoordenadas(
                        this.currentLocation.lat, 
                        this.currentLocation.lng
                    );
                    
                    console.log('Ubicación obtenida:', this.currentLocation);
                },
                (error) => {
                    console.warn('Error obteniendo ubicación:', error);
                    let mensaje = '';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            mensaje = 'Permiso denegado. Activa la ubicación en tu dispositivo.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            mensaje = 'Ubicación no disponible. Verifica tu conexión GPS.';
                            break;
                        case error.TIMEOUT:
                            mensaje = 'Tiempo de espera agotado. Intenta de nuevo.';
                            break;
                    }
                    
                    const ubicacionField = document.getElementById('ubicacion');
                    if (ubicacionField) {
                        ubicacionField.placeholder = mensaje + ' Puedes escribir la dirección manualmente.';
                    }
                    
                    alert('📍 ' + mensaje);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            alert('Tu navegador no soporta geolocalización. Deberás ingresar la ubicación manualmente.');
        }
    },

    // Geocodificación inversa (coordenadas -> dirección) - CORREGIDO
    async obtenerDireccionDesdeCoordenadas(lat, lng) {
        try {
            // Usando Nominatim (OpenStreetMap) - gratuito
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'GenChecklist-App'
                    }
                }
            );
            
            if (!response.ok) throw new Error('Error en geocodificación');
            
            const data = await response.json();
            
            // Extraer dirección formateada
            const direccion = data.display_name || '';
            this.currentLocation.address = direccion;
            
            // Actualizar campo de ubicación
            const ubicacionField = document.getElementById('ubicacion');
            if (ubicacionField) {
                ubicacionField.value = direccion;
                // Actualizar el appState
                App.appState.supervisionData.ubicacion = direccion;
            }
            
            // También actualizar campos de calle, número y colonia si es posible
            if (data.address) {
                // Buscar calle (road, pedestrian, etc.)
                const calle = data.address.road || 
                             data.address.street || 
                             data.address.pedestrian || 
                             data.address.footway || '';
                
                // Buscar número
                const numero = data.address.house_number || '';
                
                // Buscar colonia (suburb, neighbourhood, etc.)
                const colonia = data.address.suburb || 
                               data.address.neighbourhood || 
                               data.address.city_district || 
                               data.address.district || '';
                
                // Actualizar campo calle
                if (calle) {
                    const calleField = document.getElementById('calle');
                    if (calleField) {
                        calleField.value = calle;
                        App.appState.supervisionData.calle = calle;
                    }
                }
                
                // Actualizar campo número
                if (numero) {
                    const numeroField = document.getElementById('numero');
                    if (numeroField) {
                        numeroField.value = numero;
                        App.appState.supervisionData.numero = numero;
                    }
                }
                
                // Actualizar campo colonia
                if (colonia) {
                    const coloniaField = document.getElementById('colonia');
                    if (coloniaField) {
                        coloniaField.value = colonia;
                        App.appState.supervisionData.colonia = colonia;
                    }
                }
            }
            
            console.log('Dirección obtenida:', direccion);
            
        } catch (error) {
            console.error('Error en geocodificación:', error);
            // Si falla, mostrar coordenadas
            const ubicacionField = document.getElementById('ubicacion');
            if (ubicacionField) {
                const coordsText = `Coordenadas: ${lat}, ${lng}`;
                ubicacionField.value = coordsText;
                App.appState.supervisionData.ubicacion = coordsText;
            }
        }
    },

    // Actualizar datos del formulario
    updateFormData(field, value, appState) {
        appState.supervisionData[field] = value;
    },

    handleTipoVisitaChange(value, appState) {
        // No es necesario formatear aquí, se formatea al validar/guardar.
        this.updateFormData('tipoVisita', value, appState);

        const esAtencionQueja = value === 'Atención a Queja';
        const esSupervisionDomicilio = this.isSupervisionDomicilio(value);
        const esSupervisionRuta = this.isSupervisionRuta(value);
        const esSupervisionCampo = esSupervisionDomicilio || esSupervisionRuta;
        const tipoVisitaField = document.getElementById('tipoVisita');
        if (tipoVisitaField && tipoVisitaField.value !== value) {
            tipoVisitaField.value = value;
        }

        const detallesQuejaCard = document.getElementById('detallesQuejaCard');
        if (detallesQuejaCard) {
            detallesQuejaCard.style.display = esAtencionQueja ? '' : 'none';
        }
        const detallesRutaCard = document.getElementById('detallesRutaCard');
        if (detallesRutaCard) {
            detallesRutaCard.style.display = esSupervisionCampo ? '' : 'none';
        }

        const detallesRutaTitle = document.getElementById('detallesRutaTitle');
        if (detallesRutaTitle) {
            detallesRutaTitle.textContent = esSupervisionRuta ? 'Supervisión en Ruta' : 'Supervisión en Domicilio';
        }

        const datosPersonaTitle = document.getElementById('datosPersonaTitle');
        if (datosPersonaTitle) {
            datosPersonaTitle.textContent = esSupervisionRuta ? '👤 Datos del Operador / Chofer' : '👤 Datos del Cliente';
        }

        const numeroPedidoLabel = document.getElementById('numeroPedidoLabel');
        if (numeroPedidoLabel) numeroPedidoLabel.textContent = esSupervisionRuta ? 'Económico de Unidad' : 'Número de Pedido';

        const numeroPedidoField = document.getElementById('numeroPedido');
        if (numeroPedidoField) {
            numeroPedidoField.required = !esSupervisionRuta;
            numeroPedidoField.placeholder = esSupervisionRuta ? 'Ej: QI-1235' : 'Ej: 12345';
        }

        const telefonoClienteLabel = document.getElementById('telefonoClienteLabel');
        if (telefonoClienteLabel) telefonoClienteLabel.textContent = esSupervisionRuta ? 'Teléfono del Operador' : 'Teléfono del Cliente';

        const nombreClienteLabel = document.getElementById('nombreClienteLabel');
        if (nombreClienteLabel) nombreClienteLabel.textContent = esSupervisionRuta ? 'Nombre del Operador / Chofer' : 'Nombre del Cliente';

        const nombreClienteField = document.getElementById('nombreCliente');
        if (nombreClienteField) {
            nombreClienteField.placeholder = esSupervisionRuta ? 'Nombre del operador o chofer' : 'Nombre completo';
        }

        ['motivoQueja', 'solucion'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field) return;
            field.required = esAtencionQueja;
            if (!esAtencionQueja) field.value = '';
        });

        if (!esAtencionQueja) {
            appState.supervisionData.motivoQueja = '';
            appState.supervisionData.solucion = '';
        }

        const comentarioField = document.getElementById('comentario');
        if (comentarioField) comentarioField.required = esSupervisionCampo;

        const servicioCalleBlock = document.getElementById('servicioCalleBlock');
        if (servicioCalleBlock) servicioCalleBlock.style.display = esSupervisionDomicilio ? '' : 'none';

        const encuestaClienteCard = document.getElementById('encuestaClienteCard');
        if (encuestaClienteCard) encuestaClienteCard.style.display = esSupervisionDomicilio ? '' : 'none';

        const revisionOperadorCard = document.getElementById('revisionOperadorCard');
        if (revisionOperadorCard) revisionOperadorCard.style.display = esSupervisionRuta ? '' : 'none';

        this.ENCUESTA_DOMICILIO_FIELDS.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.required = esSupervisionDomicilio;
        });

        this.REVISION_OPERADOR_FIELDS.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.required = esSupervisionRuta;
        });

        if (!esSupervisionDomicilio) {
            appState.supervisionData.servicioCalleRecibido = 'No';
            appState.supervisionData.datosPedidosNombre = '';
            appState.supervisionData.datosPedidosTelefono = '';
            appState.supervisionData.datosPedidosDireccion = '';
            this.handleServicioCalleChange('No', appState);
        }

        if (!esSupervisionCampo) {
            this.ENCUESTA_DOMICILIO_FIELDS.forEach(field => {
                appState.supervisionData[field] = '';
            });
            this.REVISION_OPERADOR_FIELDS.forEach(field => {
                appState.supervisionData[field] = '';
            });
        }
    },

    handleServicioCalleChange(value, appState) {
        this.updateFormData('servicioCalleRecibido', value, appState);

        const esSupervisionDomicilio = this.isSupervisionDomicilio(appState.supervisionData.tipoVisita || 'Atención a Queja');
        const mostrarDatosPedidos = esSupervisionDomicilio && value === 'Sí';
        const servicioCalleField = document.getElementById('servicioCalleRecibido');
        if (servicioCalleField && !esSupervisionDomicilio) {
            servicioCalleField.value = 'No';
        }
        const datosPedidosCliente = document.getElementById('datosPedidosCliente');
        if (datosPedidosCliente) {
            datosPedidosCliente.style.display = mostrarDatosPedidos ? '' : 'none';
        }

        ['datosPedidosNombre', 'datosPedidosTelefono', 'datosPedidosDireccion'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field) return;
            field.required = mostrarDatosPedidos;
            if (!mostrarDatosPedidos) field.value = '';
        });

        if (!mostrarDatosPedidos) {
            appState.supervisionData.datosPedidosNombre = '';
            appState.supervisionData.datosPedidosTelefono = '';
            appState.supervisionData.datosPedidosDireccion = '';
        }
    },

    renderPhotoPreview(appState) {
        const fotos = appState.supervisionData.evidenciasFotos || [];
        const preview = document.getElementById('supervisionFotosPreview');
        const counter = document.getElementById('supervisionFotosCounter');

        if (preview) {
            preview.innerHTML = fotos.map((foto, index) => `
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
            `).join('');
        }

        if (counter) {
            counter.innerHTML = fotos.length > 0 ? `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding: 8px; background: #f8fafc; border-radius: 6px;">
                    <span style="font-size: 12px; color: #64748b;">
                        📸 ${fotos.length} de 5 fotos
                    </span>
                    <button type="button"
                            onclick="SupervisionController.removePhoto(App.appState)"
                            style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                        Eliminar todas
                    </button>
                </div>
            ` : '';
        }
    },

    // Reduce la foto sin convertir primero el archivo original completo a Base64.
    // Así se evitan picos de memoria al regresar de la cámara en un celular.
    async compressSupervisionPhoto(file) {
        const maxSize = 1024;
        let imageSource = null;
        let objectUrl = null;

        try {
            if (typeof createImageBitmap === 'function') {
                imageSource = await createImageBitmap(file, {
                    resizeWidth: maxSize,
                    resizeQuality: 'high',
                    imageOrientation: 'from-image'
                });
            } else {
                objectUrl = URL.createObjectURL(file);
                imageSource = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
                    img.src = objectUrl;
                });
            }

            const sourceWidth = imageSource.naturalWidth || imageSource.width;
            const sourceHeight = imageSource.naturalHeight || imageSource.height;
            if (!sourceWidth || !sourceHeight) {
                throw new Error('La imagen no tiene dimensiones válidas.');
            }

            const scale = Math.min(maxSize / sourceWidth, maxSize / sourceHeight, 1);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(sourceWidth * scale));
            canvas.height = Math.max(1, Math.round(sourceHeight * scale));

            const ctx = canvas.getContext('2d', { alpha: false });
            if (!ctx) throw new Error('El dispositivo no pudo procesar la imagen.');
            ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);

            const compressedBlob = await new Promise((resolve, reject) => {
                canvas.toBlob(
                    blob => blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen.')),
                    'image/jpeg',
                    0.72
                );
            });

            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('No se pudo preparar la imagen.'));
                reader.readAsDataURL(compressedBlob);
            });
        } finally {
            if (imageSource && typeof imageSource.close === 'function') imageSource.close();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        }
    },

    // Manejar carga de fotos (MÚLTIPLES)
    async handlePhotoUpload(input, appState) {
        const files = Array.from(input.files);
        if (files.length === 0) return;
        
        if (!appState.supervisionData.evidenciasFotos) {
            appState.supervisionData.evidenciasFotos = [];
        }

        const espaciosDisponibles = 5 - appState.supervisionData.evidenciasFotos.length;
        if (espaciosDisponibles <= 0) {
            alert('Solo puedes adjuntar máximo 5 fotos.');
            input.value = '';
            return;
        }

        const filesToProcess = files.slice(0, espaciosDisponibles);
        if (files.length > espaciosDisponibles) {
            alert(`Solo se agregarán ${espaciosDisponibles} foto(s). El máximo es 5.`);
        }
        
        input.disabled = true;

        try {
            // Una foto por vez: no mantiene varias capturas grandes decodificadas.
            for (let index = 0; index < filesToProcess.length; index++) {
                const file = filesToProcess[index];
                if (!file.type.startsWith('image/')) {
                    throw new Error(`El archivo ${file.name} no es una imagen compatible.`);
                }

                const compressedData = await this.compressSupervisionPhoto(file);
                appState.supervisionData.evidenciasFotos.push({
                    id: Date.now() + index + Math.floor(Math.random() * 1000),
                    data: compressedData,
                    name: file.name
                });
                this.renderPhotoPreview(appState);

                // Permite pintar la vista y liberar recursos entre imágenes.
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        } catch (error) {
            console.error('Error procesando evidencia fotográfica:', error);
            alert(`No fue posible procesar la foto. ${error.message || 'Intenta de nuevo o selecciona una foto de la galería.'}`);
        } finally {
            input.value = '';
            input.disabled = false;
        }
    },

    // Eliminar foto específica
    removeSpecificPhoto(appState, photoId) {
        if (appState.supervisionData.evidenciasFotos) {
            appState.supervisionData.evidenciasFotos = 
                appState.supervisionData.evidenciasFotos.filter(p => p.id !== photoId);
            this.renderPhotoPreview(appState);
        }
    },

    // Eliminar todas las fotos
    removePhoto(appState) {
        appState.supervisionData.evidenciasFotos = [];
        this.renderPhotoPreview(appState);
    },

    // Abrir en Google Maps con ubicación actual - CORREGIDO
    abrirEnMaps() {
        const data = App.appState.supervisionData;
        let query = '';
        
        // Usar coordenadas si están disponibles
        if (this.currentLocation.lat && this.currentLocation.lng) {
            query = `${this.currentLocation.lat},${this.currentLocation.lng}`;
        } 
        // Si no, usar la dirección completa
        else if (data.ubicacion && data.ubicacion !== 'Obteniendo dirección...') {
            query = encodeURIComponent(data.ubicacion);
        } 
        // Por último, construir con calle, número y colonia
        else {
            const calle = data.calle || '';
            const numero = data.numero || '';
            const colonia = data.colonia || '';
            
            if (calle || colonia) {
                const direccionCompleta = `${calle} ${numero}, ${colonia}, Queretaro`.trim();
                query = encodeURIComponent(direccionCompleta);
            } else {
                query = encodeURIComponent('Queretaro');
            }
        }
        
        if (query) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
        } else {
            alert('No hay ubicación disponible');
        }
    },

    // Validar formulario
    validateForm(data) {
        data.tipoVisita = this.formatTipoVisita(data.tipoVisita);
        const tipoVisita = data.tipoVisita;
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
        
        if (!data.nombreSupervisor?.trim()) {
            alert('❌ El nombre del supervisor es obligatorio');
            return false;
        }

        if (!tipoVisita?.trim()) {
            alert('❌ El tipo de visita es obligatorio');
            return false;
        }
        
        const esSupervisionDomicilio = this.isSupervisionDomicilio(tipoVisita);
        const esSupervisionRuta = this.isSupervisionRuta(tipoVisita);

        if (!esSupervisionRuta && !data.numeroPedido?.trim()) {
            alert('❌ El número de pedido es obligatorio');
            return false;
        }
        
        if (!data.telefonoCliente?.trim()) {
            alert(esSupervisionRuta ? '❌ El teléfono del operador es obligatorio' : '❌ El teléfono del cliente es obligatorio');
            return false;
        }
        
        if (!data.nombreCliente?.trim()) {
            alert(esSupervisionRuta ? '❌ El nombre del operador es obligatorio' : '❌ El nombre del cliente es obligatorio');
            return false;
        }

        if (tipoVisita === 'Atención a Queja') {
            if (!data.motivoQueja?.trim()) {
                alert('❌ El motivo de la queja es obligatorio');
                return false;
            }

            if (!data.solucion?.trim()) {
                alert('❌ La solución brindada es obligatoria');
                return false;
            }
        }

        if (esSupervisionDomicilio) {
            if (!data.comentario?.trim()) {
                alert('❌ Los comentarios de lo encontrado en sitio son obligatorios');
                return false;
            }

            const encuestaCompleta = this.ENCUESTA_DOMICILIO_FIELDS.every(field => data[field]?.trim());
            if (!encuestaCompleta) {
                alert('❌ Completa las 5 preguntas de la encuesta al cliente');
                return false;
            }

            if (data.servicioCalleRecibido === 'Sí') {
                if (!data.datosPedidosNombre?.trim()) {
                    alert('❌ El nombre para pedidos es obligatorio');
                    return false;
                }

                if (!data.datosPedidosTelefono?.trim()) {
                    alert('❌ El teléfono para pedidos es obligatorio');
                    return false;
                }

                if (!data.datosPedidosDireccion?.trim()) {
                    alert('❌ La dirección o referencias para pedidos son obligatorias');
                    return false;
                }
            }
        }

        if (esSupervisionRuta) {
            if (!data.comentario?.trim()) {
                alert('❌ Los comentarios de lo encontrado en sitio son obligatorios');
                return false;
            }

            const revisionCompleta = this.REVISION_OPERADOR_FIELDS.every(field => data[field]?.trim());
            if (!revisionCompleta) {
                alert('❌ Completa todas las preguntas de revisión al operador');
                return false;
            }
        }
        
        if (!data.firmaSupervisor) {
            alert('❌ La firma del supervisor es obligatoria');
            return false;
        }
        
        return true;
    },

    // Manejar envío del formulario (CORREGIDO - Solo se agregó 1 línea para limpiar el canvas)
    async handleSubmit(e, appState) {
        e.preventDefault();
        
        if (!this.validateForm(appState.supervisionData)) {
            return;
        }

        appState.isSubmitting = true;
        App.render();
        
        const now = new Date();
        const tipoVisita = this.formatTipoVisita(appState.supervisionData.tipoVisita);
        const esAtencionQueja = tipoVisita === 'Atención a Queja';
        const esSupervisionDomicilio = this.isSupervisionDomicilio(tipoVisita);
        const esSupervisionRuta = this.isSupervisionRuta(tipoVisita);
        const esSupervisionCampo = esSupervisionDomicilio || esSupervisionRuta;
        const registraClientePedidos = esSupervisionDomicilio && appState.supervisionData.servicioCalleRecibido === 'Sí';
        const datosSupervision = {
            ...appState.supervisionData,
            tipoVisita,
            motivoQueja: esAtencionQueja ? appState.supervisionData.motivoQueja : '',
            solucion: esAtencionQueja ? appState.supervisionData.solucion : '',
            comentario: esSupervisionCampo ? appState.supervisionData.comentario : (appState.supervisionData.comentario || ''),
            servicioCalleRecibido: esSupervisionDomicilio ? (appState.supervisionData.servicioCalleRecibido || 'No') : '',
            encuestaTratoVendedor: esSupervisionDomicilio ? appState.supervisionData.encuestaTratoVendedor : '',
            encuestaClaridadVendedor: esSupervisionDomicilio ? appState.supervisionData.encuestaClaridadVendedor : '',
            encuestaTiempoServicio: esSupervisionDomicilio ? appState.supervisionData.encuestaTiempoServicio : '',
            encuestaPresentacionVendedor: esSupervisionDomicilio ? appState.supervisionData.encuestaPresentacionVendedor : '',
            encuestaSatisfaccionCliente: esSupervisionDomicilio ? appState.supervisionData.encuestaSatisfaccionCliente : '',
            revisionEquipoSeguridad: esSupervisionRuta ? appState.supervisionData.revisionEquipoSeguridad : '',
            revisionPresentacionIdentificacion: esSupervisionRuta ? appState.supervisionData.revisionPresentacionIdentificacion : '',
            revisionUnidadCondiciones: esSupervisionRuta ? appState.supervisionData.revisionUnidadCondiciones : '',
            revisionDocumentacionServicio: esSupervisionRuta ? appState.supervisionData.revisionDocumentacionServicio : '',
            revisionManejoSeguro: esSupervisionRuta ? appState.supervisionData.revisionManejoSeguro : '',
            revisionCajaSeguridad: esSupervisionRuta ? appState.supervisionData.revisionCajaSeguridad : '',
            datosPedidosNombre: registraClientePedidos ? appState.supervisionData.datosPedidosNombre : '',
            datosPedidosTelefono: registraClientePedidos ? appState.supervisionData.datosPedidosTelefono : '',
            datosPedidosDireccion: registraClientePedidos ? appState.supervisionData.datosPedidosDireccion : ''
        };
        const reporte = {
            id: Date.now().toString(),
            tipo: 'supervision',
            ...datosSupervision,
            fecha: datosSupervision.fecha || now.toISOString().split('T')[0],
            hora: datosSupervision.hora || now.toLocaleTimeString('es-MX', {
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            }),
            coordenadas: {
                lat: this.currentLocation.lat,
                lng: this.currentLocation.lng
            },
            direccionCompleta: this.currentLocation.address || datosSupervision.ubicacion,
            timestamp: now.getTime(),
            enlaceMaps: this.currentLocation.lat && this.currentLocation.lng 
                ? `https://www.google.com/maps?q=${this.currentLocation.lat},${this.currentLocation.lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(datosSupervision.ubicacion || '')}`,
            cantidadFotos: datosSupervision.evidenciasFotos?.length || 0
        };
        
        setTimeout(async () => {
            try {
                const saved = await StorageService.saveSupervision(reporte);
                if (!saved) throw new Error("Error al guardar en base de datos");
                
                // Disparar eventos para actualizar el mapa
                window.dispatchEvent(new Event('supervisionGuardada'));
                
                if (!appState.supervisiones) {
                    appState.supervisiones = [];
                }
                appState.supervisiones.push(reporte);
                appState.ultimaSupervision = reporte;

                // ⏳ Obligar a la app a esperar a que salgan TODOS los WhatsApps antes de avanzar
                await this.notificarPorWhatsapp(reporte);
                await this.notificarPorTelegram(reporte);
                
                // Resetear formulario
                appState.supervisionData = {
                    nombreSupervisor: '',
                    ruta: '',
                    tipoVisita: 'Atención a Queja',
                    fecha: now.toISOString().split('T')[0],
                    hora: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    numeroPedido: '',
                    telefonoCliente: '',
                    nombreCliente: '',
                    calle: '',
                    numero: '',
                    colonia: '',
                    ubicacion: '',
                    motivoQueja: '',
                    comentario: '',
                    solucion: '',
                    servicioCalleRecibido: 'No',
                    datosPedidosNombre: '',
                    datosPedidosTelefono: '',
                    datosPedidosDireccion: '',
                    encuestaTratoVendedor: '',
                    encuestaClaridadVendedor: '',
                    encuestaTiempoServicio: '',
                    encuestaPresentacionVendedor: '',
                    encuestaSatisfaccionCliente: '',
                    revisionEquipoSeguridad: '',
                    revisionPresentacionIdentificacion: '',
                    revisionUnidadCondiciones: '',
                    revisionDocumentacionServicio: '',
                    revisionManejoSeguro: '',
                    revisionCajaSeguridad: '',
                    evidenciasFotos: [],
                    firmaSupervisor: null
                };
                
                // 🔥 ÚNICA LÍNEA AGREGADA - Limpiar el canvas físicamente
                document.getElementById('supervisionSigCanvas')?.getContext('2d')?.clearRect(0, 0, 300, 150);
                
                this.currentLocation = {
                    lat: null,
                    lng: null,
                    address: ''
                };
                
                appState.isSubmitting = false;
                
                App.goToStep('supervision-success');
                
            } catch (error) {
                console.error('Error al guardar:', error);
                alert('❌ Error al guardar el reporte. Intenta de nuevo.');
                appState.isSubmitting = false;
                App.render();
            }
        }, 1500);
    },

    async notificarPorWhatsapp(reporte) {

        const directorioSupervisores = {
            "OSWALDO": { phone: "5214426162604" },
            "PRUEBA": { phone: "5214426162604" } // Para que las pruebas te lleguen a ti
        };

        // Destinatarios fijos que reciben copia de TODOS los reportes.
        const destinatarios = [ 
            { nombre: "Administrador", phone: "5214426162604" },
            { nombre: "Supervisor de supervisores", phone: "5214423957846" }
        ];

        const supActual = Object.keys(directorioSupervisores).find(k =>
            (reporte.nombreSupervisor || '').toUpperCase().includes(k)
        );
        if (supActual) destinatarios.push(directorioSupervisores[supActual]);

        // 🛡️ Filtro para evitar mensajes duplicados (Si eres admin y supervisor al mismo tiempo)
        const destinatariosUnicos = [];
        const telefonosVistos = new Set();
        destinatarios.forEach(contacto => {
            if (contacto.phone && !telefonosVistos.has(contacto.phone)) {
                telefonosVistos.add(contacto.phone);
                destinatariosUnicos.push(contacto);
            }
        });

        // 📍 Garantizar que se mande la ubicación GPS real, no la que escribieron
        let ubicacionGPS = "";
        if (reporte.coordenadas && reporte.coordenadas.lat && reporte.coordenadas.lng) {
            ubicacionGPS = `📍 *Ubicación Exacta  (GPS):*\nhttps://www.google.com/maps?q=${reporte.coordenadas.lat},${reporte.coordenadas.lng}`;
        } else {
            ubicacionGPS = `⚠️ *ALERTA:* El supervisor bloqueó o apagó el GPS del celular.\n📍 *Dirección escrita a mano (NO VERIFICADA):* ${reporte.ubicacion || 'No ingresada'}`;
        }

        const tipoVisita = this.formatTipoVisita(reporte.tipoVisita);
        const esAtencionQueja = tipoVisita === 'Atención a Queja';
        const esSupervisionDomicilio = this.isSupervisionDomicilio(tipoVisita);
        const esSupervisionRuta = this.isSupervisionRuta(tipoVisita);
        const etiquetaPersona = esSupervisionRuta ? 'Operador/Chofer' : 'Cliente';
        const detalleVisita = esAtencionQueja
            ? `🔴 *Queja:* ${reporte.motivoQueja}\n` +
              `✅ *Solución:* ${reporte.solucion}\n`
            : esSupervisionDomicilio
                ? `🔎 *Hallazgos en sitio:* ${reporte.comentario || 'No registrado'}\n` +
                  `⭐ *Encuesta al cliente:*\n` +
                  `- Trato del vendedor: ${reporte.encuestaTratoVendedor || 'N/A'}/10\n` +
                  `- Claridad de información: ${reporte.encuestaClaridadVendedor || 'N/A'}/10\n` +
                  `- Tiempo de atención: ${reporte.encuestaTiempoServicio || 'N/A'}/10\n` +
                  `- Presentación del vendedor: ${reporte.encuestaPresentacionVendedor || 'N/A'}/10\n` +
                  `- Satisfacción general: ${reporte.encuestaSatisfaccionCliente || 'N/A'}/10\n` +
                  `🧾 *Servicio de calle recibido:* ${reporte.servicioCalleRecibido || 'No'}\n` +
                  (reporte.servicioCalleRecibido === 'Sí'
                    ? `📋 *Datos para pedidos:*\n` +
                      `Nombre: ${reporte.datosPedidosNombre || 'No registrado'}\n` +
                      `Teléfono: ${reporte.datosPedidosTelefono || 'No registrado'}\n` +
                      `Dirección/Referencias: ${reporte.datosPedidosDireccion || 'No registrado'}\n`
                    : '')
            : esSupervisionRuta
                ? `🔎 *Hallazgos en sitio:* ${reporte.comentario || 'No registrado'}\n` +
                  `✅ *Revisión del operador:*\n` +
                  `- Equipo de seguridad completo: ${reporte.revisionEquipoSeguridad || 'N/A'}\n` +
                  `- Presentación e identificación: ${reporte.revisionPresentacionIdentificacion || 'N/A'}\n` +
                  `- Unidad limpia/en condiciones: ${reporte.revisionUnidadCondiciones || 'N/A'}\n` +
                  `- Documentación del servicio en orden: ${reporte.revisionDocumentacionServicio || 'N/A'}\n` +
                  `- Atención y maniobras seguras: ${reporte.revisionManejoSeguro || 'N/A'}\n` +
                  `- Caja de seguridad: ${reporte.revisionCajaSeguridad || 'N/A'}\n`
            : '';

        const mensaje = `🚨 *SUPERVISIÓN COMPLETADA* 🚨\n\n` +
                        `👨‍🔧 *Supervisor:* ${reporte.nombreSupervisor}\n` +
                        `📝 *Tipo de Visita:* ${tipoVisita}\n` +
                        `${reporte.ruta ? `🛣️ *Ruta:* ${reporte.ruta}\n` : ''}` +
                        `👤 *${etiquetaPersona}:* ${reporte.nombreCliente}\n` +
                        `${reporte.numeroPedido ? `📦 *Económico de Unidad:* ${reporte.numeroPedido}\n` : ''}` +
                        detalleVisita +
                        `📅 *Fecha/Hora:* ${reporte.fecha} ${reporte.hora}\n\n` +
                        `${ubicacionGPS}`;
        const encodedMessage = encodeURIComponent(mensaje);

        // ⏱️ Enviar mensajes uno por uno con pausa para evitar filtro Anti-Spam
        for (const contacto of destinatariosUnicos) {
            if (contacto.phone) {
                const url = `https://whatabot.net/api/send?phone=${contacto.phone}&text=${encodedMessage}`;
                
                try {
                    // Await explícito para asegurar que la petición salga completamente del teléfono
                    await fetch(url, { mode: 'no-cors', method: 'GET' });
                    console.log("WhatsApp procesado para: " + contacto.phone);
                } catch (e) {}

                // ⏱️ Esperar 4 segundos (CallMeBot es estricto con el spam)
                await new Promise(resolve => setTimeout(resolve, 4000));
            }
        }
    },

    async notificarPorTelegram(reporte) {
        // Verificar que la configuración de Telegram exista y no esté vacía
        if (!window.CONFIG?.TELEGRAM?.BOT_TOKEN || !window.CONFIG?.TELEGRAM?.CHAT_ID || window.CONFIG.TELEGRAM.CHAT_ID.includes('TU_CHAT_ID')) {
            console.warn("Configuración de Telegram incompleta en data.js. No se enviará la notificación.");
            return;
        }

        // Reutilizamos la misma lógica de construcción de mensaje que la de WhatsApp
        let ubicacionGPS = "";
        if (reporte.coordenadas && reporte.coordenadas.lat && reporte.coordenadas.lng) {
            ubicacionGPS = `📍 *Ubicación Exacta (GPS):*\nhttps://www.google.com/maps?q=${reporte.coordenadas.lat},${reporte.coordenadas.lng}`;
        } else {
            ubicacionGPS = `⚠️ *ALERTA:* El supervisor bloqueó o apagó el GPS del celular.\n📍 *Dirección escrita a mano (NO VERIFICADA):* ${reporte.ubicacion || 'No ingresada'}`;
        }

        const tipoVisita = this.formatTipoVisita(reporte.tipoVisita);
        const esAtencionQueja = tipoVisita === 'Atención a Queja';
        const esSupervisionDomicilio = this.isSupervisionDomicilio(tipoVisita);
        const esSupervisionRuta = this.isSupervisionRuta(tipoVisita);
        const etiquetaPersona = esSupervisionRuta ? 'Operador/Chofer' : 'Cliente';
        const detalleVisita = esAtencionQueja
            ? `🔴 *Queja:* ${reporte.motivoQueja}\n` +
              `✅ *Solución:* ${reporte.solucion}\n`
            : esSupervisionDomicilio
                ? `🔎 *Hallazgos en sitio:* ${reporte.comentario || 'No registrado'}\n` +
                  `⭐ *Encuesta al cliente:*\n` +
                  `- Trato del vendedor: ${reporte.encuestaTratoVendedor || 'N/A'}/10\n` +
                  `- Claridad de información: ${reporte.encuestaClaridadVendedor || 'N/A'}/10\n` +
                  `- Tiempo de atención: ${reporte.encuestaTiempoServicio || 'N/A'}/10\n` +
                  `- Presentación del vendedor: ${reporte.encuestaPresentacionVendedor || 'N/A'}/10\n` +
                  `- Satisfacción general: ${reporte.encuestaSatisfaccionCliente || 'N/A'}/10\n` +
                  `🧾 *Servicio de calle recibido:* ${reporte.servicioCalleRecibido || 'No'}\n` +
                  (reporte.servicioCalleRecibido === 'Sí'
                    ? `📋 *Datos para pedidos:*\n` +
                      `Nombre: ${reporte.datosPedidosNombre || 'No registrado'}\n` +
                      `Teléfono: ${reporte.datosPedidosTelefono || 'No registrado'}\n` +
                      `Dirección/Referencias: ${reporte.datosPedidosDireccion || 'No registrado'}\n`
                    : '')
            : esSupervisionRuta
                ? `🔎 *Hallazgos en sitio:* ${reporte.comentario || 'No registrado'}\n` +
                  `✅ *Revisión del operador:*\n` +
                  `- Equipo de seguridad completo: ${reporte.revisionEquipoSeguridad || 'N/A'}\n` +
                  `- Presentación e identificación: ${reporte.revisionPresentacionIdentificacion || 'N/A'}\n` +
                  `- Unidad limpia/en condiciones: ${reporte.revisionUnidadCondiciones || 'N/A'}\n` +
                  `- Documentación del servicio en orden: ${reporte.revisionDocumentacionServicio || 'N/A'}\n` +
                  `- Atención y maniobras seguras: ${reporte.revisionManejoSeguro || 'N/A'}\n`
            : '';

        const mensaje = `🚨 *SUPERVISIÓN COMPLETADA* 🚨\n\n` +
                        `👨‍🔧 *Supervisor:* ${reporte.nombreSupervisor}\n` +
                        `📝 *Tipo de Visita:* ${tipoVisita}\n` +
                        `${reporte.ruta ? `🛣️ *Ruta:* ${reporte.ruta}\n` : ''}` +
                        `👤 *${etiquetaPersona}:* ${reporte.nombreCliente}\n` +
                        `${reporte.numeroPedido ? `📦 *Económico de Unidad:* ${reporte.numeroPedido}\n` : ''}` +
                        detalleVisita +
                        `📅 *Fecha/Hora:* ${reporte.fecha} ${reporte.hora}\n\n` +
                        `${ubicacionGPS}`;
        const url = `https://api.telegram.org/bot${window.CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage`;

        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: window.CONFIG.TELEGRAM.CHAT_ID,
                    text: mensaje,
                    parse_mode: 'Markdown'
                })
            });
            console.log("Notificación de Telegram enviada exitosamente.");
        } catch (error) {
            console.error("Error enviando notificación de Telegram:", error);
        }
    }
};

// Exportar controlador
if (typeof window !== 'undefined') {
    window.SupervisionController = SupervisionController;
}
