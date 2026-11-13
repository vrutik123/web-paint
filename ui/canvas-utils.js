window.CanvasUtils = (function canvasUtilsModule() {
    
    function getCanvasPoint(event, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    function getDistance(startX, startY, endX, endY) {
        const dx = endX - startX;
        const dy = endY - startY;
        return Math.sqrt((dx * dx) + (dy * dy));
    }

    function clearCanvasLayer(canvasElement) {
        const context = canvasElement.getContext("2d");
        context.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }

    function drawPentagon(context, centerX, centerY, size) {
        context.beginPath();

        for (let i = 0; i < 5; i += 1) {
            const angle = ((i * 2 * Math.PI) / 5) - (Math.PI / 2);
            const px = centerX + (size * Math.cos(angle));
            const py = centerY + (size * Math.sin(angle));

            if (i === 0) {
                context.moveTo(px, py);
            } else {
                context.lineTo(px, py);
            }
        }

        context.closePath();
        context.stroke();
    }
function recognizeShape(points) {

    if (!points || points.length < 10) {
        return null;
    }

    const copiedPoints = points.map(point => ({
        X: point.X,
        Y: point.Y
    }));

    const result = window.DollarRecognizer.Recognize(copiedPoints);

    return {
        shape: result.Name,
        score: result.Score
    };
}

    return {
        getCanvasPoint: getCanvasPoint,
        getDistance: getDistance,
        clearCanvasLayer: clearCanvasLayer,
        drawPentagon: drawPentagon,
        recognizeShape: recognizeShape
    };
}());
