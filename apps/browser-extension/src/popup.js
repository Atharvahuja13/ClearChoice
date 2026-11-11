const send = message => chrome.runtime.sendMessage(message);
const enabled = document.getElementById('enabled'), paused = document.getElementById('paused'), site = document.getElementById('site');
const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
const origin = (() => { try { return new URL(tab.url).origin; } catch { return 'This page'; } })();
const siteToggle = document.getElementById('site-toggle');
const response = await send({ type:'GET_STATE' });
enabled.checked = response.enabled !== false; paused.checked = response.paused === true;
let siteEnabled = response.hosts?.[origin] === true;
const supportedOrigin=/^https?:\/\//.test(origin);
site.textContent = `Current site: ${origin}${siteEnabled ? ' · enabled' : ' · permission needed'}`;
siteToggle.textContent = supportedOrigin ? (siteEnabled ? 'Disable on this site' : 'Enable on this site') : 'Site not supported';
siteToggle.disabled = !supportedOrigin;
siteToggle.addEventListener('click', async () => {
  if (!siteEnabled) {
    const granted = await chrome.permissions.request({ origins:[`${origin}/*`] });
    if (!granted) { site.textContent = 'Site permission was not granted.'; return; }
  }
  const result = await send({ type:'SET_SITE', origin, tabId:tab.id, enabled:!siteEnabled });
  if (result?.error) site.textContent = result.error;
  else {
    siteEnabled = !siteEnabled;
    if (!siteEnabled) await chrome.permissions.remove({ origins:[`${origin}/*`] });
    siteToggle.textContent = siteEnabled ? 'Disable on this site' : 'Enable on this site';
    site.textContent = `Current site: ${origin}${siteEnabled ? ' · enabled' : ' · permission needed'}`;
  }
});
enabled.addEventListener('change', () => send({ type:'SET_STATE', patch:{ enabled:enabled.checked } }));
paused.addEventListener('change', () => send({ type:'SET_STATE', patch:{ paused:paused.checked } }));
