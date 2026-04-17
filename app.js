// ========== GLOBAL STATE ==========
let currentGameId = null;
let currentStudentId = null;
let currentStudentName = null;
let currentQuestion = null;
let timerInterval = null;
let currentTimeLeft = 180;
let allQuestions = [];
let allChapters = {};
let currentChapter = null;
let students = {};
let usedQuestionIds = [];
let chapterList = [];
let studentTimerInterval = null;

// O'quvchi paneli uchun o'zgaruvchilar
let studentQuestion = null;
let studentTimeLeft = 180;
let hasAnswered = false;
let showResult = false;
let submittedAnswer = '';
let pendingAnswer = '';

const chapterFiles = ['chapter_1.json', 'chapter_2.json', 'chapter_3.json', 'chapter_4.json','chapter_6_7.json','chapter_8.json', 'chapter_15.json', 'chapter_16.json','chapter_17_18.json', 'chapter_19_20.json'];

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    addThemeToggle();
    await loadAllChapters();
    const role = getQueryParam('role');
    if (role === 'teacher') {
        renderTeacherPanel();
    } else {
        renderStudentJoin();  // Bu funksiya endi mavjud
    }
});

// ========== UTILITIES ==========
function generateGameCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
function shuffleArray(arr) {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// ========== TOAST ==========
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== CONFETTI ==========
function startConfetti() {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let particles = [];
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 6 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: Math.random() * 3 + 2,
            rotation: Math.random() * 360
        });
    }
    let animationId;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        for (let p of particles) {
            p.y += p.speed;
            p.rotation += 5;
            if (p.y < canvas.height) active = true;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }
        if (active) {
            animationId = requestAnimationFrame(draw);
        } else {
            cancelAnimationFrame(animationId);
            canvas.remove();
        }
    }
    draw();
    setTimeout(() => {
        if (animationId) cancelAnimationFrame(animationId);
        if (canvas) canvas.remove();
    }, 3000);
}

// ========== THEME ==========
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

// ========== LOAD CHAPTERS ==========
async function loadAllChapters() {
    for (const file of chapterFiles) {
        try {
            const response = await fetch(`data/${file}`);
            if (response.ok) {
                const questions = await response.json();
                allChapters[file] = questions;
                chapterList.push(file);
                if (!currentChapter) currentChapter = file;
                console.log(`✅ ${file} loaded: ${questions.length} questions`);
            }
        } catch (e) {
            console.warn(`⚠️ ${file} not found`);
        }
    }
    if (Object.keys(allChapters).length === 0) {
        showToast("No chapters found! Add JSON files to data/ folder", "error");
    }
    if (currentChapter) {
        allQuestions = allChapters[currentChapter] || [];
    }
}

function selectChapter(chapterId) {
    currentChapter = chapterId;
    allQuestions = allChapters[chapterId] || [];
    renderTeacherPanel();
}

// ========== RENDER TEACHER ==========
function renderTeacherPanel() {
    const app = document.getElementById('app');
    if (!currentGameId) {
        app.innerHTML = `
            <div class="container">
                <div class="header">
                    <div class="logo">🎮 Edexcel CS Quiz</div>
                    <div class="role-badge">👨‍🏫 O'qituvchi</div>
                    <button class="theme-toggle"><i class="fas fa-moon"></i></button>
                </div>
                <div class="panel text-center" style="padding:60px">
                    <button class="btn btn-primary" onclick="createNewGame()">🆕 Yangi o'yin boshlash</button>
                </div>
            </div>
        `;
        const themeBtn = document.querySelector('.theme-toggle');
        if (themeBtn) themeBtn.onclick = toggleTheme;
        return;
    }

    let chapterHtml = '<div class="chapter-selector">';
    for (const ch of chapterList) {
        chapterHtml += `<button class="chapter-btn ${currentChapter === ch ? 'active' : ''}" onclick="selectChapter('${ch}')">${ch.replace('.json', '')}</button>`;
    }
    chapterHtml += '</div>';

    let questionsHtml = '';
    if (!currentQuestion) {
        questionsHtml = `
            <div class="panel text-center">
                ${chapterHtml}
                <button class="btn btn-primary" id="showQuestionsBtn">📚 Savol tanlash</button>
                <div id="questionsPanel" style="display:none; margin-top:15px">
                    <div class="questions-grid" id="questionsGrid"></div>
                    <button class="btn btn-secondary" id="closeQuestionsBtn" style="margin-top:10px">❌ Bekor qilish</button>
                </div>
            </div>
        `;
    } else {
        questionsHtml = `
            <div class="panel">
                ${chapterHtml}
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px">
                    <h3>📖 Joriy savol</h3>
                    <div class="timer" id="teacherTimer">${formatTime(currentTimeLeft)}</div>
                </div>
                <div style="background:var(--bg-secondary); padding:15px; border-radius:12px; margin-bottom:15px">
                    <p>${currentQuestion.text}</p>
                    <p style="color:var(--warning); margin-top:8px">🎯 ${currentQuestion.score} ball</p>
                </div>
                <div class="correct-answer" id="correctAnswerDiv" style="display:none">
                    <strong>✅ To'g'ri javob (Mark Scheme):</strong><br> ${currentQuestion.answer}
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:15px">
                    <button class="btn btn-primary" id="collectBtn">📥 Barcha javob berdi</button>
                    <button class="btn btn-peer" id="peerBtn">👥 Peer Assessment</button>
                    <button class="btn btn-success" id="finishBtn">💾 Saqlab, savolni yopish</button>
                    <button class="btn btn-danger" id="cancelBtn">❌ Bekor qilish</button>
                </div>
            </div>
        `;
    }

    app.innerHTML = `
        <div class="container">
            <div class="header">
                <div class="logo">🎮 Edexcel CS Quiz</div>
                <div class="game-code-card"><div>Kod:</div><div style="font-size:1.5rem; font-weight:bold">${currentGameId}</div></div>
                <div style="display:flex; gap:10px">
                    <button class="btn btn-warning" onclick="showResults()">📊 Natijalar</button>
                    <button class="btn btn-danger" onclick="endGame()">⏹️ Tugatish</button>
                    <button class="theme-toggle"><i class="fas fa-moon"></i></button>
                </div>
            </div>
            <div class="panel">
                <h3>👥 O'quvchilar (${Object.keys(students).length}/12)</h3>
                <div class="students-grid" id="studentsGrid"></div>
            </div>
            ${questionsHtml}
        </div>
    `;

    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) themeBtn.onclick = toggleTheme;
    updateStudentsGrid();

    if (!currentQuestion) {
        const showBtn = document.getElementById('showQuestionsBtn');
        const questionsPanel = document.getElementById('questionsPanel');
        const closeBtn = document.getElementById('closeQuestionsBtn');
        if (showBtn) {
            showBtn.onclick = () => {
                questionsPanel.style.display = 'block';
                renderQuestionsGrid();
            };
        }
        if (closeBtn) {
            closeBtn.onclick = () => {
                questionsPanel.style.display = 'none';
            };
        }
    } else {
        document.getElementById('collectBtn').onclick = collectAllAnswers;
        document.getElementById('peerBtn').onclick = startPeerAssessment;
        document.getElementById('finishBtn').onclick = finishQuestion;
        document.getElementById('cancelBtn').onclick = cancelCurrentQuestion;
    }
}

function renderQuestionsGrid() {
    const container = document.getElementById('questionsGrid');
    if (!container) return;

    const byScore = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    allQuestions.forEach(q => {
        if (byScore[q.score]) byScore[q.score].push(q);
    });

    container.innerHTML = '';
    for (let score = 1; score <= 5; score++) {
        const column = document.createElement('div');
        column.className = 'score-column';
        column.innerHTML = `<div class="column-header">🎯 ${score} ball</div>`;
        const list = document.createElement('div');
        byScore[score].forEach((q, idx) => {
            const isUsed = usedQuestionIds.includes(q.id);
            const card = document.createElement('div');
            card.className = `question-card ${isUsed ? 'used' : ''}`;
            card.innerHTML = isUsed ? `✅ Savol ${idx + 1}` : `🔒 Savol ${idx + 1}`;
            if (!isUsed) card.onclick = () => selectQuestion(q);
            list.appendChild(card);
        });
        column.appendChild(list);
        container.appendChild(column);
    }
}

async function selectQuestion(question) {
    const panel = document.getElementById('questionsPanel');
    if (panel) panel.style.display = 'none';

    currentQuestion = question;

    if (db && currentGameId) {
        for (const sid of Object.keys(students)) {
            await db.ref(`games/${currentGameId}/students/${sid}/answer`).remove();
            await db.ref(`games/${currentGameId}/students/${sid}/tempScore`).remove();
            await db.ref(`games/${currentGameId}/students/${sid}/peerTargetId`).remove();
            await db.ref(`games/${currentGameId}/students/${sid}/peerScore`).remove();
            await db.ref(`games/${currentGameId}/students/${sid}/peerReceivedScore`).remove();
        }
        await db.ref(`games/${currentGameId}/currentQuestion`).set({
            id: question.id,
            text: question.text,
            answer: question.answer,
            score: question.score
        });
        await db.ref(`games/${currentGameId}/status`).set('answering');
        await db.ref(`games/${currentGameId}/timeLeft`).set(180);
        startTimer();
    }
    renderTeacherPanel();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    let time = 180;
    currentTimeLeft = 180;

    timerInterval = setInterval(async () => {
        if (time <= 0) {
            clearInterval(timerInterval);
            await autoSubmitAllAnswers();
        } else {
            time--;
            currentTimeLeft = time;
            if (db && currentGameId) {
                await db.ref(`games/${currentGameId}/timeLeft`).set(time);
            }
            const timerEl = document.getElementById('teacherTimer');
            if (timerEl) timerEl.textContent = formatTime(currentTimeLeft);
        }
    }, 1000);
}

async function autoSubmitAllAnswers() {
    if (!db || !currentGameId) return;
    const snapshot = await db.ref(`games/${currentGameId}/students`).once('value');
    const studentsData = snapshot.val() || {};
    for (const [sid, student] of Object.entries(studentsData)) {
        if (!student.answer) {
            await db.ref(`games/${currentGameId}/students/${sid}/answer`).set("⏰ Vaqt tugadi!");
        }
    }
    await db.ref(`games/${currentGameId}/status`).set('review');
    const correctDiv = document.getElementById('correctAnswerDiv');
    if (correctDiv) correctDiv.style.display = 'block';
    showToast("Vaqt tugadi! Barcha javoblar yuborildi", "info");
}

async function collectAllAnswers() {
    if (timerInterval) clearInterval(timerInterval);
    if (db && currentGameId) {
        await db.ref(`games/${currentGameId}/status`).set('review');
        const correctDiv = document.getElementById('correctAnswerDiv');
        if (correctDiv) correctDiv.style.display = 'block';
        showToast("Barcha javoblar yig'ildi", "success");
    }
}

// ========== PEER ASSESSMENT ==========
function createPeerAssignments(studentIds) {
    if (studentIds.length < 2) return {};
    const shuffled = shuffleArray(studentIds);
    const assignments = {};
    for (let i = 0; i < shuffled.length; i++) {
        assignments[shuffled[i]] = shuffled[(i + 1) % shuffled.length];
    }
    return assignments;
}

async function startPeerAssessment() {
    if (!currentQuestion) {
        showToast("Hech qanday faol savol yo'q!", "error");
        return;
    }

    const studentIds = Object.keys(students);
    if (studentIds.length < 2) {
        showToast("Peer assessment uchun kamida 2 ta o'quvchi kerak!", "error");
        return;
    }

    const assignments = createPeerAssignments(studentIds);
    console.log("Peer assignments:", assignments);

    for (const [graderId, targetId] of Object.entries(assignments)) {
        const targetStudent = students[targetId];
        await db.ref(`games/${currentGameId}/students/${graderId}`).update({
            peerTargetId: targetId,
            peerTargetName: targetStudent?.name || "Noma'lum",
            peerTargetAnswer: targetStudent?.answer || "Javob yo'q",
            peerScore: null
        });
    }

    await db.ref(`games/${currentGameId}/status`).set('peer_assessment');
    showToast("Peer assessment boshlandi! O'quvchilar bir-birini baholaydi.", "success");
    
    const snapshot = await db.ref(`games/${currentGameId}/students`).once('value');
    students = snapshot.val() || {};
    renderTeacherPanel();
}

window.submitPeerGrade = async function(targetId, score) {
    if (!db || !currentGameId || !currentStudentId) return;

    const maxScore = currentQuestion?.score || 3;
    
    await db.ref(`games/${currentGameId}/students/${currentStudentId}`).update({
        peerScore: score,
        peerGradedAt: Date.now()
    });

    const targetRef = db.ref(`games/${currentGameId}/students/${targetId}`);
    const targetSnap = await targetRef.once('value');
    const target = targetSnap.val();
    const oldTotal = target.totalScore || 0;
    const oldPeerScore = target.peerReceivedScore || 0;
    const newTotal = oldTotal - oldPeerScore + score;

    await targetRef.update({
        peerReceivedScore: score,
        totalScore: newTotal,
        tempScore: score
    });

    showToast(`✅ ${score}/${maxScore} ball qo'ydingiz!`, "success");
    
    const snapshot = await db.ref(`games/${currentGameId}/students`).once('value');
    students = snapshot.val() || {};
    renderStudentPanel();
};

window.setStudentScore = async function(studentId, score) {
    if (!db || !currentGameId || !currentQuestion) return;
    const studentRef = db.ref(`games/${currentGameId}/students/${studentId}`);
    const snap = await studentRef.once('value');
    const student = snap.val();
    if (student) {
        const oldTemp = student.tempScore || 0;
        const oldTotal = student.totalScore || 0;
        const newTotal = oldTotal - oldTemp + score;
        await studentRef.update({ tempScore: score, totalScore: newTotal });
        updateStudentsGrid();
        showToast(`${student.name} ga ${score} ball qo'yildi`, "success");
    }
};

window.removeStudent = async function(studentId) {
    if (!confirm("Bu o'quvchini chiqarib yuborish?")) return;
    await db.ref(`games/${currentGameId}/students/${studentId}`).remove();
    showToast("O'quvchi chiqarib yuborildi", "info");
};

async function finishQuestion() {
    if (currentQuestion && !usedQuestionIds.includes(currentQuestion.id)) {
        usedQuestionIds.push(currentQuestion.id);
        await db.ref(`games/${currentGameId}/usedQuestions`).set(usedQuestionIds);
    }
    await db.ref(`games/${currentGameId}/currentQuestion`).remove();
    await db.ref(`games/${currentGameId}/status`).set('waiting');
    currentQuestion = null;
    renderTeacherPanel();
    startConfetti();
    showToast("Savol yopildi! Yangi savol tanlashingiz mumkin.", "success");
}

async function cancelCurrentQuestion() {
    if (timerInterval) clearInterval(timerInterval);
    currentQuestion = null;
    if (db && currentGameId) {
        await db.ref(`games/${currentGameId}/currentQuestion`).remove();
        await db.ref(`games/${currentGameId}/status`).set('waiting');
    }
    renderTeacherPanel();
    showToast("Savol bekor qilindi", "info");
}

function updateStudentsGrid() {
    const container = document.getElementById('studentsGrid');
    if (!container) return;
    container.innerHTML = '';
    Object.entries(students).forEach(([sid, student]) => {
        const card = document.createElement('div');
        card.className = 'student-card';
        if (currentQuestion) {
            card.innerHTML = `
                <button class="remove-student" onclick="removeStudent('${sid}')" style="position:absolute; top:8px; right:8px; background:rgba(239,68,68,0.3); border:none; border-radius:50%; width:24px; height:24px; cursor:pointer">✕</button>
                <div><strong>👤 ${student.name}</strong></div>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:5px">📝 ${student.answer || "⏳ Kutilmoqda..."}</div>
                <div style="margin-top:8px; display:flex; gap:5px; flex-wrap:wrap">
                    ${[0, 1, 2, 3, 4, 5].filter(s => s <= currentQuestion.score).map(score =>
                        `<button class="score-btn ${student.tempScore === score ? 'selected' : ''}" onclick="setStudentScore('${sid}', ${score})">${score}</button>`
                    ).join('')}
                </div>
                <div style="margin-top:5px; font-size:0.7rem; color:var(--warning)">⭐ Umumiy: ${student.totalScore || 0}</div>
                ${student.peerReceivedScore ? `<div style="font-size:0.7rem; color:var(--secondary)">👥 Peer: ${student.peerReceivedScore}</div>` : ''}
            `;
        } else {
            card.innerHTML = `
                <div><strong>👤 ${student.name}</strong></div>
                <div style="margin-top:5px; font-size:0.7rem; color:var(--warning)">⭐ Umumiy: ${student.totalScore || 0}</div>
            `;
        }
        container.appendChild(card);
    });
}

window.showResults = async function() {
    if (!db || !currentGameId) return;
    const snapshot = await db.ref(`games/${currentGameId}/students`).once('value');
    const data = snapshot.val() || {};
    const results = Object.values(data).sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    let html = `
        <div class="modal-content">
            <div class="modal-header"><h2>🏆 Natijalar</h2><button onclick="closeModal()">✕</button></div>
            <div class="modal-body">
                <table style="width:100%; border-collapse:collapse">
                    <tr><th>#</th><th>O'quvchi</th><th>Ball</th></tr>
                    ${results.map((s, i) => `<tr><td>${i + 1}</td><td>${s.name}</td><td><strong>${s.totalScore || 0}</strong></td>`).join('')}
                </table>
            </div>
            <div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">Yopish</button></div>
        </div>
    `;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = html;
    document.body.appendChild(modal);
    startConfetti();
};

window.closeModal = function() {
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
};

window.createNewGame = async function() {
    if (!db) {
        showToast("Firebase sozlanmagan!", "error");
        return;
    }
    const gameId = generateGameCode();
    currentGameId = gameId;
    students = {};
    currentQuestion = null;
    usedQuestionIds = [];
    await db.ref(`games/${gameId}`).set({ status: 'waiting', students: {}, usedQuestions: [] });
    
    db.ref(`games/${gameId}/students`).on('value', (snap) => {
        students = snap.val() || {};
        renderTeacherPanel();
    });
    db.ref(`games/${gameId}/currentQuestion`).on('value', (snap) => {
        currentQuestion = snap.val();
        renderTeacherPanel();
    });
    renderTeacherPanel();
    showToast(`Yangi o'yin yaratildi! Kod: ${gameId}`, "success");
};

window.endGame = function() {
    if (db && currentGameId) db.ref(`games/${currentGameId}`).remove();
    currentGameId = null;
    students = {};
    currentQuestion = null;
    renderTeacherPanel();
    showToast("O'yin tugatildi", "info");
};

// ========== STUDENT PANEL ==========
// renderStudentJoin - o'quvchini o'yin kodini kiritish uchun
function renderStudentJoin() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container">
            <div class="header">
                <div class="logo">🎮 Edexcel CS Quiz</div>
                <div class="role-badge">👨‍🎓 O'quvchi</div>
                <button class="theme-toggle"><i class="fas fa-moon"></i></button>
            </div>
            <div class="panel" style="max-width:400px; margin:50px auto">
                <h3>🔑 O'yin kodini kiriting</h3>
                <input type="text" id="gameCodeInput" class="answer-input" placeholder="Masalan: X7K9P2" style="width:100%; padding:12px; margin:10px 0; background:var(--bg-secondary); border:1px solid var(--border); border-radius:8px; color:var(--text-primary)">
                <input type="text" id="studentNameInput" class="answer-input" placeholder="Ismingiz" style="width:100%; padding:12px; margin:10px 0; background:var(--bg-secondary); border:1px solid var(--border); border-radius:8px; color:var(--text-primary)">
                <button class="btn btn-primary" onclick="joinGame()" style="width:100%">🚀 Qo'shilish</button>
            </div>
        </div>
    `;
    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) themeBtn.onclick = toggleTheme;
}

function renderStudentPanel() {
    const app = document.getElementById('app');
    const me = students[currentStudentId] || {};
    
    const peerTargetId = me.peerTargetId;
    const peerScore = me.peerScore;
    const peerReceivedScore = me.peerReceivedScore;

    // PEER ASSESSMENT MODE
    if (currentQuestion && peerTargetId && (peerScore === undefined || peerScore === null) && !showResult) {
        if (studentTimerInterval) {
            clearInterval(studentTimerInterval);
            studentTimerInterval = null;
        }
        const target = students[peerTargetId] || {};
        app.innerHTML = `
            <div class="container">
                <div class="header">
                    <div class="logo">🎮 Edexcel CS Quiz</div>
                    <div class="role-badge">${currentStudentName}</div>
                    <button class="theme-toggle"><i class="fas fa-moon"></i></button>
                </div>
                <div class="panel">
                    <h3>🤝 Peer Assessment: Baholash</h3>
                    <div style="background:var(--bg-secondary); padding:12px; border-radius:10px; margin:10px 0">
                        <strong>📝 Sizning javobingiz:</strong> ${me.answer || "Yo'q"}
                    </div>
                    <div style="background:var(--bg-secondary); padding:12px; border-radius:10px; margin:10px 0; border-left:3px solid var(--secondary)">
                        <strong>🎯 Siz baholayotgan o'quvchi: ${target.name || "Noma'lum"}</strong><br>
                        <strong>Uning javobi:</strong> ${target.answer || "Yo'q"}
                    </div>
                    <div style="background:rgba(16,185,129,0.15); padding:12px; border-radius:10px; margin:10px 0">
                        <strong>✅ To'g'ri javob (Mark Scheme):</strong><br> ${currentQuestion.answer}
                    </div>
                    <div style="display:flex; gap:10px; justify-content:center; margin:15px 0; flex-wrap:wrap">
                        ${[0, 1, 2, 3, 4, 5].filter(s => s <= currentQuestion.score).map(s => `<button class="score-btn" onclick="submitPeerGrade('${peerTargetId}', ${s})" style="padding:12px 20px; font-size:1rem">${s}</button>`).join('')}
                    </div>
                    <p class="text-muted text-center">Mark Scheme asosida baholang</p>
                </div>
            </div>
        `;
        const themeBtn = document.querySelector('.theme-toggle');
        if (themeBtn) themeBtn.onclick = toggleTheme;
        return;
    }

    // Peer assessment already graded
    if (peerTargetId && peerScore !== undefined && peerScore !== null && !showResult) {
        if (studentTimerInterval) {
            clearInterval(studentTimerInterval);
            studentTimerInterval = null;
        }
        app.innerHTML = `
            <div class="container">
                <div class="header">
                    <div class="logo">🎮 Edexcel CS Quiz</div>
                    <div class="role-badge">${currentStudentName}</div>
                    <button class="theme-toggle"><i class="fas fa-moon"></i></button>
                </div>
                <div class="panel text-center">
                    <h3>✅ Baholadingiz!</h3>
                    <div style="background:var(--bg-secondary); padding:12px; border-radius:10px; margin:10px 0">
                        <strong>📝 Sizning javobingiz:</strong> ${me.answer || "Yo'q"}
                    </div>
                    <div style="background:var(--bg-secondary); padding:12px; border-radius:10px; margin:10px 0">
                        <strong>⭐ Siz qo'ygan ball:</strong> ${peerScore}/${currentQuestion?.score || 3}
                    </div>
                    <p class="text-muted">Boshqa o'quvchilar ham baholab bo'lgach, natijalarni ko'rasiz...</p>
                </div>
            </div>
        `;
        const themeBtn = document.querySelector('.theme-toggle');
        if (themeBtn) themeBtn.onclick = toggleTheme;
        return;
    }

    if (!currentQuestion) {
        if (studentTimerInterval) {
            clearInterval(studentTimerInterval);
            studentTimerInterval = null;
        }
        app.innerHTML = `
            <div class="container">
                <div class="header">
                    <div class="logo">🎮 Edexcel CS Quiz</div>
                    <div class="role-badge">${currentStudentName}</div>
                    <button class="theme-toggle"><i class="fas fa-moon"></i></button>
                </div>
                <div class="panel text-center">
                    <h3>⏳ O'qituvchi savol tanlashini kuting...</h3>
                </div>
            </div>
        `;
        const themeBtn = document.querySelector('.theme-toggle');
        if (themeBtn) themeBtn.onclick = toggleTheme;
        return;
    }

    if (showResult) {
        if (studentTimerInterval) {
            clearInterval(studentTimerInterval);
            studentTimerInterval = null;
        }
        app.innerHTML = `
            <div class="container">
                <div class="header">
                    <div class="logo">🎮 Edexcel CS Quiz</div>
                    <div class="role-badge">${currentStudentName}</div>
                    <button class="theme-toggle"><i class="fas fa-moon"></i></button>
                </div>
                <div class="panel">
                    <h3>📋 Javobingiz tekshiruvi</h3>
                    <div style="background:var(--bg-secondary); padding:12px; border-radius:10px; margin:10px 0">
                        <strong>📝 Sizning javobingiz:</strong><br> ${submittedAnswer || me.answer || "Yo'q"}
                    </div>
                    <div style="background:rgba(16,185,129,0.15); padding:12px; border-radius:10px; margin:10px 0">
                        <strong>✅ To'g'ri javob:</strong><br> ${currentQuestion.answer}
                    </div>
                    ${peerReceivedScore !== undefined && peerReceivedScore !== null ? `<div style="background:var(--secondary); padding:12px; border-radius:10px; margin:10px 0"><strong>⭐ Siz olgan ball:</strong> ${peerReceivedScore}/${currentQuestion.score}<br>👥 Sizni boshqa o'quvchi baholadi!</div>` : `<p class="text-muted">O'qituvchi ballarni qo'yishini kuting...</p>`}
                </div>
            </div>
        `;
        const themeBtn = document.querySelector('.theme-toggle');
        if (themeBtn) themeBtn.onclick = toggleTheme;
        return;
    }

    // Javob yozish ekrani
    let savedAnswer = '';
    if (hasAnswered) {
        savedAnswer = submittedAnswer || me.answer || '';
    } else {
        savedAnswer = pendingAnswer || '';
    }
    
    app.innerHTML = `
        <div class="container">
            <div class="header">
                <div class="logo">🎮 Edexcel CS Quiz</div>
                <div class="role-badge">${currentStudentName}</div>
                <button class="theme-toggle"><i class="fas fa-moon"></i></button>
            </div>
            <div class="panel">
                <h3>❓ Savol</h3>
                <div style="background:var(--bg-secondary); padding:15px; border-radius:12px; margin-bottom:15px">
                    <p>${currentQuestion.text}</p>
                    <p style="color:var(--warning); margin-top:8px">🎯 ${currentQuestion.score} ball</p>
                </div>
                <div class="timer" id="studentTimer">${formatTime(studentTimeLeft)}</div>
                <textarea id="studentAnswer" class="answer-input" rows="4" placeholder="Javobingizni yozing..." style="width:100%; padding:12px; background:var(--bg-secondary); border:1px solid var(--border); border-radius:8px; color:var(--text-primary)" ${hasAnswered ? 'disabled' : ''} oninput="savePendingAnswer(this.value)">${savedAnswer}</textarea>
                <button class="btn btn-success" onclick="submitAnswer()" style="width:100%" ${hasAnswered ? 'disabled' : ''}>📤 Javobni yuborish</button>
                ${hasAnswered ? `<p class="text-muted text-center" style="margin-top:10px">✅ Javobingiz yuborildi. O'qituvchi barcha javoblarni yig'ishini kuting...</p>` : ''}
            </div>
        </div>
    `;
    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) themeBtn.onclick = toggleTheme;
    startStudentTimer();
}

function savePendingAnswer(value) {
    pendingAnswer = value;
}

function startStudentTimer() {
    const timerEl = document.getElementById('studentTimer');
    if (!timerEl) return;
    
    if (studentTimerInterval) {
        clearInterval(studentTimerInterval);
        studentTimerInterval = null;
    }
    
    if (hasAnswered || showResult || !currentQuestion) {
        return;
    }
    
    studentTimerInterval = setInterval(() => {
        if (showResult || !currentQuestion || hasAnswered) {
            if (studentTimerInterval) {
                clearInterval(studentTimerInterval);
                studentTimerInterval = null;
            }
            return;
        }
        if (studentTimeLeft <= 1) {
            if (studentTimerInterval) {
                clearInterval(studentTimerInterval);
                studentTimerInterval = null;
            }
            submitAnswer(true);
        } else {
            studentTimeLeft--;
            const timerEl2 = document.getElementById('studentTimer');
            if (timerEl2) timerEl2.textContent = formatTime(studentTimeLeft);
        }
    }, 1000);
}

window.submitAnswer = async function(autoSubmit = false) {
    if (hasAnswered || showResult) return;
    
    if (studentTimerInterval) {
        clearInterval(studentTimerInterval);
        studentTimerInterval = null;
    }
    
    let answer;
    if (autoSubmit) {
        answer = pendingAnswer || "⏰ Vaqt tugadi!";
    } else {
        answer = pendingAnswer;
        if (!answer || !answer.trim()) {
            showToast("Iltimos, javob yozing!", "error");
            startStudentTimer();
            return;
        }
    }
    hasAnswered = true;
    submittedAnswer = answer;
    pendingAnswer = '';
    if (db && currentGameId && currentStudentId) {
        await db.ref(`games/${currentGameId}/students/${currentStudentId}`).update({ answer: answer });
    }
    renderStudentPanel();
    showToast("Javobingiz yuborildi!", "success");
};

window.joinGame = async function() {
    const code = document.getElementById('gameCodeInput')?.value.toUpperCase();
    const name = document.getElementById('studentNameInput')?.value.trim();
    if (!code || !name) {
        showToast("Kod va ism kiriting!", "error");
        return;
    }
    if (!db) {
        showToast("Firebase sozlanmagan!", "error");
        return;
    }

    const gameRef = db.ref(`games/${code}`);
    const snapshot = await gameRef.once('value');
    if (!snapshot.exists()) {
        showToast("Bunday o'yin topilmadi!", "error");
        return;
    }

    const studentsData = snapshot.val().students || {};
    let existingId = null;
    for (const [sid, s] of Object.entries(studentsData)) {
        if (s.name === name) existingId = sid;
    }
    if (existingId) await db.ref(`games/${code}/students/${existingId}`).remove();

    currentGameId = code;
    currentStudentName = name;
    currentStudentId = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    await db.ref(`games/${code}/students/${currentStudentId}`).set({
        id: currentStudentId, name: name, joinedAt: Date.now(), totalScore: 0
    });

    if (studentTimerInterval) {
        clearInterval(studentTimerInterval);
        studentTimerInterval = null;
    }

    db.ref(`games/${code}/students`).on('value', (snap) => {
        students = snap.val() || {};
        renderStudentPanel();
    });

    db.ref(`games/${code}/currentQuestion`).on('value', (snap) => {
        currentQuestion = snap.val();
        studentTimeLeft = 180;
        hasAnswered = false;
        showResult = false;
        submittedAnswer = '';
        pendingAnswer = '';
        
        if (studentTimerInterval) {
            clearInterval(studentTimerInterval);
            studentTimerInterval = null;
        }
        
        renderStudentPanel();
    });

    db.ref(`games/${code}/status`).on('value', (snap) => {
        const status = snap.val();
        if (status === 'peer_assessment') {
            showResult = false;
            renderStudentPanel();
        }
        if (status === 'review' && hasAnswered) {
            showResult = true;
            renderStudentPanel();
        }
    });

    renderStudentPanel();
    showToast(`"${name}" o'yinga qo'shildi!`, "success");
};

// Export functions
window.selectQuestion = selectQuestion;
window.selectChapter = selectChapter;
window.submitPeerGrade = submitPeerGrade;
window.setStudentScore = setStudentScore;
window.removeStudent = removeStudent;
window.showResults = showResults;
window.closeModal = closeModal;
window.createNewGame = createNewGame;
window.endGame = endGame;
window.joinGame = joinGame;
window.submitAnswer = submitAnswer;
window.collectAllAnswers = collectAllAnswers;
window.startPeerAssessment = startPeerAssessment;
window.finishQuestion = finishQuestion;
window.cancelCurrentQuestion = cancelCurrentQuestion;
window.toggleTheme = toggleTheme;