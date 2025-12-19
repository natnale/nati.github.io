:root {
    --gold: #d4af37;
    --red: #d00000;
}

body {
    background: #111;
    color: white;
    font-family: 'Segoe UI', sans-serif;
    margin: 0;
    overflow-x: hidden;
}

.main-layout { display: flex; height: 100vh; }

/* Wheel Layout */
.wheel-section { flex: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; }
canvas { width: 90%; max-width: 450px; height: auto; border: 8px solid var(--gold); border-radius: 50%; transition: transform 5s cubic-bezier(0.15, 0, 0.15, 1); }

/* Sidebar Tabs */
.sidebar { flex: 1; background: #222; border-left: 2px solid var(--gold); display: flex; flex-direction: column; }
.tabs { display: flex; }
.tabs button { flex: 1; padding: 15px; background: #333; color: white; border: none; cursor: pointer; border-bottom: 2px solid transparent; }
.tabs button:hover { background: #444; }

.tab-content { padding: 20px; flex: 1; overflow-y: auto; }
.hidden { display: none !important; }

/* History List */
#historyList { list-style: none; padding: 0; }
#historyList li { background: #333; margin-bottom: 5px; padding: 10px; border-radius: 5px; border-left: 4px solid var(--gold); }

textarea { width: 100%; height: 300px; background: #000; color: #0f0; border: 1px solid var(--gold); padding: 10px; font-size: 16px; box-sizing: border-box; }

/* Mobile View */
@media (max-width: 768px) {
    .main-layout { flex-direction: column; height: auto; }
    .wheel-section { height: 70vh; }
    .sidebar { height: 50vh; border-left: none; border-top: 2px solid var(--gold); }
}

/* Winner Popup */
#winner-popup { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.95); display: flex; align-items:center; justify-content:center; z-index:1000; }
.popup-content { background: white; color: black; padding: 40px; border-radius: 20px; text-align: center; border: 4px solid var(--gold); }
/* Add this to your existing style.css */
.clear-btn {
    background: #ff4d4d;
    color: white;
    border: none;
    padding: 10px;
    width: 100%;
    border-radius: 5px;
    font-weight: bold;
    cursor: pointer;
    margin-bottom: 20px;
}

.clear-btn:hover {
    background: #cc0000;
}

hr {
    border: 0;
    border-top: 1px solid var(--gold);
    margin: 20px 0;
}
