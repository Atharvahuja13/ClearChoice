import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';

const freePort=()=>19000+Math.floor(Math.random()*1000);
const startGateway=async(t,port,env={})=>{
  const child=spawn(process.execPath,['services/ai-gateway/src/server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),...env},stdio:'ignore'});t.after(()=>child.kill());
  const url=`http://127.0.0.1:${port}/v1/evaluate`;
  for(let i=0;i<40;i++){try{await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});break}catch{await new Promise(r=>setTimeout(r,50))}}
  return url;
};

test('gateway returns local fallback without consent and never requires provider secrets', async t => {
  const url=await startGateway(t,freePort(),{AI_PROVIDER_MODE:'cloud',AI_PROVIDER_API_KEY:'',AI_PROVIDER_URL:''});
  const response = await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ perception:{sourceRevision:'r',elements:[{id:'u',type:'text',text:'Only 2 left',visible:true}]}})});
  assert.equal(response.status,200);
  const result = await response.json();
  assert.equal(result.mode,'local-fallback'); assert.match(result.label,/Deterministic/); assert.equal(result.findings[0].ruleId,'unverified-urgency');
});

test('cloud consent calls the provider with minimized data and validates the returned layout',async t=>{
  let requests=0,received='';
  const provider=createServer(async(req,res)=>{requests++;const chunks=[];for await(const c of req)chunks.push(c);const call=JSON.parse(Buffer.concat(chunks));received=JSON.stringify(call);const user=JSON.parse(call.messages[1].content);const revision=user.sourceRevision;const layout={id:'safe-layout',sourceRevision:revision,style:'minimal',items:[{productId:'p1',titleSourceId:'title',priceSourceId:'price',actionSourceId:'add',detailSourceId:'detail',order:0}]};res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify({choices:[{message:{content:JSON.stringify({layout,suggestions:[]})}}]}))});
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));t.after(()=>provider.close());
  const url=await startGateway(t,freePort(),{AI_PROVIDER_MODE:'cloud',AI_PROVIDER_API_KEY:'test-secret-server-only',AI_PROVIDER_URL:`http://127.0.0.1:${provider.address().port}`,AI_PROVIDER_MODEL:'fixture'});
  const perception={sourceRevision:'https://private.example/path?token=do-not-send',appKey:'private-app',elements:[
    {id:'title',productId:'p1',type:'heading',text:'Headphones contact person@example.com',visible:true},
    {id:'price',productId:'p1',type:'text',text:'$129.00',price:'$129.00',currency:'USD',visible:true},
    {id:'add',productId:'p1',type:'button',text:'Add',visible:true,enabled:true,clickable:true,actions:['click']},
    {id:'detail',productId:'p1',type:'button',text:'Details',visible:true,enabled:true,clickable:true,actions:['click']}
  ]};
  const preview=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({perception})});
  assert.equal(preview.status,200);assert.equal(requests,0);
  const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json',origin:'http://127.0.0.1:4173'},body:JSON.stringify({perception,cloudConsent:true})});
  assert.equal(response.status,200);const result=await response.json();
  assert.equal(result.mode,'cloud-ai');assert.equal(result.layout.sourceRevision,perception.sourceRevision);assert.equal(result.layout.items[0].price,'$129.00');
  assert.equal(requests,1);assert.doesNotMatch(received,/private\.example|do-not-send|person@example\.com|test-secret-server-only/);assert.match(received,/\[email omitted\]/);
});

test('provider response cannot change a price and browser origins are restricted',async t=>{
  const provider=createServer(async(req,res)=>{for await(const _ of req){};res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify({choices:[{message:{content:JSON.stringify({layout:{id:'bad',sourceRevision:'wrong',style:'minimal',items:[]},suggestions:[]})}}]}))});
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));t.after(()=>provider.close());
  const url=await startGateway(t,freePort(),{AI_PROVIDER_MODE:'cloud',AI_PROVIDER_API_KEY:'stub',AI_PROVIDER_URL:`http://127.0.0.1:${provider.address().port}`});
  const body={perception:{sourceRevision:'r',elements:[{id:'t',productId:'p',type:'heading',text:'Lamp',visible:true},{id:'p',productId:'p',type:'text',text:'$25',price:'$25',visible:true},{id:'a',productId:'p',type:'button',text:'Add',visible:true,enabled:true,clickable:true,actions:['click']},{id:'d',productId:'p',type:'button',text:'Details',visible:true,enabled:true,clickable:true,actions:['click']}]},cloudConsent:true};
  const rejected=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});assert.equal(rejected.status,422);
  const forbidden=await fetch(url,{method:'POST',headers:{'content-type':'application/json',origin:'https://attacker.example'},body:JSON.stringify(body)});assert.equal(forbidden.status,403);
});

test('gateway server binds only to loopback by default',async t=>{
  const port=freePort(), child=spawn(process.execPath,['services/ai-gateway/src/server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),BIND_HOST:'127.0.0.1'},stdio:'ignore'});t.after(()=>child.kill());
  for(let i=0;i<40;i++){try{const r=await fetch(`http://127.0.0.1:${port}/wrong`);assert.equal(r.status,404);return}catch{await new Promise(r=>setTimeout(r,50))}}
  assert.fail('gateway did not start');
});

test('configured local AI provider falls back to deterministic local cues when unavailable',async t=>{
  const url=await startGateway(t,freePort(),{AI_PROVIDER_MODE:'local',AI_PROVIDER_URL:'http://127.0.0.1:1/v1/chat/completions',AI_PROVIDER_API_KEY:'local-test',AI_TIMEOUT_MS:'200'});
  const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cloudConsent:true,perception:{sourceRevision:'r',elements:[{id:'u',type:'text',text:'Only 2 left',visible:true}]}})});
  assert.equal(response.status,200);const result=await response.json();assert.equal(result.mode,'local-fallback');assert.equal(result.localAiUnavailable,true);assert.equal(result.findings[0].ruleId,'unverified-urgency');
});

test('dev server serves the control center and demo but blocks hidden and server paths',async t=>{
  const port=freePort(),child=spawn(process.execPath,['scripts/dev-server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),BIND_HOST:'127.0.0.1'},stdio:'ignore'});t.after(()=>child.kill());
  const base=`http://127.0.0.1:${port}`;let ready=false;
  for(let i=0;i<40;i++){try{const r=await fetch(base);if(r.status===200){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,50))}
  assert.equal(ready,true);assert.match(await(await fetch(base)).text(),/ClearChoice/);assert.equal((await fetch(`${base}/demo/`)).status,200);
  assert.equal((await fetch(`${base}/.git/config`)).status,404);assert.equal((await fetch(`${base}/services/ai-gateway/src/server.js`)).status,404);assert.equal((await fetch(`${base}/%2e%2e/package.json`)).status,404);
});

test('review mode validates model evidence and rejects stale, unknown, invented, or executable output',async t=>{
  let variant='valid',received='';
  const provider=createServer(async(req,res)=>{const chunks=[];for await(const c of req)chunks.push(c);const call=JSON.parse(Buffer.concat(chunks));received=JSON.stringify(call);const candidates=JSON.parse(call.messages[1].content).candidates;const annotations=candidates.map(c=>({...c}));if(variant==='stale')annotations[0].sourceRevision='old';if(variant==='unknown')annotations[0].sourceId='missing';if(variant==='invented')annotations[0].evidence='Invented claim';if(variant==='action')annotations[0].action='click';res.end(JSON.stringify({choices:[{message:{content:JSON.stringify({annotations})}}]}));});
  await new Promise(r=>provider.listen(0,'127.0.0.1',r));t.after(()=>provider.close());
  const url=await startGateway(t,freePort(),{AI_PROVIDER_MODE:'local',AI_PROVIDER_URL:`http://127.0.0.1:${provider.address().port}`});
  const body={requestKind:'review',aiConsent:true,perception:{sourceRevision:'private-revision',elements:[{id:'private-extra',type:'button',text:'Add protection plan',checked:true,visible:true},{id:'private-stock',type:'text',text:'Only 2 left',visible:true},{id:'private-terms',type:'text',text:'Additional charges may apply',visible:true}]}};
  const request=()=>fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const response=await request();assert.equal(response.status,200);const result=await response.json();assert.equal(result.mode,'local-ai-review');assert.equal(result.layout,null);assert.equal(result.suggestions.length,3);assert.deepEqual(result.suggestions.map(s=>s.sourceId),body.perception.elements.map(e=>e.id));assert.doesNotMatch(received,/private-revision|private-extra|private-stock|private-terms/);
  for(variant of ['stale','unknown','invented','action'])assert.equal((await request()).status,422,variant);
});
