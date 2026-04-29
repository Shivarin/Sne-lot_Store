(function () {
  'use strict';

  function randHex (n) {
    var s = '';
    var chars = 'abcdef0123456789';
    for (var i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function randDigits (n) {
    var s = '';
    for (var i = 0; i < n; i++) s += String(Math.floor(Math.random() * 10));
    return s;
  }

  function randPass () {
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrst23456789!@$%';
    var s = '';
    for (var i = 0; i < 16; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  }

  function genMailbox (prefix) {
    return prefix + '.' + randHex(5) + '@inbox.snaplot.demo';
  }

  function buildCredentials (listingId, title, platform, category, description) {
    var plat = String(platform || '').toLowerCase();
    var t = String(title || '');
    var d = String(description || '');
    var bundle = (t + ' ' + d).toLowerCase();
    var isGift = bundle.indexOf('гифт') >= 0 || bundle.indexOf('gift') >= 0 || bundle.indexOf('ссылк') >= 0;

    if (plat.indexOf('discord') >= 0) {
      if (isGift) {
        return {
          kind: 'gift',
          fields: [
            { key: 'link', label: 'Ссылка активации', value: 'https://discord.com/billing/promotions/demo-' + randHex(12), secret: false },
            { key: 'pin', label: 'PIN (если есть)', value: randDigits(6), secret: true }
          ],
          notes: 'Демо-ссылка. В реальном магазине здесь была бы настоящая гифт-ссылка Discord.'
        };
      }
      return {
        kind: 'account',
        fields: [
          { key: 'login', label: 'Email', value: genMailbox('dc') },
          { key: 'password', label: 'Пароль', value: randPass(), secret: true },
          { key: 'token', label: 'User token (фрагмент)', value: 'mfa.' + randHex(24) + '.demo', secret: true }
        ],
        notes: 'Демо-аккаунт. После входа смените пароль и включите 2FA.'
      };
    }

    if (plat.indexOf('telegram') >= 0) {
      return {
        kind: 'account',
        fields: [
          { key: 'phone', label: 'Номер', value: '+7 ' + randDigits(3) + ' ' + randDigits(3) + '-' + randDigits(2) + '-' + randDigits(2) },
          { key: 'cloud', label: 'Облачный пароль (демо)', value: randPass().slice(0, 12), secret: true },
          { key: 'session', label: 'Session string (фрагмент)', value: '1' + randDigits(9) + ':' + randHex(16) + ':demo', secret: true }
        ],
        notes: 'Демо-данные для визуала выдачи. Реальная передача — по регламенту магазина.'
      };
    }

    if (plat.indexOf('steam') >= 0) {
      return {
        kind: 'account',
        fields: [
          { key: 'login', label: 'Логин Steam', value: 'snaplot_demo_' + randHex(6) },
          { key: 'password', label: 'Пароль', value: randPass(), secret: true },
          { key: 'email', label: 'Привязанная почта', value: genMailbox('steam') }
        ],
        notes: 'Смена почты доступна через 24 ч по правилам Steam (демо-текст).'
      };
    }

    if (plat.indexOf('spotify') >= 0 || bundle.indexOf('подписк') >= 0 || String(category || '').toLowerCase().indexOf('подписк') >= 0) {
      return {
        kind: 'subscription',
        fields: [
          { key: 'email', label: 'Аккаунт / email слота', value: genMailbox('sub') },
          { key: 'invite', label: 'Инвайт / код', value: 'SNP-' + randHex(8).toUpperCase(), secret: true }
        ],
        notes: 'Демо: данные для активации подписки в личном кабинете сервиса.'
      };
    }

    return {
      kind: 'generic',
      fields: [
        { key: 'login', label: 'Логин', value: 'snaplot_' + String(listingId || 'lot').replace(/[^a-z0-9]/gi, '').slice(0, 12) + '_' + randHex(4) },
        { key: 'password', label: 'Пароль / ключ', value: randPass(), secret: true },
        { key: 'extra', label: 'Доп. инструкция', value: 'Откройте товар в течение 24 ч и смените пароль.', secret: false }
      ],
      notes: 'Универсальная демо-выдача для цифрового товара.'
    };
  }

  function attachToOrder (order, meta) {
    if (!order || order.delivery) return order;
    var m = meta || {};
    var cred = buildCredentials(
      m.listing_id || order.listing_id,
      m.listing_title || order.listing_title,
      m.platform,
      m.category,
      m.description
    );
    order.delivery = {
      version: 1,
      credentials: cred,
      created_at: new Date().toISOString()
    };
    return order;
  }

  function ensureOnOrder (order) {
    if (!order || order.delivery) return order;
    var lid = order.listing_id;
    var L = window.LISTINGS && window.LISTINGS[lid];
    attachToOrder(order, {
      listing_id: lid,
      listing_title: order.listing_title,
      platform: L ? L.platform : null,
      category: L ? L.cat : null,
      description: L ? L.desc : null
    });
    return order;
  }

  window.OrderDelivery = {
    attachToOrder: attachToOrder,
    buildCredentials: buildCredentials,
    ensureOnOrder: ensureOnOrder
  };
})();
