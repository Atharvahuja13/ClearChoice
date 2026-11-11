import { normalizePerception, validateBridgeAction, validateLayoutSpec, verifyObservedResult } from './index.js';

const ATTR='data-cc-adapter-source';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const visible=el=>!!el && el.getClientRects().length>0 && !el.closest('[hidden],.hidden,[aria-hidden="true"]');
const isProtected=document=>!!document.querySelector('input[type="password"],input[autocomplete*="cc-"],input[name*="card" i],input[name*="security" i],input[name*="otp" i]') || /\b(sign in|log in|checkout|payment|verify identity|security code)\b/i.test(`${document.title} ${document.location.pathname}`);

/** Mount a user initiated, source-backed product layout. `root` is Document or a same-origin iframe document. */
export function mountShoppingAdapter({ root=globalThis.document, container=root.documentElement, onActivity=()=>{} }={}) {
  if (!root?.querySelector || !container) throw new TypeError('A document root is required');
  if(root.getElementById('cc-adapter-launch'))return Object.freeze({available:true,refresh:()=>false,restore:()=>{}});
  const cartNode=()=>root.querySelector('[data-cc-cart-count]');
  const products=()=>[...root.querySelectorAll('[data-cc-product]')].filter(card=>card.querySelector('[data-cc-price]')&&card.querySelector('[data-add][data-cc-action="add-to-cart"]'));
  if (!products().length) return Object.freeze({available:false,refresh:()=>false,restore:()=>{}});
  const generated=new WeakSet(), used=new Set(); let destroyed=false, timer, selectedLayout=null;
  const idFor=el=>{ let id=el.getAttribute(ATTR); if(!id){ id=crypto.randomUUID();el.setAttribute(ATTR,id);generated.add(el); } return id; };
  const nodes=()=>{
    const values=[];
    for(const card of products()){
      const title=card.querySelector('h3'),price=card.querySelector('[data-cc-price]'),action=card.querySelector('[data-add][data-cc-action="add-to-cart"]'),detail=card.querySelector('[data-detail]');
      for(const [node,type] of [[title,'heading'],[price,'text'],[action,'button'],[detail,'button']]) if(node&&visible(node)) values.push({id:idFor(node),productId:card.dataset.ccProduct,type,text:(node.innerText||node.textContent||'').trim().replace(/\s+/g,' ').slice(0,500),visible:true,enabled:!node.matches(':disabled,[aria-disabled="true"]'),clickable:node===action||node===detail,scrollable:false,bounds:(()=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})(),actions:node===action||node===detail?['click']:[],...(node===price?{price:(node.innerText||node.textContent||'').trim(),currency:node.getAttribute('data-cc-currency')||undefined}:{})});
    }
    for(const node of root.querySelectorAll('[data-cc-action="add-to-cart"], [data-cc-cart-count]')) if(visible(node)&&!values.some(x=>x.id===node.getAttribute(ATTR))){
      const action=node.matches('[data-cc-action="add-to-cart"]');
      values.push({id:idFor(node),type:action?'button':'text',text:(node.innerText||node.textContent||'').trim().replace(/\s+/g,' ').slice(0,500),visible:true,enabled:!node.matches(':disabled,[aria-disabled="true"]'),clickable:action,scrollable:false,bounds:(()=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})(),actions:action?['click']:[]});
    }
    const modal=root.querySelector('.modal:not(.hidden),[role="dialog"]:not([hidden])');
    if(modal&&visible(modal)) values.push({id:'cc-visible-details',type:'text',text:(modal.innerText||'').trim().replace(/\s+/g,' ').slice(0,500),visible:true,enabled:true,clickable:false,scrollable:false,bounds:{x:0,y:0,width:0,height:0},actions:[]});
    const canonical=JSON.stringify([root.location?.pathname||'',values.map(e=>[e.id,e.type,e.text,e.enabled,e.price,e.currency])]);let hash=2166136261;for(let i=0;i<canonical.length;i++){hash^=canonical.charCodeAt(i);hash=Math.imul(hash,16777619)}
    return normalizePerception({sourceRevision:`${root.location?.pathname||''}#${(hash>>>0).toString(16)}`,appKey:root.location?.hostname||'',screenKey:root.location?.pathname||'',elements:values});
  };
  const get=id=>[...root.querySelectorAll(`[${ATTR}]`)].find(node=>node.getAttribute(ATTR)===id);
  const layoutFor=snapshot=>validateLayoutSpec(snapshot,{id:'original-source-order',sourceRevision:snapshot.sourceRevision,style:'balanced',items:products().map((card,order)=>{const detail=card.querySelector('[data-detail]');return{productId:card.dataset.ccProduct,titleSourceId:idFor(card.querySelector('h3')),priceSourceId:idFor(card.querySelector('[data-cc-price]')),actionSourceId:idFor(card.querySelector('[data-add][data-cc-action="add-to-cart"]')),...(detail?{detailSourceId:idFor(detail)}:{}),order}})});
  const style=root.createElement('style');style.dataset.ccAdapterUi='true';style.textContent='#cc-adapter-launch{position:fixed;left:16px;right:auto;bottom:16px;z-index:2147483645;border:0;border-radius:999px;background:#6d4aff;color:white;padding:13px 18px;font:600 14px system-ui;box-shadow:0 8px 26px #0004;cursor:pointer}#cc-adapter-panel{position:fixed;inset:4vh 4vw;z-index:2147483646;background:#f7f6fb;color:#182230;border-radius:18px;box-shadow:0 18px 80px #0006;padding:18px;overflow:auto;font:14px/1.45 system-ui}#cc-adapter-panel[hidden]{display:none}#cc-adapter-panel .cc-head{position:sticky;top:-18px;background:#f7f6fb;padding:0 0 14px;display:flex;justify-content:space-between;align-items:center;z-index:2}#cc-adapter-panel .cc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}#cc-adapter-panel[data-layout-style="minimal"] .cc-grid{grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:8px}#cc-adapter-panel[data-layout-style="accessible"]{font-size:16px}#cc-adapter-panel[data-layout-style="accessible"] .cc-grid{grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:16px}#cc-adapter-panel .cc-card{background:white;border:1px solid #e1dfeb;border-radius:14px;padding:14px;display:grid;gap:9px}#cc-adapter-panel button{font:inherit;cursor:pointer;border-radius:9px;border:1px solid #6d4aff;background:white;color:#442cc4;padding:8px}#cc-adapter-panel button.cc-primary{background:#6d4aff;color:white}#cc-adapter-panel .cc-price{font-weight:700;font-size:18px}#cc-adapter-panel .cc-status{color:#8d1b1b}';container.append(style);
  const launch=root.createElement('button');launch.id='cc-adapter-launch';launch.dataset.ccAdapterUi='true';launch.textContent='Open ClearChoice shopping mode';container.append(launch);
  const panel=root.createElement('section');panel.id='cc-adapter-panel';panel.dataset.ccAdapterUi='true';panel.hidden=true;container.append(panel);
  const render=(force=false)=>{
    if(destroyed||isProtected(root)||!products().length){restore();return false}
    if(!panel.hidden&&!force)return true;
    try{
      const snapshot=nodes(),layout=selectedLayout?validateLayoutSpec(snapshot,selectedLayout):layoutFor(snapshot);
      panel.dataset.layoutStyle=layout.style;
      panel.innerHTML='<div class="cc-head"><div><strong>ClearChoice shopping mode</strong><div>Original names, prices, variants, and store actions · scroll to see all items</div></div><div><button type="button" data-refresh>Refresh items</button> <button type="button" data-close>Close</button></div></div><p class="cc-stale" hidden>Page changed. Refresh items before another action.</p><div class="cc-grid"></div>';
      panel.dataset.stale='false';
      panel.querySelector('[data-close]').addEventListener('click',()=>panel.hidden=true);
      panel.querySelector('[data-refresh]').addEventListener('click',()=>{selectedLayout=null;render(true)});
      const grid=panel.querySelector('.cc-grid');
      for(const item of layout.items){
        const sourceTitle=get(item.titleSourceId),sourcePrice=get(item.priceSourceId),card=root.createElement('article');card.className='cc-card';
        const h=root.createElement('strong');h.textContent=sourceTitle?.innerText.trim()||'';
        const price=root.createElement('div');price.className='cc-price';price.textContent=`${sourcePrice?.innerText.trim()||''}${sourcePrice?.getAttribute('data-cc-currency')?` ${sourcePrice.getAttribute('data-cc-currency')}`:''}`;
        const detail=root.createElement('button');detail.textContent='Details & variants';detail.addEventListener('click',async()=>{const result=await clickSource(item.detailSourceId,layout.sourceRevision,'details');status(card,result.message)});
        const add=root.createElement('button');add.className='cc-primary';add.textContent='Add to cart';add.addEventListener('click',async()=>{add.disabled=true;const result=await clickSource(item.actionSourceId,layout.sourceRevision,'cart');add.textContent=result.verified?`Added · cart ${result.count}`:'Not verified';status(card,result.message)});
        card.append(h,price,detail,add);grid.append(card);
      }
      return true;
    }catch{panel.textContent='ClearChoice could not safely reconstruct this page. Use the original page controls.';return false}
  };
  const status=(card,message)=>{let s=card.querySelector('.cc-status');if(!s){s=root.createElement('small');s.className='cc-status';card.append(s)}s.textContent=message};
  const clickSource=async(sourceId,revision,kind)=>{
    try{
      const before=nodes();if(before.sourceRevision!==revision)return{verified:false,message:'Page changed. Refresh items before trying again.'};
      const action=validateBridgeAction(before,{actionId:crypto.randomUUID(),sourceId,sourceRevision:revision,action:'click'},{usedActionIds:used}),target=get(action.sourceId);
      if(!target?.isConnected)return{verified:false,message:'Original control is no longer available.'};
      const count=Number(cartNode()?.textContent);
      if(kind==='details')panel.hidden=true;
      target.click();
      if(kind==='details'){await wait(80);const modal=root.querySelector('.modal:not(.hidden),[role="dialog"]:not([hidden])');if(!modal)panel.hidden=false;return{verified:!!modal&&visible(modal),message:modal?'Original details opened. Choose a variant and use the original Add to cart action.':'Details did not open; use the original page.'}}
      await wait(120);const after=nodes(),now=Number(cartNode()?.textContent),cartId=cartNode()?idFor(cartNode()):'';
      const result=verifyObservedResult(before,after,action,{type:'cart-count',sourceId:cartId,value:count+1});
      if(result.verified&&now===count+1){onActivity({type:'cart-add',sourceId,verified:true,count:now});return{verified:true,count:now,message:'Added once; cart count verified.'}}
      onActivity({type:'cart-add',sourceId,verified:false,count:now});return{verified:false,count:now,message:'Cart did not increase exactly once. Do not retry automatically.'};
    }catch(error){return{verified:false,message:error.message||'Action was not performed.'}}
  };
  const userOriginalAdd=event=>{
    if(!event.isTrusted)return;const button=event.target.closest?.('[data-cc-action="add-to-cart"]');if(!button)return;
    const before=nodes(),actionId=button.getAttribute(ATTR),count=Number(cartNode()?.textContent);if(!actionId)return;
    setTimeout(()=>{const after=nodes(),now=Number(cartNode()?.textContent),action={sourceId:actionId,sourceRevision:before.sourceRevision};const result=verifyObservedResult(before,after,action,{type:'cart-count',sourceId:cartNode()?.getAttribute(ATTR),value:count+1});onActivity({type:'cart-add',sourceId:actionId,verified:result.verified&&now===count+1,count:now});},150);
  };
  launch.addEventListener('click',()=>{if(!render(true))return;panel.hidden=false});
  root.addEventListener('click',userOriginalAdd,true);
  const observer=new MutationObserver(records=>{if(records.some(r=>!r.target.closest?.('[data-cc-adapter-ui]')&&![...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.('[data-cc-adapter-ui]')||n.closest?.('[data-cc-adapter-ui]'))))){clearTimeout(timer);timer=setTimeout(()=>{if(isProtected(root))restore();else if(!panel.hidden){panel.dataset.stale='true';panel.querySelector('.cc-stale').hidden=false;panel.querySelectorAll('.cc-primary,.cc-details').forEach(b=>b.disabled=true)}},100)}});
  observer.observe(root.documentElement,{subtree:true,childList:true,characterData:true});
  render();
  function restore(){destroyed=true;clearTimeout(timer);observer.disconnect();root.removeEventListener('click',userOriginalAdd,true);style.remove();launch.remove();panel.remove();root.querySelectorAll(`[${ATTR}]`).forEach(el=>{if(generated.has(el))el.removeAttribute(ATTR)})}
  return Object.freeze({available:true,perceive:()=>nodes(),refresh:()=>render(true),applyLayout:layout=>{selectedLayout=validateLayoutSpec(nodes(),layout);return render(true)},restore});
}
