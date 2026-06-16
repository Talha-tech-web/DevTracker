
// ══════════════════════════════════════════════
//  DevTracker — app.js
//  Supports: built-in roadmap + AI-generated
//  roadmaps from uploaded PDF / DOCX / TXT
// ══════════════════════════════════════════════

// ── Built-in Phases (default roadmap) ──
const DEFAULT_PHASES = [
  { id: 'p1', name: 'Phase 1 — Python refresh', dur: '2 weeks', tag: 'general', tasks: [
    'Variables, data types & control flow','Functions, OOP & modules',
    'Virtual environments & pip','File handling & error handling',
  ]},
  { id: 'p2', name: 'Phase 2 — FastAPI backend', dur: '3 weeks', tag: 'backend', tasks: [
    'FastAPI setup & project structure','Path params, query params & request body',
    'Pydantic models & data validation','CRUD operations & routers',
    'Async programming with async/await','Authentication with JWT tokens','Middleware & CORS',
  ]},
  { id: 'p3', name: 'Phase 3 — PostgreSQL database', dur: '2 weeks', tag: 'db', tasks: [
    'SQL fundamentals & schema design','Connect FastAPI to PostgreSQL (asyncpg)',
    'SQLAlchemy ORM models','Migrations with Alembic',
    'JSONB columns for flexible data','Indexes & query optimization',
  ]},
  { id: 'p4', name: 'Phase 4 — Redis (cache & real-time)', dur: '1.5 weeks', tag: 'backend', tasks: [
    'Redis setup & basic commands','Caching with Redis in FastAPI',
    'WebSockets for real-time updates','Pub/Sub for live notifications','Session management with Redis',
  ]},
  { id: 'p5', name: 'Phase 5 — React frontend', dur: '3 weeks', tag: 'frontend', tasks: [
    'React fundamentals & hooks','State management with Context / Zustand',
    'REST API calls with fetch / axios','WebSocket client integration',
    'Routing with React Router','Forms & validation','Tailwind CSS for styling',
  ]},
  { id: 'p6', name: 'Phase 6 — E-commerce features', dur: '2 weeks', tag: 'backend', tasks: [
    'Product catalog with categories','Shopping cart (Redis session)',
    'Order management system','Payment integration (Stripe)',
    'Search with full-text PostgreSQL',
  ]},
  { id: 'p7', name: 'Phase 7 — AI/ML integration', dur: '2.5 weeks', tag: 'ai', tasks: [
    'Python AI stack (scikit-learn, NumPy)','Product recommendation engine',
    'Natural language search with embeddings','Integration with OpenAI API',
    'Background ML tasks with Celery',
  ]},
  { id: 'p8', name: 'Phase 8 — Testing & security', dur: '1.5 weeks', tag: 'backend', tasks: [
    'Unit tests with pytest','API integration testing',
    'Input validation & SQL injection prevention','Rate limiting & HTTPS setup',
  ]},
  { id: 'p9', name: 'Phase 9 — DevOps & deployment', dur: '2 weeks', tag: 'devops', tasks: [
    'Docker & Docker Compose','CI/CD with GitHub Actions',
    'Deploy to Railway / Render (free)','PostgreSQL on Supabase',
    'Redis on Upstash','Monitoring & logging',
  ]},
  { id: 'p10', name: 'Phase 10 — Capstone project', dur: '3 weeks', tag: 'general', tasks: [
    'Define app requirements & wireframe','Build backend API (FastAPI)',
    'Design PostgreSQL schema','Implement real-time features',
    'Integrate AI recommendation','Build React frontend',
    'Deploy full stack to production','Write README & document API',
  ]},
];

// ── State ──
let PHASES        = DEFAULT_PHASES.map(p => ({ ...p, tasks: [...p.tasks] }));
let tasks         = {};
let waNumber      = '';
let activeFilter  = 'all';
let lastMilestone = 0;
let editId        = null;
let toastTimer    = null;
let currentRoadmapId = 'default';
let groqApiKey       = '';
let roadmapHistory   = [];

let myRoadmaps = {
  'default': {
    id: 'default',
    title: 'Python Full Stack',
    category: 'Backend',
    techStack: ['Python', 'FastAPI', 'PostgreSQL', 'React', 'AI'],
    phases: PHASES,
    tasks: tasks
  }
};


// ══════════════════════════════════════════════
//  PERSISTENCE
// ══════════════════════════════════════════════
function persist() {
  // Sync current active roadmap state
  if (myRoadmaps[currentRoadmapId]) {
    myRoadmaps[currentRoadmapId].phases = PHASES;
    myRoadmaps[currentRoadmapId].tasks = tasks;
  }

  try {
    localStorage.setItem('devtracker_v5', JSON.stringify({
      waNumber, lastMilestone, currentRoadmapId, myRoadmaps, groqApiKey
    }));
  } catch (e) { console.warn('Storage error', e); }
}

function loadData() {
  try {
    const raw = localStorage.getItem('devtracker_v5');
    if (raw) {
      const d = JSON.parse(raw);
      waNumber         = d.waNumber         || '';
      lastMilestone    = d.lastMilestone    || 0;
      currentRoadmapId = d.currentRoadmapId || 'default';
      myRoadmaps       = d.myRoadmaps       || myRoadmaps;
      groqApiKey     = d.groqApiKey     || '';
      
      if (myRoadmaps[currentRoadmapId]) {
        PHASES = myRoadmaps[currentRoadmapId].phases;
        tasks = myRoadmaps[currentRoadmapId].tasks;
      }
    }

    const hist = localStorage.getItem('devtracker_history');
    if (hist) {
      roadmapHistory = JSON.parse(hist) || [];
    }
  } catch (e) { console.warn('Load error', e); }

  // Seed tasks if empty
  if (!Object.keys(tasks).length) seedTasksFromPhases();
  
  // Make sure default exists in myRoadmaps if it got cleared
  if (!myRoadmaps['default']) {
     myRoadmaps['default'] = {
        id: 'default', title: 'Python Full Stack', category: 'Backend',
        techStack: ['Python', 'FastAPI', 'PostgreSQL', 'React', 'AI'],
        phases: PHASES, tasks: tasks
     };
  }

  if (waNumber) {
    const inp  = document.getElementById('wa-number');
    const inp2 = document.getElementById('wa-num-modal');
    if (inp)  inp.value  = waNumber;
    if (inp2) inp2.value = waNumber;
  }

  if (groqApiKey) {
    const apiInp = document.getElementById('groq-api-key');
    if (apiInp) apiInp.value = groqApiKey;
  }
}

function seedTasksFromPhases() {
  tasks = {};
  PHASES.forEach(ph => {
    ph.tasks.forEach((title, i) => {
      const id = ph.id + '_t' + i;
      tasks[id] = { id, phase: ph.id, title, tag: ph.tag, status: 'todo', note: '' };
    });
  });
}

// ══════════════════════════════════════════════
//  STATS & HEADER
// ══════════════════════════════════════════════
function getStats() {
  const all  = Object.values(tasks);
  const done = all.filter(t => t.status === 'done').length;
  const wip  = all.filter(t => t.status === 'inprogress').length;
  return {
    total: all.length, done, wip,
    todo: all.length - done - wip,
    pct: all.length ? Math.round(done / all.length * 100) : 0,
  };
}

function updateHeader() {
  const s = getStats();
  document.getElementById('s-done').textContent       = s.done;
  document.getElementById('s-wip').textContent        = s.wip;
  document.getElementById('s-todo').textContent       = s.todo;
  document.getElementById('s-pct').textContent        = s.pct + '%';
  document.getElementById('prog-fill').style.width    = s.pct + '%';
  document.getElementById('prog-pct-lbl').textContent = s.done + ' / ' + s.total + ' tasks';
  document.getElementById('nb-wip').textContent       = s.wip;

  // Update dynamic roadmap title in progress label
  const lbl = document.getElementById('prog-lbl');
  if (lbl) {
    const rm = myRoadmaps[currentRoadmapId];
    if (rm) {
      lbl.textContent = `Course progress — ${rm.title}`;
    }
  }

  checkMilestones(s.pct);
}

// ── Milestones ──
function checkMilestones(pct) {
  const milestones = [25, 50, 75, 100];
  const badges     = { 25: 'Bronze', 50: 'Silver', 75: 'Gold', 100: 'Platinum' };
  for (const m of milestones) {
    if (pct >= m && lastMilestone < m) {
      lastMilestone = m;
      persist();
      const label = badges[m];
      sendWhatsApp(`Milestone ${m}%! ${label} badge unlocked. Keep going!`);
      showToast(`${label} badge unlocked — ${m}% complete!`);
      break;
    }
  }
}

// ══════════════════════════════════════════════
//  WHATSAPP
// ══════════════════════════════════════════════
function sendWhatsApp(msg) {
  if (!waNumber) return;
  let num = waNumber.replace(/\D/g, '');
  if (!num) return;

  // Format local Pakistani numbers to international format (replace leading 0 with 92)
  if (num.startsWith('0') && num.length === 11) {
    num = '92' + num.substring(1);
  } else if (num.length === 10 && num.startsWith('3')) {
    num = '92' + num;
  }

  // Use '_blank' instead of 'whatsapp_tab' to ensure WhatsApp Web loads the new message and number correctly
  window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(msg), '_blank');
}
function openWaSetup()  { document.getElementById('wa-overlay').style.display = 'flex'; }
function closeWaModal() { document.getElementById('wa-overlay').style.display = 'none'; }
function saveWaModal() {
  waNumber = document.getElementById('wa-num-modal').value.trim();
  const inp = document.getElementById('wa-number');
  if (inp) inp.value = waNumber;
  persist(); closeWaModal();
  showToast('WhatsApp number saved — alerts are active!');
}
function saveWa() {
  waNumber = document.getElementById('wa-number').value.trim();
  const inp2 = document.getElementById('wa-num-modal');
  if (inp2) inp2.value = waNumber;
  persist();
  showToast('WhatsApp number saved!');
}

function saveGroqKey() {
  const inp = document.getElementById('groq-api-key');
  if (inp) {
    groqApiKey = inp.value.trim();
    persist();
    showToast('Groq API Key saved securely!');
  }
}

// ══════════════════════════════════════════════
//  BOARD RENDER
// ══════════════════════════════════════════════
function renderBoard() {
  const filtered = Object.values(tasks).filter(
    t => activeFilter === 'all' || t.tag === activeFilter
  );
  const todo = filtered.filter(t => t.status === 'todo');
  const wip  = filtered.filter(t => t.status === 'inprogress');
  const done = filtered.filter(t => t.status === 'done');

  document.getElementById('cc-todo').textContent = todo.length;
  document.getElementById('cc-wip').textContent  = wip.length;
  document.getElementById('cc-done').textContent = done.length;

  document.getElementById('col-todo').innerHTML = todo.length
    ? todo.map(t => cardHtml(t, false)).join('') : emptyCol('ti-inbox', 'Nothing here yet');
  document.getElementById('col-wip').innerHTML = wip.length
    ? wip.map(t => cardHtml(t, false)).join('') : emptyCol('ti-loader', 'Start a task to begin');
  document.getElementById('col-done').innerHTML = done.length
    ? done.map(t => cardHtml(t, true)).join('') : emptyCol('ti-check', 'Nothing done yet');
}

function emptyCol(icon, msg) {
  return `<div class="empty-msg"><i class="ti ${icon}"></i>${msg}</div>`;
}

function cardHtml(t, isDone) {
  const ph = PHASES.find(p => p.id === t.phase);
  const phaseName = ph ? ph.name.split('—')[0].trim() : (t.phase || '');
  return `
    <div class="task-card${isDone ? ' done-card' : ''}" onclick="openModal('${t.id}')">
      <div class="tc-phase"><i class="ti ti-folder"></i>${escHtml(phaseName)}</div>
      <div class="tc-title${isDone ? ' striked' : ''}">${escHtml(t.title)}</div>
      ${t.note ? `<div class="note-pill">${escHtml(t.note.substring(0,60))}${t.note.length>60?'…':''}</div>` : ''}
      <div class="tc-foot" style="margin-top:8px">
        <span class="tc-tag tag-${t.tag}">${t.tag}</span>
        <div class="tc-actions">
          ${t.status !== 'inprogress' && !isDone
            ? `<button class="btn-xs" onclick="event.stopPropagation();move('${t.id}','inprogress')">Start</button>` : ''}
          ${!isDone
            ? `<button class="btn-xs green" onclick="event.stopPropagation();move('${t.id}','done')"><i class="ti ti-check"></i></button>` : ''}
        </div>
      </div>
    </div>`;
}

function escHtml(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Move task ──
function move(id, status) {
  const prev = tasks[id].status;
  tasks[id].status = status;
  persist();
  if (prev !== 'done' && status === 'done') {
    sendWhatsApp(`Task done: "${tasks[id].title}" — ${tasks[id].tag} phase. Great work!`);
    showToast('Task done! WhatsApp message sent.');
  }
  renderBoard(); renderPhases(); updateHeader();
}

// ══════════════════════════════════════════════
//  PHASES RENDER
// ══════════════════════════════════════════════
function renderPhases() {
  document.getElementById('phase-list').innerHTML = PHASES.map(ph => {
    const pTasks = ph.tasks.map((_, i) => tasks[ph.id + '_t' + i]).filter(Boolean);
    const done   = pTasks.filter(t => t.status === 'done').length;
    const pct    = pTasks.length ? Math.round(done / pTasks.length * 100) : 0;
    return `
      <div class="phase-card">
        <div class="phase-top">
          <div>
            <div class="phase-name">${escHtml(ph.name)}</div>
            <div class="phase-meta">${escHtml(ph.dur||'')} &middot; ${pTasks.length} tasks</div>
          </div>
          <div>
            <div class="phase-pct" style="color:${pct===100?'var(--green-dark)':'var(--text)'}">${pct}%</div>
            <div class="phase-sub-right">${done} done</div>
          </div>
        </div>
        <div class="ph-bar"><div class="ph-fill" style="width:${pct}%"></div></div>
        <div class="ph-tasks">
          ${pTasks.map(t => `
            <span class="ph-chip${t.status==='done'?' chip-done':t.status==='inprogress'?' chip-wip':''}"
                  onclick="openModal('${t.id}')">
              ${escHtml(t.title.substring(0,30))}${t.title.length>30?'…':''}
            </span>`).join('')}
        </div>
      </div>`;
  }).join('');
}

// ══════════════════════════════════════════════
//  TASK MODAL
// ══════════════════════════════════════════════
function openModal(id) {
  editId = id;
  const t  = tasks[id];
  const ph = PHASES.find(p => p.id === t.phase);
  document.getElementById('modal-title').textContent  = t.title;
  document.getElementById('modal-phase').textContent  = ph ? ph.name : t.phase;
  document.getElementById('modal-status').value       = t.status;
  document.getElementById('modal-note').value         = t.note || '';
  document.getElementById('modal-overlay').style.display = 'flex';
}
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  editId = null;
}
function saveTask() {
  if (!editId) return;
  const prev   = tasks[editId].status;
  const status = document.getElementById('modal-status').value;
  tasks[editId].status = status;
  tasks[editId].note   = document.getElementById('modal-note').value;
  persist();
  if (prev !== 'done' && status === 'done') {
    sendWhatsApp(`Task done: "${tasks[editId].title}" — great work!`);
    showToast('Task done! WhatsApp message sent.');
  }
  closeModal(); renderBoard(); renderPhases(); updateHeader();
}

// ══════════════════════════════════════════════
//  VIEW SWITCHING
// ══════════════════════════════════════════════
function switchView(view, el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('board-view').style.display    = view === 'board'    ? 'block' : 'none';
  document.getElementById('phases-view').style.display   = view === 'phases'   ? 'block' : 'none';
  document.getElementById('settings-view').style.display = view === 'settings' ? 'block' : 'none';
  document.getElementById('history-view').style.display  = view === 'history'  ? 'block' : 'none';
  const titles = { board:'DashBoard', phases:'Course phases', settings:'Settings', history:'Roadmap history' };
  document.getElementById('view-title').textContent = titles[view] || '';
  if (view === 'history') renderHistory();
}

// ── Filter ──
function filterTag(tag, el) {
  activeFilter = tag;
  document.querySelectorAll('.nav-item').forEach(n => { n.classList.remove('filter-active'); n.classList.remove('active'); });
  document.querySelector('.nav-item[onclick*="\'board\'"]').classList.add('active');
  el.classList.add('filter-active');
  document.getElementById('filter-chip').textContent = tag === 'all' ? 'All tasks' : tag;
  renderBoard();
}

// ── Dynamic filter sidebar — rebuilt whenever roadmap changes ──
const TAG_META = {
  backend:  { icon: 'ti-server',   label: 'Backend' },
  frontend: { icon: 'ti-browser',  label: 'Frontend' },
  db:       { icon: 'ti-database', label: 'Database' },
  ai:       { icon: 'ti-brain',    label: 'AI / ML' },
  devops:   { icon: 'ti-cloud',    label: 'DevOps' },
  general:  { icon: 'ti-box',      label: 'General' },
};
function renderFilters() {
  const section = document.getElementById('filter-nav-section');
  if (!section) return;
  const tags = [...new Set(PHASES.map(ph => ph.tag))].filter(Boolean);
  section.innerHTML =
    `<div class="nav-label">Quick filter</div>` +
    `<button class="nav-item${activeFilter === 'all' ? ' filter-active' : ''}" onclick="filterTag('all',this)">` +
      `<i class="ti ti-stack-2"></i>All tasks` +
    `</button>` +
    tags.map(tag => {
      const m = TAG_META[tag] || { icon: 'ti-tag', label: tag.charAt(0).toUpperCase() + tag.slice(1) };
      return `<button class="nav-item${activeFilter === tag ? ' filter-active' : ''}" onclick="filterTag('${tag}',this)">` +
        `<i class="ti ${m.icon}"></i>${m.label}` +
      `</button>`;
    }).join('');
}

// ── Reset ──
function resetAll() {
  Object.values(tasks).forEach(t => { t.status = 'todo'; });
  lastMilestone = 0;
  persist(); renderBoard(); renderPhases(); updateHeader();
  showToast('All tasks reset to To do');
}

// ── Toast ──
function showToast(msg) {
  const el = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  el.style.display = 'flex';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3500);
}


// ══════════════════════════════════════════════
//  ROADMAP MANAGEMENT
// ══════════════════════════════════════════════
function switchRoadmap(id) {
  if (!myRoadmaps[id]) return;
  
  // Save current progress
  persist();
  
  // Load new roadmap
  currentRoadmapId = id;
  PHASES = myRoadmaps[id].phases;
  tasks = myRoadmaps[id].tasks;
  
  persist();
  
  // Update UI
  renderBoard(); renderPhases(); updateHeader(); renderFilters(); renderSidebarRoadmaps(); updateFooter();
  showToast(`Switched to: ${myRoadmaps[id].title}`);
}

function updateFooter() {
  const stackSpan = document.getElementById('dynamic-footer-stack');
  if (!stackSpan) return;
  const rm = myRoadmaps[currentRoadmapId];
  if (rm && rm.techStack) {
    stackSpan.innerHTML = rm.techStack.join(' &rarr; ');
  } else {
    stackSpan.innerHTML = 'General Stack';
  }
}

function renderSidebarRoadmaps() {
  const container = document.getElementById('roadmaps-nav-section');
  if (!container) return;
  
  // Group by category
  const categories = {};
  Object.values(myRoadmaps).forEach(rm => {
    const cat = rm.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(rm);
  });
  
  let html = `<div class="nav-label">My Roadmaps</div>`;
  
  for (const [cat, rms] of Object.entries(categories)) {
    html += `<div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin: 12px 0 4px 16px; letter-spacing: 0.5px;">${escHtml(cat)}</div>`;
    rms.forEach(rm => {
      const isActive = rm.id === currentRoadmapId ? ' active' : '';
      html += `<button class="nav-item${isActive}" onclick="switchRoadmap('${rm.id}')">
                 <i class="ti ti-map"></i>${escHtml(rm.title)}
               </button>`;
    });
  }
  
  container.innerHTML = html;
}

// ══════════════════════════════════════════════
//  ROADMAP HISTORY
// ══════════════════════════════════════════════
function saveToHistory(title) {
  const snapshot = {
    id:     'rm_' + Date.now(),
    title:  title || 'Roadmap ' + new Date().toLocaleDateString(),
    date:   new Date().toISOString(),
    phases: JSON.parse(JSON.stringify(PHASES)),
    tasks:  JSON.parse(JSON.stringify(tasks)),
  };
  roadmapHistory.unshift(snapshot);
  // Keep max 20 snapshots
  if (roadmapHistory.length > 20) roadmapHistory = roadmapHistory.slice(0, 20);
  localStorage.setItem('devtracker_history', JSON.stringify(roadmapHistory));
}

function renderHistory() {
  const el = document.getElementById('history-list');
  if (!roadmapHistory.length) {
    el.innerHTML = `<div class="empty-hist"><i class="ti ti-history"></i><p>No saved roadmaps yet. Upload a document to generate your first AI roadmap — the previous one will be saved here automatically.</p></div>`;
    return;
  }
  el.innerHTML = roadmapHistory.map(rm => {
    const d      = new Date(rm.date);
    const dateStr = d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
    const timeStr = d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
    const total  = Object.keys(rm.tasks).length;
    const done   = Object.values(rm.tasks).filter(t => t.status === 'done').length;
    const pct    = total ? Math.round(done / total * 100) : 0;
    const isCurr = rm.id === currentRoadmapId;
    return `
      <div class="hist-card${isCurr ? ' hist-active' : ''}">
        <div class="hist-top">
          <div class="hist-info">
            <div class="hist-title">${escHtml(rm.title)}</div>
            <div class="hist-meta"><i class="ti ti-calendar"></i>${dateStr} at ${timeStr} &nbsp;·&nbsp; ${rm.phases.length} phases &nbsp;·&nbsp; ${total} tasks</div>
          </div>
          <div class="hist-right">
            <div class="hist-pct">${pct}%</div>
            <div class="hist-pct-lbl">${done}/${total} done</div>
          </div>
        </div>
        <div class="prog-bar-bg" style="margin-top:8px">
          <div class="prog-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="hist-actions">
          ${!isCurr ? `<button class="btn-hist-restore" onclick="restoreRoadmap('${rm.id}')"><i class="ti ti-refresh"></i>Restore this roadmap</button>` : '<span class="hist-curr-badge"><i class="ti ti-check"></i>Currently active</span>'}
          <button class="btn-hist-del" onclick="deleteHistoryItem('${rm.id}')"><i class="ti ti-trash"></i>Delete</button>
        </div>
      </div>`;
  }).join('');
}

function restoreRoadmap(id) {
  const rm = roadmapHistory.find(r => r.id === id);
  if (!rm) return;
  if (!confirm(`Restore "${rm.title}"? Your current roadmap will be saved to history first.`)) return;
  // Save current to history before replacing
  if (myRoadmaps[currentRoadmapId]) {
    saveToHistory(myRoadmaps[currentRoadmapId].title);
  }
  
  PHASES            = rm.phases;
  tasks             = rm.tasks;
  lastMilestone     = 0;
  currentRoadmapId  = rm.id;
  persist();
  renderBoard(); renderPhases(); updateHeader(); renderFilters(); renderHistory();
  showToast(`Restored: ${rm.title}`);
}

function deleteHistoryItem(id) {
  roadmapHistory = roadmapHistory.filter(r => r.id !== id);
  localStorage.setItem('devtracker_history', JSON.stringify(roadmapHistory));
  renderHistory();
  showToast('Entry deleted from history');
}

// ══════════════════════════════════════════════
//  DOCUMENT UPLOAD & AI ANALYSIS
// ══════════════════════════════════════════════

// ── Open/close upload modal ──
function openUploadModal() {
  document.getElementById('upload-overlay').style.display = 'flex';
  resetUploadUI();
}
function closeUploadModal() {
  document.getElementById('upload-overlay').style.display = 'none';
  resetUploadUI();
}
function resetUploadUI() {
  document.getElementById('upload-drop').style.display = 'block';
  document.getElementById('upload-analyzing').style.display = 'none';
  document.getElementById('upload-preview').style.display = 'none';
  document.getElementById('upload-file-input').value = '';
  _pendingPhases = null;
}

let _pendingPhases = null;

// ── Drag & Drop ──
function initDropZone() {
  const zone = document.querySelector('#upload-drop .drop-zone');
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', ()  => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
}

function onFileInputChange(input) {
  if (input.files[0]) handleFile(input.files[0]);
}

async function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf','docx','doc','txt','md'].includes(ext)) {
    showToast('Please upload a PDF, Word document, or text file.');
    return;
  }
  document.getElementById('upload-drop').style.display = 'none';
  document.getElementById('upload-analyzing').style.display = 'flex';
  document.getElementById('analyze-filename').textContent = file.name;

  try {
    let text = '';
    if (ext === 'txt' || ext === 'md') {
      text = await file.text();
    } else if (ext === 'pdf') {
      text = await extractPdfText(file);
    } else if (ext === 'docx' || ext === 'doc') {
      text = await extractDocxText(file);
    }

    if (!text || text.trim().length < 50) {
      throw new Error('Could not extract enough text from this file. Please try a different file.');
    }

    // Send to Claude API
    const phases = await analyzeWithGroq(text.substring(0, 12000), file.name);
    _pendingPhases = phases;
    showUploadPreview(phases, file.name);
  } catch (err) {
    document.getElementById('upload-drop').style.display = 'flex';
    document.getElementById('upload-analyzing').style.display = 'none';
    showToast('Error: ' + (err.message || 'Analysis failed'));
    console.error(err);
  }
}

// ── Extract PDF text using PDF.js ──
async function extractPdfText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let fullText = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          
          let lastY = -1;
          content.items.forEach(item => {
             if (lastY !== -1 && Math.abs(lastY - item.transform[5]) > 5) {
                fullText += '\n';
             }
             fullText += item.str + ' ';
             lastY = item.transform[5];
          });
          fullText += '\n\n';
        }
        resolve(fullText);
      } catch(err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── Extract DOCX text using mammoth.js ──
async function extractDocxText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const result = await mammoth.convertToHtml({ arrayBuffer: e.target.result });
        let html = result.value;
        html = html.replace(/<h1>(.*?)<\/h1>/g, '# $1\n');
        html = html.replace(/<h2>(.*?)<\/h2>/g, '## $1\n');
        html = html.replace(/<h3>(.*?)<\/h3>/g, '### $1\n');
        html = html.replace(/<ul>/g, '\n').replace(/<\/ul>/g, '\n');
        html = html.replace(/<li>(.*?)<\/li>/g, '- $1\n');
        html = html.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
        html = html.replace(/<[^>]*>?/gm, ''); 
        resolve(html);
      } catch(err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── Call Claude API ──
async function analyzeWithGroq(text, filename) {
  const prompt = `You are a learning roadmap analyzer. Analyze the following document and extract or create a structured learning/project roadmap from it.

Document: "${filename}"
Content:
${text}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "roadmapTitle": "Short title for this roadmap",
  "category": "Broad category (e.g., Graphic Design, AI, Web Development)",
  "techStack": ["Tech 1", "Tech 2", "Tech 3"],
  "phases": [
    {
      "id": "p1",
      "name": "Phase 1 — Phase Name",
      "dur": "X weeks",
      "tag": "one of: general|backend|frontend|db|ai|devops",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    }
  ]
}

Rules:
- Create 3-12 phases based on the document content
- Each phase should have 3-10 tasks
- Choose the most relevant tag for each phase
- Task names should be concise action items (under 60 chars)
- Category should be a broad skill domain (e.g. Graphic Design, Web Dev)
- techStack should be an array of 3-5 core tools/technologies used in this roadmap
- If the document is not a learning roadmap/curriculum, extract the key topics/goals as phases and tasks
- Phases should be logically ordered`;

  if (!groqApiKey) {
    throw new Error('Groq API Key is required. Please set it in Settings first.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" },
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'API request failed');
  }

  const data = await response.json();
  const rawText = data.choices[0].message.content;
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  const parsed  = JSON.parse(cleaned);
  if (!parsed.phases || !Array.isArray(parsed.phases)) throw new Error('Invalid response structure from AI');
  return parsed;
}

// ── Show preview before applying ──
function showUploadPreview(parsed, filename) {
  document.getElementById('upload-analyzing').style.display = 'none';
  document.getElementById('upload-preview').style.display = 'block';

  document.getElementById('preview-title').textContent = parsed.roadmapTitle || filename;
  const totalTasks = parsed.phases.reduce((sum, ph) => sum + (ph.tasks||[]).length, 0);
  document.getElementById('preview-meta').textContent = `${parsed.category} · ${parsed.techStack?.join(', ')} · ${totalTasks} tasks`;

  document.getElementById('preview-phases').innerHTML = parsed.phases.map(ph => `
    <div class="preview-phase">
      <div class="preview-phase-head">
        <span class="preview-phase-name">${escHtml(ph.name)}</span>
        <span class="tc-tag tag-${ph.tag}" style="font-size:10px;padding:2px 8px">${ph.tag}</span>
      </div>
      <div class="preview-tasks">
        ${(ph.tasks||[]).map(t => `<div class="preview-task"><i class="ti ti-point"></i>${escHtml(t)}</div>`).join('')}
      </div>
    </div>`).join('');
}

function applyGeneratedRoadmap() {
  if (!_pendingPhases) return;
  const parsed = _pendingPhases;

  const newId = 'rm_' + Date.now();
  const newPhases = parsed.phases.map((ph, idx) => ({
    id:    ph.id || ('p' + (idx + 1)),
    name:  ph.name,
    dur:   ph.dur || '',
    tag:   ph.tag || 'general',
    tasks: ph.tasks || [],
  }));

  // Build tasks map for new roadmap
  const newTasks = {};
  newPhases.forEach(ph => {
    ph.tasks.forEach((title, i) => {
      const id = ph.id + '_t' + i;
      newTasks[id] = { id, phase: ph.id, title, tag: ph.tag, status: 'todo', note: '' };
    });
  });

  myRoadmaps[newId] = {
    id: newId,
    title: parsed.roadmapTitle || 'AI Roadmap',
    category: parsed.category || 'General',
    techStack: parsed.techStack || ['General Tech'],
    phases: newPhases,
    tasks: newTasks
  };

  closeUploadModal();
  switchRoadmap(newId);
}

// ── Close modals on overlay click ──
document.getElementById('modal-overlay').addEventListener('click', function(e)  { if (e.target === this) closeModal(); });
document.getElementById('wa-overlay').addEventListener('click',    function(e)  { if (e.target === this) closeWaModal(); });
document.getElementById('upload-overlay').addEventListener('click', function(e) { if (e.target === this) closeUploadModal(); });

// ── Toggle milestones ──
document.querySelectorAll('.toggle').forEach(tog => {
  tog.addEventListener('click', () => tog.classList.toggle('on'));
});

// ── Dark / Light theme ──
function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
  const icon = document.getElementById('theme-icon');
  const tog  = document.getElementById('dark-toggle');
  if (icon) icon.className = dark ? 'ti ti-sun' : 'ti ti-moon';
  if (tog)  tog.classList.toggle('on', dark);
  try { localStorage.setItem('devtracker_theme', dark ? 'dark' : 'light'); } catch(e) {}
}
function toggleTheme() { applyTheme(!document.body.classList.contains('dark')); }

// ── Init ──
loadData();
renderSidebarRoadmaps();
updateFooter();
renderBoard();
renderPhases();
updateHeader();
renderFilters();
initDropZone();

// Load saved theme
(function() {
  try { if (localStorage.getItem('devtracker_theme') === 'dark') applyTheme(true); } catch(e) {}
})();
