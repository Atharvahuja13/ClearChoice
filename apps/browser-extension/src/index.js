/** ClearChoice's deterministic, local-first contracts and rule engine. */
export const RULES = Object.freeze([
  ['preselected-extras', 'Preselected extras'], ['hidden-fees', 'Hidden fees'],
  ['unverified-urgency', 'Unverified urgency'], ['confirmshaming', 'Pressuring wording'],
  ['unequal-choices', 'Unequal choices'], ['confusing-navigation', 'Confusing navigation'],
  ['clutter', 'Clutter'], ['accessibility-barriers', 'Accessibility barriers'],
  ['ambiguous-terms', 'Ambiguous terms']
].map(([id, label]) => Object.freeze({ id, label })));

const RULE_IDS = new Set(RULES.map(r => r.id));
const SENSITIVE = /\b(password|passcode|one[- ]time code|\botp\b|credit card|card number|cvv|cvc|security code|bank account|routing number|ssn|social security|payment details?)\b/i;
const TEXT_ONLY = new Set(['text', 'heading', 'label', 'paragraph', 'link', 'button', 'input', 'select', 'checkbox', 'radio']);
const cleanText = v => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 500);
const safeBounds = b => b && [b.x,b.y,b.width,b.height].every(Number.isFinite) && b.width >= 0 && b.height >= 0
  ? { x:b.x, y:b.y, width:b.width, height:b.height } : null;

/** Produce a stable, bounded UI snapshot without retaining DOM nodes or form values. */
export function normalizePerception(input) {
  if (!input || typeof input !== 'object' || typeof input.sourceRevision !== 'string' || !input.sourceRevision.trim()) throw new TypeError('sourceRevision is required');
  if (!Array.isArray(input.elements)) throw new TypeError('elements must be an array');
  const ids = new Set();
  const elements = input.elements.slice(0, 1000).map((e, i) => {
    if (!e || typeof e.id !== 'string' || !e.id.trim()) throw new TypeError(`element ${i} requires an id`);
    if (ids.has(e.id)) throw new TypeError(`duplicate element id: ${e.id}`);
    ids.add(e.id);
    const type = [...TEXT_ONLY,'banner'].includes(e.type) ? e.type : 'text';
    const actions = [...new Set((Array.isArray(e.actions) ? e.actions : []).filter(a => ['click','submit','toggle','navigate','scroll'].includes(a)))];
    const item = { id:e.id, type, text:cleanText(e.text), visible:e.visible === true, enabled:e.enabled === true, clickable:e.clickable === true, scrollable:e.scrollable === true, bounds:safeBounds(e.bounds), actions };
    if (typeof e.checked === 'boolean') item.checked = e.checked;
    if (typeof e.primary === 'boolean') item.primary = e.primary;
    if (typeof e.label === 'string') item.label = cleanText(e.label);
    if (typeof e.price === 'string' || typeof e.price === 'number') item.price = String(e.price).slice(0,64);
    if (typeof e.currency === 'string') item.currency = e.currency.slice(0,8);
    if (typeof e.productId === 'string') item.productId = e.productId.slice(0,160);
    // Never serialize entered values. A value field is intentionally ignored.
    if (SENSITIVE.test(item.text)) item.text = '[sensitive content omitted]';
    if (item.label && SENSITIVE.test(item.label)) item.label = '[sensitive content omitted]';
    return Object.freeze(item);
  });
  const snapshot = { sourceRevision: input.sourceRevision, elements: Object.freeze(elements) };
  if (typeof input.appKey === 'string') snapshot.appKey = input.appKey.slice(0,160);
  if (typeof input.screenKey === 'string') snapshot.screenKey = input.screenKey.slice(0,160);
  return Object.freeze(snapshot);
}

export function isSensitiveText(value) { return SENSITIVE.test(String(value ?? '')); }

/** Only allow suggestions anchored to current source IDs and reversible text-only changes. */
export function validateSuggestions(perception, suggestions) {
  const snapshot = normalizePerception(perception);
  if (!Array.isArray(suggestions)) throw new TypeError('suggestions must be an array');
  const ids = new Set(snapshot.elements.map(e => e.id));
  const seen = new Set();
  return suggestions.map((s, i) => {
    if (!s || typeof s !== 'object') throw new TypeError(`suggestion ${i} must be an object`);
    if (s.sourceRevision !== snapshot.sourceRevision) throw new Error('stale source revision');
    if (!ids.has(s.sourceId)) throw new Error(`unknown sourceId: ${s.sourceId}`);
    if (seen.has(s.id)) throw new Error(`duplicate action id: ${s.id}`);
    seen.add(s.id);
    if (typeof s.id !== 'string' || !s.id.trim()) throw new TypeError('suggestion id is required');
    if (!RULE_IDS.has(s.ruleId)) throw new Error(`unknown rule: ${s.ruleId}`);
    if (s.kind !== 'annotation' && s.kind !== 'rewrite') throw new Error('suggestion kind must be annotation or rewrite');
    const element = snapshot.elements.find(e => e.id === s.sourceId);
    if (s.kind === 'rewrite' && !['text','heading','label','paragraph','link','button'].includes(element.type)) throw new Error('rewrite target is not text-bearing');
    if (s.kind === 'rewrite' && !element.visible) throw new Error('cannot rewrite a hidden source element');
    if (s.action != null) throw new Error('suggestions cannot introduce actions');
    if (s.price != null || s.currency != null) throw new Error('suggestions cannot alter prices or currency');
    if (s.kind === 'rewrite' && (element.price != null || element.currency != null || /(?:\p{Sc}\s*\d|\d[.,]?\d*\s*(?:USD|EUR|GBP|SGD|CAD|AUD)\b)/iu.test(element.text))) throw new Error('cannot rewrite price or currency content');
    if (typeof s.text !== 'string' || !s.text.trim() || s.text.length > 500 || isSensitiveText(s.text)) throw new Error('invalid or sensitive suggestion text');
    return Object.freeze({ id:s.id, sourceId:s.sourceId, sourceRevision:s.sourceRevision, ruleId:s.ruleId, kind:s.kind, text:cleanText(s.text) });
  });
}

/** A layout only reorders references to source elements; it cannot author product content. */
export function validateLayoutSpec(perception, layout) {
  const snapshot = normalizePerception(perception), byId = new Map(snapshot.elements.map(e => [e.id,e]));
  if (!layout || typeof layout !== 'object' || layout.sourceRevision !== snapshot.sourceRevision) throw new Error('stale or missing layout revision');
  if (Object.keys(layout).some(k => !['id','sourceRevision','items','style'].includes(k))) throw new Error('layout contains unsupported fields');
  if (typeof layout.id !== 'string' || !layout.id.trim() || !Array.isArray(layout.items) || layout.items.length > 100) throw new Error('invalid layout');
  if (!['balanced','minimal','accessible'].includes(layout.style)) throw new Error('unsupported layout style');
  const used = new Set(), orders = new Set();
  const items = layout.items.map(item => {
    if (!item || Object.keys(item).some(k => !['productId','titleSourceId','priceSourceId','actionSourceId','detailSourceId','order'].includes(k))) throw new Error('layout item contains unsupported fields');
    const { productId,titleSourceId,priceSourceId,actionSourceId,detailSourceId,order } = item;
    if (typeof productId !== 'string' || !productId.trim() || used.has(productId)) throw new Error('duplicate or invalid productId');
    used.add(productId);
    const title = byId.get(titleSourceId), price = byId.get(priceSourceId), action = byId.get(actionSourceId), detail = byId.get(detailSourceId);
    if (!title || !title.visible || !price || !price.visible || !action || !action.visible || !action.enabled || !action.clickable || !action.actions.includes('click') || (detailSourceId && (!detail || !detail.clickable))) throw new Error('layout must reference visible, current source elements');
    for (const source of [title,price,action,detail].filter(Boolean)) if (source.productId != null && source.productId !== productId) throw new Error('layout product references do not match their original product');
    if (price.price == null && !/(?:\p{Sc}\s*\d|\d[.,]?\d*\s*(?:USD|EUR|GBP|SGD|CAD|AUD)\b)/iu.test(price.text)) throw new Error('layout price must reference original price content');
    if (!Number.isInteger(order) || order < 0 || orders.has(order)) throw new Error('invalid or duplicate layout order');
    orders.add(order);
    return Object.freeze({ productId,titleSourceId,priceSourceId,actionSourceId,detailSourceId:detailSourceId ?? null,order,price:price.price ?? price.text,currency:price.currency ?? null });
  }).sort((a,b) => a.order-b.order);
  const sourceProducts=[...new Set(snapshot.elements.filter(e=>e.productId!=null&&e.type==='heading').map(e=>e.productId))];
  if(sourceProducts.length&&(items.length!==sourceProducts.length||sourceProducts.some(id=>!used.has(id))))throw new Error('layout must preserve every source product exactly once');
  return Object.freeze({ id:layout.id, sourceRevision:snapshot.sourceRevision, style:layout.style, items:Object.freeze(items) });
}

/** Guard an extension bridge action against stale snapshots, duplicates and sensitive controls. */
export function validateBridgeAction(perception, request, { usedActionIds = new Set() } = {}) {
  const snapshot = normalizePerception(perception);
  if (!request || request.sourceRevision !== snapshot.sourceRevision) throw new Error('stale source revision');
  if (typeof request.actionId !== 'string' || !request.actionId.trim()) throw new TypeError('actionId is required');
  if (usedActionIds.has(request.actionId)) throw new Error('duplicate action');
  const element = snapshot.elements.find(e => e.id === request.sourceId);
  if (!element) throw new Error('unknown sourceId');
  if (!element.visible || !element.enabled || !element.clickable) throw new Error('source is not actionable');
  if (element.type === 'input' || element.type === 'select' || element.type === 'checkbox' || element.type === 'radio' || isSensitiveText(element.text)) throw new Error('sensitive or form controls stay in the original UI');
  const action = request.action;
  if (!element.actions.includes(action) || !['click','navigate','scroll'].includes(action)) throw new Error('action is not allowed by the source contract');
  usedActionIds.add(request.actionId);
  return Object.freeze({ actionId:request.actionId, sourceId:request.sourceId, sourceRevision:request.sourceRevision, action });
}

export function verifyObservedResult(before, after, action, expectedEffect) {
  const a = normalizePerception(before), b = normalizePerception(after);
  if (!expectedEffect || typeof expectedEffect !== 'object') return Object.freeze({ verified:false, reason:'expected effect was not specified' });
  if (a.sourceRevision === b.sourceRevision) return Object.freeze({ verified:false, reason:'no observed source change' });
  if (action?.sourceRevision !== a.sourceRevision || !a.elements.some(e => e.id === action.sourceId)) return Object.freeze({ verified:false, reason:'action source was absent or stale' });
  if (expectedEffect.type === 'text-change') {
    const old = a.elements.find(e => e.id === expectedEffect.sourceId), next = b.elements.find(e => e.id === expectedEffect.sourceId);
    if (!old || !next || next.text !== expectedEffect.value || old.text === next.text) return Object.freeze({ verified:false, reason:'expected text effect was not observed' });
  } else if (expectedEffect.type === 'cart-count') {
    const old = a.elements.find(e => e.id === expectedEffect.sourceId), next = b.elements.find(e => e.id === expectedEffect.sourceId);
    const oldCount = Number(old?.text), nextCount = Number(next?.text);
    if (!old || !next || !Number.isInteger(oldCount) || !Number.isInteger(nextCount) || nextCount !== oldCount + 1 || nextCount !== expectedEffect.value) return Object.freeze({ verified:false, reason:'cart count did not increase exactly once' });
  } else return Object.freeze({ verified:false, reason:'unsupported expected effect' });
  return Object.freeze({ verified:true, sourceRevision:b.sourceRevision, effect:expectedEffect.type });
}

const ADD_ON = /\b(add|include|subscribe|subscription|protection|warranty|insurance|donation|gift wrap|care plan)\b/i;
const matches = {
  // Native accessibility snapshots expose checked state but may not retain a web-specific checkbox type.
  'preselected-extras': e => e.checked === true && ADD_ON.test(`${e.label || ''} ${e.text}`),
  'hidden-fees': e => /\b(service|processing|delivery|handling|convenience) fee\b/i.test(e.text) && e.visible !== true,
  'unverified-urgency': e => /\b(only \d+ left|ends in|expires in|last chance|selling fast)\b/i.test(e.text),
  confirmshaming: e => /\b(no,? i (?:do not|don't|won't) want|i prefer to pay more|i hate saving|miss out on savings)\b/i.test(e.text),
  'unequal-choices': e => e.type === 'button' && e.primary === true && /\b(no thanks|decline|reject)\b/i.test(e.text),
  'confusing-navigation': e => e.type === 'link' && /\b(back|cancel|continue|close)\b/i.test(e.text) && e.visible === false,
  clutter: e => e.type === 'banner' && e.visible === true,
  'accessibility-barriers': e => e.type === 'input' && e.visible === true && !cleanText(e.label),
  'ambiguous-terms': e => /\b(as applicable|may apply|subject to terms|additional charges)\b/i.test(e.text)
};

function assessmentFor(ruleId, element) {
  const fullEvidence = cleanText(element.text || element.label || RULES.find(rule => rule.id === ruleId)?.label || ruleId);
  const evidence = fullEvidence.length > 140 ? `${fullEvidence.slice(0,137)}…` : fullEvidence;
  if (ruleId === 'preselected-extras') return {
    verification:'observed',
    observation:`The source snapshot records this add-on checkbox as selected: “${evidence}”.`,
    rationale:'The selected state is observed; this snapshot cannot show who selected it or why. Review it before continuing.'
  };
  if (ruleId === 'unverified-urgency') return {
    verification:'unverified',
    observation:`The source displays: “${evidence}”.`,
    rationale:'The snapshot does not verify current inventory, demand, or a deadline. Treat the urgency claim as unverified.'
  };
  if (ruleId === 'ambiguous-terms') return {
    verification:'unverified',
    observation:`The source displays: “${evidence}”.`,
    rationale:'This wording does not identify the charge amount or the condition that triggers it in the captured screen.'
  };
  if (ruleId === 'hidden-fees') return {
    verification:'unverified',
    observation:`The snapshot contains fee text marked ${element.visible ? 'visible' : 'not visible'}: “${evidence}”.`,
    rationale:'This source cue does not establish the final amount or what a shopper sees at checkout.'
  };
  return {
    verification:'unverified',
    observation:`The source snapshot contains: “${evidence}”.`,
    rationale:'This is a pattern cue for review, not proof of intent or harm.'
  };
}

/** Deterministic indicators are cues for review, not claims of intent or deception. */
export function analyzePerception(perception) {
  const snapshot = normalizePerception(perception);
  const findings = [];
  for (const el of snapshot.elements) for (const rule of RULES) {
    if (matches[rule.id](el)) {
      const assessment = assessmentFor(rule.id,el);
      findings.push(Object.freeze({
        sourceId:el.id,
        sourceRevision:snapshot.sourceRevision,
        ruleId:rule.id,
        evidence:el.text || el.label || rule.label,
        sourceEvidence:Object.freeze({id:el.id,type:el.type,text:el.text,label:el.label ?? null,visible:el.visible,...(typeof el.checked === 'boolean' ? {checked:el.checked} : {})}),
        confidence:'indicator',
        verification:assessment.verification,
        observation:assessment.observation,
        rationale:assessment.rationale
      }));
      if (findings.length === 50) return Object.freeze(findings);
    }
  }
  return Object.freeze(findings);
}

/** Build review-only annotations that point to exact current source IDs; never mutate page text or controls. */
export function createReviewAnnotations(perception) {
  const snapshot = normalizePerception(perception);
  return Object.freeze(analyzePerception(snapshot).slice(0,50).map(finding => validateSuggestions(snapshot,[{
    id:`review-${finding.ruleId}-${finding.sourceId}`,
    sourceId:finding.sourceId,
    sourceRevision:snapshot.sourceRevision,
    ruleId:finding.ruleId,
    kind:'annotation',
    text:`${finding.observation} ${finding.rationale}`
  }])[0]));
}

export function createProfile({ global = {}, apps = {}, screens = {} } = {}) {
  const merge = (...parts) => Object.freeze(Object.assign({ enabled:true, paused:false, rules:Object.fromEntries(RULES.map(r => [r.id,true])) }, ...parts));
  return Object.freeze({ global:merge(global), apps:Object.freeze(Object.fromEntries(Object.entries(apps).map(([k,v]) => [k,merge(v)]))), screens:Object.freeze(Object.fromEntries(Object.entries(screens).map(([k,v]) => [k,merge(v)]))) });
}
export function resolveProfile(profile, appKey, screenKey) {
  const base = profile?.global ?? createProfile().global;
  const mergeRules = (a,b) => ({ ...a, ...b });
  const app = profile?.apps?.[appKey], screen = profile?.screens?.[screenKey];
  return Object.freeze({ ...base, ...(app ?? {}), ...(screen ?? {}), rules:mergeRules(mergeRules(base.rules ?? {},app?.rules ?? {}),screen?.rules ?? {}) });
}
