(function () {
  'use strict';

  // 1. UTM capture
  var params = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (key) {
    var val = params.get(key);
    if (val) sessionStorage.setItem(key, val);
  });

  // 2. Navbar reveal
  var navbar = document.getElementById('navbar');
  var hero = document.getElementById('hero');

  if (hero && navbar) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        navbar.classList.toggle('navbar--visible', !entry.isIntersecting);
      });
    }, { threshold: 0.2 });
    navObserver.observe(hero);
  }

  // 3. Scroll animations
  var animElements = document.querySelectorAll('.section-animate');
  if (animElements.length) {
    var animObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          animObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    animElements.forEach(function (el) { animObserver.observe(el); });
  }

  // 4. Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // 5. Form handling
  var form = document.getElementById('contact-form');
  var submitBtn = document.getElementById('form-submit');
  var successEl = document.getElementById('form-success');
  if (!form || !submitBtn || !successEl) return;

  var validationMessages = {
    nombre: 'Por favor, introduce tu nombre',
    apellidos: 'Por favor, introduce tus apellidos',
    telefono: 'Introduce un teléfono válido (7-15 dígitos)',
    email: 'Introduce un email válido'
  };

  function validateField(input) {
    var errorEl = input.parentElement.querySelector('.form__error');
    if (!input.validity.valid) {
      input.classList.add('error');
      if (errorEl) errorEl.textContent = validationMessages[input.name] || 'Campo obligatorio';
      return false;
    }
    input.classList.remove('error');
    if (errorEl) errorEl.textContent = '';
    return true;
  }

  form.querySelectorAll('input:not([type="hidden"])').forEach(function (input) {
    input.addEventListener('blur', function () { validateField(this); });
    input.addEventListener('input', function () {
      if (this.classList.contains('error')) validateField(this);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var inputs = form.querySelectorAll('input:not([type="hidden"])');
    var valid = true;
    inputs.forEach(function (input) {
      if (!validateField(input)) valid = false;
    });
    if (!valid) return;

    // Inject UTM hidden fields
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (key) {
      var val = sessionStorage.getItem(key);
      if (val) {
        var existing = form.querySelector('input[name="' + key + '"]');
        if (existing) {
          existing.value = val;
        } else {
          var input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = val;
          form.appendChild(input);
        }
      }
    });

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    // Remove previous network error
    var prevError = form.parentElement.querySelector('.form__network-error');
    if (prevError) prevError.remove();

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
      if (response.ok) {
        form.hidden = true;
        successEl.hidden = false;
      } else {
        throw new Error('Server error');
      }
    })
    .catch(function () {
      var errMsg = document.createElement('p');
      errMsg.className = 'form__network-error';
      errMsg.textContent = 'Ha ocurrido un error. Por favor, inténtalo de nuevo o llámanos directamente.';
      form.parentElement.insertBefore(errMsg, form.nextSibling);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar';
    });
  });

  // 6. Floating form & mobile modal
  function setupExtraForm(formEl, submitBtnEl, successEl) {
    if (!formEl || !submitBtnEl || !successEl) return;
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var inputs = formEl.querySelectorAll('input:not([type="hidden"])');
      var valid = true;
      inputs.forEach(function (input) {
        var errorEl = input.parentElement.querySelector('.form__error');
        if (!input.validity.valid) {
          input.classList.add('error');
          if (errorEl) errorEl.textContent = 'Campo obligatorio';
          valid = false;
        } else {
          input.classList.remove('error');
          if (errorEl) errorEl.textContent = '';
        }
      });
      if (!valid) return;
      submitBtnEl.disabled = true;
      submitBtnEl.textContent = 'Enviando...';
      fetch(formEl.action, {
        method: 'POST',
        body: new FormData(formEl),
        headers: { 'Accept': 'application/json' }
      }).then(function (r) {
        if (r.ok) { formEl.hidden = true; successEl.hidden = false; }
        else throw new Error();
      }).catch(function () {
        submitBtnEl.disabled = false;
        submitBtnEl.textContent = 'Enviar';
      });
    });
  }

  setupExtraForm(
    document.getElementById('floating-contact-form'),
    document.getElementById('floating-submit'),
    document.getElementById('floating-success')
  );

  // Floating form close button
  var floatingClose = document.getElementById('floating-close');
  var floatingForm = document.getElementById('floating-form');
  if (floatingClose && floatingForm) {
    floatingClose.addEventListener('click', function () {
      floatingForm.style.display = 'none';
    });
  }

  // Mini tab when scrolled past hero
  var heroSection = document.getElementById('hero');
  var floatingTab = document.getElementById('floating-tab');

  // Mini tab when scrolled past hero — use IntersectionObserver (same as navbar)
  if (heroSection && floatingForm) {
    var floatingObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          floatingForm.classList.add('floating-form--mini');
        } else {
          floatingForm.classList.remove('floating-form--mini');
          floatingForm.classList.remove('floating-form--expanded');
        }
      });
    }, { threshold: 0 });
    floatingObserver.observe(heroSection);
  }

  // Tab click expands form temporarily
  if (floatingTab && floatingForm) {
    floatingTab.addEventListener('click', function () {
      floatingForm.classList.add('floating-form--expanded');
      floatingForm.classList.remove('floating-form--mini');
    });
  }

  // Mobile modal
  var mobileCta = document.getElementById('mobile-cta');
  var modalOverlay = document.getElementById('modal-overlay');
  var modalClose = document.getElementById('modal-close');

  if (mobileCta && modalOverlay) {
    mobileCta.addEventListener('click', function () {
      modalOverlay.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  }
  function closeModal() {
    if (modalOverlay) { modalOverlay.hidden = true; document.body.style.overflow = ''; }
  }
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }

  setupExtraForm(
    document.getElementById('modal-contact-form'),
    document.getElementById('modal-submit'),
    document.getElementById('modal-success')
  );

})();
