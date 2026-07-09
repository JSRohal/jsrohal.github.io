// Retro Terminal Portfolio — v9
// nav · clock · ASCII animations · memory-load animation ·
// project expand · contact animations · IP lookup

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

const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');
function closeMenu() {
    if (!navMenu) return;
    navMenu.classList.remove('open');
    if (navToggle) { navToggle.classList.remove('open'); navToggle.setAttribute('aria-expanded','false'); }
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
        const t = el.dataset.target; if (!t) return;
        e.preventDefault(); activate(t); closeMenu();
    });
});
const initial = (location.hash || '#home').replace('#','');
if (document.getElementById(initial)) activate(initial);

const keyMap = {'1':'home','2':'about','3':'projects','4':'contact'};
document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea')) return;
    const t = keyMap[e.key]; if (t) activate(t);
});

// ── Live clock ───────────────────────────────────────────────────
const clockEl = document.getElementById('clock');
function tick() {
    if (!clockEl) return;
    const d = new Date(), pad = n => String(n).padStart(2,'0');
    clockEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
tick(); setInterval(tick, 1000);

// ── Home ASCII art reveal ────────────────────────────────────────
function animateASCII() {
    const ascii = document.getElementById('ascii-art');
    if (!ascii) return;
    const escape = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const lines = ascii.textContent.split('\n');
    ascii.innerHTML = lines
        .map((l,i) => `<span class="ascii-line" style="--i:${i}">${escape(l)||'\u00a0'}</span>`)
        .join('');
    return lines.length;
}

// ── Home boot sequence: lines, memory bar, then greeting ─────────
function animateHomeSequence(asciiLineCount) {
    const ASCII_END_MS = 200 + asciiLineCount * 80; // matches CSS --i delay formula

    const bootRows = document.querySelectorAll('#home .boot-line');
    bootRows.forEach((el, i) => {
        el.style.animationDelay = `${ASCII_END_MS + i * 260}ms`;
    });

    // Memory bar: starts loading right when its own boot-row fades in,
    // fills over ~900ms with a real "loading" tick, like a terminal.
    const memRowIndex = bootRows.length - 1; // memory row is last boot-line
    const memRowDelay = ASCII_END_MS + memRowIndex * 260;
    const memFillEl   = document.getElementById('mem-fill');
    const memEmptyEl  = document.getElementById('mem-empty');
    const memPctEl    = document.getElementById('mem-pct');
    const TOTAL_BLOCKS = 10;
    const FILL_DURATION_MS = 900;

    if (memFillEl && memEmptyEl && memPctEl) {
        memEmptyEl.textContent = '\u00b7'.repeat(TOTAL_BLOCKS); // dotted "empty" placeholder
        setTimeout(() => {
            let blocks = 0;
            const stepMs = FILL_DURATION_MS / TOTAL_BLOCKS;
            const stepInterval = setInterval(() => {
                blocks++;
                memFillEl.textContent  = '#'.repeat(blocks);
                memEmptyEl.textContent = '\u00b7'.repeat(TOTAL_BLOCKS - blocks);
                const pct = Math.round((blocks / TOTAL_BLOCKS) * 100);
                memPctEl.textContent = pct + '%';
                if (blocks >= TOTAL_BLOCKS) {
                    clearInterval(stepInterval);
                    memPctEl.classList.add('ok');
                    memPctEl.textContent = '100% [OK]';
                }
            }, stepMs);
        }, memRowDelay + 80); // small delay after row itself fades in
    }

    // Greeting fades in after memory bar completes
    const greetingStart = memRowDelay + 80 + FILL_DURATION_MS + 250;
    document.querySelectorAll('#home .hero-fade').forEach((el, i) => {
        el.style.animationDelay = `${greetingStart + i * 150}ms`;
    });
}

// ── Bottom-bar wave animation ────────────────────────────────────
function initBottomASCII() {
    const el = document.getElementById('bottom-ascii');
    if (!el) return;
    const CHARS = [' ','\u00b7','\u2218','\u25e6','\u2022','\u25cb','\u25c9','\u25cf'];
    let phase = 0, last = 0;
    function frame(ts) {
        if (ts - last >= 42) {
            const cols = Math.max(20, Math.floor(el.offsetWidth / 9));
            let out = '';
            for (let r = 0; r < 3; r++) {
                const rOff = (r / 3) * Math.PI * 1.3;
                for (let x = 0; x < cols; x++) {
                    const v = (Math.sin(x*0.19 - phase + rOff)*0.55 +
                               Math.sin(x*0.37 - phase*1.3 + rOff)*0.45 + 1) / 2;
                    out += CHARS[Math.min(CHARS.length-1, Math.floor(v * CHARS.length))];
                }
                if (r < 2) out += '\n';
            }
            el.textContent = out; phase += 0.055; last = ts;
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

// ── Contact per-field animations ─────────────────────────────────
function initContactAnims() {
    const defs = [
        { id:'ca-name',     frames:['◈','◇','◆','◇'],      ms:420, offset:0 },
        { id:'ca-email',    frames:['▷','▶','▷','·'],       ms:370, offset:1 },
        { id:'ca-linkedin', frames:['╱','─','╲','│'],       ms:310, offset:2 },
        { id:'ca-github',   frames:['<>','</','/>','//'],   ms:460, offset:3 },
        { id:'ca-status',   frames:['●','◉','○','◉'],      ms:540, offset:1 },
    ];
    defs.forEach(({ id, frames, ms, offset }) => {
        const el = document.getElementById(id);
        if (!el) return;
        let i = offset;
        el.textContent = frames[i % frames.length];
        setInterval(() => { i++; el.textContent = frames[i % frames.length]; }, ms);
    });
}

// ── Project data ─────────────────────────────────────────────────
const PROJECTS = {
    job_application_tracker: {
        title: 'job_application_tracker',
        tech:  ['Node.js', 'Express', 'JavaScript', 'Google Sheets', 'XLSX/CSV'],
        images: 2,
        full: `Built to solve a real problem during an active job search, this self-hosted dashboard eliminates the chaos of free-form status strings scattered across spreadsheets and email threads. The back end is a lightweight Node.js / Express server that accepts either a Google Sheets CSV export or a direct .xlsx / .csv file upload.

The core logic normalizes whatever status text the user wrote — "App submitted", "Heard back", "Phone screen scheduled" — into a strict funnel: Applied → Screened → Interviewed → Offered → Accepted. From that normalized data the app computes funnel conversion rates: response rate, interview conversion rate, and offer rate, all rendered as live summary cards with a full breakdown table beneath.

The project ships with a pre-formatted downloadable spreadsheet template and a guided setup flow requiring zero API keys or OAuth tokens. All data stays local on the user's machine. A roadmap item is adding a kanban board view for drag-and-drop status updates directly in the browser.`
    },
    guardian_state_recognizer: {
        title: 'guardian_state_recognizer',
        tech:  ['AWS CDK', 'Lambda', 'S3', 'SageMaker', 'Python', 'YOLOv8'],
        images: 2,
        full: `Guardian State Recognizer is a production-grade AWS ML pipeline built to detect dangerous driver states — drowsiness, distraction, and phone use — in real time using computer vision.

The infrastructure is deployed entirely with AWS CDK in Python. An S3 event notification triggers a Lambda function whenever new sensor data lands in the bucket. The Lambda streams the gzipped JSONL file line-by-line, keeping memory usage flat regardless of file size, validates each record's schema, and deterministically splits records into a 90/10 train/test partition plus a held-out validation set. It then writes an Amazon SageMaker data-channel manifest pointing at the split S3 prefixes.

The downstream SageMaker training job fine-tunes a YOLOv8 object-detection model on labeled driver-camera frames. Keeping the data pipeline decoupled from the training job means either side can evolve independently. The Lambda's streaming approach keeps cold-start memory well under the 512 MB Lambda limit even for multi-gigabyte daily uploads.`
    },
    cancer_predictor: {
        title: 'cancer_predictor',
        tech:  ['Python', 'Cython', 'NumPy', 'ID3 / Decision Tree', 'Oversampling'],
        images: 2,
        full: `This project implements the ID3 decision tree algorithm entirely from scratch with no scikit-learn or sklearn wrappers. The goal was to fully internalize information-gain splitting, recursive tree construction, and the practical effects of class imbalance on model predictions.

The dataset consists of gene-mutation feature vectors labeled as cancerous or non-cancerous. Because the positive class is heavily underrepresented, raw accuracy is a misleading metric. The project handles imbalance by oversampling the minority class to balance training, then evaluates all metrics on the original distribution to reflect real-world performance.

The main computational bottleneck is computing Shannon entropy across every feature and every possible split threshold at each node. This hot path was extracted into a Cython extension module and compiled with -O3 and -march=native, yielding a 6–8× speedup over the pure-Python baseline on large feature sets. Final performance is reported as precision, recall, and F1 on a held-out test set.`
    },
    cgra_hw_security_research: {
        title: 'cgra_hw_security_research',
        tech:  ['CGRA-Flow', 'VectorCGRA', 'Garnet', 'PyMTL3', 'C++', 'Python'],
        images: 2,
        full: `Coarse-Grained Reconfigurable Architectures (CGRAs) offer the programmability of FPGAs with significantly lower reconfiguration overhead, making them attractive for accelerating compute-intensive kernels in edge and embedded systems.

The project used the CGRA-Flow toolchain to compile C++ kernels onto VectorCGRA fabric, with the Garnet interconnect model and PyMTL3 simulation and verification framework. Kernels were profiled for throughput, latency, and resource utilization across different array sizes and dataflow configurations to understand the performance envelope.

The security focus centered on a published CVE related to cache-timing side channels. The research investigated whether mapping security-critical operations onto a CGRA — where the execution schedule is fixed at compile time and memory-access patterns are fully predictable — could eliminate the timing variance that enables traditional cache timing attacks. A prototype "secure cache check" kernel was implemented and tested against a timing-attack harness, showing measurable timing variance reduction compared to the software baseline.`
    },
    systemverilog_cpu: {
        title: 'systemverilog_cpu',
        tech:  ['SystemVerilog', 'Verilator', 'MIPS ISA', 'Digital Design'],
        images: 2,
        full: `A ground-up implementation of a single-cycle MIPS-style CPU in SystemVerilog, designed to solidify understanding of digital logic at the register-transfer level and bridge the gap between architecture lecture and working silicon.

The datapath includes a 32-bit program counter, instruction memory (ROM), a 32-register file with dual read ports and one synchronous write port, a 32-bit ALU supporting add, subtract, AND, OR, set-less-than, and logical shifts, a sign-extension unit for 16-bit immediates, and separate branch and jump resolution logic. The control unit decodes the 6-bit opcode and function fields into a combinational lookup that drives all datapath multiplexers and memory write-enables in a single clock cycle.

Data memory supports word-aligned loads (lw) and stores (sw). Verification was carried out with Verilator, which compiles the SystemVerilog to a C++ simulation model. A custom testbench exercises the full instruction set — arithmetic, logic, memory, branches both taken and not-taken, and direct jumps — checking register and memory state after each instruction. All tests pass with no timing violations in the single-cycle model.`
    },
    parallel_hash_cracker: {
        title: 'parallel_hash_cracker',
        tech:  ['C', 'OpenMPI', 'SHA-256', 'Distributed Computing'],
        images: 2,
        full: `A high-performance distributed password cracker written in pure C using OpenMPI to parallelize a brute-force SHA-256 hash search across an arbitrary number of compute nodes or cores.

At startup, rank 0 reads the target hash and salt from the command line and broadcasts them to all ranks via MPI_Bcast. The full candidate search space — defined by a character set and password length range — is partitioned deterministically across ranks, so every candidate is checked exactly once with no duplication or coordination overhead during the search itself.

Each rank independently generates candidates in its assigned partition, salts and hashes them with OpenSSL's SHA-256 implementation, and compares the digest against the broadcast target. The key architectural decision is the early-termination protocol: when any rank finds the matching plaintext it sends a non-blocking MPI_Isend to all other ranks. Every rank polls for this signal between candidates with MPI_Iprobe and exits its loop immediately on receipt, rather than waiting for a collective barrier. In benchmarks on an 8-node cluster, early termination reduced total wall-clock time by up to 7× for passwords near the midpoint of the search space compared to a barrier-based design.`
    },
    custom_bash_shell: {
        title: 'custom_bash_shell',
        tech:  ['C++', 'Flex', 'Bison', 'POSIX', 'fork / exec'],
        images: 2,
        full: `A feature-complete Unix shell built in C++ using Flex for lexical analysis and Bison for LALR(1) parsing, implementing the core of a POSIX-compatible shell from first principles without wrapping system shells.

The Flex scanner tokenizes raw input into command names, arguments, and all redirection operators: < (stdin), > (stdout overwrite), >> (stdout append), 2> (stderr overwrite), and 2>> (stderr append), as well as the pipe | symbol and command terminators. The Bison grammar assembles tokens into a linked list of command structs, where each node holds an argv array, optional input/output/error file paths and flags, and a next pointer for pipelining.

Execution walks the command list: for a single command, the shell forks and calls execvp in the child, optionally wiring stdio to file descriptors opened with the correct O_CREAT, O_TRUNC, or O_APPEND flags before exec. For a pipeline of N commands, the shell pre-creates N-1 pipe pairs and wires each command's stdout to the next command's stdin before dispatching all children, then waits on all PIDs after the final stage exits. Built-in commands (cd, exit, and pwd) are handled directly in the parent process to correctly modify working-directory state.`
    },
    wordle_clone: {
        title: 'wordle_clone',
        tech:  ['React', 'Node.js', 'Tailwind CSS', 'Supabase', 'Jest'],
        images: 2,
        full: `A full-featured Wordle clone developed as a team capstone project, with the primary goal of practicing real-world collaborative software engineering: Git feature branches, pull requests, code review, and continuous integration.

The front end is built with React and Tailwind CSS, using component state and React context to manage the live game board, on-screen keyboard, and guess history. The back end is Node.js / Express connected to a Supabase (PostgreSQL) database storing the daily word list, per-user session state, and aggregate guess statistics. Daily word selection and result validation both happen server-side, preventing clients from extracting the answer by inspecting network traffic.

The solver page accepts any starting word and progressively narrows the remaining valid-word list using information-theoretic filtering — each colored square eliminates candidates whose letters contradict the revealed constraints, until a unique solution is found. Additional content shipped as stretch goals includes a speed mode with a countdown timer and a hard mode that enforces using all confirmed letters in subsequent guesses. Test coverage includes Jest unit tests for the solver algorithm and constraint-filtering logic, plus UML class and sequence diagrams produced for the final deliverable.`
    },
    spotify_karaoke_app: {
        title: 'spotify_karaoke_app',
        tech:  ['React', 'React Router', 'Node.js', 'Express', 'Spotify Web API', 'Lyric Finder API'],
        images: 2,
        full: `A full-stack web application that turns any Spotify Premium account into a karaoke machine by combining real-time Spotify playback data with synchronized lyrics displayed in the browser.

Authentication uses the Spotify OAuth 2.0 Authorization Code flow handled entirely on the Node.js / Express back end, which keeps the client secret off the browser and issues a session cookie to the React front end. Once logged in, users browse their playlists, queue tracks, and control playback — play, pause, skip, seek — through the Spotify Web Playback SDK, which streams audio directly in the browser tab without requiring the desktop app.

While a track plays, the server queries the Lyric Finder API with the track title and artist to retrieve time-stamped lyrics. A 500 ms polling loop reads the current playback position from the Spotify API and scrolls the lyrics panel to the matching line, creating a karaoke-style synchronized display. Album artwork is fetched from the Spotify Album Cover API and rendered as a blurred, color-dominant background behind the lyrics. The React front end uses React Router for page transitions (login → library → player) and custom hooks for playback state and lyrics synchronization.`
    },
    arduino_rtc_led_sign: {
        title: 'arduino_rtc_led_sign',
        tech:  ['Arduino', 'C / C++', 'I2C', 'RTC DS3231', 'LED Matrix', 'SPI'],
        images: 2,
        full: `A standalone embedded hardware project combining an Arduino Uno, a DS3231 real-time clock module, and a MAX7219-driven LED matrix display into a self-contained desk clock and scrolling message sign.

The DS3231 is wired to the Arduino over I2C. On every power-on, the firmware reads a validity flag from the RTC's non-volatile registers: if the oscillator has not lost power, the stored time is read directly without resetting to a compile-time default. This means the display retains accurate time indefinitely across power cycles without re-flashing.

The LED matrix is updated frame-by-frame in a timed interrupt: the firmware maintains a framebuffer in SRAM, renders the current time or message string into it using a 5×7 pixel font stored in PROGMEM to save RAM, and blits each 8-column frame to the MAX7219 driver over SPI at roughly 30 fps. Scrolling text is implemented by shifting the framebuffer left one pixel column per interrupt tick, producing a smooth marquee effect. A serial command interface over USB lets users update the displayed message or correct the clock time at runtime without re-uploading firmware.`
    }
};

// ── Project expand / collapse ────────────────────────────────────
function openProject(slug) {
    const data = PROJECTS[slug];
    if (!data) return;

    document.getElementById('detail-title').textContent = '> ' + data.title;

    const techEl = document.getElementById('detail-tech');
    techEl.innerHTML = data.tech.map(t => `<span class="tech-tag">${t}</span>`).join('');

    document.getElementById('detail-desc').textContent = data.full;

    const imgsEl = document.getElementById('detail-imgs');
    imgsEl.innerHTML = '';
    for (let i = 1; i <= data.images; i++) {
        imgsEl.innerHTML += `
            <div class="detail-img-ph">
                <span class="ph-label">// screenshot ${String(i).padStart(2,'0')}</span>
                <span class="ph-hint">replace with &lt;img&gt; tag</span>
            </div>`;
    }

    document.getElementById('projects-list').classList.add('hidden');
    document.getElementById('project-detail').classList.add('active');
    const screen = document.getElementById('projects');
    if (screen) screen.scrollTop = 0;
}

function closeProject() {
    document.getElementById('projects-list').classList.remove('hidden');
    document.getElementById('project-detail').classList.remove('active');
    const screen = document.getElementById('projects');
    if (screen) screen.scrollTop = 0;
}

function initProjectExpand() {
    document.querySelectorAll('.card-expand').forEach(btn => {
        btn.addEventListener('click', () => openProject(btn.dataset.slug));
    });
    const backBtn = document.getElementById('detail-back');
    if (backBtn) backBtn.addEventListener('click', closeProject);
}

// ── Boot ─────────────────────────────────────────────────────────
// ── Timeline drag-to-scroll ──────────────────────────────────────
function initTimelineDrag() {
    const wrapper = document.querySelector('.timeline-scroll-wrapper');
    if (!wrapper) return;
    let isDown = false, startX, scrollLeft;

    wrapper.addEventListener('mousedown', e => {
        isDown = true;
        wrapper.style.cursor = 'grabbing';
        startX    = e.pageX - wrapper.offsetLeft;
        scrollLeft = wrapper.scrollLeft;
    });
    wrapper.addEventListener('mouseleave', () => { isDown = false; wrapper.style.cursor = 'grab'; });
    wrapper.addEventListener('mouseup',    () => { isDown = false; wrapper.style.cursor = 'grab'; });
    wrapper.addEventListener('mousemove',  e => {
        if (!isDown) return;
        e.preventDefault();
        const x    = e.pageX - wrapper.offsetLeft;
        const walk = (x - startX) * 1.4;
        wrapper.scrollLeft = scrollLeft - walk;
    });

    // touch support
    let touchStartX, touchScrollLeft;
    wrapper.addEventListener('touchstart', e => {
        touchStartX    = e.touches[0].pageX;
        touchScrollLeft = wrapper.scrollLeft;
    }, { passive: true });
    wrapper.addEventListener('touchmove', e => {
        const dx = touchStartX - e.touches[0].pageX;
        wrapper.scrollLeft = touchScrollLeft + dx;
    }, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
    const lineCount = animateASCII();
    animateHomeSequence(lineCount);
    initBottomASCII();
    initContactAnims();
    initProjectExpand();
    initTimelineDrag();
});

// ── Visitor IP / location ────────────────────────────────────────
const ipEl  = document.getElementById('ip');
const locEl = document.getElementById('loc');
if (ipEl || locEl) {
    const getJSON = async (url, ms=4000) => {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), ms);
        try {
            const r = await fetch(url, { signal: ctrl.signal });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return await r.json();
        } finally { clearTimeout(t); }
    };
    const providers = [
        async () => { const d = await getJSON('https://get.geojs.io/v1/ip/geo.json');
            return { ip:d.ip, parts:[d.city,d.region,d.country_code] }; },
        async () => { const d = await getJSON('https://ipwho.is/');
            if (d.success===false) throw new Error('fail');
            return { ip:d.ip, parts:[d.city,d.region_code,d.country_code] }; },
        async () => { const d = await getJSON('https://ipapi.co/json/');
            if (d.error) throw new Error('fail');
            return { ip:d.ip, parts:[d.city,d.region_code,d.country_code] }; },
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
            } catch(_) {}
        }
        if (ipEl)  ipEl.textContent  = 'IP: unavailable';
        if (locEl) locEl.textContent = 'LOC: unknown';
    })();
}
