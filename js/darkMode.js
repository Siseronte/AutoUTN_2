// js/darkMode.js

/**
 * Módulo para gestionar el modo oscuro.
 * Se exporta como un objeto para ser utilizado por otros scripts como ui.js.
 */
const darkMode = {
    // El método init se llama una vez cuando la página carga.
    init() {
        this.body = document.body;
        this.applyPageSpecificClass(); // Aplica una clase CSS al body según la página actual.
        
        // Comprueba si el modo oscuro estaba activado en la visita anterior.
        if (localStorage.getItem('darkMode') === 'enabled') {
            this.enable();
        }
    },
    
    // Alterna entre modo claro y oscuro.
    toggle() {
        if (this.body.classList.contains('dark-mode')) {
            this.disable();
        } else {
            this.enable();
        }
    },
    
    // Activa el modo oscuro.
    enable() {
        this.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');

    },
    
    // Desactiva el modo oscuro.
    disable() {
        this.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
    },
    
    // Añade una clase al body para estilos específicos de página (ej. 'home-page').
    applyPageSpecificClass() {
        const path = window.location.pathname;
        const pageName = path.substring(path.lastIndexOf('/') + 1);
        
        if (pageName === 'index.html' || pageName === '') {
            this.body.classList.add('home-page');
        } else {
            // Convierte 'reserva.html' a 'reserva-page'
            const className = pageName.replace('.html', '-page');
            this.body.classList.add(className);
        }
    }
};