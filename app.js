(() => {
  const $ = (id) => document.getElementById(id);
  const screens = ["home-screen","game-screen","result-screen","finish-screen","leaderboard-screen"];
  const state = {round:0,score:0,rounds:[],current:null,guess:"#6B8E23",used:[]};
  const MAX_DISTANCE = Math.sqrt(3 * 255 * 255);
  const supabaseClient = window.supabase?.createClient(
    "https://fjonruqyptpoxtwztgnx.supabase.co",
    "sb_publishable_ZOD_FFJkzyOOUSrW0w6CTg_DsRmBvHL"
  );
  const textureUrl = (texture) => `https://mcasset.cloud/1.21.1/assets/minecraft/textures/block/${texture}.png`;
  const hexToRgb = (hex) => { const clean=hex.replace("#",""); return [0,2,4].map(i=>parseInt(clean.slice(i,i+2),16)); };
  const rgbToHex = (rgb) => "#"+rgb.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("").toUpperCase();
  const colorDistance = (a,b) => Math.sqrt(a.reduce((sum,v,i)=>sum+(v-b[i])**2,0));
  const scoreFor = (distance) => Math.max(0,Math.round(1000*(1-distance/MAX_DISTANCE)));
  function rgbToHsv([r,g,b]){
    r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    let h=0;if(d){if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360;}
    return [Math.round(h),Math.round(max===0?0:d/max*100),Math.round(max*100)];
  }
  function hsvToHex(h,s,v){
    s/=100;v/=100;const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;let rgb;
    if(h<60)rgb=[c,x,0];else if(h<120)rgb=[x,c,0];else if(h<180)rgb=[0,c,x];else if(h<240)rgb=[0,x,c];else if(h<300)rgb=[x,0,c];else rgb=[c,0,x];
    return rgbToHex(rgb.map(n=>(n+m)*255));
  }
  function showScreen(id){screens.forEach(s=>$(s).classList.toggle("active",s===id));window.scrollTo({top:0,behavior:"smooth"});}
  function randomBlock(){let choices=window.MC_BLOCKS.filter(b=>!state.used.includes(b.id));if(!choices.length){state.used=[];choices=window.MC_BLOCKS;}const block=choices[Math.floor(Math.random()*choices.length)];state.used.push(block.id);return block;}
  function setGuess(hex){
    if(!/^#[0-9a-f]{6}$/i.test(hex))return;
    state.guess=hex.toUpperCase();const [h,s,v]=rgbToHsv(hexToRgb(state.guess));
    $("color-preview").style.background=state.guess;$("preview-hex").textContent=state.guess;$("hex-input").value=state.guess.slice(1);
    $("hue-range").value=h;$("saturation-range").value=s;$("brightness-range").value=v;
    $("hue-value").textContent=h+"°";$("saturation-value").textContent=s+"%";$("brightness-value").textContent=v+"%";
    updateSliderTracks();
  }
  function updateSliderTracks(){
    const h=Number($("hue-range").value),s=Number($("saturation-range").value),v=Number($("brightness-range").value);
    $("hue-range").style.setProperty("--track", "linear-gradient(90deg,red,#ff0,#0f0,#0ff,#00f,#f0f,red)");
    $("saturation-range").style.setProperty("--track",`linear-gradient(90deg,#${hsvToHex(h,0,v).slice(1)},#${hsvToHex(h,100,v).slice(1)})`);
    $("brightness-range").style.setProperty("--track",`linear-gradient(90deg,#000,#${hsvToHex(h,s,100).slice(1)})`);
  }
  function updateFromSliders(){setGuess(hsvToHex(Number($("hue-range").value),Number($("saturation-range").value),Number($("brightness-range").value)));}
  function startGame(){state.round=0;state.score=0;state.rounds=[];state.used=[];$("live-score").textContent="0";nextRound();}
  function nextRound(){
    if(state.round>=5){finishGame();return;}
    state.current=randomBlock();$("round-number").textContent=state.round+1;$("block-name").textContent=state.current.name;$("block-id").textContent=state.current.id;
    const img=$("block-image"),error=$("texture-error");
    img.onerror=()=>{img.hidden=true;error.hidden=false;};
    img.onload=()=>{img.hidden=false;error.hidden=true;};
    img.hidden=false;error.hidden=true;img.src=textureUrl(state.current.texture);
    setGuess("#6B8E23");showScreen("game-screen");
  }
  function submitGuess(){const actual=hexToRgb(state.current.color),guess=hexToRgb(state.guess),distance=colorDistance(actual,guess),earned=scoreFor(distance);state.rounds.push({block:state.current.name,guess:state.guess,actual:state.current.color,earned,distance:Math.round(distance)});state.score+=earned;state.round++;$("live-score").textContent=state.score;$("your-result-swatch").style.background=state.guess;$("real-result-swatch").style.background=state.current.color;$("your-result-hex").textContent=state.guess;$("real-result-hex").textContent=state.current.color.toUpperCase();$("round-earned").textContent=earned.toLocaleString("de-DE");$("distance-value").textContent="Δ "+Math.round(distance);$("result-title").textContent=earned>900?"Perfekt getroffen!":earned>700?"Sehr nah dran!":earned>400?"Guter Versuch!":"Das geht noch genauer!";$("result-subtitle").textContent="Die Durchschnittsfarbe von "+state.current.name+" war "+state.current.color.toUpperCase()+"."; $("next-round").innerHTML=state.round>=5?'ERGEBNIS ANSEHEN <span>→</span>':'NÄCHSTE RUNDE <span>→</span>';showScreen("result-screen");}
  function finishGame(){$("final-score").textContent=state.score.toLocaleString("de-DE");showScreen("finish-screen");}
  function readScores(){try{return JSON.parse(localStorage.getItem("mc-color-scores")||"[]");}catch{return [];}}
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function drawLeaderboard(target,scores){
    const el=$(target);if(!scores.length){el.innerHTML='<div class="empty-leaderboard">Noch keine Ergebnisse gespeichert. Starte das erste Spiel!</div>';return;}
    el.innerHTML=scores.map((s,i)=>'<div class="leader-row"><div class="leader-rank">#'+(i+1)+'</div><div><div class="leader-name">'+escapeHtml(s.player_name||s.name||"Spieler")+'</div><div class="leader-date">'+new Date(s.created_at||s.date).toLocaleDateString("de-DE")+'</div></div><div class="leader-score">'+Number(s.score).toLocaleString("de-DE")+' P</div></div>').join("");
  }
  async function renderLeaderboard(target){
    const status=$(target==="full-leaderboard"?"full-leaderboard-status":"leaderboard-status");
    if(supabaseClient){
      const {data,error}=await supabaseClient.from("leaderboard").select("player_name,score,created_at").eq("game_mode","guess_block").order("score",{ascending:false}).order("created_at",{ascending:true}).limit(10);
      if(!error){drawLeaderboard(target,data||[]);if(status)status.textContent="LIVE · Öffentliche Rangliste für alle Spieler";return;}
      if(status)status.textContent="Online-Rangliste gerade nicht erreichbar – lokale Ergebnisse werden angezeigt.";
    }else if(status){status.textContent="Online-Verbindung nicht verfügbar – lokale Ergebnisse werden angezeigt.";}
    drawLeaderboard(target,readScores().sort((a,b)=>b.score-a.score).slice(0,10));
  }
  async function saveScore(){
    const name=$("player-name").value.trim().slice(0,18)||"Spieler";
    const local=readScores();local.push({name,score:state.score,date:new Date().toISOString()});local.sort((a,b)=>b.score-a.score);localStorage.setItem("mc-color-scores",JSON.stringify(local.slice(0,50)));
    $("save-score").disabled=true;$("save-score").textContent="WIRD GESPEICHERT …";
    let saved=false;
    if(supabaseClient){
      const {error}=await supabaseClient.from("leaderboard").insert({player_name:name,score:state.score,game_mode:"guess_block"});
      saved=!error;
    }
    $("save-score").disabled=false;$("save-score").innerHTML='ERGEBNIS SPEICHERN <span>→</span>';
    await Promise.all([renderLeaderboard("full-leaderboard"),renderLeaderboard("home-leaderboard")]);
    if(!saved){const s=$("full-leaderboard-status");if(s)s.textContent="Ergebnis lokal gespeichert; Online-Speicherung hat nicht funktioniert.";}
    showScreen("leaderboard-screen");
  }
  window.startGuessGame=startGame;
  $("back-home").addEventListener("click",()=>showScreen("home-screen"));$("submit-guess").addEventListener("click",submitGuess);$("next-round").addEventListener("click",nextRound);$("save-score").addEventListener("click",saveScore);$("play-again").addEventListener("click",startGame);$("show-leaderboard").addEventListener("click",()=>{renderLeaderboard("full-leaderboard");showScreen("leaderboard-screen");});$("leaderboard-back").addEventListener("click",()=>showScreen("home-screen"));
  ["hue-range","saturation-range","brightness-range"].forEach(id=>$(id).addEventListener("input",updateFromSliders));
  $("hex-input").addEventListener("input",e=>{const value=e.target.value.replace(/[^0-9a-f]/gi,"").slice(0,6);e.target.value=value;if(value.length===6)setGuess("#"+value);});
  $("copy-hex").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(state.guess);$("copy-hex").textContent="OK";setTimeout(()=>$("copy-hex").textContent="COPY",900);}catch{$("hex-input").select();}});
  setGuess("#6B8E23");renderLeaderboard("home-leaderboard");
})();