(function () {
  'use strict';

  if (!window.UI) return;

  var params = new URLSearchParams(location.search);
  var ref = params.get('order') || params.get('id');

  function readOrdersRaw () {
    try {
      var raw = localStorage.getItem('snaplot:demo-orders');
      var a = raw ? JSON.parse(raw) : [];
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function persistOrder (order) {
    try {
      var arr = readOrdersRaw();
      var ix = arr.findIndex(function (o) {
        return o.public_id === order.public_id || String(o.id) === String(order.id);
      });
      if (ix >= 0) {
        arr[ix] = order;
        localStorage.setItem('snaplot:demo-orders', JSON.stringify(arr));
      }
    } catch (e) {}
  }

  function findOrder (r) {
    if (!r) return null;
    var list = readOrdersRaw();
    var o = list.find(function (x) {
      return x.public_id === r || String(x.id) === String(r);
    });
    return o || null;
  }

  function esc (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function rubFromOrder (o) {
    if (o.price_rub != null) return Number(o.price_rub);
    return Math.round(Number(o.price_cents || 0) / 100);
  }

  function statusUi (st) {
    var s = String(st || '').toLowerCase();
    if (s === 'completed' || s === 'done') {
      return { l: 'Завершена — товар выдан', k: 'done' };
    }
    if (s === 'pending' || s === 'paid') {
      return { l: 'Ожидает оплаты / обработки', k: 'pending' };
    }
    if (s === 'active' || s === 'delivered') {
      return { l: 'Активна — проверьте выдачу', k: 'active' };
    }
    if (s === 'disputed' || s === 'dispute') {
      return { l: 'Спор', k: 'dispute' };
    }
    if (s === 'cancelled' || s === 'cancel') {
      return { l: 'Отменена', k: 'cancel' };
    }
    return { l: 'В работе', k: 'active' };
  }

  function showMissing () {
    var main = document.querySelector('.page-shell__head h1');
    if (main) main.textContent = 'Сделка не найдена';
    var sub = document.getElementById('orderStatusText');
    if (sub) sub.textContent = 'Проверьте ссылку или откройте заказ из раздела «Мои заказы».';
    var tl = document.getElementById('orderTimeline');
    if (tl) tl.innerHTML = '';
    var act = document.getElementById('orderActions');
    if (act) {
      act.innerHTML = '<a class="btn btn-primary" href="orders.html">Мои заказы</a>';
    }
    var help = document.getElementById('orderHelp');
    if (help) help.textContent = '';
  }

  function runDeliveryAnimation (mount, cred, onDone) {
    var seenKey = 'snaplot:delivery-anim:' + (cred._pub || '');
    try {
      if (sessionStorage.getItem(seenKey) === '1') {
        onDone();
        return;
      }
    } catch (e) {}

    var steps = [
      'Соединение с шлюзом выдачи…',
      'Проверка эскроу и оплаты…',
      'Валидация цифрового товара…',
      'Проверка учётной записи на доступность…',
      'Подготовка данных для входа…'
    ];

    mount.hidden = false;
    mount.innerHTML =
      '<div class="delivery-shell__title">Цифровая выдача</div>' +
      '<div class="delivery-done-badge" id="deliveryBadge" hidden>Готово — проверка пройдена</div>' +
      '<div class="delivery-validate" id="deliveryValidate"></div>' +
      '<div class="delivery-reveal" id="deliveryReveal" hidden></div>';

    var valEl = mount.querySelector('#deliveryValidate');
    valEl.innerHTML = steps.map(function (t, i) {
      return '<div class="delivery-validate__row" data-step="' + i + '">' +
        '<span class="delivery-validate__ic"></span>' +
        '<span>' + esc(t) + '</span></div>';
    }).join('');

    var rows = valEl.querySelectorAll('.delivery-validate__row');
    var i = 0;

    function step () {
      if (i > 0) {
        var prev = rows[i - 1];
        prev.classList.remove('is-active');
        prev.classList.add('is-done');
        prev.querySelector('.delivery-validate__ic').textContent = '✓';
      }
      if (i >= rows.length) {
        valEl.hidden = true;
        var badge = mount.querySelector('#deliveryBadge');
        if (badge) badge.hidden = false;
        try { sessionStorage.setItem(seenKey, '1'); } catch (e2) {}
        onDone();
        return;
      }
      rows[i].classList.add('is-active');
      i++;
      setTimeout(step, i === rows.length ? 400 : 620);
    }

    step();
  }

  function renderCredentials (revealEl, cred, order) {
    var fields = (cred && cred.fields) || [];
    var notes = (cred && cred.notes) || '';
    var html = '<div class="delivery-reveal__note">' + esc(notes) + '</div>';
    fields.forEach(function (f, idx) {
      var id = 'df-' + idx;
      var secret = f.secret ? ' is-secret' : '';
      html +=
        '<div class="delivery-field">' +
        '<div class="delivery-field__label">' + esc(f.label) + '</div>' +
        '<div class="delivery-field__row">' +
        '<div class="delivery-field__val' + secret + '" id="' + id + '">' + esc(f.value) + '</div>' +
        '<button type="button" class="delivery-field__btn" data-copy="' + id + '">Копировать</button>' +
        '</div>';
      if (f.secret) {
        html += '<button type="button" class="delivery-toggle-secret" data-target="' + id + '">Показать / скрыть</button>';
      }
      html += '</div>';
    });
    html +=
      '<p style="font-size:.8rem;color:var(--c-muted);margin-top:12px;">Сделка ' + esc(order.public_id) +
      ' · сохраните данные в надёжном месте (демо-режим, только в этом браузере).</p>';
    revealEl.innerHTML = html;

    revealEl.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id2 = btn.getAttribute('data-copy');
        var el = document.getElementById(id2);
        var t = el ? el.textContent : '';
        if (navigator.clipboard && t) {
          navigator.clipboard.writeText(t).then(function () {
            UI.toast('Скопировано', { kind: 'success' });
          }).catch(function () {});
        }
      });
    });

    revealEl.querySelectorAll('.delivery-toggle-secret').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id3 = btn.getAttribute('data-target');
        var el = document.getElementById(id3);
        if (el) el.classList.toggle('is-revealed');
      });
    });
  }

  var order = findOrder(ref);

  if (!order) {
    showMissing();
    return;
  }

  if (window.OrderDelivery && OrderDelivery.ensureOnOrder) {
    var before = !!order.delivery;
    OrderDelivery.ensureOnOrder(order);
    if (!before && order.delivery) persistOrder(order);
  }

  var st = statusUi(order.status);
  document.getElementById('orderIdLabel').textContent = 'Сделка ' + order.public_id;
  document.getElementById('orderIdBig').textContent = order.public_id;
  document.getElementById('orderStatusText').textContent = st.l;
  var badge = document.getElementById('orderStatusBadge');
  badge.textContent = st.l;
  badge.className = 'status-badge status-badge--' + st.k;

  var lotName = order.listing_title || ('Лот ' + order.listing_id);
  document.getElementById('orderLotName').textContent = lotName;
  document.getElementById('orderImg').textContent = (lotName || 'L')[0].toUpperCase();
  document.getElementById('orderSeller').textContent = 'Снэплот';
  document.getElementById('orderSeller').href = 'market.html';

  var L = window.LISTINGS && window.LISTINGS[order.listing_id];
  document.getElementById('orderCategory').textContent = L ? L.cat : '—';

  var chatBtn = document.getElementById('chatSellerBtn');
  if (chatBtn) chatBtn.href = 'chat.html?lot=' + encodeURIComponent(order.listing_id);

  var rub = rubFromOrder(order);
  var fee = Math.round(rub * 0.05);
  document.getElementById('sumPrice').textContent = rub.toLocaleString('ru-RU') + ' ₽';
  document.getElementById('sumFee').textContent = fee.toLocaleString('ru-RU') + ' ₽';
  document.getElementById('sumPromo').textContent = '—';
  document.getElementById('sumTotal').textContent = (rub + fee).toLocaleString('ru-RU') + ' ₽';

  var created = order.created_at ? new Date(order.created_at).getTime() : Date.now();
  var steps = [
    { k: 'created', t: 'Создана сделка', d: 'Заказ зарегистрирован в системе.', at: created },
    { k: 'escrow', t: 'Оплата', d: 'Средства обработаны (демо).', at: created + 30000 },
    { k: 'handover', t: 'Выдача от магазина', d: 'Данные для доступа сформированы ниже.', at: created + 120000 },
    { k: 'review', t: 'Проверка', d: 'Автоматическая проверка валидности (демо).', at: created + 180000 },
    { k: 'close', t: 'Готово', d: 'Можно использовать полученные данные.', at: created + 240000 }
  ];

  var rawSt = String(order.status || '').toLowerCase();
  var currentIdx = rawSt === 'completed' || rawSt === 'done' ? 4 : rawSt === 'active' ? 3 : rawSt === 'pending' ? 1 : 2;

  var tl = document.getElementById('orderTimeline');
  tl.innerHTML = steps.map(function (s, i) {
    var klass = i < currentIdx ? 'is-done' : i === currentIdx ? 'is-active' : 'is-pending';
    var when = s.at ? new Date(s.at).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
    return '<li class="order-timeline__step ' + klass + '">' +
      '<div class="order-timeline__dot"></div>' +
      '<div class="order-timeline__title">' + esc(s.t) + '</div>' +
      '<div class="order-timeline__time">' + esc(when) + '</div>' +
      '<div class="order-timeline__desc">' + esc(s.d) + '</div></li>';
  }).join('');

  var actions = document.getElementById('orderActions');
  var help = document.getElementById('orderHelp');

  if (rawSt === 'completed' || rawSt === 'done') {
    actions.innerHTML =
      '<a class="btn btn-primary btn-sm" href="lot.html?id=' + encodeURIComponent(order.listing_id) + '">К странице лота</a>' +
      '<a class="btn btn-ghost btn-sm" href="orders.html">Все сделки</a>';
    help.textContent = 'Сделка завершена. Данные для входа — в блоке выдачи ниже. При проблемах откройте спор или напишите в поддержку.';

    var mount = document.getElementById('orderDeliveryMount');
    if (mount && order.delivery && order.delivery.credentials) {
      order.delivery.credentials._pub = order.public_id;
      runDeliveryAnimation(mount, order.delivery.credentials, function () {
        var reveal = mount.querySelector('#deliveryReveal');
        if (reveal) {
          reveal.hidden = false;
          renderCredentials(reveal, order.delivery.credentials, order);
        }
      });
    } else if (mount) {
      mount.hidden = true;
    }
  } else {
    actions.innerHTML =
      '<a class="btn btn-primary" href="checkout.html?id=' + encodeURIComponent(order.listing_id) + '">Перейти к оплате</a>' +
      '<a class="btn btn-ghost" href="orders.html">Назад к заказам</a>';
    help.textContent = 'После оплаты здесь появится выдача с данными для входа и проверкой.';
    document.getElementById('orderDeliveryMount').hidden = true;
  }
})();
