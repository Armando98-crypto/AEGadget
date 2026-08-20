// AEGADGET — interações de protótipo (visual apenas, sem backend real)

document.addEventListener('DOMContentLoaded', () => {

  // ---- menu mobile ----
  const burger = document.querySelector('.burger');
  const navlinks = document.querySelector('.navlinks');
  if (burger && navlinks) {
    burger.addEventListener('click', () => {
      const open = navlinks.classList.toggle('open-mobile');
      navlinks.style.cssText = open
        ? 'display:flex;flex-direction:column;position:absolute;top:100%;left:0;right:0;background:#fff;padding:20px 32px;border-bottom:1px solid #F0DECF;gap:16px;'
        : '';
    });
  }

  // ---- contador do carrinho (demo) ----
  const cartCount = document.querySelector('.cart-count');
  document.querySelectorAll('[data-add-cart]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!cartCount) return;
      cartCount.textContent = String(Number(cartCount.textContent || 0) + 1);
      btn.textContent = btn.dataset.addedLabel || 'Adicionado ✓';
      btn.classList.add('added');
      setTimeout(() => {
        btn.textContent = btn.dataset.defaultLabel || 'Adicionar ao carrinho';
        btn.classList.remove('added');
      }, 1400);
    });
  });

  // ---- separador de imagens do produto ----
  document.querySelectorAll('.thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const main = document.querySelector('.gallery-main img');
      const group = thumb.closest('.thumbs');
      if (!main || !group) return;
      group.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      main.src = thumb.dataset.full || thumb.querySelector('img')?.src;
    });
  });

  // ---- separadores (descrição / especificações / avaliações) ----
  document.querySelectorAll('.tabbar').forEach(bar => {
    const buttons = bar.querySelectorAll('[data-tab]');
    buttons.forEach(b => {
      b.addEventListener('click', () => {
        const panelGroup = document.querySelector(bar.dataset.panels);
        buttons.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        panelGroup.querySelectorAll('[data-panel]').forEach(p => {
          p.style.display = p.dataset.panel === b.dataset.tab ? 'block' : 'none';
        });
      });
    });
  });

  // ---- seletor de quantidade ----
  document.querySelectorAll('.qty').forEach(box => {
    const input = box.querySelector('input');
    box.querySelector('[data-qty-minus]')?.addEventListener('click', () => {
      input.value = Math.max(1, Number(input.value) - 1);
    });
    box.querySelector('[data-qty-plus]')?.addEventListener('click', () => {
      input.value = Number(input.value) + 1;
    });
  });

  // ---- gaveta de filtros (mobile) ----
  const filterToggle = document.querySelector('[data-filter-toggle]');
  const filterPanel = document.querySelector('[data-filter-panel]');
  if (filterToggle && filterPanel) {
    filterToggle.addEventListener('click', () => {
      filterPanel.classList.toggle('open');
    });
  }

  // ---- estrelas de avaliação no formulário ----
  document.querySelectorAll('.star-input').forEach(group => {
    const stars = group.querySelectorAll('span');
    stars.forEach((s, i) => {
      s.addEventListener('click', () => {
        stars.forEach((x, j) => x.classList.toggle('filled', j <= i));
        group.dataset.value = i + 1;
      });
    });
  });

  // ---- validação simples de formulários com feedback em português ----
  document.querySelectorAll('form[data-validate]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach(field => {
        const errorEl = field.closest('.field')?.querySelector('.field-error');
        if (!field.value.trim()) {
          valid = false;
          field.style.borderColor = '#C7390B';
          if (errorEl) errorEl.style.display = 'block';
        } else {
          field.style.borderColor = '';
          if (errorEl) errorEl.style.display = 'none';
        }
      });
      if (valid) {
        const successEl = form.querySelector('.form-success');
        if (successEl) successEl.style.display = 'block';
        else alert('Protótipo: formulário válido. Ligar à API na fase seguinte.');
      }
    });
  });

});
