const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const nameInput = document.getElementById('nameInput');
const spinBtn = document.getElementById('spinBtn');
const winnerPopup = document.getElementById('winner-popup');
const winnerText = document.getElementById('winner-text');
const closeBtn = document.getElementById('closeBtn');

let names = [];
let isSpinning = false;
let currentRotation = 0;

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
        ctx.fillStyle = (i % 2 === 0) ? "#d00000" : "#1a1a1a";
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, centerX - 10, angle, angle + arc);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        ctx.strokeStyle = "#d4af37";
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        // Adjust font size based on how many names there are
        let fontSize = sectors > 10 ? 12 : 16;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillText(name, centerX - 30, 5);
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
        const pointerAngle = (1.5 * Math.PI); 
        
        let winningIndex = Math.floor((pointerAngle - relativeRotation + 4 * Math.PI) % (2 * Math.PI) / arc);
        winningIndex = (winningIndex + names.length) % names.length;

        winnerText.innerText = names[winningIndex];
        winnerPopup.classList.remove('hidden');
    }, 5000);
}

nameInput.addEventListener('input', updateNames);
spinBtn.addEventListener('click', spin);
closeBtn.addEventListener('click', () => {
    winnerPopup.classList.add('hidden');
});

updateNames();
