// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBzsE17xYYr7ittaUbkUr85WJWaADTl4gw",
  databaseURL: "https://spin-the-wheel-a5901-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "spin-the-wheel-a5901",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const nameInput = document.getElementById('nameInput');
const spinBtn = document.getElementById('spinBtn');
const historyList = document.getElementById('historyList');

let names = [];
let isSpinning = false;
let currentRotation = 0;

// 2. ADMIN & TABS
function checkAdminPassword() {
    if (prompt("Enter Password:") === "1234") { showTab('admin'); } 
    else { alert("Wrong password!"); }
}

function showTab(tabName) {
    document.getElementById('history-content').classList.add('hidden');
    document.getElementById('admin-content').classList.add('hidden');
    document.getElementById('tab-history').classList.remove('active');
    document.getElementById('tab-admin').classList.remove('active');

    document.getElementById(tabName + '-content').classList.remove('hidden');
    document.getElementById('tab-' + tabName).classList.add('active');
}

// 3. WHEEL DRAWING
function drawWheel() {
    const sectors = names.length;
    if (sectors === 0) return;
    const arc = 2 * Math.PI / sectors;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    names.forEach((name, i) => {
        const angle = i * arc;
        ctx.fillStyle = (i % 2 === 0) ? "#d00000" : "#1a1a1a";
        ctx.beginPath(); ctx.moveTo(250, 250);
        ctx.arc(250, 250, 240, angle, angle + arc);
        ctx.lineTo(250, 250); ctx.fill();
        ctx.save(); ctx.translate(250, 250); ctx.rotate(angle + arc/2);
        ctx.textAlign = "right"; ctx.fillStyle = "white";
        ctx.font = "bold 16px Arial"; ctx.fillText(name, 230, 5); ctx.restore();
    });
}

// 4. REAL-TIME SYNC
nameInput.addEventListener('input', () => {
    db.ref('wheel/names').set(nameInput.value);
});

db.ref('wheel/names').on('value', (snap) => {
    nameInput.value = snap.val() || "";
    names = nameInput.value.split('\n').filter(n => n.trim() !== "");
    drawWheel();
});

spinBtn.addEventListener('click', () => {
    if (isSpinning || names.length === 0) return;
    const target = currentRotation + (20 * Math.PI) + (Math.random() * 2 * Math.PI);
    db.ref('wheel/spin').set({ target, time: Date.now() });
});

db.ref('wheel/spin').on('value', (snap) => {
    const data = snap.val();
    if (data && !isSpinning) {
        currentRotation = data.target;
        isSpinning = true;
        canvas.style.transform = `rotate(${data.target}rad)`;
        setTimeout(() => {
            isSpinning = false;
            calculateWinner(data.target);
        }, 5000);
    }
});

function calculateWinner(rotation) {
    const arc = 2 * Math.PI / names.length;
    const winningIndex = Math.floor((1.5 * Math.PI - (rotation % (2 * Math.PI)) + 4 * Math.PI) % (2 * Math.PI) / arc);
    const winner = names[(winningIndex + names.length) % names.length];
    document.getElementById('winner-text').innerText = winner;
    document.getElementById('winner-popup').classList.remove('hidden');
    if (!document.getElementById('admin-content').classList.contains('hidden')) {
        db.ref('wheel/history').push({ name: winner, time: new Date().toLocaleTimeString() });
    }
}

db.ref('wheel/history').on('value', (snap) => {
    historyList.innerHTML = "";
    snap.forEach(child => {
        const li = document.createElement('li');
        li.innerHTML = `<b>${child.val().name}</b> <small>${child.val().time}</small>`;
        historyList.prepend(li);
    });
});

function clearHistory() { if(confirm("Clear all?")) db.ref('wheel/history').remove(); }
