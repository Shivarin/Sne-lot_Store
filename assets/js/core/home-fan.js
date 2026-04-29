(function () {
  'use strict';
  function init () {
    var shell = document.getElementById('fanShell');
    var sc = document.getElementById('fanExamples');
    if (!shell || !sc) return;
    var row = sc.querySelector('.fan-row');
    var cards = row ? row.querySelectorAll('.fan-card') : [];
    if (!row || !cards.length) return;
    var prev = document.querySelector('.fan-scroll__edge--prev');
    var next = document.querySelector('.fan-scroll__edge--next');
    var mq = window.matchMedia('(max-width: 1020px)');
    var count = cards.length;

    function clampIndex (n) {
      return Math.max(0, Math.min(count - 1, n));
    }

    function getIndex () {
      var v = shell.style.getPropertyValue('--fan-index').trim();
      var n = parseInt(v, 10);
      if (isNaN(n)) return 0;
      return clampIndex(n);
    }

    function setIndex (idx) {
      idx = clampIndex(idx);
      shell.style.setProperty('--fan-index', String(idx));
      if (prev) prev.disabled = idx <= 0;
      if (next) next.disabled = idx >= count - 1;
    }

    function step (dir) {
      if (!mq.matches) return;
      setIndex(getIndex() + dir);
    }

    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });

    shell.addEventListener('keydown', function (e) {
      if (!mq.matches) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      }
    });

    function applyMq () {
      if (mq.matches) {
        setIndex(getIndex());
      } else {
        if (prev) prev.disabled = false;
        if (next) next.disabled = false;
        shell.style.removeProperty('--fan-index');
      }
    }
    mq.addEventListener('change', applyMq);
    applyMq();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
