const SegurosUnidadesController = {
    state: {
        records: [],
        filter: '',
        editingId: null
    },

    async init() {
        const root = document.getElementById('seguros-unidades-root');
        if (!root) return;

        await this.loadRecords();
        this.bindEvents();
        this.renderList();
    },

    bindEvents() {
        const searchInput = document.getElementById('seguros-search');
        if (!searchInput || searchInput.dataset.bound === 'true') return;

        searchInput.addEventListener('input', (event) => {
            this.state.filter = (event.target.value || '').toLowerCase();
            this.renderList();
        });

        searchInput.dataset.bound = 'true';
    },

    async loadRecords() {
        this.state.records = await StorageService.loadSegurosUnidades();
    },

    getFilteredRecords() {
        const query = this.state.filter.trim();
        if (!query) return this.state.records;

        return this.state.records.filter(record => {
            const haystack = [
                record.unidad,
                record.aseguradora,
                record.numeroPoliza,
                record.observaciones
            ].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(query);
        });
    },

    async renderList() {
        const listContainer = document.getElementById('seguros-unidades-list');
        const counter = document.getElementById('seguros-count');
        const currentRole = (App?.appState?.userRole || '').toLowerCase();
        const isSupervisor = currentRole === 'supervisor';

        if (!listContainer) return;

        const records = this.getFilteredRecords();
        if (counter) counter.textContent = `${records.length} registro${records.length === 1 ? '' : 's'}`;

        if (!records.length) {
            listContainer.innerHTML = `
                <div style="padding: 40px 24px; border: 1px dashed #cbd5e1; border-radius: 16px; background: #f8fafc; text-align: center; color: #64748b;">
                    <div style="font-size: 48px; margin-bottom: 12px;">📄</div>
                    <strong style="font-size: 16px; color: #0f172a;">No hay seguros registrados todavía.</strong>
                    <div style="margin-top: 8px; font-size: 14px;">Agrega la primera póliza para empezar.</div>
                </div>
            `;
            return;
        }

        // HTML Responsive
        listContainer.innerHTML = `
            <style>
                .seg-table { display: table; width: 100%; }
                .seg-cards { display: none; }
                @media (max-width: 767px) {
                    .seg-table { display: none; }
                    .seg-cards { display: grid; grid-template-columns: 1fr; gap: 12px; }
                }
            </style>
            
            <!-- TABLA DESKTOP -->
            <div class="seg-table">
                <div style="overflow-x: auto; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #0f172a; color: white;">
                                <th style="padding: 14px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Unidad</th>
                                <th style="padding: 14px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Aseguradora</th>
                                <th style="padding: 14px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Póliza</th>
                                <th style="padding: 14px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Vigencia</th>
                                <th style="padding: 14px 12px; text-align: center; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Estado</th>
                                <th style="padding: 14px 12px; text-align: center; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">PDF</th>
                                <th style="padding: 14px 12px; text-align: center; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${records.map(record => {
                                const estado = this.getEstado(record.vigenciaFin);
                                return `
                                    <tr style="border-bottom: 1px solid #e2e8f0; background: #fff; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
                                        <td style="padding: 12px; font-weight: 700; color: #0f172a;">${this.escapeHtml(record.unidad || 'Sin unidad')}</td>
                                        <td style="padding: 12px; color: #334155; font-size: 13px;">${this.escapeHtml(record.aseguradora || '-')}</td>
                                        <td style="padding: 12px; color: #334155; font-family: monospace; font-size: 12px;">${this.escapeHtml(record.numeroPoliza || '-')}</td>
                                        <td style="padding: 12px; color: #334155; font-size: 13px;">${this.escapeHtml(this.formatDate(record.vigenciaInicio))} - ${this.escapeHtml(this.formatDate(record.vigenciaFin))}</td>
                                        <td style="padding: 12px; text-align: center;">
                                            <span style="display: inline-block; padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: ${estado.color}; color: ${estado.textColor};">${estado.label}</span>
                                        </td>
                                        <td style="padding: 12px; text-align: center;">
                                            ${record.pdfUrl ? `<a href="${record.pdfUrl}" target="_blank" download="${this.escapeAttr(record.pdfName || `${record.unidad || 'seguro'}.pdf`)}" style="color: #2563eb; text-decoration: none; font-weight: 600; cursor: pointer;">📄 Ver</a>` : '<span style="color: #cbd5e1; font-size: 13px;">—</span>'}\n                                        </td>\n                                        <td style="padding: 12px; text-align: center;">\n                                            <div style="display: flex; justify-content: center; gap: 4px;">\n                                                ${!isSupervisor ? `\n                                                    <button onclick="SegurosUnidadesController.openModal('${record.id}')" title="Editar" style="padding: 6px 8px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">✎</button>\n                                                    <button onclick="SegurosUnidadesController.replacePdf('${record.id}')" title="Reemplazar PDF" style="padding: 6px 8px; background: #0f766e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;\">↻</button>\n                                                    <button onclick="SegurosUnidadesController.deleteRecord('${record.id}')" title="Eliminar" style="padding: 6px 8px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;\">✕</button>\n                                                ` : ''}\n                                            </div>\n                                        </td>\n                                    </tr>\n                                `;\n                            }).join('')}\n                        </tbody>\n                    </table>\n                </div>\n            </div>\n            \n            <!-- CARDS MÓVIL -->\n            <div class="seg-cards">\n                ${records.map(record => {\n                    const estado = this.getEstado(record.vigenciaFin);\n                    return `\n                        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">\n                            <!-- Header Card -->\n                            <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">\n                                <div style="flex: 1; min-width: 0;">\n                                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;\">Unidad</div>\n                                    <div style="font-size: 16px; font-weight: 700; color: #0f172a; word-break: break-word;\">${this.escapeHtml(record.unidad || 'Sin unidad')}</div>\n                                </div>\n                                <span style="display: inline-block; padding: 6px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; background: ${estado.color}; color: ${estado.textColor}; white-space: nowrap; margin-top: 2px;\">${estado.label}</span>\n                            </div>\n                            \n                            <!-- Detalles -->\n                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;\">\n                                <div>\n                                    <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 3px;\">Aseguradora</div>\n                                    <div style="color: #0f172a;">${this.escapeHtml(record.aseguradora || '-')}</div>\n                                </div>\n                                <div>\n                                    <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 3px;\">Póliza</div>\n                                    <div style="color: #0f172a; font-family: monospace; font-size: 12px; word-break: break-all;\">${this.escapeHtml(record.numeroPoliza || '-')}</div>\n                                </div>\n                            </div>\n                            \n                            <!-- Vigencia -->\n                            <div>\n                                <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 3px;\">Vigencia</div>\n                                <div style="font-size: 13px; color: #0f172a;\">${this.escapeHtml(this.formatDate(record.vigenciaInicio))} — ${this.escapeHtml(this.formatDate(record.vigenciaFin))}</div>\n                            </div>\n                            \n                            <!-- Notas -->\n                            ${record.observaciones ? `<div>\n                                <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 3px;\">Notas</div>\n                                <div style="font-size: 13px; color: #334155; line-height: 1.4;\">${this.escapeHtml(record.observaciones)}</div>\n                            </div>` : ''}\n                            \n                            <!-- Acciones Móvil -->\n                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;\">\n                                ${record.pdfUrl ? `<a href=\"${record.pdfUrl}\" target=\"_blank\" download=\"${this.escapeAttr(record.pdfName || `${record.unidad || 'seguro'}.pdf`)}\" style=\"padding: 10px 12px; background: #2563eb; color: white; border-radius: 8px; text-align: center; text-decoration: none; font-weight: 600; font-size: 13px; cursor: pointer;\">📥 Descargar</a>` : '<span style=\"padding: 10px 12px; background: #e2e8f0; color: #64748b; border-radius: 8px; text-align: center; font-size: 13px;\">Sin PDF</span>'}\n                                ${!isSupervisor ? `<button onclick=\"SegurosUnidadesController.openModal('${record.id}')\" style=\"padding: 10px 12px; background: #f59e0b; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px;\">✏️ Editar</button>` : ''}\n                            </div>\n                            \n                            ${!isSupervisor ? `\n                                <div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 8px;\">\n                                    <button onclick=\"SegurosUnidadesController.replacePdf('${record.id}')\" style=\"padding: 10px 12px; background: #0f766e; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px;\">🔄 Reemplazar</button>\n                                    <button onclick=\"SegurosUnidadesController.deleteRecord('${record.id}')\" style=\"padding: 10px 12px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px;\">🗑️ Eliminar</button>\n                                </div>\n                            ` : ''}\n                        </div>\n                    `;\n                }).join('')}\n            </div>\n        `;
    },

    async openModal(id = null) {
        const record = id ? this.state.records.find(item => item.id === id) : null;
        const isEditing = Boolean(record);
        const content = `
            <div style="padding: 20px; max-width: 600px;">
                <h3 style="margin: 0 0 16px; font-size: 20px; color: #0f172a; font-weight: 800;">${isEditing ? '✏️ Editar póliza de seguro' : '➕ Agregar seguro de unidad'}</h3>
                <form id="seguros-form" onsubmit="SegurosUnidadesController.handleSubmit(event)">
                    <div style="display: grid; gap: 12px;">
                        <label style="display: flex; flex-direction: column; gap: 6px;">
                            <span style="font-size: 13px; font-weight: 600; color: #0f172a;">Unidad *</span>
                            <input id="seguro-unidad" required placeholder="Ej. QI-1235" value="${this.escapeAttr(record?.unidad || '')}" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px;" />
                        </label>
                        
                        <label style="display: flex; flex-direction: column; gap: 6px;">
                            <span style="font-size: 13px; font-weight: 600; color: #0f172a;">Aseguradora *</span>\n                            <input id="seguro-aseguradora" required placeholder="Ej. Seguros GEN" value="${this.escapeAttr(record?.aseguradora || '')}" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px;" />\n                        </label>\n                        \n                        <label style="display: flex; flex-direction: column; gap: 6px;">\n                            <span style="font-size: 13px; font-weight: 600; color: #0f172a;">Número de póliza *</span>\n                            <input id="seguro-poliza" required placeholder="Ej. 8960028612" value="${this.escapeAttr(record?.numeroPoliza || '')}" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px;" />\n                        </label>\n                        \n                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">\n                            <label style="display: flex; flex-direction: column; gap: 6px;">\n                                <span style="font-size: 13px; font-weight: 600; color: #0f172a;\">Inicio de vigencia</span>\n                                <input id="seguro-inicio" type="date" value="${this.escapeAttr(record?.vigenciaInicio || '')}" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px;" />\n                            </label>\n                            <label style="display: flex; flex-direction: column; gap: 6px;">\n                                <span style="font-size: 13px; font-weight: 600; color: #0f172a;\">Fin de vigencia</span>\n                                <input id="seguro-fin" type="date" value="${this.escapeAttr(record?.vigenciaFin || '')}" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px;" />\n                            </label>\n                        </div>\n                        \n                        <label style="display: flex; flex-direction: column; gap: 6px;">\n                            <span style="font-size: 13px; font-weight: 600; color: #0f172a;\">Observaciones / Contacto</span>\n                            <textarea id="seguro-observaciones" placeholder="Notas adicionales..." style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; min-height: 80px; font-size: 14px; font-family: inherit; resize: vertical;">${this.escapeHtml(record?.observaciones || '')}</textarea>\n                        </label>\n                        \n                        <label style="display: flex; flex-direction: column; gap: 6px;">\n                            <span style="font-size: 13px; font-weight: 600; color: #0f172a;\">PDF de la póliza</span>\n                            <input id="seguro-file" type="file" accept="application/pdf" style="padding: 10px 0; font-size: 14px;" />\n                        </label>\n                        \n                        <div style="display: flex; gap: 10px; margin-top: 8px;\">\n                            <button type="button" onclick="ModalService.close()" style="flex: 1; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; color: #0f172a; cursor: pointer; font-weight: 600; font-size: 14px;\">Cancelar</button>\n                            <button type="submit" style="flex: 1; padding: 12px; border: none; border-radius: 10px; background: #2563eb; color: white; cursor: pointer; font-weight: 600; font-size: 14px;\">Guardar</button>\n                        </div>\n                    </div>\n                </form>\n            </div>\n        `;

        ModalService.show(content);
        this.state.editingId = isEditing ? id : null;
    },

    async handleSubmit(event) {
        event.preventDefault();

        const formData = {
            unidad: document.getElementById('seguro-unidad')?.value?.trim() || '',
            aseguradora: document.getElementById('seguro-aseguradora')?.value?.trim() || '',
            numeroPoliza: document.getElementById('seguro-poliza')?.value?.trim() || '',
            vigenciaInicio: document.getElementById('seguro-inicio')?.value || '',
            vigenciaFin: document.getElementById('seguro-fin')?.value || '',
            observaciones: document.getElementById('seguro-observaciones')?.value?.trim() || '',
            id: this.state.editingId || String(Date.now())
        };

        const existing = this.state.records.find(item => item.id === formData.id);
        if (existing) {
            formData.pdfUrl = existing.pdfUrl;
            formData.pdfName = existing.pdfName;
        }

        const fileInput = document.getElementById('seguro-file');
        const file = fileInput?.files?.[0];
        if (file) {
            formData.pdfUrl = await this.readFileAsDataUrl(file);
            formData.pdfName = file.name;
        }

        const saved = await StorageService.saveSeguroUnidad(formData);
        if (!saved) return;

        await this.loadRecords();
        this.renderList();
        ModalService.close();
    },

    async replacePdf(id) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            const pdfUrl = await this.readFileAsDataUrl(file);
            const updated = await StorageService.updateSeguroUnidadPdf(id, pdfUrl, file.name);
            if (updated) {
                await this.loadRecords();
                this.renderList();
            }
        };
        input.click();
    },

    async deleteRecord(id) {
        if (!confirm('¿Deseas eliminar este registro de seguro de forma permanente?')) return;
        const deleted = await StorageService.deleteSeguroUnidad(id);
        if (deleted) {
            await this.loadRecords();
            this.renderList();
        }
    },

    async downloadPdf(id) {
        const record = this.state.records.find(item => item.id === id);
        if (!record?.pdfUrl) {
            alert('Este registro no tiene PDF asociado.');
            return;
        }

        const link = document.createElement('a');
        link.href = record.pdfUrl;
        link.download = record.pdfName || `${record.unidad || 'seguro'}.pdf`;
        link.click();
    },

    getEstado(vigenciaFin) {
        if (!vigenciaFin) return { label: 'Sin vigencia', color: '#e2e8f0', textColor: '#334155' };

        const today = new Date();
        const fin = new Date(vigenciaFin);
        fin.setHours(23, 59, 59, 999);

        if (fin < today) {
            return { label: 'Vencido', color: '#fee2e2', textColor: '#b91c1c' };
        }

        const diffDays = Math.round((fin - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
            return { label: 'Próximo a vencer', color: '#fef3c7', textColor: '#92400e' };
        }

        return { label: 'Vigente', color: '#dcfce7', textColor: '#166534' };
    },

    formatDate(value) {
        if (!value) return 'Sin fecha';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    escapeAttr(value) {
        return this.escapeHtml(value).replace(/`/g, '&#96;');
    }
};

if (typeof window !== 'undefined') window.SegurosUnidadesController = SegurosUnidadesController;
