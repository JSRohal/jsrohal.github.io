// Retro terminal portfolio — v6
// nav routing · clock · ASCII animation · boot sequence · IP lookup

// ── Navigation ───────────────────────────────────────────────────
const navLinks    = document.querySelectorAll('.nav-link');
const screens     = document.querySelectorAll('.screen');
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

// Keyboard shortcut: 1-4 to switch sections
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
    clockEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
tick();
setInterval(tick, 1000);

// ── ASCII art animation ──────────────────────────────────────────
// Splits the <pre> into per-line <span>s so CSS can stagger them.
function animateASCII() {
    const ascii = document.getElementById('ascii-art');
    if (!ascii) return;

    const raw   = ascii.textContent;
    const lines = raw.split('\n');

    const escape = s =>
        s.replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;');

    ascii.innerHTML = lines
        .map((line, i) =>
            `<span class="ascii-line" style="--i:${i}">${escape(line) || '\u00a0'}</span>`
        )
        .join('');
}

// ── Boot-line + hero stagger ─────────────────────────────────────
// Times are aligned to the ASCII reveal finishing (~24 lines × 45 ms + 300 ms offset).
function animateHomeSequence() {
    const ASCII_LINE_COUNT = 24;
    const MS_PER_LINE      = 45;
    const ASCII_START_OFFSET = 300;
    const asciiEndMs = ASCII_START_OFFSET + ASCII_LINE_COUNT * MS_PER_LINE; // ≈ 1380 ms

    // Boot lines appear one by one after ASCII finishes
    const bootLines = document.querySelectorAll('#home .boot-line');
    bootLines.forEach((el, i) => {
        el.style.animationDelay = `${asciiEndMs + i * 210}ms`;
    });

    // Hero text fades in after all boot lines
    const heroStart = asciiEndMs + bootLines.length * 210 + 80;
    document.querySelectorAll('#home .hero-fade').forEach((el, i) => {
        el.style.animationDelay = `${heroStart + i * 130}ms`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    animateASCII();
    animateHomeSequence();
});

// ── Visitor IP / location ────────────────────────────────────────
// Tries multiple providers with timeouts; degrades gracefully.
const ipEl  = document.getElementById('ip');
const locEl = document.getElementById('loc');

if (ipEl || locEl) {
    const getJSON = async (url, ms = 4000) => {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), ms);
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
            } catch (_) { /* try next */ }
        }
        if (ipEl)  ipEl.textContent  = 'IP: unavailable';
        if (locEl) locEl.textContent = 'LOC: unknown';
    })();
}
