/**
 * Login bottom sheet — intercepts navigation to the login page (and to pages
 * that require sign-in) and signs the user in without leaving the current page.
 * Exposes window.MrsLoginSheet.open({ returnUrl, message }).
 */
(function () {
  'use strict';

  var root, passwordForm, otpPhoneForm, otpCodeForm, errorEl, messageEl;
  var loginPath = '/auth/login';
  var protectedPaths = [];
  var otpUrl, otpSubmitUrl;
  var lastFocus = null;
  var otpPhone = '';
  var resendTimerId = null;

  var messages = {
    password: 'برای ورود، اطلاعات کاربر را وارد کنید',
    otpPhone: 'ورود با رمز یک‌بار مصرف',
    otpCode: 'ورود با شماره تلفن'
  };

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

  function antiforgeryToken() {
    var input = passwordForm && passwordForm.querySelector('[name="__RequestVerificationToken"]');
    return input ? input.value : '';
  }

  function activeSubmitBtn() {
    var view = root.querySelector('[data-login-sheet-view]:not([hidden])');
    if (!view) return null;
    return view.querySelector('button[type="submit"]');
  }

  function setBusy(busy) {
    root.querySelectorAll('.login-sheet__submit').forEach(function (btn) {
      btn.disabled = busy;
      var sp = btn.querySelector('.spinner-border');
      if (sp) sp.hidden = !busy || btn !== activeSubmitBtn();
    });
    if (busy && activeSubmitBtn()) {
      var sp = activeSubmitBtn().querySelector('.spinner-border');
      if (sp) sp.hidden = false;
    }
  }

  function showError(text) {
    errorEl.textContent = text || '';
    errorEl.hidden = !text;
  }

  function syncReturnUrl(value) {
    root.querySelectorAll('input[name="ReturnUrl"]').forEach(function (el) {
      el.value = value;
    });
  }

  function showView(name) {
    root.querySelectorAll('[data-login-sheet-view]').forEach(function (el) {
      el.hidden = el.getAttribute('data-login-sheet-view') !== name;
    });
    messageEl.textContent = messages[name] || messages.password;
    showError('');
  }

  function clearOtpInputs() {
    if (!otpCodeForm) return;
    otpCodeForm.querySelectorAll('.login-sheet__otp-inputs input').forEach(function (input) {
      input.value = '';
    });
  }

  function stopResendTimer() {
    if (resendTimerId) {
      clearInterval(resendTimerId);
      resendTimerId = null;
    }
    var countdown = root.querySelector('[data-login-sheet-otp-countdown]');
    if (countdown) countdown.textContent = '';
  }

  function startResendTimer() {
    stopResendTimer();
    var resendBtn = root.querySelector('[data-login-sheet-resend-otp]');
    var countdown = root.querySelector('[data-login-sheet-otp-countdown]');
    if (!resendBtn) return;

    var timeLeft = 70;
    resendBtn.disabled = true;

    resendTimerId = setInterval(function () {
      timeLeft--;
      if (timeLeft <= 0) {
        stopResendTimer();
        if (countdown) countdown.textContent = '';
        resendBtn.disabled = false;
      } else {
        var minutes = Math.floor(timeLeft / 60);
        var seconds = timeLeft % 60;
        if (countdown) {
          countdown.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        }
        resendBtn.disabled = true;
      }
    }, 1000);
  }

  function showPasswordView(focusField) {
    stopResendTimer();
    showView('password');
    setBusy(false);
    var field = focusField || passwordForm.elements.Username;
    if (field && field.focus) field.focus({ preventScroll: true });
  }

  function showOtpPhoneView() {
    stopResendTimer();
    showView('otp-phone');
    setBusy(false);
    if (otpPhone) otpPhoneForm.elements.numberphone.value = otpPhone;
    otpPhoneForm.elements.numberphone.focus({ preventScroll: true });
  }

  function showOtpCodeView(phone) {
    otpPhone = phone || otpPhone;
    showView('otp-code');
    setBusy(false);
    clearOtpInputs();
    root.querySelector('[data-login-sheet-otp-display]').textContent = otpPhone;
    otpCodeForm.querySelector('[data-login-sheet-otp-phone-hidden]').value = otpPhone;
    startResendTimer();
    var first = otpCodeForm.querySelector('.login-sheet__otp-inputs input');
    if (first) first.focus({ preventScroll: true });
  }

  function parseHtmlError(html, selectors) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var i;
    for (i = 0; i < selectors.length; i++) {
      var node = doc.querySelector(selectors[i]);
      if (node && node.textContent.trim()) return node.textContent.trim();
    }
    return '';
  }

  function redirectLocation(res) {
    if (res.type === 'opaqueredirect') return null;
    return res.headers.get('Location');
  }

  function isOtpRestartRedirect(loc) {
    if (!loc) return false;
    try {
      var path = normalizePath(new URL(loc, location.origin).pathname);
      return path.indexOf('loginotp') !== -1 && path.indexOf('loginotpsubmit') === -1;
    } catch (e) {
      return false;
    }
  }

  function isOtpCodeStepRedirect(loc) {
    if (!loc) return false;
    try {
      return normalizePath(new URL(loc, location.origin).pathname).indexOf('loginotpsubmit') !== -1;
    } catch (e) {
      return false;
    }
  }

  function followAuthRedirect(res, returnUrl, onRestart) {
    if (res.type !== 'opaqueredirect' && !(res.status >= 300 && res.status < 400)) return false;
    var loc = redirectLocation(res);
    if (isOtpRestartRedirect(loc)) {
      onRestart();
      return true;
    }
    if (loc) {
      location.assign(new URL(loc, location.origin).href);
    } else {
      location.assign(returnUrl);
    }
    return true;
  }

  function postForm(url, fields) {
    var fd = new FormData();
    Object.keys(fields).forEach(function (key) {
      if (fields[key] != null) fd.append(key, fields[key]);
    });
    var token = antiforgeryToken();
    if (token) fd.append('__RequestVerificationToken', token);

    return fetch(url, {
      method: 'POST',
      body: fd,
      credentials: 'same-origin',
      redirect: 'manual'
    });
  }

  function open(options) {
    if (!root) return false;
    options = options || {};

    var returnUrl = localReturnUrl(options.returnUrl) || currentUrl();
    syncReturnUrl(returnUrl);
    messageEl.textContent = options.message || messages.password;
    showPasswordView();
    otpPhone = '';
    clearOtpInputs();

    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add('login-sheet-open');
    requestAnimationFrame(function () {
      root.classList.add('is-open');
      passwordForm.elements.Username.focus({ preventScroll: true });
    });
    return true;
  }

  function close() {
    if (!root || root.hidden) return;
    root.classList.remove('is-open');
    document.body.classList.remove('login-sheet-open');
    stopResendTimer();
    setTimeout(function () {
      if (!root.classList.contains('is-open')) {
        root.hidden = true;
        showPasswordView();
      }
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

  function onPasswordSubmit(e) {
    if (e.target !== passwordForm) return;
    e.preventDefault();
    e.stopPropagation();

    var username = passwordForm.elements.Username.value.trim();
    var password = passwordForm.elements.Password.value;
    if (!username || !password) {
      showError('نام کاربری و رمز عبور را وارد کنید');
      (username ? passwordForm.elements.Password : passwordForm.elements.Username).focus();
      return;
    }

    var returnUrl = passwordForm.elements.ReturnUrl.value || currentUrl();
    showError('');
    setBusy(true);

    fetch(passwordForm.action, {
      method: 'POST',
      body: new FormData(passwordForm),
      credentials: 'same-origin',
      redirect: 'manual'
    })
      .then(function (res) {
        if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
          location.assign(returnUrl);
          return null;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text().then(function (html) {
          showError(
            parseHtmlError(html, ['.card-body .text-danger', '.text-danger']) ||
              'نام کاربری یا رمز عبور اشتباه است'
          );
          setBusy(false);
          passwordForm.elements.Password.select();
        });
      })
      .catch(function () {
        showError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید');
        setBusy(false);
      });
  }

  function onOtpPhoneSubmit(e) {
    if (e.target !== otpPhoneForm) return;
    e.preventDefault();
    e.stopPropagation();

    var phone = otpPhoneForm.elements.numberphone.value.trim();
    if (!phone) {
      showError('شماره تلفن خود را وارد کنید');
      otpPhoneForm.elements.numberphone.focus();
      return;
    }

    var returnUrl = otpPhoneForm.elements.ReturnUrl.value || currentUrl();
    showError('');
    setBusy(true);

    postForm(otpUrl, { numberphone: phone, ReturnUrl: returnUrl })
      .then(function (res) {
        var locationHeader = redirectLocation(res);
        if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
          if (isOtpCodeStepRedirect(locationHeader) || res.type === 'opaqueredirect') {
            var sentPhone = phone;
            if (locationHeader) {
              try {
                sentPhone = new URL(locationHeader, location.origin).searchParams.get('numberphone') || phone;
              } catch (e) { /* keep phone */ }
            }
            showOtpCodeView(sentPhone);
            setBusy(false);
            return null;
          }
          showError('درخواست ناموفق بود. دوباره تلاش کنید');
          setBusy(false);
          return null;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text().then(function (html) {
          showError(
            parseHtmlError(html, ['.card-body .text-danger', '.text-danger']) ||
              'شماره وارد شده در سیستم ثبت نشده است'
          );
          setBusy(false);
          otpPhoneForm.elements.numberphone.focus();
        });
      })
      .catch(function () {
        showError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید');
        setBusy(false);
      });
  }

  function otpCodeValues() {
    var codes = ['code1', 'code2', 'code3', 'code4', 'code5'];
    var values = {};
    var complete = true;
    codes.forEach(function (name) {
      values[name] = otpCodeForm.elements[name].value.trim();
      if (!values[name]) complete = false;
    });
    return { values: values, complete: complete };
  }

  function onOtpCodeSubmit(e) {
    if (e.target !== otpCodeForm) return;
    e.preventDefault();
    e.stopPropagation();

    var parsed = otpCodeValues();
    if (!parsed.complete) {
      showError('لطفا کد 5 رقمی را کامل وارد کنید');
      return;
    }

    var returnUrl = otpCodeForm.elements.ReturnUrl.value || currentUrl();
    var phone = otpCodeForm.elements.numberphone.value;
    showError('');
    setBusy(true);

    var fields = {
      numberphone: phone,
      ReturnUrl: returnUrl,
      code1: parsed.values.code1,
      code2: parsed.values.code2,
      code3: parsed.values.code3,
      code4: parsed.values.code4,
      code5: parsed.values.code5
    };

    postForm(otpSubmitUrl, fields)
      .then(function (res) {
        if (
          followAuthRedirect(res, returnUrl, function () {
            showError('زمان اعتبار کد به پایان رسید. لطفاً دوباره درخواست دهید.');
            showOtpPhoneView();
            setBusy(false);
          })
        ) {
          return null;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text().then(function (html) {
          showError(
            parseHtmlError(html, ['.card-body .text-danger', '.text-danger']) ||
              'کد وارد شده نادرست است'
          );
          setBusy(false);
          clearOtpInputs();
          otpCodeForm.elements.code1.focus();
        });
      })
      .catch(function () {
        showError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید');
        setBusy(false);
      });
  }

  function onResendOtp() {
    var resendBtn = root.querySelector('[data-login-sheet-resend-otp]');
    if (!resendBtn || resendBtn.disabled || !otpPhone) return;

    var returnUrl = otpCodeForm.elements.ReturnUrl.value || currentUrl();
    showError('');
    setBusy(true);

    postForm(otpUrl, { numberphone: otpPhone, ReturnUrl: returnUrl })
      .then(function (res) {
        if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
          startResendTimer();
          setBusy(false);
          clearOtpInputs();
          otpCodeForm.elements.code1.focus();
          return null;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text().then(function (html) {
          showError(parseHtmlError(html, ['.card-body .text-danger', '.text-danger']) || 'ارسال مجدد ناموفق بود');
          setBusy(false);
        });
      })
      .catch(function () {
        showError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید');
        setBusy(false);
      });
  }

  function bindOtpInputNavigation() {
    var inputs = otpCodeForm.querySelectorAll('.login-sheet__otp-inputs input');
    inputs.forEach(function (input, index) {
      input.addEventListener('input', function () {
        var digit = this.value.replace(/\D/g, '');
        this.value = digit.slice(-1);
        if (this.value && inputs[index + 1]) inputs[index + 1].focus();
        var parsed = otpCodeValues();
        if (parsed.complete) otpCodeForm.requestSubmit();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !this.value && inputs[index - 1]) {
          inputs[index - 1].focus();
        }
      });
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 5);
        if (!text) return;
        for (var i = 0; i < inputs.length; i++) {
          inputs[i].value = text[i] || '';
        }
        if (text.length >= 5) otpCodeForm.requestSubmit();
        else if (text.length > 0) inputs[Math.min(text.length, inputs.length - 1)].focus();
      });
    });
  }

  function init() {
    root = document.getElementById('loginSheet');
    if (!root) return;

    passwordForm = root.querySelector('[data-login-sheet-view="password"] form');
    otpPhoneForm = root.querySelector('[data-login-sheet-view="otp-phone"] form');
    otpCodeForm = root.querySelector('[data-login-sheet-view="otp-code"] form');
    errorEl = root.querySelector('[data-login-sheet-error]');
    messageEl = root.querySelector('[data-login-sheet-message]');
    otpUrl = root.dataset.otpUrl;
    otpSubmitUrl = root.dataset.otpSubmitUrl;

    try {
      loginPath = normalizePath(new URL(root.dataset.loginUrl, location.origin).pathname);
    } catch (e) { /* keep default */ }
    protectedPaths = (root.dataset.protectedPaths || '')
      .split(',')
      .filter(Boolean)
      .map(normalizePath);

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('submit', onPasswordSubmit, true);
    document.addEventListener('submit', onOtpPhoneSubmit, true);
    document.addEventListener('submit', onOtpCodeSubmit, true);

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-login-sheet-close]')) close();
      if (e.target.closest('[data-login-sheet-show-otp]')) {
        e.preventDefault();
        showOtpPhoneView();
      }
      if (e.target.closest('[data-login-sheet-show-password]')) {
        e.preventDefault();
        showPasswordView();
      }
      if (e.target.closest('[data-login-sheet-change-phone]')) {
        e.preventDefault();
        showOtpPhoneView();
      }
      if (e.target.closest('[data-login-sheet-resend-otp]')) {
        e.preventDefault();
        onResendOtp();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !root.hidden) close();
    });

    root.querySelector('[data-login-sheet-toggle-password]').addEventListener('click', function () {
      var input = passwordForm.elements.Password;
      var icon = this.querySelector('i');
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      icon.classList.toggle('ti-eye', show);
      icon.classList.toggle('ti-eye-off', !show);
    });

    bindOtpInputNavigation();
  }

  window.MrsLoginSheet = { open: open, close: close };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
