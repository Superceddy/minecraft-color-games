(() => {
  const $ = (id) => document.getElementById(id);
  const screens = ["home-screen","game-screen","result-screen","finish-screen","colorle-screen","leaderboard-screen"];
  const state = {round:0,score:0,rounds:[],current:null,guess:"#6B8E23",used:[],colorleTarget:null,colorleGuesses:[],colorleFinished:false};
  const MAX_DISTANCE = Math.sqrt(3 * 255 * 255);
  const supabaseClient = window.supabase?.createClient(
    "https://fjonruqyptpoxtwztgnx.supabase.co",
    "sb_publishable_ZOD_FFJkzyOOUSrW0w6CTg_DsRmBvHL"
  );
  const blockColorCache = new Map();
  const textureUrls = (texture) => {
    const names = Array.isArray(texture) ? texture : [texture];
    const urls = [];
    for (const name of names) {
      if (!name) continue;
      urls.push(`https://mcasset.cloud/26.3/assets/minecraft/textures/block/${name}.png`);
      urls.push(`https://mcasset.cloud/26.3/assets/minecraft/textures/item/${name}.png`);
    }
    return [...new Set(urls)];
  };
  function averageTextureColor(img) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 32; canvas.height = 32;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, 32, 32);
      const pixels = ctx.getImageData(0, 0, 32, 32).data;
      let r = 0, g = 0, b = 0, weight = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3] / 255;
        if (alpha < 0.05) continue;
        r += pixels[i] * alpha; g += pixels[i + 1] * alpha; b += pixels[i + 2] * alpha;
        weight += alpha;
      }
      return weight ? rgbToHex([r / weight, g / weight, b / weight]) : null;
    } catch (error) {
      return null;
    }
  }
  async function loadBlockColor(block) {
    if (blockColorCache.has(block.id)) return blockColorCache.get(block.id);
    for (const url of textureUrls(block.texture)) {
      try {
        const image = new Image();
        image.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = url;
        });
        const color = averageTextureColor(image);
        if (color) {
          blockColorCache.set(block.id, color);
          block.color = color;
          return color;
        }
      } catch (error) {}
    }
    if (block.color) return block.color;
    return null;
  }
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
  async function startGame(){
    const startButton = $("start-guess");
    if (startButton) startButton.disabled = true;
    if (window.MC_BLOCKS_READY) await window.MC_BLOCKS_READY;
    if (startButton) startButton.disabled = false;
    state.round=0;state.score=0;state.rounds=[];state.used=[];$("live-score").textContent="0";nextRound();
  }
  function nextRound(){
    if(state.round>=5){finishGame();return;}
    state.current=randomBlock();$("round-number").textContent=state.round+1;$("block-name").textContent=state.current.name;$("block-id").textContent=state.current.id;
    const img=$("block-image"),error=$("texture-error"),submit=$("submit-guess");
    const urls=textureUrls(state.current.texture);let sourceIndex=0;
    submit.disabled=true;
    img.crossOrigin="anonymous";
    img.hidden=false;error.hidden=true;
    img.onerror=()=>{
      sourceIndex++;
      if(sourceIndex<urls.length){img.src=urls[sourceIndex];}
      else{img.hidden=true;error.hidden=false;submit.disabled=false;}
    };
    img.onload=()=>{
      img.hidden=false;error.hidden=true;
      const measured=averageTextureColor(img);
      if(measured) state.current.color=measured;
      submit.disabled=false;
    };
    if(urls.length){img.src=urls[0];}else{img.hidden=true;error.hidden=false;submit.disabled=false;}
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
  async function renderLeaderboard(target,mode="guess_block"){
    const status=$(target==="full-leaderboard"?"full-leaderboard-status":"leaderboard-status");
    if(supabaseClient){
      const {data,error}=await supabaseClient.from("leaderboard").select("player_name,score,created_at").eq("game_mode",mode).order("score",{ascending:false}).order("created_at",{ascending:true}).limit(10);
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

  const normalizeBlockName = value => String(value).toLocaleLowerCase("de-DE").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ß/g,"ss").replace(/[^a-z0-9]/g,"");
  async function startColorle() {
    const button = $("start-colorle");
    if (button) button.disabled = true;
    if (window.MC_BLOCKS_READY) await window.MC_BLOCKS_READY;
    if (button) button.disabled = false;
    if (!window.MC_BLOCKS?.length) {
      $("colorle-status").textContent = "Die Blockliste konnte nicht geladen werden. Bitte lade die Seite neu.";
      showScreen("colorle-screen");
      return;
    }
    const options = $("colorle-block-options");
    if (!options.dataset.ready) {
      options.innerHTML = "";
      window.MC_BLOCKS.forEach(block => {
        const option = document.createElement("option");
        option.value = block.name;
        options.appendChild(option);
      });
      options.dataset.ready = "true";
    }
    $("colorle-guesses").innerHTML = "";
    $("colorle-input").value = "";
    $("colorle-attempt-count").textContent = "0";
    $("colorle-finish").hidden = true;
    $("colorle-submit").disabled = false;
    $("colorle-status").textContent = "Suche den Block mit dieser Farbe. Du hast sechs Versuche.";
    state.colorleGuesses = [];
    state.colorleFinished = false;
    state.colorleTarget = null;
    const pool = [...window.MC_BLOCKS];
    for (let tries = 0; tries < 30 && pool.length; tries++) {
      const index = Math.floor(Math.random() * pool.length);
      const candidate = pool.splice(index, 1)[0];
      const color = await loadBlockColor(candidate);
      if (color) { state.colorleTarget = candidate; state.colorleTarget.color = color; break; }
    }
    if (!state.colorleTarget) {
      $("colorle-status").textContent = "Für keinen Block konnte eine Textur geladen werden. Bitte später erneut versuchen.";
      showScreen("colorle-screen");
      return;
    }
    $("colorle-target-swatch").style.background = state.colorleTarget.color;
    $("colorle-target-hex").textContent = state.colorleTarget.color;
    showScreen("colorle-screen");
  }
  function finishColorle(won) {
    state.colorleFinished = true;
    $("colorle-submit").disabled = true;
    $("colorle-reveal-name").textContent = state.colorleTarget.name;
    $("colorle-reveal-id").textContent = state.colorleTarget.id;
    $("colorle-reveal-swatch").style.background = state.colorleTarget.color;
    $("colorle-finish-title").textContent = won ? "Richtig geraten!" : "Das war der gesuchte Block";
    $("colorle-status").textContent = won
      ? "Du hast den Block in " + state.colorleGuesses.length + " Versuch(en) gefunden."
      : "Du hast alle sechs Versuche genutzt.";
    $("colorle-finish").hidden = false;
  }
  async function submitColorleGuess() {
    if (state.colorleFinished || !state.colorleTarget) return;
    const raw = $("colorle-input").value.trim();
    if (!raw) { $("colorle-input").focus(); return; }
    const key = normalizeBlockName(raw);
    const block = window.MC_BLOCKS.find(item => normalizeBlockName(item.name) === key || normalizeBlockName(item.id) === key);
    if (!block) {
      $("colorle-status").textContent = "Diesen Block kenne ich nicht. Wähle einen Namen aus der Vorschlagsliste.";
      return;
    }
    if (state.colorleGuesses.some(item => item.id === block.id)) {
      $("colorle-status").textContent = "Diesen Block hast du schon geraten.";
      return;
    }
    $("colorle-submit").disabled = true;
    $("colorle-status").textContent = "Textur wird geladen …";
    const color = await loadBlockColor(block);
    $("colorle-submit").disabled = false;
    if (!color) {
      $("colorle-status").textContent = "Für diesen Block konnte keine Textur geladen werden. Versuche einen anderen.";
      return;
    }
    const distance = colorDistance(hexToRgb(color), hexToRgb(state.colorleTarget.color));
    const similarity = Math.max(0, Math.round(100 * (1 - distance / MAX_DISTANCE)));
    state.colorleGuesses.push({id:block.id,name:block.name,color,distance,similarity});
    $("colorle-attempt-count").textContent = String(state.colorleGuesses.length);
    const row = document.createElement("div");
    row.className = "colorle-guess-row";
    const swatch = document.createElement("span");
    swatch.className = "colorle-guess-swatch";
    swatch.style.background = color;
    const name = document.createElement("strong");
    name.textContent = block.name;
    const score = document.createElement("span");
    score.className = "colorle-guess-similarity";
    score.textContent = similarity + "% ähnlich";
    const code = document.createElement("small");
    code.textContent = color;
    row.append(swatch, name, score, code);
    $("colorle-guesses").prepend(row);
    $("colorle-input").value = "";
    if (block.id === state.colorleTarget.id) {
      finishColorle(true);
    } else if (state.colorleGuesses.length >= 6) {
      finishColorle(false);
    } else {
      const target = rgbToHsv(hexToRgb(state.colorleTarget.color));
      const guessed = rgbToHsv(hexToRgb(color));
      const hint = guessed[2] > target[2] ? "Der gesuchte Farbton ist dunkler." : guessed[2] < target[2] ? "Der gesuchte Farbton ist heller." : "Die Helligkeit passt ungefähr.";
      $("colorle-status").textContent = hint + " Noch " + (6 - state.colorleGuesses.length) + " Versuche.";
    }
  }

  window.startGuessGame=startGame;
  $("back-home").addEventListener("click",()=>showScreen("home-screen"));$("submit-guess").addEventListener("click",submitGuess);$("next-round").addEventListener("click",nextRound);$("save-score").addEventListener("click",saveScore);$("play-again").addEventListener("click",startGame);$("show-leaderboard").addEventListener("click",()=>{renderLeaderboard("full-leaderboard");showScreen("leaderboard-screen");});$("leaderboard-back").addEventListener("click",()=>showScreen("home-screen"));
  $("start-colorle").addEventListener("click",startColorle);$("colorle-home").addEventListener("click",()=>showScreen("home-screen"));$("colorle-submit").addEventListener("click",submitColorleGuess);$("colorle-input").addEventListener("keydown",event=>{if(event.key==="Enter")submitColorleGuess();});$("colorle-again").addEventListener("click",startColorle);
  ["hue-range","saturation-range","brightness-range"].forEach(id=>$(id).addEventListener("input",updateFromSliders));
  $("hex-input").addEventListener("input",e=>{const value=e.target.value.replace(/[^0-9a-f]/gi,"").slice(0,6);e.target.value=value;if(value.length===6)setGuess("#"+value);});
  $("copy-hex").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(state.guess);$("copy-hex").textContent="OK";setTimeout(()=>$("copy-hex").textContent="COPY",900);}catch{$("hex-input").select();}});
  setGuess("#6B8E23");renderLeaderboard("home-leaderboard");
})();