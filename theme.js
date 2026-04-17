// ========== THEME MANAGEMENT ==========
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    showToast(`${newTheme === 'dark' ? '🌙 Dark' : '☀️ Light'} mode`, 'info');
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Tema tugmasini qo‘shish
function addThemeToggle() {
    const header = document.querySelector('.header');
    if (header && !document.querySelector('.theme-toggle')) {
        const btn = document.createElement('button');
        btn.className = 'theme-toggle';
        btn.innerHTML = '<i class="fas fa-moon"></i>';
        btn.onclick = toggleTheme;
        header.appendChild(btn);
    }
}