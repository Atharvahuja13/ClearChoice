import { test, expect, chromium } from '@playwright/test';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test('unpacked MV3 extension loads its shared modules and keeps site access opt-in', async () => {
  const extensionPath=resolve('apps/browser-extension'), profile=await mkdtemp(join(tmpdir(),'cc-extension-'));
  const context=await chromium.launchPersistentContext(profile,{headless:true,channel:'chromium',args:[`--disable-extensions-except=${extensionPath}`,`--load-extension=${extensionPath}`]});
  try {
    let worker=context.serviceWorkers().find(w=>w.url().endsWith('/src/background.js'));
    if(!worker)worker=await context.waitForEvent('serviceworker',{timeout:15000});
    const id=new URL(worker.url()).host;
    const tab=await context.newPage();await tab.goto(`chrome-extension://${id}/popup.html`);
    await expect(tab.getByRole('heading',{name:'ClearChoice'})).toBeVisible();
    await expect(tab.getByLabel('Enable globally')).toBeVisible();
    const access=await tab.evaluate(()=>chrome.permissions.contains({origins:['http://127.0.0.1:4173/*']}));
    expect(access).toBe(false);
    const moduleResponse=await tab.evaluate(async()=>{const url=chrome.runtime.getURL('src/browser-adapter.js');return fetch(url).then(r=>({ok:r.ok,type:r.headers.get('content-type')}))});
    expect(moduleResponse.ok).toBe(true);
    expect(moduleResponse.type).toContain('javascript');
  } finally { await context.close();await rm(profile,{recursive:true,force:true}); }
});

test('pregranted localhost permission injects shared adapter, maps source actions once, pauses, restores, and re-enables',async()=>{
  const profile=await mkdtemp(join(tmpdir(),'cc-extension-flow-')),extensionPath=join(profile,'extension');
  await cp(resolve('apps/browser-extension'),extensionPath,{recursive:true});
  const manifestPath=join(extensionPath,'manifest.json'),manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  // The test profile pre-grants exactly the local fixture host. Production still requests it with optional_host_permissions.
  delete manifest.optional_host_permissions;manifest.host_permissions=['http://127.0.0.1:4173/*'];await writeFile(manifestPath,JSON.stringify(manifest,null,2));
  const context=await chromium.launchPersistentContext(join(profile,'profile'),{headless:true,channel:'chromium',args:[`--disable-extensions-except=${extensionPath}`,`--load-extension=${extensionPath}`]});
  try{
    let worker=context.serviceWorkers().find(w=>w.url().endsWith('/src/background.js'));if(!worker)worker=await context.waitForEvent('serviceworker',{timeout:15000});
    const extensionId=new URL(worker.url()).host,site=`http://127.0.0.1:4173`,origin=site;
    const tab=await context.newPage();tab.on('console',message=>{if(message.type()==='error')process.stderr.write(`extension fixture: ${message.text()}\n`)});await tab.goto(`${site}/apps/browser-extension/test-fixture.html`);
    // Playwright Page objects do not expose Chrome's numeric tab ID. Resolve it from the extension worker,
    // which has the `tabs` API, before asking the background worker to inject into this existing tab.
    const tabId=await worker.evaluate(async url=>(await chrome.tabs.query({url}))[0]?.id,`${site}/apps/browser-extension/test-fixture.html`);
    expect(tabId).toEqual(expect.any(Number));
    await expect(tab.locator('#cc-adapter-launch')).toHaveCount(0);
    const popup=await context.newPage();await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    const sitePermission=await popup.evaluate(origin=>chrome.permissions.contains({origins:[`${origin}/*`]}),origin);expect(sitePermission).toBe(true);
    const message=(type,extra={})=>popup.evaluate(({type,extra,origin,tabId})=>chrome.runtime.sendMessage({type,origin,tabId,...extra}),{type,extra,origin,tabId});
    let state=await message('SET_SITE',{enabled:true});expect(state.hosts[origin]).toBe(true);
    await expect(tab.locator('#cc-adapter-launch')).toBeVisible();
    await tab.getByRole('button',{name:'Open ClearChoice shopping mode'}).click();
    await expect(tab.locator('#cc-adapter-panel .cc-card')).toHaveCount(1);
    await tab.locator('#cc-adapter-panel .cc-card').getByRole('button',{name:'Add to cart'}).click();
    await expect(tab.locator('[data-cc-cart-count]')).toHaveText('1');
    await expect(tab.locator('#cc-adapter-panel')).toContainText('Added once; cart count verified.');
    await tab.locator('#cc-adapter-panel [data-refresh]').click();
    await tab.locator('#cc-adapter-panel .cc-card').getByRole('button',{name:'Details & variants'}).click();
    await expect(tab.locator('#detail')).toBeVisible();
    await tab.locator('#variant').selectOption('Graphite');
    await tab.locator('#detail [data-detail-add]').click();
    await expect(tab.locator('[data-cc-cart-count]')).toHaveText('2');
    await expect(tab.locator('#cartline')).toContainText('Graphite');
    state=await message('SET_STATE',{patch:{paused:true}});expect(state.paused).toBe(true);
    await expect(tab.locator('#cc-adapter-launch')).toHaveCount(0);
    await message('SET_STATE',{patch:{paused:false}});
    await expect(tab.locator('#cc-adapter-launch')).toBeVisible();
    await message('SET_SITE',{enabled:false});
    await expect(tab.locator('#cc-adapter-launch')).toHaveCount(0);
    await expect(tab.locator('[data-cc-adapter-source]')).toHaveCount(0);
    state=await message('SET_SITE',{enabled:true});expect(state.hosts[origin]).toBe(true);
    await expect(tab.locator('#cc-adapter-launch')).toBeVisible();
  }finally{await context.close();await rm(profile,{recursive:true,force:true})}
});
