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
let name = "Player";
let host = false;
let count = 0;
let currentGame = "";
let buzzer = {pressed: false, locked: false};

function handleClick() {
    const panel = document.getElementById('panel');
    name = document.getElementById('name').value.trim() || "Player"; // add a random number to the end of this
    console.log(`Name set to: ${name}`); // debug
    count++;
    ws.send(JSON.stringify({ type: "setName", name }));
}

function SwitchView(viewId) {
    const views = ["landingPage", "waitingRoom", "whiteRoom", "host", "buzzerRoomGuest", "buzzerRoomHost"];
    views.forEach(id => {
        document.getElementById(id).style.display = id === viewId ? "block" : "none";
    });
    personalise(viewId)
}

function startGame() {
    // Start the selected game mode, e.g. by sending a message to the server
    if (currentGame == ""){
        // Show an error message or prompt the host to select a game mode
        alert("Please select a game mode before starting the game."); // dialog box
        return
    } else if (currentGame == "Buzzer") {
        // alert("Starting Buzzer Game!"); // dialog box
        ws.send(JSON.stringify({ type: "starting", game: currentGame }));
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
        }
    }
}

function buzzIn() {
    if (!buzzer.locked && !buzzer.pressed) {
        buzzer.pressed = true;
        ws.send(JSON.stringify({ type: "buzz in", name }));
        updateBuzzerText();
    }    
}

function personalise(viewId) { // this is to add some personalisation to the waiting room and white room, like showing the player's name
    if (viewId === "waitingRoom") {
        document.getElementById('greeting').textContent = `Welcome, ${name}! Waiting for the host to start the game...`;
    }

}

function removeTop() {
    if (host) {
        const buzzedList = document.getElementById("buzzersUl");
        n = buzzedList.firstChild ? buzzedList.firstChild.textContent : null;
        if (buzzedList.children.length > 0) {
            buzzedList.removeChild(buzzedList.firstChild);
        }
        // unbuzz the person
        ws.send(JSON.stringify({ type: "unbuzz", name: n }));
    }
}

function clearBuzzers() {
    if (host) {
        const buzzedList = document.getElementById("buzzersUl");
        while (buzzedList.firstChild) {
            buzzedList.removeChild(buzzedList.firstChild);
        }
        // notify to server to reset buzzers
        ws.send(JSON.stringify({ type: "clear buzzers" }));
    }
}

function lock() {
    if (host) {
        ws.send(JSON.stringify({ type: "lock buzzers" }));
    }
}
 
function unlock() {
    if (host) {
        ws.send(JSON.stringify({ type: "unlock buzzers" }));
    }
}

function updateBuzzerText() {
    const buzzInButton = document.getElementById("buzzInButton");
    console.log(`Buzzer state - Locked: ${buzzer.locked}, Pressed: ${buzzer.pressed}`); // debug
    if (buzzer.locked) {
        buzzInButton.textContent = "Locked";
        return
    }
    if (buzzer.pressed) {
        buzzInButton.textContent = "You Buzzed In!";
        return
    }
    buzzInButton.textContent = "Buzz In Dummy!";
    
}

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

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

    if (msg.type === "clear buzzers") {
        buzzer.pressed = false;
        buzzer.locked = false;
        updateBuzzerText();
    }

    if (msg.type === "lock buzzers") {
        buzzer.locked = true;
        updateBuzzerText();
    }

    if (msg.type === "unlock buzzers") {
        buzzer.locked = false;
        updateBuzzerText();
    }

    if (msg.type === "unbuzz") {
        if (msg.name === name) {
            buzzer.pressed = false;
            updateBuzzerText();
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

    if (msg.type === "buzz in") {
        console.log(`${msg.name} buzzed in!`);
        // Add the name to the unordered list in the host view
        if (document.getElementById("buzzerRoomHost").style.display === "block") { // all host commands
            const buzzedList = document.getElementById("buzzersUl");
            const li = document.createElement("li");
            li.textContent = msg.name;
            buzzedList.appendChild(li);
        } else {
            console.log("Not updating buzzed list because host view is not active");
        }
    }

};