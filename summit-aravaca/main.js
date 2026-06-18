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
    nombre: 'Por favor, introduzca su nombre',
    apellidos: 'Por favor, introduzca sus apellidos',
    telefono: 'Introduzca un teléfono válido (7-15 dígitos)',
    email: 'Introduzca un email válido'
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
      errMsg.textContent = 'Ha ocurrido un error. Por favor, inténtelo de nuevo o llámenos directamente.';
      form.parentElement.insertBefore(errMsg, form.nextSibling);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Solicitar información';
    });
  });
})();
