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
                <div style="padding: 24px; border: 1px dashed #cbd5e1; border-radius: 16px; background: #f8fafc; text-align: center; color: #64748b;">
                    <div style="font-size: 32px; margin-bottom: 8px;">📄</div>
                    <strong>No hay seguros registrados todavía.</strong>
                    <div style="margin-top: 8px;">Agrega la primera póliza para empezar a administrar las unidades.</div>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = `
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse: collapse; min-width: 760px;">
                    <thead>
                        <tr style="background:#0f172a; color:white; text-align:left;">
                            <th style="padding: 12px;">Unidad</th>
                            <th style="padding: 12px;">Aseguradora</th>
                            <th style="padding: 12px;">Póliza</th>
                            <th style="padding: 12px;">Vigencia</th>
                            <th style="padding: 12px;">Estado</th>
                            <th style="padding: 12px;">PDF</th>
                            <th style="padding: 12px;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(record => {
                            const estado = this.getEstado(record.vigenciaFin);
                            return `
                                <tr style="border-bottom: 1px solid #e2e8f0; background: #fff;">
                                    <td style="padding: 12px; font-weight: 700; color:#0f172a;">${this.escapeHtml(record.unidad || 'Sin unidad')}</td>
                                    <td style="padding: 12px;">${this.escapeHtml(record.aseguradora || 'Sin aseguradora')}</td>
                                    <td style="padding: 12px;">${this.escapeHtml(record.numeroPoliza || 'Sin número')}</td>
                                    <td style="padding: 12px;">${this.escapeHtml(this.formatDate(record.vigenciaInicio))} - ${this.escapeHtml(this.formatDate(record.vigenciaFin))}</td>
                                    <td style="padding: 12px;">
                                        <span style="display:inline-block; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:700; background:${estado.color}; color:${estado.textColor};">
                                            ${estado.label}
                                        </span>
                                    </td>
                                    <td style="padding: 12px;">
                                        ${record.pdfUrl ? `<a href="${record.pdfUrl}" target="_blank" download="${this.escapeAttr(record.pdfName || `${record.unidad || 'seguro'}.pdf`)}" style="color:#2563eb; text-decoration:none; font-weight:600;">📄 Ver / Descargar</a>` : '<span style="color:#94a3b8;">Sin PDF</span>'}
                                    </td>
                                    <td style="padding: 12px;">
                                        <div style="display:flex; flex-wrap:wrap; gap:8px;">
                                            ${record.pdfUrl ? `<button onclick="SegurosUnidadesController.downloadPdf('${record.id}')" style="padding:6px 10px; border:none; border-radius:8px; background:#2563eb; color:white; cursor:pointer;">Descargar</button>` : ''}
                                            ${!isSupervisor ? `
                                                <button onclick="SegurosUnidadesController.openModal('${record.id}')" style="padding:6px 10px; border:none; border-radius:8px; background:#f59e0b; color:white; cursor:pointer;">Editar</button>
                                                <button onclick="SegurosUnidadesController.replacePdf('${record.id}')" style="padding:6px 10px; border:none; border-radius:8px; background:#0f766e; color:white; cursor:pointer;">Reemplazar PDF</button>
                                                <button onclick="SegurosUnidadesController.deleteRecord('${record.id}')" style="padding:6px 10px; border:none; border-radius:8px; background:#dc2626; color:white; cursor:pointer;">Eliminar</button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async openModal(id = null) {
        const record = id ? this.state.records.find(item => item.id === id) : null;
        const isEditing = Boolean(record);
        const content = `
            <div style="padding: 24px; max-width: 640px;">
                <h3 style="margin:0 0 16px; font-size: 22px; color:#0f172a;">${isEditing ? 'Editar póliza de seguro' : 'Agregar seguro de unidad'}</h3>
                <form id="seguros-form" onsubmit="SegurosUnidadesController.handleSubmit(event)">
                    <div style="display:grid; gap:12px;">
                        <input id="seguro-unidad" required placeholder="Unidad (ej. QI-1235)" value="${this.escapeAttr(record?.unidad || '')}" style="padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px;" />
                        <input id="seguro-aseguradora" required placeholder="Aseguradora" value="${this.escapeAttr(record?.aseguradora || '')}" style="padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px;" />
                        <input id="seguro-poliza" required placeholder="Número de póliza" value="${this.escapeAttr(record?.numeroPoliza || '')}" style="padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px;" />
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                            <label style="display:flex; flex-direction:column; gap:6px; font-size:14px; color:#334155;">
                                Inicio de vigencia
                                <input id="seguro-inicio" type="date" value="${this.escapeAttr(record?.vigenciaInicio || '')}" style="padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px;" />
                            </label>
                            <label style="display:flex; flex-direction:column; gap:6px; font-size:14px; color:#334155;">
                                Fin de vigencia
                                <input id="seguro-fin" type="date" value="${this.escapeAttr(record?.vigenciaFin || '')}" style="padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px;" />
                            </label>
                        </div>
                        <textarea id="seguro-observaciones" placeholder="Observaciones, contacto o notas" style="padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px; min-height:90px;">${this.escapeHtml(record?.observaciones || '')}</textarea>
                        <label style="display:flex; flex-direction:column; gap:6px; font-size:14px; color:#334155;">
                            PDF de la póliza
                            <input id="seguro-file" type="file" accept="application/pdf" style="padding:10px 0;" />
                        </label>
                        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top: 8px;">
                            <button type="button" onclick="ModalService.close()" style="padding:10px 14px; border:none; border-radius:10px; background:#e2e8f0; color:#0f172a; cursor:pointer;">Cancelar</button>
                            <button type="submit" style="padding:10px 14px; border:none; border-radius:10px; background:#2563eb; color:white; cursor:pointer;">Guardar</button>
                        </div>
                    </div>
                </form>
            </div>
        `;

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
        if (!confirm('¿Deseas eliminar este registro de seguro?')) return;
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
