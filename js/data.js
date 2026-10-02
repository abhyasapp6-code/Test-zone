const CMA_DATA={
Final:{
"Group III":[
{id:"p13",name:"Strategic Financial Management",short:"SFM",chapters:["Security Analysis","Equity / Share Valuation","Bond Valuation","Mutual Funds","Portfolio Management","Derivatives","Foreign Exchange","Investment Decision","Evaluation of Risky Proposals","Leasing Decision"]},
{id:"p14",name:"Direct Tax Laws & International Taxation",short:"Direct Tax",chapters:["Basic Concepts","Heads of Income","Deductions","Capital Gains","Set Off & Carry Forward","Assessment","International Taxation"]},
{id:"p15",name:"Strategic Cost Management",short:"SCM",chapters:["Cost Management","Strategic Costing","Standard Costing","Marginal Costing","Budgetary Control","Activity Based Costing"]},
{id:"p16",name:"Corporate Financial Reporting",short:"CFR",chapters:["Accounting Standards","Ind AS","Consolidation","Business Combinations","Financial Instruments","Corporate Reporting"]}
],
"Group IV":[
{id:"p17",name:"Cost & Management Audit",short:"CMAudit",chapters:["Cost Audit","Management Audit","Performance Audit","Compliance Audit","Cost Records"]},
{id:"p18",name:"Corporate Financial Management",short:"CFM",chapters:["Capital Budgeting","Working Capital","Capital Structure","Dividend Decisions","Risk Management","Treasury"]},
{id:"p19",name:"Indirect Tax Laws & Practice",short:"Indirect Tax",chapters:["GST Basics","Supply","Input Tax Credit","Registration","Returns","Assessment","Customs"]},
{id:"p20",name:"Strategic Performance Management",short:"SPM",chapters:["Performance Measurement","Transfer Pricing","Responsibility Accounting","Balanced Scorecard","Decision Making","Strategic Analysis"]}
]
},
Inter:{
"Group I":[{id:"i1",name:"Business Laws & Ethics",short:"BLE",chapters:["Contract Act","Company Law","Business Ethics"]},{id:"i2",name:"Financial Accounting",short:"FA",chapters:["Accounting Basics","Final Accounts","Depreciation","Partnership"]}],
"Group II":[{id:"i3",name:"Direct & Indirect Taxation",short:"Tax",chapters:["Income Tax","GST","Customs"]},{id:"i4",name:"Cost Accounting",short:"Costing",chapters:["Material","Labour","Overheads","Methods of Costing"]}]
},
Foundation:{"Foundation":[{id:"f1",name:"Fundamentals of Accounting",short:"FA",chapters:["Accounting Basics","Final Accounts","Bank Reconciliation"]},{id:"f2",name:"Business Laws",short:"Law",chapters:["Contract","Sale of Goods","Company Basics"]}]}
};
function getUser(){return JSON.parse(localStorage.getItem("cmaUser")||"null")}
function saveUser(u){localStorage.setItem("cmaUser",JSON.stringify(u))}
function getProgress(){return JSON.parse(localStorage.getItem("cmaProgress")||"{}")}
function saveProgress(p){localStorage.setItem("cmaProgress",JSON.stringify(p))}
function selectedGroups(u){
 if(u.course==="Final") return u.groups.includes("Both Groups")?["Group III","Group IV"]:u.groups;
 if(u.course==="Inter") return u.groups.length?u.groups:["Group I"];
 return ["Foundation"];
}
function papersForUser(u){
 const d=CMA_DATA[u.course]||CMA_DATA.Final; let out=[];
 selectedGroups(u).forEach(g=>(d[g]||[]).forEach(p=>out.push({...p,group:g})));
 return out;
}
function topicsForPaper(p){
 let arr=[]; p.chapters.forEach((c,ci)=>{for(let i=1;i<=4;i++) arr.push({id:`${p.id}-${ci+1}-${i}`,chapter:c,name:`${c} — Topic ${i}`})});
 return arr;
}
function allTopics(u){return papersForUser(u).flatMap(p=>topicsForPaper(p).map(t=>({...t,paperId:p.id,paper:p.name,short:p.short,group:p.group})))}
function pct(n,d){return d?Math.round(n/d*100):0}
function syllabusStats(u){
 const all=allTopics(u), prog=getProgress(); let done=all.filter(t=>prog[t.id]?.status==="completed").length;
 return {done,total:all.length,percent:pct(done,all.length)};
}
function paperStats(u,p){let ts=topicsForPaper(p),pr=getProgress();let done=ts.filter(t=>pr[t.id]?.status==="completed").length;return {done,total:ts.length,percent:pct(done,ts.length)}}
function groupStats(u,g){let ps=papersForUser(u).filter(p=>p.group===g),t=0,d=0;ps.forEach(p=>{let s=paperStats(u,p);t+=s.total;d+=s.done});return {done:d,total:t,percent:pct(d,t)}}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}