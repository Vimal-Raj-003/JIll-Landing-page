(function () {
  'use strict';

  var INTERVAL_MS = 2300;
  var STAGGER_MS = 575;

  function activate(nodes, index) {
    for (var i = 0; i < nodes.length; i++) {
      if (i === index) {
        nodes[i].classList.add('active');
        nodes[i].removeAttribute('aria-hidden');
      } else {
        nodes[i].classList.remove('active');
        nodes[i].setAttribute('aria-hidden', 'true');
      }
    }
  }

  function startCard(card, offsetMs) {
    var imgStack = card.querySelector('.card-img-stack');
    var txtStack = card.querySelector('.card-text-stack');
    if (!imgStack || !txtStack) return;

    var imgs = imgStack.querySelectorAll('img');
    var txts = txtStack.querySelectorAll('p');
    var count = Math.min(imgs.length, txts.length);
    if (count < 2) return;

    var i = 0;
    activate(imgs, 0);
    activate(txts, 0);

    setTimeout(function tick() {
      setInterval(function () {
        i = (i + 1) % count;
        activate(imgs, i);
        activate(txts, i);
      }, INTERVAL_MS);
    }, offsetMs);
  }

  function init() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    var cards = document.querySelectorAll('#problem .problem-grid .card');
    for (var n = 0; n < cards.length; n++) {
      startCard(cards[n], n * STAGGER_MS);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
