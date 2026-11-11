import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, analyzePerception, createReviewAnnotations, createProfile, normalizePerception, resolveProfile, validateBridgeAction, validateLayoutSpec, validateSuggestions, verifyObservedResult } from '../../packages/engine/src/index.js';
import { evaluationFixtures, runFixtures } from './fixtures.js';

const snap = (sourceRevision='rev-1', elements=[]) => ({ sourceRevision, elements });
const el = (id, text, extra={}) => ({ id, type:'text', text, visible:true, enabled:true, clickable:false, scrollable:false, bounds:{x:0,y:0,width:20,height:10}, actions:[], ...extra });

test('review annotations preserve exact evidence and distinguish selected state from unverified claims',()=>{
  const p=snap('review-1',[el('extra','Add protection plan',{checked:true}),el('stock','Only 2 left'),el('terms','Additional charges may apply')]);
  const findings=analyzePerception(p),annotations=createReviewAnnotations(p);
  assert.deepEqual(findings.map(f=>f.verification),['observed','unverified','unverified']);
  assert.deepEqual(findings.map(f=>f.evidence),p.elements.map(e=>e.text));
  assert.deepEqual(annotations.map(a=>a.sourceId),['extra','stock','terms']);
  assert.ok(annotations.every(a=>a.kind==='annotation'&&a.sourceRevision==='review-1'));
  assert.match(annotations[0].text,/cannot show who selected/);
  assert.match(annotations[1].text,/does not verify current inventory/);
  assert.equal(createReviewAnnotations(snap('clean',[el('ok','Product information')])).length,0);
  assert.equal(analyzePerception(snap('checked',[el('remember','Remember me',{checked:true})])).length,0);
});

test('normalizes perception, bounds IDs, preserves price facts, and omits entered values', () => {
  const out = normalizePerception(snap('r', [el('price','$12.00',{price:'12.00',currency:'USD',value:'my secret password'})]));
  assert.equal(out.elements[0].price,'12.00'); assert.equal(out.elements[0].currency,'USD');
  assert.equal('value' in out.elements[0], false);
  assert.throws(() => normalizePerception(snap('r',[el('x',''),el('x','')])), /duplicate/);
  assert.equal(RULES.length,9);
});

test('detects local indicators and labels urgency as unverified', () => {
  const findings = analyzePerception(snap('r',[el('u','Only 2 left'),el('g','No, I do not want to save'),el('a','Additional charges may apply')]));
  assert.deepEqual(new Set(findings.map(f => f.ruleId)), new Set(['unverified-urgency','confirmshaming','ambiguous-terms']));
  assert.equal(findings[0].confidence,'indicator');
});

test('proposal validation pins revision and source and protects money, actions and duplicate IDs', () => {
  const p = snap('rev',[el('copy','A flexible plan')]);
  const valid = {id:'s1',sourceId:'copy',sourceRevision:'rev',ruleId:'ambiguous-terms',kind:'rewrite',text:'Plan terms are shown here.'};
  assert.equal(validateSuggestions(p,[valid]).length,1);
  assert.throws(() => validateSuggestions(p,[{...valid,sourceRevision:'old'}]),/stale/);
  assert.throws(() => validateSuggestions(p,[valid,{...valid,sourceId:'copy'}]),/duplicate/);
  assert.throws(() => validateSuggestions(p,[{...valid,action:'click'}]),/actions/);
  assert.throws(() => validateSuggestions(snap('rev',[el('price','$12.00',{price:'12',currency:'USD'})]),[{...valid,sourceId:'price'}]),/price/);
});

test('bridge rejects stale, duplicate and sensitive actions; permits one explicitly allowed action', () => {
  const p = snap('r',[el('buy','Add to cart',{type:'button',clickable:true,actions:['click']}),el('form','Card number',{type:'input',clickable:true,actions:['click']})]);
  const used = new Set(), req = {actionId:'once',sourceId:'buy',sourceRevision:'r',action:'click'};
  assert.equal(validateBridgeAction(p,req,{usedActionIds:used}).action,'click');
  assert.throws(() => validateBridgeAction(p,req,{usedActionIds:used}),/duplicate/);
  assert.throws(() => validateBridgeAction(p,{...req,actionId:'stale',sourceRevision:'old'},{usedActionIds:new Set()}),/stale/);
  assert.throws(() => validateBridgeAction(p,{...req,actionId:'form',sourceId:'form'},{usedActionIds:new Set()}),/sensitive/);
});

test('observed result verifies only an explicitly expected exact-once cart increment', () => {
  const before = snap('a',[el('buy','Add',{type:'button',clickable:true,actions:['click']}),el('cart','2')]);
  const after = snap('b',[el('buy','Add',{type:'button',clickable:true,actions:['click']}),el('cart','3')]);
  const action = {sourceId:'buy',sourceRevision:'a'};
  assert.equal(verifyObservedResult(before,after,action).verified,false);
  assert.equal(verifyObservedResult(before,after,action,{type:'cart-count',sourceId:'cart',value:3}).verified,true);
  assert.equal(verifyObservedResult(before,snap('b',[el('cart','4')]),action,{type:'cart-count',sourceId:'cart',value:4}).verified,false);
});

test('profile precedence resolves screen, then app, then global per setting and rule', () => {
  const p = createProfile({global:{enabled:false,rules:{clutter:false}},apps:{shop:{enabled:true,rules:{'hidden-fees':false}}},screens:{checkout:{paused:true,rules:{clutter:true}}}});
  const resolved = resolveProfile(p,'shop','checkout');
  assert.equal(resolved.enabled,true); assert.equal(resolved.paused,true);
  assert.equal(resolved.rules.clutter,true); assert.equal(resolved.rules['hidden-fees'],false);
});

test('eight documented evaluation fixtures match expected indicators', () => {
  assert.equal(evaluationFixtures.length,8);
  for (const fixture of runFixtures()) assert.deepEqual(fixture.detected,fixture.expected,fixture.name);
});

test('layout specs can reorder original source references without changing product or price facts', () => {
  const p=snap('layout',[el('title','Headphones'),el('price','$129.00',{price:'$129.00',currency:'USD'}),el('add','Add to cart',{type:'button',clickable:true,actions:['click']})]);
  const layout=validateLayoutSpec(p,{id:'layout-1',sourceRevision:'layout',style:'minimal',items:[{productId:'p1',titleSourceId:'title',priceSourceId:'price',actionSourceId:'add',order:0}]});
  assert.equal(layout.items[0].price,'$129.00'); assert.equal(layout.items[0].currency,'USD');
  assert.throws(()=>validateLayoutSpec(p,{id:'bad',sourceRevision:'stale',style:'minimal',items:[]}),/revision/);
  assert.throws(()=>validateLayoutSpec(p,{id:'bad',sourceRevision:'layout',style:'minimal',items:[{productId:'p1',titleSourceId:'title',priceSourceId:'price',actionSourceId:'missing',order:0}]}),/visible/);
});
