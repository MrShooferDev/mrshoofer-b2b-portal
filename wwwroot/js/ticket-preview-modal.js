(function () {
  'use strict';

  function boot() {
    var root = document.getElementById('ticketPreviewModal');
    if (!root || typeof bootstrap === 'undefined') return;

    var passengerEl = document.getElementById('ticketPreviewPassenger');
    var originEl = document.getElementById('ticketPreviewOrigin');
    var destinationEl = document.getElementById('ticketPreviewDestination');
    var dateEl = document.getElementById('ticketPreviewDate');
    var timeEl = document.getElementById('ticketPreviewTime');
    var statusEl = document.getElementById('ticketPreviewStatus');
    var carEl = document.getElementById('ticketPreviewCar');
    var serviceEl = document.getElementById('ticketPreviewService');
    var codeEl = document.getElementById('ticketPreviewCode');
    var phoneFact = document.getElementById('ticketPreviewPhoneFact');
    var phoneEl = document.getElementById('ticketPreviewPhone');
    var amountFact = document.getElementById('ticketPreviewAmountFact');
    var amountEl = document.getElementById('ticketPreviewAmount');
    var progressWrap = document.getElementById('ticketPreviewProgressWrap');
    var progressPctEl = document.getElementById('ticketPreviewProgressPct');
    var progressBar = document.getElementById('ticketPreviewProgressBar');
    var progressFill = document.getElementById('ticketPreviewProgressFill');
    var progressEta = document.getElementById('ticketPreviewProgressEta');
    var hintEl = document.getElementById('ticketPreviewModalHint');

    function text(el, value, fallback) {
      if (!el) return;
      var v = (value == null ? '' : String(value)).trim();
      el.textContent = v || (fallback || '—');
    }

    function show(el, on) {
      if (!el) return;
      el.classList.toggle('d-none', !on);
      if (el.hasAttribute('hidden')) {
        if (on) el.removeAttribute('hidden');
        else el.setAttribute('hidden', '');
      }
    }

    function formatParts(iso) {
      if (!iso) return { date: '', time: '' };
      var d = new Date(iso);
      if (isNaN(d.getTime())) return { date: String(iso), time: '' };
      try {
        return {
          date: d.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          time: d.toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        };
      } catch (e) {
        var raw = d.toISOString().slice(0, 16).replace('T', ' ');
        return { date: raw, time: '' };
      }
    }

    function formatToman(n) {
      var num = Number(n);
      if (!isFinite(num) || num <= 0) return '';
      return num.toLocaleString('en-US') + ' تومان';
    }

    function openPreview(data) {
      data = data || {};
      var passenger = data.passenger || '';
      var origin = data.origin || '';
      var destination = data.destination || '';
      if ((!origin || !destination) && data.route) {
        var parts = String(data.route).split(/\s*به\s*/);
        if (!origin && parts[0]) origin = parts[0].trim();
        if (!destination && parts[1]) destination = parts[1].trim();
      }

      var whenParts = formatParts(data.at || data.departureAt);

      text(passengerEl, passenger, 'مسافر');
      text(originEl, origin, '—');
      text(destinationEl, destination, '—');
      text(dateEl, whenParts.date, '—');
      text(timeEl, whenParts.time, '—');
      text(carEl, data.car, '—');
      text(serviceEl, data.service, '—');
      text(codeEl, data.ticketCode, '—');

      var phone = (data.phone || '').trim();
      show(phoneFact, !!phone);
      text(phoneEl, phone, '—');

      var amountLabel = formatToman(data.amountToman);
      show(amountFact, !!amountLabel);
      text(amountEl, amountLabel, '—');

      var statusKey = (data.statusKey || '').trim();
      var statusLabel = (data.statusLabel || '').trim();
      if (statusEl) {
        statusEl.className = 'ticket-preview-modal__status';
        if (statusKey) statusEl.classList.add('is-' + statusKey);
        if (statusLabel) {
          statusEl.textContent = statusLabel;
          statusEl.removeAttribute('hidden');
        } else {
          statusEl.setAttribute('hidden', '');
          statusEl.textContent = '';
        }
      }

      var pct = data.progressPercent;
      var hasProgress = statusKey === 'in-progress' && pct != null && isFinite(Number(pct));
      show(progressWrap, hasProgress);
      if (hasProgress) {
        var p = Math.max(0, Math.min(100, Math.round(Number(pct))));
        text(progressPctEl, p + '%', '0%');
        if (progressFill) progressFill.style.width = p + '%';
        if (progressBar) progressBar.setAttribute('aria-valuenow', String(p));
        var etaIso = data.progressArrival || data.arrivalAt || '';
        var etaDate = etaIso ? new Date(etaIso) : null;
        if (etaDate && !isNaN(etaDate.getTime())) {
          var etaText = 'رسیدن تقریبی: ' + etaDate.toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          text(progressEta, etaText, '');
          show(progressEta, true);
        } else {
          show(progressEta, false);
        }
      }

      if (hintEl) {
        hintEl.textContent = statusLabel
          ? ('وضعیت: ' + statusLabel)
          : 'مرور سریع اطلاعات سفر پیش‌رو';
      }

      bootstrap.Modal.getOrCreateInstance(root).show();
    }

    function readFromElement(el) {
      if (!el) return {};
      return {
        passenger: el.getAttribute('data-passenger'),
        origin: el.getAttribute('data-origin'),
        destination: el.getAttribute('data-destination'),
        route: el.getAttribute('data-route'),
        at: el.getAttribute('data-at'),
        car: el.getAttribute('data-car'),
        service: el.getAttribute('data-service'),
        ticketCode: el.getAttribute('data-ticket-code'),
        phone: el.getAttribute('data-phone'),
        amountToman: el.getAttribute('data-amount-toman'),
        statusKey: el.getAttribute('data-status-key'),
        statusLabel: el.getAttribute('data-status-label'),
        progressPercent: el.getAttribute('data-progress-percent'),
        progressArrival: el.getAttribute('data-progress-arrival')
      };
    }

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-open-ticket-preview]');
      if (!trigger) return;
      e.preventDefault();
      openPreview(readFromElement(trigger));
    });

    window.MrShooferTicketPreview = {
      open: openPreview
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
