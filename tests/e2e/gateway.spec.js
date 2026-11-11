import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

test('browser can send consent-free local analysis through the allowed origin CORS preflight',async({page})=>{
  const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
  const gateway=spawn(process.execPath,['services/ai-gateway/src/server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),AI_PROVIDER_MODE:'cloud',AI_PROVIDER_URL:'',AI_PROVIDER_API_KEY:''},stdio:'ignore'});
  try{
    const endpoint=`http://127.0.0.1:${port}/v1/evaluate`;let ready=false;
    for(let i=0;i<40;i++){try{const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({perception:{sourceRevision:'probe',elements:[]}})});if(response.status===200){ready=true;break}}catch{}await new Promise(resolve=>setTimeout(resolve,50))}
    expect(ready).toBe(true);await page.goto(process.env.CC_BASE_URL||'http://127.0.0.1:4173');
    const result=await page.evaluate(async endpoint=>{const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({aiConsent:false,perception:{sourceRevision:'browser-cors',elements:[{id:'u',type:'text',text:'Only 2 left',visible:true}]}})});return{status:r.status,result:await r.json()}},endpoint);
    expect(result.status).toBe(200);expect(result.result.mode).toBe('local-fallback');expect(result.result.findings[0].ruleId).toBe('unverified-urgency');
  }finally{gateway.kill()}
});
