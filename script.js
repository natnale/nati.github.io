const firebaseConfig = { apiKey: "AIzaSyBzsE17xYYr7ittaUbkUr85WJWaADTl4gw", databaseURL: "https://spin-the-wheel-a5901-default-rtdb.europe-west1.firebasedatabase.app", projectId: "spin-the-wheel-a590" };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();


const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const nameInput = document.getElementById('nameInput');
const colors = ["#FF5733","#33FF57","#3357FF","#F333FF","#FF3383","#33FFF5","#FFB833","#8D33FF","#33FF8D","#FF3333","#DBFF33","#33DBFF","#00A86B","#FF7F50","#6A5ACD","#FFD700","#FF1493","#00CED1","#ADFF2F","#FF4500"];

let isSpinning = false;
let currentTotalRotation = 0;
let roundCounter = 1;

function drawWheel() {
    const sectors = 20;
    const arc = (2 * Math.PI) / sectors;
    ctx.clearRect(0, 0, 500, 500);
    for (let i = 0; i < sectors; i++) {
        const angle = i * arc;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(250, 250);
        ctx.arc(250, 250, 245, angle, angle + arc);
        ctx.lineTo(250, 250);
        ctx.fill();
        ctx.save();
        ctx.translate(250, 250);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right"; ctx.fillStyle = "white";
        ctx.font = "900 24px Arial"; ctx.fillText(i + 1, 230, 10);
        ctx.restore();
    }
    updatePlayerBoard();
}

function updatePlayerBoard() {
    const leftBoard = document.getElementById('board-left');
    const rightBoard = document.getElementById('board-right');
    let names = nameInput.value.split('\n');
    leftBoard.innerHTML = ""; rightBoard.innerHTML = "";

    for (let i = 0; i < 20; i++) {
        const n = names[i] && names[i].trim() !== "" ? names[i].trim() : "---";
        const item = document.createElement('div');
        item.className = 'player-item';
        item.style.borderLeftColor = colors[i % colors.length];
        item.innerHTML = `<span>${i + 1}</span> <span>${n}</span>`;
        if (i < 10) leftBoard.appendChild(item); else rightBoard.appendChild(item);
    }
}

function calculateWinner(rot) {
    let names = nameInput.value.split('\n');
    const arc = (2 * Math.PI) / 20;
    const norm = rot % (2 * Math.PI);
    let idx = Math.floor((1.5 * Math.PI - norm + 10 * Math.PI) % (2 * Math.PI) / arc);
    idx = (idx % 20 + 20) % 20;

    const winner = names[idx] && names[idx].trim() !== "" ? names[idx].trim() : "ባዶ ቦታ";
    const now = new Date();
    const day = now.toLocaleDateString('am-ET', { weekday: 'long' });
    const time = now.toLocaleTimeString('am-ET');

    const mainLog = `ዙር ${roundCounter} አሸናፊ: ${winner} (ቁጥር ${idx + 1})`;
    const metaLog = `${day} | ${time}`;

    document.getElementById('winner-text').innerText = mainLog;
    document.getElementById('winner-popup').classList.remove('hidden');

    if (!document.getElementById('admin-content').classList.contains('hidden')) {
        db.ref('wheel/history').push({ main: mainLog, meta: metaLog, round: roundCounter });
    }
}

document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'spinBtn') {
        if (isSpinning) return;
        const added = (15 * 2 * Math.PI) + (Math.random() * 2 * Math.PI);
        currentTotalRotation += added;
        db.ref('wheel/spin').set({ target: currentTotalRotation, time: Date.now() });
    }
});

db.ref('wheel/spin').on('value', snap => {
    const d = snap.val();
    if (d && !isSpinning) {
        isSpinning = true;
        canvas.style.transform = `rotate(${d.target}rad)`;
        setTimeout(() => { isSpinning = false; calculateWinner(d.target); }, 7000);
    }
});

nameInput.addEventListener('input', () => db.ref('wheel/names').set(nameInput.value));
db.ref('wheel/names').on('value', snap => { nameInput.value = snap.val() || ""; drawWheel(); });

db.ref('wheel/history').on('value', snap => {
    const list = document.getElementById('historyList');
    const adminList = document.getElementById('adminHistoryList');
    let html = ""; let lastRound = 0;
    snap.forEach(c => {
        const v = c.val();
        html = `<li><div class="log-main">🏆 ${v.main}</div><div class="log-meta">📅 ${v.meta}</div></li>` + html;
        lastRound = Math.max(lastRound, v.round);
    });
    list.innerHTML = adminList.innerHTML = html;
    roundCounter = lastRound + 1;
});

function showTab(t) {
    document.getElementById('history-content').classList.toggle('hidden', t !== 'history');
    document.getElementById('admin-content').classList.toggle('hidden', t !== 'admin');
}
function checkAdminPassword() { if (prompt("የይለፍ ቃል ያስገቡ:") === "1234") showTab('admin'); }
function clearHistory() { if(confirm("ሁሉንም ታሪክ ማጥፋት ይፈልጋሉ?")) db.ref('wheel/history').remove(); }
drawWheel();
// --- አሸናፊውን የማሳያ ተግባር ---
function calculateWinner(rot) {
    let names = nameInput.value.split('\n');
    const arc = (2 * Math.PI) / 20;
    const norm = rot % (2 * Math.PI);
    let idx = Math.floor((1.5 * Math.PI - norm + 10 * Math.PI) % (2 * Math.PI) / arc);
    idx = (idx % 20 + 20) % 20;

    const winnerName = names[idx] && names[idx].trim() !== "" ? names[idx].trim() : "ባዶ ቦታ";
    const winnerNumber = idx + 1;
    
    // ቀን እና ሰዓት
    const now = new Date();
    const day = now.toLocaleDateString('am-ET', { weekday: 'long' });
    const time = now.toLocaleTimeString('am-ET');
    const fullDate = now.toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });

    // ፖፕ-አፕ ላይ መረጃ መሙላት
    document.getElementById('win-number').innerText = winnerNumber;
    document.getElementById('win-name').innerText = winnerName;
    document.getElementById('win-time').innerText = `📅 ${day}, ${fullDate} | 🕒 ${time}`;
    document.getElementById('round-title').innerText = `ዙር ${roundCounter} ተጠናቀቀ!`;

    // ፖፕ-አፑን ማሳየት
    document.getElementById('winner-popup').classList.remove('hidden');

    // ለታሪክ መዝገብ (Admin only)
    if (!document.getElementById('admin-content').classList.contains('hidden')) {
        const mainLog = `ዙር ${roundCounter}: ${winnerName} (ቁጥር ${winnerNumber})`;
        const metaLog = `${day} | ${time}`;
        db.ref('wheel/history').push({ main: mainLog, meta: metaLog, round: roundCounter });
    }
}
