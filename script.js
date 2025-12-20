// --- 1. FIREBASE CONFIGURATION ---
// PASTE YOUR KEYS FROM FIREBASE CONSOLE HERE
const firebaseConfig = {
  apiKey: "AIzaSyBzsE17xYYr7ittaUbkUr85WJWaADTl4gw",
  databaseURL: "https://spin-the-wheel-a5901-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "spin-the-wheel-a5901",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- 2. DOM ELEMENTS ---
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const nameInput = document.getElementById('nameInput');
const spinBtn = document.getElementById('spinBtn');
const historyList = document.getElementById('historyList');
const winnerPopup = document.getElementById('winner-popup');
const winnerText = document.getElementById('winner-text');

let names = [];
let isSpinning = false;
let currentRotation = 0;

// --- 3. 12-COLOR PALETTE ---
const segmentColors = [
    "#FF5733", "#33FF57", "#3357FF", "#F333FF", 
    "#FF3383", "#33FFF5", "#FFB833", "#8D33FF", 
    "#33FF8D", "#FF3333", "#DBFF33", "#33DBFF"
];

// --- 4. WHEEL DRAWING LOGIC ---
function updateNames() {
    names = nameInput.value.split('\n').filter(n => n.trim() !== "");
    drawWheel();
}

function drawWheel() {
    const sectors = names.length;
    if (sectors === 0) return;
    
    const arc = 2 * Math.PI / sectors;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    names.forEach((name, i) => {
        const angle = i * arc;
        
        // Background slice
        ctx.fillStyle = segmentColors[i % segmentColors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, centerX - 10, angle, angle + arc);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text labels
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "black";
        ctx.font = "bold 18px Arial";
        ctx.fillText(name, centerX - 40, 10);
        ctx.restore();
    });
}

// --- 5. TABS & ADMIN LOGIC ---
function checkAdminPassword() {
    const pass = prompt("Enter Admin Password:");
    if (pass === "1234") {
        showTab('admin');
    } else {
        alert("Access Denied");
    }
}

function showTab(tabName) {
    document.getElementById('history-content').classList.add('hidden');
    document.getElementById('admin-content').classList.add('hidden');
    document.getElementById('tab-history').classList.remove('active');
    document.getElementById('tab-admin').classList.remove('active');

    document.getElementById(tabName + '-content').classList.remove('hidden');
    document.getElementById('tab-' + tabName).classList.add('active');
}

// --- 6. REAL-TIME SYNC (FIREBASE) ---

// ADMIN: Sync names to cloud
nameInput.addEventListener('input', () => {
    db.ref('liveWheel/names').set(nameInput.value);
});

// ALL DEVICES: Update wheel when names change in cloud
db.ref('liveWheel/names').on('value', (snap) => {
    const val = snap.val();
    if (val !== null) {
        nameInput.value = val;
        updateNames();
    }
});

// ADMIN: Send Spin Command
spinBtn.addEventListener('click', () => {
    if (isSpinning || names.length === 0) return;
    
    // Calculate new target rotation
    const spinAmount = (20 * Math.PI) + (Math.random() * 2 * Math.PI);
    const newTotalRotation = currentRotation + spinAmount;

    db.ref('liveWheel/spinEvent').set({
        targetRotation: newTotalRotation,
        timestamp: Date.now()
    });
});

// ALL DEVICES: Run the spin animation
db.ref('liveWheel/spinEvent').on('value', (snap) => {
    const data = snap.val();
    if (data && !isSpinning) {
        currentRotation = data.targetRotation;
        isSpinning = true;
        canvas.style.transform = `rotate(${data.targetRotation}rad)`;

        setTimeout(() => {
            isSpinning = false;
            calculateWinner(data.targetRotation);
        }, 5000);
    }
});

// --- 7. WINNER & HISTORY ---
function calculateWinner(rotation) {
    const sectors = names.length;
    const arc = (2 * Math.PI) / sectors;
    
    // 1.5 * PI is the top (12 o'clock) where the pointer is
    const actualRotation = rotation % (2 * Math.PI);
    let winningIndex = Math.floor((1.5 * Math.PI - actualRotation + 4 * Math.PI) % (2 * Math.PI) / arc);
    winningIndex = (winningIndex % sectors + sectors) % sectors;

    const winner = names[winningIndex];
    winnerText.innerText = winner;
    winnerPopup.classList.remove('hidden');

    // ONLY the Admin records result to history to avoid duplicates
    const isAdminOpen = !document.getElementById('admin-content').classList.contains('hidden');
    if (isAdminOpen) {
        db.ref('liveWheel/history').push({
            name: winner,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    }
}

// ALL DEVICES: Sync History List
db.ref('liveWheel/history').on('value', (snap) => {
    historyList.innerHTML = "";
    snap.forEach(child => {
        const item = child.val();
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.name}</strong> <small>${item.time}</small>`;
        historyList.prepend(li);
    });
});

function clearHistory() {
    if (confirm("Clear results for everyone?")) {
        db.ref('liveWheel/history').remove();
    }
}

// Initial draw on load
updateNames();
