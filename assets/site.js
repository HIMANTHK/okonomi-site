// Okonomi website behaviour. Each block runs only on pages that have its elements.
(() => {
  const $ = id => document.getElementById(id);

  // ----- Mobile menu -----
  const toggle = $('menu-toggle');
  const nav = $('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  const rupee = n => '₹' + Math.round(n).toLocaleString('en-IN');

  // ----- Offline till demo -----
  const pad = $('menu-pad');
  if (pad) {
    const linesEl = $('bill-lines');
    const totalEl = $('bill-total');
    const payBtn = $('pay');
    const queueEl = $('queue');
    const statusEl = $('till-status');
    const wifi = $('wifi');
    const log = $('log');
    let bill = [];
    let queued = 0;
    let billNo = 1041;
    const stamp = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const note = text => {
      const row = document.createElement('div');
      row.textContent = stamp() + '  ' + text;
      log.prepend(row);
    };
    const render = () => {
      linesEl.replaceChildren();
      if (!bill.length) {
        const row = document.createElement('div');
        row.textContent = 'Tap a dish to add it';
        linesEl.append(row);
      } else {
        const counts = new Map();
        bill.forEach(i => counts.set(i.name, { qty: (counts.get(i.name)?.qty ?? 0) + 1, price: i.price }));
        counts.forEach((v, name) => {
          const row = document.createElement('div');
          const l = document.createElement('span'); l.textContent = v.qty + '× ' + name;
          const r = document.createElement('span'); r.textContent = rupee(v.qty * v.price);
          row.append(l, r);
          linesEl.append(row);
        });
      }
      totalEl.textContent = rupee(bill.reduce((a, i) => a + i.price, 0) * 1.05);
      payBtn.disabled = !bill.length;
    };
    const renderQueue = () => {
      if (queued) { queueEl.textContent = queued + (queued === 1 ? ' bill' : ' bills') + ' saved on this device, waiting to sync'; queueEl.className = 'queue waiting'; }
      else { queueEl.textContent = 'All bills synced'; queueEl.className = 'queue synced'; }
    };
    pad.addEventListener('click', e => {
      const b = e.target.closest('.dish');
      if (!b) return;
      bill.push({ name: b.dataset.name, price: Number(b.dataset.price) });
      render();
    });
    payBtn.addEventListener('click', () => {
      const total = totalEl.textContent;
      billNo++;
      if (wifi.checked) note('Bill ' + billNo + ' paid ' + total + ', saved to the cloud, ticket sent to kitchen');
      else { queued++; note('Bill ' + billNo + ' paid ' + total + ', kept on this tablet, ticket sent to kitchen over shop Wi-Fi'); }
      bill = [];
      render();
      renderQueue();
    });
    wifi.addEventListener('change', () => {
      if (wifi.checked) {
        statusEl.textContent = 'Online';
        statusEl.classList.remove('down');
        if (queued) {
          const n = queued;
          queueEl.textContent = 'Syncing ' + n + (n === 1 ? ' bill' : ' bills') + '…';
          queueEl.className = 'queue';
          setTimeout(() => { note('Internet back: ' + n + (n === 1 ? ' bill' : ' bills') + ' synced in order, no duplicates'); queued = 0; renderQueue(); }, 900);
        } else renderQueue();
      } else {
        statusEl.textContent = 'Offline';
        statusEl.classList.add('down');
        note('Internet lost. Billing carries on from this tablet.');
      }
    });
    bill = [{ name: 'Masala chai', price: 40 }, { name: 'Masala chai', price: 40 }, { name: 'Paneer roll', price: 150 }];
    render();
    renderQueue();
    note('Shift opened by Ananya with ₹2,000 float');
  }

  // ----- Own-ordering savings calculator (pricing page) -----
  const calc = $('calc');
  if (calc) {
    const orders = $('c-orders');
    const aov = $('c-aov');
    const commission = $('c-commission');
    const shift = $('c-shift');
    const out = id => $(id + '-out');
    const update = () => {
      out('c-orders').textContent = Number(orders.value).toLocaleString('en-IN') + ' orders';
      out('c-aov').textContent = rupee(aov.value);
      out('c-commission').textContent = commission.value + '%';
      out('c-shift').textContent = shift.value + '%';
      const moved = orders.value * (shift.value / 100);
      const saved = moved * aov.value * (commission.value / 100);
      $('c-saved').textContent = rupee(saved);
      $('c-detail').textContent = Math.round(moved).toLocaleString('en-IN') + ' of your delivery orders a month placed on your own ordering page instead, at ' + rupee(aov.value) + ' each, keep ' + commission.value + '% that would have gone in commission.';
    };
    [orders, aov, commission, shift].forEach(el => el.addEventListener('input', update));
    update();
  }

  // ----- Demo / contact form -----
  const form = $('demo-form');
  if (form) {
    const done = $('form-done');
    // Arriving from "Start free trial" before online signup opens: keep the plan they picked.
    const q = new URLSearchParams(location.search);
    const chosen = { starter: 'Starter', growth: 'Growth', pro: 'Pro' }[q.get('plan')] ?? null;
    const note = $('trial-note');
    if (q.has('trial') && note) {
      note.hidden = false;
      note.textContent = (chosen ? 'You picked the ' + chosen + ' plan. ' : '') + 'We set up every trial with you: send your details and we will call to load your menu and start your 14 days.';
    }
    form.addEventListener('submit', e => {
      e.preventDefault();
      const val = id => ($(id)?.value ?? '').trim();
      const name = val('f-name');
      const phone = val('f-phone');
      const rest = val('f-rest');
      if (!name || !rest || phone.replace(/\D/g, '').length < 10) {
        done.hidden = false;
        done.className = 'form-done error';
        done.textContent = 'Add your name, restaurant and a 10-digit mobile number so we can reach you.';
        return;
      }
      const body = [
        'Name: ' + name, 'Mobile: ' + phone, 'Restaurant: ' + rest, 'City: ' + val('f-city'),
        'Outlets: ' + val('f-outlets'), 'Interested in: ' + val('f-topic'), 'Plan: ' + (chosen ?? 'not chosen yet'), '', val('f-msg'),
      ].join('\n');
      const email = form.dataset.email;
      done.hidden = false;
      done.className = 'form-done';
      done.textContent = 'Your email app should open with these details ready to send to ' + email + '. If it does not, copy them into an email to that address.';
      window.location.href = 'mailto:' + email + '?subject=' + encodeURIComponent('Demo request: ' + rest) + '&body=' + encodeURIComponent(body);
    });
  }
})();
