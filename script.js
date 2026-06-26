// Retro Terminal Portfolio — v7
// nav routing · clock · ASCII animations · boot sequence · IP lookup

// ── Navigation ───────────────────────────────────────────────────
const navLinks     = document.querySelectorAll('.nav-link');
const screens      = document.querySelectorAll('.screen');
const titleSection = document.getElementById('title-section');

function activate(targetId) {
    if (!document.getElementById(targetId)) return;
    screens.forEach(s  => s.classList.toggle('active', s.id === targetId));
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.target === targetId));
    if (titleSection) titleSection.textContent = targetId;
    if (history.replaceState) history.replaceState(null, '', '#' + targetId);
}

// Mobile hamburger
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');

function closeMenu() {
    if (!navMenu) return;
    navMenu.classList.remove('open');
    if (navToggle) {
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    }
}

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        const open = navMenu.classList.toggle('open');
        navToggle.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
}

document.querySelectorAll('[data-target]').forEach(el => {
    el.addEventListener('click', e => {
        const target = el.dataset.target;
        if (!target) return;
        e.preventDefault();
        activate(target);
        closeMenu();
    });
});

const initial = (location.hash || '#home').replace('#', '');
if (document.getElementById(initial)) activate(initial);

// Keyboard shortcuts: 1-4
const keyMap = { '1': 'home', '2': 'about', '3': 'projects', '4': 'contact' };
document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    const target = keyMap[e.key];
    if (target) activate(target);
});

// ── Live clock ───────────────────────────────────────────────────
const clockEl = document.getElementById('clock');
function tick() {
    if (!clockEl) return;
    const d   = new Date();
    const pad = n => String(n).padStart(2, '0');
    clockEl.textContent =
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
tick();
setInterval(tick, 1000);

// ── ASCII art animation (home page) ─────────────────────────────
// Splits the <pre id="ascii-art"> into per-line <span>s so CSS
// can stagger the reveal and rolling wave independently.
function animateASCII() {
    const ascii = document.getElementById('ascii-art');
    if (!ascii) return;

    const escape = s =>
        s.replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;');

    const lines = ascii.textContent.split('\n');
    ascii.innerHTML = lines
        .map((line, i) =>
            `<span class="ascii-line" style="--i:${i}">${escape(line) || '\u00a0'}</span>`
        )
        .join('');
}

// ── Boot-line + hero stagger ─────────────────────────────────────
// Timed so boot lines appear right after the ASCII finishes printing.
function animateHomeSequence() {
    const ASCII_LINES   = 24;   // approximate line count in the art
    const MS_PER_LINE   = 45;
    const START_OFFSET  = 300;
    const asciiEndMs    = START_OFFSET + ASCII_LINES * MS_PER_LINE; // ≈ 1 380 ms

    const bootLines = document.querySelectorAll('#home .boot-line');
    bootLines.forEach((el, i) => {
        el.style.animationDelay = `${asciiEndMs + i * 210}ms`;
    });

    const heroStart = asciiEndMs + bootLines.length * 210 + 80;
    document.querySelectorAll('#home .hero-fade').forEach((el, i) => {
        el.style.animationDelay = `${heroStart + i * 130}ms`;
    });
}

// ── Bottom-bar ASCII wave animation ─────────────────────────────
// Renders 3 rows of a smooth sine-density wave using Unicode block
// characters. The result is positioned behind the social links at
// low opacity, giving a subtle "data-stream" feel.
function initBottomASCII() {
    const el = document.getElementById('bottom-ascii');
    if (!el) return;

    // Density ramp: space → solid block, giving a sine-wave silhouette
    const CHARS = [' ', '\u00b7', '\u2218', '\u25e6', '\u2022', '\u25cb', '\u25c9', '\u25cf'];
    const ROWS  = 3;
    let   phase = 0;
    let   last  = 0;

    function frame(ts) {
        // throttle to ~24 fps for subtlety
        if (ts - last >= 42) {
            const charPx = 9;   // approx px per char at 0.72 rem mono
            const cols   = Math.max(20, Math.floor(el.offsetWidth / charPx));
            let   out    = '';

            for (let r = 0; r < ROWS; r++) {
                const rowPhaseOffset = (r / ROWS) * Math.PI * 1.3;
                for (let x = 0; x < cols; x++) {
                    // two overlapping sine waves per row for organic feel
                    const v =
                        (Math.sin(x * 0.19 - phase + rowPhaseOffset) * 0.55 +
                         Math.sin(x * 0.37 - phase * 1.3 + rowPhaseOffset) * 0.45 + 1) / 2;
                    const idx = Math.min(CHARS.length - 1, Math.floor(v * CHARS.length));
                    out += CHARS[idx];
                }
                if (r < ROWS - 1) out += '\n';
            }

            el.textContent = out;
            phase += 0.055;
            last   = ts;
        }
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

// ── Boot ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    animateASCII();
    animateHomeSequence();
    initBottomASCII();
});

// ── Visitor IP / location ────────────────────────────────────────
// Chains multiple providers with per-request timeouts; fails silently.
const ipEl  = document.getElementById('ip');
const locEl = document.getElementById('loc');

if (ipEl || locEl) {
    const getJSON = async (url, ms = 4000) => {
        const ctrl = new AbortController();
        const t    = setTimeout(() => ctrl.abort(), ms);
        try {
            const r = await fetch(url, { signal: ctrl.signal });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return await r.json();
        } finally {
            clearTimeout(t);
        }
    };

    const providers = [
        async () => {
            const d = await getJSON('https://get.geojs.io/v1/ip/geo.json');
            return { ip: d.ip, parts: [d.city, d.region, d.country_code] };
        },
        async () => {
            const d = await getJSON('https://ipwho.is/');
            if (d.success === false) throw new Error('ipwho failed');
            return { ip: d.ip, parts: [d.city, d.region_code, d.country_code] };
        },
        async () => {
            const d = await getJSON('https://ipapi.co/json/');
            if (d.error) throw new Error('ipapi failed');
            return { ip: d.ip, parts: [d.city, d.region_code, d.country_code] };
        },
    ];

    (async () => {
        for (const get of providers) {
            try {
                const { ip, parts } = await get();
                if (!ip) throw new Error('no ip');
                const loc = parts.filter(Boolean).join(', ');
                if (ipEl)  ipEl.textContent  = `IP: ${ip}`;
                if (locEl) locEl.textContent = loc ? `LOC: ${loc}` : 'LOC: unknown';
                return;
            } catch (_) { /* try next provider */ }
        }
        if (ipEl)  ipEl.textContent  = 'IP: unavailable';
        if (locEl) locEl.textContent = 'LOC: unknown';
    })();
}
