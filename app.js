/* =======================
   N Clock app.js
   Clock / Stopwatch / Alarm
   ======================= */

const display = document.getElementById('display');
const slider = document.getElementById('sliderHours');
const labelHours = document.getElementById('labelHours');
const tabClock = document.getElementById('tabClock');
const tabStopwatch = document.getElementById('tabStopwatch');
const tabAlarm = document.getElementById('tabAlarm'); // もし追加したなら
const stopwatchArea = document.getElementById('stopwatchArea');
const startBtn = document.getElementById('startBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const lapsDiv = document.getElementById('laps');
const alarmsDiv = document.getElementById('alarmsDiv'); // アラーム表示用
const addAlarmBtn = document.getElementById('addAlarmBtn'); // アラーム追加ボタン

/* ========= 状態管理 ========== */
let customHours = Number(localStorage.getItem('nclock_hours')) || 24;
let mode = localStorage.getItem('nclock_mode') || 'clock';
let running = false;  // stopwatch running
let elapsedMs = Number(localStorage.getItem('nclock_sw_elapsed')) || 0;
let lastPerf = null;
let laps = JSON.parse(localStorage.getItem('nclock_sw_laps')||'[]');
let alarms = JSON.parse(localStorage.getItem('nclock_alarms')||'[]'); // [{h:HH,m:MM,enabled:true},...]

/* ========= ヘルパー ========== */
function saveSettings(){
  localStorage.setItem('nclock_hours', customHours);
  localStorage.setItem('nclock_mode', mode);
  localStorage.setItem('nclock_sw_elapsed', elapsedMs);
  localStorage.setItem('nclock_sw_laps', JSON.stringify(laps));
  localStorage.setItem('nclock_alarms', JSON.stringify(alarms));
}

/* ========= スライダー ========== */
if(slider){
  slider.value = customHours;
  labelHours.textContent = `${customHours} 時間`;
  slider.addEventListener('input', e=>{
    customHours = Number(e.target.value);
    labelHours.textContent = `${customHours} 時間`;
    saveSettings();
  });
}

/* ========= タブ切替 ========== */
function updateMode(newMode){
  mode = newMode;
  tabClock.classList.toggle('active', mode==='clock');
  tabStopwatch.classList.toggle('active', mode==='stopwatch');
  if(tabAlarm) tabAlarm.classList.toggle('active', mode==='alarm');

  stopwatchArea.style.display = mode==='stopwatch' ? 'block':'none';
  if(slider) slider.parentElement.style.display = mode==='clock'||mode==='stopwatch'?'block':'none';
  if(alarmsDiv) alarmsDiv.style.display = mode==='alarm'?'block':'none';
  display.style.display = mode==='alarm'?'none':'block';

  saveSettings();
}

tabClock.addEventListener('click', ()=>updateMode('clock'));
tabStopwatch.addEventListener('click', ()=>updateMode('stopwatch'));
if(tabAlarm) tabAlarm.addEventListener('click', ()=>updateMode('alarm'));

/* ========= Stopwatch buttons ========== */
startBtn.addEventListener('click', ()=>{
  if(!running){
    running = true;
    lastPerf = performance.now();
    startBtn.textContent = 'Stop';
    startBtn.classList.replace('btn-start','btn-stop');
    lapBtn.disabled = false;
    resetBtn.disabled = true;
  } else {
    running = false;
    startBtn.textContent = 'Start';
    startBtn.classList.replace('btn-stop','btn-start');
    lapBtn.disabled = true;
    resetBtn.disabled = false;
    saveSettings();
  }
});

lapBtn.addEventListener('click', ()=>{
  laps.unshift(display.textContent);
  if(laps.length>50) laps.pop();
  renderLaps();
  saveSettings();
});

resetBtn.addEventListener('click', ()=>{
  elapsedMs = 0;
  laps = [];
  renderLaps();
  resetBtn.disabled = true;
  saveSettings();
});

function renderLaps(){
  if(!lapsDiv) return;
  if(laps.length===0) { lapsDiv.innerHTML='<div style="color:var(--muted); padding:8px;">ラップなし</div>'; return; }
  lapsDiv.innerHTML = laps.map((t,i)=>`<div class="lap-item"><div>Lap ${laps.length-i}</div><div>${t}</div></div>`).join('');
}

/* ========= Alarm functions ========= */
function renderAlarms(){
  if(!alarmsDiv) return;
  if(alarms.length===0){
    alarmsDiv.innerHTML = '<div style="color:var(--muted); padding:8px;">アラームなし</div>';
    return;
  }
  alarmsDiv.innerHTML = alarms.map((a,i)=>{
    const checked = a.enabled?'checked':'';
    return `<div class="alarm-item" style="display:flex; justify-content:space-between; padding:6px; font-size:18px;">
      <div>${String(a.h).padStart(2,'0')}:${String(a.m).padStart(2,'0')}</div>
      <div>
        <input type="checkbox" data-index="${i}" class="alarm-toggle" ${checked}>
        <button data-index="${i}" class="alarm-delete">×</button>
      </div>
    </div>`;
  }).join('');
  document.querySelectorAll('.alarm-toggle').forEach(el=>{
    el.addEventListener('change', e=>{
      const idx = e.target.dataset.index;
      alarms[idx].enabled = e.target.checked;
      saveSettings();
    });
  });
  document.querySelectorAll('.alarm-delete').forEach(el=>{
    el.addEventListener('click', e=>{
      const idx = e.target.dataset.index;
      alarms.splice(idx,1);
      renderAlarms();
      saveSettings();
    });
  });
}

if(addAlarmBtn){
  addAlarmBtn.addEventListener('click', ()=>{
    const h = parseInt(prompt('時(0-23)を入力してください'),10);
    const m = parseInt(prompt('分(0-59)を入力してください'),10);
    if(!isNaN(h) && !isNaN(m)){
      alarms.push({h,h:m,enabled:true});
      renderAlarms();
      saveSettings();
    }
  });
}

/* ========= Clock / Stopwatch display ========= */
function tick(now){
  // Stopwatch
  if(running){
    const dt = now - lastPerf;
    elapsedMs += dt * (24/customHours);
    lastPerf = now;
  }

  // Clock
  if(mode==='clock'){
    const d = new Date();
    const speed = 24/customHours;
    const virtualSec = (d.getHours()*3600+d.getMinutes()*60+d.getSeconds()+d.getMilliseconds()/1000)*speed;
    const h = Math.floor(virtualSec/3600)%24;
    const m = Math.floor(virtualSec/60)%60;
    const s = Math.floor(virtualSec)%60;
    display.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  } else if(mode==='stopwatch'){
    const totalSec = Math.floor(elapsedMs/1000);
    const h = Math.floor(totalSec/3600);
    const m = Math.floor(totalSec/60)%60;
    const s = totalSec%60;
    display.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  } else if(mode==='alarm'){
    // Check alarms
    const nowD = new Date();
    alarms.forEach(a=>{
      if(!a.enabled) return;
      if(a.h===nowD.getHours() && a.m===nowD.getMinutes() && nowD.getSeconds()===0){
        alert(`アラーム ${String(a.h).padStart(2,'0')}:${String(a.m).padStart(2,'0')} が鳴ります！`);
      }
    });
  }

  requestAnimationFrame(tick);
}

/* ========= 初期化 ========= */
(function init(){
  renderLaps();
  renderAlarms();
  updateMode(mode);
  requestAnimationFrame(tick);
})();

/* ========= 定期保存 ========= */
setInterval(saveSettings,2000);
