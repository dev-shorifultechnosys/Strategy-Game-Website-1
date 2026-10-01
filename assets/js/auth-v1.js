
(() => {
  'use strict';
  if (!['login','signup'].includes(document.body.dataset.page)) return;

  document.querySelectorAll('[data-password-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.passwordToggle;
      const input = document.getElementById(id);
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      button.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      button.classList.toggle('active', !showing);
    });
  });

  const signupPassword = document.getElementById('signupPassword');
  const strength = document.querySelector('[data-password-strength]');
  if (signupPassword && strength) {
    const text = strength.querySelector('.strength-text');
    const updateStrength = () => {
      const value = signupPassword.value;
      const hasNumber = /\d/.test(value);
      const hasUpper = /[A-Z]/.test(value);
      const hasSymbol = /[^A-Za-z0-9]/.test(value);

      let level = '';
      let label = 'Use 8+ characters with a number.';
      if (value.length > 0 && value.length < 8) {
        level = 'weak'; label = 'Too short — use at least 8 characters.';
      } else if (value.length >= 8 && !(hasNumber || hasUpper || hasSymbol)) {
        level = 'medium'; label = 'Good start — add a number or symbol.';
      } else if (value.length >= 8 && (hasNumber || hasUpper) && (hasSymbol || value.length >= 12)) {
        level = 'strong'; label = 'Strong password.';
      } else if (value.length >= 8) {
        level = 'medium'; label = 'Good — one more character type will strengthen it.';
      }
      strength.dataset.level = level;
      if (text) text.textContent = label;
    };
    signupPassword.addEventListener('input', updateStrength);
    updateStrength();
  }

  const forms = document.querySelectorAll('[data-auth-form]');
  forms.forEach(form => {
    const status = form.querySelector('[data-auth-status]');
    const submit = form.querySelector('.auth-submit');

    const setError = (input, message='') => {
      if (!input) return;
      input.classList.toggle('is-invalid', !!message);
      input.classList.toggle('is-valid', !message && input.value.trim().length > 0);
      const target = form.querySelector(`[data-error-for="${input.id || input.name}"]`) ||
                     form.querySelector(`[data-error-for="${input.name}"]`);
      if (target) target.textContent = message;
    };

    form.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        if (input.type !== 'checkbox') setError(input, '');
      });
      input.addEventListener('blur', () => {
        if (input.type === 'checkbox') return;
        if (input.required && !input.value.trim()) setError(input, 'This field is required.');
        else if (input.type === 'email' && input.value && !input.validity.valid) setError(input, 'Enter a valid email address.');
        else if (input.minLength > 0 && input.value.length < input.minLength) setError(input, `Use at least ${input.minLength} characters.`);
        else setError(input, '');
      });
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      let valid = true;
      status.className = 'auth-form-status';
      status.textContent = '';

      const requiredInputs = [...form.querySelectorAll('input[required]')];
      requiredInputs.forEach(input => {
        if (input.type === 'checkbox') {
          const error = form.querySelector('[data-error-for="terms"]');
          if (!input.checked) {
            valid = false;
            if (error) error.textContent = 'Please confirm the account terms.';
          } else if (error) error.textContent = '';
          return;
        }

        let message = '';
        if (!input.value.trim()) message = 'This field is required.';
        else if (input.type === 'email' && !input.validity.valid) message = 'Enter a valid email address.';
        else if (input.minLength > 0 && input.value.length < input.minLength) message = `Use at least ${input.minLength} characters.`;
        setError(input, message);
        if (message) valid = false;
      });

      if (form.dataset.authForm === 'signup') {
        const pw = form.querySelector('#signupPassword');
        const confirm = form.querySelector('#confirmPassword');
        if (pw && confirm && pw.value !== confirm.value) {
          setError(confirm, 'Passwords do not match.');
          valid = false;
        }
      }

      if (!valid) {
        status.className = 'auth-form-status error';
        status.textContent = 'Check the highlighted fields and try again.';
        const firstInvalid = form.querySelector('.is-invalid') || form.querySelector('input:invalid');
        firstInvalid?.focus();
        return;
      }

      submit?.classList.add('is-loading');
      if (submit) submit.disabled = true;
      const original = submit?.querySelector('span')?.textContent || '';
      if (submit?.querySelector('span')) submit.querySelector('span').textContent = 'Working…';

      const data = Object.fromEntries(new FormData(form).entries());
      delete data.confirmPassword;
      delete data.terms;
      delete data.password;
      localStorage.setItem(
        form.dataset.authForm === 'signup' ? 'fortress-demo-account' : 'fortress-demo-login',
        JSON.stringify({...data, savedAt:new Date().toISOString()})
      );

      window.setTimeout(() => {
        submit?.classList.remove('is-loading');
        if (submit) submit.disabled = false;
        if (submit?.querySelector('span')) submit.querySelector('span').textContent = original;
        status.className = 'auth-form-status success';
        status.textContent = form.dataset.authForm === 'signup'
          ? 'Account details validated and saved locally in this prototype.'
          : 'Login details validated for this prototype.';
      }, 420);
    });
  });
})();
