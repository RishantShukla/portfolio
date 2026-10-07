// ─── CONFIG ───────────────────────────────────────────────────────────────────
const config = { typeSpeed: 8, bootLineDelay: 70 };
let isBooting = true;

// Honoured by typeText (renders instantly) and by the particles/matrix effects.
// Read live rather than cached so it follows an OS-level change mid-session.
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => reduceMotionQuery.matches;

// ─── THEMES ───────────────────────────────────────────────────────────────────
// Each name matches a :root[data-theme="..."] block in the stylesheet. The saved
// theme is applied by an inline script in <head> so there is no flash; this only
// handles switching at runtime.
const THEMES = ['tokyo-night', 'dracula', 'gruvbox', 'nord', 'matrix'];
const THEME_KEY = 'portfolio-theme';

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'tokyo-night';
}

let themeSwitchTimer;
function applyTheme(name) {
  // Cross-fade the palette instead of snapping. The class is removed again so
  // the transition cannot interfere with anything else on the page.
  const root = document.documentElement;
  if (root.getAttribute('data-theme') !== name && !prefersReducedMotion()) {
    root.classList.add('theme-switching');
    clearTimeout(themeSwitchTimer);
    themeSwitchTimer = setTimeout(() => root.classList.remove('theme-switching'), 380);
  }
  root.setAttribute('data-theme', name);
  try { localStorage.setItem(THEME_KEY, name); } catch { /* private mode */ }
}

// ─── DEEP LINKS ───────────────────────────────────────────────────────────────
// #projects etc. so a section can be linked directly — the site was previously
// one URL with no way to point anyone at anything.
const LINKABLE = ['about', 'experience', 'skills', 'projects', 'certs',
                  'education', 'contact', 'status', 'resume', 'help'];

// Several sections answer to more than one command — the About nav button runs
// `whoami`, for instance. Without this the hash silently refuses to update for
// any alias, leaving a stale URL.
const CANONICAL = {
  whoami: 'about', neofetch: 'about',
  'git log': 'experience',
  tree: 'skills',
  email: 'contact',
};

function canonical(cmd) {
  return CANONICAL[cmd] || cmd;
}

function hashCommand() {
  const h = decodeURIComponent((window.location.hash || '').replace(/^#/, ''))
    .trim().toLowerCase();
  const c = canonical(h);
  return LINKABLE.includes(c) ? c : null;
}

function syncHash(rawCmd) {
  const cmd = canonical(rawCmd);
  if (!LINKABLE.includes(cmd)) return;
  // NOTE: `history` is shadowed in this file by the #history element, so the
  // browser API must be reached through window. replaceState (not location.hash)
  // keeps the URL shareable without stacking up back-button entries.
  window.history.replaceState(null, '', '#' + cmd);
}

const terminalBody = document.getElementById('terminal');
const history      = document.getElementById('history');
const realPrompt   = document.getElementById('real-prompt');
const cmdInput     = document.getElementById('command-input');
const inputDisplay = document.getElementById('input-display');
const inputGhost   = document.getElementById('input-ghost');

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function scrollToBottom() { terminalBody.scrollTop = terminalBody.scrollHeight; }

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t]||t));
}

// ─── EXPERIENCE ───────────────────────────────────────────────────────────────
// Rendered into the About block's Experience row. Derived from a date rather
// than hard-coded, so it cannot go stale. Rounded down to whole years
// ("2+ years") so it only changes on an anniversary rather than every month.
const CAREER_START = new Date(2024, 4, 1); // May 2024 — first DevOps role

function careerExperience() {
  const now = new Date();
  let months = (now.getFullYear() - CAREER_START.getFullYear()) * 12
             + (now.getMonth() - CAREER_START.getMonth());
  if (now.getDate() < CAREER_START.getDate()) months--;
  if (months < 1)  return 'just started';
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  return `${Math.floor(months / 12)}+ years`;
}

function fillExperience(root) {
  root.querySelectorAll('.nf-experience').forEach(el => { el.textContent = careerExperience(); });
}

// Clickable commands are <span>/<td>, so they need an explicit role and tab stop
// to be reachable without a mouse. Applied on injection so it also covers the
// ones built at runtime, like the "did you mean" suggestion.
function makeClickableCmdsFocusable(root) {
  root.querySelectorAll('.clickable-cmd').forEach(el => {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    const cmd = el.dataset.cmd || el.textContent.trim();
    el.setAttribute('aria-label', `Run command: ${cmd}`);
  });
}

function addToHistory(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.style.marginBottom = '20px';
  div.classList.add('fade-in');
  makeClickableCmdsFocusable(div);
  fillExperience(div);
  history.appendChild(div);
  
  // Add separator line after command output
  const separator = document.createElement('div');
  separator.style.borderBottom = '1px solid var(--border)';
  separator.style.margin = '15px 0';
  separator.style.opacity = '0.5';
  history.appendChild(separator);
  
  scrollToBottom();
}

function addCommandToHistory(cmd) {
  const div = document.createElement('div');
  div.className = 'prompt-line';
  div.innerHTML = `<span class="user">rishant</span><span class="at">@</span><span class="host">devops</span><span class="arrow">➜</span> <span class="cmd">${escapeHTML(cmd)}</span>`;
  history.appendChild(div);
}

function typeText(element, text) {
  if (prefersReducedMotion()) {
    element.appendChild(document.createTextNode(text));
    scrollToBottom();
    return Promise.resolve();
  }
  return new Promise(resolve => {
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    element.appendChild(cursor);
    function type() {
      if (i < text.length) {
        element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
        i++;
        scrollToBottom();
        setTimeout(type, config.typeSpeed);
      } else {
        cursor.remove();
        resolve();
      }
    }
    type();
  });
}

async function typeCommand(cmdText) {
  const div = document.createElement('div');
  div.className = 'prompt-line';
  div.innerHTML = `<span class="user">rishant</span><span class="at">@</span><span class="host">devops</span><span class="arrow">➜</span> <span class="cmd"></span>`;
  history.appendChild(div);
  await typeText(div.querySelector('.cmd'), cmdText);
}

async function getVisitorIP() {
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    const d = await r.json();
    return d.ip;
  } catch { return '127.0.0.1'; }
}

// ─── DEPLOY PIPELINE ──────────────────────────────────────────────────────────
async function runDeployPipeline() {
  const repos = ['rishant/portfolio', 'devops/webapp', 'prod/frontend', 'main/application'];
  const testCounts = [312, 487, 256, 391, 523];
  const images = ['rishant/portfolio:latest', 'app:v2.1.0', 'webapp:prod', 'frontend:stable'];
  const registries = ['ECR', 'Docker Hub', 'GCR', 'ACR'];
  const environments = ['Production', 'Staging', 'Live', 'Prod-US-East'];
  const times = ['4.2s', '3.8s', '5.1s', '4.7s', '3.5s'];
  
  const repo = repos[Math.floor(Math.random() * repos.length)];
  const tests = testCounts[Math.floor(Math.random() * testCounts.length)];
  const image = images[Math.floor(Math.random() * images.length)];
  const registry = registries[Math.floor(Math.random() * registries.length)];
  const env = environments[Math.floor(Math.random() * environments.length)];
  const time = times[Math.floor(Math.random() * times.length)];
  
  const steps = [
    "[INFO] Initiating CI/CD pipeline...",
    `[INFO] Cloning repository ${repo}...`,
    "[OK]   Repository cloned successfully.",
    "[INFO] Running unit tests...",
    `[OK]   ${tests} tests passed. 0 failed.`,
    `[INFO] Building Docker image '${image}'...`,
    "[OK]   Image built successfully.",
    "[INFO] Pushing image to registry...",
    `[OK]   Image pushed to ${registry}.`,
    "[INFO] Applying Terraform state...",
    "[OK]   Infrastructure is up to date.",
    `[INFO] Deploying to Kubernetes (${env})...`,
    "[OK]   Rollout complete. 0 downtime.",
    `<br><span style='color:var(--green)'>🚀 Pipeline completed in ${time}.</span>`
  ];
  for (const step of steps) {
    const div = document.createElement('div');
    if (step.includes('[OK]'))   div.style.color = 'var(--green)';
    else if (step.includes('[ERROR]')) div.style.color = 'var(--red)';
    else if (step.includes('[INFO]'))  div.style.color = 'var(--blue-alt)';
    else div.style.color = 'var(--fg-bright)';
    div.innerHTML = step;
    history.appendChild(div);
    scrollToBottom();
    await new Promise(r => setTimeout(r, 1000));
  }
}

// ─── BOOT SEQUENCE ────────────────────────────────────────────────────────────
async function runIntro() {
  const ipPromise = getVisitorIP(); // kick off in parallel, don't block the boot sequence on it
  const now = new Date().toUTCString();

  const bootLines = [
    "Initializing kernel core...",
    "Loading network drivers...",
    "Starting container runtime...",
    "Connecting to cluster..."
  ];

  for (const lineText of bootLines) {
    const div = document.createElement('div');
    div.className = 'boot-line';
    const textSpan   = document.createElement('span');
    textSpan.className = 'boot-text';
    const statusSpan = document.createElement('span');
    statusSpan.className = 'boot-status';
    statusSpan.textContent = '[ OK ]';
    div.appendChild(textSpan);
    div.appendChild(statusSpan);
    history.appendChild(div);
    await typeText(textSpan, lineText);
    statusSpan.style.display = 'inline';
    scrollToBottom();
    await new Promise(r => setTimeout(r, config.bootLineDelay));
  }

  await new Promise(r => setTimeout(r, 120));
  const sshDiv = document.createElement('div');
  history.appendChild(sshDiv);
  const cLine = document.createElement('div');
  cLine.style.color = 'var(--yellow)'; cLine.style.marginTop = '10px';
  sshDiv.appendChild(cLine);
  await typeText(cLine, 'Connecting to rishant-devops...');
  const aLine = document.createElement('div');
  aLine.style.color = 'var(--yellow)';
  sshDiv.appendChild(aLine);
  await typeText(aLine, 'Authenticating public key "rishant_rsa"...');

  await new Promise(r => setTimeout(r, 250));
  const ip = await ipPromise; // by now the fetch has had the whole boot sequence to resolve in the background
  const motdDiv = document.createElement('div');
  motdDiv.className = 'motd-container fade-in';
  motdDiv.innerHTML = `
    <div style="margin-top:15px;">
      Welcome to <strong>DevOps-Portfolio-OS</strong><br>
      <span style="color:var(--fg-dim);font-size:12px;">${now}</span>
    </div>
    <div style="margin:8px 0;display:flex;flex-wrap:wrap;gap:12px;font-size:13px;">
      <span><span class="motd-key">Load:</span> <span class="motd-val">${(Math.random()*0.15+0.01).toFixed(2)}</span></span>
      <span><span class="motd-key">Memory:</span> <span class="motd-val">${Math.floor(Math.random()*8+4)}%</span></span>
      <span><span class="motd-key">Processes:</span> <span class="motd-val">${Math.floor(Math.random()*40+110)}</span></span>
      <span><span class="motd-key">IP:</span> <span class="motd-val">10.0.${Math.floor(Math.random()*3)}.${Math.floor(Math.random()*254+1)}</span></span>
    </div>
    <span style="color:var(--fg-dim);font-size:12px;">Last login from <span style="color:var(--blue);">${ip}</span></span>
    <hr style="border:0;border-bottom:1px solid var(--border);margin:10px 0 20px;">
  `;
  history.appendChild(motdDiv);
  scrollToBottom();

  await new Promise(r => setTimeout(r, 300));

  // Arrived via a shared link like /#projects — go straight to what they came
  // for instead of making them sit through about + help first.
  const linked = linkedCommand() || hashCommand();
  if (linked) {
    await typeCommand(linked);
    await new Promise(r => setTimeout(r, 120));
    commandHistory.push(linked);
    saveHistory();
    processCommand(linked);
    addToHistory(
      `<div style="color:var(--fg-dim);font-size:12px;">` +
      `// type <span class="clickable-cmd" data-cmd="help">help</span> to see everything else.</div>`
    );
  } else {
    await typeCommand('about');
    await new Promise(r => setTimeout(r, 120));
    addToHistory(document.getElementById('tpl-neofetch').innerHTML);

    await typeCommand('help');
    await new Promise(r => setTimeout(r, 120));
    addToHistory(document.getElementById('tpl-help').innerHTML);
  }

  // Shown once, to the people who would otherwise stare at a prompt and leave.
  let toured = true;
  try { toured = !!localStorage.getItem('portfolio-toured'); } catch { /* private mode */ }
  if (!toured && !linked) {
    addToHistory(
      `<div class="tour-hint">First time here? ` +
      `<span class="clickable-cmd" data-cmd="tour">tour</span> walks you through it in 40 seconds, ` +
      `or press <b>Ctrl&nbsp;K</b> to search.</div>`);
  }

  realPrompt.classList.remove('hidden');
  cmdInput.focus();
  isBooting = false;
  document.getElementById('terminal-window')?.classList.remove('booting');
  scrollToBottom();
}

// ─── INPUT HANDLING ───────────────────────────────────────────────────────────
document.getElementById('terminal-window').addEventListener('click', e => {
  if (e.target.closest('form')) return;
  if (['INPUT','TEXTAREA','BUTTON','A','LABEL','SELECT'].includes(e.target.tagName)) return;
  if (!window.getSelection().toString()) cmdInput.focus();
});

const availableCommands = [
  'help','about','neofetch','whoami','experience','git log','projects','skills',
  'tree','certs','education','contact','email','status','deploy','ls','resume',
  'clear','m','uptime','ping','history','date','pwd','hostname','echo','cat readme','cat_readme',
  'ask','vcard','split','share','tour','tab',
  'linkedin','github','joke','quote','fortune','hack','coffee','theme','sudo','cd','grep','ls projects'
];
// Offered by the ghost so a pipe is discoverable without reading the help.
const PIPE_EXAMPLES = [
  'skills | grep aws',
  'experience | grep terraform',
  'skills | wc -l',
];

// A real shell remembers across sessions; this one forgot everything on
// reload, which also made the palette's "Recent" group useless on a return
// visit. Capped so the key cannot grow without bound.
const HISTORY_KEY = 'portfolio-history';
const HISTORY_CAP = 60;

function loadHistory() {
  try {
    const v = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(-HISTORY_CAP) : [];
  } catch { return []; }   // private mode, or someone edited the key by hand
}

function saveHistory() {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(commandHistory.slice(-HISTORY_CAP))); }
  catch { /* private mode */ }
}

const commandHistory = loadHistory();
let historyIndex = -1;

// !! repeats the last command, !3 the third, !ca the most recent starting
// with "ca" — expanded before the command runs, and echoed the way bash does.
function expandBang(raw) {
  if (!/^!/.test(raw)) return raw;
  if (raw === '!!') return commandHistory[commandHistory.length - 1] || null;
  const n = /^!(\d+)$/.exec(raw);
  if (n) return commandHistory[+n[1] - 1] || null;
  const pre = raw.slice(1);
  if (!pre) return null;
  for (let i = commandHistory.length - 1; i >= 0; i--) {
    if (commandHistory[i].startsWith(pre)) return commandHistory[i];
  }
  return null;
}
const sessionStart = Date.now();

// ─── GHOST AUTOCOMPLETE ───────────────────────────────────────────────────────
// Shows the rest of the matching command in dim text as you type, the way fish
// does. Tab-completion already existed but nothing advertised it, and command
// discovery is the weak point of any terminal UI.
// Bare commands plus the paths they take, so `cat projects/aws-ss` and `cd ex`
// complete too — previously only single words did.
function completionCandidates() {
  const list = [...availableCommands];
  for (const f of Object.keys(CASE_STUDIES)) list.push(`cat projects/${f}`);
  for (const f of Object.keys(FILES))        list.push(`cat ${f}`);
  for (const d of Object.keys(DIRECTORIES))  list.push(`cd ${d}`);
  for (const t of THEMES)                    list.push(`theme ${t}`);
  for (const q of ASK_EXAMPLES)              list.push(`ask ${q}`);
  for (const p of PIPE_EXAMPLES)             list.push(p);
  list.push('split skills experience');
  return list;
}

function updateGhost() {
  const raw = cmdInput.value;
  const lower = raw.toLowerCase();
  let ghost = '';
  // slice by the RAW length so a trailing space is handled: "cd " -> "about"
  if (raw.trim() && raw === raw.trimStart()) {
    const match = completionCandidates().find(c => c.startsWith(lower) && c !== lower);
    if (match) ghost = match.slice(raw.length);
  }
  inputGhost.textContent = ghost;
}

function acceptGhost() {
  if (!inputGhost.textContent) return false;
  cmdInput.value += inputGhost.textContent;
  renderInput(cmdInput.value);
  updateGhost();
  return true;
}

cmdInput.addEventListener('input', function() {
  renderInput(this.value);
  updateGhost();
});

cmdInput.addEventListener('keydown', function(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    acceptGhost();
    return;
  }
  // Right-arrow at the end of the line accepts the suggestion, like fish
  if (e.key === 'ArrowRight' && this.selectionStart === this.value.length) {
    if (acceptGhost()) e.preventDefault();
    return;
  }
  if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); history.innerHTML = ''; return; }
  if (e.key === 'c' && e.ctrlKey) {
    e.preventDefault();
    if (this.value.length > 0) {
      addCommandToHistory(this.value + '^C');
      addToHistory(`<div style="color:var(--fg-dim);">^C</div>`);
      this.value = ''; renderInput(''); updateGhost();
      scrollToBottom();
    }
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (commandHistory.length > 0) {
      if (historyIndex < commandHistory.length - 1) historyIndex++;
      this.value = commandHistory[commandHistory.length - 1 - historyIndex];
      renderInput(this.value); updateGhost();
    }
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      this.value = commandHistory[commandHistory.length - 1 - historyIndex];
      renderInput(this.value); updateGhost();
    } else { historyIndex = -1; this.value = ''; renderInput(''); updateGhost(); }
    return;
  }
  if (e.key === 'Enter') {
    // collapse repeated spaces — a real shell does not care how many you
    // typed, and split(' ')[1] used to return empty on a double space
    let cmd = this.value.trim().toLowerCase().replace(/\s+/g, ' ');
    this.value = ''; renderInput(''); updateGhost();

    if (/^!/.test(cmd)) {
      const expanded = expandBang(cmd);
      if (!expanded) {
        addCommandToHistory(cmd);
        addToHistory(`<div style="color:var(--red);">${escapeHTML(cmd)}: event not found</div>` +
          `<div style="color:var(--fg-dim);font-size:12px;margin-top:4px;">// ` +
          `<span class="clickable-cmd" data-cmd="history">history</span> lists what you have run</div>`);
        scrollToBottom();
        return;
      }
      cmd = expanded;
    }

    if (cmd) { commandHistory.push(cmd); saveHistory(); }
    historyIndex = -1;
    addCommandToHistory(cmd);
    if (cmd) trackCommand(cmd, 'typed');
    processCommand(cmd);
    scrollToBottom();
  }
});

// ─── FUZZY SUGGEST ────────────────────────────────────────────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, () => Array(n+1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+(a[i-1]!==b[j-1]?1:0));
  return dp[m][n];
}
function findClosestCommand(input) {
  let best = null, bestScore = Infinity;
  for (const cmd of availableCommands) {
    const d = levenshtein(input, cmd);
    if (d < bestScore && d <= 3) { bestScore = d; best = cmd; }
  }
  return best;
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
// Which commands visitors actually run. window.va is stubbed in index.html, so
// this is a no-op queue push if the Vercel script never loads.
// NOTE: custom events need a Vercel Pro plan — on Hobby only page views record,
// and these calls are silently dropped.
function trackCommand(cmd, source) {
  // `ask <question>` is bucketed as plain `ask`: how often it is used is worth
  // knowing, the question itself is a stranger's free text and is not.
  if (cmd.startsWith('ask ')) cmd = 'ask';
  const known = availableCommands.includes(cmd);
  try {
    window.va('event', {
      name: 'command',
      // Unknown input is bucketed rather than sent verbatim: it is free text
      // typed by a stranger and does not belong in an analytics dashboard.
      data: { command: known ? cmd : '(unrecognized)', source }
    });
  } catch (_) { /* analytics must never break the terminal */ }
}


// ─── GREP ─────────────────────────────────────────────────────────────────────
// Searches every content section. A recruiter's real question is "has he done
// Argo CD?" — previously that meant reading all six sections.
const SEARCHABLE = {
  'about':      'tpl-neofetch',
  'experience': 'tpl-git-log',
  'skills':     'tpl-skills',
  'projects':   'tpl-projects',
  'certs':      'tpl-education',
  'education':  'tpl-education2',
  'status':     'tpl-status',
  'contact':    'tpl-contact',
};

// Pull readable lines out of a template: the deepest elements that still hold
// text, so a bullet or a table row comes back as one line rather than a blob.
// textContent runs adjacent inline elements together, so a row of tag spans
// reads as "(AKS)TerraformGitLab CI/CDAzure". Walking the nodes and spacing
// element boundaries keeps each tag a separate word for both grep and ask.
function nodeText(el) {
  let out = '';
  for (const n of el.childNodes) {
    if (n.nodeType === Node.TEXT_NODE) out += n.nodeValue;
    else if (n.nodeType === Node.ELEMENT_NODE) out += ' ' + nodeText(n) + ' ';
  }
  return out;
}

function extractLines(root) {
  const out = [];
  const visit = el => {
    for (const child of el.children) {
      const text = nodeText(child).replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const hasTextyChild = [...child.children].some(
        g => (g.textContent || '').trim().length > 0 &&
             ['DIV', 'LI', 'TR', 'P', 'UL', 'TABLE', 'TBODY'].includes(g.tagName));
      if (hasTextyChild) visit(child);
      else out.push(text);
    }
  };
  visit(root);
  return out;
}

function highlightTerm(text, term) {
  const esc = escapeHTML(text);
  const needle = escapeHTML(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return esc.replace(new RegExp(needle, 'gi'),
    m => `<span class="grep-hit">${m}</span>`);
}

function runGrep(rawTerm) {
  const term = rawTerm.trim();
  if (!term) {
    addToHistory(`<div style="color:var(--red);">Usage: grep &lt;term&gt;</div>` +
      `<div style="color:var(--fg-dim);font-size:12px;margin-top:4px;">// e.g. ` +
      `<span class="clickable-cmd" data-cmd="grep terraform">grep terraform</span>, ` +
      `<span class="clickable-cmd" data-cmd="grep kubernetes">grep kubernetes</span></div>`);
    return;
  }

  const needle = term.toLowerCase();
  const hits = [];
  const seen = new Set();
  for (const [section, tplId] of Object.entries(SEARCHABLE)) {
    const tpl = document.getElementById(tplId);
    if (!tpl) continue;
    for (const line of extractLines(tpl)) {
      if (!line.toLowerCase().includes(needle)) continue;
      const key = section + '|' + line;
      if (seen.has(key)) continue;       // templates nest, so the same line can surface twice
      seen.add(key);
      hits.push([section, line]);
    }
  }

  if (!hits.length) {
    addToHistory(`<div style="color:var(--fg-dim);">grep: no match for ` +
      `<span style="color:var(--fg);">${escapeHTML(term)}</span></div>`);
    return;
  }

  const CAP = 18;
  const rows = hits.slice(0, CAP).map(([section, line]) => {
    const clipped = line.length > 150 ? line.slice(0, 150) + '…' : line;
    return `<div class="grep-row">` +
      `<span class="grep-file"><span class="clickable-cmd" data-cmd="${section}">${section}/</span></span>` +
      `<span class="grep-line">${highlightTerm(clipped, term)}</span></div>`;
  }).join('');

  const more = hits.length > CAP
    ? `<div class="grep-meta">… and ${hits.length - CAP} more. Narrow the search or open the section directly.</div>`
    : `<div class="grep-meta">${hits.length} match${hits.length === 1 ? '' : 'es'} — click a section to open it.</div>`;

  addToHistory(rows + more);
}

// ─── cd ───────────────────────────────────────────────────────────────────────
// `ls` advertises about/, experience/, projects/ and skills/ as directories, so
// `cd about` is the obvious next move. Without this it fell through to the fuzzy
// matcher, which answered "cd ab" with "did you mean clear?".
const DIRECTORIES = {
  about: 'about', experience: 'experience',
  projects: 'projects', skills: 'skills',
};
const FILES = { 'resume.pdf': 'resume', 'contact.json': 'contact' };

// Case studies rendered in the terminal. They were PDF-only, which meant every
// reader who opened one left the site.
const CASE_STUDIES = {
  'aws-sso.md':      { tpl: 'tpl-case-aws-sso',      size: 4096 },
  'shopfloorgpt.md': { tpl: 'tpl-case-shopfloorgpt', size: 3872 },
  'kubespray.md':    { tpl: 'tpl-case-kubespray',    size: 3654 },
};

// accepts aws-sso, aws-sso.md, projects/aws-sso.md, ./projects/aws-sso
function resolveCaseStudy(arg) {
  const name = String(arg).trim().toLowerCase()
    .replace(/^\.?\//, '').replace(/^projects\//, '').replace(/\/+$/, '');
  if (CASE_STUDIES[name]) return name;
  if (CASE_STUDIES[name + '.md']) return name + '.md';
  return null;
}

function lsProjects() {
  const rows = Object.entries(CASE_STUDIES).map(([file, meta]) =>
    `<div class="ls-row"><span class="ls-perm">-rw-r--r--</span>` +
    `<span class="ls-size">${meta.size}</span>` +
    `<span class="ls-name"><span class="clickable-cmd" data-cmd="cat projects/${file}">${file}</span></span></div>`
  ).join('');
  addToHistory(
    `<div style="color:var(--fg-dim);margin-bottom:6px;">total ${Object.keys(CASE_STUDIES).length}</div>${rows}` +
    `<div style="color:var(--fg-dim);font-size:12px;margin-top:10px;">// click a file, or <span class="clickable-cmd" data-cmd="cat projects/aws-sso.md">cat projects/&lt;file&gt;</span></div>`
  );
}

function runCd(arg) {
  const target = arg.trim().replace(/\/+$/, '').toLowerCase();

  if (!target || ['~', '/', '..', '-', '.'].includes(target)) {
    const dirs = Object.keys(DIRECTORIES)
      .map(d => `<span class="clickable-cmd" data-cmd="cd ${d}">${d}/</span>`).join('  ');
    addToHistory(
      `<div style="color:var(--fg);">/home/rishant</div>` +
      `<div style="color:var(--fg-dim);font-size:12px;margin-top:4px;">// ${dirs}</div>`
    );
    return;
  }
  if (DIRECTORIES[target]) { processCommand(DIRECTORIES[target]); return; }
  if (FILES[target]) {
    addToHistory(`<div style="color:var(--red);">cd: ${escapeHTML(target)}: Not a directory</div>`);
    return;
  }
  addToHistory(`<div style="color:var(--red);">cd: ${escapeHTML(target)}: No such file or directory</div>`);
}

// ─── ASK ──────────────────────────────────────────────────────────────────────
// Answers questions using only what is already written on this page. There is
// no model and no backend: the eleven content sections are indexed with BM25 at
// first use, and an answer is the lines that actually matched. Every word it
// prints is a word that was written here, so it cannot invent a certification
// or inflate a year — which is the whole point on something that represents a
// person professionally. When nothing scores well enough it says so.

const ASK_STOPWORDS = new Set((
  'a about an and any anything are as at be been being by can could d did do does doing ' +
  'else for from get give got had has have having he her hers him his how i if in into is ' +
  'it its just like ll lot m many me much my of on once only or other our out over own ' +
  'please re s so some somebody someone such t tell than that the their them then there ' +
  'these they this those to told too u up us ve was we were what when where whether which ' +
  'while who whom why will with would you your yours know knows known now today currently recently ' +
  // filler: naming these as "not mentioned" is noise, never an answer
  'lately presently nowadays still yet actually really done thing things stuff ' +
  // Scaffolding, not content: "any azure WORK?" and "docker EXPERIENCE" were
  // both answered by about/, which is short enough that BM25's length term
  // made one incidental "work history" link outrank the actual answer.
  'work worked working works experience experienced use used using'
).split(' '));

// Deliberately shallow: the terms that decide an answer are proper nouns
// (terraform, kubespray, grafana, sprinto) and a greedier stemmer only corrupts
// them. Three characters or fewer is left alone so aws/eks/ecs/sql survive.
function askStem(w) {
  if (w.length <= 3) return w;
  if (/ies$/.test(w))              return w.slice(0, -3) + 'y';
  if (/(ing|ed)$/.test(w))         return w.replace(/(ing|ed)$/, '');
  // Stripping "es" wholesale split the pair it was meant to join: "databases"
  // became "databas" while "database" stayed whole, so neither could ever match
  // the other. Only drop both letters where the plural really adds them.
  if (/(ch|sh|ss|x|z)es$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
  return w;
}

// ci/cd -> "ci cd", node.js -> "node js". + and # survive for c++ / c#.
function askWords(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9+#]+/g, ' ').split(' ').filter(Boolean);
}

// Spellings of one thing. Folded on BOTH sides — query and index — so the "K8s"
// tag on a project card and the word "Kubernetes" in a sentence become one term.
// Expanding only the query made the bare tag a rare term of its own, and it
// outranked every section that spells the word out. A hint that is not a true
// synonym belongs in ASK_ALIASES, which stays query-side and additive.
const ASK_SYNONYMS = {
  k8: 'kubernetes', k8s: 'kubernetes', kube: 'kubernetes', kubectl: 'kubernetes',
  wfh: 'remote',
};

function askNorm(w) {
  return askStem(ASK_SYNONYMS[w] || w);
}

function askTokens(text) {
  return askWords(text).filter(t => !ASK_STOPWORDS.has(t)).map(askNorm);
}

// Nobody asking about container experience types "Docker". Without this map
// roughly half of real questions miss, because the asker's vocabulary and the
// page's vocabulary only overlap by accident.
const ASK_ALIASES = {
  orchestration: 'kubernetes helm eks aks ecs',
  container: 'docker kubernetes ecs eks aks helm',
  containerisation: 'docker kubernetes', containerization: 'docker kubernetes',
  microservice: 'ecs container docker',
  iac: 'terraform ansible infrastructure code',
  infra: 'infrastructure terraform ansible',
  provisioning: 'terraform ansible provision',
  config: 'ansible configuration', configuration: 'ansible',
  cicd: 'ci cd jenkins github action gitlab bitbucket codepipeline pipeline',
  pipeline: 'jenkins github action gitlab bitbucket codepipeline argo ci cd',
  automation: 'ansible terraform automate automated',
  gitops: 'argo gitop',
  monitoring: 'prometheus grafana loki cloudwatch fluent observability monitor',
  observability: 'prometheus grafana loki cloudwatch fluent monitoring',
  logging: 'loki fluent cloudwatch observability',
  // bare "log" matched the "$ git log --all --oneline --graph" header, which is
  // the wrong sense of the word entirely
  log: 'loki fluent cloudwatch logging', logs: 'loki fluent cloudwatch logging',
  aggregation: 'loki fluent cloudwatch', centralized: 'loki fluent',
  alerting: 'prometheus grafana alert',
  cloud: 'aws azure gcp google',
  amazon: 'aws', gcp: 'google cloud', aks: 'azure kubernetes',
  security: 'iam hardening sprinto vpn compliance guardduty waf secure',
  compliance: 'sprinto guardduty waf iam audit',
  networking: 'tcp ip dns dhcp subnetting vpn network',
  scripting: 'python bash powershell script',
  shell: 'bash script', os: 'linux centos ubuntu rhel',
  db: 'sql nosql database', database: 'sql nosql',
  versioning: 'git github version',
  migration: 'migrate migrated kubespray kubeadm',
  cluster: 'kubernetes eks aks kubespray',
  // hiring vocabulary, which maps onto the status section rather than a skill
  available: 'available opportunity freelance', availability: 'available opportunity freelance',
  hire: 'available opportunity freelance', hiring: 'available opportunity freelance',
  relocate: 'remote hybrid location', relocation: 'remote hybrid location',
  onsite: 'remote hybrid location',
  certification: 'certification rhcsa azure github foundation ibm coursera',
  cert: 'certification rhcsa azure github foundation',
  degree: 'mca bca university education', qualification: 'mca bca university certification',
  college: 'university chandigarh himachal',
};

// Grouped by the word the visitor typed. Without this, "does he know kubernetes
// and rust" answers about Kubernetes and silently implies rust is covered too —
// the one failure mode that actually matters on a CV. Alias expansions belong to
// the word that produced them, so a missing expansion is never reported as a
// missing word.
// Keys are written the way a person types them; lookups happen after stemming.
// Indexing both spellings is what makes "databases" reach the "database" entry.
const ASK_ALIAS_INDEX = (() => {
  const m = Object.create(null);
  for (const [k, v] of Object.entries(ASK_ALIASES)) { m[k] = v; m[askStem(k)] = v; }
  return m;
})();

function askTermGroups(q) {
  const groups = [];
  for (const w of askWords(q)) {
    if (ASK_STOPWORDS.has(w)) continue;
    const terms = [askNorm(w)];
    const alias = ASK_ALIAS_INDEX[w] || ASK_ALIAS_INDEX[askStem(w)];
    if (alias) for (const a of alias.split(' ')) terms.push(askNorm(a));
    groups.push({ word: w, terms: [...new Set(terms)] });
  }
  return groups;
}

// "ansible tower" and "azure devops" are product names; "aws and azure" is two
// things. The difference is whether the words sit next to each other, so this
// reads the raw word list — a stopword between them ends the phrase.
function askExpand(w) {
  const terms = [askNorm(w)];
  const alias = ASK_ALIAS_INDEX[w] || ASK_ALIAS_INDEX[askStem(w)];
  if (alias) for (const a of alias.split(' ')) terms.push(askNorm(a));
  return [...new Set(terms)];
}

function askAdjacentPairs(q) {
  const words = askWords(q);
  const pairs = [];
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i], b = words[i + 1];
    if (ASK_STOPWORDS.has(a) || ASK_STOPWORDS.has(b)) continue;
    const ta = askExpand(a), tb = askExpand(b);
    pairs.push({
      // the words as typed, for showing back; the stems, for looking up
      text: a + ' ' + b,
      key: askNorm(a) + ' ' + askNorm(b),
      // "log aggregation" is not written here, but both words point at Loki and
      // Fluent Bit, so the thing being asked about is covered. "azure devops"
      // shares nothing, which is what makes it a product name rather than a
      // pair of skills he happens to have.
      synonymous: ta.some(t => tb.includes(t)),
    });
  }
  return pairs;
}

function askQueryTerms(q) {
  return askTermGroups(q).flatMap(g => g.terms);
}

// ─── ASK: INDEX ───────────────────────────────────────────────────────────────
let askIndex = null;

function askBuildIndex() {
  if (askIndex) return askIndex;
  const docs = [];
  for (const [section, tplId] of Object.entries(SEARCHABLE)) {
    // The projects grid is a navigation index, not content: every card is a
    // blurb for a case study that is indexed below in full. Ranking it too made
    // a short doc of tag words beat the real write-ups, so "does he know
    // kubernetes" answered with the AWS SSO card. It stays a destination.
    if (section === 'projects') continue;
    const tpl = document.getElementById(tplId);
    if (!tpl) continue;
    docs.push({ label: section + '/', cmd: section, lines: [...new Set(extractLines(tpl))] });
  }
  for (const [file, meta] of Object.entries(CASE_STUDIES)) {
    const tpl = document.getElementById(meta.tpl);
    if (!tpl) continue;
    docs.push({
      label: 'projects/' + file, cmd: 'cat projects/' + file,
      lines: [...new Set(extractLines(tpl))],
    });
  }

  const df = Object.create(null);
  let totalLen = 0;
  for (const d of docs) {
    const terms = askTokens(d.lines.join(' '));
    d.len = terms.length;
    totalLen += d.len;
    d.tf = Object.create(null);
    for (const t of terms) d.tf[t] = (d.tf[t] || 0) + 1;
    for (const t of Object.keys(d.tf)) df[t] = (df[t] || 0) + 1;
  }

  // Adjacent content-word pairs, so a question can ask whether a *phrase* is
  // here rather than whether its words are here separately.
  const bigrams = new Set();
  for (const d of docs) {
    for (const line of d.lines) {
      const t = askWords(line).filter(w => !ASK_STOPWORDS.has(w)).map(askNorm);
      for (let i = 0; i + 1 < t.length; i++) bigrams.add(t[i] + ' ' + t[i + 1]);
    }
  }

  askIndex = { docs, df, bigrams, N: docs.length, avgdl: totalLen / (docs.length || 1) };
  return askIndex;
}

// Standard BM25. A word in every section (cloud) earns almost nothing; a word in
// one (kubespray) earns a lot, and the length term stops a long section winning
// on bulk alone.
const ASK_K1 = 1.5, ASK_B = 0.75;

function askRank(terms) {
  const idx = askBuildIndex();
  return idx.docs.map(doc => {
    let score = 0;
    const matched = new Set();
    for (const t of terms) {
      const f = doc.tf[t];
      if (!f) continue;
      matched.add(t);
      const n = idx.df[t] || 0;
      const idf = Math.log(1 + (idx.N - n + 0.5) / (n + 0.5));
      score += idf * (f * (ASK_K1 + 1)) /
               (f + ASK_K1 * (1 - ASK_B + ASK_B * doc.len / idx.avgdl));
    }
    return { doc, score, matched: matched.size };
  }).sort((a, b) => b.score - a.score);
}

// Evidence is gathered across every section rather than from the single best
// one: "has he used terraform" is answered better by the strongest line from
// each of four places than by four lines from one. Capped at two per section so
// nothing monopolises the answer.
function askEvidence(terms, limit) {
  const idx = askBuildIndex();
  const want = new Set(terms);
  const rows = [];

  for (const doc of idx.docs) {
    for (const line of doc.lines) {
      const words = askWords(line);
      if (!words.length) continue;
      const hit = new Set(words.filter(w => !ASK_STOPWORDS.has(w)).map(askNorm).filter(t => want.has(t)));
      if (!hit.size) continue;

      let weight = 0;
      for (const t of hit) {
        const n = idx.df[t] || 0;
        weight += Math.log(1 + (idx.N - n + 0.5) / (n + 0.5));
      }
      // A row of tag words has no connective tissue; a sentence does. Used only
      // as a tiebreak, so "Docker Kubernetes HELM EKS" loses to a line saying
      // what he did with them — but still wins when nothing else matched.
      const prose = words.filter(w => ASK_STOPWORDS.has(w)).length / words.length;
      rows.push({ doc, line, hits: hit.size, weight, prose });
    }
  }

  rows.sort((a, b) => b.hits - a.hits || (b.weight + b.prose) - (a.weight + a.prose));

  const picked = [], perDoc = new Map();
  for (const r of rows) {
    const n = perDoc.get(r.doc.label) || 0;
    if (n >= 2) continue;
    // the same sentence exists as both a heading and a "$ cat" line
    if (picked.some(k => k.line.includes(r.line) || r.line.includes(k.line))) continue;
    perDoc.set(r.doc.label, n + 1);
    picked.push(r);
    if (picked.length >= limit) break;
  }
  return picked;
}

// ─── ASK: RENDERING ───────────────────────────────────────────────────────────
function askSources(list) {
  if (!list || !list.length) return '';
  const links = list.map(s =>
    `<span class="clickable-cmd" data-cmd="${s.cmd}">${s.label}</span>`).join(' · ');
  return `<div class="ask-src">source: ${links}</div>`;
}

// Answers render into the terminal by default and into the chat panel while it
// is driving, so one engine serves both surfaces.
let askSink = addToHistory;

function askSay(bodyHTML, sources) {
  askSink(`<div class="ask-answer">${bodyHTML}${askSources(sources)}</div>`);
}

function askInto(sink, fn) {
  const previous = askSink;
  askSink = sink;
  try { fn(); } finally { askSink = previous; }
}

const askLine = t => `<div class="ask-line">${t}</div>`;
const askNote = t => `<div class="ask-note">${t}</div>`;

function askHighlight(text, want) {
  return escapeHTML(text).replace(/[A-Za-z0-9+#]+/g, w =>
    want.has(askNorm(w.toLowerCase())) ? `<span class="ask-hit">${w}</span>` : w);
}

function askEvidenceHTML(rows, terms) {
  const want = new Set(terms);
  return rows.map((r, i) => {
    const clipped = r.line.length > 200 ? r.line.slice(0, 200) + '…' : r.line;
    return `<div class="ask-ev" style="--i:${i}">` +
      `<span class="ask-ev-src"><span class="clickable-cmd" data-cmd="${r.doc.cmd}">${r.doc.label}</span></span>` +
      `<span class="ask-ev-line">${askHighlight(clipped, want)}</span></div>`;
  }).join('');
}

// ─── ASK: CURATED ANSWERS ─────────────────────────────────────────────────────
// Questions where ranked lines would read badly — availability, salary, notice
// period — and the ones that have no answer on the page at all. Checked before
// retrieval, so these are the only questions with a written reply.
// "DevOps Engineer · Company, Place · May 2024 – Dec 2025"
function askRoles() {
  const tpl = document.getElementById('tpl-git-log');
  return tpl ? extractLines(tpl).filter(l => /·/.test(l) && /\d{4}/.test(l)) : [];
}

const ASK_CONTACT = { label: 'contact/', cmd: 'contact' };
const ASK_STATUS  = { label: 'status/',  cmd: 'status' };

function askNotOnSite(what) {
  askSay(
    askLine(`That isn't written down anywhere on this site — ${what}`) +
    askNote(`Ask him directly: <span class="clickable-cmd" data-cmd="contact">contact</span> ` +
            `(he replies in under 24 hours).`),
    [ASK_CONTACT]);
}

const ASK_FAQ = [
  { // deliberately before the location rule, which also matches "remote"
    re: /\b(salary|ctc|compensation|package|stipend|pay scale|day rate|charge|expected pay|how much (do|does|would))\b/,
    run: () => askNotOnSite('he does not list rates or salary expectations publicly.'),
  },
  {
    re: /\b(visa|work permit|sponsor\w*|sponsorship|citizen|passport|right to work)\b/,
    run: () => askNotOnSite('work authorisation is not covered here.'),
  },
  {
    re: /\b(age|how old|date of birth|dob|married|marital|religion|caste|gender|photo)\b/,
    run: () => askSay(
      askLine('This site only covers his professional background.') +
      askNote('Try <span class="clickable-cmd" data-cmd="experience">experience</span>, ' +
              '<span class="clickable-cmd" data-cmd="skills">skills</span> or ' +
              '<span class="clickable-cmd" data-cmd="certs">certs</span>.'), []),
  },
  {
    re: /\b(notice period|when can (he|you) (start|join)|can he start|start date|joining date|how soon|how quickly|start immediately|available immediately)\b/,
    run: () => askSay(
      askLine('Open to opportunities and currently available — full-time and freelance.') +
      askNote('A specific start date is not listed; ask him directly via ' +
              '<span class="clickable-cmd" data-cmd="contact">contact</span>.'),
      [ASK_STATUS, ASK_CONTACT]),
  },
  {
    re: /\b(available|availability|open to work|open to opportunit\w*|looking for (a )?(job|role|work)|is he free|hiring|can i hire)\b/,
    run: () => askSay(
      askLine('<b>Open to opportunities</b> — available for full-time &amp; freelance roles.') +
      askLine('Works Remote · Hybrid. Response time: under 24 hours.'),
      [ASK_STATUS, ASK_CONTACT]),
  },
  {
    re: /\b(freelanc\w*|contract work|part.?time|consult\w*|side project|moonlight)\b/,
    run: () => askSay(
      askLine('Yes — the availability section lists <b>full-time &amp; freelance</b> roles.'),
      [ASK_STATUS, ASK_CONTACT]),
  },
  {
    re: /\b(how many years|years of experience|total experience|how long has|how long have|experience level|yrs|seniority|junior or senior|fresher|how experienced|level of experience)\b/,
    run: () => askSay(
      askLine(`<b>${careerExperience()}</b> — career started May 2024.`) +
      askLine('Currently DevOps Engineer at ResourceDekho IT Services (Remote) since Dec 2025.'),
      [{ label: 'about/', cmd: 'about' }, { label: 'experience/', cmd: 'experience' }]),
  },
  {
    re: /\b(where (is|are|does|do) (he|you|rishant)|where.{0,12}(based|located|live)|location|based in|relocat\w*|willing to move|remote|hybrid|onsite|on.site|wfh|which (city|country))\b/,
    run: () => askSay(
      askLine('Hamirpur, India 🇮🇳 — works <b>Remote · Hybrid</b>.') +
      askLine('His current role at ResourceDekho IT Services is remote.'),
      [ASK_STATUS, { label: 'about/', cmd: 'about' }]),
  },
  {
    re: /\b(contact|reach (him|you|out)|get in touch|email|e.?mail|phone|mobile|call him|whatsapp|connect)\b/,
    run: () => askSay(
      askLine('Email: <b>rishantshukla2002@gmail.com</b> · Phone: <b>+91 7018517052</b>') +
      askNote('Open <span class="clickable-cmd" data-cmd="contact">contact</span> for the form, ' +
              'GitHub and LinkedIn.'),
      [ASK_CONTACT]),
  },
  {
    re: /\b(education|degree|qualification|college|university|studied|graduat\w*|mca|bca|cgpa|academic|school)\b/,
    run: () => askSay(
      askLine('🎓 <b>MCA</b> — Cloud Computing &amp; DevOps, Chandigarh University · CGPA 7.70 · 2022–2024') +
      askLine('🎓 <b>BCA</b> — Himachal Pradesh University · CGPA 8.50 · 2019–2022'),
      [{ label: 'education/', cmd: 'education' }]),
  },
  {
    re: /\b(certif\w*|rhcsa|credential|badge|accredit\w*)\b/,
    run: () => askSay(
      askLine('🏅 RHCSA (Red Hat) · Azure Fundamentals (Microsoft) · GitHub Foundations') +
      askLine('🏅 Python for Data Science (IBM) · DevOps Foundations: CI/CD (LinkedIn) · SQL (Coursera)') +
      askNote('All active. <span class="clickable-cmd" data-cmd="certs">certs</span> has the verification links.'),
      [{ label: 'certs/', cmd: 'certs' }]),
  },
  {
    re: /\b(resume|cv|download.{0,10}(pdf|file))\b/,
    run: () => askSay(
      askLine('The full PDF résumé is one command away.') +
      askNote('<span class="clickable-cmd" data-cmd="resume">resume</span> opens it.'), []),
  },
  {
    // "work/worked/experience" are stopwords so they cannot dominate scoring,
    // which left "tell me about his work" with no content words to search at all.
    re: /\b(his work\b|what work\b|what (has|have) he (done|built|achieved|delivered)|what does he do\b|working on|tell me about (his )?(work|career|background|experience)|work experience|professional background)/,
    run: () => { askSink(document.getElementById('tpl-git-log').innerHTML); },
  },
  {
    re: /\b(what (did|does) he do at|his (role|responsibilit|work) at|day.to.day|what does he actually do)\b/,
    run: () => { askSink(document.getElementById('tpl-git-log').innerHTML); },
  },
  {
    // "has he worked at amazon" was answered Yes off the back of "Amazon EKS".
    // A provider's name in a bullet is a tool, not an employer.
    re: /\b(where\s+(has|have|had|did|does|do)?\s*(he|you|rishant)?\s*work\w*|work\w*\s+(at|for)\b|employed\s+(by|at)\b|previous\s+(compan|employer|job|role)\w*|past\s+(employer|job|role)\w*|which\s+compan\w*|has\s+he\s+been\s+at\b|(still|currently|now)\s+(at|with)\s+\w|work\s+history|employment\s+history|career\s+history|his\s+jobs?\b|what\s+companies)/,
    run: () => {
      // Read off the page, not written here. The first version of this answer
      // said "one employer" and silently erased the Vavensoft role — a worse
      // error than the one it was added to fix.
      const roles = askRoles();
      askSay(
        askLine(`${roles.length} role${roles.length === 1 ? '' : 's'} on this page, most recent first:`) +
        roles.map(r => askLine('· ' + escapeHTML(r))).join('') +
        askNote('Names like Amazon, Microsoft or Red Hat appear here as tools he uses and ' +
                'certifications he holds, not as employers. Full detail: ' +
                '<span class="clickable-cmd" data-cmd="experience">experience</span>.'),
        [{ label: 'experience/', cmd: 'experience' }]);
    },
  },
  {
    re: /\b(current (company|employer|role|job)|who does he work for|where does he work now|present employer)\b/,
    run: () => askSay(
      askLine('<b>DevOps Engineer</b> at ResourceDekho IT Services (Remote), Dec 2025 – Present.'),
      [{ label: 'experience/', cmd: 'experience' }]),
  },
  {
    re: /\b(why (should|would).{0,20}hire|why him|why you|strength\w*|good fit|stand out|best at|sell yourself)\b/,
    run: () => askSay(
      askLine('Short version: he automates infrastructure end to end — Terraform and Ansible for ' +
              'provisioning, Argo CD for GitOps delivery, EKS/ECS for runtime, and Prometheus/Grafana ' +
              'for what happens next.') +
      askNote('The receipts: <span class="clickable-cmd" data-cmd="experience">experience</span> · ' +
              '<span class="clickable-cmd" data-cmd="ls projects">ls projects</span> · ' +
              '<span class="clickable-cmd" data-cmd="certs">certs</span>'),
      [{ label: 'about/', cmd: 'about' }]),
  },
  {
    re: /^(what('s| is| are)? ?(his|the|your)? ?)?(tech ?stack|skill ?set|skills|technologies|tools|stack)\s*\??$/,
    run: () => askSay(
      askLine('<b>Cloud</b> AWS · Azure · GCP &nbsp; <b>Containers</b> Docker · Kubernetes · HELM · EKS/ECS/AKS') +
      askLine('<b>CI/CD</b> Jenkins · GitHub Actions · GitLab CI · Argo CD · Terraform · Ansible') +
      askLine('<b>Monitoring</b> Prometheus · Grafana · Loki · CloudWatch &nbsp; <b>Scripting</b> Python · Bash · PowerShell') +
      askNote('Full tree: <span class="clickable-cmd" data-cmd="skills">skills</span>'),
      [{ label: 'skills/', cmd: 'skills' }]),
  },
  {
    // Anchored for the bare noun, plus the asked-for-a-list phrasings. Kept off
    // "tell me about the kubespray project", which retrieval answers better.
    re: /^(what('s| is| are)? ?(his|the|your)? ?)?(projects?|case ?stud(y|ies)|portfolio work|best work|strongest work)\s*\??$|\b(best|strongest|proudest|favourite|favorite) (work|project)|\b(what|which|any|list|show)\b.{0,14}\b(projects?|case stud)/,
    run: () => askSay(
      askLine('Three case studies, each readable here:') +
      askLine('· <span class="clickable-cmd" data-cmd="cat projects/aws-sso.md">AWS Multi-Account Org &amp; SSO</span>') +
      askLine('· <span class="clickable-cmd" data-cmd="cat projects/shopfloorgpt.md">ShopfloorGPT on AKS</span>') +
      askLine('· <span class="clickable-cmd" data-cmd="cat projects/kubespray.md">Kubeadm → Kubespray Migration</span>'),
      [{ label: 'projects/', cmd: 'ls projects' }]),
  },
  {
    re: /\b(who is (he|rishant|you)|who are you|introduce|tell me about (him|rishant|yourself)|about (him|rishant)|his background|summary)\b/,
    run: () => askSay(
      askLine('<b>Rishant Shukla</b> — DevOps Engineer at ResourceDekho IT Services, working remotely ' +
              'from Hamirpur, India.') +
      askLine('Focus: Cloud Infrastructure · Kubernetes · IaC · Automation.') +
      askNote('<span class="clickable-cmd" data-cmd="about">about</span> has the full card.'),
      [{ label: 'about/', cmd: 'about' }]),
  },
  {
    re: /\b(what can i ask|what commands|list commands|how do i use|what is this site|help me)\b/,
    run: () => askUsage(),
  },
];

// ─── ASK: ENTRY POINT ─────────────────────────────────────────────────────────
const ASK_EXAMPLES = [
  'does he know kubernetes?',
  'is he available for work?',
  'what cloud experience does he have?',
  'has he used terraform?',
];

// Drawn on after each answer so the conversation has somewhere to go. Kept
// wider than ASK_EXAMPLES so the suggestions do not repeat immediately.
const ASK_SUGGESTIONS = [
  'does he know kubernetes?',
  'is he available for work?',
  'what cloud experience does he have?',
  'has he used terraform?',
  'what certifications does he have?',
  'where is he based?',
  'what did he build with argo cd?',
  'how many years of experience?',
  'what monitoring tools has he used?',
  'tell me about the kubespray migration',
];

// Measured over 30 answerable and 15 unanswerable questions, the split is not a
// gradient: everything answerable scored >= 0.98 and everything unanswerable
// scored exactly 0.000, because its terms are not in the corpus at all. So the
// real signal is "did any query term match anything", not a score cutoff — an
// absolute BM25 score is not comparable across queries on eleven documents. The
// floor below is only a guard; `matched` is what decides. (A tuned 1.2 cutoff
// rejected "microservices" at 1.199 and, once K8s folded into the index and
// dropped kubernetes' IDF, "does he know kubernetes" as well.)
const ASK_MIN_SCORE = 0.3;

function askUsage() {
  const examples = ASK_EXAMPLES
    .map(q => `<div class="ask-eg"><span class="clickable-cmd" data-cmd="ask ${q}">ask ${q}</span></div>`)
    .join('');
  askSay(
    askLine('Ask a question about his work in plain English.') +
    askNote('It searches what is written on this page and quotes back the lines ' +
            'that matched. Try:') + examples, []);
}

// Shape of the question, not its content: "does he know X" deserves a verdict,
// "tell me about X" just deserves the evidence.
const ASK_YESNO = /^(do|does|did|is|are|was|were|has|have|had|can|could|will|would|any|anything|know|knows)\b/;

// "is he still at Vavensoft" asks about a state, not about whether a word is
// printed somewhere. Answering "Yes — found in 1 section" means "yes, that word
// appears", which reads as "yes, he is" — and he left in Dec 2025. These
// questions get the neutral lead and the dated evidence instead.
const ASK_TEMPORAL = /\b(still|currently|right now|at present|these days|anymore|any more|as of)\b/;

const askWordList = words => words.map(w => `<b>${escapeHTML(w)}</b>`).join(', ');

// "kubernetes AND rust" asks about two things; "log aggregation" and "cloud
// providers" are one noun phrase each. Announcing that the page does not
// mention "aggregation" or "providers" is noise dressed up as honesty, so a
// miss is only reported when its own clause turned up nothing at all.
function askCoordinatedMisses(normalised, present, missing) {
  if (!present.length || !missing.length) return missing;
  const found = new Set(present.map(g => g.word));
  const clauses = normalised.split(/\s+(?:and|or|but|plus)\s+|[,;/]/);
  return missing.filter(g => {
    const clause = clauses.find(cl => askWords(cl).includes(g.word));
    return clause !== undefined && !askWords(clause).some(w => found.has(w));
  });
}

// The page lists what he has done; it cannot weigh two things against each
// other. Saying so is better than ranking them by word count.
const ASK_COMPARE = /\b(compare|comparison|versus|vs\.?|better at|stronger (at|in)|which is he better|more experience (with|in))\b/;

function runAsk(rawQuestion) {
  const question = rawQuestion.trim();
  if (!question) { askUsage(); return; }

  const normalised = question.toLowerCase().replace(/\s+/g, ' ');
  for (const entry of ASK_FAQ) {
    if (entry.re.test(normalised)) { entry.run(); return; }
  }

  const groups = askTermGroups(question);
  if (!groups.length) { askUsage(); return; }

  const idx      = askBuildIndex();
  const inCorpus = g => g.terms.some(t => idx.df[t]);
  const present  = groups.filter(inCorpus);
  const missing  = askCoordinatedMisses(normalised, groups.filter(inCorpus), groups.filter(g => !inCorpus(g)));
  // "Yes" has to mean the things asked about actually occur together, not that
  // each word turns up somewhere. "ansible tower" matched Ansible and claimed
  // Yes; "jira automation" matched automation and did the same. Where a word is
  // disclosed as missing the sentence already says so, and keeps its verdict.
  // Every phrase the question asks about has to exist as a phrase. Azure and
  // DevOps both appear here and even share a line, but "Azure DevOps" is a
  // product he has not listed, and a Yes would be claiming he has.
  const gaps = askAdjacentPairs(question)
    .filter(ph => !ph.synonymous && !idx.bigrams.has(ph.key));
  const phrasesHere = gaps.length === 0;
  const together = phrasesHere && (groups.length < 2 || idx.docs.some(d => d.lines.some(line => {
    const lt = new Set(askTokens(line));
    return groups.every(g => g.terms.some(t => lt.has(t)));
  })));
  const yesNo    = ASK_YESNO.test(normalised) && !ASK_TEMPORAL.test(normalised)
                   && (missing.length > 0 || together);
  const caveat   = ASK_COMPARE.test(normalised)
    ? askNote('This page lists what he has done — it has no basis for ranking one against the other. Both, as written:')
    : '';

  // Nothing the visitor asked about is written here. Name what was looked for
  // rather than giving a shrug — "nothing mentions cobol" is an answer.
  if (!present.length) {
    const words = askWordList([...new Set(groups.map(g => g.word))]);
    askSay(
      askLine(yesNo
        ? `<b class="ask-no">No</b> — nothing on this page mentions ${words}.`
        : `Nothing on this page mentions ${words}.`) +
      askNote('Try <span class="clickable-cmd" data-cmd="help">help</span> for what is here, or ' +
              '<span class="clickable-cmd" data-cmd="contact">contact</span> to ask him directly.'),
      []);
    return;
  }

  const terms    = present.flatMap(g => g.terms);
  const hitDocs  = idx.docs.filter(d => terms.some(t => d.tf[t]));
  const rows     = askEvidence(terms, 4);
  const n        = hitDocs.length;
  const where    = `${n} section${n === 1 ? '' : 's'}`;

  const shaped = ASK_YESNO.test(normalised) && !ASK_TEMPORAL.test(normalised);
  const absent = groups.filter(g => !inCorpus(g));

  let verdict;
  const phraseGap = gaps.map(ph => ph.text);

  if (!missing.length && shaped && !together && phraseGap.length) {
    // Asked as a yes/no about a thing whose words never appear together, and
    // part of it is not here at all: "does he know ansible tower". Saying
    // "found in 3 sections" over Ansible lines still reads as yes, so name it.
    const gap = absent.length
      ? askWordList([...new Set(absent.map(g => g.word))])
      : askWordList([...new Set(phraseGap)]);
    const has = present.length
      ? ` What it does say about ${askWordList([...new Set(present.map(g => g.word))])}:` : '';
    verdict = `<b class="ask-no">Nothing</b> on this page mentions ${gap}.${has}`;
  } else if (missing.length) {
    // The honest case: part of the question is answered and part is not.
    const yes = askWordList([...new Set(present.map(g => g.word))]);
    const no  = askWordList([...new Set(missing.map(g => g.word))]);
    verdict = yesNo
      ? `<b class="ask-yes">Yes</b> for ${yes}, found in ${where}. ` +
        `<b class="ask-no">Nothing</b> on this page mentions ${no}.`
      : `${yes} appears in ${where}. <b class="ask-no">Nothing</b> mentions ${no}.`;
  } else {
    verdict = yesNo
      ? `<b class="ask-yes">Yes</b> — found in ${where}:`
      : `Found in ${where}:`;
  }

  const sources = [...new Map(rows.map(r => [r.doc.label, { label: r.doc.label, cmd: r.doc.cmd }])).values()];

  askSay(
    askLine(verdict) + caveat +
    (rows.length ? askEvidenceHTML(rows, terms) : ''),
    sources);
}

// ─── VCARD ────────────────────────────────────────────────────────────────────
// `vcard` downloads a .vcf so a recruiter can save the contact in one action
// instead of copying four fields. Every value is read off the contact and
// about blocks rather than written here, so it cannot drift from the page.

function fieldsFrom(tplId, keySel, valSel, rowSel) {
  const tpl = document.getElementById(tplId);
  const out = {};
  if (!tpl) return out;
  tpl.querySelectorAll(rowSel).forEach(row => {
    const k = row.querySelector(keySel)?.textContent.replace(/["']/g, '').trim().toLowerCase();
    const v = row.querySelector(valSel)?.textContent.replace(/["']/g, '').trim();
    if (k && v) out[k] = v;
  });
  return out;
}

// RFC 6350: backslash, comma and semicolon are structural inside a value.
const vcEscape = v => String(v).replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\r?\n/g, '\\n');

function buildVCard() {
  const c = fieldsFrom('tpl-contact',  '.cj-key', '.cj-val', '.cj-row');
  const a = fieldsFrom('tpl-neofetch', '.nf-key', '.nf-val', '.nf-row');

  const full  = a.user || 'Rishant Shukla';
  const parts = full.split(/\s+/);
  const last  = parts.length > 1 ? parts.pop() : '';
  const first = parts.join(' ');
  // "Hamirpur, India 🇮🇳" -> city + country, emoji dropped
  const loc   = (c.location || a.location || '').replace(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}]/gu, '').trim();
  const [city, country] = loc.split(',').map(x => (x || '').trim());

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${vcEscape(last)};${vcEscape(first)};;;`,
    `FN:${vcEscape(full)}`,
  ];
  if (a.role)    lines.push(`TITLE:${vcEscape(a.role)}`);
  if (a.company) lines.push(`ORG:${vcEscape(a.company)}`);
  if (c.email)   lines.push(`EMAIL;TYPE=INTERNET,PREF:${vcEscape(c.email)}`);
  const tel = (c.phone || a.phone || '').replace(/[^+\d]/g, '');
  if (tel)       lines.push(`TEL;TYPE=CELL:${tel}`);
  if (city)      lines.push(`ADR;TYPE=WORK:;;;${vcEscape(city)};;;${vcEscape(country || '')}`);
  lines.push(`URL:${location.origin}${location.pathname}`);
  if (c.linkedin) lines.push(`X-SOCIALPROFILE;TYPE=linkedin:https://${vcEscape(c.linkedin.replace(/^https?:\/\//, ''))}`);
  if (c.github)   lines.push(`X-SOCIALPROFILE;TYPE=github:https://${vcEscape(c.github.replace(/^https?:\/\//, ''))}`);
  if (a.focus)    lines.push(`NOTE:${vcEscape(a.focus.replace(/\s*·\s*/g, ', '))}`);
  lines.push(`REV:${new Date().toISOString().replace(/\.\d{3}/, '')}`);
  lines.push('END:VCARD');

  return lines.join('\r\n') + '\r\n';   // CRLF is required by the spec
}

function runVCard() {
  let card;
  try { card = buildVCard(); } catch { card = null; }
  if (!card) {
    addToHistory(`<div style="color:var(--red);">vcard: could not read the contact block</div>`);
    return;
  }
  const name = (buildVCardName() || 'contact').replace(/\s+/g, '_');
  let ok = true;
  try {
    const blob = new Blob([card], { type: 'text/vcard;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const el   = document.createElement('a');
    el.href = url; el.download = `${name}.vcf`;
    document.body.appendChild(el); el.click(); el.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch { ok = false; }

  addToHistory(
    (ok ? `<div style="color:var(--green);">Saved <b>${escapeHTML(name)}.vcf</b> — ` +
             `${card.split('\r\n').filter(Boolean).length - 3} fields.</div>`
        : `<div style="color:var(--red);">vcard: your browser blocked the download.</div>`) +
    `<div style="color:var(--fg-dim);font-size:12px;margin-top:6px;">` +
    `// import it into any address book, or open ` +
    `<span class="clickable-cmd" data-cmd="contact">contact</span> to copy the fields instead.</div>`);
}

function buildVCardName() {
  const a = fieldsFrom('tpl-neofetch', '.nf-key', '.nf-val', '.nf-row');
  return a.user || 'Rishant Shukla';
}

// ─── INPUT SYNTAX HIGHLIGHTING ────────────────────────────────────────────────
// What a modern shell does as you type: the command turns green when it is real
// and red when it is not, before you press Enter. #input-display already mirrors
// the value, so this only changes how that mirror is painted.

const SX_PREFIX = ['cat', 'cd', 'grep', 'theme', 'ask', 'split', 'echo', 'ping', 'sudo',
                   'ls', 'docker', 'kubectl', 'terraform'];

function sxKnown(segment, stage) {
  const seg = segment.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!seg) return null;
  const head = seg.split(' ')[0];
  // after a pipe, only the filters are real commands
  if (stage > 0) return Object.prototype.hasOwnProperty.call(PIPE_FILTERS, head);
  if (availableCommands.includes(seg)) return true;
  if (SX_PREFIX.includes(head)) return true;
  if (availableCommands.includes(head)) return true;
  return false;
}

function sxSegment(raw, stage) {
  const known = sxKnown(raw, stage);
  const lead = raw.match(/^\s*/)[0];
  const body = raw.slice(lead.length);
  if (!body) return escapeHTML(raw);

  const parts = body.split(/(\s+)/);
  let seenCmd = false;
  const html = parts.map(tok => {
    if (/^\s+$/.test(tok)) return tok;
    if (!seenCmd) {
      seenCmd = true;
      return `<span class="${known === false ? 'sx-bad' : 'sx-cmd'}">${escapeHTML(tok)}</span>`;
    }
    if (/^-/.test(tok))        return `<span class="sx-flag">${escapeHTML(tok)}</span>`;
    if (/^["'].*["']$/.test(tok)) return `<span class="sx-str">${escapeHTML(tok)}</span>`;
    if (/[/.]/.test(tok))      return `<span class="sx-path">${escapeHTML(tok)}</span>`;
    return `<span class="sx-arg">${escapeHTML(tok)}</span>`;
  }).join('');
  return escapeHTML(lead) + html;
}

function sxHighlight(value) {
  if (!value) return '';
  return value.split('|')
    .map((seg, i) => sxSegment(seg, i))
    .join('<span class="sx-pipe">|</span>');
}

function renderInput(value) {
  inputDisplay.innerHTML = sxHighlight(value);
}

// ─── TOUR ─────────────────────────────────────────────────────────────────────
// A terminal asks you to know what to type. Most visitors do not, and leave.
// `tour` drives a short curated sequence itself, captioned, and stoppable at
// any point — runCommandClick does not push to commandHistory, so a tour does
// not flood the saved history.
const TOUR = [
  { cmd: 'whoami',                  note: 'Who he is, in one card.' },
  { cmd: 'experience',              note: 'Two roles, most recent first.' },
  { cmd: 'skills',                  note: 'The whole stack, grouped.' },
  { cmd: 'cat projects/aws-sso.md', note: 'One case study, in full.' },
  { cmd: 'status',                  note: 'Availability and response time.' },
];

let tourRunning = false;
const tourStop = () => { tourRunning = false; };

async function runTour() {
  if (tourRunning || isBooting) return;
  tourRunning = true;
  try { localStorage.setItem('portfolio-toured', '1'); } catch { /* private mode */ }

  addToHistory(
    `<div class="tour-banner"><span class="tour-dot"></span>` +
    `<span>Guided tour — ${TOUR.length} stops, about 40 seconds.</span>` +
    `<button type="button" class="tour-skip">skip</button></div>`);

  for (let i = 0; i < TOUR.length; i++) {
    if (!tourRunning) break;
    const step = TOUR[i];
    addToHistory(`<div class="tour-step"><span class="tour-num">${i + 1}/${TOUR.length}</span>` +
                 `${escapeHTML(step.note)}</div>`);
    await runCommandClick(step.cmd, 'tour');
    if (!tourRunning) break;
    await new Promise(r => setTimeout(r, prefersReducedMotion() ? 500 : 1700));
  }

  const finished = tourRunning;
  tourRunning = false;
  addToHistory(
    `<div style="color:var(--${finished ? 'green' : 'fg-dim'});">` +
    `${finished ? 'That is the tour.' : 'Tour stopped.'}</div>` +
    `<div style="color:var(--fg-dim);font-size:12px;margin-top:6px;">// from here: ` +
    `<span class="clickable-cmd" data-cmd="help">help</span> for everything, ` +
    `<span class="clickable-cmd" data-cmd="ask is he available for work?">ask a question</span>, or ` +
    `<span class="clickable-cmd" data-cmd="contact">contact</span></div>`);
  cmdInput?.focus();
}

document.addEventListener('click', e => {
  if (e.target.closest('.tour-skip')) { e.stopPropagation(); tourStop(); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && tourRunning) tourStop();
});

// ─── SHARE ────────────────────────────────────────────────────────────────────
// /?run=<command> opens running that command. #section hashes could already
// link a section; this links an answer, so a link can be aimed at whatever is
// relevant to the person receiving it.
const RUN_PARAM = 'run';
const RUN_MAX   = 120;

function linkedCommand() {
  try {
    const raw = new URLSearchParams(location.search).get(RUN_PARAM);
    if (!raw) return null;
    const cmd = raw.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, RUN_MAX);
    return cmd || null;
  } catch { return null; }
}

function shareLink(cmd) {
  return `${location.origin}${location.pathname}?${RUN_PARAM}=${encodeURIComponent(cmd)}`;
}

async function runShare(arg) {
  const explicit = arg.trim();
  const cmd = explicit || commandHistory[commandHistory.length - 1] || '';
  if (!cmd) {
    addToHistory(`<div style="color:var(--red);">share: nothing to share yet</div>` +
      `<div style="color:var(--fg-dim);font-size:12px;margin-top:4px;">// run something first, ` +
      `or name it: <span class="clickable-cmd" data-cmd="share skills">share skills</span></div>`);
    return;
  }
  const url = shareLink(cmd);
  const ok  = await copyValue(url);
  addToHistory(
    `<div style="color:${ok ? 'var(--green)' : 'var(--yellow)'};">` +
    `${ok ? 'Copied' : 'Link for'} <b>${escapeHTML(cmd)}</b></div>` +
    `<div class="share-url">${escapeHTML(url)}</div>` +
    `<div style="color:var(--fg-dim);font-size:12px;margin-top:8px;">` +
    `// opening it runs that command instead of the usual intro</div>`);
}

// ─── SPLIT ────────────────────────────────────────────────────────────────────
// `split skills experience` — two sections side by side with a draggable
// divider, the way you would actually read them when comparing.

function splitPane(rawCmd) {
  const cmd = canonical(rawCmd.trim().toLowerCase().replace(/\s+/g, ' '));
  if (SEARCHABLE[cmd]) {
    const tpl = document.getElementById(SEARCHABLE[cmd]);
    return tpl ? { title: cmd, html: tpl.innerHTML } : null;
  }
  if (cmd.startsWith('cat ')) {
    const study = resolveCaseStudy(cmd.slice(4));
    if (study) {
      const tpl = document.getElementById(CASE_STUDIES[study].tpl);
      return tpl ? { title: 'projects/' + study, html: tpl.innerHTML } : null;
    }
  }
  const study = resolveCaseStudy(cmd);
  if (study) {
    const tpl = document.getElementById(CASE_STUDIES[study].tpl);
    return tpl ? { title: 'projects/' + study, html: tpl.innerHTML } : null;
  }
  return null;
}

function splitUsage(err) {
  addToHistory(
    (err ? `<div style="color:var(--red);">${err}</div>` : '') +
    `<div style="color:var(--fg-dim);font-size:12px;margin-top:6px;">` +
    `// usage: split &lt;left&gt; &lt;right&gt; — e.g. ` +
    `<span class="clickable-cmd" data-cmd="split skills experience">split skills experience</span>, ` +
    `<span class="clickable-cmd" data-cmd="split aws-sso kubespray">split aws-sso kubespray</span><br>` +
    `// panes: about, experience, skills, projects, certs, education, status, contact, ` +
    `and any case study</div>`);
}

function runSplit(arg) {
  const parts = arg.trim().split(/\s+/).filter(Boolean);
  if (parts.length !== 2) {
    splitUsage(parts.length ? `split: need exactly two panes, got ${parts.length}` : '');
    return;
  }
  const [l, r] = parts.map(splitPane);
  if (!l) { splitUsage(`split: ${escapeHTML(parts[0])}: cannot open in a pane`); return; }
  if (!r) { splitUsage(`split: ${escapeHTML(parts[1])}: cannot open in a pane`); return; }

  addToHistory(
    `<div class="split-wrap">` +
      `<div class="split-pane" style="flex:1 1 50%">` +
        `<div class="split-head"><span class="split-dot"></span>${escapeHTML(l.title)}</div>` +
        `<div class="split-body">${l.html}</div></div>` +
      `<div class="split-bar" role="separator" aria-orientation="vertical" tabindex="0" ` +
           `aria-label="Resize panes — use the left and right arrow keys"></div>` +
      `<div class="split-pane" style="flex:1 1 50%">` +
        `<div class="split-head"><span class="split-dot"></span>${escapeHTML(r.title)}</div>` +
        `<div class="split-body">${r.html}</div></div>` +
    `</div>`);
}

// One delegated handler for every split that will ever be rendered.
(function splitResize() {
  function sizer(bar) {
    const wrap = bar.parentElement;
    const [a, b] = wrap.querySelectorAll(':scope > .split-pane');
    return { wrap, a, b };
  }
  function setRatio(bar, pct) {
    const { a, b } = sizer(bar);
    const p = Math.min(80, Math.max(20, pct));
    a.style.flex = `1 1 ${p}%`;
    b.style.flex = `1 1 ${100 - p}%`;
  }
  document.addEventListener('pointerdown', e => {
    const bar = e.target.closest('.split-bar');
    if (!bar || window.innerWidth <= 700) return;
    e.preventDefault();
    const { wrap } = sizer(bar);
    const move = ev => {
      const r = wrap.getBoundingClientRect();
      setRatio(bar, ((ev.clientX - r.left) / r.width) * 100);
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      document.body.classList.remove('split-dragging');
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    document.body.classList.add('split-dragging');
  });
  document.addEventListener('keydown', e => {
    const bar = e.target.closest?.('.split-bar');
    if (!bar || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const { wrap, a } = sizer(bar);
    const cur = (a.getBoundingClientRect().width / wrap.getBoundingClientRect().width) * 100;
    setRatio(bar, cur + (e.key === 'ArrowRight' ? 6 : -6));
  });
})();

// ─── PIPES ────────────────────────────────────────────────────────────────────
// `skills | grep aws`, `experience | grep terraform | head -3`. The left side
// produces lines, each filter transforms them. Sources read the same templates
// grep and ask already read, so a pipeline can never print something the
// section itself would not.

function pipeSource(rawCmd) {
  const cmd = canonical(rawCmd.trim().toLowerCase().replace(/\s+/g, ' '));

  if (SEARCHABLE[cmd]) {
    const tpl = document.getElementById(SEARCHABLE[cmd]);
    return tpl ? [...new Set(extractLines(tpl))] : null;
  }
  if (cmd === 'ls' || cmd === 'ls -la' || cmd === 'ls -l') {
    const tpl = document.getElementById('tpl-ls');
    return tpl ? extractLines(tpl).filter(l => !/^total /.test(l)) : null;
  }
  if (/^ls +projects\/?$/.test(cmd) || /^ls +-l[a]? +projects\/?$/.test(cmd)) {
    return Object.keys(CASE_STUDIES);
  }
  if (cmd.startsWith('cat ')) {
    const study = resolveCaseStudy(cmd.slice(4));
    if (study) {
      const tpl = document.getElementById(CASE_STUDIES[study].tpl);
      return tpl ? [...new Set(extractLines(tpl))] : null;
    }
    return null;
  }
  if (cmd === 'help')    return [...availableCommands];
  if (cmd === 'history') return commandHistory.slice();
  if (cmd === 'certs')   return [...new Set(extractLines(document.getElementById('tpl-education')))];
  return null;
}

// `-n 3`, `-3` and a bare `3` all mean the same thing to anyone who has used a
// shell without thinking too hard about it.
function pipeCount(args, fallback) {
  for (const a of args) {
    const m = /^-?n?(\d+)$/.exec(a);
    if (m) return parseInt(m[1], 10);
  }
  return fallback;
}

const PIPE_FILTERS = {
  // Case-insensitive to match the standalone grep on this site, which is what
  // anyone here will have tried first.
  grep(lines, args) {
    const flags = args.filter(a => /^-/.test(a) && !/^-?n?\d+$/.test(a));
    const terms = args.filter(a => !/^-/.test(a));
    const term  = terms.join(' ').trim();
    if (!term) throw new Error('usage: grep &lt;term&gt;');
    const invert = flags.some(f => f.includes('v'));
    const hit = l => l.toLowerCase().includes(term.toLowerCase());
    const out = lines.filter(l => (invert ? !hit(l) : hit(l)));
    if (flags.some(f => f.includes('c'))) return { lines: [String(out.length)] };
    return { lines: out, term };
  },
  head: (lines, args) => ({ lines: lines.slice(0, pipeCount(args, 10)) }),
  tail: (lines, args) => ({ lines: lines.slice(-pipeCount(args, 10)) }),
  sort: (lines, args) => {
    const s = [...lines].sort((a, b) => a.localeCompare(b));
    return { lines: args.some(a => a.includes('r')) ? s.reverse() : s };
  },
  uniq: lines => ({ lines: [...new Set(lines)] }),
  wc:   (lines, args) =>
    ({ lines: [args.some(a => a.includes('w'))
        ? String(lines.join(' ').split(/\s+/).filter(Boolean).length)
        : String(lines.length)] }),
  nl:   lines => ({ lines: lines.map((l, i) => `${String(i + 1).padStart(4)}  ${l}`) }),
};

function pipeUsage(extra) {
  addToHistory(
    (extra ? `<div style="color:var(--red);">${extra}</div>` : '') +
    `<div style="color:var(--fg-dim);font-size:12px;margin-top:6px;">` +
    `// pipe a section through a filter — ` +
    `<span class="clickable-cmd" data-cmd="skills | grep aws">skills | grep aws</span>, ` +
    `<span class="clickable-cmd" data-cmd="experience | grep terraform">experience | grep terraform</span>, ` +
    `<span class="clickable-cmd" data-cmd="skills | wc -l">skills | wc -l</span><br>` +
    `// filters: grep, head, tail, sort, uniq, wc, nl</div>`);
}

function runPipeline(raw) {
  const parts = raw.split('|').map(s => s.trim());
  const srcCmd = parts.shift();

  if (!srcCmd) { pipeUsage('bash: syntax error near unexpected token `|&#39;'); return; }
  if (parts.some(p => !p)) { pipeUsage('bash: syntax error near unexpected token `|&#39;'); return; }

  let lines = pipeSource(srcCmd);
  if (lines === null) {
    pipeUsage(`bash: ${escapeHTML(srcCmd)}: cannot pipe this command`);
    return;
  }

  let term = '';
  for (const stage of parts) {
    const [name, ...args] = stage.split(/\s+/);
    const filter = PIPE_FILTERS[name];
    if (!filter) {
      pipeUsage(`bash: ${escapeHTML(name)}: command not found`);
      return;
    }
    try {
      const res = filter(lines, args);
      lines = res.lines;
      if (res.term) term = res.term;
    } catch (e) {
      pipeUsage(escapeHTML(e.message).replace('&amp;lt;', '&lt;').replace('&amp;gt;', '&gt;'));
      return;
    }
  }

  if (!lines.length) {
    addToHistory(`<div style="color:var(--fg-dim);">(no matching lines)</div>`);
    return;
  }

  const CAP = 40;
  const shown = lines.slice(0, CAP).map(l => {
    const clipped = l.length > 220 ? l.slice(0, 220) + '…' : l;
    return `<div class="pipe-line">${term ? highlightTerm(clipped, term) : escapeHTML(clipped)}</div>`;
  }).join('');

  const more = lines.length > CAP
    ? `<div class="pipe-meta">… ${lines.length - CAP} more line${lines.length - CAP === 1 ? '' : 's'}. Add <span class="clickable-cmd" data-cmd="${escapeHTML(raw)} | head">| head</span> to trim.</div>`
    : `<div class="pipe-meta">${lines.length} line${lines.length === 1 ? '' : 's'}</div>`;

  addToHistory(shown + more);
}

// ─── COMMAND PROCESSOR ────────────────────────────────────────────────────────
function processCommand(cmd) {
  syncHash(cmd);
  switch (cmd) {
    case 'help':    addToHistory(document.getElementById('tpl-help').innerHTML); break;
    case 'clear':   history.innerHTML = ''; break;
    case 'about':
    case 'neofetch':
    case 'whoami':  addToHistory(document.getElementById('tpl-neofetch').innerHTML); break;
    case 'git log':
    case 'experience': addToHistory(document.getElementById('tpl-git-log').innerHTML); break;
    case 'projects': addToHistory(document.getElementById('tpl-projects').innerHTML); break;
    case 'skills':
    case 'tree':    addToHistory(document.getElementById('tpl-skills').innerHTML); break;
    case 'certs':   addToHistory(document.getElementById('tpl-education').innerHTML); break;
    case 'education': addToHistory(document.getElementById('tpl-education2').innerHTML); break;
    case 'contact':
    case 'email':   addToHistory(document.getElementById('tpl-contact').innerHTML); break;
    case 'status':  addToHistory(document.getElementById('tpl-status').innerHTML); break;
    case 'deploy':  runDeployPipeline(); break;
    case 'ls':
    case 'ls -la':
    case 'ls -l':   addToHistory(document.getElementById('tpl-ls').innerHTML); break;
    case 'ls projects':
    case 'ls projects/':
    case 'ls -la projects':
    case 'ls -l projects': lsProjects(); break;
    case 'resume':
      addToHistory(`<div style="color:var(--fg)">Opening resume... <a href="./documents/resume.pdf" target="_blank" style="color:var(--blue)">[Download PDF]</a></div>`);
      window.open('./documents/resume.pdf', '_blank');
      break;
    case 'm': toggleMatrix(); break;
    case 'linkedin':
      addToHistory(`<div style="color:var(--fg);">Opening LinkedIn profile... <a href="https://www.linkedin.com/in/rishantshukla/" target="_blank" style="color:var(--blue)">[linkedin.com/in/rishantshukla]</a></div>`);
      window.open('https://www.linkedin.com/in/rishantshukla/', '_blank');
      break;
    case 'github':
      addToHistory(`<div style="color:var(--fg);">Opening GitHub profile... <a href="https://github.com/rishantshukla" target="_blank" style="color:var(--blue)">[github.com/rishantshukla]</a></div>`);
      window.open('https://github.com/rishantshukla', '_blank');
      break;
    case 'joke': {
      const jokes = [
        "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
        "How many DevOps engineers does it take to change a light bulb? None, that's a hardware problem. 💡",
        "There are 10 types of people: those who understand binary and those who don't. 😄",
        "Why did the developer go broke? Because he used up all his cache! 💸",
        "I would tell you a UDP joke, but you might not get it. 📡",
        "A SQL query walks into a bar, walks up to two tables and asks: 'Can I JOIN you?' 🍺",
        "Why do Java developers wear glasses? Because they can't C#! 👓",
        "Docker containers are like apartments: everyone has their own space but shares the building. 🏢",
        "Kubernetes is Greek for 'Why is my pod crashing?' ☸️",
        "There's no place like 127.0.0.1 🏠",
        "Why do programmers always mix up Halloween and Christmas? Because Oct 31 == Dec 25! 🎃🎄",
        "A programmer's wife tells him: 'Go to the store and buy a loaf of bread. If they have eggs, buy a dozen.' He returns with 12 loaves of bread. 🍞",
        "How do you comfort a JavaScript bug? You console it! 🐞",
        "Why did the DevOps engineer quit? Too many issues to resolve! 🎫",
        "What's a programmer's favorite hangout place? Foo Bar! 🍻",
        "Why do programmers hate nature? It has too many bugs! 🦟",
        "Git commit -m 'Fixed bug' (Narrator: The bug was not fixed) 🐛",
        "Why was the JavaScript developer sad? Because he didn't Node how to Express himself! 😢",
        "What do you call a programmer from Finland? Nerdic! 🇫🇮",
        "Why do Python programmers prefer snakes? Because they're good at debugging! 🐍"
      ];
      const joke = jokes[Math.floor(Math.random() * jokes.length)];
      addToHistory(`<div style="color:var(--yellow);">${joke}</div>`);
      break;
    }
    case 'quote': {
      const quotes = [
        '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler',
        '"First, solve the problem. Then, write the code." — John Johnson',
        '"Code is like humor. When you have to explain it, it\'s bad." — Cory House',
        '"Make it work, make it right, make it fast." — Kent Beck',
        '"The best error message is the one that never shows up." — Thomas Fuchs',
        '"Simplicity is the soul of efficiency." — Austin Freeman',
        '"Infrastructure as Code: Because clicking buttons is so 2010." — DevOps Wisdom',
        '"Automate everything you can, so you can focus on what you can\'t." — Unknown',
        '"In DevOps, we trust automation, not luck." — DevOps Proverb',
        '"The only way to go fast is to go well." — Robert C. Martin',
        '"Talk is cheap. Show me the code." — Linus Torvalds',
        '"Programs must be written for people to read, and only incidentally for machines to execute." — Harold Abelson',
        '"Truth can only be found in one place: the code." — Robert C. Martin',
        '"Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away." — Antoine de Saint-Exupéry',
        '"Before software can be reusable it first has to be usable." — Ralph Johnson',
        '"Measuring programming progress by lines of code is like measuring aircraft building progress by weight." — Bill Gates',
        '"Walking on water and developing software from a specification are easy if both are frozen." — Edward V. Berard',
        '"It\'s not a bug – it\'s an undocumented feature." — Anonymous',
        '"The best thing about a boolean is even if you are wrong, you are only off by a bit." — Anonymous',
        '"Without requirements or design, programming is the art of adding bugs to an empty text file." — Louis Srygley'
      ];
      const quote = quotes[Math.floor(Math.random() * quotes.length)];
      addToHistory(`<div style="color:var(--blue);font-style:italic;">${quote}</div>`);
      break;
    }
    case 'hack': {
      const targets = ['192.168.1', '10.0.0', '172.16.0', '203.0.113'];
      const passwords = [
        ['admin', 'password123', 'qwerty'],
        ['root', '123456', 'letmein'],
        ['admin123', 'welcome', 'monkey'],
        ['password', 'abc123', 'iloveyou'],
        ['admin', 'password1', '12345678']
      ];
      const vulnerabilities = ['CVE-2024', 'CVE-2023', 'CVE-2025'];
      const databases = ['user_data', 'credentials', 'financial_records', 'customer_info', 'secret_files'];
      const endings = [
        'Just kidding! This is a portfolio, not Mr. Robot 😄🎭',
        'Gotcha! No actual hacking here, just DevOps magic ✨',
        'Psych! This is just a fun terminal simulation 🎪',
        'Surprise! You\'ve been bamboozled 🤡',
        'Plot twist: This is just JavaScript 😂'
      ];
      
      const targetNet = targets[Math.floor(Math.random() * targets.length)];
      const targetIP = Math.floor(Math.random()*254+1);
      const pwdSet = passwords[Math.floor(Math.random() * passwords.length)];
      const cve = vulnerabilities[Math.floor(Math.random() * vulnerabilities.length)];
      const cveNum = Math.floor(Math.random()*9999);
      const db = databases[Math.floor(Math.random() * databases.length)];
      const ending = endings[Math.floor(Math.random() * endings.length)];
      
      addToHistory(`<div style="color:var(--green);">Initializing hacking sequence...</div>`);
      setTimeout(() => {
        addToHistory(`<div style="color:var(--blue);">Scanning network... [${targetNet}.0/24]</div>`);
      }, 1000);
      setTimeout(() => {
        addToHistory(`<div style="color:var(--blue);">Found target: ${targetNet}.${targetIP}</div>`);
      }, 2000);
      setTimeout(() => {
        addToHistory(`<div style="color:var(--yellow);">Attempting SSH brute force...</div>`);
      }, 3000);
      setTimeout(() => {
        addToHistory(`<div style="color:var(--fg-dim);">Trying password: ********... ❌</div>`);
      }, 4000);
      setTimeout(() => {
        addToHistory(`<div style="color:var(--fg-dim);">Trying password: ***********... ❌</div>`);
      }, 5000);
      setTimeout(() => {
        addToHistory(`<div style="color:var(--fg-dim);">Trying password: ******... ❌</div>`);
      }, 6000);
      setTimeout(() => {
        addToHistory(`<div style="color:var(--green);">Exploiting vulnerability ${cve}-${cveNum}...</div>`);
      }, 7000);
      setTimeout(() => {
        addToHistory(`<div style="color:var(--green);">Bypassing firewall... [████████████████████] 100%</div>`);
      }, 8000);
      setTimeout(() => {
        addToHistory(`<div style="color:var(--green);">Escalating privileges... root access obtained! ✓</div>`);
      }, 9000);
      setTimeout(() => {
        addToHistory(`<div style="color:var(--green);">Downloading ${db}... [████████████████████] 100%</div>`);
      }, 10000);
      setTimeout(() => {
        addToHistory(`<div style="color:var(--purple);font-weight:bold;">ACCESS GRANTED - SYSTEM COMPROMISED</div>`);
      }, 11000);
      setTimeout(() => {
        addToHistory(`<div style="color:var(--red);font-size:16px;margin-top:10px;">${ending}</div>`);
        scrollToBottom();
      }, 12000);
      break;
    }
    case 'fortune': {
      const fortunes = [
        "You will write bug-free code today... said no developer ever. 🐛",
        "A merge conflict approaches. Prepare yourself. ⚔️",
        "Your next deployment will go smoothly. (Check your tests first!) ✅",
        "The cloud is just someone else's computer. ☁️",
        "In the future, you will understand your own code. Maybe. 🤔",
        "Your Docker container will start on the first try. (Unlikely) 🐳",
        "A great opportunity awaits... after you fix this bug. 🔧",
        "Your CI/CD pipeline will be green today. Probably. 🟢",
        "You will find the missing semicolon before lunch. 🍕",
        "The production server is stable. For now. 🤞",
        "Your code review will have zero comments. (Dream on!) 💭",
        "Kubernetes will make sense to you... eventually. ☸️",
        "Your infrastructure as code will work as intended. Fingers crossed! 🤞",
        "The logs will reveal the answer you seek. grep wisely. 🔍",
        "Your backup strategy will save you one day. Test it! 💾",
        "A wild segmentation fault appears! Better save your work. 💥",
        "Today's commits will be meaningful and well-documented. (Sure they will) 📝",
        "Your regex will work on the first try. (In an alternate universe) 🌌",
        "The database migration will complete without errors. (Narrator: It won't) 🗄️",
        "Your estimates will be accurate this sprint. (Haha, good one!) 📊",
        "Stack Overflow has the answer you seek. It always does. 📚",
        "Your code will compile on the first attempt. (Keep dreaming) ⚙️",
        "A production incident looms on the horizon. Check your monitoring! 🚨",
        "Your technical debt will be paid off... someday. 💳",
        "The legacy code you're about to touch was written by someone who no longer works here. Good luck! 👻"
      ];
      const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      addToHistory(`<div style="color:var(--purple);">
        <div style="border:1px solid var(--fg-dim);padding:12px;border-radius:6px;margin:8px 0;">
          ${fortune}
        </div>
      </div>`);
      break;
    }
    case 'coffee': {
      const coffeeTypes = ['Espresso', 'Cappuccino', 'Latte', 'Americano', 'Mocha', 'Cold Brew'];
      const caffeineLevel = ['Maximum', 'Extreme', 'Dangerous', 'Legendary', 'Over 9000!', 'Infinite'];
      const messages = [
        'Brewing virtual coffee... Done!',
        'Preparing your caffeine boost... Ready!',
        'Extracting maximum caffeine... Complete!',
        'Compiling coffee beans... Success!',
        'Deploying hot beverage... Served!',
        'Running coffee.sh... Executed!'
      ];
      
      const coffee = coffeeTypes[Math.floor(Math.random() * coffeeTypes.length)];
      const level = caffeineLevel[Math.floor(Math.random() * caffeineLevel.length)];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      
      addToHistory(`<div style="color:var(--yellow);">
        <pre style="color:var(--yellow);line-height:1.2;margin:10px 0;">
    ( (
     ) )
  ........
  |      |]
  \\      /
   \`----'
        </pre>
        <div style="color:var(--fg);">☕ ${msg} <span style="color:var(--fg-dim);">(${coffee} - Caffeine level: ${level})</span></div>
      </div>`);
      break;
    }
    case 'uptime': {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
      const hrs  = Math.floor(elapsed / 3600);
      const mins = Math.floor((elapsed % 3600) / 60);
      const secs = elapsed % 60;
      const load = `${(Math.random()*0.1+0.01).toFixed(2)}, ${(Math.random()*0.05+0.01).toFixed(2)}, ${(Math.random()*0.03).toFixed(2)}`;
      addToHistory(`<div style="color:var(--fg)"> ${new Date().toLocaleTimeString()} up ${hrs}h ${mins}m ${secs}s, 1 user, load average: ${load}</div>`);
      break;
    }
    case 'date':
      addToHistory(`<div style="color:var(--fg);">${new Date().toString()}</div>`);
      break;
    case 'pwd':
      addToHistory(`<div style="color:var(--fg);">/home/rishant/portfolio</div>`);
      break;
    case 'hostname':
      addToHistory(`<div style="color:var(--fg);">rishant.vercel.app</div>`);
      break;
    case 'history': {
      const lines = commandHistory.map((c, i) =>
        `<div style="color:var(--fg);"><span style="color:var(--fg-dim);display:inline-block;width:30px;text-align:right;margin-right:10px;">${i+1}</span>${escapeHTML(c)}</div>`
      ).join('');
      addToHistory(lines || `<div style="color:var(--fg-dim);">No commands in history.</div>`);
      break;
    }
    case 'cat readme':
    case 'cat readme.md':
    case 'cat_readme':
      addToHistory(`<div style="color:var(--fg);">
        <span style="color:var(--yellow);font-weight:bold;font-size:15px;">📄 README.md</span>
        <hr style="border:0;border-bottom:1px solid var(--border-soft);margin:8px 0;">
        <span style="color:var(--blue);font-weight:bold;">Rishant Shukla</span> — DevOps Engineer @ ResourceDekho IT Services<br><br>
        DevOps Engineer with proven experience in building CI/CD pipelines, automating infrastructure,<br>
        and deploying applications on cloud and containerized platforms.<br><br>
        Skilled in Linux, Kubernetes, Docker, and AWS to deliver secure, scalable, and reliable solutions.<br><br>
        <span style="color:var(--fg-dim);">// Built with ❤️ and too much coffee.</span>
      </div>`);
      break;
    case '': break;
    default: {
      const safeCmd = escapeHTML(cmd);
      if (cmd === 'tab' || cmd.startsWith('tab ')) {
        runTab(cmd.slice(3));
      } else if (cmd === 'tour') {
        runTour();
      } else if (cmd === 'share' || cmd.startsWith('share ')) {
        runShare(cmd.slice(5));
      } else if (cmd === 'split' || cmd.startsWith('split ')) {
        runSplit(cmd.slice(5));
      } else if (cmd === 'vcard' || cmd === 'vcf' || cmd === 'contact --save') {
        runVCard();
      } else if (cmd.includes('|')) {
        runPipeline(cmd);
      } else if (cmd === 'ask' || cmd.startsWith('ask ')) {
        runAsk(cmd.slice(3));
      } else if (cmd === 'grep' || cmd.startsWith('grep ')) {
        runGrep(cmd.slice(4));
      } else if (cmd === 'cd' || cmd.startsWith('cd ')) {
        runCd(cmd.slice(2));
      } else if (cmd === 'theme' || cmd.startsWith('theme ')) {
        const want = cmd.slice(5).trim();
        if (!want) {
          const list = THEMES.map(t => t === currentTheme()
            ? `<span class="clickable-cmd" data-cmd="theme ${t}" style="color:var(--green);">● ${t}</span> <span style="color:var(--fg-dim);">(current)</span>`
            : `<span class="clickable-cmd" data-cmd="theme ${t}">○ ${t}</span>`).join('<br>');
          addToHistory(`<div style="color:var(--fg);">Available themes — click one or type <span class="clickable-cmd" data-cmd="theme dracula">theme &lt;name&gt;</span>:<br><br>${list}</div>`);
        } else if (THEMES.includes(want)) {
          applyTheme(want);
          addToHistory(`<div style="color:var(--green);">Theme set to <b>${escapeHTML(want)}</b>. Saved for next visit.</div>`);
        } else {
          addToHistory(`<div style="color:var(--red);">Unknown theme: ${escapeHTML(want)}. Try <span class="clickable-cmd" data-cmd="theme">theme</span> to list them.</div>`);
        }
      } else if (cmd === 'sudo' || cmd.startsWith('sudo ')) {
        const target = cmd.slice(5).trim();
        const extra = /^(su|-i|-s|bash|sh)$/.test(target)
          ? `<div style="color:var(--fg-dim);margin-top:6px;">Nice try. 🙃</div>` : '';
        addToHistory(
          `<div style="color:var(--red);">[sudo] password for guest: <span style="color:var(--fg-dim);">********</span></div>` +
          `<div style="color:var(--red);margin-top:4px;">guest is not in the sudoers file. This incident will be reported.</div>` + extra
        );
      } else if (cmd.startsWith('ping ')) {
        runPingSimulation(cmd.split(' ')[1]);
      } else if (cmd.startsWith('echo ')) {
        addToHistory(`<div style="color:var(--fg);">${escapeHTML(cmd.substring(5))}</div>`);
      } else if (cmd.startsWith('cat ')) {
        const file = cmd.slice(4).trim().replace(/^\.\//, '');
        const bare = file.replace(/\/+$/, '');
        const study = resolveCaseStudy(file);
        if (study) {
          addToHistory(document.getElementById(CASE_STUDIES[study].tpl).innerHTML);
        } else if (bare === 'projects') {
          addToHistory(`<div style="color:var(--red);">cat: projects: Is a directory</div>` +
            `<div style="color:var(--fg-dim);font-size:12px;margin-top:4px;">// try <span class="clickable-cmd" data-cmd="ls projects">ls projects</span></div>`);
        } else if (file === 'contact.json') {
          processCommand('contact');
        } else if (file === 'resume.pdf') {
          addToHistory(
            `<div style="color:var(--yellow);">cat: resume.pdf: binary file</div>` +
            `<div style="color:var(--fg-dim);font-size:12px;margin-top:4px;">` +
            `// try <span class="clickable-cmd" data-cmd="resume">resume</span> to open it</div>`
          );
        } else if (DIRECTORIES[bare]) {
          addToHistory(`<div style="color:var(--red);">cat: ${escapeHTML(file)}: Is a directory</div>`);
        } else {
          addToHistory(`<div style="color:var(--red);">cat: ${escapeHTML(file)}: No such file or directory</div>`);
        }
      } else if (cmd.startsWith('docker ') || cmd.startsWith('kubectl ') || cmd.startsWith('terraform ')) {
        addToHistory(`<div style="color:var(--red);">Error: Cannot execute '${escapeHTML(cmd.split(' ')[0])}'. Environment not configured.</div>`);
      } else if (cmd === 'ping') {
        addToHistory(`<div style="color:var(--red);">Usage: ping &lt;hostname&gt;</div>`);
      } else {
        // Edit distance on a multi-word string produces nonsense ("cd ab" once
        // suggested "clear"), and anything valid with a space is handled above.
        // A plain question is unambiguous — route it to ask rather than
        // answering "command not found". Mistyped commands ("foo bar baz")
        // still get the authentic shell reply.
        if (/\?$/.test(cmd) || /^(what|who|where|when|why|how|does|do|is|are|can|has|have|did|will|would|should|tell)\b/.test(cmd)) {
          runAsk(cmd);
          return;
        }
        const suggestion = cmd.includes(' ') ? null : findClosestCommand(cmd);
        if (suggestion) {
          addToHistory(`<div style="color:var(--red);">Command not found: ${safeCmd}. Did you mean <span class="clickable-cmd">${suggestion}</span>?</div>`);
        } else {
          addToHistory(`<div style="color:var(--red);">Command not found: ${safeCmd}. Type <span class="clickable-cmd">help</span> for available commands.</div>`);
        }
      }
    }
  }
}

// ─── PING SIMULATION ──────────────────────────────────────────────────────────
async function runPingSimulation(host) {
  const safeHost = escapeHTML(host);
  const ip = `${Math.floor(Math.random()*223+1)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
  addToHistory(`<div style="color:var(--fg);">PING ${safeHost} (${ip}): 56 data bytes</div>`);
  for (let i = 0; i < 4; i++) {
    await new Promise(r => setTimeout(r, 700 + Math.random()*400));
    const ttl  = Math.floor(Math.random()*20+48);
    const time = (Math.random()*30+5).toFixed(1);
    addToHistory(`<div style="color:var(--fg);">64 bytes from ${safeHost}: icmp_seq=${i} ttl=${ttl} time=${time} ms</div>`);
    scrollToBottom();
  }
  const avg = (Math.random()*15+10).toFixed(1);
  addToHistory(`<div style="color:var(--fg);"><br>--- ${safeHost} ping statistics ---<br>4 packets transmitted, 4 received, <span style="color:var(--green);">0% packet loss</span><br>round-trip min/avg/max = ${(avg-5).toFixed(1)}/${avg}/${(parseFloat(avg)+8).toFixed(1)} ms</div>`);
  scrollToBottom();
}

// ─── CLICK-TO-RUN COMMANDS ────────────────────────────────────────────────────
async function runCommandClick(cmd, source = 'link') {
  if (isBooting) return;
  trackCommand(cmd, source);
  const div = document.createElement('div');
  div.className = 'prompt-line';
  div.innerHTML = `<span class="user">rishant</span><span class="at">@</span><span class="host">devops</span><span class="arrow">➜</span> <span class="cmd"></span>`;
  history.appendChild(div);
  await typeText(div.querySelector('.cmd'), cmd);
  await new Promise(r => setTimeout(r, 150));
  div.remove();
  // A clicked command ran, so it belongs in history exactly like a typed one.
  // Without this, `history`, `!!`, the up-arrow and the palette's Recent group
  // are all empty for anyone who navigates by clicking — which is most people.
  // The tour is the one exception: five entries per run would bury whatever
  // the visitor actually did themselves.
  if (cmd && source !== 'tour') {
    commandHistory.push(cmd);
    saveHistory();
    historyIndex = -1;
  }
  addCommandToHistory(cmd);
  processCommand(cmd);
  scrollToBottom();
}

// Enter / Space on a focused clickable command, matching native button behaviour
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest?.('.clickable-cmd');
  if (!el) return;
  e.preventDefault();
  runCommandClick(el.dataset.cmd || el.textContent.trim());
});

document.addEventListener('click', e => {
  // closest(), not classList.contains(): e.target is the deepest node clicked,
  // so on a project card it is the title/description span, not the card itself.
  const clickable = e.target.closest?.('.clickable-cmd');
  if (clickable) {
    runCommandClick(clickable.dataset.cmd || clickable.textContent.trim());
    return;
  }
  // The ask panel owns its own input; refocusing the terminal would fight it.
  if (e.target.closest?.('#chat-panel, #chat-fab')) return;
  // Don't steal focus from form elements or their labels/buttons
  const tag = e.target.tagName;
  if (['INPUT','TEXTAREA','BUTTON','A','LABEL','SELECT'].includes(tag)) return;
  // Don't steal focus if the click is inside a form
  if (e.target.closest('form')) return;
  if (window.getSelection().toString().length > 0) return;
  cmdInput.focus();
});

// ─── MATRIX EFFECT ────────────────────────────────────────────────────────────
const canvas = document.getElementById('matrix-canvas');
const ctx    = canvas.getContext('2d');
let matrixInterval;
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
const chars   = '0123456789ABCDEF';
const fontSize = 16;
let drops      = Array(Math.floor(canvas.width / fontSize)).fill(1);

// Without this the canvas keeps its load-time dimensions, so the rain ends up
// stretched and clipped after a resize or an orientation change.
window.addEventListener('resize', () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  drops = Array(Math.floor(canvas.width / fontSize)).fill(1);
});

function drawMatrix() {
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#00ff41';
  ctx.font = fontSize + 'px monospace';
  for (let i = 0; i < drops.length; i++) {
    const text = chars[Math.floor(Math.random()*chars.length)];
    ctx.fillText(text, i*fontSize, drops[i]*fontSize);
    if (drops[i]*fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }
}

function toggleMatrix() {
  // The canvas is hidden by the reduced-motion stylesheet, so running the draw
  // loop would burn CPU on something nobody can see. Say so instead.
  if (prefersReducedMotion() && !document.body.classList.contains('matrix-mode')) {
    addToHistory("<div style='color:var(--yellow)'>Matrix mode is disabled because your system requests reduced motion.</div>");
    return;
  }
  document.body.classList.toggle('matrix-mode');
  if (document.body.classList.contains('matrix-mode')) {
    drawMatrix();
    matrixInterval = setInterval(drawMatrix, 30);
    addToHistory("<div style='color:#0F0'>Entering the Matrix... (type 'm' again to exit)</div>");
  } else {
    clearInterval(matrixInterval);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    addToHistory("<div style='color:var(--fg)'>Matrix mode deactivated.</div>");
  }
}

document.addEventListener('keydown', e => {
  if (isBooting) return;
  const tag = document.activeElement.tagName.toUpperCase();
  if ((tag === 'INPUT' || tag === 'TEXTAREA') && document.activeElement !== cmdInput) return;
  if (!['INPUT','TEXTAREA'].includes(tag) && e.key.toLowerCase() === 'm') toggleMatrix();
});

// ─── CUSTOM CURSOR ────────────────────────────────────────────────────────────
const cursorDot     = document.getElementById('cursor-dot');
const cursorOutline = document.getElementById('cursor-outline');
window.addEventListener('mousemove', e => {
  cursorDot.style.left = `${e.clientX}px`;
  cursorDot.style.top  = `${e.clientY}px`;
  cursorOutline.animate({ left: `${e.clientX}px`, top: `${e.clientY}px` }, { duration: 80, fill: 'forwards' });
});

// ─── CLOCK ────────────────────────────────────────────────────────────────────
setInterval(() => {
  const now = new Date();
  document.getElementById('clock').textContent =
    `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}, 1000);

// ─── PARTICLES ────────────────────────────────────────────────────────────────
// Guarded: this is decorative, and it used to be a bare top-level call. If the
// CDN was blocked or slow, the ReferenceError killed every statement below it —
// including the boot sequence — and the visitor got an empty screen.
if (typeof particlesJS === 'function' && !prefersReducedMotion()) {
  particlesJS('particles-js', {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: '#7dcfff' },
      shape: { type: 'circle' },
      opacity: { value: 0.35, random: true, anim: { enable: false } },
      size: { value: 2, random: true },
      line_linked: {
        enable: true,
        distance: 150,
        color: '#7dcfff',
        opacity: 0.2,
        width: 0.8
      },
      move: {
        enable: true,
        speed: 1.2,
        direction: 'none',
        random: true,
        straight: false,
        out_mode: 'out',
        bounce: false
      }
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: { enable: true, mode: 'grab' },
        onclick: { enable: true, mode: 'push' },
        resize: true
      },
      modes: {
        grab: { distance: 180, line_linked: { opacity: 0.9 } },
        push: { particles_nb: 3 }
      }
    },
    retina_detect: true
  });
}

// ─── EMAIL (EmailJS) ──────────────────────────────────────────────────────────
function sendEmail(e) {
  e.preventDefault();
  const logs = e.target.parentNode.querySelector('#email-logs');
  logs.innerHTML = "<div style='color:var(--yellow)'>Sending via SMTP...</div>";
  
  // Initialize EmailJS with your Public Key
  emailjs.init('Gj5HXeR87daFYYEqN');
  
  // Send the form
  emailjs.sendForm('service_204vccd', 'template_1bpb2h4', e.target)
    .then(() => { 
      logs.innerHTML = "<div style='color:var(--green)'>[200 OK] Message sent successfully!</div>"; 
      e.target.reset(); 
    }, (err) => { 
      logs.innerHTML = `<div style='color:var(--red)'>[ERROR] ${err.text || 'Failed to send message'}</div>`; 
    });
}

// ─── COPY TO CLIPBOARD ────────────────────────────────────────────────────────
// Selecting text by hand is awkward here: the native cursor is hidden and a
// click anywhere refocuses the command input. Delegated, because the contact
// block is injected into #history rather than present at load.
async function copyValue(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // clipboard API needs a secure context and permission; fall back
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

document.addEventListener('click', async e => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  // Remember the original label once; the icons live in the markup, so only the
  // class and the label change here.
  const label = btn._label || (btn._label = btn.getAttribute('aria-label'));
  const ok = await copyValue(btn.dataset.copy);
  btn.classList.toggle('copied', ok);
  btn.classList.toggle('failed', !ok);
  // announce to screen readers, which would otherwise get no feedback at all
  btn.setAttribute('aria-label', ok ? 'Copied to clipboard' : 'Copy failed');
  clearTimeout(btn._t);
  btn._t = setTimeout(() => {
    btn.classList.remove('copied', 'failed');
    btn.setAttribute('aria-label', label);
  }, 1600);
});

// ─── AVAILABILITY BADGE ───────────────────────────────────────────────────────
const availabilityBtn = document.getElementById('availability');
availabilityBtn.addEventListener('click', () => {
  runCommandClick(availabilityBtn.dataset.cmd, 'badge');
});

// ─── MOBILE NAV (hamburger) ─────────────────────────────────────────────────
const navHamburger = document.getElementById('nav-hamburger');
const navLinksEl    = document.getElementById('nav-links');

function closeMobileNav() {
  navLinksEl.classList.remove('mobile-open');
  navHamburger.setAttribute('aria-expanded', 'false');
}

navHamburger.addEventListener('click', e => {
  e.stopPropagation();
  const isOpen = navLinksEl.classList.toggle('mobile-open');
  navHamburger.setAttribute('aria-expanded', String(isOpen));
});

navLinksEl.addEventListener('click', e => {
  const btn = e.target.closest('button[data-cmd]');
  if (!btn) return;
  closeMobileNav();
  runCommandClick(btn.dataset.cmd, 'nav');
});

document.addEventListener('click', e => {
  if (navLinksEl.classList.contains('mobile-open') &&
      !navLinksEl.contains(e.target) &&
      e.target !== navHamburger) {
    closeMobileNav();
  }
});

// Someone pastes a different #section into the address bar, or uses back/forward
// across hashes. replaceState does not fire this, so there is no feedback loop.
window.addEventListener('hashchange', () => {
  if (isBooting) return;
  const cmd = hashCommand();
  if (cmd) runCommandClick(cmd, 'hash');
});

// ─── BOOT ─────────────────────────────────────────────────────────────────────
window.onload = runIntro;

// ─── ASK PANEL ────────────────────────────────────────────────────────────────
// The corner launcher. Same engine as the `ask` command — it only swaps where
// the answer is rendered — so there is one retrieval path to reason about and
// one place to fix when an answer is wrong.
const chatFab    = document.getElementById('chat-fab');
const chatPanel  = document.getElementById('chat-panel');
const chatLog    = document.getElementById('chat-log');
const chatForm   = document.getElementById('chat-form');
const chatInput  = document.getElementById('chat-input');
const chatCloseB = document.getElementById('chat-close');

if (chatFab && chatPanel) {
  const chatAppend = (cls, html) => {
    const el = document.createElement('div');
    el.className = 'chat-msg ' + cls;
    el.innerHTML = html;
    makeClickableCmdsFocusable(el);   // the answer's source links are reachable by keyboard
    fillExperience(el);               // "2+ years" is computed, not written
    chatLog.appendChild(el);
    chatLog.scrollTop = chatLog.scrollHeight;
    return el;
  };

  let chatGreeted = false;
  function chatGreet() {
    if (chatGreeted) return;
    chatGreeted = true;
    chatAppend('chat-bot',
      `<div class="ask-line">Ask about Rishant's work and I'll quote back what's written on this page.</div>` +
      `<div class="ask-note">It searches the page itself, so it can't make anything up.</div>` +
      ASK_EXAMPLES.map(q =>
        `<button type="button" class="chat-chip">${escapeHTML(q)}</button>`).join(''));
  }

  const chatAsked = new Set();

  function chatAsk(question) {
    const q = question.trim();
    if (!q) return;
    chatAsked.add(q.toLowerCase());
    const mine = chatAppend('chat-me', escapeHTML(q));
    askInto(html => {
      const next = ASK_SUGGESTIONS.filter(x => !chatAsked.has(x.toLowerCase())).slice(0, 2);
      const more = next.length
        ? `<div class="chat-more"><div class="chat-more-label">Try next</div>` +
          next.map(x => `<button type="button" class="chat-chip">${escapeHTML(x)}</button>`).join('') +
          `</div>`
        : '';
      chatAppend('chat-bot', html + more);
      // Answers lead with the verdict, so land on the question and read down.
      // Scrolling to the bottom puts the one line that matters off-screen.
      chatLog.scrollTop = Math.min(mine.offsetTop - 8, chatLog.scrollHeight);
    }, () => runAsk(q));
    trackCommand('ask', 'panel');
  }

  const chatIsOpen = () => !chatPanel.classList.contains('chat-hidden');

  function chatOpen() {
    chatPanel.classList.remove('chat-hidden');
    chatFab.setAttribute('aria-expanded', 'true');
    chatFab.setAttribute('aria-label', 'Close the ask panel');
    chatGreet();
    setTimeout(() => chatInput.focus(), 60);
  }

  function chatShut(returnFocus = true) {
    chatPanel.classList.add('chat-hidden');
    chatFab.setAttribute('aria-expanded', 'false');
    chatFab.setAttribute('aria-label', "Ask a question about Rishant's work");
    if (returnFocus) chatFab.focus();
  }

  // ── resizing ──────────────────────────────────────────────────────────────
  // Anchored bottom-right, so it grows up and to the left. Size is kept in
  // custom properties rather than inline width/height so the phone media query
  // can ignore it entirely and go back to filling the screen.
  const CHAT_SIZE_KEY = 'portfolio-ask-size';
  const CHAT_DEFAULT  = { w: 380, h: 520 };
  const CHAT_MIN_W = 300, CHAT_MIN_H = 320;
  let chatSize = { ...CHAT_DEFAULT };

  const chatCanResize = () => window.innerWidth > 600;

  function chatSetSize(w, h) {
    // ceilings match the CSS max-width/max-height so a drag cannot run past
    // what is actually rendered and make the pointer drift off the grip
    const maxW = Math.max(CHAT_MIN_W, window.innerWidth  - 48);
    const maxH = Math.max(CHAT_MIN_H, window.innerHeight - 140);
    chatSize = {
      w: Math.round(Math.min(Math.max(w, CHAT_MIN_W), maxW)),
      h: Math.round(Math.min(Math.max(h, CHAT_MIN_H), maxH)),
    };
    chatPanel.style.setProperty('--chat-w', chatSize.w + 'px');
    chatPanel.style.setProperty('--chat-h', chatSize.h + 'px');
    // wide enough for the evidence source column to sit beside the line again
    chatPanel.classList.toggle('chat-wide', chatSize.w >= 560);
  }

  function chatSaveSize() {
    try { localStorage.setItem(CHAT_SIZE_KEY, JSON.stringify(chatSize)); } catch { /* private mode */ }
  }

  (function chatLoadSize() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(CHAT_SIZE_KEY) || 'null'); } catch { /* private mode */ }
    chatSetSize(saved?.w || CHAT_DEFAULT.w, saved?.h || CHAT_DEFAULT.h);
  })();

  function chatDrag(e, grows) {
    if (!chatCanResize() || e.button) return;
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const { w: startW, h: startH } = chatSize;
    const move = ev => chatSetSize(
      grows.w ? startW + (startX - ev.clientX) : startW,
      grows.h ? startH + (startY - ev.clientY) : startH);
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      document.body.classList.remove('chat-resizing');
      chatSaveSize();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    document.body.classList.add('chat-resizing');
  }

  const rzCorner = chatPanel.querySelector('.chat-rz-tl');
  rzCorner.addEventListener('pointerdown', e => chatDrag(e, { w: true, h: true }));
  chatPanel.querySelector('.chat-rz-l').addEventListener('pointerdown', e => chatDrag(e, { w: true }));
  chatPanel.querySelector('.chat-rz-t').addEventListener('pointerdown', e => chatDrag(e, { h: true }));

  // A drag-only affordance is unusable without a mouse.
  rzCorner.addEventListener('keydown', e => {
    const step = e.shiftKey ? 8 : 24;
    const delta = { ArrowLeft: [step, 0], ArrowRight: [-step, 0],
                    ArrowUp: [0, step],   ArrowDown: [0, -step] }[e.key];
    if (!delta || !chatCanResize()) return;
    e.preventDefault();
    chatSetSize(chatSize.w + delta[0], chatSize.h + delta[1]);
    chatSaveSize();
  });

  rzCorner.addEventListener('dblclick', () => {
    chatSetSize(CHAT_DEFAULT.w, CHAT_DEFAULT.h);
    chatSaveSize();
  });

  // A size stored on a big monitor must not hang off a small window.
  window.addEventListener('resize', () => chatSetSize(chatSize.w, chatSize.h));

  chatFab.addEventListener('click', () => chatIsOpen() ? chatShut() : chatOpen());
  chatCloseB.addEventListener('click', () => chatShut());

  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = chatInput.value;
    chatInput.value = '';
    chatAsk(q);
  });

  chatLog.addEventListener('click', e => {
    const chip = e.target.closest('.chat-chip');
    if (!chip) return;
    chatAsk(chip.textContent);
  });

  // A source link points into the terminal, so get out of its way before the
  // delegated handler types the command — this listener runs first.
  chatPanel.addEventListener('click', e => {
    if (e.target.closest('.clickable-cmd')) chatShut(false);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && chatIsOpen()) { e.preventDefault(); chatShut(); return; }
    // Ctrl/Cmd+K belongs to the command palette now; the panel has the
    // launcher, and "Ask …" is an entry in the palette itself.
  });
}

// ─── WINDOW CHROME ────────────────────────────────────────────────────────────
// The three dots were decorative. Green maximises, yellow minimises to the title
// bar, red does the only honest thing a portfolio can do when asked to close.
(function windowChrome() {
  const win = document.getElementById('terminal-window');
  const bar = document.getElementById('title-bar');
  if (!win || !bar) return;

  let hint;
  const clearHint = () => { hint?.remove(); hint = null; };

  function showHint(text) {
    clearHint();
    hint = document.createElement('div');
    hint.className = 'win-restore-hint';
    hint.textContent = text;
    document.body.appendChild(hint);
  }

  function restore() {
    win.classList.remove('win-max', 'win-min');
    clearHint();
    setLabels();
  }

  function setLabels() {
    const max = win.classList.contains('win-max');
    const min = win.classList.contains('win-min');
    bar.querySelector('[data-win="maximise"]')?.setAttribute('aria-label',
      max ? 'Restore the window' : 'Maximise the window');
    bar.querySelector('[data-win="minimise"]')?.setAttribute('aria-label',
      min ? 'Restore the window' : 'Minimise the window');
  }

  bar.addEventListener('click', e => {
    const btn = e.target.closest('[data-win]');
    if (!btn) return;
    const action = btn.dataset.win;

    if (action === 'maximise') {
      win.classList.remove('win-min');
      win.classList.toggle('win-max');
      clearHint();
    } else if (action === 'minimise') {
      win.classList.remove('win-max');
      const min = win.classList.toggle('win-min');
      if (min) showHint('Minimised — click the title bar to restore');
      else clearHint();
    } else if (action === 'close') {
      addToHistory(
        `<div style="color:var(--red);">Connection to rishant@devops closed by remote host.</div>` +
        `<div style="color:var(--fg-dim);margin-top:6px;">… just kidding. ` +
        `This one has been running for ${careerExperience()} and is not going down today.</div>` +
        `<div style="color:var(--fg-dim);font-size:12px;margin-top:8px;">// if you really want to leave, ` +
        `<span class="clickable-cmd" data-cmd="contact">contact</span> first.</div>`);
      win.animate(
        [{ transform: 'translate(-50%,-50%) scale(1)' },
         { transform: 'translate(-50%,-50%) scale(0.985)' },
         { transform: 'translate(-50%,-50%) scale(1)' }],
        { duration: 260, easing: 'cubic-bezier(0.22,1,0.36,1)' });
    }
    setLabels();
    if (!win.classList.contains('win-min')) cmdInput?.focus();
  });

  // A minimised window is just a title bar, so clicking it anywhere restores.
  bar.addEventListener('click', e => {
    if (win.classList.contains('win-min') && !e.target.closest('[data-win]')) restore();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && (win.classList.contains('win-max') || win.classList.contains('win-min'))) {
      restore();
    }
  });
})();

// ─── COMMAND PALETTE ──────────────────────────────────────────────────────────
// Ctrl/Cmd+K. Fuzzy search over everything the terminal can do, grouped, with
// the last few commands offered first when the query is empty.
(function palette() {
  const root  = document.getElementById('palette');
  const input = document.getElementById('pal-input');
  const list  = document.getElementById('pal-list');
  if (!root || !input || !list) return;

  const ITEMS = [
    ['Section', '👤', 'About',            'whoami'],
    ['Section', '💼', 'Experience',       'experience'],
    ['Section', '🛠', 'Skills',           'skills'],
    ['Section', '📦', 'Projects',         'projects'],
    ['Section', '🏅', 'Certifications',   'certs'],
    ['Section', '🎓', 'Education',        'education'],
    ['Section', '🟢', 'Availability',     'status'],
    ['Section', '✉️', 'Contact',          'contact'],
    ['Section', '📄', 'Résumé (PDF)',     'resume'],
    ['Case study', '📘', 'AWS Multi-Account Org & SSO',  'cat projects/aws-sso.md'],
    ['Case study', '📘', 'ShopfloorGPT on AKS',          'cat projects/shopfloorgpt.md'],
    ['Case study', '📘', 'Kubeadm → Kubespray Migration','cat projects/kubespray.md'],
    ['Terminal', '🔍', 'Search everything',        'grep kubernetes'],
    ['Terminal', '📁', 'List files',               'ls'],
    ['Terminal', '📂', 'List case studies',        'ls projects'],
    ['Terminal', '🔗', 'Pipe a section',           'skills | grep aws'],
    ['Terminal', '💾', 'Save contact card (.vcf)', 'vcard'],
    ['Terminal', '📖', 'Read the README',          'cat readme'],
    ['Terminal', '❓', 'All commands',             'help'],
    ['Terminal', '🧹', 'Clear the terminal',       'clear'],
    ['Link', '🔗', 'GitHub profile',   'github'],
    ['Link', '🔗', 'LinkedIn profile', 'linkedin'],
    ['Fun', '🚀', 'Run the deploy pipeline', 'deploy'],
    ['Fun', '😄', 'Random DevOps joke',      'joke'],
    ['Fun', '💬', 'Tech quote',              'quote'],
    ['Fun', '🟩', 'Matrix mode',             'm'],
    ...THEMES.map(t => ['Theme', '🎨', `Theme — ${t}`, `theme ${t}`]),
  ].map(([group, ico, label, cmd]) => ({ group, ico, label, cmd }));

  // Subsequence match, biased towards word starts, so "ckm" finds
  // "Kubeadm → Kubespray Migration" but an exact prefix still wins.
  function score(hay, needle) {
    const h = hay.toLowerCase(), n = needle.toLowerCase();
    if (!n) return 1;
    const idx = h.indexOf(n);
    if (idx === 0) return 1000;
    if (idx > 0)   return 700 - idx + (/\W/.test(h[idx - 1] || '') ? 60 : 0);
    let i = 0, s = 0, prevEnd = -2;
    const marks = [];
    for (let j = 0; j < h.length && i < n.length; j++) {
      if (h[j] !== n[i]) continue;
      s += (j === prevEnd + 1) ? 14 : 5;
      if (j === 0 || /\W/.test(h[j - 1])) s += 18;
      marks.push(j); prevEnd = j; i++;
    }
    return i === n.length ? s : -1;
  }

  const mark = (text, needle) => {
    const i = text.toLowerCase().indexOf(needle.toLowerCase());
    if (!needle || i < 0) return escapeHTML(text);
    return escapeHTML(text.slice(0, i)) +
           `<span class="pal-hit">${escapeHTML(text.slice(i, i + needle.length))}</span>` +
           escapeHTML(text.slice(i + needle.length));
  };

  let rows = [], cursor = 0;

  function build(q) {
    const query = q.trim();
    let hits;
    if (!query) {
      // the last few things actually run, then everything
      const recent = [...new Set(commandHistory.slice().reverse())].slice(0, 4)
        .map(c => ITEMS.find(it => it.cmd === c)).filter(Boolean)
        .map(it => ({ ...it, group: 'Recent' }));
      const rest = ITEMS.filter(it => !recent.some(r => r.cmd === it.cmd));
      hits = [...recent, ...rest];
    } else {
      hits = ITEMS
        .map(it => ({ it, s: Math.max(score(it.label, query), score(it.cmd, query) - 40) }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map(x => x.it);
    }

    // A question is always a valid thing to do, so offer it rather than
    // showing nothing when the query matches no command.
    if (query && !/^[a-z]+$/i.test(query) || (query && hits.length === 0)) {
      hits = [...hits, { group: 'Ask', ico: '💬', label: `Ask “${query}”`, cmd: `ask ${query}` }];
    }

    rows = hits;
    cursor = 0;
    render(query);
  }

  function render(query) {
    if (!rows.length) {
      list.innerHTML = `<div class="pal-empty">Nothing matches that.</div>`;
      return;
    }
    let html = '', seen = null;
    rows.forEach((it, i) => {
      if (it.group !== seen) { html += `<div class="pal-group">${it.group}</div>`; seen = it.group; }
      html += `<div class="pal-item" role="option" id="pal-opt-${i}" data-i="${i}" ` +
              `aria-selected="${i === cursor}">` +
              `<span class="pal-ico">${it.ico}</span>` +
              `<span class="pal-label">${mark(it.label, query)}</span>` +
              `<span class="pal-sub">${escapeHTML(it.cmd)}</span>` +
              `<span class="pal-run">run ↵</span></div>`;
    });
    list.innerHTML = html;
    input.setAttribute('aria-activedescendant', `pal-opt-${cursor}`);
  }

  function move(step) {
    if (!rows.length) return;
    cursor = (cursor + step + rows.length) % rows.length;
    list.querySelectorAll('.pal-item').forEach(el => {
      const on = +el.dataset.i === cursor;
      el.setAttribute('aria-selected', on);
      if (on) el.scrollIntoView({ block: 'nearest' });
    });
    input.setAttribute('aria-activedescendant', `pal-opt-${cursor}`);
  }

  const isOpen = () => !root.classList.contains('pal-hidden');

  function open() {
    root.classList.remove('pal-hidden');
    input.value = '';
    build('');
    setTimeout(() => input.focus(), 40);
  }

  function close(refocus = true) {
    root.classList.add('pal-hidden');
    if (refocus && !isBooting) cmdInput?.focus();
  }

  function pick(i) {
    const it = rows[i];
    if (!it) return;
    close(false);
    // runCommandClick refuses to run while the boot sequence is still typing,
    // so picking something during those few seconds used to close the palette
    // and silently do nothing. Hold the choice and run it when boot finishes.
    if (isBooting) {
      const wait = setInterval(() => {
        if (isBooting) return;
        clearInterval(wait);
        runCommandClick(it.cmd, 'palette');
      }, 90);
      return;
    }
    runCommandClick(it.cmd, 'palette');
  }

  input.addEventListener('input', () => build(input.value));
  list.addEventListener('click', e => {
    const el = e.target.closest('.pal-item');
    if (el) pick(+el.dataset.i);
  });
  list.addEventListener('mousemove', e => {
    const el = e.target.closest('.pal-item');
    if (el && +el.dataset.i !== cursor) { cursor = +el.dataset.i; render(input.value.trim()); }
  });
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });

  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter')  { e.preventDefault(); pick(cursor); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab')    { e.preventDefault(); move(e.shiftKey ? -1 : 1); }
  });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      isOpen() ? close() : open();
    }
  }, true);

  window.paletteOpen  = open;
  window.paletteClose = close;
  window.paletteIsOpen = isOpen;
})();

// ─── TABS ─────────────────────────────────────────────────────────────────────
// Each tab owns its scrollback; saved command history stays shared, the way a
// shell's histfile is shared between sessions. Ctrl+T and Ctrl+W are the
// browser's own — binding them would close someone's real tab — so switching is
// Alt+number, and creating is the + button or the `tab` command.
const tabBar = document.getElementById('tab-bar');
let tabs = [{ html: '' }];
let activeTab = 0;

// Derived from position, not a counter. A monotonic sequence meant closing the
// second session and opening another gave you "sh-3", and worse, the label was
// a different number from the one Alt+N and `tab <n>` use. The label is now
// always the index you switch to.
const tabTitle = i => (i === 0 ? 'main' : `sh-${i + 1}`);

function renderTabs() {
  if (!tabBar) return;
  tabBar.innerHTML = tabs.map((t, i) =>
    `<button type="button" class="tab" role="tab" data-tab="${i}" ` +
    `aria-selected="${i === activeTab}" ` +
    `aria-label="Session ${tabTitle(i)}${i === activeTab ? ', current' : ''}">` +
    `<span>${tabTitle(i)}</span>` +
    (tabs.length > 1
      ? `<span class="tab-x" data-close="${i}" role="button" aria-label="Close ${tabTitle(i)}">×</span>`
      : '') +
    `</button>`
  ).join('') +
  `<button type="button" id="tab-new" aria-label="New session">+</button>`;
}

function switchTab(i) {
  if (isBooting) return;
  if (i === activeTab || i < 0 || i >= tabs.length) return;
  tabs[activeTab].html = history.innerHTML;
  activeTab = i;
  history.innerHTML = tabs[activeTab].html;
  renderTabs();
  scrollToBottom();
  if (!isBooting) cmdInput?.focus();
}

function newTab() {
  if (isBooting) return;
  tabs[activeTab].html = history.innerHTML;
  tabs.push({ html: '' });
  activeTab = tabs.length - 1;
  history.innerHTML = '';
  renderTabs();
  addToHistory(
    `<div style="color:var(--fg-dim);font-size:12.5px;">New session. Same history, fresh scrollback.</div>` +
    `<div style="color:var(--fg-dim);font-size:12px;margin-top:5px;">// ` +
    `<span class="clickable-cmd" data-cmd="help">help</span>, ` +
    `<span class="clickable-cmd" data-cmd="split skills experience">split</span>, or Alt+1 to go back</div>`);
  if (!isBooting) cmdInput?.focus();
}

function closeTab(i) {
  if (isBooting) return;
  if (tabs.length === 1) { history.innerHTML = ''; tabs[0].html = ''; return; }
  if (i === activeTab) tabs[activeTab].html = history.innerHTML;
  tabs.splice(i, 1);
  if (activeTab > i) activeTab -= 1;
  else if (activeTab === i) activeTab = Math.min(activeTab, tabs.length - 1);
  history.innerHTML = tabs[activeTab].html;
  renderTabs();
  scrollToBottom();
  if (!isBooting) cmdInput?.focus();
}

function runTab(arg) {
  const a = arg.trim();
  if (!a || a === 'new') { newTab(); return; }
  if (a === 'close') { closeTab(activeTab); return; }
  if (a === 'list') {
    addToHistory(tabs.map((t, i) =>
      `<div style="color:var(--fg);">${i === activeTab ? '*' : ' '} ` +
      `<span class="clickable-cmd" data-cmd="tab ${i + 1}">${i + 1}</span>  ${tabTitle(i)}</div>`
    ).join('') + `<div style="color:var(--fg-dim);font-size:12px;margin-top:8px;">// ` +
      `<span class="clickable-cmd" data-cmd="tab new">tab new</span>, ` +
      `<span class="clickable-cmd" data-cmd="tab close">tab close</span>, or Alt+1…9</div>`);
    return;
  }
  const n = parseInt(a, 10);
  if (n >= 1 && n <= tabs.length) { switchTab(n - 1); return; }
  addToHistory(`<div style="color:var(--red);">tab: ${escapeHTML(a)}: no such session</div>` +
    `<div style="color:var(--fg-dim);font-size:12px;margin-top:4px;">// ` +
    `<span class="clickable-cmd" data-cmd="tab list">tab list</span> shows them</div>`);
}

if (tabBar) {
  renderTabs();
  tabBar.addEventListener('click', e => {
    const x = e.target.closest('[data-close]');
    if (x) { e.stopPropagation(); closeTab(+x.dataset.close); return; }
    if (e.target.closest('#tab-new')) { newTab(); return; }
    const t = e.target.closest('[data-tab]');
    if (t) switchTab(+t.dataset.tab);
  });
  document.addEventListener('keydown', e => {
    if (!e.altKey || e.ctrlKey || e.metaKey) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9 && n <= tabs.length) { e.preventDefault(); switchTab(n - 1); }
  });
}
