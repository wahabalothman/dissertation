/* ═══════════════════════════════════════════════════════════════════
   Homepage desktop. Loaded with defer from index.qmd, so the taskbar
   partial (include-after-body) already exists when this runs.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";

  var desk  = document.getElementById("desk");
  if(!desk) return;
  var plane = document.getElementById("plane");
  var wins  = Array.prototype.slice.call(document.querySelectorAll(".win"));
  var tasks = document.getElementById("tasks");
  var z     = 10;

  /* Effects flag. The OS "reduce motion" setting decides the default, but a
     tray toggle can override it — the source-decay cycle below runs either
     way, because that is the argument, not decoration. */
  function fxOn(){ return document.documentElement.dataset.fx === "on"; }
  var wide = function(){ return window.matchMedia("(min-width: 981px)").matches; };

  /* ── layout: hold the window cluster together and centre it ── */
  function placePlane(){
    if(!wide()){ plane.style.left = ""; plane.style.top = ""; return; }
    var d = desk.getBoundingClientRect();
    plane.style.left = Math.max(100, Math.round((d.width - 1000) / 2)) + "px";
    plane.style.top  = Math.max(10, Math.min(Math.round((d.height - 660) / 2), 110)) + "px";
  }

  /* ── focus / z-order ── */
  function focusWin(w){
    wins.forEach(function(o){ o.classList.add("blur"); });
    w.classList.remove("blur");
    w.style.zIndex = ++z;
    syncTasks();
  }
  wins.forEach(function(w){
    w.classList.add("blur");
    w.addEventListener("pointerdown", function(){ focusWin(w); });
  });

  /* ── open / close / minimize ── */
  function openWin(id){
    var w = document.getElementById(id);
    if(!w) return;
    w.style.display = "";
    w.dataset.min = "";
    focusWin(w);
    placeAssistant();
    if(!wide()) w.scrollIntoView({behavior: fxOn() ? "smooth" : "auto", block:"center"});
  }
  function closeWin(w){ w.style.display = "none"; w.dataset.min = ""; syncTasks(); placeAssistant(); }
  function minWin(w){ w.style.display = "none"; w.dataset.min = "1"; syncTasks(); placeAssistant(); }
  document.addEventListener("desk:open", function(e){ openWin(e.detail); });

  document.addEventListener("click", function(e){
    var act = e.target.closest("[data-act]");
    if(act){
      e.preventDefault();
      var w = act.closest(".win"), a = act.dataset.act;
      if(a === "close") closeWin(w);
      else if(a === "min") minWin(w);
      else if(a === "max" && wide()){
        if(w.dataset.max === "1"){
          w.style.cssText = w.dataset.prev || "";
          w.dataset.max = "";
        } else {
          w.dataset.prev = w.style.cssText;
          w.dataset.max = "1";
          var d = desk.getBoundingClientRect(), p = plane.getBoundingClientRect();
          w.style.left = (10 - (p.left - d.left)) + "px";
          w.style.top  = (10 - (p.top  - d.top )) + "px";
          w.style.right = "auto"; w.style.bottom = "auto";
          w.style.width = (d.width - 36) + "px";
        }
        focusWin(w);
        placeAssistant();
      }
      return;
    }
    var op = e.target.closest("[data-open]");
    if(op){ e.preventDefault(); markIcon(op); openWin(op.dataset.open); return; }
  });

  /* ── desktop icons: click selects, double-click opens (tap opens on touch) ── */
  function markIcon(el){
    var ic = el && el.closest(".icon");
    document.querySelectorAll(".icon.on").forEach(function(o){ o.classList.remove("on"); });
    if(ic) ic.classList.add("on");
  }
  document.querySelectorAll(".icon[href]").forEach(function(a){
    a.addEventListener("click", function(e){
      markIcon(a);
      if(wide() && !a.dataset.armed){
        e.preventDefault();
        a.dataset.armed = "1";
        setTimeout(function(){ a.dataset.armed = ""; }, 600);
      }
    });
  });
  var firstIcon = document.querySelector('.icon[data-icon="research"]');
  if(firstIcon) firstIcon.classList.add("on");

  /* ── drag by title bar ── */
  wins.forEach(function(w){
    var tb = w.querySelector(".tb");
    tb.addEventListener("pointerdown", function(e){
      if(!wide() || e.target.closest("button") || w.dataset.max === "1") return;
      var r = w.getBoundingClientRect(), pr = plane.getBoundingClientRect();
      w.style.left = (r.left - pr.left) + "px";
      w.style.top  = (r.top  - pr.top ) + "px";
      w.style.right = "auto"; w.style.bottom = "auto";
      var ox = e.clientX - r.left, oy = e.clientY - r.top;
      tb.setPointerCapture(e.pointerId);
      function move(ev){
        var d = desk.getBoundingClientRect(), p = plane.getBoundingClientRect();
        var minX = (d.left - p.left) - r.width + 60;
        var maxX = (d.right - p.left) - 60;
        var minY = (d.top - p.top);
        var maxY = (d.bottom - p.top) - 30;
        w.style.left = Math.max(minX, Math.min(ev.clientX - p.left - ox, maxX)) + "px";
        w.style.top  = Math.max(minY, Math.min(ev.clientY - p.top  - oy, maxY)) + "px";
        if(w.id === "w-feed") placeAssistant();
      }
      function up(ev){
        tb.releasePointerCapture(ev.pointerId);
        tb.removeEventListener("pointermove", move);
        tb.removeEventListener("pointerup", up);
        placeAssistant();
      }
      tb.addEventListener("pointermove", move);
      tb.addEventListener("pointerup", up);
    });
  });

  /* ── the assistant rides on the broadcast window ── */
  var assistEl, balloonEl;
  function adoptAssistant(){
    assistEl  = document.getElementById("assistant");
    balloonEl = document.getElementById("balloon");
    if(!assistEl) return;
    plane.appendChild(assistEl);
    if(balloonEl) plane.appendChild(balloonEl);
    assistEl.classList.add("pinned");
    if(balloonEl) balloonEl.classList.add("pinned");
    placeAssistant();
  }
  function placeAssistant(){
    if(!assistEl || !wide()) return;
    var feed = document.getElementById("w-feed");
    var hidden = !feed || feed.style.display === "none";
    assistEl.style.visibility = hidden ? "hidden" : "";
    if(balloonEl) balloonEl.style.visibility = hidden ? "hidden" : "";
    if(hidden) return;
    var p = plane.getBoundingClientRect(), f = feed.getBoundingClientRect();
    /* just enough overlap to read as attached, without covering the
       "simulated broadcast" line in the window's status bar */
    var x = f.left - p.left + 16;
    var y = f.bottom - p.top - 9;
    assistEl.style.left = x + "px";
    assistEl.style.top  = y + "px";
    assistEl.style.zIndex = 60;
    if(balloonEl){
      balloonEl.style.left = (x + assistEl.offsetWidth + 14) + "px";
      balloonEl.style.top  = (y + 6) + "px";
      balloonEl.style.zIndex = 61;
    }
  }

  /* ── keep everything on the desk when the viewport changes ── */
  function reflow(){
    placePlane();
    if(wide()){
      var d = desk.getBoundingClientRect();
      wins.forEach(function(w){
        if(w.style.display === "none") return;
        var r = w.getBoundingClientRect(), p = plane.getBoundingClientRect();
        if(r.right > d.right - 6){
          w.style.left = Math.max((d.left - p.left) + 6, (d.right - p.left) - r.width - 12) + "px";
          w.style.right = "auto";
        }
      });
    }
    placeAssistant();
  }
  window.addEventListener("resize", reflow);

  /* ── taskbar ── */
  function syncTasks(){
    if(!tasks) return;
    tasks.querySelectorAll("button:not(.vx)").forEach(function(b){ b.remove(); });
    wins.forEach(function(w){
      if(w.style.display === "none" && w.dataset.min !== "1") return;
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = w.dataset.task;
      if(w.style.display !== "none" && !w.classList.contains("blur")) b.className = "down";
      b.addEventListener("click", function(){
        if(w.style.display === "none") openWin(w.id);
        else if(!w.classList.contains("blur")) minWin(w);
        else focusWin(w);
      });
      tasks.appendChild(b);
    });
  }

  /* ═══════════ the broadcast ═══════════ */
  var STORIES = [
    { h:"THEY PUT IT IN THE", hi:"WATER",
      sub:"and they are counting on you not to look up",
      src:["posted by @deep_well_44 · 03:12","an independent researcher","people are saying"],
      b1:"WAKE UP AMERICA", b2:"WHAT THEY DON'T WANT YOU TO SEE", tag:"DEVELOPING" },
    { h:"THE BIRDS WERE REPLACED IN", hi:"1974",
      sub:"count them. they never land on the same wire twice",
      src:["posted by u/wirewatch_71 · 22:40","a former employee","people are saying"],
      b1:"NOBODY IS ASKING THIS", b2:"THE FOOTAGE SPEAKS FOR ITSELF", tag:"BREAKING" },
    { h:"THE MOON IS", hi:"RENTED",
      sub:"ask who signed the lease and why it expires in march",
      src:["posted by @lunar_lease · 01:07","documents obtained","people are saying"],
      b1:"FOLLOW THE PAPERWORK", b2:"THEY CHANGED THE RECORD", tag:"EXCLUSIVE" },
    { h:"YOUR MATTRESS IS", hi:"LISTENING",
      sub:"why else would it know when you wake up",
      src:["posted by @springcoil_9 · 04:55","a whistleblower","people are saying"],
      b1:"JUST ASKING QUESTIONS", b2:"WHY IS NOBODY COVERING THIS", tag:"UNCONFIRMED" }
  ];
  var TICK = ["THEY DON'T WANT YOU ASKING","DO YOUR OWN RESEARCH","WHY IS NOBODY COVERING THIS",
              "FOLLOW THE MONEY","JUST ASKING QUESTIONS","CONNECT THE DOTS","SOURCES SAY"];

  var tickEl = document.getElementById("f-tick");
  if(tickEl){
    var line = TICK.join(" ··· ") + " ··· ";
    for(var k = 0; k < 2; k++){
      var sEl = document.createElement("s");
      sEl.textContent = line;
      tickEl.appendChild(sEl);
    }
  }

  var eH = document.getElementById("f-head"), eS = document.getElementById("f-sub"),
      eR = document.getElementById("f-src"),  e1 = document.getElementById("f-b1"),
      e2 = document.getElementById("f-b2"),   eT = document.getElementById("f-t1");
  var tiers = Array.prototype.slice.call(document.querySelectorAll(".tier"));
  var si = 0, beat = 0;

  function flick(el){
    if(!fxOn()) return;
    el.classList.remove("flick");
    void el.offsetWidth;
    el.classList.add("flick");
  }
  function paint(full){
    var st = STORIES[si];
    if(full){
      eH.innerHTML = st.h + " <em>" + st.hi + "</em>";
      eS.textContent = st.sub;
      e1.textContent = st.b1;
      e2.textContent = st.b2;
      eT.textContent = st.tag;
      flick(eH); flick(eS);
    }
    eR.textContent = st.src[beat];
    eR.parentNode.classList.toggle("gone", beat === 2);
    flick(eR.parentNode);
    tiers.forEach(function(t){ t.classList.toggle("on", +t.dataset.t === beat); });
  }
  if(eH){
    paint(true);
    setInterval(function(){
      beat++;
      if(beat > 2){ beat = 0; si = (si + 1) % STORIES.length; paint(true); }
      else paint(false);
    }, 3200);
  }

  /* ═══════════ easter egg: share the claim, catch the claim ═══════════
     Triggered by the one control on the page that begs to be clicked. */
  var VX = {
    on:false, n:0, timer:null, cap:36,
    msgs:[
      ["SOURCE NOT FOUND","The original poster could not be located."],
      ["PROPAGATION","Claim repeated by 1,247,882 accounts."],
      ["ATTRIBUTION","Named source removed. Continue?"],
      ["System","PEOPLE_ARE_SAYING.DLL is missing."],
      ["CITATION REQUIRED","A citation is required. None was provided."],
      ["Trusted contact","This claim has been shared by someone you trust."],
      ["Undo","Cannot undo. The claim has already been repeated."],
      ["PROVENANCE","Chain of custody broken at stage 2 of 4."],
      ["ENGAGEMENT","Reach exceeded correction by 71×."],
      ["Verification","No verification attempted. Sharing anyway."]
    ]
  };
  var vxLayer = document.getElementById("vx");

  function vxDialog(kill){
    if(!vxLayer) return;
    var m = kill ? ["RETRACTION","Issue a retraction. Nobody will see it."]
                 : VX.msgs[Math.floor(Math.random() * VX.msgs.length)];
    var d = document.createElement("div");
    d.className = "vxdlg" + (kill ? " kill" : "");
    var w = window.innerWidth, h = window.innerHeight;
    d.style.left = Math.round(Math.random() * Math.max(10, w - 300)) + "px";
    d.style.top  = Math.round(Math.random() * Math.max(10, h - 220)) + "px";
    d.innerHTML =
      '<div class="vtb"><span>' + m[0] + '</span><b>&#10005;</b></div>' +
      '<div class="vbd"><i class="vic">' + (kill ? '&#9993;' : '&#9888;') + '</i><p>' + m[1] + '</p></div>' +
      '<div class="vft"><button type="button">' + (kill ? 'Retract' : 'OK') + '</button></div>';
    d.querySelector("button").addEventListener("click", function(){
      if(kill){ vxStop(); return; }
      d.remove(); VX.n--;
      vxDialog(); vxDialog();          /* every dismissal makes two more */
    });
    d.querySelector(".vtb b").addEventListener("click", function(){
      if(kill){ vxStop(); return; }
      d.remove(); VX.n--; vxDialog();
    });
    vxLayer.appendChild(d);
    VX.n++;
    if(!kill && tasks){
      var tb = document.createElement("button");
      tb.type = "button"; tb.className = "vx";
      tb.textContent = m[0];
      tasks.appendChild(tb);
    }
    if(VX.n > VX.cap){
      var first = vxLayer.querySelector(".vxdlg:not(.kill)");
      if(first){ first.remove(); VX.n--; }
    }
  }

  function vxStart(){
    if(VX.on || !vxLayer) return;
    VX.on = true; VX.n = 0;
    /* The infection is opt-in: clicking a button marked SHARE THIS NOW is
       consent to the consequences, so it plays in full even when motion is
       otherwise reduced. The flag is put back the way it was on stop. */
    VX.fxWas = document.documentElement.dataset.fx;
    document.documentElement.dataset.fx = "on";
    document.body.classList.add("infected");
    vxLayer.classList.add("on");
    if(balloonEl){
      balloonEl.dataset.was = balloonEl.innerHTML;
      balloonEl.innerHTML = '<p><b>You shared it.</b><br><br>Press <b>Esc</b>, or retract it.</p>';
      balloonEl.style.visibility = "";
    }
    vxDialog(); vxDialog();
    var step = 900;
    (function tickOn(){
      if(!VX.on) return;
      vxDialog();
      step = Math.max(160, step * 0.82);
      VX.timer = setTimeout(tickOn, step);
    })();
    setTimeout(function(){ if(VX.on) vxDialog(true); }, 3200);
  }

  function vxStop(){
    if(!VX.on) return;
    VX.on = false;
    clearTimeout(VX.timer);
    if(VX.fxWas) document.documentElement.dataset.fx = VX.fxWas;
    document.body.classList.remove("infected");
    vxLayer.classList.remove("on");
    vxLayer.textContent = "";
    VX.n = 0;
    if(tasks) tasks.querySelectorAll("button.vx").forEach(function(b){ b.remove(); });
    if(balloonEl && balloonEl.dataset.was){
      balloonEl.innerHTML =
        '<p>That is the whole mechanism, in one click.<br><br>' +
        'Nobody checked who said it first.</p>' +
        '<button class="op" type="button" data-balloon="restore"><i></i><span>Start over</span></button>';
    }
    syncTasks();
  }

  document.addEventListener("click", function(e){
    if(e.target.closest("#f-share")){ e.preventDefault(); vxStart(); return; }
    if(e.target.closest('[data-balloon="restore"]') && balloonEl && balloonEl.dataset.was){
      e.preventDefault();
      balloonEl.innerHTML = balloonEl.dataset.was;
      balloonEl.dataset.was = "";
    }
  });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape") vxStop(); });

  /* ── boot ── */
  adoptAssistant();
  placePlane();
  focusWin(document.getElementById("w-archive"));
  reflow();
})();
