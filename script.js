// Retro terminal portfolio — nav routing + clock + interactive shell

const navLinks = document.querySelectorAll('.nav-link');
const screens = document.querySelectorAll('.screen');
const titleSection = document.getElementById('title-section');

function activate(targetId) {
    if (!document.getElementById(targetId)) return;
    screens.forEach(s => s.classList.toggle('active', s.id === targetId));
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.target === targetId));
    if (titleSection) titleSection.textContent = targetId;
    if (history.replaceState) history.replaceState(null, '', '#' + targetId);
}

// Mobile hamburger menu
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
function closeMenu() {
    if (!navMenu) return;
    navMenu.classList.remove('open');
    if (navToggle) { navToggle.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false'); }
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

const keyMap = { '1': 'home', '2': 'about', '3': 'projects', '4': 'contact' };
document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    const target = keyMap[e.key];
    if (target) activate(target);
});

// Live clock
const clockEl = document.getElementById('clock');
function tick() {
    if (!clockEl) return;
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    clockEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
tick();
setInterval(tick, 1000);

// Visitor's public IP + city. Tries multiple providers in order, since
// any single IP-geo endpoint may be down, rate-limited, or blocked by a
// privacy extension. Each call has a timeout so a hung request can't stall
// the chain. Falls back gracefully if all fail.
const ipEl = document.getElementById('ip');
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
        // GeoJS — reliable, CORS-friendly
        async () => {
            const d = await getJSON('https://get.geojs.io/v1/ip/geo.json');
            return { ip: d.ip, parts: [d.city, d.region, d.country_code] };
        },
        // ipwho.is
        async () => {
            const d = await getJSON('https://ipwho.is/');
            if (d.success === false) throw new Error('ipwho failed');
            return { ip: d.ip, parts: [d.city, d.region_code, d.country_code] };
        },
        // ipapi.co
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
                if (ipEl) ipEl.textContent = `IP: ${ip}`;
                if (locEl) locEl.textContent = loc ? `LOC: ${loc}` : 'LOC: unknown';
                return;
            } catch (_) { /* try next provider */ }
        }
        if (ipEl) ipEl.textContent = 'IP: unavailable';
        if (locEl) locEl.textContent = 'LOC: unknown';
    })();
}
