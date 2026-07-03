// success.js - Vistas de éxito para diferentes procesos

const SuccessView = {
    formatTipoVisita(tipoVisita = '') {
        return tipoVisita === 'Supervisión de Ruta' ? 'Supervisión en Domicilio' : (tipoVisita || 'Atención a Queja');
    },

    isSupervisionRuta(tipoVisita = '') {
        return this.formatTipoVisita(tipoVisita) === 'Supervisión en Ruta';
    },

    // Vista de éxito para checklist
    renderChecklistSuccess() {
        return `
            <div class="container">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="width: 80px; height: 80px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <div style="font-size: 40px; color: white;">✓</div>
                    </div>
                    
                    <h2 style="color: #166534; margin-bottom: 12px; font-size: 24px;">
                        ¡INSPECCIÓN GUARDADA!
                    </h2>
                    
                    <p style="color: #64748b; margin-bottom: 30px;">
                        El checklist se ha registrado correctamente.
                    </p>
                    
                    <div style="display: flex; gap: 12px;">
                        <button onclick="App.goToStep('form')" class="btn btn-primary" style="flex: 1;">
                            📋 Nueva Inspección
                        </button>
                        <button onclick="App.goToStep('home')" class="btn btn-secondary" style="flex: 1;">
                            🏠 Inicio
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Vista de éxito para orden de servicio
    renderOrdenSuccess(ordenData) {
        return `
            <div class="container">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="width: 80px; height: 80px; background: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <div style="font-size: 40px; color: white;">🔧</div>
                    </div>
                    
                    <h2 style="color: #92400e; margin-bottom: 12px; font-size: 24px;">
                        ¡ORDEN DE SERVICIO REGISTRADA!
                    </h2>
                    
                    <p style="color: #64748b; margin-bottom: 20px;">
                        Folio: <strong style="color: #1e293b; font-size: 20px;">${ordenData.folio}</strong>
                    </p>
                    
                    <div class="card" style="background: #f8fafc; text-align: left; margin-bottom: 30px;">
                        <h4 style="color: #1e293b; margin-bottom: 10px;">📋 Resumen:</h4>
                        <p style="font-size: 12px;"><strong>Unidad:</strong> ${ordenData.unidad}</p>
                        <p style="font-size: 12px;"><strong>Operador:</strong> ${ordenData.operador}</p>
                        <p style="font-size: 12px;"><strong>Falla:</strong> ${ordenData.descripcionFalla.substring(0, 100)}${ordenData.descripcionFalla.length > 100 ? '...' : ''}</p>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button onclick="App.goToStep('orden-servicio')" class="btn btn-warning" style="flex: 1;">
                            🔧 Nueva Orden
                        </button>
                        <button onclick="App.goToStep('home')" class="btn btn-secondary" style="flex: 1;">
                            🏠 Inicio
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Vista de éxito para supervisión en campo
    renderSupervisionSuccess(ultimo = null) {
        const tipoVisita = this.formatTipoVisita(ultimo?.tipoVisita);
        const esAtencionQueja = tipoVisita === 'Atención a Queja';
        const esSupervisionRuta = this.isSupervisionRuta(tipoVisita);
        const etiquetaPersona = esSupervisionRuta ? 'Operador / Chofer' : 'Cliente';
        
        return `
            <div class="container">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="width: 80px; height: 80px; background: #0867ec; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <div style="font-size: 40px; color: white;">✓</div>
                    </div>
                    
                    <h2 style="color: #0867ec; margin-bottom: 12px; font-size: 24px;">
                        ¡REPORTE DE SUPERVISIÓN GUARDADO!
                    </h2>
                    
                    <p style="color: #64748b; margin-bottom: 20px;">
                        El reporte se ha registrado correctamente.
                    </p>
                    
                    ${ultimo ? `
                        <div class="card" style="background: #f8fafc; text-align: left; margin-bottom: 30px;">
                            <h4 style="color: #1e293b; margin-bottom: 10px;">📋 Resumen completo:</h4>
                            
                            <p style="font-size: 12px; margin: 5px 0;"><strong>👤 Supervisor:</strong> ${ultimo.nombreSupervisor || 'No especificado'}</p>
                            <p style="font-size: 12px; margin: 5px 0;"><strong>📝 Tipo de Visita:</strong> ${tipoVisita}</p>
                            ${ultimo.ruta ? `<p style="font-size: 12px; margin: 5px 0;"><strong>🛣️ Ruta:</strong> ${ultimo.ruta}</p>` : ''}
                            <p style="font-size: 12px; margin: 5px 0;"><strong>📅 Fecha/Hora:</strong> ${ultimo.fecha || ''} ${ultimo.hora || ''}</p>
                            <p style="font-size: 12px; margin: 5px 0;"><strong>🆔 ${esSupervisionRuta ? 'Económico de Unidad' : 'Pedido'}:</strong> ${ultimo.numeroPedido || 'No especificado'}</p>
                            
                            <div style="border-top: 1px dashed #cbd5e1; margin: 10px 0;"></div>
                            
                            <h5 style="color: #1e293b; margin: 8px 0 4px;">👤 Datos del ${etiquetaPersona}:</h5>
                            <p style="font-size: 12px; margin: 5px 0;"><strong>Nombre:</strong> ${ultimo.nombreCliente || 'No especificado'}</p>
                            <p style="font-size: 12px; margin: 5px 0;"><strong>Teléfono:</strong> ${ultimo.telefonoCliente || 'No especificado'}</p>
                            
                            <div style="border-top: 1px dashed #cbd5e1; margin: 10px 0;"></div>
                            
                            <h5 style="color: #1e293b; margin: 8px 0 4px;">📍 Dirección:</h5>
                            <p style="font-size: 12px; margin: 5px 0;"><strong>Calle:</strong> ${ultimo.calle || ''} #${ultimo.numero || ''}</p>
                            <p style="font-size: 12px; margin: 5px 0;"><strong>Colonia:</strong> ${ultimo.colonia || ''}</p>
                            <p style="font-size: 12px; margin: 5px 0;"><strong>Ubicación:</strong> ${ultimo.ubicacion || 'No disponible'}</p>
                            
                            <div style="border-top: 1px dashed #cbd5e1; margin: 10px 0;"></div>
                            
                            ${esAtencionQueja ? `
                                <h5 style="color: #1e293b; margin: 8px 0 4px;">📝 Detalles de la Visita:</h5>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Detalle de la visita:</strong> ${ultimo.detalleVisita || 'No especificado'}</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Motivo de la queja:</strong> ${ultimo.motivoQueja || 'No especificado'}</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Solución brindada:</strong> ${ultimo.solucion || 'No especificada'}</p>
                            ` : esSupervisionRuta ? `
                                <h5 style="color: #1e293b; margin: 8px 0 4px;">📝 Detalles de la Visita:</h5>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Tipo:</strong> Supervisión en Ruta</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Hallazgos en sitio:</strong> ${ultimo.comentario || 'No especificado'}</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Equipo de seguridad completo:</strong> ${ultimo.revisionEquipoSeguridad || 'No especificado'}</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Presentación e identificación:</strong> ${ultimo.revisionPresentacionIdentificacion || 'No especificado'}</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Unidad limpia/en condiciones:</strong> ${ultimo.revisionUnidadCondiciones || 'No especificado'}</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Documentación del servicio:</strong> ${ultimo.revisionDocumentacionServicio || 'No especificado'}</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Atención y maniobras seguras:</strong> ${ultimo.revisionManejoSeguro || 'No especificado'}</p>
                            ` : `
                                <h5 style="color: #1e293b; margin: 8px 0 4px;">📝 Detalles de la Visita:</h5>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Tipo:</strong> Supervisión en Domicilio</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Hallazgos en sitio:</strong> ${ultimo.comentario || 'No especificado'}</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Trato del vendedor:</strong> ${ultimo.encuestaTratoVendedor ? `${ultimo.encuestaTratoVendedor}/10` : 'No especificado'}</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Claridad de información:</strong> ${ultimo.encuestaClaridadVendedor ? `${ultimo.encuestaClaridadVendedor}/10` : 'No especificado'}</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Tiempo de atención:</strong> ${ultimo.encuestaTiempoServicio ? `${ultimo.encuestaTiempoServicio}/10` : 'No especificado'}</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Presentación del vendedor:</strong> ${ultimo.encuestaPresentacionVendedor ? `${ultimo.encuestaPresentacionVendedor}/10` : 'No especificado'}</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Satisfacción general:</strong> ${ultimo.encuestaSatisfaccionCliente ? `${ultimo.encuestaSatisfaccionCliente}/10` : 'No especificado'}</p>
                                <p style="font-size: 12px; margin: 5px 0;"><strong>Servicio de calle recibido:</strong> ${ultimo.servicioCalleRecibido || 'No'}</p>
                                ${ultimo.servicioCalleRecibido === 'Sí' ? `
                                    <p style="font-size: 12px; margin: 5px 0;"><strong>Nombre para pedidos:</strong> ${ultimo.datosPedidosNombre || 'No especificado'}</p>
                                    <p style="font-size: 12px; margin: 5px 0;"><strong>Teléfono para pedidos:</strong> ${ultimo.datosPedidosTelefono || 'No especificado'}</p>
                                    <p style="font-size: 12px; margin: 5px 0;"><strong>Dirección / referencias:</strong> ${ultimo.datosPedidosDireccion || 'No especificado'}</p>
                                ` : ''}
                            `}
                            ${esAtencionQueja ? `<p style="font-size: 12px; margin: 5px 0;"><strong>Comentario adicional:</strong> ${ultimo.comentario || 'Sin comentarios'}</p>` : ''}
                            
                            ${ultimo.coordenadas?.lat ? `
                                <div style="border-top: 1px dashed #cbd5e1; margin: 10px 0;"></div>
                                <p style="font-size: 11px; color: #64748b;"><strong>📍 Coordenadas:</strong> ${ultimo.coordenadas.lat}, ${ultimo.coordenadas.lng}</p>
                            ` : ''}
                            
                            ${ultimo.evidenciaFoto ? `
                                <div style="border-top: 1px dashed #cbd5e1; margin: 10px 0;"></div>
                                <p style="font-size: 11px; color: #64748b;"><strong>📸 Evidencia:</strong> Foto adjunta</p>
                            ` : ''}
                        </div>
                        
                        ${ultimo.enlaceMaps ? `
                            <a href="${ultimo.enlaceMaps}" 
                               target="_blank"
                               style="display: inline-block; margin-bottom: 20px; padding: 12px 20px; background: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">
                                🗺️ Ver ubicación en Google Maps
                            </a>
                        ` : ''}
                    ` : ''}
                    
                    <div style="display: flex; gap: 12px; margin-top: 20px;">
                        <button onclick="App.goToStep('supervision-form')" class="btn" style="background: #0867ec; color: white; flex: 1;">
                            📝 Nuevo Reporte
                        </button>
                        <button onclick="App.goToStep('home')" class="btn btn-secondary" style="flex: 1;">
                            🏠 Inicio
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Vista de éxito para daños a terceros
    renderDanosTercerosSuccess(ultimo = null) {
        return `
            <div class="container">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="width: 80px; height: 80px; background: #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <i class='bx bxs-car-crash' style="font-size: 40px; color: white;"></i>
                    </div>
                    
                    <h2 style="color: #92400e; margin-bottom: 12px; font-size: 24px;">
                        ¡BITÁCORA DE DAÑOS GUARDADA!
                    </h2>
                    
                    <p style="color: #64748b; margin-bottom: 20px;">
                        El reporte se ha registrado correctamente.
                    </p>

                    ${ultimo ? `
                        <div class="card" style="background: #f8fafc; text-align: left; margin-bottom: 30px;">
                            <h4 style="color: #1e293b; margin-bottom: 10px;">📋 Resumen:</h4>
                            <p style="font-size: 12px;"><strong>Supervisor:</strong> ${ultimo.supervisor}</p>
                            <p style="font-size: 12px;"><strong>Fecha:</strong> ${ultimo.fecha}</p>
                            <p style="font-size: 12px;"><strong>Chofer:</strong> ${ultimo.chofer} (Eco: ${ultimo.economico})</p>
                            <p style="font-size: 12px;"><strong>Tercero:</strong> ${ultimo.nombreTercero}</p>
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; gap: 12px; margin-top: 20px;">
                        <button onclick="App.goToStep('danos-terceros')" class="btn" style="background: #d97706; color: white; flex: 1;">
                            📝 Nuevo Reporte
                        </button>
                        <button onclick="App.goToStep('home')" class="btn btn-secondary" style="flex: 1;">
                            🏠 Inicio
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Vista de éxito para golpe a unidades
    renderGolpeUnidadesSuccess(ultimo = null) {
        return `
            <div class="container">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="width: 80px; height: 80px; background: #be123c; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <i class='bx bxs-car-mechanic' style="font-size: 40px; color: white;"></i>
                    </div>
                    
                    <h2 style="color: #9f1239; margin-bottom: 12px; font-size: 24px;">
                        ¡BITÁCORA DE GOLPE GUARDADA!
                    </h2>
                    
                    <p style="color: #64748b; margin-bottom: 20px;">
                        El reporte se ha registrado correctamente.
                    </p>

                    ${ultimo ? `
                        <div class="card" style="background: #f8fafc; text-align: left; margin-bottom: 30px;">
                            <h4 style="color: #1e293b; margin-bottom: 10px;">📋 Resumen:</h4>
                            <p style="font-size: 12px;"><strong>Supervisor:</strong> ${ultimo.supervisor}</p>
                            <p style="font-size: 12px;"><strong>Fecha:</strong> ${ultimo.fecha}</p>
                            <p style="font-size: 12px;"><strong>Chofer:</strong> ${ultimo.chofer} (Eco: ${ultimo.economico})</p>
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; gap: 12px; margin-top: 20px;">
                        <button onclick="App.goToStep('golpe-unidades')" class="btn" style="background: #be123c; color: white; flex: 1;">
                            📝 Nuevo Reporte
                        </button>
                        <button onclick="App.goToStep('home')" class="btn btn-secondary" style="flex: 1;">
                            🏠 Inicio
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
};

// Exportar vista para uso global
if (typeof window !== 'undefined') {
    window.SuccessView = SuccessView;
}
