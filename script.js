const firebaseConfig = { apiKey: "AIzaSyBzsE17xYYr7ittaUbkUr85WJWaADTl4gw", databaseURL: "https://spin-the-wheel-a5901-default-rtdb.europe-west1.firebasedatabase.app", projectId: "spin-the-wheel-a590" };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const colors = ["#d4af37", "#1a1a1a", "#d4af37", "#1a1a1a", "#d00000", "#1a1a1a", "#d4af37", "#1a1a1a", "#d4af37", "#1a1a1a", "#d00000", "#1a1a1a", "#d4af37", "#1a1a1a", "#d4af37", "#1a1a1a", "#d00000", "#1a1a1a", "#d4af37", "#1a1a1a"];

let isSpinning = false;
let currentRotation = 0;
let roundCount = 1;

function switchView(v) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.getElementById('view-' + v).classList.add('active');
    document.getElementById('nav-' + v).classList.add('active');
    drawWheel();
}

function drawWheel() {
    const arc = (2 * Math.PI) / 20;
    ctx.clearRect(0, 0, 500, 500);
    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = colors[i % 20];
        ctx.beginPath(); ctx.moveTo(250, 250);
        ctx.arc(250, 250, 245, i * arc, (i + 1) * arc);
        ctx.fill();
        ctx.save(); ctx.translate(250, 250); ctx.rotate(i * arc + arc / 2);
        ctx.textAlign = "right"; ctx.fillStyle = colors[i%20] === "#d4af37" ? "#000" : "#fff";
        ctx.font = "900 22px Arial"; ctx.fillText(i + 1, 230, 10);
        ctx.restore();
    }
    updateBoard();
}

function updateBoard() {
    const names = document.getElementById('nameInput').value.split('\n');
    const left = document.getElementById('board-left');
    const right = document.getElementById('board-right');
    left.innerHTML = ""; right.innerHTML = "";
    for (let i = 0; i < 20; i++) {
        const n = names[i] || "---";
        const html = `<div class="player-item" style="border-left:3px solid ${colors[i%20]}"><span>${i+1}</span><span>${n}</span></div>`;
        if (i < 10) left.innerHTML += html; else right.innerHTML += html;
    }
}

document.getElementById('spinBtn').onclick = () => {
    if(isSpinning) return;
    const extra = (12 * 2 * Math.PI) + (Math.random() * 2 * Math.PI);
    currentRotation += extra;
    db.ref('wheel/spin').set({ target: currentRotation, time: Date.now() });
};

db.ref('wheel/spin').on('value', snap => {
    const d = snap.val();
    if(d && !isSpinning) {
        isSpinning = true;
        canvas.style.transform = `rotate(${d.target}rad)`;
        document.getElementById('status-text').innerText = "መንኮራኩሩ እየተሽከረከረ ነው...";
        setTimeout(() => { isSpinning = false; calculateWinner(d.target); }, 7000);
    }
});

function calculateWinner(rot) {
    const names = document.getElementById('nameInput').value.split('\n');
    const norm = rot % (2 * Math.PI);
    let idx = Math.floor((1.5 * Math.PI - norm + 10 * Math.PI) % (2 * Math.PI) / ((2*Math.PI)/20)) % 20;
    
    const winName = names[idx] || "ባዶ";
    const now = new Date();
    const timeStr = now.toLocaleTimeString('am-ET');

    document.getElementById('win-num').innerText = idx + 1;
    document.getElementById('win-name').innerText = winName;
    document.getElementById('win-time').innerText = `🕒 ዛሬ - ${timeStr}`;
    document.getElementById('winner-popup').classList.remove('hidden');
    document.getElementById('status-text').innerText = "ሽክርክሪቱን በመጠባበቅ ላይ...";

    if(document.getElementById('view-admin').classList.contains('active')) {
        db.ref('wheel/history').push({ main: `ዙር ${roundCount}: ${winName} (#${idx+1})`, time: timeStr, round: roundCount });
    }
}

// Data Sync
db.ref('wheel/names').on('value', snap => { document.getElementById('nameInput').value = snap.val() || ""; drawWheel(); });
document.getElementById('nameInput').oninput = () => db.ref('wheel/names').set(document.getElementById('nameInput').value);

db.ref('wheel/history').on('value', snap => {
    let html = ""; let lastR = 0;
    snap.forEach(c => {
        const v = c.val();
        html = `<li>🏆 ${v.main} <span class="time-log">${v.time}</span></li>` + html;
        lastR = Math.max(lastR, v.round);
    });
    document.getElementById('historyList').innerHTML = html;
    roundCount = lastR + 1;
    document.getElementById('round-num-display').innerText = roundCount;
});

function checkAdminPassword() { if(prompt("Password:") === "1234") switchView('admin'); }
function closePopup() { document.getElementById('winner-popup').classList.add('hidden'); }
function clearHistory() { if(confirm("ታሪክ ይጥፋ?")) db.ref('wheel/history').remove(); }
drawWheel();
