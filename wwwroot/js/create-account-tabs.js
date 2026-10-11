(function () {
  document.querySelectorAll('.ca-tabs__list').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    var indicator = list.querySelector('.ca-tabs__indicator');
    if (!tabs.length || !indicator) return;

    function moveIndicator(tab) {
      indicator.style.width = tab.offsetWidth + 'px';
      indicator.style.height = tab.offsetHeight + 'px';
      indicator.style.translate = tab.offsetLeft + 'px ' + tab.offsetTop + 'px';
    }

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.setAttribute('aria-selected', active ? 'true' : 'false');
        t.tabIndex = active ? 0 : -1;
      });
      moveIndicator(tab);
      if (focus) tab.focus();
    }

    function current() {
      return tabs.find(function (t) { return t.getAttribute('aria-selected') === 'true'; }) || tabs[0];
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var rtl = getComputedStyle(list).direction === 'rtl';
        var next = null;
        if (e.key === 'ArrowRight') next = rtl ? i - 1 : i + 1;
        else if (e.key === 'ArrowLeft') next = rtl ? i + 1 : i - 1;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(tab, false);
          return;
        }
        if (next === null) return;
        e.preventDefault();
        select(tabs[(next + tabs.length) % tabs.length], true);
      });
    });

    moveIndicator(current());
    requestAnimationFrame(function () {
      list.classList.add('is-ready');
    });

    var ro = new ResizeObserver(function () { moveIndicator(current()); });
    ro.observe(list);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { moveIndicator(current()); });
    }
  });
})();
