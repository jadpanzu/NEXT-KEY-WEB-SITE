/* NEXT KEY — interactions (aucune dépendance) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n) { return new Intl.NumberFormat('fr-TN').format(n).replace(/ /g, ' '); };

  /* ---------- Toast ---------- */
  var toastEl;
  function toast(text, icon) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.innerHTML = '<div><span class="ms s18"></span><span></span></div>';
      document.body.appendChild(toastEl);
    }
    toastEl.querySelector('.ms').textContent = icon || 'check_circle';
    toastEl.querySelectorAll('span')[1].textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
  }

  /* ---------- Tiroir mobile ---------- */
  var drawer = $('#drawer');
  if (drawer) {
    $$('[data-drawer]').forEach(function (b) {
      b.addEventListener('click', function () { drawer.classList.toggle('open'); });
    });
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer || e.target.closest('a')) drawer.classList.remove('open');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') drawer.classList.remove('open'); });
  }

  /* ---------- Favoris ---------- */
  $$('.fav').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var icon = btn.querySelector('.ms');
      var on = !btn.classList.contains('on');
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on);
      icon.textContent = on ? 'favorite' : 'favorite_border';
      icon.classList.toggle('fill', on);
      toast(on ? 'Ajouté à vos favoris NEXT KEY' : 'Retiré des favoris', on ? 'favorite' : 'bookmark_remove');
    });
  });

  /* ---------- Segments (onglets) ---------- */
  $$('.seg').forEach(function (seg) {
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      $$('button', seg).forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
      seg.dispatchEvent(new CustomEvent('segchange', { detail: b.dataset.v }));
    });
  });

  /* ---------- Accueil : recherche ---------- */
  var searchBtn = $('#search-go');
  if (searchBtn) {
    var budget = $('#budget'), budgetVal = $('#budget-value');
    budget.addEventListener('input', function () { budgetVal.textContent = fmt(budget.value) + ' TND'; });
    searchBtn.addEventListener('click', function () {
      var on = $('#search-tabs .on');
      var p = new URLSearchParams({
        op: on ? on.dataset.v : 'vente',
        type: $('#filter-type').value,
        loc: $('#filter-loc').value,
        max: budget.value
      });
      location.href = 'biens.html?' + p.toString();
    });
  }

  /* ---------- Newsletter (footer) ---------- */
  var nf = $('#news-form');
  if (nf) {
    nf.addEventListener('submit', function (e) {
      e.preventDefault();
      $('.news-row', nf).classList.add('hidden');
      $('#news-note').classList.add('hidden');
      $('#news-ok').classList.remove('hidden');
    });
  }

  /* ---------- Formulaire de contact (accueil) ---------- */
  var cform = $('#contact-form');
  if (cform) {
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('#contact-submit');
      btn.disabled = true;
      btn.style.opacity = '.7';
      btn.innerHTML = '<span class="ms s18 spin">autorenew</span> Transmission…';
      setTimeout(function () {
        btn.classList.add('hidden');
        $('#contact-feedback').classList.remove('hidden');
      }, 700);
    });
  }

  /* ---------- Nos biens : filtres ---------- */
  var grid = $('#prop-grid');
  if (grid) {
    var cards = $$('.prop', grid);
    var state = { op: 'all', loc: 'all', type: 'all', sort: 'recent', max: null };
    var q = new URLSearchParams(location.search);
    var selLoc = $('#filter-location'), selType = $('#filter-type'), selSort = $('#filter-sort');
    var tabs = $('#operationTabs');

    function setSelect(sel, val) {
      if (val && $$('option', sel).some(function (o) { return o.value === val; })) sel.value = val;
    }
    if (q.get('op') === 'vente' || q.get('op') === 'location') {
      state.op = q.get('op');
      $$('button', tabs).forEach(function (b) {
        var on = b.dataset.v === state.op;
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      });
    }
    setSelect(selLoc, q.get('loc') === 'tous' ? 'all' : q.get('loc'));
    setSelect(selType, q.get('type'));
    if (q.get('max') && !isNaN(+q.get('max'))) state.max = +q.get('max');

    function apply() {
      state.loc = selLoc.value; state.type = selType.value; state.sort = selSort.value;
      var shown = cards.filter(function (c) {
        var d = c.dataset;
        var ok = (state.op === 'all' || d.op === state.op) &&
                 (state.loc === 'all' || d.loc === state.loc) &&
                 (state.type === 'all' || d.type === state.type) &&
                 (state.max === null || d.op !== 'vente' || +d.price <= state.max);
        c.classList.toggle('hidden', !ok);
        return ok;
      });
      shown.sort(function (a, b) {
        if (state.sort === 'price-asc') return a.dataset.price - b.dataset.price;
        if (state.sort === 'price-desc') return b.dataset.price - a.dataset.price;
        if (state.sort === 'surface-desc') return b.dataset.surface - a.dataset.surface;
        return a.dataset.order - b.dataset.order;
      }).forEach(function (c) { grid.appendChild(c); });
      var active = (state.op !== 'all') + (state.loc !== 'all') + (state.type !== 'all') + (state.max !== null);
      $('#active-count').textContent = active;
      $('#empty').classList.toggle('hidden', shown.length > 0);
      $('#result-count').textContent = shown.length === cards.length
        ? 'Affichage de 1-' + shown.length + ' sur 48 propriétés d’exception'
        : shown.length + ' propriété' + (shown.length > 1 ? 's' : '') + ' correspond' + (shown.length > 1 ? 'ent' : '') + ' à votre sélection';
    }
    tabs.addEventListener('segchange', function (e) { state.op = e.detail; apply(); });
    [selLoc, selType, selSort].forEach(function (s) { s.addEventListener('change', apply); });
    function reset() {
      state = { op: 'all', loc: 'all', type: 'all', sort: 'recent', max: null };
      selLoc.value = selType.value = 'all'; selSort.value = 'recent';
      $$('button', tabs).forEach(function (b, i) { b.classList.toggle('on', i === 0); b.setAttribute('aria-pressed', i === 0); });
      apply();
    }
    $$('[data-reset]').forEach(function (b) { b.addEventListener('click', reset); });
    apply();
  }

  /* ---------- Détail du bien ---------- */
  var track = $('#gallery-track');
  if (track) {
    var counter = $('#gallery-counter'), total = track.children.length;
    var upd = function () {
      counter.textContent = (Math.round(track.scrollLeft / track.offsetWidth) + 1) + ' / ' + total;
    };
    track.addEventListener('scroll', upd);
    $('#gal-prev').addEventListener('click', function () { track.scrollBy({ left: -track.offsetWidth }); });
    $('#gal-next').addEventListener('click', function () { track.scrollBy({ left: track.offsetWidth }); });
    upd();
    $('#fullscreen').addEventListener('click', function () {
      var g = $('#gallery');
      if (g.requestFullscreen) g.requestFullscreen().catch(function () { toast('Plein écran indisponible', 'fullscreen_exit'); });
      else toast('Plein écran indisponible', 'fullscreen_exit');
    });
    $('#share-btn').addEventListener('click', function () {
      var data = { title: 'Villa contemporaine d’architecte — NEXT KEY', text: 'Découvrez cette villa à La Marsa / Carthage sur NEXT KEY Immobilier.', url: location.href };
      if (navigator.share) navigator.share(data).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { toast('Lien de la propriété copié !', 'link'); });
    });
    $('#brochure').addEventListener('click', function () { toast('Brochure PDF en cours de téléchargement…', 'download_done'); });
    var more = $('#description-more'), tbtn = $('#toggle-desc');
    tbtn.addEventListener('click', function () {
      var open = more.classList.toggle('hidden') === false;
      tbtn.querySelector('span').textContent = open ? 'Réduire' : 'Lire la suite';
      tbtn.querySelector('.ms').textContent = open ? 'expand_less' : 'expand_more';
      tbtn.setAttribute('aria-expanded', open);
    });
    $('#inquiry-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('#inquiry-btn');
      btn.disabled = true; btn.style.opacity = '.7';
      btn.innerHTML = '<span class="ms s18 spin">progress_activity</span> Envoi…';
      setTimeout(function () {
        btn.classList.add('hidden');
        $('#inquiry-success').classList.remove('hidden');
        toast('Demande envoyée au conseiller Sami Ben Salem', 'done');
      }, 800);
    });
  }

  /* ---------- Estimation (assistant 4 étapes) ---------- */
  var wiz = $('#estimation-form');
  if (wiz) {
    var titles = {
      1: 'Étape 1 sur 4 • Projet', 2: 'Étape 2 sur 4 • Typologie & Emplacement',
      3: 'Étape 3 sur 4 • Spécificités & État', 4: 'Étape 4 sur 4 • Contact & Réception'
    };
    var rooms = 3;
    function go(n) {
      for (var i = 1; i <= 4; i++) $('#step-' + i).classList.toggle('hidden', i !== n);
      $('#step-success').classList.add('hidden');
      $('#step-indicator').textContent = titles[n];
      $('#progress-percent').textContent = n * 25 + '%';
      $('#progress-bar').style.width = n * 25 + '%';
      var top = $('.wizard').getBoundingClientRect().top + window.scrollY - 120;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
    }
    $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.go); }); });
    var sr = $('#surface-range');
    sr.addEventListener('input', function () { $('#surface-val').textContent = sr.value; });
    $$('[data-rooms]').forEach(function (b) {
      b.addEventListener('click', function () {
        rooms = Math.max(1, Math.min(10, rooms + (+b.dataset.rooms)));
        $('#rooms-display').textContent = rooms + ' ch.';
      });
    });
    wiz.addEventListener('submit', function (e) {
      e.preventDefault();
      for (var i = 1; i <= 4; i++) $('#step-' + i).classList.add('hidden');
      $('#step-success').classList.remove('hidden');
      $('#step-indicator').textContent = 'Dossier transmis avec succès';
      $('#progress-percent').textContent = '100%';
      $('#progress-bar').style.width = '100%';
    });
    $('#reset-form').addEventListener('click', function () {
      wiz.reset(); rooms = 3;
      $('#surface-val').textContent = '220';
      $('#rooms-display').textContent = '3 ch.';
      go(1);
    });
  }
})();
