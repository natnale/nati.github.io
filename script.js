// 1. Paste your Firebase Config here (from your Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyBzsE17xYYr7ittaUbkUr85WJWaADTl4gw",
  databaseURL: "https://spin-the-wheel-a5901-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "spin-the-wheel-a5901",
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 2. Real-Time Sync: Names List
// Only the Admin writes to the database when they type
nameInput.addEventListener('input', () => {
    database.ref('namesList').set(nameInput.value);
});

// Every device listens for name changes and updates their wheel instantly
database.ref('namesList').on('value', (snapshot) => {
    const remoteNames = snapshot.val();
    if (remoteNames) {
        nameInput.value = remoteNames;
        updateNames(); // Redraws the wheel for everyone
    }
});

// 3. Real-Time Sync: The Spin
function spin() {
    if (isSpinning || names.length === 0) return;
    
    // Admin calculates the "Winning Rotation"
    const spinAmount = (20 * Math.PI) + (Math.random() * 2 * Math.PI);
    
    // Send the instruction to the cloud
    database.ref('spinTrigger').set({
        targetRotation: spinAmount,
        time: Date.now() // Ensures a fresh event
    });
}

// Every device waits for the "spinTrigger" signal
database.ref('spinTrigger').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && !isSpinning) {
        // Everyone starts the 5-second animation at the same time
        runSynchronizedSpin(data.targetRotation);
    }
});

function runSynchronizedSpin(rotation) {
    isSpinning = true;
    canvas.style.transform = `rotate(${rotation}rad)`;

    setTimeout(() => {
        isSpinning = false;
        calculateWinner(rotation); // Everyone sees the same winner
    }, 5000);
}

// 4. Real-Time Sync: History
function recordResult(winner) {
    // Only Admin records to history to avoid duplicates
    database.ref('history').push({
        name: winner,
        timestamp: new Date().toLocaleTimeString()
    });
}

// Sync the history list for all devices
database.ref('history').on('value', (snapshot) => {
    const list = document.getElementById('historyList');
    list.innerHTML = "";
    snapshot.forEach(child => {
        const item = child.val();
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.name}</strong> <small>${item.timestamp}</small>`;
        list.prepend(li);
    });
});const canvas = document.getElementById('wheelCanvas');
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

// Update Wheel when names change
function updateNames() {
    names = nameInput.value.split('\n').filter(n => n.trim() !== "");
    drawWheel();
}

function drawWheel() {
    const sectors = names.length;
    if (sectors === 0) return;
    const arc = 2 * Math.PI / sectors;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    names.forEach((name, i) => {
        const angle = i * arc;
        ctx.fillStyle = (i % 2 === 0) ? "#d00000" : "#1a1a1a";
        ctx.beginPath();
        ctx.moveTo(250, 250);
        ctx.arc(250, 250, 240, angle, angle + arc);
        ctx.lineTo(250, 250);
        ctx.fill();
        ctx.strokeStyle = "#d4af37";
        ctx.stroke();

        ctx.save();
        ctx.translate(250, 250);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        ctx.font = sectors > 15 ? "bold 12px Arial" : "bold 16px Arial";
        ctx.fillText(name, 230, 5);
        ctx.restore();
    });
}

function spin() {
    if (isSpinning || names.length === 0) return;
    isSpinning = true;

    const spinAmount = (20 * Math.PI) + (Math.random() * 2 * Math.PI);
    currentRotation += spinAmount;
    canvas.style.transform = `rotate(${currentRotation}rad)`;

    setTimeout(() => {
        isSpinning = false;
        const arc = 2 * Math.PI / names.length;
        const relativeRotation = currentRotation % (2 * Math.PI);
        const pointerAngle = 1.5 * Math.PI;
        
        let winningIndex = Math.floor((pointerAngle - relativeRotation + 4 * Math.PI) % (2 * Math.PI) / arc);
        winningIndex = (winningIndex + names.length) % names.length;

        const winner = names[winningIndex];
        
        // 1. Record the result
        recordResult(winner);
        
        // 2. Show Popup
        winnerText.innerText = winner;
        winnerPopup.classList.remove('hidden');
    }, 5000);
}

function recordResult(winner) {
    const li = document.createElement('li');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    li.innerHTML = `<strong>${winner}</strong> <small style="float:right">${time}</small>`;
    historyList.prepend(li); // Adds new winner to the top of the list
}

function clearHistory() {
    historyList.innerHTML = "";
}

function showTab(tabName) {
    document.getElementById('history-tab').classList.add('hidden');
    document.getElementById('admin-tab').classList.add('hidden');
    document.getElementById(tabName + '-tab').classList.remove('hidden');
}

// Listeners
nameInput.addEventListener('input', updateNames);
spinBtn.addEventListener('click', spin);
closeBtn.addEventListener('click', () => winnerPopup.classList.add('hidden'));

updateNames();
// ... (keep your existing variables at the top)

const ADMIN_PASSWORD = "1234";

function checkAdminPassword() {
    const entry = prompt("Enter Admin Password to access settings:");
    
    if (entry === ADMIN_PASSWORD) {
        showTab('admin');
    } else {
        alert("Wrong password! Access denied.");
    }
}

function showTab(tabName) {
    // Hide all tabs
    document.getElementById('history-tab').classList.add('hidden');
    document.getElementById('admin-tab').classList.add('hidden');
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.remove('hidden');
}

function recordResult(winner) {
    const msg = document.getElementById('empty-msg');
    if (msg) msg.style.display = 'none';

    const li = document.createElement('li');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    li.innerHTML = `<strong>${winner}</strong> <small style="float:right">${time}</small>`;
    
    const historyList = document.getElementById('historyList');
    historyList.prepend(li);
}

function clearHistory() {
    if (confirm("Are you sure you want to delete all recorded results?")) {
        document.getElementById('historyList').innerHTML = "";
        const msg = document.getElementById('empty-msg');
        if (msg) msg.style.display = 'block';
        alert("Results cleared.");
    }
}

// ... (keep the rest of your spin and drawing logic)

