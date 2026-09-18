const canvas = document.getElementById('drawingCanvas');

let currentTool = null;
let x = 0;
let y = 0;
let isDrawing = false;


// ================= PENCIL =================

const pencil = document.getElementById('pencil');

pencil.addEventListener('click', () => {
    currentTool = 'pencil';

    document.body.style.cursor =
        'url(/resources/pencil.png), auto';

    isDrawing = false;
});


// ================= ERASER =================

const eraser = document.getElementById('eraser');

eraser.addEventListener('click', () => {
    currentTool = 'eraser';

    document.body.style.cursor =
        'url(/resources/eraser.png), auto';

    isDrawing = false;
});


// ================= TRASH =================

const trash = document.getElementById('trash');

trash.addEventListener('click', () => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    isDrawing = false;
});


// ================= PAINT BUCKET =================

const paintBucket = document.getElementById('paint-bucket');

paintBucket.addEventListener('click', () => {
    currentTool = 'paintBucket';

    document.body.style.cursor =
        'url(/resources/paint-bucket.png), auto';

    isDrawing = false;
});


// ================= HIGHLIGHTER =================

const highlighter = document.getElementById('highlighter');

highlighter.addEventListener('click', () => {
    currentTool = 'highlighter';

    document.body.style.cursor =
        'url(/resources/highlighter.png), auto';

    isDrawing = false;
});


// ================= SELECT =================

const select = document.getElementById('select');

select.addEventListener('click', () => {
    currentTool = 'select';

    document.body.style.cursor = 'pointer';

    isDrawing = false;
});


// ================= CANVAS MOUSEMOVE =================

canvas.addEventListener('mousemove', (event) => {

    // Only pencil code runs when pencil is selected
    if (currentTool === 'pencil' && event.buttons === 1) {

        if (!isDrawing) {
            x = event.clientX - canvas.offsetLeft;
            y = event.clientY - canvas.offsetTop + 27;

            isDrawing = true;
        }

        console.log(
            'Drawing with pencil at',
            event.clientX,
            event.clientY
        );

        const ctx = canvas.getContext('2d');

        ctx.beginPath();
         ctx.lineWidth = 1;
        ctx.strokeStyle =  'black';
        ctx.moveTo(x, y);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineTo(
            event.clientX - canvas.offsetLeft,
            event.clientY - canvas.offsetTop + 27
        );

        x = event.clientX - canvas.offsetLeft;
        y = event.clientY - canvas.offsetTop + 27;

        ctx.stroke();
    }

    // Mouse button released
    if (event.buttons !== 1) {
        isDrawing = false;
    }

    // Only eraser code runs when eraser is selected
    if (currentTool === 'eraser' && event.buttons === 1) {
        ctx = canvas.getContext('2d');
        ctx.clearRect(event.clientX - canvas.offsetLeft-10, event.clientY - canvas.offsetTop-10, 50, 50);
    }




    // Only highlighter code runs when highlighter is selected
    if (currentTool === 'highlighter' && event.buttons === 1) {

        if (!isDrawing) {
            x = event.clientX - canvas.offsetLeft;
            y = event.clientY - canvas.offsetTop + 27;

            isDrawing = true;
        }
        console.log(
            'Drawing with pencil at',
            event.clientX,
            event.clientY
        );

        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.lineWidth = 50;
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.09)'; // Yellow color with transparency
        ctx.moveTo(x, y);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineTo(
            event.clientX - canvas.offsetLeft,
            event.clientY - canvas.offsetTop + 27
        );

        x = event.clientX - canvas.offsetLeft;
        y = event.clientY - canvas.offsetTop + 27;

        ctx.stroke();
    }

    // Mouse button released
    if (event.buttons !== 1) {
        isDrawing = false;
    }



   

});