// ─── CONFIG ───────────────────────────────────────────────────────────────────
const config = { typeSpeed: 12, bootLineDelay: 110 };
let isBooting = true;

const terminalBody = document.getElementById('terminal');
const history      = document.getElementById('history');
const realPrompt   = document.getElementById('real-prompt');
const cmdInput     = document.getElementById('command-input');
const inputDisplay = document.getElementById('input-display');

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function scrollToBottom() { terminalBody.scrollTop = terminalBody.scrollHeight; }

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t]||t));
}

function addToHistory(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.style.marginBottom = '20px';
  div.classList.add('fade-in');
  history.appendChild(div);
  scrollToBottom();
}

function addCommandToHistory(cmd) {
  const div = document.createElement('div');
  div.className = 'prompt-line';
  div.innerHTML = `<span class="user">rishant</span><span class="at">@</span><span class="host">devops</span><span class="arrow">➜</span> <span class="cmd">${escapeHTML(cmd)}</span>`;
  history.appendChild(div);
}

function typeText(element, text) {
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
    `<br><span style='color:#9ece6a'>🚀 Pipeline completed in ${time}.</span>`
  ];
  for (const step of steps) {
    const div = document.createElement('div');
    if (step.includes('[OK]'))   div.style.color = '#9ece6a';
    else if (step.includes('[ERROR]')) div.style.color = '#f7768e';
    else if (step.includes('[INFO]'))  div.style.color = '#7aa2f7';
    else div.style.color = '#c0caf5';
    div.innerHTML = step;
    history.appendChild(div);
    scrollToBottom();
    await new Promise(r => setTimeout(r, 1000));
  }
}

// ─── BOOT SEQUENCE ────────────────────────────────────────────────────────────
async function runIntro() {
  const ip  = await getVisitorIP();
  const now = new Date().toUTCString();

  const bootLines = [
    "Initializing kernel core...",
    "Loading network drivers (eth0)...",
    "Starting container runtime (Docker)...",
    "Connecting to Kubernetes cluster...",
    "Mounting persistent volumes...",
    "Verifying Terraform state locks..."
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

  await new Promise(r => setTimeout(r, 200));
  const sshDiv = document.createElement('div');
  history.appendChild(sshDiv);
  const cLine = document.createElement('div');
  cLine.style.color = '#e0af68'; cLine.style.marginTop = '10px';
  sshDiv.appendChild(cLine);
  await typeText(cLine, 'Connecting to rishant-devops...');
  const aLine = document.createElement('div');
  aLine.style.color = '#e0af68';
  sshDiv.appendChild(aLine);
  await typeText(aLine, 'Authenticating public key "rishant_rsa"...');

  await new Promise(r => setTimeout(r, 400));
  const motdDiv = document.createElement('div');
  motdDiv.className = 'motd-container fade-in';
  motdDiv.innerHTML = `
    <div style="margin-top:15px;">
      Welcome to <strong>DevOps-Portfolio-OS</strong> (GNU/Linux 5.15.0-generic x86_64)<br>
      System information as of <span style="color:#7dcfff;">${now}</span>
    </div>
    <div class="motd-grid">
      <div><span class="motd-key">System load:</span> <span class="motd-val">${(Math.random()*0.15+0.01).toFixed(2)}, ${(Math.random()*0.08+0.01).toFixed(2)}, ${(Math.random()*0.05).toFixed(2)}</span></div>
      <div><span class="motd-key">Memory usage:</span> <span class="motd-val">${Math.floor(Math.random()*8+4)}% of 32GB</span></div>
      <div><span class="motd-key">Processes:</span> <span class="motd-val">${Math.floor(Math.random()*40+110)}</span></div>
      <div><span class="motd-key">IPv4 address:</span> <span class="motd-val">10.0.${Math.floor(Math.random()*3)}.${Math.floor(Math.random()*254+1)}</span></div>
    </div>
    <span style="color:#565f89;">Last login: ${now} from <span style="color:#f7768e;">${ip}</span></span>
    <hr style="border:0;border-bottom:1px solid #292e42;margin:10px 0 20px;">
  `;
  history.appendChild(motdDiv);
  scrollToBottom();

  await new Promise(r => setTimeout(r, 500));
  await typeCommand('about');
  await new Promise(r => setTimeout(r, 200));
  addToHistory(document.getElementById('tpl-neofetch').innerHTML);

  await typeCommand('help');
  await new Promise(r => setTimeout(r, 200));
  addToHistory(document.getElementById('tpl-help').innerHTML);

  realPrompt.classList.remove('hidden');
  cmdInput.focus();
  isBooting = false;
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
  'linkedin','github','joke','quote','fortune','hack','coffee'
];
const commandHistory = [];
let historyIndex = -1;
const sessionStart = Date.now();

cmdInput.addEventListener('input', function() { inputDisplay.textContent = this.value; });

cmdInput.addEventListener('keydown', function(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const partial = this.value.trim().toLowerCase();
    if (partial.length > 0) {
      const match = availableCommands.find(c => c.startsWith(partial) && c !== partial);
      if (match) { this.value = match; inputDisplay.textContent = match; }
    }
    return;
  }
  if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); history.innerHTML = ''; return; }
  if (e.key === 'c' && e.ctrlKey) {
    e.preventDefault();
    if (this.value.length > 0) {
      addCommandToHistory(this.value + '^C');
      addToHistory(`<div style="color:#565f89;">^C</div>`);
      this.value = ''; inputDisplay.textContent = '';
      scrollToBottom();
    }
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (commandHistory.length > 0) {
      if (historyIndex < commandHistory.length - 1) historyIndex++;
      this.value = commandHistory[commandHistory.length - 1 - historyIndex];
      inputDisplay.textContent = this.value;
    }
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      this.value = commandHistory[commandHistory.length - 1 - historyIndex];
      inputDisplay.textContent = this.value;
    } else { historyIndex = -1; this.value = ''; inputDisplay.textContent = ''; }
    return;
  }
  if (e.key === 'Enter') {
    const cmd = this.value.trim().toLowerCase();
    this.value = ''; inputDisplay.textContent = '';
    if (cmd) commandHistory.push(cmd);
    historyIndex = -1;
    addCommandToHistory(cmd);
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

// ─── COMMAND PROCESSOR ────────────────────────────────────────────────────────
function processCommand(cmd) {
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
    case 'resume':
      addToHistory(`<div style="color:#a9b1d6">Opening resume... <a href="./resume.pdf" target="_blank" style="color:#7dcfff">[Download PDF]</a></div>`);
      window.open('./resume.pdf', '_blank');
      break;
    case 'm': toggleMatrix(); break;
    case 'linkedin':
      addToHistory(`<div style="color:#a9b1d6;">Opening LinkedIn profile... <a href="https://www.linkedin.com/in/rishantshukla/" target="_blank" style="color:#7dcfff">[linkedin.com/in/rishantshukla]</a></div>`);
      window.open('https://www.linkedin.com/in/rishantshukla/', '_blank');
      break;
    case 'github':
      addToHistory(`<div style="color:#a9b1d6;">Opening GitHub profile... <a href="https://github.com/rishantshukla" target="_blank" style="color:#7dcfff">[github.com/rishantshukla]</a></div>`);
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
      addToHistory(`<div style="color:#e0af68;">${joke}</div>`);
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
      addToHistory(`<div style="color:#7dcfff;font-style:italic;">${quote}</div>`);
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
      
      addToHistory(`<div style="color:#9ece6a;">Initializing hacking sequence...</div>`);
      setTimeout(() => {
        addToHistory(`<div style="color:#7dcfff;">Scanning network... [${targetNet}.0/24]</div>`);
      }, 1000);
      setTimeout(() => {
        addToHistory(`<div style="color:#7dcfff;">Found target: ${targetNet}.${targetIP}</div>`);
      }, 2000);
      setTimeout(() => {
        addToHistory(`<div style="color:#e0af68;">Attempting SSH brute force...</div>`);
      }, 3000);
      setTimeout(() => {
        addToHistory(`<div style="color:#565f89;">Trying password: ********... ❌</div>`);
      }, 4000);
      setTimeout(() => {
        addToHistory(`<div style="color:#565f89;">Trying password: ***********... ❌</div>`);
      }, 5000);
      setTimeout(() => {
        addToHistory(`<div style="color:#565f89;">Trying password: ******... ❌</div>`);
      }, 6000);
      setTimeout(() => {
        addToHistory(`<div style="color:#9ece6a;">Exploiting vulnerability ${cve}-${cveNum}...</div>`);
      }, 7000);
      setTimeout(() => {
        addToHistory(`<div style="color:#9ece6a;">Bypassing firewall... [████████████████████] 100%</div>`);
      }, 8000);
      setTimeout(() => {
        addToHistory(`<div style="color:#9ece6a;">Escalating privileges... root access obtained! ✓</div>`);
      }, 9000);
      setTimeout(() => {
        addToHistory(`<div style="color:#9ece6a;">Downloading ${db}... [████████████████████] 100%</div>`);
      }, 10000);
      setTimeout(() => {
        addToHistory(`<div style="color:#bb9af7;font-weight:bold;">ACCESS GRANTED - SYSTEM COMPROMISED</div>`);
      }, 11000);
      setTimeout(() => {
        addToHistory(`<div style="color:#f7768e;font-size:16px;margin-top:10px;">${ending}</div>`);
        scrollToBottom();
      }, 18000);
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
      addToHistory(`<div style="color:#bb9af7;">
        <div style="border:1px solid #565f89;padding:12px;border-radius:6px;margin:8px 0;">
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
      
      addToHistory(`<div style="color:#e0af68;">
        <pre style="color:#e0af68;line-height:1.2;margin:10px 0;">
    ( (
     ) )
  ........
  |      |]
  \\      /
   \`----'
        </pre>
        <div style="color:#a9b1d6;">☕ ${msg} <span style="color:#565f89;">(${coffee} - Caffeine level: ${level})</span></div>
      </div>`);
      break;
    }
    case 'uptime': {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
      const hrs  = Math.floor(elapsed / 3600);
      const mins = Math.floor((elapsed % 3600) / 60);
      const secs = elapsed % 60;
      const load = `${(Math.random()*0.1+0.01).toFixed(2)}, ${(Math.random()*0.05+0.01).toFixed(2)}, ${(Math.random()*0.03).toFixed(2)}`;
      addToHistory(`<div style="color:#a9b1d6"> ${new Date().toLocaleTimeString()} up ${hrs}h ${mins}m ${secs}s, 1 user, load average: ${load}</div>`);
      break;
    }
    case 'date':
      addToHistory(`<div style="color:#a9b1d6;">${new Date().toString()}</div>`);
      break;
    case 'pwd':
      addToHistory(`<div style="color:#a9b1d6;">/home/rishant/portfolio</div>`);
      break;
    case 'hostname':
      addToHistory(`<div style="color:#a9b1d6;">rishant.vercel.app</div>`);
      break;
    case 'history': {
      const lines = commandHistory.map((c, i) =>
        `<div style="color:#a9b1d6;"><span style="color:#565f89;display:inline-block;width:30px;text-align:right;margin-right:10px;">${i+1}</span>${escapeHTML(c)}</div>`
      ).join('');
      addToHistory(lines || `<div style="color:#565f89;">No commands in history.</div>`);
      break;
    }
    case 'cat readme':
    case 'cat readme.md':
    case 'cat_readme':
      addToHistory(`<div style="color:#a9b1d6;">
        <span style="color:#e0af68;font-weight:bold;font-size:15px;">📄 README.md</span>
        <hr style="border:0;border-bottom:1px solid #414868;margin:8px 0;">
        <span style="color:#7dcfff;font-weight:bold;">Rishant Shukla</span> — DevOps Engineer @ Vavensoft Pvt. Ltd.<br><br>
        DevOps Engineer with proven experience in building CI/CD pipelines, automating infrastructure,<br>
        and deploying applications on cloud and containerized platforms.<br><br>
        Skilled in Linux, Kubernetes, Docker, and AWS to deliver secure, scalable, and reliable solutions.<br><br>
        <span style="color:#565f89;">// Built with ❤️ and too much coffee.</span>
      </div>`);
      break;
    case '': break;
    default: {
      const safeCmd = escapeHTML(cmd);
      if (cmd.startsWith('ping ')) {
        runPingSimulation(cmd.split(' ')[1]);
      } else if (cmd.startsWith('echo ')) {
        addToHistory(`<div style="color:#a9b1d6;">${escapeHTML(cmd.substring(5))}</div>`);
      } else if (cmd.startsWith('cat ')) {
        addToHistory(`<div style="color:#f7768e;">cat: ${escapeHTML(cmd.split(' ')[1])}: Permission denied</div>`);
      } else if (cmd.startsWith('docker ') || cmd.startsWith('kubectl ') || cmd.startsWith('terraform ')) {
        addToHistory(`<div style="color:#f7768e;">Error: Cannot execute '${escapeHTML(cmd.split(' ')[0])}'. Environment not configured.</div>`);
      } else if (cmd === 'ping') {
        addToHistory(`<div style="color:#f7768e;">Usage: ping &lt;hostname&gt;</div>`);
      } else {
        const suggestion = findClosestCommand(cmd);
        if (suggestion) {
          addToHistory(`<div style="color:#f7768e;">Command not found: ${safeCmd}. Did you mean <span class="clickable-cmd">${suggestion}</span>?</div>`);
        } else {
          addToHistory(`<div style="color:#f7768e;">Command not found: ${safeCmd}. Type <span class="clickable-cmd">help</span> for available commands.</div>`);
        }
      }
    }
  }
}

// ─── PING SIMULATION ──────────────────────────────────────────────────────────
async function runPingSimulation(host) {
  const safeHost = escapeHTML(host);
  const ip = `${Math.floor(Math.random()*223+1)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
  addToHistory(`<div style="color:#a9b1d6;">PING ${safeHost} (${ip}): 56 data bytes</div>`);
  for (let i = 0; i < 4; i++) {
    await new Promise(r => setTimeout(r, 700 + Math.random()*400));
    const ttl  = Math.floor(Math.random()*20+48);
    const time = (Math.random()*30+5).toFixed(1);
    addToHistory(`<div style="color:#a9b1d6;">64 bytes from ${safeHost}: icmp_seq=${i} ttl=${ttl} time=${time} ms</div>`);
    scrollToBottom();
  }
  const avg = (Math.random()*15+10).toFixed(1);
  addToHistory(`<div style="color:#a9b1d6;"><br>--- ${safeHost} ping statistics ---<br>4 packets transmitted, 4 received, <span style="color:#9ece6a;">0% packet loss</span><br>round-trip min/avg/max = ${(avg-5).toFixed(1)}/${avg}/${(parseFloat(avg)+8).toFixed(1)} ms</div>`);
  scrollToBottom();
}

// ─── CLICK-TO-RUN COMMANDS ────────────────────────────────────────────────────
async function runCommandClick(cmd) {
  if (isBooting) return;
  const div = document.createElement('div');
  div.className = 'prompt-line';
  div.innerHTML = `<span class="user">rishant</span><span class="at">@</span><span class="host">devops</span><span class="arrow">➜</span> <span class="cmd"></span>`;
  history.appendChild(div);
  await typeText(div.querySelector('.cmd'), cmd);
  await new Promise(r => setTimeout(r, 150));
  div.remove();
  addCommandToHistory(cmd);
  processCommand(cmd);
  scrollToBottom();
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('clickable-cmd')) {
    const cmd = e.target.dataset.cmd || e.target.textContent.trim();
    runCommandClick(cmd);
    return;
  }
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
const columns  = canvas.width / fontSize;
const drops    = Array(Math.floor(columns)).fill(1);

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
  document.body.classList.toggle('matrix-mode');
  if (document.body.classList.contains('matrix-mode')) {
    drawMatrix();
    matrixInterval = setInterval(drawMatrix, 30);
    addToHistory("<div style='color:#0F0'>Entering the Matrix... (type 'm' again to exit)</div>");
  } else {
    clearInterval(matrixInterval);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    addToHistory("<div style='color:#a9b1d6'>Matrix mode deactivated.</div>");
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

// ─── EMAIL (EmailJS) ──────────────────────────────────────────────────────────
function sendEmail(e) {
  e.preventDefault();
  const logs = e.target.parentNode.querySelector('#email-logs');
  logs.innerHTML = "<div style='color:#e0af68'>Sending via SMTP...</div>";
  
  // Initialize EmailJS with your Public Key
  emailjs.init('Gj5HXeR87daFYYEqN');
  
  // Send the form
  emailjs.sendForm('service_204vccd', 'template_1bpb2h4', e.target)
    .then(() => { 
      logs.innerHTML = "<div style='color:#9ece6a'>[200 OK] Message sent successfully!</div>"; 
      e.target.reset(); 
    }, (err) => { 
      logs.innerHTML = `<div style='color:#f7768e'>[ERROR] ${err.text || 'Failed to send message'}</div>`; 
    });
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
window.onload = runIntro;
