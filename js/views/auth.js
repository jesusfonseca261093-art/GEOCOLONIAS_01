// auth.js - Vista de autenticacion

const AuthView = {
    renderLogin() {
        return `
            <main class="login-page">
                <div class="login-decoration login-decoration-one" aria-hidden="true"></div>
                <div class="login-decoration login-decoration-two" aria-hidden="true"></div>
                <section class="login-shell" aria-labelledby="loginTitle">
                    <div class="login-brand-panel">
                        <div class="login-brand-content">
                            <img src="${CONFIG.LOGO_URL}" alt="Gas Express Nieto" class="login-logo">
                            <span class="login-eyebrow">Control operativo</span>
                            <h1>Tu operación,<br>siempre bajo control.</h1>
                            <p>Consulta, registra y da seguimiento a la información de tus unidades desde un solo lugar.</p>
                        </div>
                        <div class="login-brand-footer">
                            <i class='bx bx-shield-quarter' aria-hidden="true"></i>
                            <span>Acceso seguro para personal autorizado</span>
                        </div>
                    </div>
                    <div class="login-form-panel">
                        <div class="login-form-wrap">
                            <div class="login-mobile-logo"><img src="${CONFIG.LOGO_URL}" alt="Gas Express Nieto"></div>
                            <span class="login-eyebrow">Bienvenido</span>
                            <h2 id="loginTitle">Iniciar sesión</h2>
                            <p class="login-subtitle">Ingresa tus datos para continuar al sistema.</p>
                            <div id="loginError" class="login-alert" role="alert" aria-live="polite" hidden>
                                <i class='bx bx-error-circle' aria-hidden="true"></i><span id="loginErrorText"></span>
                            </div>
                            <form id="loginForm" onsubmit="AuthController.handleLogin(event)" novalidate>
                                <div class="login-field">
                                    <label for="loginEmail">Correo electrónico</label>
                                    <div class="login-input-wrap">
                                        <i class='bx bx-envelope' aria-hidden="true"></i>
                                        <input type="email" id="loginEmail" name="email" placeholder="nombre@empresa.com" autocomplete="username" inputmode="email" required aria-describedby="loginError">
                                    </div>
                                </div>
                                <div class="login-field">
                                    <label for="loginPassword">Contraseña</label>
                                    <div class="login-input-wrap">
                                        <i class='bx bx-lock-alt' aria-hidden="true"></i>
                                        <input type="password" id="loginPassword" name="password" placeholder="Ingresa tu contraseña" autocomplete="current-password" required aria-describedby="loginError">
                                        <button type="button" class="login-password-toggle" onclick="AuthController.togglePassword()" aria-label="Mostrar contraseña" aria-pressed="false"><i class='bx bx-show' aria-hidden="true"></i></button>
                                    </div>
                                </div>
                                <button type="submit" id="loginBtn" class="login-submit">
                                    <span class="login-btn-label">Ingresar</span><i class='bx bx-right-arrow-alt login-btn-arrow' aria-hidden="true"></i><span class="login-btn-spinner" aria-hidden="true"></span>
                                </button>
                            </form>
                            <p class="login-help"><i class='bx bx-help-circle' aria-hidden="true"></i> ¿Problemas para ingresar? Contacta al administrador.</p>
                        </div>
                    </div>
                </section>
            </main>`;
    }
};

if (typeof window !== 'undefined') window.AuthView = AuthView;
