/**
 * Suga.Health Pharmacy Hub Application Logic
 * Formularies and clinicians derived directly from https://sugahealthv1.vercel.app/
 * and explicit Original Generic vs Commercial Brand Examples table.
 */

let selectedOrderId = null;
let statusFilter = "all";
let categoryFilter = "all";
let searchQuery = "";
let isRendering = false;

document.addEventListener("DOMContentLoaded", () => {
  initApp();

  window.addEventListener("suga_orders_updated", () => {
    renderStats();
    renderOrdersList();
    renderOrderDetail();
  });
  window.addEventListener("suga_inventory_updated", () => {
    renderOrderDetail();
  });
});

function initApp() {
  const orders = PharmacyDB.getOrders();
  if (orders.length > 0 && !selectedOrderId) {
    selectedOrderId = orders[0].id;
  }
  renderStats();
  renderOrdersList();
  renderOrderDetail();
  renderActivityList();
  populateMedicationDropdown();
}

/**
 * Metric Counters & Badges
 */
function renderStats() {
  const orders = PharmacyDB.getOrders();

  const pending = orders.filter(o => o.status === 'new').length;
  const checking = orders.filter(o => o.status === 'stock_checking').length;
  const ready = orders.filter(o => o.status === 'ready_for_shipping').length;
  const dispatched = orders.filter(o => o.status === 'in_transit' || o.status === 'out_for_delivery' || o.status === 'delivered').length;

  const elPending = document.getElementById('stat-pending-count');
  if (elPending) elPending.textContent = pending;
  const elChecking = document.getElementById('stat-checking-count');
  if (elChecking) elChecking.textContent = checking;
  const elReady = document.getElementById('stat-ready-count');
  if (elReady) elReady.textContent = ready;
  const elDispatched = document.getElementById('stat-dispatched-count');
  if (elDispatched) elDispatched.textContent = dispatched;

  // Sidebar badges
  const queueTotal = pending + checking;
  const navQueue = document.getElementById('badge-nav-queue');
  if (navQueue) navQueue.textContent = queueTotal;

  const navShipping = document.getElementById('badge-nav-shipping');
  if (navShipping) navShipping.textContent = ready;

  // Filter tab counts
  const countAll = document.getElementById('count-all');
  if (countAll) countAll.textContent = `(${orders.length})`;
  const countNew = document.getElementById('count-new');
  if (countNew) countNew.textContent = `(${pending})`;
  const countChecking = document.getElementById('count-stock_checking');
  if (countChecking) countChecking.textContent = `(${checking})`;
  const countReady = document.getElementById('count-ready_for_shipping');
  if (countReady) countReady.textContent = `(${ready})`;
}

/**
 * Filter orders
 */
function getFilteredOrders() {
  let orders = PharmacyDB.getOrders();

  if (statusFilter !== "all") {
    orders = orders.filter(o => o.status === statusFilter);
  }

  if (categoryFilter !== "all") {
    orders = orders.filter(o => {
      return o.items.some(i => {
        const med = PharmacyDB.getInventory().find(m => m.id === i.medId);
        return med && med.category === categoryFilter;
      });
    });
  }

  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase().trim();
    orders = orders.filter(o => 
      o.patient.name.toLowerCase().includes(q) ||
      o.rxId.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.patient.city.toLowerCase().includes(q) ||
      o.items.some(i => 
        i.name.toLowerCase().includes(q) || 
        (i.genericName && i.genericName.toLowerCase().includes(q)) ||
        (i.selectedBrand && i.selectedBrand.toLowerCase().includes(q))
      )
    );
  }

  return orders;
}

/**
 * Render Orders in the Left List with Skeleton State
 */
function renderOrdersList() {
  const container = document.getElementById("orders-list");
  if (!container) return;

  const filtered = getFilteredOrders();
  const countEl = document.getElementById("orders-list-count");
  if (countEl) {
    countEl.textContent = `${filtered.length} order${filtered.length === 1 ? '' : 's'} in queue`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="suga-card p-10 text-center text-[#747680] bg-[#FCFCF9]">
        <div class="w-12 h-12 rounded-xl bg-[#F0F0EA] flex items-center justify-center mx-auto text-[#16171A] mb-3.5 border border-[#E3E3DC]">
          <svg class="w-6 h-6 text-[#4E5057]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
          </svg>
        </div>
        <h4 class="font-bold text-base text-[#16171A] font-editorial">Prescription Intake Queue Clear</h4>
        <p class="text-xs text-[#747680] max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
          No mock or pending prescriptions in the dispensing queue. Enter a patient prescription or receive consultation intake to begin verification.
        </p>
        <button onclick="openNewOrderModal()" class="px-5 py-2.5 rounded-full bg-[#16171A] text-white text-xs font-semibold hover:bg-black transition-colors inline-flex items-center gap-2">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          <span>Enter Patient Prescription</span>
        </button>
      </div>
    `;
    selectedOrderId = null;
    renderOrderDetail();
    return;
  }

  if (!filtered.some(o => o.id === selectedOrderId)) {
    selectedOrderId = filtered[0].id;
  }

  container.innerHTML = filtered.map(order => {
    const isSelected = order.id === selectedOrderId;
    const medSummary = order.items.map(i => `${i.selectedBrand || i.name} (${i.genericName || ''})`).join(', ');

    let statusBadge = '';
    if (order.status === 'new') {
      statusBadge = `<span class="badge-lime text-[11px] px-2 py-0.2">New Order</span>`;
    } else if (order.status === 'stock_checking') {
      statusBadge = `<span class="badge-dark text-[11px] px-2 py-0.2">Checking Stock</span>`;
    } else if (order.status === 'ready_for_shipping') {
      statusBadge = `<span class="badge-mint text-[11px] px-2 py-0.2">Ready for Delivery</span>`;
    } else if (order.status === 'in_transit' || order.status === 'out_for_delivery') {
      statusBadge = `<span class="badge-subtle text-[11px] px-2 py-0.2 font-medium">In Transit</span>`;
    } else {
      statusBadge = `<span class="badge-subtle text-[11px] px-2 py-0.2">Delivered</span>`;
    }

    const firstMed = PharmacyDB.getInventory().find(m => m.id === order.items[0]?.medId);
    const categoryName = firstMed?.category || "General";

    return `
      <div 
        onclick="selectOrder('${order.id}')"
        class="suga-card suga-card-interactive p-3.5 bg-[#FCFCF9] ${isSelected ? 'order-card-selected' : ''}"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-lg ${isSelected ? 'bg-[#16171A] text-white' : 'bg-[#F0F0EA] text-[#16171A] border border-[#E3E3DC]'} flex items-center justify-center font-bold text-xs shrink-0">
              ${order.patient.initials}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-sm text-[#16171A] font-editorial">${order.patient.name}</h4>
                <span class="text-[11px] text-[#747680]">${order.patient.age}y · ${order.patient.gender}</span>
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[10px] font-medium bg-[#F0F0EA] text-[#4E5057] px-1.5 py-0.2 rounded border border-[#E3E3DC]">${categoryName}</span>
                <span class="text-[11px] text-[#747680]">${order.timeAgo}</span>
              </div>
            </div>
          </div>

          <div class="shrink-0 text-right">
            ${statusBadge}
            <div class="text-[10px] text-[#747680] mt-1 font-mono">${order.rxId}</div>
          </div>
        </div>

        <div class="mt-2.5 pt-2 border-t border-[#E3E3DC] flex items-center justify-between text-xs text-[#4E5057]">
          <div class="truncate pr-2 text-[11px]">
            <span class="font-semibold text-[#16171A]">Rx:</span> ${medSummary}
          </div>
          <span class="text-xs font-bold text-[#16171A] shrink-0">₹${order.totalAmount.toLocaleString()}</span>
        </div>
      </div>
    `;
  }).join('');
}

function showOrdersSkeleton() {
  const container = document.getElementById("orders-list");
  if (!container) return;
  container.innerHTML = `
    <div class="space-y-2.5">
      <div class="suga-card p-3.5 bg-[#FCFCF9]">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-lg skeleton shrink-0"></div>
          <div class="space-y-1.5 flex-1">
            <div class="h-3.5 w-32 skeleton"></div>
            <div class="h-2.5 w-20 skeleton"></div>
          </div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-[#E3E3DC] flex justify-between">
          <div class="h-2.5 w-36 skeleton"></div>
          <div class="h-2.5 w-12 skeleton"></div>
        </div>
      </div>
      <div class="suga-card p-3.5 bg-[#FCFCF9]">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-lg skeleton shrink-0"></div>
          <div class="space-y-1.5 flex-1">
            <div class="h-3.5 w-28 skeleton"></div>
            <div class="h-2.5 w-24 skeleton"></div>
          </div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-[#E3E3DC] flex justify-between">
          <div class="h-2.5 w-32 skeleton"></div>
          <div class="h-2.5 w-12 skeleton"></div>
        </div>
      </div>
    </div>
  `;
}

function selectOrder(orderId) {
  selectedOrderId = orderId;
  renderOrdersList();
  renderOrderDetail();
  if (window.innerWidth < 1024) {
    const el = document.getElementById("order-detail-card");
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

/**
 * Render Order Details & Stock Verification Workspace (Right Column)
 */
function renderOrderDetail() {
  const container = document.getElementById("order-detail-card");
  if (!container) return;

  const orders = PharmacyDB.getOrders();
  const inventory = PharmacyDB.getInventory();
  const order = orders.find(o => o.id === selectedOrderId);

  if (!order) {
    container.innerHTML = `
      <div class="py-16 text-center text-[#747680]">
        <div class="w-12 h-12 rounded-xl bg-[#F0F0EA] border border-[#E3E3DC] flex items-center justify-center mx-auto text-[#4E5057] mb-3">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <h3 class="text-base font-bold text-[#16171A] font-editorial">Pharmacist Workspace Ready</h3>
        <p class="text-xs text-[#747680] max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
          Select an order from the prescription intake queue to inspect stock and transfer to delivery.
        </p>
        <button onclick="openNewOrderModal()" class="px-5 py-2 rounded-full bg-[#16171A] text-white text-xs font-semibold hover:bg-black transition-colors">
          + Enter Patient Prescription
        </button>
      </div>
    `;
    return;
  }

  let canMoveToDelivery = true;
  let stockDetails = [];

  for (const item of order.items) {
    const med = inventory.find(m => m.id === item.medId);
    const hasEnough = med && med.currentStock >= item.qty;
    if (!hasEnough) canMoveToDelivery = false;
    stockDetails.push({ item, med, hasEnough });
  }

  const isAlreadyInShipping = order.status === 'ready_for_shipping' || 
                              order.status === 'in_transit' || 
                              order.status === 'out_for_delivery' || 
                              order.status === 'delivered';

  container.innerHTML = `
    <!-- Top Patient Header & Action Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E3E3DC]">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-[#F0F0EA] flex items-center justify-center text-[#16171A] font-bold text-sm border border-[#E3E3DC] shrink-0">
          ${order.patient.initials}
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-xl font-bold font-editorial text-[#16171A] tracking-tight">${order.patient.name}</h2>
            ${order.status === 'new' ? '<span class="badge-lime text-xs px-2 py-0.2">New Order</span>' : ''}
            ${order.status === 'stock_checking' ? '<span class="badge-dark text-xs px-2 py-0.2">Checking Stock</span>' : ''}
            ${order.status === 'ready_for_shipping' ? '<span class="badge-mint text-xs px-2 py-0.2">In Shipping Queue</span>' : ''}
            ${order.status === 'in_transit' ? '<span class="badge-subtle text-xs px-2 py-0.2">In Transit</span>' : ''}
            ${order.status === 'out_for_delivery' ? '<span class="badge-mint text-xs px-2 py-0.2">Out for Delivery</span>' : ''}
            ${order.status === 'delivered' ? '<span class="badge-subtle text-xs px-2 py-0.2">Delivered</span>' : ''}
          </div>
          <p class="text-xs text-[#747680] mt-0.5">
            ${order.patient.age}y · ${order.patient.gender} · ${order.patient.city} · 
            <span class="font-mono text-[#16171A] font-medium">${order.patient.id}</span> · 
            <span class="font-mono text-[#16171A] font-medium">${order.rxId}</span>
          </p>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-2">
        <button onclick="openLabelModal('${order.id}')" class="px-3 py-1.5 rounded-full border border-[#E3E3DC] text-xs font-semibold text-[#16171A] hover:bg-[#F0F0EA] flex items-center gap-1.5 transition-colors">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
          <span>Print Label</span>
        </button>
        ${isAlreadyInShipping ? `
          <a href="shipping.html?highlight=${order.id}" class="px-3.5 py-1.5 rounded-full bg-[#E2F1A8] text-[#233306] border border-[#CCE27E] text-xs font-semibold hover:bg-[#d6eb94] transition-colors flex items-center gap-1">
            <span>View in Shipping</span>
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        ` : `
          <button onclick="verifyAndMoveToDelivery('${order.id}')" class="px-4 py-1.5 rounded-full bg-[#16171A] text-white text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5">
            <span>Move to Delivery</span>
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        `}
      </div>
    </div>

    <!-- Health Metrics & Doctor Prescriber Strip -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3.5 border-b border-[#E3E3DC] text-xs">
      <div class="bg-[#F0F0EA] p-2.5 rounded-lg border border-[#E3E3DC]">
        <span class="text-[#747680] block text-[10px] uppercase font-semibold">Doctor</span>
        <span class="font-bold text-[#16171A] block truncate">${order.doctor.name}</span>
        <span class="text-[10px] text-[#747680] block truncate">${order.doctor.credentials}</span>
      </div>
      <div class="bg-[#F0F0EA] p-2.5 rounded-lg border border-[#E3E3DC]">
        <span class="text-[#747680] block text-[10px] uppercase font-semibold">Clinical Assessment</span>
        <span class="font-bold text-[#16171A] block truncate">${order.patient.conditions || 'General review'}</span>
        <span class="text-[10px] text-[#747680] block">Consultation verified</span>
      </div>
      <div class="bg-[#F0F0EA] p-2.5 rounded-lg border border-[#E3E3DC]">
        <span class="text-[#747680] block text-[10px] uppercase font-semibold">Known Allergies</span>
        ${(order.patient.allergies && order.patient.allergies.length > 0)
          ? `<span class="inline-block mt-0.5 bg-[#FDE8E8] text-[#A81B1B] border border-[#F8B4B4] font-bold text-[10px] px-1.5 py-0.2 rounded">${order.patient.allergies.join(', ')}</span>`
          : '<span class="text-[#0D5936] font-semibold">None reported</span>'
        }
      </div>
      <div class="bg-[#F0F0EA] p-2.5 rounded-lg border border-[#E3E3DC]">
        <span class="text-[#747680] block text-[10px] uppercase font-semibold">Delivery Location</span>
        <span class="font-bold text-[#16171A] truncate block">${order.patient.city}</span>
        <span class="text-[10px] text-[#747680] truncate block">${order.patient.address}</span>
      </div>
    </div>

    <!-- ORDERED MEDICATIONS & STOCK VERIFICATION SECTION -->
    <div class="my-4">
      <div class="flex items-center justify-between mb-2.5">
        <div class="flex items-center gap-2">
          <h3 class="font-bold text-xs text-[#16171A] uppercase tracking-wider">Ordered Medications & Stock Check</h3>
          <span class="bg-[#F0F0EA] text-[#4E5057] border border-[#E3E3DC] text-[10px] font-semibold px-2 py-0.2 rounded">${order.items.length} item</span>
        </div>
        <span class="text-[11px] text-[#747680]">Batch verification required</span>
      </div>

      <!-- Medicine Cards Grid -->
      <div class="space-y-3">
        ${stockDetails.map(({ item, med, hasEnough }) => {
          const isVerified = item.stockVerified || isAlreadyInShipping;
          const genericTitle = item.genericName || med?.genericName || item.name;
          const brandTitle = item.selectedBrand || med?.primaryBrand || item.name;
          const brandList = item.brandExamples || med?.brandExamples || [];

          return `
            <div class="border border-[#E3E3DC] rounded-xl p-3.5 bg-[#FCFCF9]">
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                
                <div class="flex items-start gap-3">
                  <div class="w-14 h-14 rounded-lg bg-[#F0F0EA] border border-[#E3E3DC] flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                    <img src="${med?.image || 'assets/images/weightloss-image-1.png'}" alt="${item.name}" class="max-w-full max-h-full object-contain">
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <h4 class="font-bold text-sm text-[#16171A] font-editorial">${genericTitle}</h4>
                      ${item.requiresColdChain ? `
                        <span class="badge-cold text-[10px] font-semibold px-2 py-0.2 inline-flex items-center gap-1">
                          Cold-Chain (2°C - 8°C)
                        </span>
                      ` : ''}
                      ${med?.category === 'Sexual health' ? `
                        <span class="badge-vault text-[10px] font-semibold px-2 py-0.2">
                          Discreet Packaging
                        </span>
                      ` : ''}
                    </div>

                    <!-- Commercial Brand Dispensed & Equivalents -->
                    <div class="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span class="text-[11px] font-semibold text-[#4E5057]">Dispensed Brand:</span>
                      <span class="text-[11px] font-bold text-[#233306] bg-[#E2F1A8] px-2 py-0.2 rounded border border-[#CCE27E]">${brandTitle}</span>
                    </div>

                    ${brandList.length > 0 ? `
                      <div class="mt-1 flex items-center gap-1 text-[11px] text-[#747680] flex-wrap">
                        <span>Brand Examples:</span>
                        ${brandList.map(b => `<span class="bg-[#F0F0EA] text-[#4E5057] border border-[#E3E3DC] px-1.5 py-0.2 rounded text-[10px]">${b}</span>`).join('')}
                      </div>
                    ` : ''}

                    <p class="text-[11px] text-[#4E5057] mt-1.5 bg-[#F0F0EA] px-2 py-0.5 rounded inline-block border border-[#E3E3DC]">
                      <span class="font-semibold text-[#16171A]">Dosage:</span> ${item.dosage}
                    </p>
                  </div>
                </div>

                <div class="sm:text-right shrink-0">
                  <div class="text-[10px] font-semibold text-[#747680] uppercase">Required Qty</div>
                  <div class="text-sm font-bold text-[#16171A]">${item.qty} ${item.unit}</div>
                  <div class="text-[11px] text-[#747680] mt-0.5">₹${item.price.toLocaleString()}</div>
                </div>

              </div>

              <!-- INVENTORY STOCK VERIFICATION STRIP -->
              <div class="mt-3 pt-2.5 border-t border-[#E3E3DC] grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-[#F0F0EA] p-2.5 rounded-lg border border-[#E3E3DC]">
                <div>
                  <span class="text-[10px] text-[#747680] uppercase font-bold block">Available Stock</span>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="font-bold text-sm ${hasEnough ? 'text-[#0D5936]' : 'text-[#A81B1B]'}">
                      ${med ? med.currentStock : 0} ${med ? med.unit : 'units'}
                    </span>
                    ${hasEnough 
                      ? '<span class="badge-mint text-[10px] px-1.5 py-0.2">In Stock</span>' 
                      : '<span class="badge-coral text-[10px] px-1.5 py-0.2">Out of Stock (0 Available)</span>'
                    }
                  </div>
                </div>

                <div>
                  <span class="text-[10px] text-[#747680] uppercase font-bold block">Batch and Expiry</span>
                  <span class="font-medium text-[#16171A] block mt-0.5 font-mono text-[11px]">${med?.batchNumber || 'Assigned on verify'} · Exp: ${med?.expiryDate || 'N/A'}</span>
                </div>

                <div>
                  <span class="text-[10px] text-[#747680] uppercase font-bold block">Vault Shelf</span>
                  <span class="font-medium text-[#16171A] block mt-0.5 truncate text-[11px]">${med?.shelfLocation || 'Shelf Main'}</span>
                </div>
              </div>

              <div class="mt-2.5 flex items-center justify-between text-xs">
                <label class="flex items-center gap-2 ${hasEnough ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} select-none">
                  <input 
                    type="checkbox" 
                    id="chk-verify-${item.medId}" 
                    class="custom-checkbox" 
                    ${isVerified ? 'checked disabled' : (hasEnough ? 'checked' : 'disabled')}
                  >
                  <span class="font-medium text-[#16171A] text-[11px]">Batch and expiry verified by pharmacist</span>
                </label>
                <span class="text-[11px] ${hasEnough ? 'text-[#0D5936]' : 'text-[#A81B1B]'} font-semibold flex items-center gap-1">
                  ${hasEnough ? 'Ready for dispensing' : 'Out of stock in vault · Restock needed'}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- PACKAGING & DISPENSING PROTOCOL -->
    <div class="bg-[#F0F0EA] rounded-xl p-3.5 mb-4 border border-[#E3E3DC]">
      <h4 class="font-bold text-[11px] text-[#16171A] uppercase tracking-wider mb-2">Dispensing & Packaging Protocol</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2.5">
        <label class="flex items-center gap-2 cursor-pointer bg-[#FCFCF9] p-2 rounded-lg border border-[#E3E3DC] text-[11px]">
          <input type="checkbox" id="chk-coldpack" class="custom-checkbox" ${order.items.some(i => i.requiresColdChain) ? 'checked' : ''}>
          <span>Include calibrated cold-gel pack (2°C - 8°C)</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer bg-[#FCFCF9] p-2 rounded-lg border border-[#E3E3DC] text-[11px]">
          <input type="checkbox" id="chk-discreet" class="custom-checkbox" checked>
          <span>Discreet tamper-evident Suga Health outer box</span>
        </label>
      </div>

      <div>
        <label class="text-[10px] font-semibold uppercase tracking-wider text-[#747680] block mb-1">Pharmacist Dispensing Instructions / Delivery Notes:</label>
        <textarea 
          id="pharmacist-notes-input" 
          rows="2" 
          placeholder="e.g. Batch verified from Suga inventory, insulated thermo-pouch prepped, patient instruction guide enclosed..."
          class="w-full text-xs p-2 bg-[#FCFCF9] border border-[#E3E3DC] rounded-lg text-[#16171A] placeholder-[#747680] focus:outline-none focus:border-[#16171A]"
        >${order.pharmacistReview.comments || ''}</textarea>
      </div>
    </div>

    <!-- MAIN CTA BUTTON: MOVE TO DELIVERY SECTION -->
    <div class="pt-3 border-t border-[#E3E3DC]">
      ${isAlreadyInShipping ? `
        <div class="bg-[#D8F3E5] border border-[#B6E6CE] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-[#0D5936] text-white flex items-center justify-center font-bold text-xs shrink-0">
              OK
            </div>
            <div>
              <h4 class="font-bold text-xs text-[#0D5936]">Medication Stock Verified & Moved to Delivery</h4>
              <p class="text-[11px] text-[#0D5936]">Tracking #${order.shipping.trackingId || 'Generated'} · Courier: ${order.shipping.carrier}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="openLabelModal('${order.id}')" class="px-3 py-1.5 rounded-full bg-[#FCFCF9] border border-[#B6E6CE] text-xs font-semibold text-[#0D5936] hover:bg-[#B6E6CE] transition-colors">
              Reprint Label
            </button>
            <a href="shipping.html?highlight=${order.id}" class="px-3.5 py-1.5 rounded-full bg-[#0D5936] text-white text-xs font-semibold hover:bg-[#0a4228] transition-colors flex items-center gap-1">
              <span>Go to Shipping</span>
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      ` : `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span class="text-[11px] text-[#747680] block">Prescription total value:</span>
            <span class="text-lg font-bold font-editorial text-[#16171A]">₹${order.totalAmount.toLocaleString()}</span>
          </div>

          <button 
            onclick="verifyAndMoveToDelivery('${order.id}')"
            ${!canMoveToDelivery ? 'disabled' : ''}
            class="px-6 py-2.5 rounded-full ${canMoveToDelivery ? 'bg-[#16171A] hover:bg-black text-white cursor-pointer' : 'bg-[#E3E3DC] text-[#747680] cursor-not-allowed'} font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>${canMoveToDelivery ? 'Verify Stock & Move to Delivery Section' : 'Cannot Move · 0 Stock in Vault (Restock Required)'}</span>
            <svg class="w-3.5 h-3.5 ${canMoveToDelivery ? 'text-[#E2F1A8]' : 'text-[#747680]'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      `}
    </div>
  `;
}

/**
 * Move Order to Delivery
 */
function verifyAndMoveToDelivery(orderId) {
  const notesInput = document.getElementById("pharmacist-notes-input");
  const notes = notesInput ? notesInput.value : "";

  const result = PharmacyDB.verifyStockAndMoveToDelivery(orderId, notes);

  if (!result.success) {
    showNotification(result.message, "error");
    return;
  }

  showNotification(result.message, "success");

  renderStats();
  renderOrdersList();
  renderOrderDetail();
  renderActivityList();

  showMoveSuccessModal(result.order, result.trackingId);
}

function showMoveSuccessModal(order, trackingId) {
  const modal = document.createElement("div");
  modal.id = "move-success-modal";
  modal.className = "fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4";
  modal.innerHTML = `
    <div class="modal-content bg-[#FCFCF9] w-full max-w-md rounded-2xl p-6 text-center border border-[#E3E3DC]">
      <div class="w-10 h-10 bg-[#E2F1A8] text-[#233306] border border-[#CCE27E] rounded-lg flex items-center justify-center mx-auto text-xs font-bold mb-3">
        OK
      </div>
      <h3 class="text-lg font-bold font-editorial text-[#16171A]">Transferred to Delivery Section</h3>
      <p class="text-xs text-[#747680] mt-1 mb-4 leading-relaxed">
        Inventory deducted and verified. Order <strong>${order.id}</strong> for <strong>${order.patient.name}</strong> has been transferred to courier fulfillment.
      </p>

      <div class="bg-[#F0F0EA] border border-[#E3E3DC] rounded-xl p-3 mb-4 text-left text-xs space-y-1">
        <div class="flex justify-between">
          <span class="text-[#747680]">Prescription ID:</span>
          <span class="font-mono font-bold text-[#16171A]">${order.rxId}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[#747680]">Prescribed Generic:</span>
          <span class="font-semibold text-[#16171A]">${order.items[0]?.genericName || order.items[0]?.name}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[#747680]">Commercial Brand:</span>
          <span class="font-bold text-[#16171A]">${order.items[0]?.selectedBrand || order.items[0]?.name}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[#747680]">Tracking Number:</span>
          <span class="font-mono font-bold text-[#16171A]">${trackingId}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[#747680]">Assigned Carrier:</span>
          <span class="font-semibold text-[#16171A]">${order.shipping.carrier}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[#747680]">Destination:</span>
          <span class="font-medium text-[#16171A]">${order.patient.city}</span>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <a href="shipping.html?highlight=${order.id}" class="w-full py-2.5 bg-[#16171A] hover:bg-black text-white font-semibold text-xs rounded-full transition-colors">
          Go to Shipping Page Now
        </a>
        <button onclick="closeSuccessModalAndPrint('${order.id}')" class="w-full py-2 bg-[#F0F0EA] hover:bg-[#E8E8E1] text-[#16171A] font-semibold text-xs rounded-full border border-[#E3E3DC] transition-colors">
          Print Shipping & Rx Label
        </button>
        <button onclick="closeSuccessModal()" class="w-full py-1.5 text-[#747680] hover:text-[#16171A] text-xs font-medium">
          Continue Dispensing
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeSuccessModal() {
  const modal = document.getElementById("move-success-modal");
  if (modal) modal.remove();
}

function closeSuccessModalAndPrint(orderId) {
  closeSuccessModal();
  openLabelModal(orderId);
}

/**
 * Filter handlers
 */
function setStatusFilter(status) {
  statusFilter = status;
  ['all', 'new', 'stock_checking', 'ready_for_shipping'].forEach(s => {
    const el = document.getElementById(`tab-${s}`);
    if (el) {
      if (s === status) {
        el.className = "px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#16171A] text-white";
      } else {
        el.className = "px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#FCFCF9] border border-[#E3E3DC] text-[#4E5057] hover:bg-[#F0F0EA]";
      }
    }
  });

  showOrdersSkeleton();
  setTimeout(() => {
    renderOrdersList();
  }, 100);
}

function setCategoryFilter(category) {
  categoryFilter = category;
  ['all', 'Weight loss', 'Hair growth', 'Sexual health'].forEach(c => {
    const el = document.getElementById(`cat-${c}`);
    if (el) {
      if (c === category) {
        el.className = "px-3 py-1 rounded-full font-semibold bg-[#16171A] text-white";
      } else {
        el.className = "px-3 py-1 rounded-full font-medium bg-[#FCFCF9] border border-[#E3E3DC] text-[#4E5057] hover:bg-[#F0F0EA]";
      }
    }
  });

  showOrdersSkeleton();
  setTimeout(() => {
    renderOrdersList();
  }, 100);
}

function handleSearch(val) {
  searchQuery = val;
  renderOrdersList();
}

/**
 * New Order Modal & Real Formulation Picker
 */
function populateMedicationDropdown() {
  const select = document.getElementById("order-med-select");
  if (!select) return;

  let inventory = PharmacyDB.getInventory();
  if (!inventory || inventory.length === 0) {
    inventory = DEFAULT_INVENTORY;
  }
  select.innerHTML = inventory.map(item => `
    <option value="${item.id}" data-category="${item.category}" data-price="${item.price}" data-unit="${item.unit}" data-cold="${item.isColdChain}">
      ${item.genericName} (${item.brandExamples.join(' / ')}) · Stock: ${item.currentStock || 0}
    </option>
  `).join('');

  if (inventory.length > 0) {
    onMedSelectChange(inventory[0].id);
  }
}

function onMedSelectChange(medId) {
  let inventory = PharmacyDB.getInventory();
  let med = inventory.find(m => m.id === medId);
  if (!med) {
    med = DEFAULT_INVENTORY.find(m => m.id === medId);
  }
  const dosageInput = document.getElementById("order-med-dosage");
  const brandSelect = document.getElementById("order-brand-select");

  if (!med) return;

  // Populate brand selector
  if (brandSelect && med.brandExamples) {
    brandSelect.innerHTML = med.brandExamples.map(b => `
      <option value="${b}">${b}</option>
    `).join('');
  }

  if (dosageInput) {
    if (med.id === "MED-TRZ-01") {
      dosageInput.value = "0.5 mL (2.5 mg) subcutaneously once weekly for 4 weeks";
    } else if (med.id === "MED-ORL-02") {
      dosageInput.value = "1 capsule three times daily with fat-containing meals";
    } else if (med.id === "MED-MNX-03") {
      dosageInput.value = "Apply 1 mL twice daily using calibrated dropper to dry scalp";
    } else if (med.id === "MED-MNF-04") {
      dosageInput.value = "Apply 1 mL twice daily using dropper to thinning area";
    } else if (med.id === "MED-OMX-05") {
      dosageInput.value = "Take 1 tablet daily with water after breakfast";
    } else if (med.id === "MED-SLD-06") {
      dosageInput.value = "Take 1 tablet with water 30-60 minutes prior to activity";
    } else if (med.id === "MED-TDL-07") {
      dosageInput.value = "Take 1 tablet with water 30 minutes before activity (lasts up to 36h)";
    } else if (med.id === "MED-DPX-08") {
      dosageInput.value = "Take 1 tablet with water 1-3 hours before planned activity";
    }
  }
}

function openNewOrderModal() {
  populateMedicationDropdown();
  const modal = document.getElementById("new-order-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeNewOrderModal() {
  const modal = document.getElementById("new-order-modal");
  if (modal) modal.classList.add("hidden");
}

function clearOrdersQueue() {
  PharmacyDB.clearOrders();
  selectedOrderId = null;
  renderStats();
  renderOrdersList();
  renderOrderDetail();
  renderActivityList();
  showNotification("Prescription queue cleared.");
}

function loadSampleOrders() {
  PharmacyDB.loadSampleOrders();
  const orders = PharmacyDB.getOrders();
  if (orders.length > 0) {
    selectedOrderId = orders[0].id;
  }
  renderStats();
  renderOrdersList();
  renderOrderDetail();
  renderActivityList();
  showNotification("Sample orders loaded for clinical inspection.", "success");
}

function handleNewOrderSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("order-patient-name").value.trim();
  const phone = document.getElementById("order-patient-phone").value.trim();
  const age = parseInt(document.getElementById("order-patient-age").value, 10);
  const gender = document.getElementById("order-patient-gender").value;
  const city = document.getElementById("order-patient-city").value.trim();
  const address = document.getElementById("order-patient-address").value.trim();
  const rawAllergies = document.getElementById("order-patient-allergies").value.trim();
  const allergies = rawAllergies ? rawAllergies.split(',').map(s => s.trim()).filter(Boolean) : [];

  const docRaw = document.getElementById("order-doctor-select").value.split('|');
  const doctor = {
    name: docRaw[0],
    credentials: docRaw[1],
    regNo: docRaw[2]
  };

  const medId = document.getElementById("order-med-select").value;
  const inventory = PharmacyDB.getInventory();
  const med = inventory.find(m => m.id === medId);

  const brandSelect = document.getElementById("order-brand-select");
  const selectedBrand = brandSelect ? brandSelect.value : med.brandExamples[0];

  const dosage = document.getElementById("order-med-dosage").value.trim();
  const qty = parseInt(document.getElementById("order-med-qty").value, 10) || 1;

  const patientData = {
    name,
    phone,
    age,
    gender,
    city,
    address,
    allergies,
    conditions: `${med.category} Consultation`,
    notes: allergies.length > 0 ? `Patient reported allergy: ${allergies.join(', ')}` : "Verified consultation"
  };

  const medItemData = {
    medId: med.id,
    name: `${med.genericName} (${selectedBrand})`,
    genericName: med.genericName,
    selectedBrand: selectedBrand,
    brandExamples: med.brandExamples,
    dosage,
    qty,
    unit: med.unit,
    duration: "30 Days",
    batchNumber: med.batchNumber,
    isColdChain: med.isColdChain,
    price: med.price * qty
  };

  const created = PharmacyDB.createOrder(patientData, doctor, medItemData);

  closeNewOrderModal();
  selectedOrderId = created.id;

  renderStats();
  renderOrdersList();
  renderOrderDetail();
  renderActivityList();

  showNotification(`New Rx order ${created.id} received for ${created.patient.name}`, "success");
}

function clearAllOrdersPrompt() {
  if (confirm("Clear all active orders from queue?")) {
    PharmacyDB.clearOrders();
    selectedOrderId = null;
    renderStats();
    renderOrdersList();
    renderOrderDetail();
    renderActivityList();
    showNotification("Order queue cleared.", "info");
  }
}

/**
 * Printable Shipping & Rx Label Generator
 */
function openLabelModal(orderId) {
  const order = PharmacyDB.getOrders().find(o => o.id === orderId);
  if (!order) return;

  const content = document.getElementById("printable-label-content");
  const tracking = order.shipping.trackingId || `BD-${Math.floor(100000000 + Math.random() * 900000000)}`;

  content.innerHTML = `
    <div class="border-2 border-[#16171A] rounded-xl p-6 font-mono text-xs text-[#16171A] bg-[#FCFCF9]">
      
      <div class="flex items-center justify-between pb-3 border-b-2 border-[#16171A]">
        <div class="flex items-center gap-2">
          <img src="assets/images/suga-logo.png" alt="suga.health - Live Naturally" class="h-8 w-auto object-contain">
          <span class="text-[10px] bg-[#F0F0EA] border border-[#E3E3DC] px-1.5 py-0.2 rounded font-sans ml-1">CLINICAL DISPENSARY</span>
        </div>
        <div class="text-right">
          <div class="font-bold text-xs">PRIORITY EXPRESS HEALTH</div>
          <div class="text-[10px] text-[#4E5057]">${order.shipping.carrier}</div>
        </div>
      </div>

      <div class="py-3 text-center border-b border-dashed border-[#C8C8BE]">
        <div class="inline-block bg-[#16171A] h-9 w-60 tracking-widest text-[9px] text-white flex items-center justify-center font-bold">
          ||||| |||| |||||| ||||||| ||||| |||| ||||||
        </div>
        <div class="text-xs font-bold mt-1 tracking-widest">${tracking}</div>
      </div>

      <div class="grid grid-cols-2 gap-4 py-3 border-b-2 border-[#16171A]">
        <div>
          <span class="text-[10px] text-[#747680] uppercase block font-bold">Deliver To (Patient):</span>
          <div class="font-sans font-bold text-sm text-[#16171A] mt-0.5">${order.patient.name}</div>
          <div class="font-sans text-xs text-[#4E5057] mt-0.5 leading-snug">${order.patient.address}</div>
          <div class="font-sans text-xs font-bold mt-1">Ph: ${order.patient.phone}</div>
        </div>
        <div>
          <span class="text-[10px] text-[#747680] uppercase block font-bold">Dispensed By:</span>
          <div class="font-sans font-bold text-xs text-[#16171A]">Suga Central Vault Pharmacy</div>
          <div class="font-sans text-[11px] text-[#4E5057]">Lic #: TN-PH-82914</div>
          <div class="font-sans text-[11px] text-[#4E5057]">Pharmacist: Licensed Pharmacist on Duty</div>
          <div class="font-sans text-[11px] text-[#4E5057] mt-0.5">Prescriber: ${order.doctor.name} (${order.doctor.credentials})</div>
        </div>
      </div>

      <div class="py-3 border-b-2 border-[#16171A]">
        <span class="text-[10px] text-[#747680] uppercase block font-bold mb-1.5">Dispensed Medication & Dosage:</span>
        <div class="space-y-1.5 font-sans">
          ${order.items.map(i => `
            <div class="flex justify-between items-start text-xs bg-[#F0F0EA] p-2 rounded border border-[#E3E3DC]">
              <div>
                <span class="font-bold text-[#16171A]">${i.genericName || i.name}</span>
                <span class="text-[11px] font-semibold text-[#0D5936] block">Commercial Brand: ${i.selectedBrand || i.name}</span>
                <span class="text-[10px] text-[#4E5057] block">${i.dosage}</span>
                <span class="text-[10px] font-mono text-[#747680]">Batch: ${i.batchAssigned}</span>
              </div>
              <span class="font-bold text-[#16171A]">Qty: ${i.qty} ${i.unit}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="pt-2.5 flex items-center justify-between font-sans text-[11px]">
        <div class="flex items-center gap-2">
          ${order.items.some(i => i.requiresColdChain) ? '<span class="badge-cold px-2 py-0.2 text-[10px] font-bold">COLD CHAIN 2-8°C</span>' : ''}
          <span class="bg-[#F0F0EA] text-[#4E5057] border border-[#E3E3DC] font-bold px-2 py-0.2 rounded text-[10px]">DISCREET PACKAGE</span>
        </div>
        <div class="text-right text-[10px] text-[#747680] font-mono">
          Rx: ${order.rxId} · Order: ${order.id}
        </div>
      </div>

    </div>
  `;

  const modal = document.getElementById("label-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeLabelModal() {
  const modal = document.getElementById("label-modal");
  if (modal) modal.classList.add("hidden");
}

function toggleActivityDrawer() {
  const drawer = document.getElementById("activity-drawer");
  if (drawer) drawer.classList.toggle("translate-x-full");
}

function renderActivityList() {
  const list = document.getElementById("activity-list");
  if (!list) return;

  const activity = PharmacyDB.getActivity();
  if (activity.length === 0) {
    list.innerHTML = `
      <div class="py-12 text-center text-[#747680]">
        <svg class="w-8 h-8 mx-auto text-[#9DA0AA] mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
        <p class="font-semibold text-xs text-[#16171A]">No Audit Logs Recorded</p>
        <p class="text-[11px] text-[#747680] mt-1 leading-relaxed">Dispensing events, stock allocations, and courier transfers will be logged here automatically.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = activity.map(item => `
    <div class="pb-2.5 border-b border-[#E3E3DC] last:border-0">
      <div class="flex items-center justify-between text-[#747680] text-[10px] mb-0.5">
        <span class="font-bold uppercase tracking-wider">${item.type}</span>
        <span>${item.time}</span>
      </div>
      <p class="text-[#16171A] leading-relaxed">${item.text}</p>
    </div>
  `).join('');
}

function showNotification(msg, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  
  let bg = "bg-[#16171A] text-white";
  if (type === "success") bg = "bg-[#0D5936] text-white";
  if (type === "error") bg = "bg-[#A81B1B] text-white";

  toast.className = `toast px-3.5 py-2.5 rounded-lg text-xs font-medium ${bg} flex items-center gap-2 max-w-sm`;
  toast.innerHTML = `
    <span>${msg}</span>
    <button onclick="this.parentElement.remove()" class="ml-auto opacity-70 hover:opacity-100 text-sm">&times;</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}
