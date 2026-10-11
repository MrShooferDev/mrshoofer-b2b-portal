/**
 * Login bottom sheet — intercepts navigation to the login page (and to pages
 * that require sign-in) and signs the user in without leaving the current page.
 * Exposes window.MrsLoginSheet.open({ returnUrl, message }).
 */
(function () {
  'use strict';

  var root, form, errorEl, messageEl, submitBtn, spinner, defaultMessage;
  var loginPath = '/auth/login';
  var protectedPaths = [];
  var lastFocus = null;

  function currentUrl() {
    return location.pathname + location.search;
  }

  function normalizePath(path) {
    return (path || '').replace(/\/+$/, '').toLowerCase() || '/';
  }

  function isLoginPath(path) {
    return normalizePath(path) === loginPath;
  }

  function isProtectedPath(path) {
    var p = normalizePath(path);
    return protectedPaths.some(function (prefix) {
      return p === prefix || p.indexOf(prefix + '/') === 0;
    });
  }

  function localReturnUrl(value) {
    if (!value) return null;
    try {
      var url = new URL(value, location.origin);
      if (url.origin !== location.origin || isLoginPath(url.pathname)) return null;
      return url.pathname + url.search + url.hash;
    } catch (e) {
      return null;
    }
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    spinner.hidden = !busy;
  }

  function showError(text) {
    errorEl.textContent = text || '';
    errorEl.hidden = !text;
  }

  function open(options) {
    if (!root) return false;
    options = options || {};

    var returnUrl = localReturnUrl(options.returnUrl) || currentUrl();
    form.elements.ReturnUrl.value = returnUrl;
    messageEl.textContent = options.message || defaultMessage;
    root.querySelector('[data-login-sheet-otp]').href =
      root.dataset.otpUrl + '?ReturnUrl=' + encodeURIComponent(returnUrl);
    showError('');
    setBusy(false);

    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add('login-sheet-open');
    // Next frame so the slide-in transition runs from the hidden state.
    requestAnimationFrame(function () {
      root.classList.add('is-open');
      form.elements.Username.focus({ preventScroll: true });
    });
    return true;
  }

  function close() {
    if (!root || root.hidden) return;
    root.classList.remove('is-open');
    document.body.classList.remove('login-sheet-open');
    setTimeout(function () {
      if (!root.classList.contains('is-open')) root.hidden = true;
    }, 320);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function onDocumentClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var link = e.target.closest && e.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    if (root.contains(link)) return;

    var url;
    try {
      url = new URL(link.href, location.origin);
    } catch (err) {
      return;
    }
    if (url.origin !== location.origin) return;

    if (isLoginPath(url.pathname)) {
      e.preventDefault();
      open({ returnUrl: url.searchParams.get('ReturnUrl') || url.searchParams.get('returnUrl') });
    } else if (isProtectedPath(url.pathname)) {
      e.preventDefault();
      open({ returnUrl: url.pathname + url.search + url.hash });
    }
  }

  function onSubmit(e) {
    if (e.target !== form) return;
    // Capture phase: keep page-level `$("form").on("submit")` handlers away from this form.
    e.preventDefault();
    e.stopPropagation();

    var username = form.elements.Username.value.trim();
    var password = form.elements.Password.value;
    if (!username || !password) {
      showError('نام کاربری و رمز عبور را وارد کنید');
      (username ? form.elements.Password : form.elements.Username).focus();
      return;
    }

    var returnUrl = form.elements.ReturnUrl.value || currentUrl();
    showError('');
    setBusy(true);

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      credentials: 'same-origin',
      redirect: 'manual'
    })
      .then(function (res) {
        // Success is a 302 to ReturnUrl; failure re-renders the login view (200).
        if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
          location.assign(returnUrl);
          return null;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text().then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var serverError = doc.querySelector('.card-body .text-danger');
          showError((serverError && serverError.textContent.trim()) || 'نام کاربری یا رمز عبور اشتباه است');
          setBusy(false);
          form.elements.Password.select();
        });
      })
      .catch(function () {
        showError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید');
        setBusy(false);
      });
  }

  function init() {
    root = document.getElementById('loginSheet');
    if (!root) return;

    form = root.querySelector('form');
    errorEl = root.querySelector('[data-login-sheet-error]');
    messageEl = root.querySelector('[data-login-sheet-message]');
    submitBtn = form.querySelector('button[type="submit"]');
    spinner = submitBtn.querySelector('.spinner-border');
    defaultMessage = messageEl.textContent;

    try {
      loginPath = normalizePath(new URL(root.dataset.loginUrl, location.origin).pathname);
    } catch (e) { /* keep default */ }
    protectedPaths = (root.dataset.protectedPaths || '')
      .split(',')
      .filter(Boolean)
      .map(normalizePath);

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('submit', onSubmit, true);

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-login-sheet-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !root.hidden) close();
    });

    root.querySelector('[data-login-sheet-toggle-password]').addEventListener('click', function () {
      var input = form.elements.Password;
      var icon = this.querySelector('i');
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      icon.classList.toggle('ti-eye', show);
      icon.classList.toggle('ti-eye-off', !show);
    });
  }

  window.MrsLoginSheet = { open: open, close: close };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
