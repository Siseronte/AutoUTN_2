document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const successMessage = document.getElementById('success-message');

    // Campos y errores
    const legajoInput = document.getElementById('legajo-registro');
    const legajoError = document.getElementById('legajo-error');
    const dniInput = document.getElementById('dni');
    const dniError = document.getElementById('dni-error');
    const emailInput = document.getElementById('email-registro');
    const emailError = document.getElementById('email-error');
    const passwordRegistroInput = document.getElementById('password-registro');
    const passwordError = document.getElementById('password-error');
    const passwordConfirmInput = document.getElementById('password-confirm');
    const passwordConfirmError = document.getElementById('password-confirm-error');
    const togglePasswordIcon = document.getElementById('togglePassword');
    const toggleConfirmPasswordIcon = document.getElementById('toggleConfirmPassword');

    // Expresión regular para validar email (permite dominios UTN)
    const emailRegex = /^[a-z]+[0-9]*@(alumnos\.)?frh\.utn\.edu\.ar$/;


    // Función para validar campos numéricos en tiempo real
    const validateNumericInput = (input, maxLength) => {
        let value = input.value.replace(/\D/g, ''); // Eliminar no dígitos
        if (value.length > maxLength) {
            value = value.slice(0, maxLength);
        }
        input.value = value;
    };

    legajoInput?.addEventListener('input', () => validateNumericInput(legajoInput, 5));
    dniInput?.addEventListener('input', () => validateNumericInput(dniInput, 8));

    // Función para alternar la visibilidad de la contraseña
    const togglePasswordVisibility = (inputElement, iconElement) => {
        const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
        inputElement.setAttribute('type', type);
        iconElement.classList.toggle('fa-eye');
        iconElement.classList.toggle('fa-eye-slash');
    };

    togglePasswordIcon?.addEventListener('click', () => togglePasswordVisibility(passwordRegistroInput, togglePasswordIcon));
    toggleConfirmPasswordIcon?.addEventListener('click', () => togglePasswordVisibility(passwordConfirmInput, toggleConfirmPasswordIcon));

    // Funciones auxiliares para mostrar/ocultar errores
    const showError = (errorElement, message) => {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    };

    const hideError = (errorElement) => {
        errorElement.style.display = 'none';
    };

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let isValid = true;

            // Ocultar todos los errores antes de validar
            [legajoError, dniError, emailError, passwordError, passwordConfirmError].forEach(hideError);

            // --- Validación Legajo ---
            if (legajoInput.value.length !== 5) {
                showError(legajoError, 'El legajo debe tener 5 números.');
                isValid = false;
            }

            // --- Validación DNI ---
            if (dniInput.value.length !== 8) {
                showError(dniError, 'El DNI debe tener 8 números.');
                isValid = false;
            }

            // --- Validación Email ---
            if (!emailRegex.test(emailInput.value)) {
                showError(emailError, 'Usa un email institucional de la UTN FRH.');
                isValid = false;
            }

            // --- Validación Contraseña (mínimo 6 caracteres) ---
            if (passwordRegistroInput.value.length < 6) {
                showError(passwordError, 'La contraseña debe tener al menos 6 caracteres.');
                isValid = false;
            }

            // --- Validación Repetir Contraseña (mínimo 6 caracteres y coincidencia) ---
            if (passwordConfirmInput.value.length < 6) {
                showError(passwordConfirmError, 'La contraseña debe tener al menos 6 caracteres.');
                isValid = false;
            } else if (passwordRegistroInput.value !== passwordConfirmInput.value) {
                showError(passwordConfirmError, 'Las contraseñas no coinciden.');
                isValid = false;
            }

            if (!isValid) {
                return; // Detiene el envío si algo es inválido
            }

            // Si toda la validación es exitosa
            const formData = {
                nombre: document.getElementById('nombre').value,
                apellido: document.getElementById('apellido').value,
                legajo: legajoInput.value,
                dni: dniInput.value,
                email: emailInput.value,
                password: passwordRegistroInput.value
            };

            fetch('http://localhost:3000/api/registro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })
            .then(response => {
                if (!response.ok) {
                    // Si la respuesta no es 2xx, lanza un error para que lo capture el .catch
                    return response.json().then(err => { throw new Error(err.message || 'Error en el registro') });
                }
                return response.json();
            })
            .then(async (data) => {
                console.log('Registro exitoso:', data.message);

                // Ahora, intentamos iniciar sesión automáticamente
                const loginResult = await authManager.login(formData.legajo, formData.password);

                if (loginResult.success) {
                    // Si el login es exitoso, redirigir al dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    // Si el login falla por alguna razón, mostrar un mensaje y redirigir al index para que inicie sesión manualmente
                    alert('Registro completado. Por favor, inicia sesión.');
                    window.location.href = 'index.html';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(`Error al registrar: ${error.message}`); // Muestra un error al usuario
            });
        });
    }

    // Ocultar mensajes de error mientras se escribe
    const inputs = [
        legajoInput,
        dniInput,
        emailInput,
        passwordRegistroInput,
        passwordConfirmInput
    ];

    inputs.forEach(input => {
        input?.addEventListener('input', () => {
            const errorMap = {
                'legajo-registro': legajoError,
                'dni': dniError,
                'email-registro': emailError,
                'password-registro': passwordError,
                'password-confirm': passwordConfirmError
            };
            hideError(errorMap[input.id]);
        });
    });
});
