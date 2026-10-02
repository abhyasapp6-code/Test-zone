const user=getUser();if(!user){location.href="register.html"}
function shell(title){
const links=[["dashboard.html","⌂","Home"],["syllabus.html","▣","Syllabus"],["planner.html","☷","Planner"],["classes.html","▶","Classes"],["revision.html","↻","Revision"],["practice.html","✓","Practice"],["tests.html","▤","Tests"],["analytics.html","▥","Analytics"],["profile.html","⚙","More"]];
const current=location.pathname.split("/").pop();
document.getElementById("app").innerHTML=`<div class="app-shell"><header class="topbar"><a class="brand" href="dashboard.html"><span class="brand-mark">▮▮▮</span> CMA <b>Tracker</b></a><div class="top-actions"><select id="groupFilter"><option>All Groups</option>${selectedGroups(user).map(g=>`<option>${g}</option>`).join("")}</select><span>🔔</span><a href="profile.html" style="color:white">◉ ${escapeHtml(user.name.split(" ")[0])}</a></div></header><div class="layout"><aside class="sidebar">${links.map(x=>`<a class="nav-link ${current===x[0]?"active":""}" href="${x[0]}"><span>${x[1]}</span>${x[2]}</a>`).join("")}</aside><main class="main"><div class="section-title"><div><h2>${title}</h2><span class="muted">${escapeHtml(user.course)} · ${escapeHtml(user.groups.join(" + "))} · ${escapeHtml(user.attempt||"")}</span></div></div><div id="pageContent"></div></main></div><nav class="mobile-nav">${links.slice(0,6).map(x=>`<a class="${current===x[0]?"active":""}" href="${x[0]}"><span>${x[1]}</span>${x[2]}</a>`).join("")}</nav></div>`;
}
function daysToAttempt(){
const map={"December 2026":"2026-12-11","June 2027":"2027-06-11","December 2027":"2027-12-11"};let d=new Date(map[user.attempt]||"2026-12-11"),now=new Date();return Math.max(0,Math.ceil((d-now)/86400000));
}
function between(){return ''}
