shell("Home");
const s=syllabusStats(user), groups=selectedGroups(user), prog=getProgress();
const completedTopics=Object.values(prog).filter(x=>x.status==="completed").length;
const tasks=JSON.parse(localStorage.getItem("cmaTasks")||"[]");
const revisions=JSON.parse(localStorage.getItem("cmaRevisions")||"[]");
const tests=JSON.parse(localStorage.getItem("cmaTests")||"[]");
let revisionPct=s.percent?Math.min(100,Math.round(s.percent*.62)):0;
let testPct=tests.length?Math.round(tests.reduce((a,b)=>a+(+b.score||0),0)/tests.length):0;
let readiness=Math.round(s.percent*.5+revisionPct*.2+testPct*.3);
const paperCards=papersForUser(user).map(p=>{let x=paperStats(user,p);return `<div class="card subject"><b>${escapeHtml(p.short)}</b><small class="muted">${escapeHtml(p.name)}</small><div class="ring" style="--p:${x.percent}" data-value="${x.percent}%"></div><div class="legend"><span>Syllabus</span><b>${x.percent}%</b></div></div>`}).join("");
document.getElementById("pageContent").innerHTML=`
<div class="hero"><div><div class="muted">Exams in</div><div class="days">${daysToAttempt()} Days</div><div class="muted">${escapeHtml(user.attempt||"Set attempt")}</div></div><div><h1>CMA ${escapeHtml(user.course)} — ${escapeHtml(user.groups.join(" + "))}</h1><div class="progress"><span style="width:${s.percent}%"></span></div><div class="between"><span>Overall Syllabus Completed</span><b>${s.percent}% · ${s.done}/${s.total} topics</b></div></div></div>
<div class="metrics">
${metric("📚","Syllabus",s.percent,`${s.done} / ${s.total} topics`)}
${metric("↻","Revision",revisionPct,`${Math.round(s.total*revisionPct/100)} / ${s.total} topics`)}
${metric("🎯","Tests / MCQs",testPct,tests.length?`${tests.length} mock tests`:"No tests yet")}
${metric("📊","Exam Readiness",readiness,"Based on syllabus, revision & tests")}
</div>
<div class="section-title"><h2>Subject-wise Progress</h2><a href="syllabus.html">View Details →</a></div>
<div class="subjects">${paperCards}</div>
<div class="two-col"><section class="card panel"><div class="section-title"><h2>Today's Plan</h2><a href="planner.html">+ Add Task</a></div><div id="tasks">${tasks.length?tasks.slice(0,5).map((t,i)=>`<div class="task"><input type="checkbox" ${t.done?"checked":""} data-task="${i}"><div class="task-main"><b>${escapeHtml(t.title)}</b><small>${escapeHtml(t.subject||"Study")} · ${t.hours||1} hr</small></div></div>`).join(""):`<div class="empty">No tasks yet.<br><a href="planner.html">Create today's plan →</a></div>`}</div></section>
<section class="card panel"><div class="section-title"><h2>Next Revision Due</h2><a href="revision.html">View All →</a></div>${revisions.length?revisions.slice(0,4).map(r=>`<div class="revision"><span>🟡</span><div><b>${escapeHtml(r.topic)}</b><small class="muted">${escapeHtml(r.date||"Due soon")}</small></div></div>`).join(""):`<div class="empty">No revision reminders yet.</div>`}</section></div>
<div class="section-title"><h2>What Should I Study Now?</h2></div><section class="card panel"><b>${s.percent<100?"Next incomplete topic":"Revision / Practice"}</b><p class="muted">${s.percent<100?"Open Syllabus and complete the next topic. The tracker will update every level automatically.":"Your syllabus is complete. Focus on revision, PYQs and mock tests."}</p><a class="btn primary" href="${s.percent<100?"syllabus.html":"practice.html"}">${s.percent<100?"Open Syllabus":"Start Practice"} →</a></section>`;
function metric(icon,name,p,sub){return `<div class="card metric"><h3>${icon} ${name}</h3><strong>${p}%</strong><div class="progress"><span style="width:${p}%"></span></div><small class="muted">${sub}</small></div>`}
document.querySelectorAll("[data-task]").forEach(x=>x.onchange=()=>{let a=JSON.parse(localStorage.getItem("cmaTasks")||"[]");a[+x.dataset.task].done=x.checked;localStorage.setItem("cmaTasks",JSON.stringify(a));});