// Auto-scroll + Extract — supports Google & Bing Maps
(async function() {
  const isBing = window.location.href.includes('bing.com') || window.location.href.includes('bingplaces.com');
  const source = isBing ? 'Bing Maps' : 'Google Maps';
  
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function send(type, data) { try { chrome.runtime.sendMessage({ type, data }); } catch(e) {} }

  const seen = new Set();
  const leads = [];

  function grabVisible() {
    const items = isBing 
      ? document.querySelectorAll('.b_algo, .lc_ent, [role="listitem"]') // Bing selectors
      : [
          ...document.querySelectorAll('[role="article"]'),
          ...document.querySelectorAll('[role="listitem"]'),
          ...document.querySelectorAll('.Nv2PK'),
          ...document.querySelectorAll('.lI9IFe'),
        ];

    const newBatch = [];
    items.forEach(item => {
      try {
        if (window.__leadsStop) return; 
        
        let name = '';
        if (isBing) {
          const h2 = item.querySelector('h2');
          if (h2) name = h2.textContent.trim();
        } else {
          for (const s of ['.qBF1Pd','.NrDZNb','.fontHeadlineSmall','[class*="fontHeadline"]']) {
            const el = item.querySelector(s);
            if (el?.textContent?.trim()) { name = el.textContent.trim(); break; }
          }
          if (!name) {
            const a = item.querySelector('a[aria-label]');
            if (a) name = a.getAttribute('aria-label') || '';
          }
        }
        
        if (!name || name.length < 2) return;
        const key = name.toLowerCase().trim();
        if (seen.has(key)) return;
        seen.add(key);

        let rating = '', reviews = '', category = '', address = '', phone = '', website = '', mapsLink = '';

        if (isBing) {
          rating = item.querySelector('.c_stars_rating, .b_rating')?.getAttribute('aria-label') || '';
          reviews = item.querySelector('.b_revTitle')?.textContent || '';
          category = item.querySelector('.b_address, .lc_fact_row')?.textContent || '';
          address = item.querySelector('.b_address')?.textContent || '';
          phone = (item.innerText.match(/(\+?[\d][\d\s\-()]{6,13}[\d])/) || [])[0] || '';
          website = item.querySelector('a[href]')?.href || '';
          if (website.includes('bing.com')) website = '';
          mapsLink = window.location.href;
        } else {
          rating = item.querySelector('.MW4etd')?.textContent?.trim() || '';
          reviews = item.querySelector('.UY7F9,.e4rVHe')?.textContent?.replace(/[()]/g,'')?.trim() || '';
          
          item.querySelectorAll('.W4Efsd').forEach(m => {
            const t = m.textContent.trim();
            if (t.includes('·')) {
              const p = t.split('·').map(x=>x.trim()).filter(Boolean);
              if (!category && p[0]) category = p[0];
              if (!address && p[1]) address = p[1];
            } else if (!category && t) category = t;
          });

          const pm = (item.innerText||'').match(/(\+?[\d][\d\s\-()]{6,13}[\d])/);
          if (pm) phone = pm[0].trim();

          item.querySelectorAll('a[href]').forEach(a => {
            if (!website && a.href?.startsWith('http') && !a.href.includes('google')) website = a.href;
          });
          mapsLink = item.querySelector('a[href*="/maps/place/"]')?.href || '';
        }

        const lead = { name, category, rating, reviews, phone, website, address, mapsLink, source };
        leads.push(lead);
        newBatch.push(lead);
      } catch(e) {}
    });

    if (newBatch.length > 0) {
      send('LEADS_FOUND', newBatch);
    }
  }

  // Find scroll panel
  const panel = isBing 
    ? (document.querySelector('#b_results') || window)
    : (document.querySelector('[role="feed"]') || document.querySelector('.m6QErb[aria-label]') || document.querySelector('.m6QErb'));

  if (!panel) {
    grabVisible();
    send('FINISHED', leads);
    return leads;
  }

  window.__leadsStop = false; 

  // Scroll 20 times for better coverage
  for (let i = 0; i < 20; i++) {
    if (window.__leadsStop) break;
    send('PROGRESS', { pct: Math.floor((i/20)*100), label: `Scrolling... (${leads.length} found)` });
    grabVisible();
    if (panel.scrollBy) panel.scrollBy(0, 800);
    else window.scrollBy(0, 800);
    await sleep(1500);
    if (!isBing && document.querySelector('.HlvSq, .PbZDve')) break;
  }
  
  grabVisible(); // final pass
  send('FINISHED', leads);
  return leads;
})();


