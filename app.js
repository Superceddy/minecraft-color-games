(() => {
  const $ = (id) => document.getElementById(id);
  const screens = ["home-screen","game-screen","result-screen","finish-screen","krillion-screen","krillion-finish-screen","leaderboard-screen"];
  const state = {round:0,score:0,rounds:[],current:null,guess:"#6B8E23",used:[],krillionRound:0,krillionScore:0,krillionQuestions:[],krillionCurrent:null,krillionTimer:null,krillionLocked:false,krillionTimeLeft:20};
  const MAX_DISTANCE = Math.sqrt(3 * 255 * 255);
  const supabaseClient = window.supabase?.createClient(
    "https://fjonruqyptpoxtwztgnx.supabase.co",
    "sb_publishable_ZOD_FFJkzyOOUSrW0w6CTg_DsRmBvHL"
  );
  const textureUrls = (texture) => [`https://raw.githubusercontent.com/Faithful-Pack/Default-Java/1.21.1/assets/minecraft/textures/block/${texture}.png`,`https://mcasset.cloud/1.21.1/assets/minecraft/textures/block/${texture}.png`];
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
    img.hidden=false;error.hidden=true;const urls=textureUrls(state.current.texture);let sourceIndex=0;img.onerror=()=>{sourceIndex++;if(sourceIndex<urls.length){img.src=urls[sourceIndex];}else{img.hidden=true;error.hidden=false;}};img.onload=()=>{img.hidden=false;error.hidden=true;};img.src=urls[0];
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

  const KRILLION_QUESTIONS = [
    {q:"Nenne ein Biom im Nether.",a:[["Nether-Ödland",5,["Nether Wastes","Netherwüste"]],["Karmesinwald",9,["Crimson Forest"]],["Wirrwald",12,["Warped Forest"]],["Seelensandtal",17,["Soul Sand Valley"]],["Basaltdeltas",30,["Basalt Deltas"]]]},
    {q:"Nenne ein Biom der Oberwelt.",a:[["Ebene",5,["Plains"]],["Wald",6,["Forest"]],["Wüste",7,["Desert"]],["Dschungel",9,["Jungle"]],["Blumenwald",12,["Flower Forest"]],["Pilzfelder",17,["Mushroom Fields"]],["Eisige Spitzen",20,["Frozen Peaks"]],["Kirschblütenhain",30,["Cherry Grove"]]]},
    {q:"Nenne ein Biom im Ende.",a:[["Das Ende",5,["The End"]],["End-Mittelland",9,["End Midlands"]],["End-Hochland",12,["End Highlands"]],["End-Barrens",17,["End Barrens"]],["Kleine Endinseln",30,["Small End Islands"]]]},
    {q:"Nenne einen passiven Mob.",a:[["Kuh",5,["Cow"]],["Schaf",5,["Sheep"]],["Schwein",6,["Pig"]],["Huhn",7,["Chicken"]],["Axolotl",12,[]],["Mooshroom",17,["Pilzkuh"]],["Sniffer",20,["Schnüffler"]],["Schreiter",30,["Strider"]]]},
    {q:"Nenne einen Mob, der im Nether vorkommt.",a:[["Ghast",5,[]],["Piglin",6,[]],["Lohen",9,["Blaze"]],["Magmakubus",12,["Magma Cube"]],["Hoglin",17,[]],["Zoglin",20,[]],["Piglin-Barbar",30,["Piglin Brute"]]]},
    {q:"Nenne einen Mob aus Minecraft.",a:[["Zombie",5,[]],["Skelett",5,["Skeleton"]],["Creeper",6,[]],["Enderman",7,[]],["Hexe",9,["Witch"]],["Delfin",12,["Dolphin"]],["Wächter",17,["Guardian"]],["Wärter",20,["Warden"]],["Eisbär",30,["Polar Bear"]]]},
    {q:"Nenne etwas, das man beim Angeln bekommen kann.",a:[["Kabeljau",5,["Cod"]],["Lachs",6,["Salmon"]],["Tropischer Fisch",9,["Tropical Fish"]],["Tintenbeutel",12,["Ink Sac"]],["Namensschild",17,["Name Tag"]],["Nautilusschale",20,["Nautilus Shell"]],["Sattel",30,["Saddle"]]]},
    {q:"Nenne einen Block, der Licht abgibt.",a:[["Fackel",5,["Torch"]],["Glowstone",7,["Leuchtstein"]],["Seelaterne",9,["Sea Lantern"]],["Laterne",12,["Lantern"]],["Shroomlight",17,["Pilzlicht"]],["Seelenlaterne",20,["Soul Lantern"]],["Froschlicht",30,["Froglight"]]]},
    {q:"Nenne eine Holzart in Minecraft.",a:[["Eiche",5,["Oak","Eichenholz"]],["Fichte",6,["Spruce","Fichtenholz"]],["Birke",7,["Birch","Birkenholz"]],["Dschungelholz",9,["Jungle","Dschungel"]],["Akazie",12,["Acacia","Akazienholz"]],["Mangrove",15,["Mangrovenholz"]],["Kirschholz",17,["Cherry","Kirschbaum"]],["Bambus",20,["Bamboo","Bambusholz"]],["Wirrholz",30,["Warped","Wirr-Stamm"]]]},
    {q:"Nenne einen Trankeffekt.",a:[["Heilung",5,["Instant Health"]],["Feuerresistenz",7,["Fire Resistance"]],["Nachtsicht",9,["Night Vision"]],["Langsamkeit",12,["Slowness"]],["Wasseratmung",15,["Water Breathing"]],["Unsichtbarkeit",17,["Invisibility"]],["Glück",20,["Luck"]],["Schwebekraft",30,["Levitation"]]]},
    {q:"Nenne ein Erz in Minecraft.",a:[["Kohle",5,["Coal","Coal Ore","Kohleerz"]],["Eisen",6,["Iron","Iron Ore","Eisenerz"]],["Kupfer",7,["Copper","Copper Ore","Kupfererz"]],["Gold",9,["Gold Ore","Golderz"]],["Redstone",12,["Redstone Ore","Redstone-Erz"]],["Lapislazuli",15,["Lapis","Lapis Lazuli Ore","Lapiserz"]],["Diamant",20,["Diamond","Diamond Ore","Diamanterz"]],["Smaragd",30,["Emerald","Emerald Ore","Smaragderz"]]]},
    {q:"Nenne eine Struktur in der Oberwelt.",a:[["Dorf",5,["Village"]],["Wüstentempel",7,["Desert Temple"]],["Schiffswrack",9,["Shipwreck"]],["Dschungeltempel",12,["Jungle Temple"]],["Ozeanmonument",15,["Ocean Monument"]],["Waldanwesen",20,["Woodland Mansion"]],["Prüfungskammer",30,["Trial Chambers"]]]},
    {q:"Nenne etwas, womit man sich in Minecraft fortbewegen kann.",a:[["Boot",5,["Boat"]],["Minecart",7,["Lore","Lore"]],["Pferd",9,["Horse"]],["Elytren",12,["Elytra"]],["Sattel",15,["Saddle"]],["Strider",20,["Schreiter"]],["Feuerwerksrakete",30,["Firework Rocket"]]]},
    {q:"Nenne einen Dorfbewohner-Beruf.",a:[["Bauer",5,["Farmer"]],["Bibliothekar",7,["Librarian"]],["Kleriker",9,["Cleric"]],["Kartograf",12,["Cartographer"]],["Waffenschmied",15,["Weaponsmith"]],["Gerber",20,["Leatherworker"]],["Pfeilmacher",30,["Fletcher"]]]},
    {q:"Nenne eine Blume in Minecraft.",a:[["Löwenzahn",5,["Dandelion"]],["Mohn",5,["Poppy"]],["Tulpe",7,["Tulip"]],["Kornblume",9,["Cornflower"]],["Allium",12,[]],["Sonnenblume",15,["Sunflower"]],["Spore Blossom",20,["Sporeblüte"]],["Wither-Rose",30,["Wither Rose"]]]},
    {q:"Nenne etwas, das man mit Diamanten herstellen kann.",a:[["Diamantspitzhacke",5,["Diamond Pickaxe"]],["Diamantschwert",6,["Diamond Sword"]],["Diamantbrustplatte",9,["Diamond Chestplate"]],["Diamantstiefel",12,["Diamond Boots"]],["Jukebox",17,["Plattenspieler"]],["Verzauberungstisch",20,["Enchanting Table"]],["Feuerwerksstern",30,["Firework Star"]]]},
    {q:"Nenne eine Verzauberung.",a:[["Schärfe",5,["Sharpness"]],["Haltbarkeit",6,["Unbreaking"]],["Effizienz",7,["Efficiency"]],["Glück",9,["Fortune"]],["Seide",12,["Silk Touch"]],["Reparatur",15,["Mending"]],["Seelenläufer",20,["Soul Speed"]],["Windstoß",30,["Wind Burst"]]]},
    {q:"Nenne ein essbares Item.",a:[["Brot",5,["Bread"]],["Apfel",5,["Apple"]],["Steak",7,["Cooked Beef"]],["Goldener Apfel",9,["Golden Apple"]],["Kürbiskuchen",12,["Pumpkin Pie"]],["Chorusfrucht",15,["Chorus Fruit"]],["Verdächtiger Eintopf",20,["Suspicious Stew"]],["Verzauberter goldener Apfel",30,["Enchanted Golden Apple","Notch Apple"]]]},
    {q:"Nenne einen Arbeitsplatz eines Dorfbewohners.",a:[["Komposter",5,["Composter"]],["Lesepult",7,["Lectern"]],["Braustand",9,["Brewing Stand"]],["Schmiedetisch",12,["Smithing Table"]],["Kartentisch",15,["Cartography Table"]],["Schleifstein",17,["Grindstone"]],["Kessel",20,["Cauldron"]],["Fass",30,["Barrel"]]]},
    {q:"Nenne eine Farbstofffarbe.",a:[["Rot",5,["Red","Red Dye"]],["Blau",5,["Blue","Blue Dye"]],["Gelb",6,["Yellow","Yellow Dye"]],["Grün",7,["Green","Green Dye"]],["Türkis",9,["Cyan","Cyan Dye"]],["Magenta",12,["Magenta Dye"]],["Hellgrau",17,["Light Gray","Light Gray Dye"]],["Braun",30,["Brown","Brown Dye"]]]},
    {q:"Nenne einen Redstone-Bauteil.",a:[["Redstone-Staub",5,["Redstone Dust"]],["Hebel",6,["Lever"]],["Knopf",7,["Button"]],["Druckplatte",9,["Pressure Plate"]],["Redstone-Fackel",12,["Redstone Torch"]],["Beobachter",15,["Observer"]],["Zielblock",20,["Target"]],["Kalibrierter Sculk-Sensor",30,["Calibrated Sculk Sensor"]]]},
    {q:"Nenne ein Höhlenbiom.",a:[["Tropfsteinhöhlen",5,["Dripstone Caves"]],["Üppige Höhlen",9,["Lush Caves"]],["Dunkle Tiefen",30,["Deep Dark"]]]},
    {q:"Nenne eine Kupfer-Variante.",a:[["Kupferblock",5,["Copper Block"]],["Angeschlagener Kupferblock",9,["Exposed Copper"]],["Verwitterter Kupferblock",15,["Weathered Copper"]],["Oxidierter Kupferblock",20,["Oxidized Copper"]],["Gewachster oxidierter Kupferblock",30,["Waxed Oxidized Copper"]]]},
    {q:"Nenne eine Art von Schiene.",a:[["Schiene",5,["Rail"]],["Antriebsschiene",9,["Powered Rail"]],["Sensorschiene",15,["Detector Rail"]],["Aktivierungsschiene",30,["Activator Rail"]]]},
    {q:"Nenne einen Mob, den man zähmen kann.",a:[["Wolf",5,["Hund"]],["Katze",7,["Cat"]],["Papagei",9,["Parrot"]],["Pferd",12,["Horse"]],["Esel",15,["Donkey"]],["Maultier",17,["Mule"]],["Lama",20,["Llama"]],["Skelettpferd",30,["Skeleton Horse"]]]},
    {q:"Nenne einen Boss in Minecraft.",a:[["Enderdrache",5,["Ender Dragon"]],["Wither",30,["Wither Boss"]]]},
    {q:"Nenne eine Holzart, aus der es Boote gibt.",a:[["Eiche",5,["Oak"]],["Fichte",6,["Spruce"]],["Birke",7,["Birch"]],["Dschungel",9,["Jungle"]],["Akazie",12,["Acacia"]],["Dunkleiche",15,["Dark Oak"]],["Mangrove",20,[]],["Kirschholz",30,["Cherry"]]]},
    {q:"Nenne einen Block mit einer besonderen Funktion.",a:[["Werkbank",5,["Crafting Table"]],["Ofen",6,["Furnace"]],["Amboss",9,["Anvil"]],["Schmelzofen",12,["Blast Furnace"]],["Räucherofen",15,["Smoker"]],["Steinsäge",17,["Stonecutter"]],["Webstuhl",20,["Loom"]],["Bücherregal",30,["Bookshelf"]]]},
    {q:"Nenne einen Block, der von Schwerkraft beeinflusst wird.",a:[["Sand",5,[]],["Kies",6,["Gravel"]],["Roter Sand",9,["Red Sand"]],["Amboss",12,["Anvil"]],["Betonpulver",15,["Concrete Powder"]],["Drachenei",20,["Dragon Egg"]],["Gerüst",30,["Scaffolding"]]]},
    {q:"Nenne einen Block, der wassergefüllt werden kann.",a:[["Treppenstufe",5,["Stairs"]],["Schild",7,["Sign"]],["Leiter",9,["Ladder"]],["Zaun",12,["Fence"]],["Kette",15,["Chain"]],["Eisenstangen",20,["Iron Bars"]],["Amethystknospe",30,["Amethyst Bud"]]]},
    {q:"Nenne eine Dimension in Minecraft.",a:[["Oberwelt",5,["Overworld"]],["Nether",9,[]],["Ende",30,["The End"]]]},
    {q:"Nenne einen Block, den man in der Wüste findet.",a:[["Sand",5,[]],["Kaktus",7,["Cactus"]],["Sandstein",9,["Sandstone"]],["Toter Busch",12,["Dead Bush"]],["Glatter Sandstein",17,["Smooth Sandstone"]],["Verdächtiger Sand",20,["Suspicious Sand"]],["Terrakotta",30,[]]]},
    {q:"Nenne einen Block, den man im Dschungel findet.",a:[["Dschungelholz",5,["Jungle Log"]],["Lianen",7,["Vines"]],["Kakaobohnen",9,["Cocoa Beans"]],["Bambus",12,["Bamboo"]],["Melone",15,["Melon"]],["Moosblock",20,["Moss Block"]],["Riesige Tropfblätter",30,["Big Dripleaf"]]]},
    {q:"Nenne eine Struktur, die auch unter Wasser vorkommen kann.",a:[["Schiffswrack",5,["Shipwreck"]],["Ozeanruine",9,["Ocean Ruins"]],["Ozeanmonument",15,["Ocean Monument"]],["Versunkenes Ruinenportal",20,["Underwater Ruined Portal","Ruined Portal"]],["Meeresdenkmal",30,["Monument"]]]},
    {q:"Nenne eine Pflanze aus dem Nether.",a:[["Netherwarze",5,["Nether Wart"]],["Wirrpilz",9,["Warped Fungus"]],["Karmesinpilz",12,["Crimson Fungus"]],["Wirr-Ranken",17,["Twisting Vines"]],["Karmesin-Ranken",20,["Weeping Vines"]],["Nether-Sprossen",30,["Nether Sprouts"]]]},
    {q:"Nenne etwas, das man im Ende finden kann.",a:[["Endstein",5,["End Stone"]],["Obsidian",7,[]],["Chorusfrucht",9,["Chorus Fruit"]],["Chorusblüte",12,["Chorus Flower"]],["Shulker",17,[]],["Drachenei",20,["Dragon Egg"]],["Elytren",30,["Elytra"]]]},
    {q:"Nenne ein Material, aus dem Rüstung besteht.",a:[["Leder",5,["Leather"]],["Eisen",7,["Iron"]],["Gold",9,["Golden"]],["Diamant",12,["Diamond"]],["Netherit",20,["Netherite"]],["Schildkrötenpanzer",30,["Turtle Shell"]]]},
    {q:"Nenne ein Werkzeug in Minecraft.",a:[["Spitzhacke",5,["Pickaxe"]],["Axt",6,["Axe"]],["Schaufel",7,["Shovel"]],["Hacke",9,["Hoe"]],["Schere",12,["Shears"]],["Angel",15,["Fishing Rod"]],["Feuerzeug",20,["Flint and Steel"]],["Pinsel",30,["Brush"]]]},
    {q:"Nenne ein Gebäude oder einen Ort in einem Dorf.",a:[["Haus",5,["House"]],["Schmiede",9,["Blacksmith"]],["Kirche",12,["Church"]],["Bibliothek",15,["Library"]],["Pflanzenfarm",20,["Farm"]],["Versammlungsplatz",30,["Meeting Point"]]]},
    {q:"Nenne etwas, das man in einer antiken Stadt finden kann.",a:[["Sculk",5,["Sculk Block"]],["Sculk-Kreischer",9,["Sculk Shrieker"]],["Echo-Scherbe",15,["Echo Shard"]],["Disc-Fragmente",20,["Disc Fragment"]],["Verstärkte Deepslate",30,["Reinforced Deepslate"]]]},
    {q:"Nenne etwas aus einer Prüfungskammer.",a:[["Kupferblock",5,["Copper Block"]],["Kupfergitter",9,["Copper Grate"]],["Spawner",12,["Trial Spawner"]],["Breeze-Rute",17,["Breeze Rod"]],["Schwerer Kern",30,["Heavy Core"]]]},
    {q:"Nenne eine Nutzpflanze, die auf Ackerboden wächst.",a:[["Weizen",5,["Wheat"]],["Karotte",6,["Carrot"]],["Kartoffel",7,["Potato"]],["Rote Bete",9,["Beetroot"]],["Melone",12,["Melon"]],["Kürbis",15,["Pumpkin"]],["Kannenpflanze",20,["Pitcher Plant"]],["Fackellilie",30,["Torchflower"]]]},
    {q:"Nenne etwas, das ein Dorfbewohner verkaufen kann.",a:[["Brot",5,["Bread"]],["Karte",7,["Map"]],["Bücherregal",9,["Bookshelf"]],["Namensschild",12,["Name Tag"]],["Sattel",15,["Saddle"]],["Diamantenausrüstung",20,["Diamond Gear"]],["Tropenfisch-Eimer",30,["Bucket of Tropical Fish"]]]},
    {q:"Nenne eine Wetter- oder Himmelserscheinung.",a:[["Regen",5,["Rain"]],["Schnee",7,["Snow"]],["Gewitter",12,["Thunderstorm"]],["Blitz",30,["Lightning"]]]},
    {q:"Nenne eine Eis- oder Schneeart.",a:[["Schnee",5,["Snow"]],["Eis",7,["Ice"]],["Packeis",12,["Packed Ice"]],["Blaueis",17,["Blue Ice"]],["Pulverschnee",20,["Powder Snow"]],["Frostläufer-Eis",30,["Frosted Ice"]]]},
    {q:"Nenne einen Block, den man in üppigen Höhlen findet.",a:[["Moosblock",5,["Moss Block"]],["Lehm",7,["Clay"]],["Lianen",9,["Vines"]],["Leuchtbeeren",12,["Glow Berries"]],["Sporenblüte",17,["Spore Blossom"]],["Kleinblättrige Azalee",20,["Azalea"]],["Großes Tropfblatt",30,["Big Dripleaf"]]]},
    {q:"Nenne ein Tier, das man in Minecraft findet.",a:[["Kuh",5,["Cow"]],["Schaf",5,["Sheep"]],["Huhn",6,["Chicken"]],["Panda",12,[]],["Biene",15,["Bee"]],["Gürteltier",20,["Armadillo"]],["Eisbär",30,["Polar Bear"]]]},
    {q:"Nenne eine Variante einer Lore.",a:[["Normale Lore",5,["Minecart"]],["Truhenlore",9,["Chest Minecart"]],["Trichterlore",12,["Hopper Minecart"]],["Ofenlore",17,["Furnace Minecart"]],["TNT-Lore",20,["TNT Minecart"]],["Spawner-Lore",30,["Spawner Minecart"]]]},
    {q:"Nenne einen Block, der im Nether vorkommt.",a:[["Netherrack",5,[]],["Seelensand",7,["Soul Sand"]],["Netherziegel",9,["Nether Bricks"]],["Basalt",12,[]],["Schwarzstein",15,["Blackstone"]],["Golderz des Nethers",20,["Nether Gold Ore"]],["Antiker Schrott",30,["Ancient Debris"]]]},
    {q:"Nenne einen Gegenstand aus Archäologie oder Ausgrabungen.",a:[["Tonscherbe",5,["Pottery Sherd"]],["Pinsel",7,["Brush"]],["Smaragd",9,["Emerald"]],["Schnüffler-Ei",12,["Sniffer Egg"]],["Schallplattenfragment",17,["Disc Fragment"]],["Angler-Tonscherbe",20,["Angler Pottery Sherd"]],["Bogen-Tonscherbe",30,["Archer Pottery Sherd"]]]}
  ];
  const RARITY = [{name:"Basic",min:5,max:7},{name:"Uncommon",min:8,max:11},{name:"Rare",min:12,max:15},{name:"Legendary",min:16,max:19},{name:"Mythic",min:20,max:25},{name:"One in a Minellion",min:30,max:30}];
  const rarityFor = points => RARITY.find(t=>points>=t.min&&points<=t.max)||RARITY[0];
  const normalizeKrillionAnswer = value => String(value).toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
  function editDistance(a,b){
    if(Math.abs(a.length-b.length)>2)return 99;
    let prev=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){const cur=[i];for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=cur;}
    return prev[b.length];
  }
  function findKrillionAnswer(raw){
    const key=normalizeKrillionAnswer(raw);if(!key)return null;
    const entries=state.krillionCurrent.a;
    for(const entry of entries){for(const alias of [entry[0],...(entry[2]||[])])if(normalizeKrillionAnswer(alias)===key)return {entry,matched:alias,exact:true};}
    if(key.length<4)return null;
    let best=null,bestDistance=99;
    for(const entry of entries)for(const alias of [entry[0],...(entry[2]||[])]){
      const candidate=normalizeKrillionAnswer(alias);const prefixes=[candidate,candidate.slice(0,key.length)];
      if(candidate.startsWith(key))return {entry,matched:alias,exact:false};
      const limit=key.length>=9?2:1;
      for(const option of prefixes){const distance=editDistance(key,option);if(distance<=limit&&distance<bestDistance){best={entry,matched:alias,exact:false};bestDistance=distance;}}
    }
    return best;
  }
  function clearKrillionTimer(){if(state.krillionTimer){clearInterval(state.krillionTimer);state.krillionTimer=null;}}
  function updateKrillionTimer(){
    $("krillion-time-left").textContent=state.krillionTimeLeft;
    $("krillion-timer-fill").style.width=(state.krillionTimeLeft/20*100)+"%";
    $("krillion-timer").classList.toggle("timer-warning",state.krillionTimeLeft<=5);
  }
  function startKrillionTimer(){
    clearKrillionTimer();state.krillionTimeLeft=20;updateKrillionTimer();
    state.krillionTimer=setInterval(()=>{state.krillionTimeLeft--;updateKrillionTimer();if(state.krillionTimeLeft<=0)resolveKrillionAnswer("",true);},1000);
  }
  function startKrillion(){
    const pool=[...KRILLION_QUESTIONS];for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    state.krillionQuestions=pool.slice(0,7);state.krillionRound=0;state.krillionScore=0;showKrillionQuestion();
  }
  function showKrillionQuestion(){
    clearKrillionTimer();
    if(state.krillionRound>=7){$("krillion-final-score").textContent=state.krillionScore;$("krillion-final-max").textContent="210";showScreen("krillion-finish-screen");return;}
    state.krillionCurrent=state.krillionQuestions[state.krillionRound];state.krillionLocked=false;
    $("krillion-round").textContent=state.krillionRound+1;$("krillion-score").textContent=state.krillionScore;$("krillion-question").textContent=state.krillionCurrent.q;$("krillion-answer").value="";$("krillion-answer").disabled=false;$("krillion-feedback").hidden=true;$("krillion-submit").hidden=false;$("krillion-next").hidden=true;
    showScreen("krillion-screen");startKrillionTimer();$("krillion-answer").focus();
  }
  function resolveKrillionAnswer(raw,timedOut=false){
    if(state.krillionLocked)return;state.krillionLocked=true;clearKrillionTimer();
    const match=timedOut?null:findKrillionAnswer(raw);const earned=match?match.entry[1]:0;state.krillionScore+=earned;$("krillion-score").textContent=state.krillionScore;$("krillion-answer").disabled=true;$("krillion-submit").hidden=true;$("krillion-feedback").hidden=false;
    const tier=match?rarityFor(earned):null;
    $("krillion-feedback-title").textContent=timedOut?"Zeit abgelaufen":match?(tier.name+" · Antwort erkannt"):"Antwort nicht erkannt";
    $("krillion-feedback-title").className=match?"rarity-text rarity-"+tier.name.toLowerCase().replace(/[^a-z]/g,""):"";
    $("krillion-feedback-copy").textContent=timedOut?"Du hast in dieser Frage keine Punkte erhalten.":match?("Gewertet als: "+match.entry[0]+(match.exact?"":" · Schreibweise automatisch erkannt")):"Leider keine Punkte. Es wird keine Musterlösung angezeigt.";
    $("krillion-feedback-points").textContent="+"+earned+" Punkte";$("krillion-feedback-points").className=match?"rarity-text rarity-"+tier.name.toLowerCase().replace(/[^a-z]/g,""):"";
    $("krillion-next").hidden=false;$("krillion-next").textContent=state.krillionRound>=6?"ERGEBNIS ANSEHEN →":"NÄCHSTE FRAGE →";
  }
  function submitKrillionAnswer(){const raw=$("krillion-answer").value.trim();if(!raw){$("krillion-answer").focus();return;}resolveKrillionAnswer(raw,false);}
  function nextKrillionQuestion(){state.krillionRound++;showKrillionQuestion();}
  async function saveKrillionScore(){
    const name=$("krillion-player-name").value.trim().slice(0,18)||"Spieler";$("krillion-save-score").disabled=true;$("krillion-save-score").textContent="WIRD GESPEICHERT …";
    let saved=false;if(supabaseClient){const {error}=await supabaseClient.from("leaderboard").insert({player_name:name,score:state.krillionScore,game_mode:"minecraft_krillion"});saved=!error;}
    $("krillion-save-score").disabled=false;$("krillion-save-score").textContent="ERGEBNIS SPEICHERN →";
    await renderLeaderboard("full-leaderboard","minecraft_krillion");$("leaderboard-title").textContent="Minecraft Krillion · Rangliste";$("full-leaderboard-status").textContent=saved?"LIVE · Öffentliche Krillion-Rangliste":"Online-Speicherung nicht verfügbar – bitte später erneut versuchen.";showScreen("leaderboard-screen");
  }

  window.startGuessGame=startGame;
  $("back-home").addEventListener("click",()=>showScreen("home-screen"));$("submit-guess").addEventListener("click",submitGuess);$("next-round").addEventListener("click",nextRound);$("save-score").addEventListener("click",saveScore);$("play-again").addEventListener("click",startGame);$("show-leaderboard").addEventListener("click",()=>{renderLeaderboard("full-leaderboard");showScreen("leaderboard-screen");});$("leaderboard-back").addEventListener("click",()=>showScreen("home-screen"));$("start-krillion").addEventListener("click",startKrillion);$("krillion-home").addEventListener("click",()=>{clearKrillionTimer();showScreen("home-screen");});$("krillion-submit").addEventListener("click",submitKrillionAnswer);$("krillion-answer").addEventListener("keydown",e=>{if(e.key==="Enter")submitKrillionAnswer();});$("krillion-next").addEventListener("click",nextKrillionQuestion);$("krillion-save-score").addEventListener("click",saveKrillionScore);$("krillion-play-again").addEventListener("click",startKrillion);
  ["hue-range","saturation-range","brightness-range"].forEach(id=>$(id).addEventListener("input",updateFromSliders));
  $("hex-input").addEventListener("input",e=>{const value=e.target.value.replace(/[^0-9a-f]/gi,"").slice(0,6);e.target.value=value;if(value.length===6)setGuess("#"+value);});
  $("copy-hex").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(state.guess);$("copy-hex").textContent="OK";setTimeout(()=>$("copy-hex").textContent="COPY",900);}catch{$("hex-input").select();}});
  setGuess("#6B8E23");renderLeaderboard("home-leaderboard");
})();