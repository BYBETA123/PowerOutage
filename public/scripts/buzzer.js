import { registerHandler, sendMessage, SwitchView, name} from './main.js';

document.getElementById("rmtp").addEventListener("click", removeTop);
document.getElementById("clr").addEventListener("click", clearBuzzers);
document.getElementById("lockbuzzer").addEventListener("click", lock);
document.getElementById("unlockbuzzer").addEventListener("click", unlock);
document.getElementById("buzzInButton").addEventListener("click", buzzIn);

let buzzer = {pressed: false, locked: false};

registerHandler("clear buzzers", (msg) => {
    buzzer.pressed = false;
    buzzer.locked = false;
    updateBuzzerText();
});

registerHandler("lock buzzers", (msg) => {
    buzzer.locked = true;
    updateBuzzerText();
});

registerHandler("unlock buzzers", (msg) => {
    buzzer.locked = false;
    updateBuzzerText();
});

registerHandler("unbuzz", (msg) => {
    console.log(`Unbuzzing ${msg.name}`);
    if (msg.name === name) {
        buzzer.pressed = false;
        updateBuzzerText();
    }
});

registerHandler("buzz in", (msg) => {
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

});

function buzzIn() {
    if (!buzzer.locked && !buzzer.pressed) {
        buzzer.pressed = true;
        sendMessage("buzz in", { name });
        updateBuzzerText();
    }    
}

function removeTop() {
    if (host) {
        const buzzedList = document.getElementById("buzzersUl");
        let n = buzzedList.firstChild ? buzzedList.firstChild.textContent : null;
        if (buzzedList.children.length > 0) {
            buzzedList.removeChild(buzzedList.firstChild);
        }
        // unbuzz the person
        sendMessage("unbuzz", { name: n });
    }
}

function clearBuzzers() {
    if (host) {
        const buzzedList = document.getElementById("buzzersUl");
        while (buzzedList.firstChild) {
            buzzedList.removeChild(buzzedList.firstChild);
        }
        // notify to server to reset buzzers
        sendMessage("clear buzzers");
    }
}

function lock() {
    if (host) {
        sendMessage("lock buzzers");
    }
}
 
function unlock() {
    if (host) {
        sendMessage("unlock buzzers");
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