// src/components/ThemeSwitcher.js - Modifica crearBotonDropdown

crearBotonDropdown: function() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) {
        setTimeout(() => this.crearBotonDropdown(), 100);
        return;
    }
    
    // Eliminar botón anterior si existe
    const existingBtn = document.getElementById('theme-dropdown');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    const temaActualObj = this.temas.find(t => t.id === this.temaActual);
    
    // Crear el dropdown container
    const dropdown = document.createElement('div');
    dropdown.className = 'theme-dropdown';
    dropdown.id = 'theme-dropdown';
    
    // Crear el botón principal
    const btn = document.createElement('button');
    btn.id = 'theme-dropdown-btn';
    btn.className = 'theme-dropdown-btn';
    btn.innerHTML = `
        <span class="theme-dropdown-icon">${temaActualObj.icono}</span>
        <span class="theme-dropdown-label">${temaActualObj.nombre}</span>
        <span class="theme-dropdown-arrow">▼</span>
    `;
    
    // Crear el menú desplegable
    const menu = document.createElement('div');
    menu.className = 'theme-dropdown-menu';
    menu.innerHTML = `
        <div class="theme-menu-header">
            <span>🎨</span>
            <span>Seleccionar tema</span>
        </div>
        <div class="theme-menu-options">
            ${this.temas.map(tema => `
                <button class="theme-option ${this.temaActual === tema.id ? 'active' : ''}" 
                        data-theme="${tema.id}">
                    <span class="theme-option-icon">${tema.icono}</span>
                    <div class="theme-option-info">
                        <div class="theme-option-name">${tema.nombre}</div>
                        <div class="theme-option-desc">${tema.descripcion}</div>
                    </div>
                    <div class="theme-option-color" style="background: ${tema.color}"></div>
                    ${this.temaActual === tema.id ? '<span class="theme-option-check">✓</span>' : ''}
                </button>
            `).join('')}
        </div>
    `;
    
    dropdown.appendChild(btn);
    dropdown.appendChild(menu);
    
    // LIMPIAR header-actions y reconstruir en orden
    // Guardar elementos existentes que queremos preservar
    const licenseBadge = headerActions.querySelector('.license-badge');
    const configBtn = headerActions.querySelector('.btn-icon, .config-btn');
    const logoutBtn = headerActions.querySelector('.btn-logout');
    
    // Limpiar header-actions
    while (headerActions.firstChild) {
        headerActions.removeChild(headerActions.firstChild);
    }
    
    // Reconstruir en el orden correcto
    headerActions.appendChild(dropdown);  // 1. Dropdown de temas
    
    if (licenseBadge) {
        headerActions.appendChild(licenseBadge);  // 2. Badge de licencia
    }
    
    // 3. Botón de configuración
    let configButton = configBtn;
    if (!configButton) {
        configButton = document.createElement('button');
        configButton.className = 'btn-icon config-btn';
        configButton.innerHTML = '⚙️';
        configButton.title = 'Configuración';
        configButton.onclick = () => {
            if (window.app && window.app.openConfiguracion) {
                window.app.openConfiguracion();
            } else {
                console.log('Configuración - próximamente');
            }
        };
    }
    headerActions.appendChild(configButton);
    
    // 4. Botón de salir
    let logoutButton = logoutBtn;
    if (!logoutButton) {
        logoutButton = document.createElement('button');
        logoutButton.className = 'btn-logout';
        logoutButton.innerHTML = '🚪 Salir';
        logoutButton.onclick = () => {
            if (window.app && window.app.logout) {
                window.app.logout();
            }
        };
    }
    headerActions.appendChild(logoutButton);
    
    // Eventos del dropdown
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        
        document.querySelectorAll('.theme-dropdown.open').forEach(d => {
            if (d !== dropdown) d.classList.remove('open');
        });
        
        dropdown.classList.toggle('open');
    });
    
    menu.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const themeId = option.dataset.theme;
            this.cambiarTema(themeId);
            dropdown.classList.remove('open');
            this.actualizarBoton(themeId);
            this.actualizarMenuActivo(themeId);
        });
    });
    
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
        }
    });
    
    console.log('✅ Dropdown de temas creado con botones de configuración y salir');
},
