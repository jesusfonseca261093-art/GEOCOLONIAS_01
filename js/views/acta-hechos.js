// acta-hechos.js - Vista para Acta de Hechos

const ActaHechosView = {
    canvasIds: ['canv-enterado', 'canv-levanta', 'canv-testigo1', 'canv-testigo2'],

    render() {
        const logoUrl = (typeof CONFIG !== 'undefined' && CONFIG.LOGO_URL) ? CONFIG.LOGO_URL : 'img/Logo.png';

        return `
            <div class="acta-hechos-view">
                <div class="header" style="background: #991b1b; border-bottom: none; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button onclick="toggleMenu()" class="btn-icon" style="color: white; font-size: 26px;">
                            <i class='bx bx-menu'></i>
                        </button>
                        <img src="${logoUrl}" onclick="toggleMenu()" alt="Logo" style="height: 35px; cursor: pointer; object-fit: contain;">
                        <div class="logo" style="font-weight: 600; font-size: 16px; color: white;">Acta de Hechos</div>
                    </div>
                    <button onclick="App.goToStep('home')" class="btn-icon" title="Volver al inicio" style="color: white;">
                        <i class='bx bx-home-alt'></i>
                    </button>
                </div>

                <div id="acta-hechos-root" class="no-print max-w-5xl mx-auto p-4 md:p-8 space-y-6">
                    <div class="bg-white p-6 rounded-xl shadow-2xl border-t-8 border-red-600">
                        <div class="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
                            <h1 class="text-xl sm:text-2xl text-center sm:text-left font-bold text-gray-800 uppercase">Acta de Hechos - Registro</h1>
                            <div>
                                <img src="${logoUrl}" alt="logo" class="w-36 sm:w-48 md:w-64 h-auto">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div class="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                                <label class="block text-xs font-bold text-blue-800 mb-2 uppercase italic">1. Informacion de Fecha y Lugar</label>
                                <input type="date" id="input-fecha" class="w-full border p-2 rounded mb-3 focus:ring-2 focus:ring-blue-400 outline-none">
                                <input
                                    type="text"
                                    id="input-ubicacion"
                                    placeholder="Domicilio donde ocurrio el evento"
                                    class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                                >
                            </div>
                            <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                                <label class="block text-xs font-bold text-gray-700 mb-2 uppercase italic">2. Relato de Hechos</label>
                                <textarea id="input-hechos" placeholder="Acontecimiento (SUPERVISOR REDACTA...)" rows="2" class="w-full border p-2 rounded text-sm mb-2 focus:ring-2 focus:ring-gray-400 outline-none"></textarea>
                                <textarea id="input-trabajador" placeholder="Redaccion del trabajador..." rows="2" class="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-gray-400 outline-none"></textarea>
                            </div>
                        </div>

                        <div class="mb-6 p-4 bg-red-50 rounded-lg border border-red-100">
                            <label class="block text-xs font-bold text-red-800 mb-3 uppercase italic">3. Firmas (Cada persona tiene que firmar en su nombre)</label>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div class="space-y-1">
                                    <input type="text" id="name-enterado" class="w-full border p-2 text-xs font-bold uppercase" placeholder="Nombre: de quien se le levanta acta">
                                    <canvas id="canv-enterado" width="400" height="150" class="w-full h-24 rounded"></canvas>
                                    <button onclick="ActaHechosView.clearSig('canv-enterado')" class="text-[10px] bg-white border px-2 py-1 rounded text-red-500 font-bold uppercase">Limpiar</button>
                                </div>
                                <div class="space-y-1">
                                    <input type="text" id="name-levanta" class="w-full border p-2 text-xs font-bold uppercase" placeholder="Nombre: Supervisor quien levanta acta">
                                    <canvas id="canv-levanta" width="400" height="150" class="w-full h-24 rounded"></canvas>
                                    <button onclick="ActaHechosView.clearSig('canv-levanta')" class="text-[10px] bg-white border px-2 py-1 rounded text-red-500 font-bold uppercase">Limpiar</button>
                                </div>
                                <div class="space-y-1">
                                    <input type="text" id="name-testigo1" class="w-full border p-2 text-xs font-bold uppercase" placeholder="Nombre: Testigo 1">
                                    <canvas id="canv-testigo1" width="400" height="150" class="w-full h-24 rounded"></canvas>
                                    <button onclick="ActaHechosView.clearSig('canv-testigo1')" class="text-[10px] bg-white border px-2 py-1 rounded text-red-500 font-bold uppercase">Limpiar</button>
                                </div>
                                <div class="space-y-1">
                                    <input type="text" id="name-testigo2" class="w-full border p-2 text-xs font-bold uppercase" placeholder="Nombre: Testigo 2">
                                    <canvas id="canv-testigo2" width="400" height="150" class="w-full h-24 rounded"></canvas>
                                    <button onclick="ActaHechosView.clearSig('canv-testigo2')" class="text-[10px] bg-white border px-2 py-1 rounded text-red-500 font-bold uppercase">Limpiar</button>
                                </div>
                            </div>
                        </div>

                        <div class="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div class="flex justify-between items-center mb-2">
                                <label class="block text-xs font-bold text-yellow-800 uppercase italic">4. Seleccionar fotos de la Galeria (Maximo 10)</label>
                                <span id="photo-count" class="text-xs font-bold text-yellow-700 bg-yellow-200 px-2 py-1 rounded">0 / 10 fotos</span>
                            </div>
                            <input type="file" id="input-fotos" multiple accept="image/*" class="w-full text-sm bg-white border p-3 rounded cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100">
                            <p id="photo-warning" class="text-red-600 text-[10px] font-bold mt-2 hidden uppercase">Has seleccionado demasiadas fotos. Por favor, elige hasta 10.</p>
                        </div>

                        <div class="flex flex-col sm:flex-row sm:justify-center gap-3">
                            <button id="btn-preview" onclick="ActaHechosView.previewActa()" class="w-full sm:w-[360px] bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-base uppercase tracking-widest">
                                Previsualizar en Otra Pantalla
                            </button>
                            <button id="btn-print" onclick="ActaHechosView.printActa()" class="w-full sm:w-[360px] bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-3 text-base uppercase tracking-widest hidden">
                                Descargar PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div id="preview-container" class="hidden acta-docs">
                    <div id="hoja1" class="print-page">
                        <img class="page-watermark" src="${logoUrl}" alt="Marca de agua GEN">
                        <div class="print-header">
                            <img src="${logoUrl}" alt="Logo GEN">
                        </div>
                        <div class="acta-title">ACTA DE HECHOS</div>

                        <p class="acta-intro text-justificado">
                            En las instalaciones de la empresa <strong>GAS EXPRESS NIETO, SA DE CV</strong> siendo el dia <span id="print-fecha" class="acta-date"></span>, se levanta la presente con la finalidad de hacer de su conocimiento que derivado de haber incurrido en algun acontecimiento que afecte el orden de la empresa.
                        </p>

                        <div class="acta-text-block">
                            <span class="acta-text-block-title">SUPERVISOR REDACTA</span>
                            <div id="print-hechos" class="acta-written-text"></div>
                            <div class="acta-writing-lines">
                                <span></span>
                                <span></span>
                            </div>
                        </div>

                        <div class="acta-text-block">
                            <span class="acta-text-block-title">TRABAJADOR REDACTA:</span>
                            <div id="print-trabajador" class="acta-written-text"></div>
                            <div class="acta-writing-lines">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>

                        <div class="signature-grid">
                            <div class="signature-group">
                                <div class="acta-signature-container">
                                    <p class="signature-label">ENTERADO (A)</p>
                                    <div class="signature-slot">
                                        <img id="img-canv-enterado" class="signature-img" alt="Firma enterado (a)" style="visibility:hidden;">
                                    </div>
                                    <div class="line-black"></div>
                                    <div id="out-name-enterado" class="signature-name"></div>
                                    <p class="signature-caption">NOMBRE Y FIRMA</p>
                                </div>

                                <div class="acta-signature-container">
                                    <p class="signature-label">TESTIGO</p>
                                    <div class="signature-slot">
                                        <img id="img-canv-testigo1" class="signature-img" alt="Firma testigo 1" style="visibility:hidden;">
                                    </div>
                                    <div class="line-black"></div>
                                    <div id="out-name-testigo1" class="signature-name"></div>
                                    <p class="signature-caption">NOMBRE Y FIRMA</p>
                                </div>
                            </div>

                            <div class="signature-group">
                                <div class="acta-signature-container">
                                    <p class="signature-label">SUPERVISOR</p>
                                    <div class="signature-slot">
                                        <img id="img-canv-levanta" class="signature-img" alt="Firma supervisor" style="visibility:hidden;">
                                    </div>
                                    <div class="line-black"></div>
                                    <div id="out-name-levanta" class="signature-name"></div>
                                    <p class="signature-caption">NOMBRE Y FIRMA</p>
                                </div>

                                <div class="acta-signature-container">
                                    <p class="signature-label">TESTIGO</p>
                                    <div class="signature-slot">
                                        <img id="img-canv-testigo2" class="signature-img" alt="Firma testigo 2" style="visibility:hidden;">
                                    </div>
                                    <div class="line-black"></div>
                                    <div id="out-name-testigo2" class="signature-name"></div>
                                    <p class="signature-caption">NOMBRE Y FIRMA</p>
                                </div>
                            </div>
                        </div>

                        <div class="director-signature">
                            <div class="director-signature-line"></div>
                            <p><strong>Ing. EDUARDO MARTIN PRIETO MICHEL</strong></p>
                            <p>GERENTE GENERAL</p>
                        </div>
                    </div>

                    <div id="hoja2" class="print-page page-break annex-page">
                        <img class="page-watermark" src="${logoUrl}" alt="Marca de agua GEN">
                        <div class="print-header">
                            <img src="${logoUrl}" alt="Logo GEN">
                        </div>
                        <div class="annex-title">Anexo de Evidencia</div>

                        <div class="annex-location">
                            <span>Domicilio del Evento:</span>
                            <p id="print-ubicacion-txt"></p>
                        </div>

                        <div id="print-photos-grid"></div>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        const inputFecha = document.getElementById('input-fecha');
        if (!inputFecha) return;

        inputFecha.value = new Date().toISOString().split('T')[0];
        this.updatePrintedDate(inputFecha.value);
        inputFecha.addEventListener('input', () => this.updatePrintedDate(inputFecha.value));
        inputFecha.addEventListener('change', () => this.updatePrintedDate(inputFecha.value));

        this.bindText('input-hechos', 'print-hechos');
        this.bindText('input-trabajador', 'print-trabajador');
        this.bindText('input-ubicacion', 'print-ubicacion-txt');
        this.bindText('name-enterado', 'out-name-enterado');
        this.bindText('name-levanta', 'out-name-levanta');
        this.bindText('name-testigo1', 'out-name-testigo1');
        this.bindText('name-testigo2', 'out-name-testigo2');

        this.canvasIds.forEach((canvasId) => this.initCanvasSignature(canvasId));

        const fotosInput = document.getElementById('input-fotos');
        if (fotosInput) {
            fotosInput.addEventListener('change', (event) => this.handlePhotoSelection(event));
        }
    },

    getFechaLarga(dateValue) {
        const date = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date();
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${date.getDate()} de ${meses[date.getMonth()]} del ${date.getFullYear()}`;
    },

    updatePrintedDate(dateValue) {
        const printFecha = document.getElementById('print-fecha');
        if (printFecha) {
            printFecha.textContent = this.getFechaLarga(dateValue);
        }
    },

    bindText(inputId, outputId) {
        const input = document.getElementById(inputId);
        const output = document.getElementById(outputId);
        if (!input || !output) return;

        const update = () => {
            output.textContent = (input.value || '').trim();
        };

        input.addEventListener('input', update);
        input.addEventListener('change', update);
        update();
    },

    initCanvasSignature(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let drawing = false;

        ctx.strokeStyle = '#0000FF';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const getPos = (event) => {
            const rect = canvas.getBoundingClientRect();
            const source = event.touches ? event.touches[0] : event;
            return {
                x: (source.clientX - rect.left) * (canvas.width / rect.width),
                y: (source.clientY - rect.top) * (canvas.height / rect.height)
            };
        };

        const start = (event) => {
            if (event.cancelable) event.preventDefault();
            drawing = true;
            const pos = getPos(event);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        };

        const move = (event) => {
            if (!drawing) return;
            if (event.cancelable) event.preventDefault();
            const pos = getPos(event);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        };

        const stop = () => {
            drawing = false;
        };

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', stop);
        canvas.addEventListener('touchstart', start, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        canvas.addEventListener('touchend', stop);
    },

    clearSig(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    },

    handlePhotoSelection(event) {
        const files = Array.from(event.target.files || []);
        const warning = document.getElementById('photo-warning');
        const counter = document.getElementById('photo-count');
        const grid = document.getElementById('print-photos-grid');

        if (!counter || !grid) return;

        if (files.length > 10) {
            if (warning) warning.classList.remove('hidden');
            event.target.value = '';
            grid.innerHTML = '';
            counter.textContent = '0 / 10 fotos';
            counter.className = 'text-xs font-bold text-red-700 bg-red-200 px-2 py-1 rounded';
            return;
        }

        if (warning) warning.classList.add('hidden');
        counter.textContent = `${files.length} / 10 fotos`;
        counter.className = 'text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded';
        grid.innerHTML = '';

        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const item = document.createElement('div');
                item.className = 'evidence-card';
                item.innerHTML = `
                    <div class="evidence-media">
                        <img src="${ev.target.result}" class="evidence-img" alt="Evidencia ${index + 1}">
                    </div>
                    <p class="evidence-label">Evidencia #${index + 1}</p>
                `;
                grid.appendChild(item);
            };
            reader.readAsDataURL(file);
        });
    },

    isCanvasBlank(canvas) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return true;
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] !== 0) return false;
        }
        return true;
    },

    renderSignatures() {
        this.canvasIds.forEach((canvasId) => {
            const canvas = document.getElementById(canvasId);
            const img = document.getElementById(`img-${canvasId}`);
            if (!canvas || !img) return;

            if (this.isCanvasBlank(canvas)) {
                img.removeAttribute('src');
                img.style.visibility = 'hidden';
                return;
            }

            img.src = canvas.toDataURL('image/png');
            img.style.visibility = 'visible';
        });
    },

    buildPdfMarkup() {
        const hoja1 = document.getElementById('hoja1');
        const hoja2 = document.getElementById('hoja2');
        if (!hoja1 || !hoja2) return '';

        const photosGrid = hoja2.querySelector('#print-photos-grid');
        const hasEvidencePhotos = !!photosGrid && photosGrid.children.length > 0;
        return hasEvidencePhotos ? `${hoja1.outerHTML}${hoja2.outerHTML}` : hoja1.outerHTML;
    },

    getPdfFileName() {
        const fecha = document.getElementById('input-fecha')?.value || new Date().toISOString().split('T')[0];
        return `Acta_de_Hechos_${fecha}.pdf`;
    },

    waitForImages(container) {
        const images = Array.from(container.querySelectorAll('img')).filter((img) => !img.complete);
        if (!images.length) return Promise.resolve();

        return Promise.all(images.map((img) => new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
        })));
    },

    getJsPdfConstructor() {
        return window.jspdf?.jsPDF || window.jsPDF || null;
    },

    async downloadPdf() {
        const JsPdf = this.getJsPdfConstructor();
        if (typeof html2canvas === 'undefined' || !JsPdf) {
            alert('No se pudo cargar la libreria para generar el PDF. Revisa tu conexion e intenta de nuevo.');
            return;
        }

        this.renderSignatures();

        const markup = this.buildPdfMarkup();
        if (!markup) return;

        const exportContainer = document.createElement('div');
        exportContainer.className = 'acta-docs acta-pdf-export';
        exportContainer.innerHTML = markup;
        document.body.appendChild(exportContainer);

        try {
            await this.waitForImages(exportContainer);
            if (document.fonts?.ready) await document.fonts.ready;

            const pages = Array.from(exportContainer.querySelectorAll('.print-page'));
            const pdf = new JsPdf({
                orientation: 'portrait',
                unit: 'mm',
                format: [215.9, 279.4],
                compress: true
            });

            for (let index = 0; index < pages.length; index += 1) {
                const page = pages[index];
                const canvas = await html2canvas(page, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    allowTaint: true,
                    scrollX: 0,
                    scrollY: 0,
                    width: page.offsetWidth,
                    height: page.offsetHeight,
                    windowWidth: page.offsetWidth,
                    windowHeight: page.offsetHeight
                });

                if (index > 0) pdf.addPage([215.9, 279.4], 'portrait');
                pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, 215.9, 279.4);
            }

            pdf.save(this.getPdfFileName());
        } finally {
            exportContainer.remove();
        }
    },

    openPdfPreviewWindow(autoPrint) {
        const previewMarkup = this.buildPdfMarkup();
        if (!previewMarkup) return;

        const previewWindow = window.open('', '_blank');
        if (!previewWindow) {
            alert('El navegador bloqueo la ventana de previsualizacion. Habilita ventanas emergentes para continuar.');
            return;
        }

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="${window.location.href}">
    <title>Previsualizacion PDF - Acta de Hechos</title>
    <link rel="stylesheet" href="css/acta-hechos.css">
    <style>
        body {
            margin: 0;
            background: #e5e7eb;
            font-family: 'Tinos', serif;
        }
        .preview-actions {
            position: sticky;
            top: 0;
            z-index: 2000;
            display: flex;
            justify-content: center;
            gap: 10px;
            padding: 12px;
            background: #ffffff;
            border-bottom: 1px solid #d1d5db;
        }
        .preview-actions button {
            border: none;
            border-radius: 8px;
            padding: 10px 14px;
            color: #fff;
            font-weight: 700;
            cursor: pointer;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            font-size: 12px;
        }
        .btn-print { background: #dc2626; }
        .btn-close { background: #374151; }
        #preview-shell {
            padding: 14px 10px 30px;
            overflow: auto;
        }
        #preview-shell .print-page {
            margin: 16px auto;
        }
        @media print {
            .preview-actions { display: none !important; }
            body { background: #fff; }
            #preview-shell { padding: 0 !important; }
            #preview-shell .print-page {
                margin: 0 !important;
                box-shadow: none !important;
            }
        }
    </style>
</head>
<body>
    <div class="preview-actions">
        <button class="btn-print" onclick="window.opener.ActaHechosView.downloadPdf()">Descargar PDF</button>
        <button class="btn-close" onclick="window.close()">Cerrar</button>
    </div>
    <div id="preview-shell" class="acta-docs">${previewMarkup}</div>
    <script>
        function waitForPreviewAssets() {
            var images = Array.from(document.images).filter(function (img) { return !img.complete; });
            var imagePromises = images.map(function (img) {
                return new Promise(function (resolve) {
                    img.addEventListener('load', resolve, { once: true });
                    img.addEventListener('error', resolve, { once: true });
                });
            });
            var fontPromise = document.fonts ? document.fonts.ready : Promise.resolve();
            return Promise.all([fontPromise].concat(imagePromises));
        }
        ${autoPrint ? "window.addEventListener('load', function () { waitForPreviewAssets().then(function () { setTimeout(function () { window.opener.ActaHechosView.downloadPdf(); }, 250); }); });" : ''}
    <\/script>
</body>
</html>`;

        previewWindow.document.open();
        previewWindow.document.write(html);
        previewWindow.document.close();
    },

    previewActa() {
        this.renderSignatures();
        const printButton = document.getElementById('btn-print');
        if (printButton) printButton.classList.remove('hidden');
        this.openPdfPreviewWindow(false);
    },

    printActa() {
        this.downloadPdf();
    }
};

if (typeof window !== 'undefined') {
    window.ActaHechosView = ActaHechosView;
}
