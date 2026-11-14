const canvas = document.getElementById("drawingCanvas");
const previewCanvas = document.getElementById("previewCanvas");
const drawingContext = canvas.getContext("2d");
const previewContext = previewCanvas.getContext("2d");
let setcolor = "black";
let strokeWidth = 2;
let opacity = 1;
let currentTool = null;
let x = 0;
let y = 0;
let isDrawing = false;
let flag = false;
let magicPoints = [];
const undoStack = [];
const redoStack = [];
const historyLimit = 30;
const drawingTools = new Set([
    "pencil",
    "eraser",
    "highlighter",
    "magic",
    "square",
    "circle",
    "triangle",
    "rectangle",
    "pentagon"
]);

function updateHistoryButtons() {
    document.getElementById("undo").disabled = undoStack.length === 0;
    document.getElementById("redo").disabled = redoStack.length === 0;
}

function saveCanvasState() {
    undoStack.push(drawingContext.getImageData(0, 0, canvas.width, canvas.height));

    if (undoStack.length > historyLimit) {
        undoStack.shift();
    }

    redoStack.length = 0;
    updateHistoryButtons();
}

function restoreCanvasState(imageData) {
    drawingContext.putImageData(imageData, 0, 0);
    CanvasUtils.clearCanvasLayer(previewCanvas);
    isDrawing = false;
    magicPoints = [];
    flag = false;
}

function undoCanvas() {
    if (undoStack.length === 0) {
        return;
    }

    redoStack.push(drawingContext.getImageData(0, 0, canvas.width, canvas.height));
    restoreCanvasState(undoStack.pop());
    updateHistoryButtons();
}

function redoCanvas() {
    if (redoStack.length === 0) {
        return;
    }

    undoStack.push(drawingContext.getImageData(0, 0, canvas.width, canvas.height));
    restoreCanvasState(redoStack.pop());
    updateHistoryButtons();
}

function setActiveTool(toolName, cursorValue) {
    currentTool = toolName;
    document.body.style.cursor = cursorValue;
    isDrawing = false;
}

function registerTool(toolId, toolName, cursorValue) {
    const element = document.getElementById(toolId);
    element.addEventListener("click", () => {
        setActiveTool(toolName, cursorValue);
    });
}

registerTool("pencil", "pencil", "url(https://vrutik123.github.io/web-paint/resources/pencil.png), auto");
registerTool("eraser", "eraser", "url(https://vrutik123.github.io/web-paint/resources/eraser.png), auto");
registerTool("paint-bucket", "paintBucket", "url(https://vrutik123.github.io/web-paint/resources/paint-bucket.png), auto");
registerTool("highlighter", "highlighter", "url(https://vrutik123.github.io/web-paint/resources/highlighter.png), auto");
registerTool("magic", "magic", "url(https://vrutik123.github.io/web-paint/resources/megical_pencil.png), auto");
registerTool("square", "square", "crosshair");
registerTool("circle", "circle", "crosshair");
registerTool("triangle", "triangle", "crosshair");
registerTool("rectangle", "rectangle", "crosshair");
registerTool("pentagon", "pentagon", "crosshair");

document.querySelectorAll(".color-radio").forEach((input) => {
    input.addEventListener("change", () => {
        setcolor = input.value;
        const colorSwatch = document.getElementById("color-swatch");
        if (colorSwatch) {
            colorSwatch.style.backgroundColor = setcolor;
        }
    });
});

const widthSlider = document.getElementById("width-slider");
const widthValue = document.getElementById("width-value");
widthSlider.addEventListener("input", () => {
    strokeWidth = Number(widthSlider.value);
    widthValue.textContent = `${strokeWidth} px`;
});

const opacitySlider = document.getElementById("opacity-slider");
const opacityValue = document.getElementById("opacity-value");
opacitySlider.addEventListener("input", () => {
    opacity = Number(opacitySlider.value) / 100;
    opacityValue.textContent = `${opacitySlider.value}%`;
});

function adjustSlider(slider, amount) {
    const min = Number(slider.min);
    const max = Number(slider.max);
    const value = Number(slider.value) + amount;
    slider.value = String(Math.min(max, Math.max(min, value)));
    slider.dispatchEvent(new Event("input", { bubbles: true }));
}

function navigateColor(direction) {
    const colors = Array.from(document.querySelectorAll(".color-radio"));
    const currentIndex = colors.findIndex((color) => color.checked);

    if (currentIndex === -1) {
        return;
    }

    const nextIndex = (currentIndex + direction + colors.length) % colors.length;
    colors[nextIndex].checked = true;
    colors[nextIndex].dispatchEvent(new Event("change", { bubbles: true }));
}

const trash = document.getElementById("trash");
trash.addEventListener("click", () => {
    saveCanvasState();
    CanvasUtils.clearCanvasLayer(canvas);
    isDrawing = false;
});

document.getElementById("undo").addEventListener("click", undoCanvas);
document.getElementById("redo").addEventListener("click", redoCanvas);
updateHistoryButtons();

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const isPlus = event.key === "+" || event.key === "=";
    const isMinus = event.key === "-" || event.key === "_";

    if (currentTool && event.ctrlKey && (isPlus || isMinus)) {
        event.preventDefault();
        adjustSlider(opacitySlider, isPlus ? 1 : -1);
        return;
    }

    if (currentTool && !event.ctrlKey && (isPlus || isMinus)) {
        event.preventDefault();
        adjustSlider(widthSlider, isPlus ? 1 : -1);
        return;
    }

    if (currentTool && !event.ctrlKey && (key === "arrowleft" || key === "arrowright")) {
        event.preventDefault();
        navigateColor(key === "arrowright" ? 1 : -1);
        return;
    }

    if (event.ctrlKey && key === "z") {
        event.preventDefault();
        undoCanvas();
    } else if (event.ctrlKey && key === "y") {
        event.preventDefault();
        redoCanvas();
    }
});

function floodFill(startX, startY, color) {

    const imageData = drawingContext.getImageData(
        0, 0, canvas.width, canvas.height
    );

    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const startPos = (startY * width + startX) * 4;

    const targetR = data[startPos];
    const targetG = data[startPos + 1];
    const targetB = data[startPos + 2];
    const targetA = data[startPos + 3];

    // Convert selected CSS color into RGBA
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 1;
    tempCanvas.height = 1;

    const tempContext = tempCanvas.getContext("2d");
    tempContext.fillStyle = color;
    tempContext.fillRect(0, 0, 1, 1);

    const fillData = tempContext.getImageData(0, 0, 1, 1).data;

    const fillR = fillData[0];
    const fillG = fillData[1];
    const fillB = fillData[2];
    const fillA = Math.round(fillData[3] * opacity);

    // Same color? No need to fill
    if (
        targetR === fillR &&
        targetG === fillG &&
        targetB === fillB &&
        targetA === fillA
    ) {
        return;
    }

    const stack = [[startX, startY]];

    while (stack.length > 0) {

        const [x, y] = stack.pop();

        if (
            x < 0 || x >= width ||
            y < 0 || y >= height
        ) {
            continue;
        }

        const pos = (y * width + x) * 4;

        if (
            data[pos] !== targetR ||
            data[pos + 1] !== targetG ||
            data[pos + 2] !== targetB ||
            data[pos + 3] !== targetA
        ) {
            continue;
        }

        data[pos] = fillR;
        data[pos + 1] = fillG;
        data[pos + 2] = fillB;
        data[pos + 3] = fillA;

        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
    }

    drawingContext.putImageData(imageData, 0, 0);
}
function drawRecognizedShape(shape, points) {

    const xs = points.map(p => p.X);
    const ys = points.map(p => p.Y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    drawingContext.save();

    drawingContext.beginPath();
    drawingContext.strokeStyle = setcolor;
    drawingContext.lineWidth = strokeWidth;
    drawingContext.globalAlpha = opacity;
    drawingContext.lineCap = "round";
    drawingContext.lineJoin = "round";

    if (shape.toLowerCase() === "circle") {

        const radius = Math.min(maxX - minX, maxY - minY) / 2;

        drawingContext.arc(
            centerX,
            centerY,
            radius,
            0,
            Math.PI * 2
        );

        drawingContext.stroke();

    } else if (shape.toLowerCase() === "rectangle") {

        drawingContext.strokeRect(
            minX,
            minY,
            maxX - minX,
            maxY - minY
        );

    } else if (shape.toLowerCase() === "square") {

        const size = Math.min(maxX - minX, maxY - minY);

        drawingContext.strokeRect(
            centerX - size / 2,
            centerY - size / 2,
            size,
            size
        );

    } else if (shape.toLowerCase() === "triangle") {

        drawingContext.moveTo(centerX, minY);
        drawingContext.lineTo(maxX, maxY);
        drawingContext.lineTo(minX, maxY);
        drawingContext.closePath();

        drawingContext.stroke();

    } else if (shape.toLowerCase() === "line") {

        drawingContext.moveTo(
            points[0].X,
            points[0].Y
        );

        drawingContext.lineTo(
            points[points.length - 1].X,
            points[points.length - 1].Y
        );

        drawingContext.stroke();
    }

    drawingContext.restore();
}
canvas.addEventListener("mousemove", (event) => {
    const point = CanvasUtils.getCanvasPoint(event, canvas);
    const currentX = point.x;
    const currentY = point.y;

    if (event.buttons === 1 && !isDrawing && drawingTools.has(currentTool)) {
        saveCanvasState();
    }

    if (currentTool === "pencil" && event.buttons === 1) {
        if (!isDrawing) {
            x = currentX;
            y = currentY + 27;
            isDrawing = true;
        }

        console.log("Drawing with pencil at", event.clientX, event.clientY);

        drawingContext.beginPath();
        drawingContext.strokeStyle = setcolor;
        drawingContext.lineWidth = strokeWidth;
        drawingContext.globalAlpha = opacity;
        drawingContext.moveTo(x, y);
        drawingContext.lineCap = "round";
        drawingContext.lineJoin = "round";
        drawingContext.lineTo(currentX, currentY + 27);
        x = currentX;
        y = currentY + 27;
        drawingContext.stroke();
    }

    if (event.buttons !== 1) {
        isDrawing = false;
    }
    if (currentTool === "magic" && event.buttons === 1) {
        if (!isDrawing) {
            x = currentX;
            y = currentY+27;
            isDrawing = true;
        }
        magicPoints.push({
            X: currentX,
            Y: currentY + 27
        });

        previewContext.beginPath();
        previewContext.strokeStyle = setcolor;
        previewContext.lineWidth = strokeWidth;
        previewContext.globalAlpha = opacity;
        previewContext.moveTo(x, y);
        previewContext.lineCap = "round";
        previewContext.lineJoin = "round";
        previewContext.lineTo(currentX, currentY + 27);

        x = currentX;
        y = currentY + 27;

        previewContext.stroke();

        flag = true;
    }

    if (event.buttons !== 1 && currentTool === "magic" && flag) {

        isDrawing = false;
        const result = CanvasUtils.recognizeShape(magicPoints);
        console.log("Recognized shape:", result ? result.shape : "None");
        console.log("Confidence:", result ? result.score : 0);
        CanvasUtils.clearCanvasLayer(previewCanvas);

        if (result && result.score >= 0.65) {

            drawRecognizedShape(result.shape, magicPoints);

        } else {

            console.log("Shape not recognized");
        }
        magicPoints = [];
        flag = false;
    }

    if (currentTool === "eraser" && event.buttons === 1) {
        isDrawing = true;
        drawingContext.clearRect(currentX - strokeWidth, currentY - strokeWidth, strokeWidth * 2, strokeWidth * 2);
    }

    if (currentTool === "highlighter" && event.buttons === 1) {
        if (!isDrawing) {
            x = currentX;
            y = currentY + 27;
            isDrawing = true;
        }

        console.log("Drawing with highlighter at", event.clientX, event.clientY);

        drawingContext.beginPath();
        drawingContext.lineWidth = strokeWidth;
        drawingContext.strokeStyle = setcolor;
        drawingContext.globalAlpha = opacity;
        drawingContext.moveTo(x, y);
        drawingContext.lineCap = "round";
        drawingContext.lineJoin = "round";
        drawingContext.lineTo(currentX, currentY + 27);
        x = currentX;
        y = currentY + 27;
        drawingContext.stroke();
    }

    if (event.buttons !== 1) {
        isDrawing = false;
    }

    if (currentTool === "square" && event.buttons === 1) {
        if (!isDrawing) {
            x = currentX;
            y = currentY;
            isDrawing = true;
        }

        CanvasUtils.clearCanvasLayer(previewCanvas);
        previewContext.lineWidth = strokeWidth;
        previewContext.strokeStyle = setcolor;
        previewContext.globalAlpha = opacity;
        const max = Math.max(currentX - x, currentY - y);
        previewContext.strokeRect(x, y, max, max);
        flag = true;
    }

    if (event.buttons !== 1 && currentTool === "square" && flag) {
        isDrawing = false;
        drawingContext.lineWidth = strokeWidth;
        drawingContext.strokeStyle = setcolor;
        drawingContext.globalAlpha = opacity;
        const max = Math.max(currentX - x, currentY - y);
        drawingContext.strokeRect(x, y, max, max);
        CanvasUtils.clearCanvasLayer(previewCanvas);
        console.log("Square drawn from", x, y, "to", event.clientX, event.clientY);
        flag = false;
    }

    if (currentTool === "circle" && event.buttons === 1) {
        if (!isDrawing) {
            x = currentX;
            y = currentY;
            isDrawing = true;
        }

        CanvasUtils.clearCanvasLayer(previewCanvas);
        previewContext.lineWidth = strokeWidth;
        previewContext.beginPath();
        previewContext.strokeStyle = setcolor;
        previewContext.globalAlpha = opacity;
        previewContext.arc(x, y, CanvasUtils.getDistance(x, y, currentX, currentY), 0, Math.PI * 2);
        previewContext.stroke();
        flag = true;
    }

    if (event.buttons !== 1 && currentTool === "circle" && flag) {
        isDrawing = false;
        drawingContext.beginPath();
        drawingContext.lineWidth = strokeWidth;
        drawingContext.strokeStyle = setcolor;
        drawingContext.globalAlpha = opacity;
        drawingContext.arc(x, y, CanvasUtils.getDistance(x, y, currentX, currentY), 0, Math.PI * 2);
        drawingContext.stroke();
        CanvasUtils.clearCanvasLayer(previewCanvas);
        console.log("Circle drawn from", x, y, "to", event.clientX, event.clientY);
        flag = false;
    }

    if (currentTool === "triangle" && event.buttons === 1) {
        if (!isDrawing) {
            x = currentX;
            y = currentY;
            isDrawing = true;
        }

        CanvasUtils.clearCanvasLayer(previewCanvas);
        previewContext.lineWidth = strokeWidth;
        previewContext.beginPath();
        previewContext.strokeStyle = setcolor;
        previewContext.globalAlpha = opacity;
        previewContext.moveTo(x, y);
        previewContext.lineTo(currentX, currentY);
        previewContext.lineTo((2 * x) - currentX, currentY);
        previewContext.closePath();
        previewContext.stroke();
        flag = true;
    }

    if (event.buttons !== 1 && currentTool === "triangle" && flag) {
        isDrawing = false;
        drawingContext.lineWidth = strokeWidth;
        drawingContext.strokeStyle = setcolor;
        drawingContext.globalAlpha = opacity;
        drawingContext.beginPath();
        drawingContext.moveTo(x, y);
        drawingContext.lineTo(currentX, currentY);
        drawingContext.lineTo((2 * x) - currentX, currentY);
        drawingContext.closePath();
        drawingContext.stroke();
        CanvasUtils.clearCanvasLayer(previewCanvas);
        console.log("Triangle drawn from", x, y, "to", event.clientX, event.clientY);
        flag = false;
    }

    if (currentTool === "rectangle" && event.buttons === 1) {
        if (!isDrawing) {
            x = currentX;
            y = currentY;
            isDrawing = true;
        }

        CanvasUtils.clearCanvasLayer(previewCanvas);
        previewContext.lineWidth = strokeWidth;
        previewContext.strokeStyle = setcolor;
        previewContext.globalAlpha = opacity;
        previewContext.strokeRect(x, y, currentX - x, currentY - y);
        flag = true;
    }

    if (event.buttons !== 1 && currentTool === "rectangle" && flag) {
        isDrawing = false;
        drawingContext.lineWidth = strokeWidth;
        drawingContext.strokeStyle = setcolor;
        drawingContext.globalAlpha = opacity;
        drawingContext.strokeRect(x, y, currentX - x, currentY - y);
        CanvasUtils.clearCanvasLayer(previewCanvas);
        console.log("Rectangle drawn from", x, y, "to", event.clientX, event.clientY);
        flag = false;
    }

    if (currentTool === "pentagon" && event.buttons === 1) {
        if (!isDrawing) {
            x = currentX;
            y = currentY;
            isDrawing = true;
        }

        CanvasUtils.clearCanvasLayer(previewCanvas);
        previewContext.lineWidth = strokeWidth;
        previewContext.strokeStyle = setcolor;
        previewContext.globalAlpha = opacity;
        CanvasUtils.drawPentagon(previewContext, x, y, CanvasUtils.getDistance(x, y, currentX, currentY));
        flag = true;
    }

    if (event.buttons !== 1 && currentTool === "pentagon" && flag) {
        isDrawing = false;
        drawingContext.strokeStyle = setcolor;
        drawingContext.lineWidth = strokeWidth;
        drawingContext.globalAlpha = opacity;
        CanvasUtils.drawPentagon(drawingContext, x, y, CanvasUtils.getDistance(x, y, currentX, currentY));
        CanvasUtils.clearCanvasLayer(previewCanvas);
        console.log("Pentagon drawn from", x, y, "to", event.clientX, event.clientY);
        flag = false;
    }
});
canvas.addEventListener("click", (event) => {

    if (currentTool === "paintBucket") {

        const point = CanvasUtils.getCanvasPoint(event, canvas);

        saveCanvasState();
        floodFill(
            Math.floor(point.x),
            Math.floor(point.y),
            setcolor
        );

    }

});

