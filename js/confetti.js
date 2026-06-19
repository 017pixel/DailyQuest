const DQ_CONFETTI = (function () {
    const PALETTE = [
        '#5f8575', '#5b97d4', '#cf6679', '#ffd166', '#f8a5c2',
        '#7bdff2', '#a78bfa', '#f9c74f', '#90be6d', '#f94144',
        '#e6e1e5', '#ffffff'
    ];

    const EMIT_DURATION = 1.1;
    const TOTAL_DURATION = 5.0;

    let canvas = null;
    let ctx = null;
    let rafId = null;
    let running = false;
    let particles = [];
    let spawned = 0;
    let totalToSpawn = 0;
    let perSide = 0;
    let lastTime = 0;
    let totalTimer = 0;
    let W = 0, H = 0, dpr = 1;
    let tier = 'high';
    let rotateEnabled = true;
    let flutterEnabled = true;
    let onResize = null;

    function detectTier() {
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return 'off';

        const cores = navigator.hardwareConcurrency || 4;
        const mem = navigator.deviceMemory || 4;
        const small = Math.min(window.innerWidth, window.innerHeight) < 420;
        const lowEnd = cores <= 2 || mem <= 2 || small;

        if (lowEnd) return 'low';
        if (cores <= 4) return 'mid';
        return 'high';
    }

    function isEnabled() {
        try {
            return DQ_CONFIG.userSettings.confettiEnabled !== false;
        } catch (e) {
            return true;
        }
    }

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function makeParticle(side) {
        const fromLeft = side === 'left';
        const x = fromLeft ? -14 : W + 14;
        const y = rand(H * 0.08, H * 0.44);
        const vx = fromLeft ? rand(320, 840) : rand(-840, -320);
        const vy = rand(-300, 70);
        const size = rand(7, 13);
        const isCircle = Math.random() < 0.15;
        return {
            x: x, y: y, vx: vx, vy: vy,
            w: isCircle ? size : size,
            h: isCircle ? size : rand(4, 7),
            color: PALETTE[(Math.random() * PALETTE.length) | 0],
            rot: rand(0, Math.PI * 2),
            vrot: rand(-7, 7),
            flutterAmp: rand(25, 95),
            flutterFreq: rand(2.5, 6),
            flutterPhase: rand(0, Math.PI * 2),
            life: 0,
            isCircle: isCircle
        };
    }

    function setupCanvas() {
        canvas = document.createElement('canvas');
        canvas.setAttribute('aria-hidden', 'true');
        const style = canvas.style;
        style.position = 'fixed';
        style.inset = '0';
        style.left = '0';
        style.top = '0';
        style.width = '100%';
        style.height = '100%';
        style.pointerEvents = 'none';
        style.zIndex = '99999';
        style.display = 'block';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d', { alpha: true });
        resize();
    }

    function resize() {
        if (!canvas || !ctx) return;
        W = window.innerWidth;
        H = window.innerHeight;
        const maxDpr = tier === 'low' ? 1 : (tier === 'mid' ? 1.5 : 2);
        dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function step(now) {
        if (!running) return;
        if (!lastTime) lastTime = now;
        let dt = (now - lastTime) / 1000;
        lastTime = now;
        if (dt > 0.05) dt = 0.05;

        totalTimer += dt;

        const spawnRate = totalToSpawn / EMIT_DURATION;
        const target = Math.min(totalToSpawn, Math.floor(totalTimer * spawnRate));
        while (spawned < target) {
            const side = (spawned % 2 === 0) ? 'left' : 'right';
            particles.push(makeParticle(side));
            spawned++;
        }

        const gravity = H * 1.1;
        const dragVx = Math.exp(-0.55 * dt);
        const dragVy = Math.exp(-0.35 * dt);

        ctx.clearRect(0, 0, W, H);

        const remain = TOTAL_DURATION - totalTimer;
        const globalAlpha = remain < 0.5 ? Math.max(0, remain / 0.5) : 1;
        ctx.globalAlpha = globalAlpha;

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life += dt;
            p.vy += gravity * dt;
            p.vx *= dragVx;
            p.vy *= dragVy;
            p.x += p.vx * dt;
            if (flutterEnabled) {
                p.x += Math.sin(p.life * p.flutterFreq + p.flutterPhase) * p.flutterAmp * dt;
            }
            p.y += p.vy * dt;
            if (rotateEnabled) p.rot += p.vrot * dt;

            if (p.y > H + 50 || p.x < -80 || p.x > W + 80) {
                particles.splice(i, 1);
                continue;
            }

            ctx.fillStyle = p.color;
            if (rotateEnabled && !p.isCircle) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            } else if (p.isCircle) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.w / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
            }
        }

        ctx.globalAlpha = 1;

        if (totalTimer >= TOTAL_DURATION) {
            cleanup();
            return;
        }
        rafId = requestAnimationFrame(step);
    }

    function cleanup() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        particles = [];
        spawned = 0;
        lastTime = 0;
        totalTimer = 0;
        if (canvas && ctx) ctx.clearRect(0, 0, W, H);
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        canvas = null;
        ctx = null;
        if (onResize) {
            window.removeEventListener('resize', onResize);
            onResize = null;
        }
    }

    function burst() {
        if (running) return;
        if (!isEnabled()) return;
        tier = detectTier();
        if (tier === 'off') return;

        rotateEnabled = tier !== 'low';
        flutterEnabled = tier !== 'low';

        const area = window.innerWidth * window.innerHeight;
        const areaScale = Math.min(1, area / (420 * 900));
        let base;
        if (tier === 'low') base = 36;
        else if (tier === 'mid') base = 87;
        else base = 160;
        perSide = Math.max(12, Math.round(base * areaScale));
        totalToSpawn = perSide * 2;

        setupCanvas();
        onResize = function () { resize(); };
        window.addEventListener('resize', onResize, { passive: true });

        running = true;
        lastTime = 0;
        totalTimer = 0;
        rafId = requestAnimationFrame(step);
    }

    return {
        burst: burst,
        isRunning: function () { return running; }
    };
})();

try { window.DQ_CONFETTI = DQ_CONFETTI; } catch (e) {}
