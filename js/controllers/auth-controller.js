// auth-controller.js - Lógica de inicio de sesión con Supabase Auth

const AuthController = {
    GEOCERCAS_ONLY_EMAIL: 'pedidosgen@gasen.mx',
    VALID_ROLES: ['admin', 'cilindros', 'autotanque', 'estaciones', 'supervisor', 'geocercas', 'slp'],

    togglePassword() {
        const input = document.getElementById('loginPassword');
        const button = document.querySelector('.login-password-toggle');
        if (!input || !button) return;
        const showPassword = input.type === 'password';
        input.type = showPassword ? 'text' : 'password';
        button.setAttribute('aria-pressed', String(showPassword));
        button.setAttribute('aria-label', showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
        const icon = button.querySelector('i');
        if (icon) icon.className = showPassword ? 'bx bx-hide' : 'bx bx-show';
        input.focus();
    },

    showLoginError(message) {
        const alertBox = document.getElementById('loginError');
        const alertText = document.getElementById('loginErrorText');
        if (!alertBox || !alertText) return;
        alertText.textContent = message;
        alertBox.hidden = false;
    },

    getLoginErrorMessage(error) {
        const code = (error?.code || '').toLowerCase();
        const message = (error?.message || '').toLowerCase();

        if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
            return 'La cuenta no existe en Supabase o la contraseña es incorrecta.';
        }
        if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
            return 'La cuenta existe, pero falta confirmar el correo en Supabase.';
        }
        if (message.includes('acceso denegado')) return error.message;
        if (message.includes('rate limit') || code.includes('rate_limit')) {
            return 'Se realizaron demasiados intentos. Espera unos minutos e inténtalo nuevamente.';
        }
        return 'No se pudo conectar con el servicio de acceso. Inténtalo nuevamente.';
    },

    getRoleForUser(user, fallbackEmail = '') {
        const userEmail = (user?.email || fallbackEmail || '').trim().toLowerCase();
        const role = (user?.user_metadata?.role || '').trim().toLowerCase();

        if (userEmail === this.GEOCERCAS_ONLY_EMAIL) return 'geocercas';
        if (userEmail.startsWith('admin')) return 'admin';
        if (userEmail.startsWith('cilindros')) return 'cilindros';
        if (userEmail.startsWith('autotanque')) return 'autotanque';
        if (userEmail.startsWith('estaciones')) return 'estaciones';
        if (userEmail.startsWith('slp')) return 'slp';

        return role || 'supervisor';
    },

    // Manejar el envío del formulario de login
    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const btn = document.getElementById('loginBtn');

        const alertBox = document.getElementById('loginError');
        if (alertBox) alertBox.hidden = true;

        if (!email || !password) {
            this.showLoginError('Completa tu correo y contraseña para continuar.');
            document.getElementById(!email ? 'loginEmail' : 'loginPassword')?.focus();
            return;
        }

        btn.classList.add('is-loading');
        btn.disabled = true;
        btn.setAttribute('aria-busy', 'true');
        
        try {
            const client = StorageService.init();
            if (!client) throw new Error("Supabase no está configurado.");
            
            // 1. Iniciar sesión directo en Supabase
            const { data, error } = await client.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            // 2. Extraer y normalizar el rol
            const role = this.getRoleForUser(data.user, email);
            
            if (!this.VALID_ROLES.includes(role)) {
                await client.auth.signOut(); // Cierra la sesión inmediatamente si no tiene rol válido
                throw new Error(`Acceso denegado: Tu rol actual es '${role || 'NINGUNO'}'. No tienes permisos válidos.`);
            }
            
            // 3. Guardarlo en el estado de la app
            App.appState.userRole = role;
            App.appState.user = data.user;
            
            // 4. Redirigir al menú principal (que ahora es exclusivo para logueados)
            App.goToStep('home');
            
        } catch (error) {
            console.error("Error en login:", error);
            this.showLoginError(this.getLoginErrorMessage(error));
            document.getElementById('loginPassword')?.focus();
        } finally {
            btn.classList.remove('is-loading');
            btn.disabled = false;
            btn.removeAttribute('aria-busy');
        }
    },
    
    // Verificar si el usuario ya había iniciado sesión previamente
    async checkActiveSession() {
        try {
            const client = StorageService.init();
            if (!client) return;
            
            const { data: { session } } = await client.auth.getSession();
            if (session) {
                const role = this.getRoleForUser(session.user);
                
                if (this.VALID_ROLES.includes(role)) {
                    App.appState.userRole = role;
                    App.appState.user = session.user;
                } else {
                    await client.auth.signOut(); // Si le quitaron el rol, lo saca
                }
            }
        } catch (error) {
            console.error("Error recuperando sesión:", error);
        }
    },
    
    // Cerrar sesión
    async logout() {
        const client = StorageService.init();
        if (client) await client.auth.signOut();
        App.appState.userRole = null;
        App.appState.user = null;
        App.goToStep('login');
    }
};

if (typeof window !== 'undefined') window.AuthController = AuthController;
