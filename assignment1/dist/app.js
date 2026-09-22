'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n===null||!Number.isFinite(n)?'Not available':Math.round(n).toLocaleString('en-US');
const dollars=n=>n===null||!Number.isFinite(n)?'Not available':'$'+fmt(n);
const pct=n=>n===null||!Number.isFinite(n)?'Not available':(n>0?'+':'')+n.toFixed(1)+'%';
let all=[],filtered=[],page=0,selected='29-1141',meta;
const pageSize=12;
function sortRows(rows){const key=$('sort').value;return [...rows].sort((a,b)=>key==='name'?a.name.localeCompare(b.name):(b[key]??-Infinity)-(a[key]??-Infinity)||a.name.localeCompare(b.name));}
function filterRows(){const query=$('search').value.trim().toLowerCase(),group=$('group').value,edu=$('education').value,wage=Number($('wage').value);filtered=all.filter(d=>(!query||d.name.toLowerCase().includes(query)||d.soc.includes(query))&&(!group||d.group===group)&&(!edu||d.education===edu)&&(!wage||(d.wage!==null&&d.wage>=wage)));page=0;render();}
function render(){
 $('resultCount').textContent=`${filtered.length} of ${all.length} occupations`;
 const openings=filtered.map(d=>d.openings).filter(Number.isFinite);
 $('totalOpenings').textContent=openings.length?fmt(openings.reduce((a,b)=>a+b,0)):'—';
 const growthRows=filtered.filter(d=>Number.isFinite(d.employment)&&Number.isFinite(d.projected));
 const base=growthRows.reduce((s,d)=>s+d.employment,0),future=growthRows.reduce((s,d)=>s+d.projected,0);
 $('totalGrowth').textContent=base?pct((future/base-1)*100):'—';
 const wages=filtered.map(d=>d.wage).filter(Number.isFinite).sort((a,b)=>a-b),m=Math.floor(wages.length/2);
 $('typicalWage').textContent=wages.length?dollars(wages.length%2?wages[m]:(wages[m-1]+wages[m])/2):'—';
 $('coverage').textContent=`${filtered.filter(d=>d.skills.length).length} / ${filtered.length}`;
 renderScatter();renderRanking();renderTable();renderRecommendations();
 const options=sortRows(filtered);if(!options.some(d=>d.soc===selected))selected=options.find(d=>d.skills.length)?.soc||options[0]?.soc||'';
 $('skillOccupation').innerHTML=options.map(d=>`<option value="${d.soc}">${esc(d.name)}</option>`).join('');
 $('skillOccupation').value=selected;$('skillOccupation').disabled=!options.length;renderSkills();
}
function renderScatter(){
 const data=filtered.filter(d=>Number.isFinite(d.wage)&&Number.isFinite(d.growth));
 if(!data.length){$('scatter').innerHTML='<p class="empty">No occupations match these filters. Try a broader search.</p>';return;}
 const W=640,H=320,L=58,R=18,T=20,B=52;
 const xMax=Math.max(50000,Math.ceil(Math.max(...data.map(d=>d.wage))/50000)*50000);
 const low=Math.min(-10,Math.floor(Math.min(...data.map(d=>d.growth))/10)*10),high=Math.max(20,Math.ceil(Math.max(...data.map(d=>d.growth))/10)*10);
 const x=v=>L+v/xMax*(W-L-R),y=v=>T+(high-v)/(high-low)*(H-T-B);
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Scatter plot of annual mean wage and projected employment growth. Equivalent values appear in the occupation table."><text x="${L}" y="11">Employment growth (%)</text>`;
 for(let i=0;i<=4;i++){const v=low+(high-low)*i/4,yy=y(v);svg+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" stroke="#e5ecef" stroke-dasharray="3 4"/><text x="${L-10}" y="${yy+4}" text-anchor="end">${v.toFixed(0)}%</text>`;}
 if(low<0&&high>0)svg+=`<line x1="${L}" y1="${y(0)}" x2="${W-R}" y2="${y(0)}" stroke="#bacbd3"/>`;
 for(let i=0;i<=4;i++){const v=xMax*i/4;svg+=`<text x="${x(v)}" y="${H-B+24}" text-anchor="middle">$${Math.round(v/1000)}k</text>`;}
 svg+=`<text x="${W/2}" y="${H-5}" text-anchor="middle">Mean annual wage · 2025 (USD)</text>`;
 const maxOpen=Math.max(1,...data.map(d=>d.openings??0));
 [...data].sort((a,b)=>(b.openings??0)-(a.openings??0)).forEach(d=>{const r=3+Math.sqrt((d.openings??0)/maxOpen)*12;svg+=`<circle data-soc="${d.soc}" cx="${x(d.wage)}" cy="${y(d.growth)}" r="${r}" fill="${d.growth>0?'#108c84':'#8a99aa'}"><title>${esc(d.name)} · ${dollars(d.wage)} · ${pct(d.growth)} growth · ${fmt(d.openings)} annual openings</title></circle>`;});
 $('scatter').innerHTML=svg+'</svg>';
 $('scatter').querySelectorAll('[data-soc]').forEach(el=>el.addEventListener('click',()=>choose(el.dataset.soc)));
}
function renderRanking(){const ranked=[...filtered].filter(d=>d.openings!==null).sort((a,b)=>b.openings-a.openings).slice(0,7),max=ranked[0]?.openings||1;
 $('ranking').innerHTML=ranked.length?ranked.map(d=>`<button class="rank-row" data-soc="${d.soc}" aria-label="Explore ${esc(d.name)} skills"><span class="rank-head"><span class="rank-title">${esc(d.name)}</span><b>${fmt(d.openings)}</b></span><span class="track"><span style="width:${d.openings/max*100}%"></span></span></button>`).join(''):'<p class="empty">No matching occupations.</p>';
 $('ranking').querySelectorAll('button').forEach(el=>el.onclick=()=>choose(el.dataset.soc));}
function renderTable(){const sorted=sortRows(filtered),pages=Math.max(1,Math.ceil(sorted.length/pageSize));page=Math.min(page,pages-1);const rows=sorted.slice(page*pageSize,(page+1)*pageSize);
 $('tableCount').textContent=`${filtered.length} occupations · Massachusetts statewide`;
 $('rows').innerHTML=rows.length?rows.map(d=>`<tr><td><button class="text-button" data-soc="${d.soc}">${esc(d.name)}</button><small>${d.soc} · ${esc(d.group)}</small></td><td class="num">${fmt(d.openings)}</td><td class="num"><span class="pill ${d.growth>0?'positive':'negative'}">${pct(d.growth)}</span></td><td class="num">${dollars(d.wage)}</td><td>${esc(d.education)}</td><td>${d.skills.length?'<span class="positive">Available</span>':'<span>Unmatched</span>'}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">No matches. Reset or change your filters.</td></tr>';
 $('rows').querySelectorAll('button').forEach(el=>el.onclick=()=>choose(el.dataset.soc));
 $('pageLabel').textContent=rows.length?`${page*pageSize+1}–${Math.min((page+1)*pageSize,sorted.length)} of ${sorted.length}`:'0 results';$('prev').disabled=page===0;$('next').disabled=page>=pages-1;
}
function choose(soc){selected=soc;$('skillOccupation').value=soc;renderSkills();$('skills').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
function renderSkills(){const d=all.find(x=>x.soc===selected);if(!d){$('occupationDetail').innerHTML='';$('skillBars').innerHTML='<p class="empty">No matching occupation. Adjust your filters.</p>';return;}
 $('occupationDetail').innerHTML=`<p class="eyebrow">${esc(d.group)} / ${d.soc}</p><h3>${esc(d.name)}</h3><dl><dt>Mean annual wage · 2025</dt><dd>${dollars(d.wage)}</dd><dt>Projected annual openings · 2024–34</dt><dd>${fmt(d.openings)}</dd><dt>Employment growth · 2024–34</dt><dd>${pct(d.growth)}</dd><dt>Typical entry education</dt><dd>${esc(d.education)}</dd></dl>${d.onet?`<a href="https://www.onetonline.org/link/summary/${d.onet}" target="_blank" rel="noopener">Explore the full O*NET profile ↗</a>`:'<p class="small-note" style="color:#d2e0e9">No exact O*NET match in this release.</p>'}`;
 $('skillBars').innerHTML=d.skills.length?d.skills.slice(0,10).map(s=>`<div class="skill-row"><span>${esc(s.name)}</span><div class="track" role="meter" aria-label="${esc(s.name)} importance" aria-valuemin="1" aria-valuemax="5" aria-valuenow="${s.importance}"><span style="width:${s.importance/5*100}%"></span></div><b>${s.importance.toFixed(2)}</b></div>`).join(''):'<p class="empty">Skills ratings are not available for this exact occupation match. Missing data does not mean no skills are required.</p>';
}
function renderRecommendations(){
 const candidates=filtered.filter(d=>d.growth>0&&d.wage>=60000&&d.openings>=100).sort((a,b)=>b.openings-a.openings);
 const top=candidates[0];
 const accessible=filtered.filter(d=>['High school diploma or equivalent','Postsecondary non-degree award',"Associate's degree",'Some college, no degree'].includes(d.education)&&d.wage>=50000&&d.growth>0).sort((a,b)=>(b.openings??0)-(a.openings??0))[0];
 const card=(n,title,body,d)=>`<article class="recommendation"><span class="number">PRIORITY ${n} / INVESTIGATE</span><h3>${title}</h3><p>${body}</p>${d?`<a href="#skills" data-soc="${d.soc}">Explore skills for this occupation →</a>`:'<a href="#methodology">Review evidence and limitations →</a>'}</article>`;
 $('recommendations').innerHTML=card('01',top?`Test training demand for ${esc(top.name.toLowerCase())}`:'Broaden the shortlist before choosing a program',top?`${fmt(top.openings)} annual openings, ${pct(top.growth)} employment growth and a ${dollars(top.wage)} mean wage. This is the largest opening volume among filtered occupations with positive growth, at least 100 openings and wages of $60,000+. Validate hiring difficulty with employers before expanding training.`:'No filtered occupation meets the screening criteria: positive growth, 100+ annual openings and a $60,000+ mean wage. Adjust filters or consider a different wage threshold in your planning.',top)+card('02',accessible?`Explore a pathway into ${esc(accessible.name.toLowerCase())}`:'Build transferable skills before committing to a pathway',accessible?`${fmt(accessible.openings)} annual openings and a ${dollars(accessible.wage)} mean wage, with typical entry education of ${esc(accessible.education.toLowerCase())}. It leads filtered non-bachelor’s pathways with positive growth and $50,000+ wages by openings. Check licensing, training costs and existing program capacity.`:'No occupation in this selection meets the non-bachelor’s pathway screen. Compare O*NET skill requirements and review local course capacity before selecting a training intervention.',accessible);
 $('recommendations').querySelectorAll('[data-soc]').forEach(el=>el.onclick=e=>{e.preventDefault();choose(el.dataset.soc);});
}
function exportFiltered(){const keys=['soc','name','group','employment','projected','growth','openings','wage','education'];const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const header=[...keys,'geography','employment_base_year','projection_year','wage_year','source_url'];const csv=[header,...sortRows(filtered).map(d=>[...keys.map(k=>d[k]),'Massachusetts',2024,2034,2025,meta.source])].map(row=>row.map(quote).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='massachusetts-filtered-occupations.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function start(){try{const response=await fetch('data/workforce.json');if(!response.ok)throw Error('Data request failed');const data=await response.json();all=data.occupations;meta=data.meta;
 ['group','education'].forEach(key=>{const values=[...new Set(all.map(d=>d[key]))].sort();$(key).insertAdjacentHTML('beforeend',values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''));});
 $('search').addEventListener('input',filterRows);['group','education','wage'].forEach(id=>$(id).addEventListener('change',filterRows));$('reset').onclick=()=>{$('search').value='';$('group').value='';$('education').value='';$('wage').value='0';filterRows();};$('sort').onchange=()=>{page=0;renderTable();};$('prev').onclick=()=>{page--;renderTable();};$('next').onclick=()=>{page++;renderTable();};$('skillOccupation').onchange=()=>{selected=$('skillOccupation').value;renderSkills();};$('export').onclick=exportFiltered;
 $('loading').hidden=true;$('dashboard').hidden=false;filterRows();registerTools();
 }catch(error){console.error(error);$('loading').innerHTML='The data could not load. Reload this page or <a href="data/massachusetts-occupations.csv">download the occupation CSV</a>.';}}
function registerTools(){if(!document.modelContext?.registerTool)return;try{Promise.resolve(document.modelContext.registerTool({name:'filter_occupations',title:'Filter Massachusetts occupations',description:'Update the visible dashboard filters and return matching occupations. Does not make funding decisions.',inputSchema:{type:'object',properties:{search:{type:'string'},group:{type:'string'},education:{type:'string'},minimumWage:{type:'number',enum:[0,40000,60000,80000,100000]}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Expected an object');if(Object.keys(input).some(k=>!['search','group','education','minimumWage'].includes(k)))throw Error('Unknown filter');for(const key of ['search','group','education'])if(input[key]!==undefined&&typeof input[key]!=='string')throw Error('Filters must be strings');for(const key of ['group','education'])if(input[key]&&!all.some(d=>d[key]===input[key]))throw Error('Unknown '+key);if(input.minimumWage!==undefined&&![0,40000,60000,80000,100000].includes(input.minimumWage))throw Error('Unsupported wage threshold');$('search').value=input.search??'';$('group').value=input.group??'';$('education').value=input.education??'';$('wage').value=String(input.minimumWage??0);filterRows();return{count:filtered.length,occupations:sortRows(filtered).slice(0,12).map(d=>({soc:d.soc,name:d.name,openings:d.openings,wage:d.wage,growth:d.growth}))};}})).catch(console.warn);}catch(error){console.warn(error);}}
start();
