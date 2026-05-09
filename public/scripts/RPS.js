import { registerHandler, sendMessage, SwitchView, name} from './main.js';

document.getElementById("summon").onclick = summon;
document.getElementById("start").onclick = startGame;
document.getElementById("reset").onclick = resetGame;

localStorage.setItem("currentGrid", JSON.stringify([])); // Initialize the grid in local storage

function summon() {
    let xcoord = parseInt(document.getElementById('xcoordinate').value);
    let ycoord = parseInt(document.getElementById('ycoordinate').value);
    let item = document.getElementById('items').value;

    // if the coordinates are valid
    if (xcoord < 0 || xcoord > 19) {
        alert("X coordinate must be between 0 and 19.");
        return;
    }
    if (ycoord < 0 || ycoord > 19) {
        alert("Y coordinate must be between 0 and 19.");
        return;
    }

    // if there is something already there
    const currentGrid = JSON.parse(localStorage.getItem("currentGrid"));
    if (currentGrid.some(item => item[0] === xcoord && item[1] === ycoord)) {
        alert("There is already an item at these coordinates. Please choose different coordinates.");
        return;
    }

    console.log(`Summoning ${item} at (${xcoord}, ${ycoord})`); // debug
    sendMessage("summon", { x: xcoord, y: ycoord, img: `${item}.jpg`, target: "none" });

}

function startGame() {
    if (host) {
        sendMessage("startRPS");
    }
}

function resetGame() {
    if (host) {
        sendMessage("reset");
    }
}

function placeImage(x, y, imageName) {
  const img = document.createElement("img");
  img.src = `./Images/${imageName}`;
  img.style.position = "absolute";
  img.style.left = `${x}px`;
  img.style.top  = `${y}px`;
  img.style.width  = "50px";
  img.style.height = "50px";
  document.getElementById("grid").appendChild(img);
}

registerHandler("updateGrid", (msg) => {
    // destoy the old grid
    // find all elements called "img" and remove them
    const oldImages = document.querySelectorAll("#grid img");
    oldImages.forEach(img => img.remove());
    for (const item of msg.g) {
        const [x, y, img] = item;
        placeImage(x, y, img);
    }
    currentGrid = msg.g; // Update the current grid variable
    // localStorage.setItem("currentGrid", JSON.stringify(msg.g)); // Update the grid in local storage
});