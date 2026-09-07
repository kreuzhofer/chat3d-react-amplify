/**
 * PROTOTYPE — wayfinder #66. Which WAY the parts-inventory variant moved each
 * judge: fail→pass against pass→fail, and the pass rate before and after.
 * The graded 84 say whether an answer is right; this says whether the
 * instrument changed the judge's mind or only its leniency.
 */
import { readFileSync } from "node:fs";
import { prisma } from "../../src/db/prisma.js";
type A = "pass"|"fail"|"uncertain";
const ans=(p:any):A=>p===true?"pass":p===false?"fail":"uncertain";
async function runItems(runId:string){const rows=await prisma.vlmExperimentResult.findMany({where:{runId},select:{exampleId:true,checklistResults:true}});
  const m=new Map<string,A>();for(const r of rows){const l=Array.isArray(r.checklistResults)?r.checklistResults as any[]:[];l.forEach((it,i)=>m.set(`${r.exampleId}#${i+1}`,ans(it?.pass)));}return m;}
async function corpusItems(ids:string[]){const rows=await prisma.workbenchExample.findMany({where:{id:{in:ids}},select:{id:true,evalChecklistResults:true}});
  const m=new Map<string,A>();for(const r of rows){const l=Array.isArray(r.evalChecklistResults)?r.evalChecklistResults as any[]:[];l.forEach((it,i)=>m.set(`${r.id}#${i+1}`,ans(it?.pass)));}return m;}
async function main(){
const ex63=readFileSync(new URL("./ex63.txt", import.meta.url).pathname,"utf8").trim().split("\n");
const experimentId=process.argv[2];
if(!experimentId) throw new Error("give the variant experiment id");
const variantRuns=await prisma.experimentRun.findMany({where:{experimentId},select:{id:true,modelLabel:true}});
for(const vr of variantRuns){
  const isRef=/sonnet/i.test(vr.modelLabel);
  const v=await runItems(vr.id);
  const c=new Map<string,A>();
  const base=await runItems(isRef?"6f6bb5c0-7e16-414f-bf39-59743ce8fd7f":"62b4fa58-67d6-48be-b942-ae99f5bd859a");
  for(const[k,x]of base)c.set(k,x);
  const second=isRef?await runItems("4d899046-96f6-45c3-bd94-8388443dcdad"):await corpusItems(ex63);
  for(const[k,x]of second)if(!c.has(k))c.set(k,x);
  const keys=[...v.keys()].filter(k=>c.has(k));
  let f2p=0,p2f=0,same=0,other=0,passBefore=0,passAfter=0;
  for(const k of keys){const b=c.get(k)!,a=v.get(k)!;
    if(b==="pass")passBefore++; if(a==="pass")passAfter++;
    if(a===b)same++; else if(b==="fail"&&a==="pass")f2p++; else if(b==="pass"&&a==="fail")p2f++; else other++;}
  console.log(`\n${isRef?"REFERENCE":"CANDIDATE"} ${vr.modelLabel}`);
  console.log(`  paired ${keys.length} · identical ${same} (${(100*same/keys.length).toFixed(1)}%)`);
  console.log(`  fail→pass ${f2p} · pass→fail ${p2f} · uncertain moves ${other}`);
  console.log(`  pass rate ${ (100*passBefore/keys.length).toFixed(1) }% → ${ (100*passAfter/keys.length).toFixed(1) }%  (net +${passAfter-passBefore} passes)`);
}
await prisma.$disconnect();
}
main().catch(async(e)=>{console.error(e);await prisma.$disconnect();process.exit(1);});
