(function () {
  'use strict';

  function boot() {
  var root = document.getElementById('officialInvoiceModal');
  if (!root) return;

  var eligibleUrl = root.getAttribute('data-eligible-url');
  var createUrl = root.getAttribute('data-create-url');
  var homeUrl = root.getAttribute('data-home-url') || '/AgencyArea/Home';
  var isOrg = root.getAttribute('data-is-org') === '1';
  var preselect = (root.getAttribute('data-preselect') || '').trim();
  var autoOpen = root.getAttribute('data-auto-open') === '1';
  var tokenInput = document.querySelector('#officialInvoiceAntiForgery input[name="__RequestVerificationToken"]');

  var listEl = document.getElementById('invoiceModalList');
  var loadingEl = document.getElementById('invoiceModalLoading');
  var emptyEl = document.getElementById('invoiceModalEmpty');
  var toolbarEl = document.getElementById('invoiceModalToolbar');
  var confirmEl = document.getElementById('invoiceModalConfirm');
  var confirmCardEl = document.getElementById('invoiceModalConfirmCard');
  var confirmQuestionEl = document.getElementById('invoiceModalConfirmQuestion');
  var confirmSubEl = document.getElementById('invoiceModalConfirmSub');
  var searchEl = document.getElementById('invoiceModalSearch');
  var countEl = document.getElementById('invoiceModalCount');
  var totalEl = document.getElementById('invoiceModalTotal');
  var submitBtn = document.getElementById('invoiceModalSubmit');
  var submitLabelEl = document.getElementById('invoiceModalSubmitLabel');
  var clearBtn = document.getElementById('invoiceModalClear');
  var hintEl = document.getElementById('invoiceModalHint');
  var footerSummaryEl = document.getElementById('invoiceModalFooterSummary');
  var periodAllBtn = document.getElementById('invoiceModalPeriodAll');
  var periodRecentBtn = document.getElementById('invoiceModalPeriodRecent');
  var periodPastBtn = document.getElementById('invoiceModalPeriodPast');

  var RECENT_DAYS = 30;
  var NEW_LABEL_DAYS = 2;
  var tickets = [];
  var selected = new Set();
  var loading = false;
  var periodMode = 'all'; // all | recent | past
  var uiMode = preselect ? 'confirm' : 'browse'; // confirm | browse

  function token() {
    return tokenInput ? tokenInput.value : '';
  }

  function formatToman(n) {
    return (Number(n) || 0).toLocaleString('en-US');
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseTicketDate(t) {
    if (!t || !t.registeredAt) return null;
    var d = new Date(t.registeredAt);
    return isNaN(d.getTime()) ? null : d;
  }

  function toJalaliParts(date) {
    // Algorithm: https://en.wikipedia.org/wiki/Jalali_calendar (same as common JS ports)
    var gy = date.getFullYear();
    var gm = date.getMonth() + 1;
    var gd = date.getDate();
    var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var gy2 = gm > 2 ? gy + 1 : gy;
    var days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4)
      - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400)
      + gd + g_d_m[gm - 1];
    var jy = -1595 + (33 * Math.floor(days / 12053));
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    var jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    var jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return { y: jy, m: jm, d: jd };
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function toPersianDigits(str) {
    return String(str).replace(/[0-9]/g, function (d) {
      return '۰۱۲۳۴۵۶۷۸۹'[Number(d)];
    });
  }

  function formatTicketDate(t) {
    var d = parseTicketDate(t);
    if (!d) return '';
    try {
      var j = toJalaliParts(d);
      return toPersianDigits(j.y + '/' + pad2(j.m) + '/' + pad2(j.d));
    } catch (e) {
      return d.toISOString().slice(0, 10);
    }
  }

  function isRecentTicket(t) {
    var d = parseTicketDate(t);
    if (!d) return true;
    var cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
    return d.getTime() >= cutoff;
  }

  function isNewTicket(t) {
    var d = parseTicketDate(t);
    if (!d) return false;
    var cutoff = Date.now() - NEW_LABEL_DAYS * 24 * 60 * 60 * 1000;
    return d.getTime() >= cutoff;
  }

  function findTicket(code) {
    if (!code) return null;
    return tickets.find(function (t) { return t.ticketCode === code; }) || null;
  }

  function setUiMode(mode) {
    uiMode = mode === 'confirm' ? 'confirm' : 'browse';
    root.setAttribute('data-ui-mode', uiMode);
  }

  function updateSummary() {
    var sum = 0;
    selected.forEach(function (code) {
      var t = tickets.find(function (x) { return x.ticketCode === code; });
      if (t) sum += t.amountToman || 0;
    });
    if (countEl) countEl.textContent = String(selected.size);
    if (totalEl) totalEl.textContent = formatToman(sum);
    if (submitBtn) {
      var canSubmit = selected.size > 0 && !loading;
      var showSubmit = true;
      if (uiMode === 'confirm') {
        var focus = findTicket(preselect);
        canSubmit = !!(focus && focus.eligible && selected.has(focus.ticketCode) && !loading);
        showSubmit = !!(focus && focus.eligible);
      }
      submitBtn.disabled = !canSubmit;
      submitBtn.classList.toggle('d-none', !showSubmit);
    }
    if (clearBtn) {
      var hasSelection = selected.size > 0;
      clearBtn.classList.toggle('btn-outline-danger', !hasSelection);
      clearBtn.classList.toggle('btn-danger', hasSelection);
      clearBtn.disabled = !hasSelection || loading || uiMode === 'confirm';
    }
    if (footerSummaryEl) {
      footerSummaryEl.classList.toggle('d-none', uiMode === 'confirm');
    }
    if (submitLabelEl) {
      submitLabelEl.textContent = uiMode === 'confirm' ? 'درخواست صدور' : 'صدور فاکتور';
    }
  }

  function setPeriodMode(mode) {
    periodMode = mode === 'recent' || mode === 'past' ? mode : 'all';
    if (periodAllBtn) periodAllBtn.classList.toggle('is-active', periodMode === 'all');
    if (periodRecentBtn) periodRecentBtn.classList.toggle('is-active', periodMode === 'recent');
    if (periodPastBtn) periodPastBtn.classList.toggle('is-active', periodMode === 'past');
    renderList(searchEl ? searchEl.value : '');
  }

  function filteredTickets(query) {
    var q = (query || '').trim().toLowerCase();
    return tickets
      .filter(function (t) {
        if (periodMode === 'recent' && !isRecentTicket(t)) return false;
        if (periodMode === 'past' && isRecentTicket(t)) return false;
        if (!q) return true;
        var dateLabel = formatTicketDate(t);
        var hay = [t.ticketCode, t.passengerName, t.nationalId, t.routeLabel, t.serviceName, dateLabel]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.indexOf(q) !== -1;
      })
      .sort(function (a, b) {
        var ae = a.eligible ? 0 : 1;
        var be = b.eligible ? 0 : 1;
        return ae - be;
      });
  }

  function renderEmpty(kind) {
    if (!emptyEl || !listEl) return;
    listEl.classList.add('d-none');
    listEl.innerHTML = '';
    if (confirmEl) confirmEl.classList.add('d-none');
    emptyEl.classList.remove('d-none');

    var title = 'بلیطی وجود ندارد';
    var text = 'هنوز بلیط فعالی برای این آژانس ثبت نشده است. پس از خرید بلیط می‌توانید فاکتور رسمی صادر کنید.';
    var actions = '';

    if (kind === 'filter') {
      title = 'چیزی پیدا نشد';
      text = 'با این عبارت یا فیلتر، بلیطی پیدا نشد. فیلتر را روی «همه سفرها» بگذارید یا جستجو را پاک کنید.';
      actions =
        '<button type="button" class="btn btn-sm btn-primary" data-empty-action="show-all">برو به همه سفرها</button>';
    } else if (kind === 'error') {
      title = 'بارگذاری ناموفق بود';
      text = 'ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.';
      actions =
        '<button type="button" class="btn btn-sm btn-primary" data-empty-action="retry">تلاش دوباره</button>';
    } else if (kind === 'missing') {
      title = 'بلیط پیدا نشد';
      text = 'بلیط انتخاب‌شده در لیست قابل صدور نیست. می‌توانید بلیط دیگری را انتخاب کنید.';
      actions =
        '<button type="button" class="btn btn-sm btn-primary" data-empty-action="browse">انتخاب بلیط</button>';
    } else {
      actions =
        '<a class="btn btn-sm btn-primary" href="' + escapeHtml(homeUrl) + '">جستجوی سفر و خرید بلیط</a>';
    }

    emptyEl.innerHTML =
      '<div class="invoice-modal__empty invoice-modal__stage">' +
      '<p class="invoice-modal__empty-title">' + title + '</p>' +
      '<p class="invoice-modal__empty-text">' + text + '</p>' +
      (actions ? '<div class="invoice-modal__empty-actions">' + actions + '</div>' : '') +
      '</div>';

    emptyEl.querySelectorAll('[data-empty-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-empty-action');
        if (action === 'show-all') {
          if (searchEl) searchEl.value = '';
          setPeriodMode('all');
        } else if (action === 'retry') {
          loadTickets();
        } else if (action === 'browse') {
          enterBrowseMode(true);
        }
      });
    });
  }

  function renderConfirm(ticket) {
    if (!confirmEl || !confirmCardEl) return;

    if (toolbarEl) toolbarEl.classList.add('d-none');
    if (listEl) {
      listEl.classList.add('d-none');
      listEl.innerHTML = '';
    }
    if (emptyEl) {
      emptyEl.classList.add('d-none');
      emptyEl.innerHTML = '';
    }

    confirmEl.classList.remove('d-none');
    if (hintEl) {
      hintEl.textContent = 'تأیید درخواست صدور برای بلیط انتخاب‌شده';
    }
    if (confirmQuestionEl) {
      confirmQuestionEl.textContent = ticket.eligible
        ? 'آیا می‌خواهید برای این بلیط فاکتور رسمی صادر شود؟'
        : 'امکان صدور فاکتور برای این بلیط وجود ندارد.';
    }
    if (confirmSubEl) {
      confirmSubEl.textContent = ticket.eligible
        ? 'اطلاعات زیر را بررسی کنید و در صورت تأیید، درخواست صدور را بزنید.'
        : 'دلیل عدم امکان صدور برای این بلیط در پایین آمده است.';
    }

    var dateLabel = formatTicketDate(ticket);
    var facts = [
      { label: 'سرویس', value: ticket.serviceName || '—' },
      { label: 'تاریخ', value: dateLabel || '—' },
      { label: 'کد بلیط', value: ticket.ticketCode || '—', ltr: true },
      { label: 'مبلغ', value: formatToman(ticket.amountToman) + ' تومان', ltr: true }
    ];
    if (ticket.nationalId) {
      facts.splice(2, 0, { label: 'کد ملی', value: ticket.nationalId, ltr: true });
    }

    var factsHtml = facts.map(function (f) {
      return '<div class="invoice-modal__confirm-fact">' +
        '<dt>' + escapeHtml(f.label) + '</dt>' +
        '<dd' + (f.ltr ? ' dir="ltr"' : '') + '>' + escapeHtml(f.value) + '</dd>' +
        '</div>';
    }).join('');

    var blockHtml = '';
    if (!ticket.eligible) {
      blockHtml =
        '<div class="invoice-modal__confirm-block">' +
        '<iconify-icon icon="fluent-color:warning-24" width="18" height="18" aria-hidden="true"></iconify-icon>' +
        '<span>' +
        escapeHtml(ticket.blockReason || 'این بلیط برای صدور فاکتور قابل انتخاب نیست.') +
        (ticket.activeInvoiceSerial
          ? ' · <span dir="ltr">#' + escapeHtml(ticket.activeInvoiceSerial) + '</span>'
          : '') +
        '</span></div>';
    }

    confirmCardEl.innerHTML =
      '<div class="invoice-modal__confirm-head">' +
      '<div class="invoice-modal__confirm-passenger">' + escapeHtml(ticket.passengerName || '—') + '</div>' +
      '<div class="invoice-modal__confirm-route">' + escapeHtml(ticket.routeLabel || '—') + '</div>' +
      '</div>' +
      '<dl class="invoice-modal__confirm-facts">' + factsHtml + '</dl>' +
      blockHtml;

    selected = new Set();
    if (ticket.eligible) selected.add(ticket.ticketCode);
    updateSummary();
  }

  function enterBrowseMode(keepSelection) {
    setUiMode('browse');
    if (!keepSelection) {
      selected = new Set();
      preselect = '';
      root.setAttribute('data-preselect', '');
    } else if (preselect && findTicket(preselect) && findTicket(preselect).eligible) {
      selected = new Set([preselect]);
    }
    if (confirmEl) confirmEl.classList.add('d-none');
    if (hintEl) {
      hintEl.textContent = 'سفرهایی که برای آنها فاکتور رسمی میخواهید را انتخاب کنید';
    }
    renderList(searchEl ? searchEl.value : '');
  }

  function enterConfirmMode(code) {
    setUiMode('confirm');
    preselect = (code || '').trim();
    root.setAttribute('data-preselect', preselect);
    var hit = findTicket(preselect);
    if (!hit) {
      if (toolbarEl) toolbarEl.classList.add('d-none');
      renderEmpty('missing');
      selected.clear();
      updateSummary();
      return;
    }
    renderConfirm(hit);
  }

  function renderList(filter) {
    if (!listEl) return;
    if (loading) return;
    if (uiMode === 'confirm') return;

    var q = (filter || '').trim();
    var visible = filteredTickets(q);

    if (confirmEl) confirmEl.classList.add('d-none');

    if (!tickets.length) {
      if (toolbarEl) toolbarEl.classList.add('d-none');
      renderEmpty('none');
      updateSummary();
      return;
    }

    if (toolbarEl) toolbarEl.classList.remove('d-none');

    if (!visible.length) {
      renderEmpty('filter');
      updateSummary();
      return;
    }

    emptyEl && emptyEl.classList.add('d-none');
    listEl.classList.remove('d-none');
    listEl.innerHTML = '';

    visible.forEach(function (t) {
      var disabled = !t.eligible;
      var checked = selected.has(t.ticketCode);
      var row = document.createElement('label');
      row.className = 'invoice-modal__row' +
        (disabled ? ' invoice-modal__row--disabled' : '') +
        (checked ? ' invoice-modal__row--selected' : '');
      row.setAttribute('role', 'listitem');

      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'form-check-input invoice-modal__check';
      cb.value = t.ticketCode;
      cb.checked = checked;
      cb.disabled = disabled;
      cb.addEventListener('change', function () {
        if (cb.checked) selected.add(t.ticketCode);
        else selected.delete(t.ticketCode);
        row.classList.toggle('invoice-modal__row--selected', cb.checked);
        updateSummary();
      });

      var mid = document.createElement('div');
      var badge = '';
      if (disabled && t.blockReason) {
        badge = '<div class="invoice-modal__badge">' +
          '<iconify-icon icon="fluent-color:warning-24" width="14" height="14" aria-hidden="true"></iconify-icon>' +
          escapeHtml(t.blockReason) +
          (t.activeInvoiceSerial ? ' · <span dir="ltr">#' + escapeHtml(t.activeInvoiceSerial) + '</span>' : '') +
          '</div>';
      }
      var dateLabel = formatTicketDate(t);
      var ageBadge = isNewTicket(t)
        ? ' <span class="invoice-modal__age">جدید</span>'
        : '';
      var secondary = [];
      if (t.serviceName) secondary.push(escapeHtml(t.serviceName));
      if (dateLabel) secondary.push(escapeHtml(dateLabel));
      if (t.ticketCode) secondary.push('<span dir="ltr">#' + escapeHtml(t.ticketCode) + '</span>');
      mid.innerHTML =
        '<div class="invoice-modal__passenger">' +
        escapeHtml(t.passengerName || '—') +
        ageBadge + '</div>' +
        '<div class="invoice-modal__route">' + escapeHtml(t.routeLabel || '—') + '</div>' +
        (secondary.length
          ? '<div class="invoice-modal__meta">' + secondary.join(' · ') + '</div>'
          : '') +
        badge;

      var amount = document.createElement('div');
      amount.className = 'invoice-modal__amount';
      amount.textContent = formatToman(t.amountToman) + ' ت';

      row.appendChild(cb);
      row.appendChild(mid);
      row.appendChild(amount);
      listEl.appendChild(row);
    });

    updateSummary();
  }

  function setLoading(on) {
    loading = on;
    if (loadingEl) {
      loadingEl.classList.toggle('d-none', !on);
      loadingEl.classList.toggle('invoice-modal__stage', on);
    }
    if (listEl && on) {
      listEl.classList.add('d-none');
      listEl.innerHTML = '';
    }
    if (emptyEl && on) {
      emptyEl.classList.add('d-none');
      emptyEl.innerHTML = '';
    }
    if (confirmEl && on) {
      confirmEl.classList.add('d-none');
    }
    if (toolbarEl) toolbarEl.classList.toggle('d-none', on || uiMode === 'confirm');
    updateSummary();
  }

  function afterTicketsLoaded() {
    if (uiMode === 'confirm' && preselect) {
      enterConfirmMode(preselect);
      return;
    }
    setUiMode('browse');
    if (hintEl) {
      hintEl.textContent = 'سفرهایی که برای آنها فاکتور رسمی میخواهید را انتخاب کنید';
    }
    var nextSelected = new Set();
    if (preselect) {
      var hit = tickets.find(function (t) { return t.ticketCode === preselect && t.eligible; });
      if (hit) nextSelected.add(hit.ticketCode);
    }
    selected = nextSelected;
    renderList(searchEl ? searchEl.value : '');
  }

  function loadTickets() {
    setLoading(true);
    return fetch(eligibleUrl, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }
    })
      .then(function (r) {
        if (!r.ok) throw new Error('http');
        return r.json();
      })
      .then(function (data) {
        setLoading(false);
        if (!data || !data.ok) {
          if (data && data.needsFinancial && data.legalProfileUrl) {
            window.location.href = data.legalProfileUrl;
            return;
          }
          renderEmpty('error');
          return;
        }

        tickets = Array.isArray(data.tickets) ? data.tickets : [];
        afterTicketsLoaded();
      })
      .catch(function () {
        setLoading(false);
        tickets = [];
        selected.clear();
        renderEmpty('error');
        updateSummary();
      });
  }

  function openModal() {
    var modal = bootstrap.Modal.getOrCreateInstance(root);
    modal.show();
  }

  root.addEventListener('show.bs.modal', function () {
    loadTickets();
  });

  root.addEventListener('hidden.bs.modal', function () {
    if (searchEl) searchEl.value = '';
    periodMode = 'all';
    if (periodAllBtn) periodAllBtn.classList.add('is-active');
    if (periodRecentBtn) periodRecentBtn.classList.remove('is-active');
    if (periodPastBtn) periodPastBtn.classList.remove('is-active');
    setUiMode(preselect ? 'confirm' : 'browse');
  });

  if (searchEl) {
    searchEl.addEventListener('input', function () {
      renderList(searchEl.value);
    });
  }

  if (periodAllBtn) periodAllBtn.addEventListener('click', function () { setPeriodMode('all'); });
  if (periodRecentBtn) periodRecentBtn.addEventListener('click', function () { setPeriodMode('recent'); });
  if (periodPastBtn) periodPastBtn.addEventListener('click', function () { setPeriodMode('past'); });

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (uiMode === 'confirm') return;
      selected.clear();
      renderList(searchEl ? searchEl.value : '');
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      if (selected.size === 0 || loading) return;
      submitBtn.disabled = true;
      var codes = Array.from(selected);
      var fd = new FormData();
      fd.append('__RequestVerificationToken', token());
      codes.forEach(function (code) { fd.append('ticketCodes', code); });
      fetch(createUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        body: fd
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.ok && data.printUrl) {
            window.location.href = data.printUrl;
            return;
          }
          submitBtn.disabled = false;
          var msg = (data && data.message) || 'صدور فاکتور ناموفق بود.';
          if (data && data.needsFinancial && data.legalProfileUrl) {
            window.location.href = data.legalProfileUrl;
            return;
          }
          if (window.Swal) Swal.fire({ icon: 'error', title: 'خطا', text: msg });
          else alert(msg);
        })
        .catch(function () {
          submitBtn.disabled = false;
          if (window.Swal) Swal.fire({ icon: 'error', title: 'خطا', text: 'ارتباط با سرور برقرار نشد.' });
        });
    });
  }

  document.querySelectorAll('[data-open-invoice-modal]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var code = (btn.getAttribute('data-ticket-code') || '').trim();
      if (code) {
        preselect = code;
        root.setAttribute('data-preselect', code);
        setUiMode('confirm');
      } else {
        preselect = '';
        root.setAttribute('data-preselect', '');
        setUiMode('browse');
      }
      openModal();
    });
  });

  if (autoOpen) {
    setUiMode(preselect ? 'confirm' : 'browse');
    openModal();
  }

  void isOrg;

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
