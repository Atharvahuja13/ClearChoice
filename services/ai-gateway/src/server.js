import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { analyzePerception, createReviewAnnotations, isSensitiveText, normalizePerception, validateLayoutSpec, validateSuggestions } from '../../../packages/engine/src/index.js';

const PORT=Number(process.env.PORT||8787), HOST=process.env.BIND_HOST||'127.0.0.1';
const PROVIDER_MODE=process.env.AI_PROVIDER_MODE||'local';
const API_KEY=process.env.AI_PROVIDER_API_KEY||(PROVIDER_MODE==='local'?'ollama-local':'');
const PROVIDER_URL=process.env.AI_PROVIDER_URL||(PROVIDER_MODE==='local'?'http://127.0.0.1:11434/v1/chat/completions':'');
const MODEL=process.env.AI_PROVIDER_MODEL||(PROVIDER_MODE==='local'?'qwen3:4b-instruct':'configured-model');
const TIMEOUT_MS=Math.min(Number(process.env.AI_TIMEOUT_MS||20000),45000), RATE=Math.min(Number(process.env.AI_RATE_LIMIT_PER_MINUTE||30),300);
const MAX_BODY=1_000_000, MAX_PROVIDER_BODY=250_000, CACHE_TTL=300_000, CACHE_MAX=200;
const allowedOrigins=new Set((process.env.UI_ORIGINS||'http://127.0.0.1:4173,http://localhost:4173').split(',').map(x=>x.trim()).filter(Boolean));
const cache=new Map(), requests=new Map();
const digest=value=>createHash('sha256').update(value).digest('hex');

function sanitize(snapshot){
  const safeRevision=digest(snapshot.sourceRevision).slice(0,24);
  const redact=text=>String(text||'').replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[email omitted]').replace(/https?:\/\/\S+/gi,'[link omitted]').replace(/\b(?:\+?\d[\d ().-]{7,}\d)\b/g,'[number omitted]');
  return normalizePerception({sourceRevision:safeRevision,elements:snapshot.elements.map(e=>({id:e.id,productId:e.productId,type:e.type,text:isSensitiveText(e.text)?'[sensitive content omitted]':redact(e.text),visible:e.visible,enabled:e.enabled,clickable:e.clickable,scrollable:e.scrollable,actions:e.actions,label:e.label?redact(e.label):undefined,checked:e.checked,primary:e.primary,price:e.price,currency:e.currency,bounds:e.bounds}))});
}
function localResult(snapshot){return{mode:'local-fallback',label:'Deterministic local review cues · AI unavailable or not selected',findings:analyzePerception(snapshot),suggestions:[],layout:null};}
function checkRate(key){const now=Date.now(),recent=(requests.get(key)||[]).filter(t=>now-t<60000);if(recent.length>=RATE)return false;recent.push(now);requests.set(key,recent);if(requests.size>5000)for(const[k,v]of requests)if(!v.some(t=>now-t<60000))requests.delete(k);return true;}
function cacheGet(key){const entry=cache.get(key);if(!entry)return null;if(entry.expires<Date.now()){cache.delete(key);return null}return entry.value}
function cacheSet(key,value){cache.set(key,{value,expires:Date.now()+CACHE_TTL});if(cache.size>CACHE_MAX){const oldest=cache.keys().next().value;cache.delete(oldest)}}
async function readProviderResponse(response,controller){
  if(!response.ok)throw new Error('provider failure');
  const reader=response.body?.getReader();if(!reader)throw new Error('provider response missing body');
  const chunks=[];let size=0;
  while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_PROVIDER_BODY){controller.abort();throw new Error('provider response too large')}chunks.push(value)}
  return new TextDecoder().decode(Buffer.concat(chunks));
}
async function evaluate(body){
  const snapshot=normalizePerception(body?.perception);
  if(body.requestKind!=null&&!['review','layout'].includes(body.requestKind))throw new TypeError('requestKind must be review or layout');
  if(body.requestKind==='review')return evaluateReview(snapshot,body.aiConsent===true||body.cloudConsent===true);
  const style=body.layoutStyle??'balanced';
  if(!['balanced','minimal','accessible'].includes(style))throw new TypeError('layoutStyle must be balanced, minimal, or accessible');
  const intent=typeof body.layoutIntent==='string'?body.layoutIntent.trim().slice(0,300):'';
  if(isSensitiveText(intent))throw new TypeError('sensitive layout instructions are not accepted');
  if(body.aiConsent!==true&&body.cloudConsent!==true)return localResult(snapshot);
  if(!API_KEY||!PROVIDER_URL)return{...localResult(snapshot),cloudUnavailable:true};
  const safe=sanitize(snapshot),safeIntent=intent.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[email omitted]').replace(/https?:\/\/\S+/gi,'[link omitted]'),key=digest(JSON.stringify([PROVIDER_MODE,MODEL,style,safeIntent,safe]));
  const cached=cacheGet(key);if(cached)return cached;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try{
    let response;
    const schema={type:'object',additionalProperties:false,required:['layout','suggestions'],properties:{layout:{type:'object',additionalProperties:false,required:['id','sourceRevision','style','items'],properties:{id:{type:'string'},sourceRevision:{type:'string'},style:{type:'string',enum:['balanced','minimal','accessible']},items:{type:'array',items:{type:'object',additionalProperties:false,required:['productId','titleSourceId','priceSourceId','actionSourceId','order'],properties:{productId:{type:'string'},titleSourceId:{type:'string'},priceSourceId:{type:'string'},actionSourceId:{type:'string'},detailSourceId:{type:'string'},order:{type:'integer',minimum:0}}}}}},suggestions:{type:'array',items:{type:'object',additionalProperties:false,required:['id','sourceId','sourceRevision','ruleId','kind','text'],properties:{id:{type:'string'},sourceId:{type:'string'},sourceRevision:{type:'string'},ruleId:{type:'string'},kind:{type:'string',enum:['annotation','rewrite']},text:{type:'string'}}}}}};
    try{response=await fetch(PROVIDER_URL,{method:'POST',signal:controller.signal,headers:{'content-type':'application/json',authorization:`Bearer ${API_KEY}`},body:JSON.stringify({model:MODEL,stream:false,max_tokens:4096,response_format:{type:'json_schema',json_schema:{name:'clearchoice_layout',strict:true,schema}},messages:[{role:'system',content:`Return a non-null source-only shopping layout in the requested ${style} style. Include each supplied product exactly once in an intentional order. Follow the user's layout intent using reordering only; do not hide items. For every product use its original productId, heading source ID for titleSourceId, price source ID for priceSourceId, Add button source ID for actionSourceId, and optional original details source ID. Never invent or rewrite a product, title, price, currency, quantity, seller, variant, or store action. suggestions must be an empty array. Return sourceRevision unchanged. No markdown.`},{role:'user',content:JSON.stringify({layoutStyle:style,layoutIntent:safeIntent,sourceRevision:safe.sourceRevision,elements:safe.elements.map(({id,productId,type,text,visible,enabled,clickable,scrollable,actions,label,checked,primary,price,currency})=>({id,productId,type,text,visible,enabled,clickable,scrollable,actions,label,checked,primary,price,currency}))})}]})});}
    catch(error){if(PROVIDER_MODE==='local')return{...localResult(snapshot),localAiUnavailable:true};throw error}
    if(!response.ok){if(PROVIDER_MODE==='local')return{...localResult(snapshot),localAiUnavailable:true};throw new Error('provider failure')}
    const raw=await readProviderResponse(response,controller);let payload;
    try{payload=JSON.parse(raw)}catch{throw new Error('provider response was not JSON')}
    const content=payload.choices?.[0]?.message?.content??payload.message?.content??payload;
    const parsed=typeof content==='string'?JSON.parse(content):content;
    if(!parsed||Object.keys(parsed).length!==2||!Object.hasOwn(parsed,'layout')||!Object.hasOwn(parsed,'suggestions')||!Array.isArray(parsed.suggestions))throw new Error('provider response schema invalid');
    const suggestions=validateSuggestions(safe,parsed.suggestions).map(s=>({...s,sourceRevision:snapshot.sourceRevision}));
    let layout=null;
    if(parsed.layout===null&&safe.elements.some(e=>e.productId&&e.type==='heading'))throw new Error('layout is required for a product catalog');
    if(parsed.layout!==null){layout=validateLayoutSpec(safe,parsed.layout);layout={...layout,sourceRevision:snapshot.sourceRevision}}
    const result={mode:PROVIDER_MODE==='local'?'local-ai':'cloud-ai',label:PROVIDER_MODE==='local'?'Local AI · Ollama':'Cloud AI suggestions',findings:analyzePerception(snapshot),suggestions,layout};
    cacheSet(key,result);return result;
  }finally{clearTimeout(timeout)}
}

async function evaluateReview(snapshot,consent){
  const findings=analyzePerception(snapshot),suggestions=createReviewAnnotations(snapshot);
  const local={mode:'local-review',label:'Local source evidence review',findings,suggestions,layout:null};
  if(!consent||!findings.length)return local;
  if(!API_KEY||!PROVIDER_URL)return{...local,localAiUnavailable:true};
  const sanitized=sanitize(snapshot),aliases=new Map(sanitized.elements.map((e,i)=>[e.id,`s${i+1}`]));
  const safe=normalizePerception({...sanitized,elements:sanitized.elements.map(e=>({...e,id:aliases.get(e.id)}))});
  const cues=analyzePerception(safe),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try{
    const schema={type:'object',additionalProperties:false,required:['annotations'],properties:{annotations:{type:'array',items:{type:'object',additionalProperties:false,required:['sourceId','sourceRevision','ruleId','evidence','verification'],properties:{sourceId:{type:'string'},sourceRevision:{type:'string'},ruleId:{type:'string'},evidence:{type:'string'},verification:{type:'string',enum:['observed','unverified']}}}}}};
    let response;
    try{response=await fetch(PROVIDER_URL,{method:'POST',signal:controller.signal,headers:{'content-type':'application/json',authorization:`Bearer ${API_KEY}`},body:JSON.stringify({model:MODEL,stream:false,max_tokens:2048,response_format:{type:'json_schema',json_schema:{name:'source_review',strict:true,schema}},messages:[{role:'system',content:'Review these source-anchored candidate cues. Return each candidate exactly once using its exact sourceId, sourceRevision, ruleId, evidence and verification. Selected checkbox state is observed; urgency truth and unspecified charge conditions remain unverified. Do not invent facts, actions, rewrites or layout. Return JSON only.'},{role:'user',content:JSON.stringify({sourceRevision:safe.sourceRevision,candidates:cues.map(({sourceId,sourceRevision,ruleId,evidence,verification})=>({sourceId,sourceRevision,ruleId,evidence,verification}))})}]})});}catch{ return{...local,localAiUnavailable:true}; }
    if(!response.ok)return{...local,localAiUnavailable:true};
    const payload=JSON.parse(await readProviderResponse(response,controller));
    const content=payload.choices?.[0]?.message?.content??payload.message?.content;
    const parsed=typeof content==='string'?JSON.parse(content):content;
    if(!parsed||Object.keys(parsed).length!==1||!Array.isArray(parsed.annotations)||parsed.annotations.length!==cues.length)throw new Error('invalid review output');
    const seen=new Set();
    for(const item of parsed.annotations){
      if(!item||Object.keys(item).sort().join(',')!=='evidence,ruleId,sourceId,sourceRevision,verification')throw new Error('invalid review fields');
      const key=JSON.stringify([item.sourceId,item.ruleId]),cue=cues.find(c=>c.sourceId===item.sourceId&&c.ruleId===item.ruleId);
      if(!cue||seen.has(key)||item.sourceRevision!==safe.sourceRevision||item.evidence!==cue.evidence||item.verification!==cue.verification)throw new Error('invalid or stale review source evidence');
      seen.add(key);
    }
    return{...local,mode:PROVIDER_MODE==='local'?'local-ai-review':'cloud-ai-review',label:PROVIDER_MODE==='local'?'Local AI review · source evidence checked':'AI review · source evidence checked'};
  }finally{clearTimeout(timeout)}
}
function write(res,status,value,origin){
  const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','vary':'Origin'};
  if(origin&&allowedOrigins.has(origin))headers['access-control-allow-origin']=origin;
  res.writeHead(status,headers).end(JSON.stringify(value));
}
const server=createServer((req,res)=>{
  const origin=req.headers.origin;
  if(origin&&!allowedOrigins.has(origin)){write(res,403,{error:'origin_not_allowed'});return}
  if(req.method==='OPTIONS'){
    const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','vary':'Origin','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type','access-control-max-age':'600'};
    if(origin&&allowedOrigins.has(origin))headers['access-control-allow-origin']=origin;
    res.writeHead(204,headers).end();return;
  }
  if(req.method!=='POST'||req.url!=='/v1/evaluate'){write(res,404,{error:'not_found'},origin);return}
  if(!checkRate(req.socket.remoteAddress||'unknown')){write(res,429,{error:'rate_limited'},origin);return}
  let raw='',tooLarge=false;
  req.on('data',chunk=>{raw+=chunk;if(raw.length>MAX_BODY){tooLarge=true;raw='';req.resume()}});
  req.on('end',async()=>{
    if(tooLarge){write(res,413,{error:'request_too_large'},origin);return}
    let body;try{body=JSON.parse(raw)}catch{write(res,400,{error:'invalid_request'},origin);return}
    try{write(res,200,await evaluate(body),origin)}
    catch(error){const badInput=error instanceof TypeError||/sourceRevision|elements|must be|element \d/.test(error.message);const invalidOutput=/stale|unknown|duplicate|invalid|sensitive|allowed|price|currency|action|layout|revision|visible/i.test(error.message);write(res,badInput?400:invalidOutput?422:502,{error:badInput?'invalid_request':invalidOutput?'invalid_suggestion':'evaluation_failed'},origin)}
  });
});
server.listen(PORT,HOST,()=>process.stdout.write(`ClearChoice AI gateway listening on http://${HOST}:${PORT}\n`));
