import { analyzePerception } from '../../packages/engine/src/index.js';
const e = (id,text,extra={}) => ({id,type:'text',text,visible:true,enabled:true,clickable:false,scrollable:false,bounds:{x:0,y:0,width:30,height:12},actions:[],...extra});
export const evaluationFixtures = [
  { name:'normal checkout', elements:[e('total','Total $42.00'),e('pay','Pay now')], expected:[] },
  { name:'preselected add-on', elements:[e('addon','Add protection plan',{type:'checkbox',checked:true})], expected:['preselected-extras'] },
  { name:'guilt decline', elements:[e('decline','No, I do not want to save')], expected:['confirmshaming'] },
  { name:'unverified scarcity', elements:[e('scarcity','Only 2 left')], expected:['unverified-urgency'] },
  { name:'late fee', elements:[e('fee','Service fee',{visible:false})], expected:['hidden-fees'] },
  { name:'subscription ambiguity', elements:[e('terms','Additional charges may apply')], expected:['ambiguous-terms'] },
  { name:'low contrast cue', elements:[e('field','',{type:'input',label:''})], expected:['accessibility-barriers'] },
  { name:'competing CTAs', elements:[e('decline','Reject',{type:'button',primary:true})], expected:['unequal-choices'] }
];
export function runFixtures() {
  return evaluationFixtures.map(f => ({ name:f.name, detected:[...new Set(analyzePerception({sourceRevision:'fixture',elements:f.elements}).map(x=>x.ruleId))], expected:f.expected }));
}
