/**
 * Hotel Grand — 3D Hero Particle Constellation & Hologram Effect
 */

(function () {
    function initHeroParticles() {
        const canvas = document.getElementById('heroParticlesCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
        let height = canvas.height = canvas.parentElement.clientHeight || window.innerHeight;

        const particles = [];
        const particleCount = Math.min(80, Math.floor(width / 18));
        let mouseX = width / 2;
        let mouseY = height / 2;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                radius: Math.random() * 2 + 1,
                color: Math.random() > 0.4 ? 'rgba(0, 240, 255,' : (Math.random() > 0.5 ? 'rgba(223, 183, 108,' : 'rgba(168, 85, 247,'),
                alpha: Math.random() * 0.6 + 0.2
            });
        }

        window.addEventListener('resize', () => {
            if (!canvas.parentElement) return;
            width = canvas.width = canvas.parentElement.clientWidth;
            height = canvas.height = canvas.parentElement.clientHeight;
        });

        window.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });

        function render() {
            ctx.clearRect(0, 0, width, height);

            // Draw connecting lines between particles close to each other
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 110) {
                        const lineAlpha = (1 - dist / 110) * 0.22;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(0, 240, 255, ${lineAlpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw particles with slight mouse gravity
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                // Mouse interaction repulsion
                const dx = mouseX - p.x;
                const dy = mouseY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    p.x -= (dx / dist) * 1.5;
                    p.y -= (dy / dist) * 1.5;
                }

                ctx.beginPath();
                ctx.fillStyle = `${p.color} ${p.alpha})`;
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#00f0ff';
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            requestAnimationFrame(render);
        }

        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeroParticles);
    } else {
        initHeroParticles();
    }
})();
