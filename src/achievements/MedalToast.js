// 右下角勋略授予提示：仅监听新授予事件，刷新页面不重播。
const queue=[];let active=false;
function showNext(){if(active||!queue.length)return;active=true;const data=queue.shift();
 const box=document.createElement('div');box.className='frontline-medal-toast';box.setAttribute('role','status');box.setAttribute('aria-live','polite');
 const title=document.createElement('div');title.className='frontline-medal-toast-title';title.textContent='🏅 获得新勋略';box.append(title);
 const body=document.createElement('div');body.className='frontline-medal-toast-body';
 if(data.ribbonImageFile&&data.country==='中国'){const img=document.createElement('img');img.alt='勋略图样';img.src='./src/achievements/assets/ribbons/china/'+encodeURIComponent(data.ribbonImageFile);img.onerror=()=>img.remove();body.append(img)}
 const detail=document.createElement('div');const strong=document.createElement('strong');strong.textContent=data.name||'军事荣誉';const desc=document.createElement('small');desc.textContent=data.rule||'已完成授予条件';detail.append(strong,desc);body.append(detail);box.append(body);
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','关闭提示');close.className='frontline-medal-toast-close';box.append(close);document.body.append(box);
 let timer;const dismiss=()=>{clearTimeout(timer);box.remove();active=false;showNext()};close.addEventListener('click',dismiss);timer=setTimeout(dismiss,6500);
}
document.addEventListener('frontline:historical-medal-unlocked',e=>{queue.push(e.detail||{});showNext()});
