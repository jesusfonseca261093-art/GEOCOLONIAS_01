// signature-controller.js - Controlador para firmas digitales

const SignatureController = {
    // Función genérica para inicializar cualquier canvas de firma
    initCanvas(canvasId, stateObject, stateProperty) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        // Ajustar al tamaño del contenedor CSS para que no se distorsione
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1e293b';

        let drawing = false;

        const getPos = (e) => {
            const b = canvas.getBoundingClientRect();
            const x = (e.touches ? e.touches[0].clientX : e.clientX) - b.left;
            const y = (e.touches ? e.touches[0].clientY : e.clientY) - b.top;
            return { x, y };
        };

        const start = (e) => { 
            if (e.type === 'touchstart') e.preventDefault();
            drawing = true; 
            const p = getPos(e); 
            ctx.beginPath(); 
            ctx.moveTo(p.x, p.y); 
        };

        const move = (e) => { 
            if (!drawing) return;
            e.preventDefault(); 
            const p = getPos(e); 
            ctx.lineTo(p.x, p.y); 
            ctx.stroke(); 
        };

        const stop = () => { 
            if (drawing) {
                drawing = false;
                // Guardar en la propiedad del estado especificada
                // Esto permite usarlo con appState.signature, appState.supervisionData.firma, etc.
                let obj = stateObject;
                const props = stateProperty.split('.');
                for (let i = 0; i < props.length - 1; i++) {
                    obj = obj[props[i]];
                }
                obj[props[props.length - 1]] = canvas.toDataURL();
            }
        };

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        canvas.addEventListener('mouseup', stop);
        canvas.addEventListener('touchstart', start, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        canvas.addEventListener('touchend', stop);
    },

    // Limpiar un canvas por su ID
    clearCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Aquí no se necesita modificar el appState, porque al volver a firmar se sobreescribe.
        }
    },
    
    // --- Métodos antiguos (se mantienen por retrocompatibilidad si se usan en otro lado) ---
    
    // Inicializar canvas de firma del checklist
    initSignatureCanvas() {
        this.initCanvas('sigCanvas', App.appState, 'signature');
    },
    
    // Limpiar firma del checklist
    clearSignature(appState) {
        this.clearCanvas('sigCanvas');
        appState.signature = null;
    },
    
    // Inicializar canvas de firma para orden
    initFirmaCanvas(canvasId, tipo) {
        const property = tipo === 'taller' ? 'firmaTaller' : 'firmaChofer';
        this.initCanvas(canvasId, App.appState, property);
    },
    
    // Limpiar firma de orden
    limpiarFirma(tipo, appState) {
        const canvasId = tipo === 'taller' ? 'firmaTallerCanvas' : 'firmaChoferCanvas';
        this.clearCanvas(canvasId);
        if (tipo === 'taller') appState.firmaTaller = null;
        else appState.firmaChofer = null;
    },
    
    // Limpiar firma de taller específicamente
    limpiarFirmaTaller(appState) {
        this.limpiarFirma('taller', appState);
    },
    
    // Limpiar firma de chofer específicamente
    limpiarFirmaChofer(appState) {
        this.limpiarFirma('chofer', appState);
    },

    // Inicializar canvas de firma para supervisión
    initSupervisionCanvas() {
        this.initCanvas('supervisionSigCanvas', App.appState, 'supervisionData.firmaSupervisor');
    },

    // Limpiar firma de supervisión
    clearSupervisionSignature(appState) {
        this.clearCanvas('supervisionSigCanvas');
        appState.supervisionData.firmaSupervisor = null;
    }
};

// Exportar controlador para uso global
if (typeof window !== 'undefined') {
    window.SignatureController = SignatureController;
}