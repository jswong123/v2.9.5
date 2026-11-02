// v2.8.7 中国勋略：可核验的战役胜利与不同战役统计（游戏虚拟获得条件）
import {HISTORICAL_MEDALS} from './HistoricalMedals.js';
import {getKoreanMainlineIds} from './KoreanMainline.js';
export const PROGRESS_KEY='frontline.historicalHonors.progress.v1';
export const UNLOCK_KEY='frontline.historicalHonors.v1';
const BATTLE_KEY='frontline.historicalHonors.battles.v1';
const read=k=>{try{const x=JSON.parse(localStorage.getItem(k)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}};
const save=(k,x)=>{try{localStorage.setItem(k,JSON.stringify(x));return true}catch(e){console.warn('[勋略进度] 保存失败',e);return false}};
const norm=x=>String(x||'').toLowerCase();
function era(b){const t=norm(b.scenarioKey)+' '+norm(b.scenarioName);const year=Number((t.match(/(?:19[2-9]\d|20[0-3]\d)/)||[])[0]);
 if(/红军|长征|井冈山|苏区|瑞金|遵义|red.army|long.march/.test(t)||year>=1927&&year<=1936)return 'red';
 if(/抗日|台儿庄|滕县|衡阳|长沙|武汉|南京|昆仑关|四行|万家岭|东阳|hangzhou_1937|sihang|taierzhuang|tengxian|hengyang|changsha|nanjing|wanjialing|kunlun|193[7-9]|194[0-5]/.test(t)||year>=1937&&year<=1945)return 'resistance';
 if(/解放战争|渡江|淮海|平津|辽沈|京沪杭|194[6-9]|1950|liberation|yangtze|huaihai/.test(t)||year>=1946&&year<=1950)return 'liberation';
 if(/现代|红蓝|朱日和|砺剑|202[0-9]|203[0-9]|zhurihe|lijian|training.base|taiwan|modern/.test(t)||year>=2000)return 'modern';
 return 'other';}
function kind(b){const t=norm(b.scenarioKey)+' '+norm(b.scenarioName);if(/朱日和|砺剑|演习|训练|zhurihe|lijian|training/.test(t))return 'exercise';if(/澳洲|墨尔本|威勒比|丹德农|australia|melbourne|dandenong|werribee/.test(t))return 'overseas';if(/边境|戍边|边防|border|frontier|新疆|西藏/.test(t))return 'border';return 'battle'}
function grade(m){const n=m.name||'';return /一级|一等|金质/.test(n)?1:/二级|二等|银质/.test(n)?2:/三级|三等|铜质/.test(n)?3:/四级|四等/.test(n)?4:0}
const targetByGrade=(g,values=[40,25,12,5])=>values[g===1?0:g===2?1:g===3?2:3];
const rule=(category,target,distinct=false,label='',minGrade='合格')=>({category,target,distinct,label:label||category,automatic:true,minGrade});
const CN_PATTERN=/(中国|解放军|八路军|新四军|红军|志愿军|蒋匪军|国民党|朱日和|砺剑|台儿庄|南京|杭州|衡阳|长沙|滕县|四行|武汉|昆仑关|万家岭|渡江|淮海|平津|辽沈|徐州|zhurihe|lijian|taierzhuang|nanjing|hangzhou|hengyang|changsha|tengxian|sihang|kunlun|yangtze|huaihai|taiwan)/i;
const FOREIGN_PATTERN=/(苏联|苏军|德国|德军|美军|美国|英国|英军|澳大利亚|澳军|柏林|斯大林格勒|库尔斯克|莫斯科|诺曼底|墨尔本|丹德农|威勒比|berlin|stalingrad|kursk|moscow|normandy|melbourne|dandenong|werribee)/i;
function country(b){const explicit=String(b.playerCountry||'').toUpperCase();if(explicit)return ({CHINA:'CN',PRC:'CN',PLA:'CN',CHN:'CN',USSR:'SU',SOVIET:'SU',GERMANY:'DE',USA:'US',BRITAIN:'UK',AUSTRALIA:'AU'})[explicit]||explicit;
 const name=String(b.scenarioKey||'')+' '+String(b.scenarioName||'');if(FOREIGN_PATTERN.test(name))return '';if(getKoreanMainlineIds().includes(String(b.scenarioKey)))return 'CN';return CN_PATTERN.test(name)?'CN':'';}
function taskLevel(b){if(Number(b.taskLevel)>=1&&Number(b.taskLevel)<=6)return Number(b.taskLevel);const t=String(b.scenarioKey||'')+' '+String(b.scenarioName||'');if(/砺剑|lijian|195旅|195旅|195th/i.test(t))return 4;if(/朱日和|zhurihe|训练场|training/i.test(t))return 2;return 6;}
function isWin(b){return b.victory!==false}
function matchesCategory(b,c){if(!isWin(b))return false;const e=era(b),k=kind(b),level=taskLevel(b);
 if(c==='all')return true;if(c==='korean_mainline')return getKoreanMainlineIds().includes(String(b.scenarioKey));if(c==='red'||c==='resistance'||c==='liberation'||c==='modern')return e===c;
 if(c==='training')return level>=1&&level<=3;if(c==='exercise')return level>=3&&level<=4;if(c==='major')return level===5&&b.specialMission===true;
 if(c==='combat')return level===6;if(c==='support')return (b.supportEffective||0)>0;
 if(c==='air'||c==='navy'||c==='rocket'||c==='land'||c==='logistics')return (b.branchCounts?.[c]||0)>0;
 if(c==='border'||c==='overseas')return k===c;return false;}
export function ruleForMedal(m){if(m.countryCode==='DE'&&m.deSpecialRule==='east-winter')return {category:'de-east-winter',target:1,distinct:false,label:'德国1941—1942东线冬季战役',automatic:true};if(m.countryCode==='DE'&&m.deCombatRule)return {category:'de-combat',target:m.deCombatRule.score,distinct:false,label:'德国军队综合歼敌积分',automatic:true};if(m.countryCode==='SU')return sovietRule(m);if(m.countryCode!=='CN')return null;
 if(m.id==='CN-PEACE-1953'){const ids=getKoreanMainlineIds();return ids.length?rule('korean_mainline',ids.length,true,'抗美援朝全部主线关卡胜利'):null;}const n=m.name||'',g=grade(m),tier=targetByGrade(g,[8,5,3,1]);
 if(m.year===1955||/^CN-00[1-9]$|^CN-01[0-2]$/.test(m.id))return rule(/八一/.test(n)?'red':/独立自由/.test(n)?'resistance':'liberation',tier,true,'对应历史时期不同战役胜利');
 if(/献身国防|英勇表现|牺牲|烈士|背面|和平勋章/.test(n))return null;
 if(/国防服役|服役年限|任职年限/.test(n))return null; // 必须有服役年度数据，不能用胜利场数冒充
 if(/海外服役|海外任务/.test(n))return rule('overseas',3,true,'海外任务（仅战役经历模拟）');
 if(/戍边|边防/.test(n))return rule('border',3,true,'边防任务（仅战役经历模拟）');
 if(/重大专项任务|执行重大任务/.test(n))return rule('major',1,true,'明确标记T5的重大专项任务');
 if(/重大非战争军事行动/.test(n))return null; // 需独立任务类型标记
 if(/联勤保障|保障部队/.test(n))return rule('support',targetByGrade(g,[100,50,20,10]),false,'有效保障操作');
 if(/空军|空天铁拳/.test(n))return rule('air',targetByGrade(g,[100,50,20,10]),false,'有效空军支援');
 if(/海军|深蓝勇士/.test(n))return rule('navy',targetByGrade(g,[80,40,15,8]),false,'有效海军任务');
 if(/火箭军|砺剑尖兵/.test(n))return rule('rocket',targetByGrade(g,[80,40,15,8]),false,'有效导弹支援');
 if(/陆军|陆军先锋/.test(n))return rule('land',targetByGrade(g,[100,50,20,10]),false,'有效陆军作战');
 if(/战略支援部队/.test(n))return rule('support',targetByGrade(g,[80,40,15,8]),false,'有效支援行动');
 if(/训练|演习/.test(n))return rule('exercise',tier,true,'不同综合演习胜利');
 if(/战功|战时|作战任务|战斗英雄|红旗勋章|红星勋章/.test(n))return rule('combat',tier,true,'不同实战题材战役胜利');
 if(/八一勋章（现代）/.test(n))return rule('major',3,true,'重大专项任务胜利');
 if(/嘉奖|立功|优秀基层|荣誉称号|表彰|奖励|功勋/.test(n))return rule('exercise',tier,true,'不同综合演习胜利');
 return null; // 没有可靠统计接口的条目保持待接入，不伪造获得
}
function countFor(r,battles){
 const matches=battles.filter(b=>country(b)==='CN'&&matchesCategory(b,r.category));
 const support=read('frontline.historicalHonors.supportCounters.v1');
 if(r.category==='korean_mainline'){const required=new Set(getKoreanMainlineIds());return new Set(matches.filter(b=>required.has(String(b.scenarioKey))).map(b=>String(b.scenarioKey))).size;}
 if(r.category==='de-combat')return 0;
 if(r.category==='support')return Object.values(support).reduce((sum,n)=>sum+(Number(n)||0),0);
 if(['air','navy','rocket','land','logistics'].includes(r.category))return Number(support[r.category]||0);
 return r.distinct?new Set(matches.map(b=>norm(b.scenarioKey||b.scenarioName))).size:matches.length;
}
export function refreshHistoricalProgress(){const battles=Object.values(read(BATTLE_KEY));const progress=read(PROGRESS_KEY),unlocks=read(UNLOCK_KEY);let changed=false;const newlyUnlocked=[];
 for(const m of HISTORICAL_MEDALS){const rule=ruleForMedal(m);if(!rule)continue;const detail=m.deSpecialRule==='east-winter'?eastWinterMedalStatus(m):m.deCombatRule?germanMedalStatus(m,battles):m.countryCode==='SU'?sovietMedalStatus(m):null;const current=detail?detail.current:Math.min(rule.target,countFor(rule,battles));const old=progress[m.id];if(!old||old.current!==current||old.target!==rule.target||old.label!==rule.label){progress[m.id]={current,target:rule.target,label:rule.label,automatic:true,...(detail?{requirements:detail.requirements}: {})};changed=true}
 if((detail?detail.complete:current>=rule.target)&&!unlocks[m.id]){unlocks[m.id]={unlockedAt:new Date().toISOString(),source:'battle-rule-v3',rule:rule.label};changed=true;newlyUnlocked.push(m)}}
 if(changed){save(PROGRESS_KEY,progress);save(UNLOCK_KEY,unlocks);for(const m of newlyUnlocked)document.dispatchEvent(new CustomEvent('frontline:historical-medal-unlocked',{detail:{id:m.id,name:m.name,country:m.country,ribbonImageFile:m.ribbonImageFile,rule:ruleForMedal(m)?.label}}));document.dispatchEvent(new CustomEvent('frontline:historical-progress-updated',{detail:{battles:battles.length}}))}return progress}
export function recordHistoricalBattle({scenarioKey='',scenarioName='',winner='',playerSide='',turn=0,battleId='',playerCountry='',taskLevel=0,specialMission=false,supportEffective=0,branchCounts={}}={}){
 if(!winner||winner!==playerSide||!(scenarioKey||scenarioName))return false;
 // 同一结算只能记一次。旧结算未提供唯一对局ID，保守按场景/阵营/回合去重。
 const key=String(battleId||`${scenarioKey||scenarioName}:${turn}:${playerSide}`);const seen=read(BATTLE_KEY);if(seen[key])return false;
 seen[key]={scenarioKey,scenarioName,turn,playerSide,playerCountry,taskLevel,specialMission,supportEffective,branchCounts,recordedAt:new Date().toISOString()};if(!save(BATTLE_KEY,seen))return false;refreshHistoricalProgress();return true}
// 打开荣誉馆时重新计算，兼容更新前已记录的战役。

// 仅在实际产生战场效果时调用；battleId用于对单次行动去重。
export function recordHonorSupport({battleId='',actionId='',playerCountry='',supportType='',effectValue=0}={}){
 if(!battleId||!actionId||!supportType||!(Number(effectValue)>0)||!['CN','CHN','PRC','PLA'].includes(String(playerCountry).toUpperCase()))return false;
 const key='frontline.historicalHonors.supportEvents.v1',events=read(key),id=`${battleId}:${actionId}`;if(events[id])return false;events[id]={battleId,supportType,effectValue,playerCountry:'CN'};if(!save(key,events))return false;
 const counters=read('frontline.historicalHonors.supportCounters.v1');counters[supportType]=(counters[supportType]||0)+1;save('frontline.historicalHonors.supportCounters.v1',counters);refreshHistoricalProgress();return true;
}

// 德国勋略：只统计明确声明为德军指挥的有效歼灭事件。
const DE_KILLS_KEY='frontline.historicalHonors.germanKills.v1';
const DE_BATTLE_KEY='frontline.historicalHonors.germanBattles.v1';
const DE_WEIGHT={infantry:1,mechanized:2,armored:3,artillery:3,airdefense:2,special:3,hq:5,other:1};
export function recordGermanUnitDestroyed({battleId='',eventId='',playerCountry='',scenarioKey='',era='',unitId='',unitType='',unitCount=1}={}){
 if(!battleId||!(eventId||unitId)||!['DE','GERMANY','GER'].includes(String(playerCountry).toUpperCase()))return false;
 const type=String(unitType).toLowerCase();if(!(type in DE_WEIGHT))return false;
 const count=Number(unitCount);if(!Number.isInteger(count)||count!==1)return false;
 const period=String(era).toLowerCase();if(!['ww1','ww2'].includes(period))return false;
 const key=`${battleId}:${eventId||unitId}`,events=read(DE_KILLS_KEY);if(events[key])return false;
 events[key]={battleId,scenarioKey,era:period,type,unitId,score:DE_WEIGHT[type]};if(!save(DE_KILLS_KEY,events))return false;
 refreshHistoricalProgress();return true;
}
export function recordGermanBattleVictory({battleId='',scenarioKey='',playerCountry='',era='',rating='合格'}={}){
 if(!battleId||!scenarioKey||!['DE','GERMANY','GER'].includes(String(playerCountry).toUpperCase())||!['ww1','ww2'].includes(String(era).toLowerCase()))return false;
 const state=read(DE_BATTLE_KEY);if(state[battleId])return false;
 state[battleId]={scenarioKey,era:String(era).toLowerCase(),rating};if(!save(DE_BATTLE_KEY,state))return false;
 refreshHistoricalProgress();return true;
}
export function germanMedalStatus(m){
 const r=m.deCombatRule;if(!r)return null;
 const events=Object.values(read(DE_KILLS_KEY)).filter(e=>r.era==='historical'||e.era===r.era);
 const battles=Object.values(read(DE_BATTLE_KEY)).filter(e=>r.era==='historical'||e.era===r.era);
 const counts={};let score=0;for(const e of events){counts[e.type]=(counts[e.type]||0)+1;score+=Number(e.score)||0}
 const wins=new Set(battles.map(b=>b.scenarioKey)).size;
 const excellent=new Set(battles.filter(b=>['优秀','卓越'].includes(b.rating)).map(b=>b.scenarioKey)).size;
 const requirements=[['综合歼敌积分',score,r.score],['步兵单位',counts.infantry||0,r.infantry],['装甲及机械化单位',(counts.armored||0)+(counts.mechanized||0),r.heavy],['炮兵单位',counts.artillery||0,r.artillery],['不同德国战役胜利',wins,r.victories],['优秀及以上评价',excellent,r.excellent]].filter(x=>x[2]>0).map(([label,current,target])=>({label,current,target}));
 return {current:Math.min(score,r.score),requirements,complete:requirements.every(x=>x.current>=x.target)};
}

// 苏联：只依据明确标记为苏军、二战的结算及实际歼敌事件。
const SU_KILLS_KEY='frontline.historicalHonors.sovietKills.v1';
const SU_BATTLE_KEY='frontline.historicalHonors.sovietBattles.v1';
export function recordSovietUnitDestroyed(event={}){
 if(!['SU','USSR','SOVIET'].includes(String(event.playerCountry||'').toUpperCase()))return false;
 return recordForeignDestroyed(SU_KILLS_KEY,event);
}
function recordForeignDestroyed(storageKey,{battleId='',eventId='',unitId='',unitType='',unitCount=1,scenarioKey='',era='',playerCountry=''}={}){
 if(!battleId||!(eventId||unitId)||String(era).toLowerCase()!=='ww2'||Number(unitCount)!==1)return false;
 const type=String(unitType).toLowerCase();if(!(type in DE_WEIGHT))return false;
 const events=read(storageKey),key=`${battleId}:${eventId||unitId}`;if(events[key])return false;
 events[key]={battleId,scenarioKey,era:'ww2',type,unitId,score:DE_WEIGHT[type]};
 if(!save(storageKey,events))return false;refreshHistoricalProgress();return true;
}
export function recordSovietBattleVictory({battleId='',scenarioKey='',playerCountry='',era='',rating='合格',allObjectives=false}={}){
 if(!battleId||!scenarioKey||!['SU','USSR','SOVIET'].includes(String(playerCountry).toUpperCase())||String(era).toLowerCase()!=='ww2')return false;
 const state=read(SU_BATTLE_KEY);if(state[battleId])return false;
 state[battleId]={scenarioKey,era:'ww2',rating,allObjectives:allObjectives===true};
 if(!save(SU_BATTLE_KEY,state))return false;refreshHistoricalProgress();return true;
}
export function sovietRule(m){
 if(m.countryCode!=='SU')return null;
 return {category:'su-combat',target:sovietMedalStatus(m)?.requirements.length||1,distinct:false,label:'苏军二战战绩条件',automatic:true};
}
// 德国东线冬季奖章：要求场景明确标记冬季东线，避免把其他东线战役混入。
function eastWinterMedalStatus(m){
 const b=Object.values(read(DE_BATTLE_KEY));const e=Object.values(read(DE_KILLS_KEY));
 const eligible=b.filter(x=>x.era==='ww2'&&/(1941|1942)/i.test(x.scenarioKey||'')&&/(east|ost|东线|莫斯科|moscow|冬季|winter)/i.test(x.scenarioKey||''));
 const wins=new Set(eligible.map(x=>x.scenarioKey)).size;
 const kills=e.filter(x=>eligible.some(b=>b.scenarioKey===x.scenarioKey)).length;
 const requirements=[{label:'1941—1942年东线冬季战役胜利',current:wins,target:1},{label:'对应战役歼敌单位',current:kills,target:5}];
 return {current:requirements.filter(r=>r.current>=r.target).length,requirements,complete:requirements.every(r=>r.current>=r.target)};
}
// 所有苏联荣誉均建立统计条目；无法核验的城市目标、海军、游击任务保持待接入，不误授。
// 战役纪念奖章：只有明确的苏军战役ID且已核验战略目标才能授予。
// 不再以任意两场胜利替代指定城市的攻克、保卫或解放。
const SU_CAMPAIGN_IDS={
 '柏林':['berlin'], '斯大林格勒':['stalingrad_approach','stalingrad_uranus','stalingrad_ring','stalingrad_grain_elevator','stalingrad_volga_crossing','stalingrad_red_october','stalingrad_barrikady','stalingrad-tractor-factory'],
 '莫斯科':['moscow'], '列宁格勒':['leningrad'], '敖德萨':['odessa'], '塞瓦斯托波尔':['sevastopol'],
 '高加索':['caucasus'], '苏联北极地区':['soviet_arctic'], '柯尼斯堡':['konigsberg','koenigsberg'],
 '维也纳':['vienna'], '华沙':['warsaw'], '布拉格':['prague'], '布达佩斯':['budapest'], '贝尔格莱德':['belgrade']
};
export function sovietMedalStatus(m){
 if(m.countryCode!=='SU')return null;
 const name=String(m.name||''),condition=String(m.gameCondition||'');
 const events=Object.values(read(SU_KILLS_KEY)).filter(x=>x.era==='ww2');
 const battles=Object.values(read(SU_BATTLE_KEY)).filter(x=>x.era==='ww2');
 const counts={};let score=0;for(const e of events){score+=Number(e.score)||0;counts[e.type]=(counts[e.type]||0)+1}
 const wins=new Set(battles.map(x=>x.scenarioKey)).size;
 const excellent=new Set(battles.filter(x=>['优秀','卓越'].includes(x.rating)).map(x=>x.scenarioKey)).size;
 const great=new Set(battles.filter(x=>x.rating==='卓越').map(x=>x.scenarioKey)).size;
 const req=[];const add=(label,current,target,unsupported=false)=>req.push({label,current,target,unsupported});
 const city=name.match(/(?:保卫|攻克|解放)(莫斯科|列宁格勒|敖德萨|塞瓦斯托波尔|斯大林格勒|高加索|苏联北极地区|柏林|柯尼斯堡|维也纳|华沙|布拉格|布达佩斯|贝尔格莱德)/);
 if(city){
  const ids=SU_CAMPAIGN_IDS[city[1]]||[];
  const relevant=battles.filter(b=>ids.includes(String(b.scenarioKey||'').toLowerCase()));
  const complete=relevant.some(b=>b.allObjectives===true);
  add('指定历史战役：'+city[1],relevant.length?1:0,1);
  add('该战役核心目标全部完成',complete?1:0,1);
 }else if(/战胜德国|战胜日本/.test(name)){
  add('待接入：对应战区最终主线完成事件',0,1,true);
 }else if(/游击|乌沙科夫|纳希莫夫|舰|海军|护航|登陆/.test(name)){
  add('待接入：专项海军或游击作战事件',0,1,true);
 }else{
  // 非战役纪念荣誉：只能解析明确数值指标；未识别条件不得自动授予。
  const patterns=[
   [/综合歼敌积分\s*(?:≥|>=|至少)\s*(\d+)/g,'综合歼敌积分',score],
   [/(?:不同(?:T6)?战役|不同战役|苏联不同战役)(?:胜利)?\s*(?:至少|≥|>=|=)\s*(\d+)/g,'不同战役胜利',wins],
   [/优秀(?:及以上)?评价\s*(?:至少|≥|>=|=)\s*(\d+)/g,'优秀评价',excellent],
   [/卓越评价\s*(?:至少|≥|>=|=)\s*(\d+)/g,'卓越评价',great],
   [/(?:歼灭|消灭)步兵(?:单位)?\s*(?:至少|≥|>=|=)\s*(\d+)/g,'步兵单位',counts.infantry||0],
   [/(?:歼灭|消灭)炮兵(?:单位)?\s*(?:至少|≥|>=|=)\s*(\d+)/g,'炮兵单位',counts.artillery||0],
   [/(?:歼灭|消灭)装甲(?:及机械化)?(?:单位)?\s*(?:至少|≥|>=|=)\s*(\d+)/g,'装甲/机械化单位',(counts.armored||0)+(counts.mechanized||0)]
  ];
  let remaining=condition;
  for(const [re,label,current] of patterns){let match;while((match=re.exec(condition))){add(label,current,Number(match[1]));remaining=remaining.replace(match[0],'')}}
  // 原有自由文本不可被当作结构化的可核验规则；未知条款保持锁定。
  if(remaining.replace(/[；;、，,。\s]/g,'')||!req.length)add('待接入：'+(remaining.trim()||'专项任务及指挥条件'),0,1,true);
  if(/光荣勋章/.test(name)&&/一级|二级/.test(name)){
   const prior=name.replace(/一级/,'二级').replace(/二级/,'三级');
   const prev=HISTORICAL_MEDALS.find(x=>x.countryCode==='SU'&&x.name===prior);
   add('前一级光荣勋章已获得',prev&&read(UNLOCK_KEY)[prev.id]?.unlockedAt?1:0,1);
  }
 }
 const complete=req.length>0&&req.every(x=>!x.unsupported&&x.current>=x.target);
 return {current:req.filter(x=>!x.unsupported&&x.current>=x.target).length,requirements:req,complete};
}
