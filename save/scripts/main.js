// ── The only line that changes for ESP32 ──────────────────────
// const WS_URL = `ws://${location.host}`;
// Change this line in index.html
const WS_URL = "ws://localhost:8765";
// On ESP32 it might be: const WS_URL = "ws://192.168.4.1:81";
// ─────────────────────────────────────────────────────────────

const COLORS = [
    { label: "White",  value: "#ffffff" },
    { label: "Red",    value: "#ff4444" },
    { label: "Green",  value: "#44bb44" },
    { label: "Blue",   value: "#4466ff" },
    { label: "Yellow", value: "#ffee44" },
];

let role = null;
let playername = null;
const ws = new WebSocket(WS_URL);

function applyState(state) {
    document.body.style.backgroundColor = state.backgroundColor;
    document.getElementById("counter").textContent = "What is this?";
}

function renderHost() {
    document.getElementById("role-label").textContent = "You are the Host";
    document.getElementById("counter").style.display = "block";
    const panel = document.getElementById("panel");
    panel.innerHTML = "<p>Pick a background color:</p>";
    COLORS.forEach(({ label, value }) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.backgroundColor = value;
    btn.onclick = () => ws.send(JSON.stringify({ type: "setColor", color: value }));
    panel.appendChild(btn);
    });
}

function renderGuest() {
    document.getElementById("role-label").textContent = "You are a Guest";
    document.getElementById("counter").contentEditable = "true";
    document.getElementById("nameInput").contentEditable = "true";
    document.getElementById("counter").style.display = "block";
    const panel = document.getElementById("panel");
    panel.innerHTML = "";
    const btn = document.createElement("button");
    btn.textContent = "Buzz";
    // btn.onclick = () => ws.send(JSON.stringify({ type: "buzz in" }));
    btn.onclick = () => confirmName();
    panel.appendChild(btn);
}

function confirmName() {
    const input = document.getElementById("nameInput");
    playerName = input.textContent.trim().slice(0, -3) || "Broke";
    console.log(`Player name set to: ${playerName}`); // debug

    // Tell the server
    ws.send(JSON.stringify({ type: "setName", name: playerName }));

    // Lock the field — replace input with plain text
    const container = document.getElementById("nameContainer");
    container.innerHTML = `<p>Playing as <strong>${playerName}</strong></p>`;
}

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "init") {
    role = msg.role;
    applyState(msg.state);
    role === "host" ? renderHost() : renderGuest();
    }

    if (msg.type === "stateUpdate") {
    applyState(msg.state);
    }

    if (msg.type === "roleChange") {
    role = msg.role;
    applyState(msg.state);
    renderHost(); // promoted to host
    }
};