const crypto = require('crypto');
global.window = { crypto: crypto.webcrypto };

function shuffle(arr) {
  const a = [...arr];
  const randomBuffer = new Uint32Array(1);
  for (let i = a.length - 1; i > 0; i--) {
    window.crypto.getRandomValues(randomBuffer);
    const randomFloat = randomBuffer[0] / 4294967296;
    const j = Math.floor(randomFloat * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const orig = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log("Original: ", orig);
for (let i = 0; i < 5; i++) {
  console.log("Shuffled: ", shuffle(orig));
}
