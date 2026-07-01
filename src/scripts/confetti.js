const activeHearts = [];
let rafId = null;

function animateAllHearts(now) {
  for (let i = activeHearts.length - 1; i >= 0; i--) {
    const h = activeHearts[i];
    const elapsed = now - h.startTime;
    const progress = elapsed / h.duration;

    if (progress >= 1 || !document.body.contains(h.el)) {
      h.el.remove();
      activeHearts.splice(i, 1);
      continue;
    }

    h.posX += h.vx;
    h.posY += h.vy + (progress * 2);

    h.el.style.transform = `translate(${h.posX - h.originX}px, ${h.posY - h.originY}px) rotate(${progress * 360}deg)`;
    h.el.style.opacity = (1 - progress).toString();
  }

  if (activeHearts.length > 0) {
    rafId = requestAnimationFrame(animateAllHearts);
  } else {
    rafId = null;
  }
}

function spawnHeart(x, y, vx, vy, duration) {
  const el = document.createElement('div');
  el.textContent = '❤️';
  el.style.position = 'fixed';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.pointerEvents = 'none';
  el.style.zIndex = '9999';
  el.style.fontSize = `${Math.random() * 16 + 8}px`;

  document.body.appendChild(el);

  activeHearts.push({
    el,
    originX: x,
    originY: y,
    posX: x,
    posY: y,
    vx,
    vy,
    startTime: performance.now(),
    duration
  });

  if (!rafId) {
    rafId = requestAnimationFrame(animateAllHearts);
  }
}

export function spawnHeartsFromButton(buttonEl) {
  const rect = buttonEl.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  spawnHeartsConfetti(x, y, 12);
}

export function spawnHeartsConfetti(x, y, count = 15) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 8 + 3;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 4;
    const duration = Math.random() * 800 + 400;

    spawnHeart(x, y, vx, vy, duration);
  }
}

export function spawnFloatingHeartsBackground(count = 20) {
  for (let i = 0; i < count; i++) {
    const heart = document.createElement('div');
    heart.textContent = '❤️';
    heart.style.position = 'fixed';
    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.top = `${window.innerHeight + 20}px`;
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '1';
    heart.style.fontSize = `${Math.random() * 12 + 8}px`;

    const duration = Math.random() * 6 + 4;
    heart.style.transition = `transform ${duration}s linear, opacity ${duration}s ease`;
    heart.style.opacity = (Math.random() * 0.3 + 0.1).toString();

    document.body.appendChild(heart);

    setTimeout(() => {
      if (!document.body.contains(heart)) return;
      heart.style.transform = `translateY(-${window.innerHeight + 100}px) translateX(${Math.random() * 100 - 50}px) rotate(${Math.random() * 360}deg)`;
      heart.style.opacity = '0';
    }, 50);

    setTimeout(() => {
      if (document.body.contains(heart)) heart.remove();
    }, duration * 1000 + 100);
  }
}
