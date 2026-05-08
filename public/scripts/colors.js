import { registerHandler, sendMessage, SwitchView, name} from './main.js';

// document.getElementById("findThisColor")
// document.getElementById("myColor")
document.getElementById("mySliderRed").oninput = () => updateColor();
document.getElementById("mySliderGreen").oninput = () => updateColor();
document.getElementById("mySliderBlue").oninput = () => updateColor();
document.getElementById("checkColor").onclick = () => verifyAndRefresh();
let highScore = 0;

function updateColor() {
    const r = document.getElementById("mySliderRed").value;
    const g = document.getElementById("mySliderGreen").value;
    const b = document.getElementById("mySliderBlue").value;
    console.log(`Updating color to: rgb(${r}, ${g}, ${b})`); // debug
    document.getElementById("RedHex").textContent = `#${Number(r).toString(16).padStart(2, '0')}`;
    document.getElementById("GreenHex").textContent = `#${Number(g).toString(16).padStart(2, '0')}`;
    document.getElementById("BlueHex").textContent = `#${Number(b).toString(16).padStart(2, '0')}`;
    const color = `rgb(${r}, ${g}, ${b})`;
    document.getElementById("myColor").style.backgroundColor = color;
}

function verifyAndRefresh() {
    const findColor = document.getElementById("findThisColor").style.backgroundColor;
    const myColor = document.getElementById("myColor").style.backgroundColor;
    console.log(`Verifying colors: findColor=${findColor}, myColor=${myColor}`); // debug
    const [r1, g1, b1] = findColor.match(/\d+/g).map(Number);
    const [r2, g2, b2] = myColor.match(/\d+/g).map(Number);
    console.log(`Parsed colors: findColor=(${r1}, ${g1}, ${b1}), myColor=(${r2}, ${g2}, ${b2})`);
    const score = scoreColors(r1, g1, b1, r2, g2, b2);
    if (score > highScore) {
        highScore = score;
    }
    document.getElementById("scoreLabel").textContent = `Score: ${score} High Score: ${highScore}`;
    // give a new color to do
    const newR = Math.floor(Math.random() * 256);
    const newG = Math.floor(Math.random() * 256);
    const newB = Math.floor(Math.random() * 256);
    const newColor = `rgb(${newR}, ${newG}, ${newB})`;
    document.getElementById("findThisColor").style.backgroundColor = newColor;
}



function scoreColors(r1, g1, b1, r2, g2, b2) {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;

    // Weights reflect human colour perception
    const distance = Math.sqrt(0.30 * dr*dr + 0.59 * dg*dg + 0.11 * db*db);

    // Max possible weighted distance
    const max = Math.sqrt(0.30 * 255**2 + 0.59 * 255**2 + 0.11 * 255**2);

    return score(Math.round((1 - distance / max) * 100));
}

function score(percentage) {
    if (percentage<50) {
        return Math.round(Math.exp(0.01*percentage));
    } else {
        return Math.round(Math.max(percentage**2/48-13*percentage/12, Math.exp(0.01*percentage)));
    }
}