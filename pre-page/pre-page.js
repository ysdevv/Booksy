 const bg = document.querySelector('.bg');
  const body = document.body;

const initialBrightness = 0.7; // initial brightness at scroll top
const minBrightness = 0;     // brightness at bottom

body.addEventListener('scroll', () => {
  const scrollTop = body.scrollTop;
  const maxScroll = body.scrollHeight - body.clientHeight;
  const scrollRatio = Math.min(scrollTop / maxScroll, 1);

  // Map scrollRatio from initialBrightness to minBrightness:
  // At scrollRatio=0 => brightness = initialBrightness
  // At scrollRatio=1 => brightness = minBrightness

  const brightness = initialBrightness - (initialBrightness - minBrightness) * scrollRatio;

  bg.style.filter = `brightness(${brightness.toFixed(2)})`;
});
