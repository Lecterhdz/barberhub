// En Sidebar.js, modifica los href
const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/clientes', icon: '👥', label: 'Clientes' },
    { path: '/cortes', icon: '✂️', label: 'Cortes' },
    { path: '/inventario', icon: '📦', label: 'Inventario' },
    { path: '/caja', icon: '💰', label: 'Caja' },
    { path: '/reportes', icon: '📈', label: 'Reportes' },
    { path: '/configuracion', icon: '⚙️', label: 'Configuración' }
];

// Al renderizar, usar # en los href
menuItems.forEach(item => {
    const link = document.createElement('a');
    link.href = `#${item.path}`;  // ← Agregar # aquí
    link.innerHTML = `${item.icon} ${item.label}`;
    link.addEventListener('click', (e) => {
        e.preventDefault();
        router.navegar(item.path);
    });
    nav.appendChild(link);
});
