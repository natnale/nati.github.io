// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBzsE17xYYr7ittaUbkUr85WJWaADTl4gw",
  databaseURL: "https://spin-the-wheel-a5901-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "spin-the-wheel-a5901",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- 2. DOM ELEMENTS ---
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const nameInput = document.getElementById('nameInput');
const spinBtn = document.getElementById('spinBtn');
const historyList = document.getElementById('historyList');
const winnerPopup = document.getElementById('winner-popup');
const winnerText = document.getElementById('winner-text');
const closeBtn = document.getElementById('closeBtn');

let names = [];
let isSpinning = false;
let currentRotation = 0;

// --- 3. WHEEL DRAWING LOGIC ---
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
        ctx.fillStyle = (i % 2 === 0) ? "#d00000" : "#1a1a1a"; // Roulette Colors
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, centerX - 10, angle, angle + arc);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        ctx.strokeStyle = "#d4af37"; // Gold border
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        let fontSize = sectors > 15 ? 10 : 14;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillText(name, centerX - 30, 5);
        ctx.restore();
    });
}

// --- 4. REAL-TIME SYNC LOGIC ---

// ADMIN: Sync names to database
nameInput.addEventListener('input', () => {
    database.ref('liveWheel/names').set(nameInput.value);
});

// ALL DEVICES: Listen for name updates
database.ref('liveWheel/names').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data !== null) {
        nameInput.value = data;
        updateNames();
    }
});

// ADMIN: Trigger Spin
spinBtn.addEventListener('click', () => {
    if (isSpinning || names.length === 0) return;

    // Calculate a unique rotation for this spin
    const newRotation = currentRotation + (20 * Math.PI) + (Math.random() * 2 * Math.PI);
    
    // Upload the spin command to Firebase
    database.ref('liveWheel/spinCommand').set({
        targetRotation: newRotation,
        startTime: Date.now() 
    });
});

// ALL DEVICES: Listen for the spin command
database.ref('liveWheel/spinCommand').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && !isSpinning) {
        currentRotation = data.targetRotation;
        runSpin(data.targetRotation);
    }
});

function runSpin(target) {
    isSpinning = true;
    canvas.style.transform = `rotate(${target}rad)`;

    setTimeout(() => {
        isSpinning = false;
        calculateWinner(target);
    }, 5000);
}

// --- 5. WINNER & HISTORY LOGIC ---

function calculateWinner(rotation) {
    const arc = 2 * Math.PI / names.length;
    const relativeRotation = rotation % (2 * Math.PI);
    const pointerAngle = 1.5 * Math.PI; // Top position
    
    let winningIndex = Math.floor((pointerAngle - relativeRotation + 4 * Math.PI) % (2 * Math.PI) / arc);
    winningIndex = (winningIndex + names.length) % names.length;

    const winner = names[winningIndex];
    winnerText.innerText = winner;
    winnerPopup.classList.remove('hidden');

    // ONLY the person who triggered the spin (Admin) records to history
    // We check this by seeing if the Admin Panel is currently visible
    if (!document.getElementById('admin-tab').classList.contains('hidden')) {
        recordResult(winner);
    }
}

function recordResult(winner) {
    database.ref('liveWheel/history').push({
        name: winner,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
}

// ALL DEVICES: Sync History List
database.ref('liveWheel/history').on('value', (snapshot) => {
    historyList.innerHTML = "";
    snapshot.forEach(child => {
        const item = child.val();
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.name}</strong> <small style="float:right">${item.time}</small>`;
        historyList.prepend(li);
    });
});

function clearHistory() {
    if (confirm("Clear all results for everyone?")) {
        database.ref('liveWheel/history').remove();
    }
}

closeBtn.addEventListener('click', () => winnerPopup.classList.add('hidden'));

// Initial Draw
updateNames();
function showTab(tabName) {
    // 1. Hide BOTH content areas
    document.getElementById('history-content').classList.add('hidden');
    document.getElementById('admin-content').classList.add('hidden');
    
    // 2. Remove 'active' styling from both buttons
    document.getElementById('tab-history').classList.remove('active');
    document.getElementById('tab-admin').classList.remove('active');

    // 3. Show the one you clicked
    document.getElementById(tabName + '-content').classList.remove('hidden');
    document.getElementById('tab-' + tabName).classList.add('active');
}
function checkAdminPassword() {
    const entry = prompt("Enter Admin Password:");
    if (entry === "1234") {
        showTab('admin');
    } else {
        alert("Incorrect Password");
    }
}


