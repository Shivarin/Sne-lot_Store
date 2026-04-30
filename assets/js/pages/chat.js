(function () {
  "use strict";
  var lotParam = "";
  try {
    var _q = new URLSearchParams(location.search);
    lotParam = String(_q.get("lot") || "").trim();
  } catch (e) {}
  window.__snaplotChatLotId = lotParam;

  function applyLotThread() {
    var lid = lotParam;
    if (!lid || !window.LISTINGS) return;
    var L = LISTINGS[lid];
    if (!L) return;
    window.__snaplotChatListing = L;
    var lotId = L.lotId || "";
    var title = L.title || lid;
    var price = L.price || "";
    document.title = title + " — Снэплот";
    var link = document.getElementById("chatLotLink");
    if (link) {
      link.href = "lot.html?id=" + encodeURIComponent(lid);
      link.textContent = (lotId ? lotId + " · " : "") + title;
    }
    var bt = document.getElementById("chatDealBadgeText");
    if (bt) bt.textContent = "Сделка " + lotId + " — эскроу · официальный магазин";
    var ttl = document.getElementById("chatDealTitle");
    if (ttl) ttl.textContent = title;
    var pr = document.getElementById("chatDealPrice");
    if (pr) pr.textContent = price;
    var pv = document.querySelector(".chat-dialog.is-active .chat-dialog__preview");
    if (pv) {
      var shortT = title.length > 40 ? title.slice(0, 40) + "…" : title;
      pv.textContent = "Поддержка · " + shortT;
    }
    function escq(t) {
      return String(t == null ? "" : t)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
    var attrs = L.attrs || {};
    var auto =
      String(attrs["выдача"] || "").toUpperCase() === "AUTO" ||
      /авторег/i.test(L.cat || "");
    var msgs = document.getElementById("chatMessages");
    if (!msgs) return;
    if (auto) {
      msgs.innerHTML =
        '<div class="chat-msg chat-msg--sys">Заказ ' +
        escq(lotId) +
        " создан. Оплата удержана эскроу до подтверждения получения.</div>" +
        '<div class="chat-msg chat-msg--in"><div class="chat-msg__bubble">Здравствуйте! Это поддержка официального магазина Снэплот. По вашему заказу сработала <strong>автовыдача</strong>: данные для входа — в карточке заказа и ниже.</div><span class="chat-msg__time">13:40</span></div>' +
        '<div class="chat-msg chat-msg--out"><div class="chat-msg__bubble">Ок, принял.</div><span class="chat-msg__time">13:41</span></div>' +
        '<div class="chat-msg chat-msg--in"><div class="chat-msg__bubble">Демо: логин <span style="color:var(--col-primary)">snaplot.buyer.demo@outlook.com</span>, пароль и токен дублируются в «Мои сделки». Смените пароль сразу после входа.</div><span class="chat-msg__time">13:42</span></div>' +
        '<div class="chat-msg chat-msg--in"><div class="chat-msg__bubble">Замена или блокировка — только через эту переписку; отвечаем по очереди в рабочие часы.</div><span class="chat-msg__time">13:42</span></div>';
    } else {
      msgs.innerHTML =
        '<div class="chat-msg chat-msg--sys">Заказ ' +
        escq(lotId) +
        " создан. Оплата удержана эскроу до подтверждения получения.</div>" +
        '<div class="chat-msg chat-msg--in"><div class="chat-msg__bubble">Здравствуйте! Поддержка Снэплота на связи. Вопросы по заказу <strong>' +
        escq(title) +
        "</strong> — пишите сюда.</div><span class=\"chat-msg__time\">13:40</span></div>" +
        '<div class="chat-msg chat-msg--out"><div class="chat-msg__bubble">Спасибо!</div><span class="chat-msg__time">13:41</span></div>' +
        '<div class="chat-msg chat-msg--in"><div class="chat-msg__bubble">Детали выдачи смотрите в «Мои сделки». После получения нажмите «Подтвердить получение».</div><span class="chat-msg__time">13:42</span></div>';
    }
    window.__snaplotChatReplyPool = [
      "Готово, спасибо!",
      "Нужна помощь с входом",
      "Можно перевыдачу?",
      "Отлично, всё работает",
      "Уточните по заказу",
      "Жду ответа поддержки",
    ];
  }
  applyLotThread();

  var input = document.getElementById("chatInput");
  var sendBtn = document.getElementById("chatSend");
  var msgsEl = document.getElementById("chatMessages");
  var attachBtn = document.querySelector(".chat-input-bar__attach");
  function esc(s) {
    return String(s == null ? "")
      .replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
  }
  function hhmm() {
    var d = new Date();
    return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  document.querySelectorAll(".chat-dialog").forEach(function (item) {
    item.addEventListener("click", function () {
      document.querySelectorAll(".chat-dialog").forEach(function (i) {
        i.classList.remove("is-active");
        i.setAttribute("aria-selected", "false");
      });
      item.classList.add("is-active");
      item.setAttribute("aria-selected", "true");
      var u = item.querySelector(".chat-dialog__unread");
      if (u) u.remove();
    });
  });
  (function injectQuickReplies() {
    if (!msgsEl || document.querySelector(".chat-quick")) return;
    var replies = [
      "Спасибо!",
      "Нужна помощь с заказом",
      "Когда будет готово?",
      "Всё получил",
      "Проблема с доступом",
      "Как подтвердить получение?",
    ];
    var bar = document.createElement("div");
    bar.className = "chat-quick";
    bar.innerHTML = replies
      .map(function (r) {
        return '<button type="button" class="chat-quick__b">' + esc(r) + "</button>";
      })
      .join("");
    var inputBar = document.querySelector(".chat-input-bar");
    if (inputBar && inputBar.parentNode) inputBar.parentNode.insertBefore(bar, inputBar);
    bar.querySelectorAll(".chat-quick__b").forEach(function (b) {
      b.addEventListener("click", function () {
        if (input) {
          input.value = b.textContent;
          input.focus();
        }
      });
    });
  })();
  function showTyping() {
    if (!msgsEl || document.getElementById("chatTyping")) return;
    var t = document.createElement("div");
    t.id = "chatTyping";
    t.className = "chat-msg chat-msg--in chat-typing";
    t.innerHTML =
      '<div class="chat-msg__bubble chat-typing__bubble"><span></span><span></span><span></span></div>';
    msgsEl.appendChild(t);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function hideTyping() {
    var t = document.getElementById("chatTyping");
    if (t) t.remove();
  }
  function finalizeReceipt(tickEl) {
    if (!tickEl) return;
    setTimeout(function () {
      tickEl.classList.add("is-delivered");
      tickEl.textContent = "✓✓";
    }, 700);
    setTimeout(function () {
      tickEl.classList.add("is-read");
    }, 1800);
  }
  function appendOut(text, kind) {
    if (!msgsEl) return null;
    var msg = document.createElement("div");
    msg.className = "chat-msg chat-msg--out";
    var body =
      kind === "file"
        ? '<div class="chat-msg__bubble chat-msg__bubble--file"><span class="chat-file__ic">📎</span><span class="chat-file__name">' +
          esc(text) +
          "</span></div>"
        : '<div class="chat-msg__bubble">' + esc(text).replace(/\n/g, "<br>") + "</div>";
    msg.innerHTML =
      body + '<span class="chat-msg__time">' + hhmm() + ' <span class="chat-msg__tick">✓</span></span>';
    msgsEl.appendChild(msg);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    finalizeReceipt(msg.querySelector(".chat-msg__tick"));
    return msg;
  }
  function appendIn(text) {
    if (!msgsEl) return;
    var msg = document.createElement("div");
    msg.className = "chat-msg chat-msg--in";
    msg.innerHTML =
      '<div class="chat-msg__bubble">' +
      esc(text).replace(/\n/g, "<br>") +
      '</div><span class="chat-msg__time">' +
      hhmm() +
      "</span>";
    msgsEl.appendChild(msg);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function send() {
    if (!input) return;
    var v = input.value.trim();
    if (!v) return;
    appendOut(v);
    input.value = "";
    input.style.height = "auto";
    setTimeout(showTyping, 600);
    setTimeout(function () {
      hideTyping();
      var pool = window.__snaplotChatReplyPool || [
        "Принято, проверим заказ.",
        "Уже смотрим в поддержке.",
        "Готово — загляните в «Мои сделки».",
        "Спасибо за покупку!",
        "Сейчас ответим.",
        "Если что — напишите.",
      ];
      appendIn(pool[Math.floor(Math.random() * pool.length)]);
    }, 1600 + Math.random() * 900);
  }
  if (sendBtn) sendBtn.addEventListener("click", send);
  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
    input.addEventListener("input", function () {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });
  }
  if (attachBtn)
    attachBtn.addEventListener("click", function () {
      if (window.UI) UI.toast("Прикрепление файлов в демо-режиме недоступно", { kind: "info" });
      appendOut("screenshot-activation.png", "file");
    });
  if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
})();
