const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const nameInput = document.getElementById('nameInput');
const spinBtn = document.getElementById('spinBtn');
const winnerPopup = document.getElementById('winner-popup');
const winnerText = document.getElementById('winner-text');
const closeBtn = document.getElementById('closeBtn');

let names = [];
let isSpinning = false;
let currentRotation = 0; // Keep track of cumulative rotation

function updateNames() {
    names = nameInput.value.split('\n').filter(name => name.trim() !== "");
    drawWheel();
}

function drawWheel() {
    const sectors = names.length;
    if (sectors === 0) return;
    const arc = 2 * Math.PI / sectors;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    names.forEach((name, i) => {
        const angle = i * arc;
        // Roulette Colors: Red and Black
        ctx.fillStyle = (i % 2 === 0) ? "#d00000" : "#1a1a1a";
        
        ctx.beginPath();
        ctx.moveTo(250, 250);
        ctx.arc(250, 250, 240, angle, angle + arc);
        ctx.lineTo(250, 250);
        ctx.fill();
        
        // Gold Divider Lines
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(250, 250);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        ctx.font = sectors > 20 ? "bold 10px Arial" : "bold 14px Arial";
        ctx.fillText(name, 230, 5);
        ctx.restore();
    });
}

function spin() {
    if (isSpinning || names.length === 0) return;
    isSpinning = true;

    // 1. Calculate a random rotation
    const sectors = names.length;
    const arc = 2 * Math.PI / sectors;
    
    // Spin at least 10 full circles (3600 degrees) plus a random amount
    const extraDegrees = Math.random() * 2 * Math.PI;
    const spinAmount = (20 * Math.PI) + extraDegrees; 
    
    currentRotation += spinAmount;

    // 2. Apply clockwise rotation via CSS
    canvas.style.transform = `rotate(${currentRotation}rad)`;

    setTimeout(() => {
        isSpinning = false;

        // 3. Winner Calculation for Clockwise Rotation
        // The pointer is at the top (1.5 * PI). 
        // We find the relative angle within the last circle.
        const relativeRotation = currentRotation % (2 * Math.PI);
        const pointerAngle = (1.5 * Math.PI); // Top of the circle
        
        // Formula for clockwise winner:
        let winningIndex = Math.floor((pointerAngle - relativeRotation + 4 * Math.PI) % (2 * Math.PI) / arc);
        
        // Safety check for index range
        winningIndex = (winningIndex + sectors) % sectors;

        winnerText.innerText = names[winningIndex];
        winnerPopup.classList.remove('hidden');
    }, 5000);
}

nameInput.addEventListener('input', updateNames);
spinBtn.addEventListener('click', spin);
closeBtn.addEventListener('click', () => {
    winnerPopup.classList.add('hidden');
});

// Initialize
updateNames();