// ========== UI COMPONENTS ==========
export function createButton(text, icon, onClick, className = 'btn') {
    const btn = document.createElement('button');
    btn.className = className;
    btn.innerHTML = icon ? `<i class="fas fa-${icon}"></i> ${text}` : text;
    btn.onclick = onClick;
    return btn;
}

export function createCard(title, content, footer = null) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>${title}</h3><div>${content}</div>`;
    if (footer) card.appendChild(footer);
    return card;
}