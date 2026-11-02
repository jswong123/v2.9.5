import './MedalToast.js';
import {HISTORICAL_MEDALS} from './HistoricalMedals.js';
import {getAchievements} from './AchievementSystem.js';
import {refreshHistoricalProgress,ruleForMedal,germanMedalStatus,sovietMedalStatus} from './HistoricalRibbonProgress.js';
import {getKoreanMainlineIds} from './KoreanMainline.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let historicalCountry='CN';
let honorTopLevel='rack';
const HONOR_RACK_KEY='frontline.honorRack.v1';
const loadRack=()=>{try{const v=JSON.parse(localStorage.getItem(HONOR_RACK_KEY)||'[]');return Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string'))]:[]}catch{return []}};
const saveRack=ids=>{localStorage.setItem(HONOR_RACK_KEY,JSON.stringify(ids));document.dispatchEvent(new CustomEvent('frontline:honor-rack-updated',{detail:{ids}}))};
let historicalSubcategory='all';
let historicalSeries='all';
let historicalOwnership='all';
const HISTORICAL_UNLOCK_KEY='frontline.historicalHonors.v1';
function earnedHistorical(m){
 const achievements=getAchievements();
 let extra={};try{extra=JSON.parse(localStorage.getItem(HISTORICAL_UNLOCK_KEY)||'{}')}catch{}
 return Boolean(extra[m.id]?.unlockedAt || achievements[m.id]?.unlockedAt || (m.unlockAchievementId && achievements[m.unlockAchievementId]?.unlockedAt));
}
// 进度数据接口：允许未来的战役结算写入 {current,target}；未接入时明确显示“待接入”，不伪造进度。
const HISTORICAL_PROGRESS_KEY='frontline.historicalHonors.progress.v1';
function honorProgress(m){
 if(earnedHistorical(m))return {current:1,target:1,percent:100,label:'已获得',tracked:true};
 let state={};try{state=JSON.parse(localStorage.getItem(HISTORICAL_PROGRESS_KEY)||'{}')||{}}catch{}
 const entry=state[m.id];
 const target=Number(entry?.target),current=Number(entry?.current);
 if(!Number.isFinite(target)||target<=0||!Number.isFinite(current)||current<0)return {current:0,target:0,percent:0,label:entry?.label?`${entry.label}：${Number(entry.current)||0}（完整条件待接入）`:'尚未接入进度统计',tracked:false};
 const safe=Math.min(current,target);
 return {current:safe,target,percent:Math.round(safe/target*100),label:`${entry?.label||'进度'} ${safe} / ${target}`,tracked:true};
}
function honorProgressHTML(m,detail=false){
 const p=honorProgress(m);
 return `<div class="honor-progress ${detail?'honor-progress-detail':''}" role="group" aria-label="${esc(m.name)}完成进度"><div class="honor-progress-label"><span>${detail?'完成进度':'进度'}</span><span>${esc(p.label)}${p.tracked?' · '+p.percent+'%':''}</span></div><div class="honor-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.percent}" aria-label="${esc(m.name)}完成百分比"><span style="width:${p.percent}%"></span></div></div>`;
}
let historicalSelected=HISTORICAL_MEDALS[0]?.id;
// Historical ribbon-only archive. Original fictional medal renderers are intentionally removed.

// 勋略仅从项目本地资源读取；不在浏览器运行时访问外部网站。
// 资源可通过 scripts/download_honor_ribbons.py 在联网的电脑上批量取得。
const RIBBON_COUNTRY_FOLDERS={CN:'china',SU:'soviet',DE:'germany',US:'usa',UK:'uk',AU:'australia'};
function historicalMedalPhoto(m){
 if(!m.medalImageFile)return '';
 const folder=RIBBON_COUNTRY_FOLDERS[m.countryCode];
 if(!folder)return '';
 const path=`./src/achievements/assets/medals/${folder}/${encodeURIComponent(m.medalImageFile)}`;
 return `<div class="history-medal-photo"><img src="${path}" alt="${esc(m.name)}实体勋章" loading="eager" decoding="async" onerror="this.parentElement.hidden=true"></div>`;
}
function historicalRibbon(m){
 const folder=RIBBON_COUNTRY_FOLDERS[m.countryCode];
 if(!folder)return '<div class="history-ribbon-unknown">勋略图像待核实</div>';
 // 只读取已实际存在的文件；不把未下载图片伪装成已核实。
 if(!m.ribbonImageFile && m.medalImageFile)return historicalMedalPhoto(m);
 const file=m.ribbonImageFile || `${m.id}.svg`;
 const path=`./src/achievements/assets/ribbons/${folder}/${encodeURIComponent(file)}`;
 return `<div class="history-ribbon-photo"><img src="${path}" alt="${esc(m.name)}勋略" loading="eager" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden class="history-ribbon-unknown">勋略图片未安装</span></div>`;
}



const CHINA_HONOR_DETAILS={
 'CN-001':['1955年设立，表彰中国工农红军时期参加革命战争的有功人员；一级主要面向当时师级以上干部。','历史剧本：完成红军时期战役链，累计胜利5场且主力损失率不超过20%。'],
 'CN-002':['1955年设立；二级八一勋章主要对应红军时期团、营级干部的历史资历与功绩。','历史剧本：完成红军时期战役链3场胜利，且至少2场达成全部主要目标。'],
 'CN-003':['1955年设立；三级八一勋章用于表彰符合条例条件的红军时期有功人员。','历史剧本：取得红军时期战役胜利并保存至少60%初始兵力。'],
 'CN-004':['1955年设立的八一奖章，与分三级的八一勋章不同，奖章不分等级。','历史剧本：完成一场红军时期战役并取得胜利。'],
 'CN-005':['1955年设立，纪念抗日战争时期的贡献；一级独立自由勋章主要授予符合条件的旅级以上干部。','抗战剧本：完成5场胜利，至少3场实现全部战略目标，且指挥部均存活。'],
 'CN-006':['独立自由勋章分三级，表彰抗日战争时期参加革命战争的有功人员。','抗战剧本：完成3场胜利，累计消灭敌方作战单位达到设定门槛。'],
 'CN-007':['1955年独立自由勋章的第三级，属于抗日战争时期功绩与资历表彰体系。','抗战剧本：完成2场胜利，至少1场达成全部主要目标。'],
 'CN-008':['独立自由奖章于1955年设立，不分等级；对应抗日战争时期符合条件的有功人员。','抗战剧本：任意取得一场胜利。'],
 'CN-009':['1955年设立；一级解放勋章主要授予符合条件的解放战争时期军级以上干部。','解放战争剧本：完成5场胜利，至少3场达成全部主要目标。'],
 'CN-010':['二级解放勋章属于1955年解放战争时期有功人员授勋体系。','解放战争剧本：完成3场胜利，累计战损比达到2:1。'],
 'CN-011':['三级解放勋章属于1955年解放战争时期有功人员授勋体系。','解放战争剧本：完成2场胜利并保持主力指挥机构存活。'],
 'CN-012':['1955年设立的解放奖章不分等级，表彰符合条例条件的解放战争时期有功人员。','解放战争剧本：任意取得一场胜利。'],
 'CN-013':['现代八一勋章属于中国人民解放军最高荣誉，表彰建立卓越功勋、具有重大影响的军人。与1955年八一勋章不是同一授予制度。','现代剧本：完成战役链全部主要目标，至少5场重大胜利且无指挥部被歼。'],
 'CN-014':['红旗勋章用于表彰指挥作战表现特别出色、为胜利作出杰出贡献并建立卓越功勋的指挥作战人员。','现代剧本：指挥3场战役以较低战损获胜，并完成全部战略目标。'],
 'CN-015':['红星勋章用于表彰战斗或支援保障中完成任务特别出色、建立卓越功勋的人员。','现代剧本：单场高难度战役全目标胜利，并保全关键保障单位。'],
 'CN-016':['战功奖励反映战时突出贡献；具体名称和等级应依适用时期的军队奖励制度解释。','现代剧本：高难度战役全目标胜利，己方损失率低于15%。'],
 'CN-017':['战功奖励用于记录作战行动中的功绩；其分级与授予标准应以相应时期法规为准。','现代剧本：中等以上难度战役全目标胜利，己方损失率低于25%。'],
 'CN-018':['战功奖励体现作战中的实际贡献；历史标准与游戏内评价分开记录。','现代剧本：完成主要战略目标并取得战役胜利。'],
 'CN-019':['战功奖励项目的适用范围与具体标准随制度和时期而异，不应与1955年勋奖混同。','现代剧本：取得一场战役胜利并完成至少一个附加目标。'],
 'CN-020':['国防服役纪念章体现军人国防服役经历；其具体授予条件以适用军队规定为准。','生涯模式：累计完成10场战役或训练任务。'],
 'CN-021':['海外服役纪念章体现符合条件的海外军事任务经历。','生涯模式：完成3次海外行动任务。'],
 'CN-022':['卫国戍边纪念章体现符合条件的边防、戍边服役经历。','生涯模式：完成5次边境防御任务，至少3次守住全部目标。'],
 'CN-023':['献身国防纪念章体现符合条件的国防奉献与牺牲，现实颁授具有专门规定。','生涯模式：完成长期国防任务链；不得简单以人员伤亡数量作为奖励条件。']
};
function historyDetail(m){
 const d=CHINA_HONOR_DETAILS[m.id];
 const history=m.historicalBackground||d?.[0]||`${m.name}为本地勋略图像档案。现有资料尚不足以核实其正式设立年代、授予对象及完整制度沿革。`;
 const rule=ruleForMedal(m);
 const condition=m.countryCode==='SU'&&m.unlockConditionsText?m.unlockConditionsText:m.id==='CN-PEACE-1953'&&!getKoreanMainlineIds().length?'抗美援朝主线目前尚未发布可游玩的关卡；待主线关卡上线后，须以中国人民志愿军阵营完成全部主线胜利。':rule?`${rule.label}：${rule.target}${rule.distinct?'个不同战役':'场'}。仅统计当前游戏能够核验的胜利记录。`:(m.gameCondition||d?.[1]||'尚未配置可核验的游戏获得条件。');
 const suStatus=m.countryCode==='SU'?sovietMedalStatus(m):null;
 const displayCondition=suStatus?suStatus.requirements.map(r=>`${r.label}：${r.unsupported?'等待专项统计接口':`${r.current}/${r.target}`}`).join('；'):condition;
 const scope=m.countryCode==='DE'?(m.deCombatRule?.era==='ww1'?'德意志帝国军队·第一次世界大战（仅对应时代）':'德国军队·第二次世界大战（仅对应时代）'):m.countryCode==='SU'?(m.eligibleScope||'苏联军队指定历史战役'):m.id==='CN-PEACE-1953'?'抗美援朝主线（仅中国人民志愿军；不含1979年汉城政变、普通演习或其他国家战役）':rule?({red:'土地革命战争·中国红军',resistance:'抗日战争·中国人民军队',liberation:'解放战争·中国人民解放军',modern:'现代中国军队战役',training:'T1—T3训练',exercise:'T3—T4演习（含符合等级的朱日和、砺剑）',major:'明确标记T5的重大专项任务',combat:'T6中国军队实战战役',support:'中国军队有效保障操作',air:'中国空军有效行动',navy:'中国海军有效行动',rocket:'中国火箭军有效行动',land:'中国陆军有效行动',border:'中国军队边防任务',overseas:'中国军队海外任务'})[rule.category]||'对应国家军队符合条件的任务':'需对应服役或特殊经历数据；不能使用普通战役胜利代替';
 return `<section class="honor-info-section"><h4>适用战役类别</h4><p>${esc(scope)}</p></section><section class="honor-info-section"><h4>历史背景</h4><p>${esc(history)}</p></section><section class="honor-info-section"><h4>游戏完成条件（拟议）</h4><p>${esc(displayCondition)}</p><small>仅为游戏设计，不代表现实授勋条件；符合当前可统计条件后自动解锁；历史真实授勋条件与游戏规则不同。</small></section>`;
}

function historicalGroup(m){
 if(m.countryCode!=='CN')return 'other';
 if(m.ribbonCategory)return m.ribbonCategory;
 if(m.year===1955 || (m.id>='CN-001' && m.id<='CN-012'))return '1955';
 if(m.type==='勋章')return 'modern-medals';
 if(m.type==='纪念章')return 'commemorative';
 return 'merit';
}

const honorImageCache=new Map();
function warmHonorImages(items){
 for(const medal of items){
  for(const [kind,file] of [['medals',medal.medalImageFile],['ribbons',medal.ribbonImageFile]]){
   if(!file)continue;
   const folder=RIBBON_COUNTRY_FOLDERS[medal.countryCode];
   const path=`./src/achievements/assets/${kind}/${folder}/${encodeURIComponent(file)}`;
   if(honorImageCache.has(path))continue;
   const img=new Image();img.decoding='async';img.src=path;
   honorImageCache.set(path,img);
  }
 }
}
const RACK_PREF_KEY='frontline.honorRack.room.v2';
function rackPrefs(){try{return {...{columns:4,material:'walnut',light:'warm',edit:false},...JSON.parse(localStorage.getItem(RACK_PREF_KEY)||'{}')}}catch{return {columns:4,material:'walnut',light:'warm',edit:false}}}
function storeRackPrefs(p){localStorage.setItem(RACK_PREF_KEY,JSON.stringify(p))}
function rackRibbon(m){
 const folder=RIBBON_COUNTRY_FOLDERS[m.countryCode];
 if(!folder)return '';
 if(!m.ribbonImageFile)return '';
 const path=`./src/achievements/assets/ribbons/${folder}/${encodeURIComponent(m.ribbonImageFile)}`;
 return `<img src="${path}" alt="${esc(m.name)}" draggable="false" loading="eager" onerror="this.closest('.rack-ribbon').classList.add('rack-ribbon-error')">`;
}
function renderRack(panel){
 const prefs=rackPrefs();
 const chosen=loadRack().filter(id=>HISTORICAL_MEDALS.some(m=>m.id===id&&earnedHistorical(m)));
 if(chosen.length!==loadRack().length)saveRack(chosen);
 const rackItems=chosen.map(id=>HISTORICAL_MEDALS.find(m=>m.id===id));
 const ribbonItems=rackItems.filter(m=>m.ribbonImageFile);
 const badgeItems=rackItems.filter(m=>!m.ribbonImageFile&&m.medalImageFile);
 const eligible=HISTORICAL_MEDALS.filter(m=>earnedHistorical(m)&&!chosen.includes(m.id));
 const columns=Math.max(3,Math.min(5,Number(prefs.columns)||4));
 const ribbons=ribbonItems.map((m,i)=>`<div class="rack-ribbon" data-rack-id="${esc(m.id)}" draggable="${prefs.edit?'true':'false'}" tabindex="0" title="${esc(m.country+' · '+m.name)}">${rackRibbon(m)}${prefs.edit?`<button class="rack-remove-mini" data-rack-remove="${esc(m.id)}" aria-label="移除${esc(m.name)}">×</button>`:''}</div>`).join('');
 const badges=badgeItems.map(m=>`<div class="rack-badge" title="${esc(m.name)}">${historicalMedalPhoto(m)}${prefs.edit?`<button data-rack-remove="${esc(m.id)}">移除</button>`:''}</div>`).join('');
 panel.innerHTML=`<div class="honor-shell honor-room-shell"><header class="honor-header"><div><small>FRONTLINE · HALL OF HONORS</small><h2>我的荣誉陈列室</h2><p>真实勋略排 · 木质陈列框 · 立体灯光</p></div><button id="honorClose">返回主菜单 ×</button></header><nav class="honor-categories honor-top-level"><button data-honor-level="rack" class="active">我的勋表展示架</button><button data-honor-level="archive">国家荣誉档案</button></nav>
 <main class="honor-room" data-material="${esc(prefs.material)}" data-light="${esc(prefs.light)}"><div class="room-ceiling"></div><div class="room-spotlight room-spotlight-left"></div><div class="room-spotlight room-spotlight-right"></div><div class="room-wall"><div class="room-title">FRONTLINE · PERSONAL HONORS</div><div class="room-frame" id="honorRackFrame"><div class="room-glass"></div><div class="room-velvet"><div class="room-plaque">我的勋略排 · ${ribbonItems.length}枚</div><div class="rack-ribbon-grid" style="--rack-columns:${columns}">${ribbons||'<div class="rack-empty-note">尚未陈列勋略 · 点击编辑勋表添加已获得的荣誉</div>'}</div>${badges.length?`<div class="rack-badge-row" aria-label="无绶带实体勋章">${badges}</div>`:''}</div></div><div class="room-caption">每一枚勋略，记录一段战役经历</div></div><div class="room-floor"></div></main>
 <section class="rack-controls"><button id="rackEdit">${prefs.edit?'完成编辑':'编辑勋表'}</button><label>每排 <select id="rackColumns"><option value="3" ${columns===3?'selected':''}>3枚</option><option value="4" ${columns===4?'selected':''}>4枚</option><option value="5" ${columns===5?'selected':''}>5枚</option></select></label><label>边框 <select id="rackMaterial"><option value="walnut" ${prefs.material==='walnut'?'selected':''}>胡桃木</option><option value="black" ${prefs.material==='black'?'selected':''}>黑檀木</option><option value="bronze" ${prefs.material==='bronze'?'selected':''}>古铜</option></select></label><label>灯光 <select id="rackLight"><option value="warm" ${prefs.light==='warm'?'selected':''}>暖色射灯</option><option value="cool" ${prefs.light==='cool'?'selected':''}>冷色展灯</option><option value="off" ${prefs.light==='off'?'selected':''}>关闭</option></select></label></section>
 ${prefs.edit?`<section class="rack-edit-panel"><h3>添加已获得的荣誉</h3><p>将勋略拖动到目标位置即可排序。无勋略的胸章式勋章单独陈列，不生成虚构绶带。</p><div class="rack-picker">${eligible.map(m=>`<button data-rack-add="${esc(m.id)}">＋ ${esc(m.country)} · ${esc(m.name)}</button>`).join('')||'<span>没有其他可添加的已获得荣誉。</span>'}</div><div class="rack-edit-order">${rackItems.map((m,i)=>`<div><span>${i+1}. ${esc(m.name)}</span><button data-rack-up="${esc(m.id)}">←</button><button data-rack-down="${esc(m.id)}">→</button><button data-rack-remove="${esc(m.id)}">移除</button></div>`).join('')}</div></section>`:''}</div>`;
 const rerender=()=>{const pos=panel.scrollTop;renderHistorical();panel.scrollTop=pos};
 panel.querySelector('#honorClose').onclick=()=>panel.hidden=true;
 panel.querySelectorAll('[data-honor-level]').forEach(b=>b.onclick=()=>{honorTopLevel=b.dataset.honorLevel;renderHistorical()});
 panel.querySelector('#rackEdit').onclick=()=>{prefs.edit=!prefs.edit;storeRackPrefs(prefs);rerender()};
 for(const [id,key] of [['rackColumns','columns'],['rackMaterial','material'],['rackLight','light']])panel.querySelector('#'+id).onchange=e=>{prefs[key]=key==='columns'?Number(e.target.value):e.target.value;storeRackPrefs(prefs);rerender()};
 panel.querySelectorAll('[data-rack-add]').forEach(b=>b.onclick=()=>{const id=b.dataset.rackAdd;if(!eligible.some(m=>m.id===id))return;saveRack([...chosen,id]);rerender()});
 panel.querySelectorAll('[data-rack-remove]').forEach(b=>b.onclick=()=>{saveRack(chosen.filter(id=>id!==b.dataset.rackRemove));rerender()});
 for(const [dir,delta] of [['up',-1],['down',1]])panel.querySelectorAll(`[data-rack-${dir}]`).forEach(b=>b.onclick=()=>{const ids=chosen.slice(),i=ids.indexOf(b.dataset[`rack${dir[0].toUpperCase()+dir.slice(1)}`]),j=i+delta;if(i<0||j<0||j>=ids.length)return;[ids[i],ids[j]]=[ids[j],ids[i]];saveRack(ids);rerender()});
 panel.querySelectorAll('.rack-ribbon[draggable="true"]').forEach(el=>{el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',el.dataset.rackId);e.dataTransfer.effectAllowed='move'});el.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move'});el.addEventListener('drop',e=>{e.preventDefault();const from=e.dataTransfer.getData('text/plain'),to=el.dataset.rackId;if(from===to||!chosen.includes(from)||!chosen.includes(to))return;const ids=chosen.slice();ids.splice(ids.indexOf(from),1);ids.splice(ids.indexOf(to),0,from);saveRack(ids);rerender()})});
 const room=panel.querySelector('.honor-room'),frame=panel.querySelector('.room-frame');
 room.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=room.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;frame.style.setProperty('--tilt-x',`${(-y*3).toFixed(2)}deg`);frame.style.setProperty('--tilt-y',`${(x*4).toFixed(2)}deg`)});
 room.addEventListener('pointerleave',()=>{frame.style.setProperty('--tilt-x','0deg');frame.style.setProperty('--tilt-y','0deg')});
}
function renderHistorical(){
 refreshHistoricalProgress();
 const panel=document.getElementById('honorPanel');if(!panel)return;
 if(honorTopLevel==='rack'){renderRack(panel);return;}
 const countries=[['CN','中国'],['SU','苏联'],['DE','德国'],['US','美国'],['UK','英国'],['AU','澳大利亚']];
 const groups=[['all','全部勋略'],['1955','1955年革命战争勋略'],['modern-medals','现代军事勋章'],['merit','战功与记功奖励'],['commemorative','军事纪念章'],['service','服役与任务勋表']];
 const national=HISTORICAL_MEDALS.filter(m=>m.countryCode===historicalCountry);
 warmHonorImages(national);
 const inGroup=historicalSubcategory==='all'?national:national.filter(m=>historicalGroup(m)===historicalSubcategory);
 const series=historicalCountry==='CN'&&historicalSubcategory==='1955'?[['all','全部系列'],['bayi','八一勋章及奖章'],['independence','独立自由勋章及奖章'],['liberation','解放勋章及奖章']]:[['all','全部系列']];
 const familyCode=m=>({bayi:'bayi',independence:'independence',liberation:'liberation'})[m.medalFamily]||'other';
 const bySeries=historicalSeries==='all'?inGroup:inGroup.filter(m=>familyCode(m)===historicalSeries);
 const medalSort=(x,y)=>{const base=n=>String(n||'').replace(/（?(金质|银质|铜质|一级|二级|三级|四级|特级)）?/g,'').replace(/勋略/g,'');const rank=n=>/特级|金质|一级/.test(n)?0:/银质|二级/.test(n)?1:/铜质|三级/.test(n)?2:/四级/.test(n)?3:4;return base(x.name)===base(y.name)?rank(x.name)-rank(y.name):0};
 const filtered=bySeries.filter(m=>historicalOwnership==='all'||(historicalOwnership==='earned'?earnedHistorical(m):!earnedHistorical(m))).sort(medalSort);
 if(!filtered.some(m=>m.id===historicalSelected))historicalSelected=filtered[0]?.id;
 const m=filtered.find(m=>m.id===historicalSelected)||null;
 panel.innerHTML=`<div class="honor-shell"><header class="honor-header"><div><small>FRONTLINE · HISTORICAL DECORATIONS</small><h2>历史军事勋略陈列馆</h2><p>按国家及荣誉体系分类 · 历史资料收藏</p></div><button id="honorClose">返回主菜单 ×</button></header>
 <nav class="honor-categories honor-top-level"><button data-honor-level="rack">我的勋表展示架</button><button data-honor-level="archive" class="active">国家荣誉档案</button></nav>
 <nav class="honor-categories">${countries.map(([c,label])=>`<button data-country="${c}" class="${historicalCountry===c?'active':''}">${label}（${HISTORICAL_MEDALS.filter(x=>x.countryCode===c).length}）</button>`).join('')}</nav>
 ${historicalCountry==='CN'?`<nav class="honor-categories honor-subcategories" aria-label="中国荣誉二级分类">${groups.map(([id,label])=>`<button data-subcategory="${id}" class="${historicalSubcategory===id?'active':''}">${label}（${id==='all'?national.length:national.filter(x=>historicalGroup(x)===id).length}）</button>`).join('')}</nav>`:''}
 ${historicalCountry==='CN'&&historicalSubcategory==='1955'?`<nav class="honor-categories honor-series" aria-label="勋奖系列三级分类">${series.map(([id,label])=>`<button data-series="${id}" class="${historicalSeries===id?'active':''}">${label}（${id==='all'?inGroup.length:inGroup.filter(x=>familyCode(x)===id).length}）</button>`).join('')}</nav>`:''}
 <nav class="honor-categories honor-ownership" aria-label="勋略获得状态筛选">
 ${[['all','全部'],['earned','已获得'],['unearned','未获得']].map(([id,label])=>`<button data-ownership="${id}" class="${historicalOwnership===id?'active':''}">${label}（${bySeries.filter(x=>id==='all'||(id==='earned'?earnedHistorical(x):!earnedHistorical(x))).length}）</button>`).join('')}
 </nav>
 <div class="honor-layout"><div class="honor-gallery">${filtered.map(x=>`<button class="honor-item ${earnedHistorical(x)?'earned':'locked'} ${x.id===historicalSelected?'selected':''}" data-history="${x.id}"><div class="history-ribbon-only-card">${historicalRibbon(x)}</div><strong>${esc(x.name)}</strong><small>${esc(x.country)} · ${x.year||'设立年代待核实'}</small><small>${earnedHistorical(x)?'✓ 已获得':'○ 未获得'}</small>${honorProgressHTML(x)}</button>`).join('')}</div>
 ${m?`<aside class="honor-detail honor-ribbon-only-detail"><div class="history-ribbon-detail"><strong>${esc(m.country)}勋略资料</strong>${historicalRibbon(m)}${m.ribbonImageFile?historicalMedalPhoto(m):''}</div><h3>${esc(m.name)}</h3><p class="honor-subtitle">${esc(m.country)} · ${esc(m.type)} · ${m.year||'设立时间待核实'}</p>${historyDetail(m)}${honorProgressHTML(m,true)}<div class="honor-status">档案状态：已收录<br>获得状态：${earnedHistorical(m)?'已获得':'未获得'}<br>自动判定：${ruleForMedal(m)?'已接入对应统计':'尚未接入或主线尚未发布'}</div><p class="honor-disclaimer">勋略仅在图片来源可核实时展示；历史制度与游戏奖励规则分别标注。</p></aside>`:`<aside class="honor-detail"><h3>暂无符合条件的勋略</h3><p>请切换至“全部”或其他筛选条件。</p></aside>`}</div>
 </div>`;
 panel.querySelector('#honorClose').onclick=()=>panel.hidden=true;
 panel.querySelectorAll('[data-honor-level]').forEach(b=>b.onclick=()=>{honorTopLevel=b.dataset.honorLevel;renderHistorical()});
 panel.querySelectorAll('[data-country]').forEach(b=>b.onclick=()=>{historicalCountry=b.dataset.country;historicalSubcategory='all';historicalSeries='all';renderHistorical()});
 panel.querySelectorAll('[data-subcategory]').forEach(b=>b.onclick=()=>{historicalSubcategory=b.dataset.subcategory;historicalSeries='all';renderHistorical()});
 panel.querySelectorAll('[data-series]').forEach(b=>b.onclick=()=>{historicalSeries=b.dataset.series;renderHistorical()});
 panel.querySelectorAll('[data-ownership]').forEach(b=>b.onclick=()=>{historicalOwnership=b.dataset.ownership;renderHistorical()});
 panel.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>{historicalSelected=b.dataset.history;renderHistorical()});
}

export function initAchievementUI(){const btn=document.getElementById('menuHonors');const panel=document.getElementById('honorPanel');if(!btn||!panel)return;btn.addEventListener('click',()=>{panel.hidden=false;honorTopLevel='rack';renderHistorical()});}

// 进度变化后刷新荣誉馆，避免刷新整个游戏。
document.addEventListener('frontline:historical-progress-updated',()=>{if(document.querySelector('[data-history]'))renderHistorical()});
window.addEventListener('storage',e=>{if(['frontline.historicalHonors.progress.v1','frontline.historicalHonors.v1'].includes(e.key)&&document.querySelector('[data-history]'))renderHistorical()});
