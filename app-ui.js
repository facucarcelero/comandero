
// IndexedDB helpers
const DB='CampoPOS_UI', VER=1; let db;
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,VER);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('products',{keyPath:'id'});d.createObjectStore('tickets',{keyPath:'id'});d.createObjectStore('cash',{keyPath:'id'});};r.onsuccess=()=>{db=r.result;res()};r.onerror=()=>rej(r.error);});}
const getAll=(s)=>new Promise((res,rej)=>{const t=db.transaction(s).objectStore(s).getAll();t.onsuccess=()=>res(t.result||[]);t.onerror=()=>rej(t.error)});
const getOne=(s,k)=>new Promise((res,rej)=>{const t=db.transaction(s).objectStore(s).get(k);t.onsuccess=()=>res(t.result);t.onerror=()=>rej(t.error)});
const putOne=(s,v)=>new Promise((res,rej)=>{const t=db.transaction(s,'readwrite').objectStore(s).put(v);t.onsuccess=()=>res(true);t.onerror=()=>rej(t.error)});
const delOne=(s,k)=>new Promise((res,rej)=>{const t=db.transaction(s,'readwrite').objectStore(s).delete(k);t.onsuccess=()=>res(true);t.onerror=()=>rej(t.error)});

let inventory=[], currentOrder=[], cash=null;
const el=q=>document.querySelector(q), els=q=>[...document.querySelectorAll(q)], money=n=>'$'+(Number(n)||0).toFixed(2);
function toast(msg,err=false){const t=el('#toast');el('#toast-message').textContent=msg;t.style.transform='translateX(0)';t.style.background=err?'#ef4444':'#0f172a';clearTimeout(t._tmr);t._tmr=setTimeout(()=>t.style.transform='translateX(120%)',2500);}

function nav(id){els('.page').forEach(p=>p.classList.remove('active')); el('#page-'+id).classList.add('active'); el('#page-title').textContent={'pos':'Tomar Pedido',inventory:'Inventario','cash-register':'Caja',reports:'Reportes'}[id];}

function renderProducts(filter=''){const g=el('#product-grid');g.innerHTML='';const list=inventory.filter(p=>p.name.toLowerCase().includes(filter.toLowerCase()) && p.stock>0); if(!list.length){g.innerHTML='<p class="placeholder">No se encontraron productos o no hay stock.</p>';return;} list.forEach(p=>{const c=document.createElement('div');c.className='card';c.style.cursor='pointer';c.innerHTML=`<h3 style="font-weight:800">${p.name}</h3><p class="muted sm">${p.category||''}</p><p class="mt" style="color:#4f46e5;font-weight:800">${money(p.price)}</p><p class="muted sm">Stock: ${p.stock}</p>`; c.onclick=()=>addToOrder(p.id); g.appendChild(c);});}
function renderInventory(){const tb=el('#inventory-table-body');tb.innerHTML=''; if(!inventory.length){tb.innerHTML='<tr><td colspan="5" class="placeholder">No hay productos.</td></tr>';return;} inventory.forEach(p=>{const tr=document.createElement('tr'); const s=p.stock<5?'style="color:#ef4444;font-weight:700"':''; tr.innerHTML=`<td>${p.name}</td><td>${p.category||''}</td><td>${money(p.price)}</td><td ${s}>${p.stock}</td><td><button class="btn ghost edit" data-id="${p.id}">Editar</button> <button class="btn danger del" data-id="${p.id}">Borrar</button></td>`; tb.appendChild(tr);});}
function renderOrder(){const box=el('#order-items');box.innerHTML=''; let total=0; if(!currentOrder.length){box.innerHTML='<p class="placeholder">Agregue productos al pedido</p>';} currentOrder.forEach(it=>{total+=it.price*it.qty; const row=document.createElement('div');row.className='flex between center';row.style.borderBottom='1px solid #e2e8f0';row.style.padding='.5rem 0';row.innerHTML=`<div><p style="font-weight:700">${it.name}</p><p class="muted sm">${money(it.price)}</p></div><div class="flex center gap"><button class="btn ghost q" data-id="${it.id}" data-d="-1">-</button><span style="width:2rem;text-align:center;font-weight:700">${it.qty}</span><button class="btn ghost q" data-id="${it.id}" data-d="1">+</button></div>`; box.appendChild(row);}); el('#order-total').textContent=money(total); el('#process-order-btn').disabled=currentOrder.length===0||!cash;}
function addToOrder(id){ if(!cash){toast('La caja está cerrada. Ábrila para vender.',true);return;} const p=inventory.find(x=>x.id===id); if(!p||p.stock<=0){toast('Sin stock.',true);return;} const ex=currentOrder.find(x=>x.id===id); if(ex){ if(ex.qty<p.stock) ex.qty++; else return toast('No hay más stock disponible.',true);} else currentOrder.push({id:p.id,name:p.name,price:p.price,qty:1,stock:p.stock}); renderOrder();}
function changeQty(id,d){const it=currentOrder.find(x=>x.id===id); if(!it) return; const p=inventory.find(x=>x.id===id); const q=it.qty+d; if(q<=0){currentOrder=currentOrder.filter(x=>x.id!==id);} else if(q<=p.stock){it.qty=q;} else return toast('Sin stock suficiente.',true); renderOrder();}
function clearOrder(){currentOrder=[]; renderOrder();}
async function processOrder(){const total=currentOrder.reduce((s,i)=>s+i.price*i.qty,0); if(total<=0)return; for(const it of currentOrder){const p=inventory.find(x=>x.id===it.id); p.stock=Math.max(0,p.stock-it.qty); await putOne('products',p);} const ticket={id:'t'+Date.now(),items:currentOrder,total,ts:Date.now()}; await putOne('tickets',ticket); cash.transactions.push({total,ts:Date.now()}); await putOne('cash',cash); toast('Venta realizada con éxito'); currentOrder=[]; await refresh(); nav('pos');}
function setCash(open){const ping=el('.ping'),dot=el('.dot'),txt=el('#cash-status-text'); if(open){ping.classList.remove('red');ping.classList.add('green');dot.classList.remove('red');dot.classList.add('green');txt.textContent='Caja Abierta';txt.classList.remove('red');txt.classList.add('green');el('#cash-open-view').classList.remove('hidden');el('#cash-closed-view').classList.add('hidden');renderCash();} else {ping.classList.remove('green');ping.classList.add('red');dot.classList.remove('green');dot.classList.add('red');txt.textContent='Caja Cerrada';txt.classList.remove('green');txt.classList.add('red');el('#cash-open-view').classList.add('hidden');el('#cash-closed-view').classList.remove('hidden');} renderOrder();}
function renderCash(){ if(!cash) return; const sales=cash.transactions.reduce((s,t)=>s+t.total,0); el('#initial-cash').textContent=money(cash.initial); el('#sales-total').textContent=money(sales); el('#expected-cash').textContent=money(cash.initial+sales); const list=el('#transactions-list'); list.innerHTML=''; if(!cash.transactions.length){list.innerHTML='<p class="placeholder">No hay transacciones aún.</p>';} [...cash.transactions].reverse().forEach(t=>{const div=document.createElement('div');div.className='flex between';div.style.borderBottom='1px solid #e2e8f0';div.style.padding='.25rem 0';div.innerHTML=`<span>Venta</span><span style="font-weight:800">${money(t.total)}</span><span class="muted sm">${new Date(t.ts).toLocaleTimeString()}</span>`; list.appendChild(div);});}
async function openCash(initial){ if(cash){toast('Ya hay una caja abierta.',true);return;} cash={id:'cash',initial:Number(initial||0),transactions:[]}; await putOne('cash',cash); setCash(true); el('#open-register-modal').classList.add('hidden'); toast('Caja abierta');}
async function closeCash(finalCounted){ if(!cash) return; const sales=cash.transactions.reduce((s,t)=>s+t.total,0); const expected=cash.initial+sales; const diff=Number(finalCounted||0)-expected; const closure={id:'z'+Date.now(),kind:'close',initial:cash.initial,sales,final:Number(finalCounted||0),diff,ts:Date.now()}; await putOne('tickets',closure); await delOne('cash','cash'); cash=null; setCash(false); el('#close-register-modal').classList.add('hidden'); toast('Caja cerrada. Diferencia: '+money(diff)); }
async function fetchReportFor(dateStr){const box=el('#reports-container'); box.innerHTML='<p class="placeholder center">Cargando…</p>'; const all=await getAll('tickets'); const d=new Date(dateStr); const y=d.getFullYear(),m=d.getMonth(),dd=d.getDate(); const same=(ts)=>{const t=new Date(ts);return t.getFullYear()==y&&t.getMonth()==m&&t.getDate()==dd}; const closures=all.filter(t=>t.kind==='close' && same(t.ts)); if(!closures.length){box.innerHTML='<p class="placeholder center">No hay cierres para esta fecha.</p>'; return;} box.innerHTML=''; closures.forEach(c=>{const card=document.createElement('div'); card.className='card'; card.innerHTML=`<div class="flex between mb"><h3 style="font-weight:800">Cierre de Caja</h3><span class="muted sm">${new Date(c.ts).toLocaleString()}</span></div><div class="grid-4 gap"><div class="stat"><span class="muted sm">Monto Inicial</span><p class="stat-v">${money(c.initial)}</p></div><div class="stat"><span class="muted sm">Total Ventas</span><p class="stat-v">${money(c.sales)}</p></div><div class="stat"><span class="muted sm">Contado Final</span><p class="stat-v">${money(c.final)}</p></div><div class="stat" style="color:${c.diff===0?'#16a34a':'#ef4444'}"><span class="muted sm">Diferencia</span><p class="stat-v">${money(c.diff)}</p></div></div>`; box.appendChild(card);});}

async function refresh(){inventory=await getAll('products'); cash=await getOne('cash','cash'); el('#session-id').textContent=(crypto.getRandomValues(new Uint32Array(1))[0]).toString(16); setCash(!!cash); renderProducts(el('#product-search').value||''); renderInventory(); renderCash(); renderOrder();}


// --- Payment Modal + Kitchen print ---
function openPaymentModal(){
  if(currentOrder.length===0){ toast('El pedido está vacío.', true); return; }
  const modal = document.getElementById('payment-modal');
  modal.classList.remove('hidden');
}
function closePaymentModal(){
  const modal = document.getElementById('payment-modal');
  modal.classList.add('hidden');
}
      <div style="border-top:1px dashed #999; margin:6px 0;"></div>
      <div>Pago: <strong>${(payMethod||'').toUpperCase()}</strong></div>
    </div>`;
}

function buildKitchenTicketHTML(items, payMethod){
  const dt = new Date();
  const lines = items.map(it => `<div class="row"><span>${it.qty} x ${it.name}</span><span>${it.note?it.note:''}</span></div>`).join('');
  return `
    <div class="kitchen-ticket">
      <h3>*** COMANDA ***</h3>
      <div class="row"><span>#${dt.getHours()}${dt.getMinutes()}${dt.getSeconds()}</span><span>${dt.toLocaleTimeString()}</span></div>
      <div class="sep"></div>
      ${lines || '<div>(sin items)</div>'}
      <div class="sep"></div>
      <div>Pago: <strong>${(payMethod||'').toUpperCase()}</strong></div>
    </div>`;
}

function printKitchen(items, payMethod){
  const box = document.getElementById('kitchen-print');
  box.classList.remove('w80'); box.classList.add('w58');
  // prepare items with qty
  const compact = items.map(i => ({ name: i.name, qty: i.qty, note: i.note||'' }));
  box.innerHTML = buildKitchenTicketHTML(compact, payMethod);
  window.print();
}


document.addEventListener('DOMContentLoaded', async ()=>{
  await openDB(); await refresh();
  els('.nav-link').forEach(a=>a.addEventListener('click',e=>{e.preventDefault(); nav(a.dataset.page);}));
  el('#product-search').addEventListener('input',e=>renderProducts(e.target.value));
  el('#order-items').addEventListener('click',e=>{const b=e.target.closest('.q'); if(b){changeQty(b.dataset.id, Number(b.dataset.d));}});
  el('#clear-order-btn').addEventListener('click', clearOrder);
  el('#process-order-btn').addEventListener('click', openPaymentModal);
  // payment modal actions
  document.getElementById('cancel-payment').addEventListener('click', ()=>{ closePaymentModal(); });
  document.querySelectorAll('.pay-opt').forEach(btn=>btn.addEventListener('click', async ()=>{ const method = btn.dataset.pay; closePaymentModal(); await processOrderWithMethod(method); }));
  // btn:process:payment
  el('#add-product-btn').addEventListener('click', ()=>{el('#product-id').value=''; el('#product-form').reset(); el('#modal-title').textContent='Añadir Nuevo Producto'; el('#product-modal').classList.remove('hidden');});
  el('#cancel-product-modal').addEventListener('click', ()=>el('#product-modal').classList.add('hidden'));
  el('#inventory-table-body').addEventListener('click', async e=>{const b=e.target.closest('button'); if(!b) return; const id=b.dataset.id; if(b.classList.contains('edit')){const p=inventory.find(x=>x.id===id); if(!p) return; el('#modal-title').textContent='Editar Producto'; el('#product-id').value=p.id; el('#product-name').value=p.name; el('#product-category').value=p.category||''; el('#product-price').value=p.price; el('#product-stock').value=p.stock; el('#product-modal').classList.remove('hidden');} else if(b.classList.contains('del')){await delOne('products',id); toast('Producto eliminado'); await refresh();}});
  el('#product-form').addEventListener('submit', async e=>{e.preventDefault(); const id=el('#product-id').value || ('p'+Math.random().toString(36).slice(2,9)); const p={id,name:el('#product-name').value,category:el('#product-category').value,price:Number(el('#product-price').value),stock:Number(el('#product-stock').value)}; await putOne('products',p); toast('Producto guardado'); el('#product-modal').classList.add('hidden'); await refresh();});
  el('#open-register-btn').addEventListener('click', ()=>el('#open-register-modal').classList.remove('hidden'));
  el('#cancel-open-register').addEventListener('click', ()=>el('#open-register-modal').classList.add('hidden'));
  el('#close-register-btn').addEventListener('click', ()=>{const sales=cash?cash.transactions.reduce((s,t)=>s+t.total,0):0; const expected=(cash?cash.initial:0)+sales; el('#close-expected-total').textContent=money(expected); el('#cash-difference').textContent=''; el('#close-register-modal').classList.remove('hidden');});
  el('#cancel-close-register').addEventListener('click', ()=>el('#close-register-modal').classList.add('hidden'));
  el('#open-register-form').addEventListener('submit', async e=>{e.preventDefault(); await openCash(Number(el('#initial-amount').value||0));});
  el('#close-register-form').addEventListener('submit', async e=>{e.preventDefault(); await closeCash(Number(el('#counted-amount').value||0));});
  el('#counted-amount').addEventListener('input', e=>{const counted=Number(e.target.value||0); const sales=cash?cash.transactions.reduce((s,t)=>s+t.total,0):0; const expected=(cash?cash.initial:0)+sales; const diff=counted-expected; const d=el('#cash-difference'); d.textContent='Diferencia: '+money(diff); d.style.color=diff===0?'#16a34a':'#ef4444';});
  const dp=el('#report-date-picker'); dp.valueAsDate=new Date(); dp.addEventListener('change', e=>fetchReportFor(e.target.value));
});

async function processOrderWithMethod(method){
  if(currentOrder.length===0){ toast('El pedido está vacío.', true); return; }
  // 1) Print kitchen ticket (ONLY the ticket)
  printKitchen(currentOrder, method);
  // 2) Registrar venta y actualizar stock (reutiliza processOrder pero respetamos orden)
  //   Copiamos la lógica de processOrder para mantener consistencia
  const total = currentOrder.reduce((s,i)=>s+i.price*i.qty,0); if(total<=0) return;
  for(const it of currentOrder){
    const p=inventory.find(x=>x.id===it.id); p.stock=Math.max(0,p.stock-it.qty); await putOne('products',p);
  }
  const ticket={id:'t'+Date.now(),items:currentOrder,total,ts:Date.now(),method};
  await putOne('tickets',ticket);
  cash.transactions.push({total,ts:Date.now(),method});
  await putOne('cash',cash);
  toast('Venta realizada');
  currentOrder=[];
  await refresh();
  nav('pos');
}
