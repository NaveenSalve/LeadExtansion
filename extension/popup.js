let allLeads = [];
let filteredLeads = [];
let tabId = null;
let isGood = false;
let extracting = false;

// ---- ACTIVATION SYSTEM ----
const SECRET_SALT = "NAV_SUPER_SAFE_99_SALVE"; // Matches Admin Tool

async function checkActivation() {
  const data = await chrome.storage.local.get(['activated', 'machineId']);
  let mid = data.machineId;
  
  if (!mid) {
    mid = Math.random().toString(36).substring(2, 10).toUpperCase();
    await chrome.storage.local.set({ machineId: mid });
  }
  
  document.getElementById('requestCode').textContent = mid;
  
  if (data.activated) {
    document.getElementById('lockOverlay').style.display = 'none';
  } else {
    document.getElementById('lockOverlay').style.display = 'flex';
  }
}

document.getElementById('btnActivate').addEventListener('click', async () => {
  const input = document.getElementById('licenseInput').value.trim();
  const mid = document.getElementById('requestCode').textContent;
  
  // Simple Logic: Key = MachineID + SALT
  const expectedKey = mid + SECRET_SALT;
  
  if (input === expectedKey) {
    await chrome.storage.local.set({ activated: true });
    alert("✅ Extension Activated! Ab aap ise use kar sakte hain.");
    document.getElementById('lockOverlay').style.display = 'none';
  } else {
    alert("❌ Galat Activation Key! Naveen Salve se contact karein.");
  }
});

checkActivation();

// ---- MESSAGE LISTENER FOR LIVE RESULTS ----
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'LEADS_FOUND') {
    mergeLeads(msg.data);
  } else if (msg.type === 'PROGRESS') {
    setProgress(msg.data.pct, msg.data.label);
  } else if (msg.type === 'FINISHED') {
    setS('Extraction Complete!', 'ok');
    finishExtract();
  }
});

// ---- PAGE CHECK ----
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) { setS('Tab nahi mili', 'err'); return; }
  tabId = tab.id;
  const url = tab.url || '';

  if (url.includes('google.com/maps') || url.includes('maps.google.com')) {
    setBadge('🗺 Google Maps', true);
    setS('Ready! Start dabaiye', 'info');
    isGood = true;
    document.getElementById('btnStart').disabled = false;
  } else if (url.includes('bing.com/maps') || url.includes('bingplaces.com')) {
    setBadge('🔷 Bing Maps', true);
    setS('Ready! Start dabaiye', 'info');
    isGood = true;
    document.getElementById('btnStart').disabled = false;
  } else {
    setBadge('❌ Wrong Page', false);
    setS('Pehle Maps open karein', 'err');
    document.getElementById('btnStart').style.display = 'none';
    document.getElementById('btnOpenMaps').style.display = 'flex';
    isGood = false;
  }
});

function setBadge(txt, ok) {
  const b = document.getElementById('badge');
  b.textContent = txt;
  b.className = 'badge ' + (ok ? 'b-ok' : 'b-err');
}

// ---- EXTRACT ----
document.getElementById('btnStart').addEventListener('click', startExtract);
document.getElementById('btnStop').addEventListener('click', stopExtract);

async function stopExtract() {
  extracting = false;
  document.getElementById('mainBody').classList.remove('extracting');
  document.getElementById('btnStop').style.display = 'none';
  document.getElementById('btnStart').style.display = 'flex';
  setS('Stopping...', 'err');
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => { window.__leadsStop = true; }
  });
}

async function startExtract() {
  if (!isGood || extracting) return;
  extracting = true;

  document.getElementById('mainBody').classList.add('extracting');
  document.getElementById('btnStart').style.display = 'none';
  document.getElementById('btnStop').style.display = 'flex';
  document.getElementById('progWrap').style.display = 'block';
  setS('Finding leads...', 'info');

  try {
    setProgress(5, 'Initializing...');
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['extractor.js']
    });
  } catch(e) {
    setS('Error: ' + (e.message || 'Retry'), 'err');
    finishExtract();
  }
}

function finishExtract() {
  extracting = false;
  document.getElementById('mainBody').classList.remove('extracting');
  document.getElementById('btnStart').style.display = 'flex';
  document.getElementById('btnStop').style.display = 'none';
  document.getElementById('btnStart').disabled = false;
  setTimeout(() => { document.getElementById('progWrap').style.display = 'none'; }, 3000);
}

function setProgress(pct, label) {
  const progBar = document.getElementById('progBar');
  const progLabel = document.getElementById('progLabel');
  if (progBar) progBar.style.width = pct + '%';
  if (progLabel) progLabel.textContent = label;
}

function mergeLeads(newLeads) {
  const ex = new Set(allLeads.map(l => l.name.toLowerCase().trim()));
  let added = 0;
  newLeads.forEach(l => {
    const k = (l.name||'').toLowerCase().trim();
    if (k.length > 1 && !ex.has(k)) { 
      allLeads.push(l); 
      ex.add(k); 
      added++; 
    }
  });
  if (allLeads.length > 0) {
    const statsRow = document.getElementById('statsRow');
    const searchRow = document.getElementById('searchRow');
    if (statsRow) statsRow.style.display = 'flex';
    if (searchRow) searchRow.style.display = 'flex';
    applyFilters();
  }
}

// ---- FILTERS & UI ----
[['fi-dup','fDup'],['fi-ns','fNS'],['fi-ph','fPH'],['fi-rt','fRT']].forEach(([lid,cid]) => {
  const el = document.getElementById(lid);
  if (el) {
    el.addEventListener('click', () => {
      setTimeout(() => {
        const cb = document.getElementById(cid);
        el.classList.toggle('on', cb.checked);
        el.querySelector('.fck').textContent = cb.checked ? '✓' : '';
        applyFilters();
      }, 0);
    });
  }
});

const sinp = document.getElementById('sinp');
const ssel = document.getElementById('ssel');
if (sinp) sinp.addEventListener('input', applyFilters);
if (ssel) ssel.addEventListener('change', applyFilters);

function applyFilters() {
  let r = [...allLeads];
  const fDup = document.getElementById('fDup');
  const fNS = document.getElementById('fNS');
  const fPH = document.getElementById('fPH');
  const fRT = document.getElementById('fRT');

  if (fDup && fDup.checked) {
    const s = new Set();
    r = r.filter(l => { const k=l.name.toLowerCase().trim(); if(s.has(k))return false; s.add(k); return true; });
  }
  if (fNS && fNS.checked) r = r.filter(l => !l.website);
  if (fPH && fPH.checked) r = r.filter(l => l.phone);
  if (fRT && fRT.checked) r = r.filter(l => { const v=parseFloat(l.rating); return !isNaN(v)&&v<=3; });

  const sinp = document.getElementById('sinp');
  const q = sinp ? sinp.value.toLowerCase() : '';
  if (q) r = r.filter(l => l.name.toLowerCase().includes(q) || (l.address||'').toLowerCase().includes(q));

  const ssel = document.getElementById('ssel');
  const sort = ssel ? ssel.value : '';
  if (sort==='name') r.sort((a,b)=>a.name.localeCompare(b.name));
  else if (sort==='rating') r.sort((a,b)=>(parseFloat(b.rating)||0)-(parseFloat(a.rating)||0));
  else if (sort==='phone') r.sort((a,b)=>(b.phone?1:0)-(a.phone?1:0));
  else if (sort==='nosite') r.sort((a,b)=>(!a.website?-1:1)-(!b.website?-1:1));

  filteredLeads = r;
  const stTotal = document.getElementById('stTotal');
  const stFiltered = document.getElementById('stFiltered');
  const stRemoved = document.getElementById('stRemoved');
  const btnDL = document.getElementById('btnDL');

  if (stTotal) stTotal.textContent = allLeads.length;
  if (stFiltered) stFiltered.textContent = filteredLeads.length;
  if (stRemoved) stRemoved.textContent = allLeads.length - filteredLeads.length;
  renderCards();
  if (btnDL) btnDL.disabled = !filteredLeads.length;
}

function renderCards() {
  const c = document.getElementById('resSection');
  if (!c) return;
  if (!filteredLeads.length && !allLeads.length) return; // Keep empty state if nothing ever found
  
  if (!filteredLeads.length) {
    c.innerHTML = `<div class="empty"><div class="ei">🔍</div><div class="et">No results for filters</div></div>`;
    return;
  }
  
  c.innerHTML = filteredLeads.slice(0, 50).map((l,i)=>`
    <div class="card">
      <div class="cname">${i+1}. ${esc(l.name)}</div>
      <div class="cmeta">
        ${l.phone?`<span class="pill p-phone">📞 ${esc(l.phone)}</span>`:''}
        ${l.website?`<span class="pill p-site">🌐 Site</span>`:`<span class="pill p-nosite">❌ No Site</span>`}
        ${l.rating?`<span class="pill p-star">⭐ ${esc(l.rating)}</span>`:''}
        ${l.address?`<span class="pill p-addr">📍 ${esc(l.address.substring(0,30))}</span>`:''}
      </div>
    </div>`).join('') + (filteredLeads.length > 50 ? `<div style="text-align:center;font-size:10px;color:var(--muted);padding:5px;">+ ${filteredLeads.length-50} more leads...</div>` : '');
}

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ---- CSV ----
const btnDL = document.getElementById('btnDL');
if (btnDL) {
  btnDL.addEventListener('click', () => {
    if (!filteredLeads.length) return;
    const h = ['Business Name','Category','Rating','Reviews','Phone','Website','Address','Maps Link','Source'];
    const rows = filteredLeads.map(l=>[l.name,l.category,l.rating,l.reviews,l.phone,l.website,l.address,l.mapsLink,l.source].map(v=>`"${(v||'').replace(/"/g,'""')}"`));
    const csv = [h.join(','),...rows.map(r=>r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leads_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    setS(`✅ ${filteredLeads.length} CSV Downloaded!`, 'ok');
  });
}

const btnClr = document.getElementById('btnClr');
if (btnClr) {
  btnClr.addEventListener('click', () => {
    allLeads=[]; filteredLeads=[];
    const statsRow = document.getElementById('statsRow');
    const searchRow = document.getElementById('searchRow');
    const btnDL = document.getElementById('btnDL');
    const resSection = document.getElementById('resSection');
    if (statsRow) statsRow.style.display='none';
    if (searchRow) searchRow.style.display='none';
    if (btnDL) btnDL.disabled=true;
    if (resSection) resSection.innerHTML=`<div class="empty"><div class="ei">🗺️</div><div class="et">Data Cleared</div><div class="es">Click Start to search again.</div></div>`;
    setS('Cleared', '');
  });
}

function setS(msg, type) {
  const e = document.getElementById('sText');
  const bar = document.getElementById('sbar');
  if (e) e.textContent = msg;
  if (bar) bar.className = 'sbar' + (type==='ok'?' ok':type==='err'?' err':type==='info'?' info':'');
}
