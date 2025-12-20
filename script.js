// --- 1. FIREBASE CONFIGURATION ---
// PASTE YOUR KEYS FROM FIREBASE CONSOLE HERE
const firebaseConfig = {
  apiKey: "AIzaSyBzsE17xYYr7ittaUbkUr85WJWaADTl4gw",
  databaseURL: "https://spin-the-wheel-a5901-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "spin-the-wheel-a5901",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- 2. GLOBAL VARIABLES ---
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const nameInput = document.getElementById('nameInput');
const historyList = document.getElementById('historyList');

const colors = [
    "#FF5733","#33FF57","#3357FF","#F333FF","#FF3383","#33FFF5","#FFB833","#8D33FF",
    "#33FF8D","#FF3333","#DBFF33","#33DBFF","#00A86B","#FF7F50","#6A5ACD","#FFD700",
    "#FF1493","#00CED1","#ADFF2F","#FF4500"
];

let names = [];
let isSpinning = false;
let currentTotalRotation = 0;

// --- 3. WHEEL DRAWING ---
function drawWheel() {
    names = nameInput.value.split('\n').filter(n => n.trim() !== "");
    const sectors = names.length;
    if (sectors === 0) return;
    const arc = (2 * Math.PI) / sectors;
    const centerX = 250, centerY = 250;

    ctx.clearRect(0, 0, 500, 500);
    names.forEach((name, i) => {
        const angle = i * arc;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, 245, angle, angle + arc);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right"; ctx.fillStyle = "white";
        ctx.font = sectors > 15 ? "bold 12px Arial" : "bold 16px Arial";
        ctx.fillText(name, 230, 5);
        ctx.restore();
    });
}

// --- 4. ADMIN & TAB LOGIC ---
function checkAdminPassword() {
    if (prompt("Enter Admin Password:") === "1234") { showTab('admin'); }
    else { alert("Wrong Password!"); }
}

function showTab(tab) {
    document.getElementById('history-content').classList.toggle('hidden', tab !== 'history');
    document.getElementById('admin-content').classList.toggle('hidden', tab !== 'admin');
    document.getElementById('tab-history').classList.toggle('active', tab === 'history');
    document.getElementById('tab-admin').classList.toggle('active', tab === 'admin');
}

// --- 5. SPIN LOGIC (FIXED) ---
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'spinBtn') {
        if (isSpinning || names.length === 0) return;
        
        // Always add to rotation (Clockwise Only)
        const addedRotation = (15 * 2 * Math.PI) + (Math.random() * 2 * Math.PI);
        const nextRotation = currentTotalRotation + addedRotation;

        db.ref('wheel/spin').set({
            target: nextRotation,
            time: Date.now()
        });
    }
});

db.ref('wheel/spin').on('value', snap => {
    const data = snap.val();
    if (data && !isSpinning) {
        isSpinning = true;
        currentTotalRotation = data.target;
        canvas.style.transform = `rotate(${data.target}rad)`;

        setTimeout(() => {
            isSpinning = false;
            processWinner(data.target);
        }, 7000); // Wait for 7s animation
    }
});

// --- 6. WINNER & SYNC ---
function processWinner(rot) {
    const arc = (2 * Math.PI) / names.length;
    const normalized = rot % (2 * Math.PI);
    let winningIndex = Math.floor((1.5 * Math.PI - normalized + 10 * Math.PI) % (2 * Math.PI) / arc);
    winningIndex = (winningIndex % names.length + names.length) % names.length;

    const winner = names[winningIndex];
    document.getElementById('winner-text').innerText = winner;
    document.getElementById('winner-popup').classList.remove('hidden');

    // Admin records history to prevent duplicates
    if (!document.getElementById('admin-content').classList.contains('hidden')) {
        db.ref('wheel/history').push({ name: winner, time: new Date().toLocaleTimeString() });
    }
}

// Sync Names and History
nameInput.addEventListener('input', () => db.ref('wheel/names').set(nameInput.value));
db.ref('wheel/names').on('value', snap => {
    nameInput.value = snap.val() || "";
    drawWheel();
});

db.ref('wheel/history').on('value', snap => {
    historyList.innerHTML = "";
    snap.forEach(c => {
        const li = document.createElement('li');
        li.style.cssText = "background:#222; margin:5px 0; padding:10px; border-radius:5px; list-style:none; display:flex; justify-content:space-between;";
        li.innerHTML = `<span>${c.val().name}</span> <small style="color:var(--gold)">${c.val().time}</small>`;
        historyList.prepend(li);
    });
});

function clearHistory() { if(confirm("Clear log?")) db.ref('wheel/history').remove(); }

drawWheel();
