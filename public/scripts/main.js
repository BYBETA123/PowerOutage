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


const ws = new WebSocket(WS_URL); // connect to WebSocket server
export let name = "Player";
export let host = false;
let count = 0;
export let currentGame = "";

const messageHandlers = {};

document.getElementById('button').onclick = handleClick;
document.getElementById('buzzerBtn').onclick = () => selectGame('Buzzer');
document.getElementById('RPSBtn').onclick = () => selectGame('RPS');
document.getElementById('game3Btn').onclick = () => selectGame('Game 3');
document.getElementById('startGameBtn').onclick = startGame;

export function registerHandler(type, handler) {
    messageHandlers[type] = handler;
}

export function sendMessage(type, payload = {}) {
    ws.send(JSON.stringify({ type, ...payload }));
}

export function SwitchView(viewId) {
    const views = ["landingPage", "waitingRoom", "whiteRoom", "host", "buzzerRoomGuest", "buzzerRoomHost", "RPSGuest", "RPSHost"];
    views.forEach(id => {
        document.getElementById(id).style.display = id === viewId ? "flex" : "none";
    });
    personalise(viewId)
}

function handleClick() {
    const panel = document.getElementById('panel');
    name = document.getElementById('name').value.trim() || "Player"; // add a random number to the end of this
    console.log(`Name set to: ${name}`); // debug
    count++;
    sendMessage("setName", { name });
}

function startGame() {
    // Start the selected game mode, e.g. by sending a message to the server
    if (currentGame == ""){
        // Show an error message or prompt the host to select a game mode
        alert("Please select a game mode before starting the game."); // dialog box
        return
    } else if (currentGame == "Buzzer") {
        ws.send(JSON.stringify({ type: "starting", game: currentGame }));
    } else if (currentGame == "RPS") {
        ws.send(JSON.stringify({ type: "starting", game: currentGame }));
    } else {
        alert("Selected game mode is not implemented yet.");
    }
}

function selectGame(game) {
    currentGame = game;
    console.log(`Selected game: ${game}`);
    // update the Picked Game Text
    document.getElementById('picked').textContent = `Picked Game: ${game}`;
    ws.send(JSON.stringify({ type: "foundGame", game }));
}

function starting(g) {
    console.log(`Starting game: ${g}`);
    if (g == "Buzzer") {
        if (host) {
            SwitchView("buzzerRoomHost");
        } else {
            SwitchView("buzzerRoomGuest");
            document.getElementById('buzzerIntro').textContent = `Welcome to the buzzer, you are playing as \"${name}\"!!`;
        }
    } else if (g == "RPS") {
        if (host) {
            SwitchView("RPSGuest");
            document.querySelector(".host-only-RPS").style.display = "block";
        } else {
            SwitchView("RPSGuest");
        }
    }
}

function personalise(viewId) { // this is to add some personalisation to the waiting room and white room, like showing the player's name
    if (viewId === "waitingRoom") {
        document.getElementById('greeting').textContent = `Welcome, ${name}! Waiting for the host to start the game...`;
    }
}

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    const handler = messageHandlers[msg.type];
    if (handler) {
        console.log(`Handling message of type: ${msg.type}`); // debug
        handler(msg);
    } else {
        console.warn(`No handler registered for message type: ${msg.type}`);
    }

    if (msg.type === "nameSet") {
        console.log(`Name set to: ${msg.name}`);
        name = msg.name;
        console.log(msg)
        host = msg.host;
        if (msg.host) {
            SwitchView("host");
        } else {
            SwitchView("waitingRoom");
        }
    }

    if (msg.type === "nameFailed") {
        alert(msg.reason);
    }

    if (msg.type === "gameFound") {
        console.log(`Game found: ${msg.game}`);
        if (!host) {
            // we want to update the text to say what game we are playing, e.g. "You are playing: [game name]"
            document.getElementById('greeting').textContent = `Welcome, ${name}! Waiting for the host to start the ${msg.game}...`;

        }
    }

    if (msg.type === "playerJoined") {
        console.log(`${msg.name} joined the room. Are you picking this up? ${host}`);
        if (host){
            console.log(`${msg.name} joined the room`);
            // Update the players list in the host view
            if (document.getElementById("host").style.display === "block") { // all host commands
                const playersList = document.getElementById("playersUl");
                for (const child of playersList.children) {
                    child.remove();
                }
                for (const name of msg.namelist) {
                    if (name == null) {
                        continue
                    }
                    const li = document.createElement("li");
                    li.textContent = name;
                    playersList.appendChild(li);
                }
            } else {
                console.log("Not updating players list because host view is not active");
            }
        }
    }

    if (msg.type === "starting") {
        console.log("Game is starting!");
        starting(msg.game);
    }

};