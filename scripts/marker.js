// Highlighter mode. Enter the cheat code (↑ ↑ ↓ ↓ ← → ← → b a), or tap the hint
// in the footer, then draw yellow marker strokes anywhere. Strokes fade after a
// few seconds. Esc, the code again or the hint again puts the cap back on.
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('marker-canvas');
    const hint = document.getElementById('marker-hint');
    const toast = document.getElementById('toast');
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    const HOLD_MS = 2500;
    const FADE_MS = 1200;

    let active = false;
    let strokes = [];
    let drawing = null;
    let frame = null;
    let progress = 0;
    let toastTimer = null;

    const showToast = (message) => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
    };

    const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const highlightColour = () => getComputedStyle(document.documentElement).getPropertyValue('--marker').trim() || 'rgba(255, 230, 0, 0.45)';

    const draw = () => {
        const now = performance.now();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 22;
        ctx.strokeStyle = highlightColour();

        strokes = strokes.filter(s => s === drawing || now - s.end < HOLD_MS + FADE_MS);
        strokes.forEach(stroke => {
            const age = stroke === drawing ? 0 : now - stroke.end;
            ctx.globalAlpha = age < HOLD_MS ? 1 : 1 - (age - HOLD_MS) / FADE_MS;
            ctx.beginPath();
            stroke.points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
            // A single tap still leaves a dot.
            if (stroke.points.length === 1) ctx.lineTo(stroke.points[0][0] + 0.1, stroke.points[0][1]);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;

        frame = strokes.length ? requestAnimationFrame(draw) : null;
    };

    const kick = () => {
        if (!frame) frame = requestAnimationFrame(draw);
    };

    const setActive = (on) => {
        active = on;
        document.documentElement.classList.toggle('marker-mode', on);
        hint?.setAttribute('aria-pressed', String(on));
        showToast(on ? 'highlighter mode: draw anywhere. press esc to put the cap back on.' : 'cap back on.');
    };

    canvas.addEventListener('pointerdown', (e) => {
        if (!active) return;
        canvas.setPointerCapture(e.pointerId);
        drawing = { points: [[e.clientX, e.clientY]], end: 0 };
        strokes.push(drawing);
        kick();
    });

    canvas.addEventListener('pointermove', (e) => {
        if (!drawing) return;
        drawing.points.push([e.clientX, e.clientY]);
    });

    const finish = () => {
        if (!drawing) return;
        drawing.end = performance.now();
        drawing = null;
        kick();
    };
    canvas.addEventListener('pointerup', finish);
    canvas.addEventListener('pointercancel', finish);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && active) return setActive(false);
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        progress = key === CODE[progress] ? progress + 1 : (key === CODE[0] ? 1 : 0);
        if (progress === CODE.length) {
            progress = 0;
            setActive(!active);
        }
    });

    hint?.addEventListener('click', () => setActive(!active));

    window.addEventListener('resize', resize);
    resize();
});
