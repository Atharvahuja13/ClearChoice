(async () => {
  if (window.__clearChoiceInstalled) return;
  window.__clearChoiceInstalled = true;
  let engine;
  try { engine = await import(chrome.runtime.getURL('src/index.js')); } catch (error) { console.error('ClearChoice engine module unavailable',error); window.__clearChoiceInstalled = false; return; }
  let mountShoppingAdapter;
  try { ({mountShoppingAdapter}=await import(chrome.runtime.getURL('src/browser-adapter.js'))); } catch (error) { console.error('ClearChoice browser adapter module unavailable',error); window.__clearChoiceInstalled = false; return; }
  const { normalizePerception } = engine;
  const ATTR = 'data-clearchoice-id';
  const originals = new Map();
  const generatedIds = new WeakSet();
  const usedActionIds = new Set();
  let enabled = true, paused = false, applying = false, dismissed = false, timer;
  let highlighted = null;
  let shopping = null;
  const actionable = el => /^(A|BUTTON)$/.test(el.tagName) || el.getAttribute('role') === 'button' || el.hasAttribute('onclick');
  const eligible = el => el instanceof HTMLElement && !el.closest('[data-clearchoice-ui],[data-cc-adapter-ui]') && !['SCRIPT','STYLE','NOSCRIPT','SVG','PATH','INPUT','TEXTAREA','SELECT','OPTION'].includes(el.tagName) && el.getClientRects().length;
  const protectedScreen = () => !!document.querySelector('input[type="password"],input[autocomplete*="cc-"],input[name*="card" i],input[name*="security" i],input[name*="otp" i]') || /\b(sign in|log in|checkout|payment|verify identity|security code)\b/i.test(`${document.title} ${location.pathname}`);
  function collect() {
    const elements = [];
    const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_ELEMENT);
    let el;
    while ((el = walker.nextNode()) && elements.length < 1000) {
      if (!eligible(el)) continue;
      const rect = el.getBoundingClientRect();
      const text = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g,' ').slice(0,500);
      if (!text && !actionable(el)) continue;
      let id = el.getAttribute(ATTR);
      if (!id) { id = crypto.randomUUID(); el.setAttribute(ATTR,id); generatedIds.add(el); }
      const price = el.hasAttribute('data-cc-price') ? text : undefined;
      const currency = el.getAttribute('data-cc-currency') || undefined;
      elements.push({ id, type:el.matches('[role="banner"],header') ? 'banner' : el.tagName === 'BUTTON' ? 'button' : el.tagName === 'A' ? 'link' : el.matches('h1,h2,h3,h4') ? 'heading' : el.matches('input[type="checkbox"]') ? 'checkbox' : 'text', text, visible:true, enabled:!el.matches(':disabled,[aria-disabled="true"]'), clickable:actionable(el), scrollable:el.scrollHeight > el.clientHeight + 2, bounds:{ x:rect.x, y:rect.y, width:rect.width, height:rect.height }, actions:actionable(el) ? [el.tagName === 'A' ? 'navigate' : 'click'] : [], ...(price ? {price,currency}: {}) });
    }
    const canonical = JSON.stringify([location.pathname, elements.map(e => [e.id,e.type,e.text,e.enabled,e.clickable,e.price,e.currency])]);
    let hash = 2166136261; for (let i=0;i<canonical.length;i++) { hash ^= canonical.charCodeAt(i); hash = Math.imul(hash,16777619); }
    return normalizePerception({ sourceRevision:`${location.pathname}#${(hash>>>0).toString(16)}`, elements, appKey:location.hostname, screenKey:location.pathname });
  }
  function getTarget(id) { return [...document.querySelectorAll(`[${ATTR}]`)].find(n => n.getAttribute(ATTR) === id); }
  function restore() {
    shopping?.restore(); shopping=null;
    if (highlighted) { highlighted.style.outline = highlighted.dataset.ccOldOutline || ''; delete highlighted.dataset.ccOldOutline; highlighted = null; }
    for (const [id, original] of originals) { const el = getTarget(id); if (!el) continue; el.textContent = original.text; if (original.aria == null) el.removeAttribute('aria-label'); else el.setAttribute('aria-label',original.aria); }
    originals.clear(); document.getElementById('clearchoice-layer')?.remove(); document.getElementById('clearchoice-shop')?.remove(); document.getElementById('clearchoice-shop-launch')?.remove(); document.getElementById('clearchoice-shop-style')?.remove();
    document.querySelectorAll(`[${ATTR}]`).forEach(el => { if (generatedIds.has(el)) el.removeAttribute(ATTR); });
  }
  function render(findings) {
    document.getElementById('clearchoice-layer')?.remove();
    if (!findings.length) return;
    const panel = document.createElement('aside'); panel.id = 'clearchoice-layer'; panel.dataset.clearchoiceUi = 'true';
    Object.assign(panel.style,{ position:'fixed', right:'16px', bottom:'16px', zIndex:'2147483647', width:'min(340px,calc(100vw - 32px))', maxHeight:'45vh', overflow:'auto', padding:'14px', borderRadius:'12px', background:'#102a43', color:'white', boxShadow:'0 8px 30px #0005', font:'14px/1.45 system-ui,sans-serif' });
    const heading = document.createElement('div'); Object.assign(heading.style,{display:'flex',justifyContent:'space-between',alignItems:'center'});
    const title = document.createElement('strong'); title.textContent = 'ClearChoice · review cues'; heading.append(title);
    const close = document.createElement('button'); close.type='button'; close.textContent='Dismiss'; close.setAttribute('aria-label','Dismiss ClearChoice cues'); Object.assign(close.style,{background:'transparent',border:'1px solid #9fb3c8',borderRadius:'6px',padding:'4px 7px',color:'white',cursor:'pointer'}); close.addEventListener('click',() => { dismissed=true; panel.remove(); }); heading.append(close); panel.append(heading);
    for (const f of findings.slice(0,8)) {
      const row = document.createElement('div'); Object.assign(row.style,{marginTop:'8px',paddingTop:'7px',borderTop:'1px solid #486581'});
      const text = document.createElement('div'); text.textContent = `${f.label}: ${f.text}`; row.append(text);
      const show = document.createElement('button'); show.type='button'; show.textContent='Show source'; show.setAttribute('aria-label',`Show original page text: ${f.text}`); Object.assign(show.style,{marginTop:'4px',background:'transparent',border:0,padding:0,color:'#9fb3c8',textDecoration:'underline',cursor:'pointer'});
      show.addEventListener('click',() => { if (highlighted) { highlighted.style.outline=highlighted.dataset.ccOldOutline || ''; delete highlighted.dataset.ccOldOutline; } highlighted=getTarget(f.sourceId); if (highlighted) { highlighted.dataset.ccOldOutline=highlighted.style.outline; highlighted.style.outline='3px solid #f6c453'; highlighted.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(() => { if (highlighted) { highlighted.style.outline=highlighted.dataset.ccOldOutline || ''; delete highlighted.dataset.ccOldOutline; highlighted=null; } },3000); } }); row.append(show); panel.append(row);
    }
    document.documentElement.append(panel);
  }
  const labels = { 'preselected-extras':'Preselected extra', 'hidden-fees':'Fee may need review', 'unverified-urgency':'Urgency claim (unverified)', confirmshaming:'Pressuring wording', 'unequal-choices':'Choice may be harder to find', 'confusing-navigation':'Navigation may be unclear', clutter:'Visual clutter', 'accessibility-barriers':'Accessibility cue', 'ambiguous-terms':'Ambiguous term' };
  function analyze(snapshot) {
    const patterns = { 'preselected-extras':/\b(add|include|subscribe|protection|warranty)\b/i, 'hidden-fees':/\b(service|processing|delivery|handling|convenience) fee\b/i, 'unverified-urgency':/\b(only \d+ left|ends in|expires in|last chance|selling fast)\b/i, confirmshaming:/\b(no,? i (?:do not|don't|won't) want|i prefer to pay more|i hate saving|miss out on savings)\b/i, 'unequal-choices':/\b(no thanks|decline|reject)\b/i, 'confusing-navigation':/\b(back|cancel|continue|close)\b/i, clutter:/\b(advertisement|sponsored)\b/i, 'accessibility-barriers':/\b(click here|learn more)\b/i, 'ambiguous-terms':/\b(as applicable|may apply|subject to terms|additional charges)\b/i };
    return snapshot.elements.flatMap(e => Object.entries(patterns).filter(([,r]) => r.test(e.text)).map(([ruleId]) => ({ sourceId:e.id, ruleId, label:labels[ruleId], text:e.text.slice(0,160) })));
  }
  function scan() {
    if (!enabled || paused || applying || !document.body || protectedScreen()) { restore(); return; }
    if (dismissed) return;
    const findings = analyze(collect()); render(findings);
    if ((!shopping || shopping.available===false) && document.querySelector('[data-cc-product]')) shopping=mountShoppingAdapter({root:document,onActivity:e=>{ if(window.CC_LOG) window.CC_LOG(`Original store action ${e.verified?'verified':'unverified'}; cart count ${e.count ?? 'not observed'}`,e.verified); }});
    else if (shopping?.available) shopping.refresh();
  }
  const schedule = () => { clearTimeout(timer); timer = setTimeout(scan,180); };
  const isUiNode = n => n.nodeType === 1 && (n.matches?.('[data-clearchoice-ui],[data-cc-adapter-ui]') || n.closest?.('[data-clearchoice-ui],[data-cc-adapter-ui]') || n.querySelector?.('[data-clearchoice-ui],[data-cc-adapter-ui]'));
  const observer = new MutationObserver(records => { if (records.some(r => r.target !== highlighted && !r.target.parentElement?.closest('[data-clearchoice-ui]') && ![...r.addedNodes,...r.removedNodes].some(isUiNode))) { dismissed=false; schedule(); } });
  observer.observe(document.documentElement,{ subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['disabled','aria-disabled','checked','class','style'] });
  chrome.runtime.onMessage.addListener(message => { if (message?.type === 'STATE_CHANGED') { enabled = message.state.enabled !== false; paused = message.state.paused === true; dismissed=false; schedule(); } if (message?.type === 'RESTORE') { enabled=false; observer.disconnect(); restore(); } });
  scan();
})();
