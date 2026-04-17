/* ═══════════════════════════════════════════════════════
   Dennys Birthday — PAW Patrol Invitation  ·  main.js
   ═══════════════════════════════════════════════════════ */

const PARTY_DATE = new Date('2026-05-16T11:00:00');

/* ════════════════════════════════════════════════════════
   STARS
   ════════════════════════════════════════════════════════ */
(function initStars() {
  const c = document.getElementById('stars');
  for (let i = 0; i < 55; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = 1 + Math.random() * 3;
    s.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      top:${Math.random()*55}%;
      --d:${1.5 + Math.random()*3}s;
      animation-delay:${Math.random()*3}s;
    `;
    c.appendChild(s);
  }
})();

/* ════════════════════════════════════════════════════════
   PAW PRINT PARTICLES
   ════════════════════════════════════════════════════════ */
(function initPaws() {
  const canvas = document.getElementById('paw-canvas');
  const ctx    = canvas.getContext('2d');
  const COLS   = ['#4488FF','#FF6680','#FFDD44','#44DD88','#FF66CC','#FF9944'];

  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  window.addEventListener('resize', resize);
  resize();

  class Paw {
    constructor(init) { this.reset(init); }
    reset(init) {
      this.x  = Math.random() * canvas.width;
      this.y  = init ? Math.random() * canvas.height : canvas.height + 40;
      this.s  = 6 + Math.random() * 15;
      this.vy = -(0.18 + Math.random() * 0.38);
      this.a  = 0.07 + Math.random() * 0.2;
      this.r  = Math.random() * Math.PI * 2;
      this.rv = (Math.random() - 0.5) * 0.012;
      this.c  = COLS[Math.floor(Math.random() * COLS.length)];
      this.ph = Math.random() * Math.PI * 2;
    }
    draw() {
      const s = this.s;
      ctx.save(); ctx.globalAlpha = this.a; ctx.fillStyle = this.c;
      ctx.translate(this.x, this.y); ctx.rotate(this.r);
      ctx.beginPath(); ctx.ellipse(0, s*.28, s*.44, s*.34, 0, 0, Math.PI*2); ctx.fill();
      [[-s*.37,-s*.27],[-s*.12,-s*.47],[s*.12,-s*.47],[s*.37,-s*.27]].forEach(([tx,ty]) => {
        ctx.beginPath(); ctx.ellipse(tx, ty, s*.17, s*.21, 0, 0, Math.PI*2); ctx.fill();
      });
      ctx.restore();
    }
    update(t) {
      this.y += this.vy; this.r += this.rv;
      this.x += Math.sin(t * .001 + this.ph) * .3;
      if (this.y < -50) this.reset(false);
    }
  }

  const paws = Array.from({ length: 32 }, () => new Paw(true));
  function loop(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paws.forEach(p => { p.update(t); p.draw(); });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* ════════════════════════════════════════════════════════
   SPARKLES around shield
   ════════════════════════════════════════════════════════ */
const GLYPHS = ['✦','★','✸','✺','❋','✿','◆','⬟'];
const SCOLS  = ['#FFD700','#FF6688','#66AAFF','#FF88CC','#88FFAA','#FFAA44'];

function spawnSparkle() {
  const rect  = document.getElementById('shield').getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;
  const a  = Math.random() * Math.PI * 2;
  const d  = 28 + Math.random() * 90;
  const el = document.createElement('div');
  el.className   = 'sparkle';
  el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  el.style.cssText = `
    left:${cx + Math.cos(a)*d}px; top:${cy + Math.sin(a)*d}px;
    font-size:${10+Math.random()*14}px; color:${SCOLS[Math.floor(Math.random()*SCOLS.length)]};
  `;
  document.getElementById('sparkles').appendChild(el);
  gsap.fromTo(el,
    { scale: 0, opacity: 1, rotation: 0, x: 0, y: 0 },
    { scale: 1.5, opacity: 0, rotation: (Math.random()-0.5)*55,
      x: Math.cos(a)*30, y: Math.sin(a)*30,
      duration: .65 + Math.random()*.5, ease: 'power2.out',
      onComplete: () => el.remove()
    }
  );
}

/* ════════════════════════════════════════════════════════
   HERO ENTRY — cinematic sequence
   ════════════════════════════════════════════════════════ */
(function initHero() {
  gsap.set(['#shield','#tagline','#name-text','#sub-text','#glass-panel'], { opacity: 0 });
  gsap.set('.char-wrap', { opacity: 0, y: 60, scale: 0.6 });

  const tl = gsap.timeline({ delay: 0.15 });

  // 1 — Police siren flash
  tl.to('#siren', { opacity: 1, duration: 0.06, yoyo: true, repeat: 9, ease: 'none' })
    .to('#siren', { opacity: 0, duration: 0.25 });

  // 2 — Shield CRASHES from top with bounce
  tl.to('#shield', {
    opacity: 1, y: 0, duration: 1.0, ease: 'bounce.out',
    onStart() { gsap.set('#shield', { y: -220 }); }
  }, '-=0.1');

  // 3 — tagline slides in
  tl.to('#tagline', {
    opacity: 1, x: 0, duration: 0.55, ease: 'back.out(2)',
    onStart() { gsap.set('#tagline', { x: -50 }); }
  }, '-=0.3');

  // 4 — "DENNYS" letters cascade down
  tl.add(() => {
    const el   = document.getElementById('name-text');
    const text = 'DENNYS';
    el.innerHTML = text.split('').map(ch =>
      `<span style="display:inline-block;opacity:0;transform:translateY(-60px) scale(0.5)">${ch}</span>`
    ).join('');
    gsap.set(el, { opacity: 1 });
    gsap.to(el.querySelectorAll('span'), {
      opacity: 1, y: 0, scale: 1, duration: 0.5,
      stagger: 0.07, ease: 'back.out(2.5)'
    });
  }, '-=0.1');

  // 5 — "is Turning 4!" rises + elastic
  tl.to('#sub-text', {
    opacity: 1, y: 0, duration: 0.55, ease: 'power3.out',
    onStart() { gsap.set('#sub-text', { y: 30 }); }
  }, '+=0.25');
  tl.from('#big-four', { scale: 0, duration: 0.65, ease: 'elastic.out(1, 0.38)' }, '-=0.15');
  tl.add(() => gsap.to('#big-four', { y: -7, duration: 0.7, yoyo: true, repeat: -1, ease: 'sine.inOut' }));

  // 6 — Glass panel rises
  tl.to('#glass-panel', {
    opacity: 1, y: 0, duration: 0.65, ease: 'back.out(1.8)',
    onStart() { gsap.set('#glass-panel', { y: 40 }); }
  }, '-=0.2');

  // 7 — Characters pop up from bottom, staggered from center
  tl.to('.char-wrap', {
    opacity: 1, y: 0, scale: 1, duration: 0.6,
    stagger: { each: 0.1, from: 'center' },
    ease: 'back.out(2.2)'
  }, '-=0.3');

  // 8 — Shield sway loop
  tl.add(() => {
    gsap.to('#shield', { rotation: 5, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 0.5 });
    setInterval(spawnSparkle, 260);
    gsap.to('#music-btn', { opacity: 1, duration: 0.4 });
  });
})();

/* ════════════════════════════════════════════════════════
   CHARACTER HOVER — individual bounce
   ════════════════════════════════════════════════════════ */
document.querySelectorAll('.char-wrap').forEach(w => {
  w.addEventListener('mouseenter', () => {
    gsap.to(w, { y: -14, scale: 1.1, duration: 0.22, ease: 'back.out(2)' });
  });
  w.addEventListener('mouseleave', () => {
    gsap.to(w, { y: 0, scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
  });
});

/* ════════════════════════════════════════════════════════
   COUNTDOWN
   ════════════════════════════════════════════════════════ */
(function initCountdown() {
  const prev = {};
  function flip(id, val) {
    const el  = document.getElementById(id);
    const str = String(val).padStart(2, '0');
    if (prev[id] === str) return;
    prev[id] = str;
    gsap.to(el, { scaleY: 0.1, duration: 0.08, onComplete() {
      el.textContent = str;
      gsap.to(el, { scaleY: 1, duration: 0.16, ease: 'back.out(2.5)' });
    }});
  }
  function tick() {
    const d = PARTY_DATE - Date.now();
    if (d <= 0) {
      document.getElementById('countdown-row').innerHTML =
        `<span style="font-family:'Baloo 2',cursive;font-weight:900;font-size:1.5rem;color:#FFD700">🎉 It's TODAY! 🎉</span>`;
      return;
    }
    flip('cd-days',    Math.floor(d / 864e5));
    flip('cd-hours',   Math.floor((d % 864e5) / 36e5));
    flip('cd-minutes', Math.floor((d % 36e5)  / 6e4));
    flip('cd-seconds', Math.floor((d % 6e4)   / 1e3));
  }
  tick(); setInterval(tick, 1000);
})();

/* ════════════════════════════════════════════════════════
   RSVP MODAL
   ════════════════════════════════════════════════════════ */
const modal     = document.getElementById('rsvp-modal');
const modalCard = document.getElementById('modal-card');

function openModal() {
  modal.classList.add('open');
  gsap.to(modal,     { opacity: 1, duration: 0.3, ease: 'power2.out' });
  gsap.to(modalCard, { scale: 1,   duration: 0.4, ease: 'back.out(2)' });
}
function closeModal() {
  gsap.to(modal,     { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete() { modal.classList.remove('open'); }});
  gsap.to(modalCard, { scale: 0.85, duration: 0.25, ease: 'power2.in' });
}

document.getElementById('rsvp-open-btn').addEventListener('click', openModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-backdrop').addEventListener('click', closeModal);

// Number controls
const gi = document.getElementById('guests');
document.getElementById('g-minus').addEventListener('click', () => { if (+gi.value > 1)  gi.value--; });
document.getElementById('g-plus') .addEventListener('click', () => { if (+gi.value < 20) gi.value++; });

/* ════════════════════════════════════════════════════════
   CONFETTI
   ════════════════════════════════════════════════════════ */
function launchConfetti() {
  const cv  = document.getElementById('confetti-canvas');
  const ctx = cv.getContext('2d');
  cv.style.display = 'block';
  cv.width = innerWidth; cv.height = innerHeight;
  const C = ['#0057B8','#E31E24','#F5D03B','#2D9B27','#E91E8C','#F97316','#00BCD4','#FFD700'];
  const p = Array.from({ length: 145 }, () => ({
    x: Math.random() * cv.width, y: -20 - Math.random() * 130,
    vx: (Math.random() - 0.5) * 5, vy: 1.8 + Math.random() * 3.5,
    s: 5 + Math.random() * 11, c: C[Math.floor(Math.random() * C.length)],
    r: Math.random() * Math.PI * 2, rv: (Math.random() - 0.5) * 0.22,
    sh: Math.random() > 0.5
  }));
  let f = 0;
  function draw() {
    f++; ctx.clearRect(0, 0, cv.width, cv.height);
    let live = false;
    p.forEach(q => {
      q.x += q.vx; q.y += q.vy; q.vy += 0.07; q.r += q.rv;
      if (q.y < cv.height + 30) live = true;
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r);
      ctx.fillStyle = q.c; ctx.globalAlpha = Math.max(0, 1 - q.y / (cv.height + 30));
      q.sh ? ctx.fillRect(-q.s/2, -q.s/4, q.s, q.s/2)
           : (ctx.beginPath(), ctx.arc(0, 0, q.s/2, 0, Math.PI*2), ctx.fill());
      ctx.restore();
    });
    if (live && f < 380) requestAnimationFrame(draw);
    else cv.style.display = 'none';
  }
  requestAnimationFrame(draw);
}

/* ════════════════════════════════════════════════════════
   RSVP FORM SUBMIT
   ════════════════════════════════════════════════════════ */
document.getElementById('rsvp-form').addEventListener('submit', async e => {
  e.preventDefault();

  document.getElementById('surname-error').textContent = '';
  document.getElementById('guests-error').textContent  = '';
  const apiErr = document.getElementById('form-api-error');
  apiErr.hidden = true;

  const surname = document.getElementById('surname').value.trim();
  const guests  = parseInt(document.getElementById('guests').value);
  const message = document.getElementById('message').value.trim();

  let ok = true;
  if (surname.length < 2) { document.getElementById('surname-error').textContent = 'Please enter your last name'; ok = false; }
  if (isNaN(guests)||guests<1||guests>20) { document.getElementById('guests-error').textContent = 'Enter a number between 1–20'; ok = false; }
  if (!ok) { gsap.to(modalCard, { x: -9, duration: 0.05, yoyo: true, repeat: 8, ease: 'none' }); return; }

  const btn = document.getElementById('rsvp-btn');
  btn.disabled = true;
  btn.querySelector('.btn-text').hidden   = true;
  btn.querySelector('.btn-loading').hidden = false;

  try {
    const res  = await fetch('/api/rsvp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surname, guests, message })
    });
    const data = await res.json();

    if (res.ok) {
      gsap.to('#rsvp-form', { opacity: 0, scale: 0.9, duration: 0.3, onComplete() {
        document.getElementById('rsvp-form').hidden = true;
        const s = document.getElementById('form-success');
        s.hidden = false;
        gsap.from(s, { scale: 0.5, opacity: 0, duration: 0.6, ease: 'back.out(2)' });
      }});
      setTimeout(launchConfetti, 380);
    } else {
      apiErr.textContent = data.error || 'Something went wrong. Please try again.';
      apiErr.hidden = false;
      gsap.to(modalCard, { x: -9, duration: 0.05, yoyo: true, repeat: 8, ease: 'none' });
    }
  } catch {
    apiErr.textContent = 'Connection error. Please check your internet and try again.';
    apiErr.hidden = false;
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').hidden   = false;
    btn.querySelector('.btn-loading').hidden = true;
  }
});

/* ════════════════════════════════════════════════════════
   YOUTUBE — first 20 seconds only
   ════════════════════════════════════════════════════════ */
let ytPlayer, ready = false, muted = true, stopped = false, timer = null;

window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player('yt-player', {
    videoId: '1UdI_eoDPKQ',
    playerVars: { autoplay: 1, loop: 0, controls: 0, disablekb: 1, fs: 0, rel: 0, mute: 1 },
    events: {
      onReady(e) {
        ready = true;
        e.target.mute();
        e.target.playVideo();
        timer = setTimeout(() => {
          ytPlayer.pauseVideo(); stopped = true; muted = true; updateIcon();
        }, 20000);
      }
    }
  });
};

function updateIcon() {
  document.getElementById('icon-on').style.display  = muted ? 'none'  : 'block';
  document.getElementById('icon-off').style.display = muted ? 'block' : 'none';
}

document.getElementById('music-btn').addEventListener('click', () => {
  if (!ready) return;
  if (muted || stopped) {
    ytPlayer.seekTo(0); ytPlayer.unMute(); ytPlayer.playVideo();
    muted = false; stopped = false;
    clearTimeout(timer);
    timer = setTimeout(() => { ytPlayer.pauseVideo(); stopped = true; muted = true; updateIcon(); }, 20000);
  } else {
    ytPlayer.mute(); muted = true;
  }
  updateIcon();
  gsap.fromTo('#music-btn', { scale: 1.3 }, { scale: 1, duration: 0.35, ease: 'elastic.out(1,0.4)' });
});
