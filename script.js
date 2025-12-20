const firebaseConfig = { apiKey: "AIzaSyBzsE17xYYr7ittaUbkUr85WJWaADTl4gw", databaseURL: "https://spin-the-wheel-a5901-default-rtdb.europe-west1.firebasedatabase.app", projectId: "spin-the-wheel-a590" };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const colors = ["#FF5733","#33FF57","#3357FF","#F333FF","#FF3383","#33FFF5","#FFB833","#8D33FF","#33FF8D","#FF3333","#DBFF33","#33DBFF","#00A86B","#FF7F50","#6A5ACD","#FFD700","#FF1493","#00CED1","#ADFF2F","#FF4500"];

let isSpinning = false;
let currentRotation = 0;
let roundCount = 1;

// 1. የገጽ መቀያየሪያ
function switchView(viewName) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('view-' + viewName).classList.add('active');
    document.getElementById('nav-' + viewName).classList.add('active');
    if(viewName === 'wheel' || viewName === 'players') drawWheel();
}

// 2. ዊሉን መሳል
function drawWheel() {
    const arc = (2 * Math.PI) / 20;
    ctx.clearRect(0, 0, 500, 500);
    for (let i = 0; i < 20; i++) {
        const angle = i * arc;
        ctx.fillStyle = colors[i % 20];
        ctx.beginPath();
        ctx.moveTo(250, 250);
        ctx.arc(250, 250, 245, angle, angle + arc);
        ctx.lineTo(250, 250);
        ctx.fill();
        ctx.save();
        ctx.translate(250, 250);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right"; ctx.fillStyle = "white";
        ctx.font = "bold 24px Arial"; ctx.fillText(i + 1, 230, 10);
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
        const html = `<div class="player-item" style="border-left-color:${colors[i%20]}"><span>${i+1}</span> <span>${names[i] || '---'}</span></div>`;
        if (i < 10) left.innerHTML += html; else right.innerHTML += html;
    }
}

// 3. Spin Logic
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
        setTimeout(() => { isSpinning = false; calculateWinner(d.target); }, 7000);
    }
});

function calculateWinner(rot) {
    const names = document.getElementById('nameInput').value.split('\n');
    const arc = (2 * Math.PI) / 20;
    const norm = rot % (2 * Math.PI);
    let idx = Math.floor((1.5 * Math.PI - norm + 10 * Math.PI) % (2 * Math.PI) / arc) % 20;
    
    const winName = names[idx] && names[idx].trim() !== "" ? names[idx].trim() : "ባዶ";
    const now = new Date();
    const timeStr = now.toLocaleTimeString('am-ET');
    const dayStr = now.toLocaleDateString('am-ET', {weekday:'long'});

    document.getElementById('win-num').innerText = "#" + (idx + 1);
    document.getElementById('win-name').innerText = winName;
    document.getElementById('win-time').innerText = `🕒 ${dayStr} - ${timeStr}`;
    document.getElementById('round-title').innerText = `ዙር ${roundCount} ተጠናቀቀ`;
    document.getElementById('winner-popup').classList.remove('hidden');

    if (document.getElementById('view-admin').classList.contains('active')) {
        db.ref('wheel/history').push({ main: `ዙር ${roundCount}: ${winName} (#${idx+1})`, meta: `${dayStr} ${timeStr}`, round: roundCount });
    }
}

// Firebase Syncing
db.ref('wheel/names').on('value', snap => { document.getElementById('nameInput').value = snap.val() || ""; drawWheel(); });
document.getElementById('nameInput').oninput = () => db.ref('wheel/names').set(document.getElementById('nameInput').value);

db.ref('wheel/history').on('value', snap => {
    let html = ""; let lastR = 0;
    snap.forEach(c => {
        const v = c.val();
        html = `<li>🏆 ${v.main} <br><small>${v.meta}</small></li>` + html;
        lastR = Math.max(lastR, v.round);
    });
    document.getElementById('historyList').innerHTML = html;
    roundCount = lastR + 1;
    document.getElementById('current-round-label').innerText = `ዙር ${roundCount} ለመጀመር ዝግጁ`;
});

function checkAdminPassword() { if(prompt("Password:") === "1234") switchView('admin'); }
function closePopup() { document.getElementById('winner-popup').classList.add('hidden'); }
function clearHistory() { if(confirm("ታሪክ ይጥፋ?")) db.ref('wheel/history').remove(); }
drawWheel();
