let accionActual = 'login';

function switchTab(tab) {
    accionActual = tab;
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const btnText = document.getElementById('btn-text');
    const errorDiv = document.getElementById('auth-error');
    
    errorDiv.style.display = 'none';

    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('remove'); // Limpieza de clases activa
        tabRegister.classList.remove('active');
        btnText.innerText = 'Iniciar Sesión';
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        btnText.innerText = 'Crear Cuenta';
    }
}

async function procesarAuth() {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const errorDiv = document.getElementById('auth-error');

    if (!username || !password) {
        errorDiv.innerText = 'Completa todos los campos.';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const res = await fetch('api/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: accionActual,
                username: username,
                password: password
            })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Error en la autenticación.');
        }

        if (accionActual === 'login') {
            // Persistencia en frío del usuario activo
            localStorage.setItem('user', data.username);
            window.location.href = 'index.html';
        } else {
            alert('Cuenta creada con éxito. Ahora puedes iniciar sesión.');
            switchTab('login');
            document.getElementById('auth-password').value = '';
        }

    } catch (error) {
        errorDiv.innerText = error.message;
        errorDiv.style.display = 'block';
    }
}