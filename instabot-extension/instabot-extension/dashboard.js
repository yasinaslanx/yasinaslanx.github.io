// TAB
function stab(id){
  const tabs=['analiz','grafik','unfollow','export'];
  document.querySelectorAll('.ctab').forEach((t,i)=>t.classList.toggle('active',tabs[i]===id));
  document.querySelectorAll('.cblock').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
}

// COPY
function cp(id){
  navigator.clipboard.writeText(document.getElementById(id).innerText).then(()=>{
    const b=document.getElementById(id).previousElementSibling;
    b.textContent='KOPYALANDI!';b.style.color='var(--g)';
    setTimeout(()=>{b.textContent='KOPYALA';b.style.color='';},2000);
  });
}

// LOG
function log(msg,type=''){
  const el=document.getElementById('log');
  const t=new Date().toLocaleTimeString('tr-TR');
  const d=document.createElement('div');
  d.className='ll '+type;d.textContent='['+t+'] '+msg;
  el.appendChild(d);el.scrollTop=el.scrollHeight;
}

// MODAL
function showModal(){document.getElementById('modal').style.display='flex';}
function hideModal(){document.getElementById('modal').style.display='none';}


function loadJson(){
  try{
    const d=JSON.parse(document.getElementById('jsin').value.trim());
    render(d);hideModal();
  }catch(e){log('JSON hatasi: '+e.message,'err');}
}

// DEMO
function loadDemo(){
  const names=['ahmet_kaya','mert_yilmaz','zeynep_sari','elif_demir','burak_tekin','selin_ak','emre_can','nisa_boz','kaan_rauf','arda_m','irem_s','berk_o','ceren_y','deniz_k','ece_t','fatih_g'];
  const following=names.map((n,i)=>({username:n,id:String(1000+i),full_name:n.replace('_',' '),is_private:i%4===0,pic:''}));
  const nonfollowers=following.slice(5);
  const unknown=following.slice(2,4);
  render({username:'demo_hesap',following,nonfollowers,unknown});
  log('Demo verileri yuklendi','inf');
}

// CHARTS
function drawDonut(canvasId, values, colors, cutout){
  const canvas=document.getElementById(canvasId);
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const cx=canvas.width/2, cy=canvas.height/2, r=Math.min(cx,cy)-4;
  const inner=r*cutout;
  const total=values.reduce((a,b)=>a+b,0)||1;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  let start=-Math.PI/2;
  values.forEach((v,i)=>{
    const sweep=(v/total)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,start,start+sweep);
    ctx.closePath();
    ctx.fillStyle=colors[i];
    ctx.fill();
    start+=sweep;
  });
  ctx.beginPath();
  ctx.arc(cx,cy,inner,0,Math.PI*2);
  ctx.fillStyle='#05050e';
  ctx.fill();
}

function drawBar(canvasId, labels, values, colors){
  const canvas=document.getElementById(canvasId);
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const w=canvas.width, h=canvas.height;
  const pad=36, barW=(w-pad*2)/labels.length-10;
  const max=Math.max(...values,1);
  ctx.clearRect(0,0,w,h);
  labels.forEach((lbl,i)=>{
    const x=pad+i*(barW+10);
    const bh=((values[i]/max)*(h-pad-28));
    const y=h-pad-bh;
    ctx.fillStyle=colors[i];
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(x,y,barW,bh,3);
    else ctx.rect(x,y,barW,bh);
    ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.85)';
    ctx.font='bold 11px monospace';
    ctx.textAlign='center';
    ctx.fillText(values[i],x+barW/2,y-6);
    ctx.fillStyle='rgba(180,180,220,0.9)';
    ctx.font='10px monospace';
    ctx.fillText(lbl,x+barW/2,h-16);
  });
}

function drawHBar(canvasId, labels, values, colors){
  const canvas=document.getElementById(canvasId);
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const w=canvas.width, h=canvas.height;
  const max=Math.max(...values,1);
  const barH=22, pad=70;
  ctx.clearRect(0,0,w,h);
  labels.forEach((lbl,i)=>{
    const y=12+i*(barH+14);
    const bw=Math.max(4,(values[i]/max)*(w-pad-14));
    ctx.fillStyle='#1a1a38';
    if(ctx.roundRect) ctx.roundRect(pad,y,w-pad-14,barH,3);
    else ctx.rect(pad,y,w-pad-14,barH);
    ctx.fill();
    ctx.fillStyle=colors[i];
    if(ctx.roundRect) ctx.roundRect(pad,y,bw,barH,3);
    else ctx.rect(pad,y,bw,barH);
    ctx.fill();
    ctx.fillStyle='rgba(180,180,220,0.9)';
    ctx.font='bold 11px monospace';
    ctx.textAlign='right';
    ctx.fillText(lbl,pad-8,y+16);
    ctx.fillStyle='rgba(255,255,255,0.9)';
    ctx.textAlign='left';
    ctx.fillText(values[i],pad+bw+6,y+16);
  });
}

function initCharts(data){
  const {following,nonfollowers,unknown=[]}=data;
  const mutual=following.length-nonfollowers.length-unknown.length;
  const privateCount=nonfollowers.filter(u=>u.is_private).length;
  const publicCount=nonfollowers.length-privateCount;
  const key='ig_uf_'+(data.username||'');
  const done=JSON.parse(localStorage.getItem(key)||'[]');

  const pct=following.length?((nonfollowers.length/following.length)*100).toFixed(1):0;
  document.getElementById('donutPct').textContent=pct+'%';

  drawDonut('donutChart',
    [mutual,nonfollowers.length,unknown.length],
    ['rgba(0,255,136,0.85)','rgba(255,45,85,0.85)','rgba(168,85,247,0.85)'],
    0.65
  );
  drawBar('barChart',
    ['Karşılıklı','Takip Etm.','Bilinmeyen'],
    [mutual,nonfollowers.length,unknown.length],
    ['rgba(0,255,136,0.6)','rgba(255,45,85,0.6)','rgba(168,85,247,0.6)']
  );
  drawBar('pieChart',
    ['Açık','Gizli'],
    [publicCount,privateCount],
    ['rgba(0,170,255,0.6)','rgba(255,204,0,0.6)']
  );
  drawHBar('progressChart',
    ['Bitti','Kalan'],
    [done.length,Math.max(0,nonfollowers.length-done.length)],
    ['rgba(0,255,136,0.6)','rgba(255,45,85,0.4)']
  );

  // Grafik tıklama detayları
  const chartDetails = {
    barChart: {
      title: 'TAKİP DURUMU DETAYI',
      rows: [
        ['Karşılıklı Takip', mutual, '#00ff88'],
        ['Takip Etmeyen', nonfollowers.length, '#ff2d55'],
        ['Bilinmeyen', unknown.length, '#a855f7'],
        ['Toplam Following', following.length, '#0af'],
      ]
    },
    pieChart: {
      title: 'GİZLİ / AÇIK HESAP DETAYI',
      rows: [
        ['Açık Hesap', publicCount, '#0af'],
        ['Gizli Hesap', privateCount, '#ffcc00'],
        ['Toplam Takip Etmeyen', nonfollowers.length, '#ff2d55'],
      ]
    },
    progressChart: {
      title: 'UNFOLLOW İLERLEME DETAYI',
      rows: [
        ['Unfollow Yapıldı', done.length, '#00ff88'],
        ['Kalan', Math.max(0,nonfollowers.length-done.length), '#ff2d55'],
        ['Toplam Hedef', nonfollowers.length, '#0af'],
        ['Tamamlanma %', (nonfollowers.length?((done.length/nonfollowers.length)*100).toFixed(1):0)+'%', '#ffcc00'],
      ]
    }
  };

  ['barChart','pieChart','progressChart'].forEach(id => {
    const c = document.getElementById(id);
    if (!c) return;
    c.style.cursor = 'pointer';
    c.onclick = () => showChartDetail(chartDetails[id]);
  });

  document.getElementById('top-stats').innerHTML=`
    <div style="background:var(--s3);border:1px solid var(--b1);border-radius:7px;padding:10px;text-align:center;cursor:pointer" onclick="showChartDetail({title:'TAKİP ETMEYENLER',rows:[['Takip Etmeyen','${nonfollowers.length}','#ff2d55'],['Oran','${pct}%','#ff2d55']]})">
      <div style="font-family:'JetBrains Mono',monospace;font-size:1.2rem;font-weight:700;color:var(--r)">${nonfollowers.length}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.5rem;color:var(--m);margin-top:2px">TAKİP ETMEYEN</div>
    </div>
    <div style="background:var(--s3);border:1px solid var(--b1);border-radius:7px;padding:10px;text-align:center;cursor:pointer" onclick="showChartDetail({title:'GİZLİ HESAPLAR',rows:[['Gizli','${privateCount}','#ffcc00'],['Açık','${publicCount}','#0af']]})">
      <div style="font-family:'JetBrains Mono',monospace;font-size:1.2rem;font-weight:700;color:var(--y)">${privateCount}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.5rem;color:var(--m);margin-top:2px">GİZLİ HESAP</div>
    </div>
    <div style="background:var(--s3);border:1px solid var(--b1);border-radius:7px;padding:10px;text-align:center;cursor:pointer" onclick="showChartDetail({title:'KARŞILIKLI TAKİP',rows:[['Karşılıklı','${mutual}','#00ff88'],['Oran',((${mutual}/${following.length})*100).toFixed(1)+'%','#00ff88']]})">
      <div style="font-family:'JetBrains Mono',monospace;font-size:1.2rem;font-weight:700;color:var(--g)">${mutual}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.5rem;color:var(--m);margin-top:2px">KARŞILIKLI TAKİP</div>
    </div>
  `;

  document.getElementById('grafik-empty').style.display='none';
  document.getElementById('grafik-content').style.display='block';
}

function showChartDetail(detail){
  let existing = document.getElementById('chart-modal');
  if(existing) existing.remove();
  const m = document.createElement('div');
  m.id = 'chart-modal';
  m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:2000;display:flex;align-items:center;justify-content:center';
  m.innerHTML=`
    <div style="background:#09091a;border:1px solid #252550;border-radius:12px;padding:24px;min-width:280px;box-shadow:0 0 40px rgba(0,255,136,0.1)">
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;letter-spacing:3px;color:#6666aa;margin-bottom:14px">${detail.title}</div>
      ${detail.rows.map(([lbl,val,clr])=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1a1a38">
          <span style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:#aab">${lbl}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-size:1rem;font-weight:700;color:${clr}">${val}</span>
        </div>
      `).join('')}
      <div style="margin-top:14px;text-align:center">
        <button id="close-chart-modal" style="background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.25);border-radius:6px;padding:6px 18px;font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:#00ff88;cursor:pointer;letter-spacing:2px">KAPAT</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);
  document.getElementById('close-chart-modal').addEventListener('click',()=>m.remove());
  m.addEventListener('click',e=>{if(e.target===m)m.remove();});
}

// RENDER
const avs=['a0','a1','a2','a3','a4','a5','a6','a7'];
let allData=null;

function render(data){
  const {username,following,nonfollowers,unknown=[]}=data;
  const mutual=following.length-nonfollowers.length-unknown.length;
  const pct=following.length?((nonfollowers.length/following.length)*100).toFixed(1):0;

  document.getElementById('s-un').textContent='@'+(username||'—');
  document.getElementById('s-fo').textContent=following.length;
  document.getElementById('s-mutual').textContent=mutual>0?mutual:'0';
  document.getElementById('s-nf').textContent=nonfollowers.length;
  document.getElementById('s-pct').textContent=pct+'% oran';
  document.getElementById('s-unk').textContent=unknown.length;
  document.getElementById('nfc').textContent=nonfollowers.length;
  document.getElementById('hst').textContent='VERİ YÜKLENDİ';

  allData=data;
  updProg();
  initCharts(data);

  if(!nonfollowers.length){
    document.getElementById('nflist-wrap').innerHTML='<div class="empty"><div class="big">🎉</div><p>Herkes seni<br>takip ediyor!</p></div>';
    return;
  }

  document.getElementById('searchinput').style.display='block';
  renderList(nonfollowers);
  log('@'+(username||'?')+' analizi yuklendi: '+following.length+' following, '+nonfollowers.length+' takip etmeyen','ok');
}

function renderList(list){
  document.getElementById('nflist-wrap').innerHTML=list.map((u,i)=>`
    <div class="ucard" id="uc-${u.username}">
      <div class="uleft">
        <div class="av-fallback ${avs[i%8]}">${u.username[0].toUpperCase()}</div>
        <div>
          <div class="uname">@${u.username}</div>
          ${u.full_name?`<div class="ufullname">${u.full_name}</div>`:''}
          <div class="utags">
            ${u.is_private?'<span class="utag tag-private">🔒 GİZLİ</span>':''}
          </div>
        </div>
      </div>
      <button class="ufbtn" data-unfollow="${u.username}">UNFOLLOW</button>
    </div>
  `).join('');
}

function filterList(){
  if(!allData)return;
  const q=document.getElementById('searchinput').value.toLowerCase();
  const f=allData.nonfollowers.filter(u=>u.username.toLowerCase().includes(q)||(u.full_name||'').toLowerCase().includes(q));
  renderList(f);
}

function simUF(name){
  const c=document.getElementById('uc-'+name);if(!c)return;
  c.classList.add('ufollowed');
  const b=c.querySelector('.ufbtn');b.textContent='✓ BIRAKILDI';b.classList.add('done');
  log('@'+name+' unfollow edildi','ok');
}

function updProg(){
  const key='ig_uf_'+(allData?.username||'');
  const done=JSON.parse(localStorage.getItem(key)||'[]');
  const total=allData?.nonfollowers?.length||0;
  const pct=total?Math.min(100,(done.length/total*100)):0;
  const pbarEl=document.getElementById('pbar');
  if(pbarEl) pbarEl.style.width=pct+'%';
  const ppctEl=document.getElementById('ppct');
  if(ppctEl) ppctEl.textContent=pct.toFixed(0)+'%';
  const sdone=document.getElementById('s-done');
  if(sdone) sdone.textContent=done.length;
  const skal=document.getElementById('s-kal');
  if(skal) skal.textContent='kalan: '+Math.max(0,total-done.length);
  const spct2=document.getElementById('s-pct2');
  if(spct2) spct2.textContent=pct.toFixed(0)+'%';
}

log('Panel hazir. Kendi profiline git, ANALİZ kodunu calistir.','inf');
log('Firefox kullan — Chrome yonlendirme sorunu yasatabilir.','wrn');
updProg();

// Unfollow butonları için event delegation
document.getElementById('nflist-wrap').addEventListener('click', function(e) {
  const btn = e.target.closest('[data-unfollow]');
  if (btn) simUF(btn.dataset.unfollow);
});

// Search input event listener
const searchEl = document.getElementById('searchinput');
if (searchEl) searchEl.addEventListener('input', filterList);

document.addEventListener('DOMContentLoaded', function() {
  // Extension storage'dan veri otomatik yükle
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['dashboardData'], function(result) {
      if (result.dashboardData) {
        render(result.dashboardData);
        log('Extension verisi otomatik yuklendi!', 'ok');
      }
    });
  }
  // Tab butonları
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => stab(btn.dataset.tab));
  });
  // Kopyala butonları
  const cpMap = { 'cpbtn-analiz': 'code-analiz', 'cpbtn-unfollow': 'code-unfollow', 'cpbtn-export': 'code-export' };
  Object.entries(cpMap).forEach(([btnId, codeId]) => {
    const el = document.getElementById(btnId);
    if (el) el.addEventListener('click', () => cp(codeId));
  });
  // Modal butonları
  const bsm = document.getElementById('btn-show-modal');
  if (bsm) bsm.addEventListener('click', showModal);
  const bhm = document.getElementById('btn-hide-modal');
  if (bhm) bhm.addEventListener('click', hideModal);
  // Demo
  const bd = document.getElementById('btn-demo');
  if (bd) bd.addEventListener('click', loadDemo);
  // Log temizle
  const bcl = document.getElementById('btn-clear-log');
  if (bcl) bcl.addEventListener('click', () => { document.getElementById('log').innerHTML = ''; });
  // JSON yükle
  const blj = document.getElementById('btn-load-json');
  if (blj) blj.addEventListener('click', loadJson);
  // Modal dışına tıklama
  const modal = document.getElementById('modal');
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) hideModal(); });
});
