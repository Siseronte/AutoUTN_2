document.addEventListener('DOMContentLoaded', () => {

    const validateNumericInput = (input, maxLength) => {
        let value = input.value.replace(/\D/g, '');
        if (value.length > maxLength) {
            value = value.slice(0, maxLength);
        }
        input.value = value;
    };


    const staticLoginForm = document.getElementById('static-login-form');
    const legajoStaticInput = document.getElementById('legajo-static');


    if (legajoStaticInput) {
        legajoStaticInput.addEventListener('input', () => validateNumericInput(legajoStaticInput, 5));
    }


    if (staticLoginForm) {
        staticLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const legajo = legajoStaticInput.value;
            const password = document.getElementById('password-static').value;


            if (legajo.length !== 5) {
                showMessage('El legajo debe tener exactamente 5 números.', 'error');
                return;
            }

            if (!password) {
                showMessage('La contraseña es obligatoria.', 'error');
                return;
            }


            showMessage('Iniciando sesión...', 'info');
            

            const result = await authManager.login(legajo, password);
            
            if (result.success) {
                showMessage('¡Login exitoso! Redirigiendo...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showMessage(result.message, 'error');
            }
        });
    }


    function showMessage(message, type) {

        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }


        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        

        const form = document.getElementById('static-login-form');
        if (form) {
            form.parentNode.insertBefore(messageDiv, form);
            

            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }
});
