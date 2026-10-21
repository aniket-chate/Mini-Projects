/**
 * Hotel Grand Bangalore — Live Ambient Atmospheric Background Engine
 * Inspires by Grand Emily Hotel (Afterglow/Dribbble) & Taj Bangalore Luxury
 * Features:
 * - Fluid organic chromatic aura (Champagne Gold, Regal Emerald, Deep Obsidian)
 * - Interactive stardust motes & firefly particles reacting to cursor physics
 * - Smooth wave oscillation and dynamic light following scroll and cursor
 */

(function () {
    function initLiveBackground() {
        // Create or bind canvas
        let canvas = document.getElementById('liveAmbientCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'liveAmbientCanvas';
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.zIndex = '-1';
            canvas.style.pointerEvents = 'none';
            document.body.insertBefore(canvas, document.body.firstChild);
        }

        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        let mouseX = width / 2;
        let mouseY = height / 3;
        let targetMouseX = mouseX;
        let targetMouseY = mouseY;
        let isMoving = false;
        let lastMoveTime = Date.now();

        // Particles collection
        const particles = [];
        const particleCount = Math.min(65, Math.max(30, Math.floor(width / 25)));

        const colors = [
            { r: 223, g: 183, b: 108 }, // Taj Gold
            { r: 235, g: 210, b: 159 }, // Warm Champagne
            { r: 61, g: 104, b: 73 },   // Regal Emerald
            { r: 182, g: 154, b: 104 }, // Heritage Bronze
            { r: 255, g: 245, b: 225 }  // Ivory Starlight
        ];

        for (let i = 0; i < particleCount; i++) {
            const c = colors[Math.floor(Math.random() * colors.length)];
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -Math.random() * 0.35 - 0.1, // gently rising
                baseRadius: Math.random() * 2.2 + 0.8,
                radius: Math.random() * 2.2 + 0.8,
                color: c,
                alpha: Math.random() * 0.5 + 0.15,
                pulseSpeed: Math.random() * 0.02 + 0.008,
                pulseOffset: Math.random() * Math.PI * 2
            });
        }

        // Ambient fluid blobs
        const blobs = [
            { x: width * 0.2, y: height * 0.3, radius: 450, color: 'rgba(31, 56, 43, 0.18)', vx: 0.2, vy: 0.15 },
            { x: width * 0.8, y: height * 0.4, radius: 520, color: 'rgba(223, 183, 108, 0.09)', vx: -0.15, vy: 0.2 },
            { x: width * 0.5, y: height * 0.75, radius: 580, color: 'rgba(182, 134, 60, 0.07)', vx: 0.1, vy: -0.18 },
            { x: width * 0.3, y: height * 0.85, radius: 400, color: 'rgba(23, 37, 31, 0.25)', vx: -0.12, vy: -0.1 }
        ];

        function onResize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', onResize);

        window.addEventListener('mousemove', (e) => {
            targetMouseX = e.clientX;
            targetMouseY = e.clientY;
            isMoving = true;
            lastMoveTime = Date.now();
        });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                targetMouseX = e.touches[0].clientX;
                targetMouseY = e.touches[0].clientY;
                isMoving = true;
                lastMoveTime = Date.now();
            }
        }, { passive: true });

        let time = 0;

        function render() {
            time += 0.015;

            // Smooth mouse follow
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;

            // Clear background with rich dark obsidian base
            ctx.fillStyle = '#090C0B';
            ctx.fillRect(0, 0, width, height);

            // 1. Draw animated fluid ambient glowing blobs
            blobs.forEach((b, idx) => {
                b.x += b.vx + Math.sin(time * 0.5 + idx) * 0.3;
                b.y += b.vy + Math.cos(time * 0.4 + idx) * 0.3;

                // Bounce gently
                if (b.x < -100) b.x = width + 100;
                if (b.x > width + 100) b.x = -100;
                if (b.y < -100) b.y = height + 100;
                if (b.y > height + 100) b.y = -100;

                const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
                grad.addColorStop(0, b.color);
                grad.addColorStop(1, 'rgba(9, 12, 11, 0)');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            // 2. Draw dynamic interactive cursor aura glow
            const cursorRadius = Math.min(width, height) * 0.35;
            const cursorGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, cursorRadius);
            cursorGrad.addColorStop(0, 'rgba(223, 183, 108, 0.075)');
            cursorGrad.addColorStop(0.5, 'rgba(36, 77, 58, 0.04)');
            cursorGrad.addColorStop(1, 'rgba(9, 12, 11, 0)');

            ctx.fillStyle = cursorGrad;
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, cursorRadius, 0, Math.PI * 2);
            ctx.fill();

            // 3. Draw starlight & gold dust motes with gentle physics
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around edges
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                // Mouse repulsion & interaction
                const dx = mouseX - p.x;
                const dy = mouseY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 140) {
                    const force = (1 - dist / 140) * 1.8;
                    p.x -= (dx / dist) * force;
                    p.y -= (dy / dist) * force;
                }

                // Pulsing glow
                const pulse = Math.sin(time * p.pulseSpeed * 10 + p.pulseOffset);
                const currentAlpha = Math.max(0.08, p.alpha + pulse * 0.18);
                const currentRadius = Math.max(0.5, p.baseRadius + pulse * 0.4);

                ctx.beginPath();
                ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.8)`;
                ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            // 4. Subtle connecting ethereal lines for nearby golden particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 95) {
                        const lineAlpha = (1 - dist / 95) * 0.12;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(223, 183, 108, ${lineAlpha})`;
                        ctx.lineWidth = 0.6;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(render);
        }

        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLiveBackground);
    } else {
        initLiveBackground();
    }
})();
