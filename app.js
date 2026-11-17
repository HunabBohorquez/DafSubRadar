/**
 * SubRadar — Radar Inteligente de Suscripciones y Gastos Hormiga
 * Arquitectura modular en Vanilla JavaScript ES6+ sin dependencias externas.
 */

const PERIOD_FACTORS = Object.freeze({
  Semanal: 52,
  Mensual: 12,
  Bimestral: 6,
  Anual: 1
});

const CATEGORY_COLORS = Object.freeze({
  Streaming: "#3b82f6",
  "Software/Nube": "#10b981",
  "Salud/Gimnasio": "#f59e0b",
  Servicios: "#8b5cf6",
  Otro: "#ec4899"
});

const DEMO_SUBSCRIPTIONS = [
  {
    id: "demo-1",
    name: "Netflix Premium",
    category: "Streaming",
    amount: 299.0,
    periodicity: "Mensual",
    nextBillingDate: "2026-12-01"
  },
  {
    id: "demo-2",
    name: "Spotify Duo",
    category: "Streaming",
    amount: 169.0,
    periodicity: "Mensual",
    nextBillingDate: "2026-12-04"
  },
  {
    id: "demo-3",
    name: "Google AI Pro / Cloud",
    category: "Software/Nube",
    amount: 399.0,
    periodicity: "Mensual",
    nextBillingDate: "2026-12-10"
  },
  {
    id: "demo-4",
    name: "Microsoft 365 Personal",
    category: "Software/Nube",
    amount: 1749.0,
    periodicity: "Anual",
    nextBillingDate: "2027-03-15"
  },
  {
    id: "demo-5",
    name: "Smart Fit Black",
    category: "Salud/Gimnasio",
    amount: 599.0,
    periodicity: "Mensual",
    nextBillingDate: "2026-12-05"
  },
  {
    id: "demo-6",
    name: "Agua Purificada Semanal",
    category: "Servicios",
    amount: 110.0,
    periodicity: "Semanal",
    nextBillingDate: "2026-11-23"
  },
  {
    id: "demo-7",
    name: "Recibo de Luz CFE",
    category: "Servicios",
    amount: 650.0,
    periodicity: "Bimestral",
    nextBillingDate: "2026-12-18"
  },
  {
    id: "demo-8",
    name: "Club Café de Especialidad",
    category: "Otro",
    amount: 420.0,
    periodicity: "Bimestral",
    nextBillingDate: "2026-12-20"
  }
];

const SYNTHETIC_CSV_CONTENT = `fecha,comercio,monto
2026-08-05,Amazon Prime,99.00
2026-09-05,Amazon Prime,99.00
2026-10-05,Amazon Prime,119.00
2026-08-12,iCloud+ 200GB,49.00
2026-09-12,iCloud+ 200GB,49.00
2026-10-12,iCloud+ 200GB,49.00
2026-08-18,Totalplay Fibra,659.00
2026-09-18,Totalplay Fibra,699.00
2026-09-22,Uber One,70.00
2026-10-22,Uber One,70.00
2026-09-03,Cafeteria El Grano,85.00
2026-09-15,Cafeteria El Grano,90.00
2026-10-10,Ferreteria Central,340.00`;

/**
 * Módulo 1: SubscriptionCalc
 * Normalizador financiero, formato de moneda y métricas agregadas.
 */
class SubscriptionCalc {
  static toAnnual(amount, periodicity) {
    const factor = PERIOD_FACTORS[periodicity] || 12;
    return Number(amount) * factor;
  }

  static toMonthly(amount, periodicity) {
    return this.toAnnual(amount, periodicity) / 12;
  }

  static toDaily(amount, periodicity) {
    return this.toAnnual(amount, periodicity) / 365;
  }

  static summarize(subscriptions) {
    const annualTotal = subscriptions.reduce(
      (acc, sub) => acc + this.toAnnual(sub.amount, sub.periodicity),
      0
    );
    return {
      daily: annualTotal / 365,
      monthly: annualTotal / 12,
      annual: annualTotal,
      count: subscriptions.length
    };
  }

  static groupAnnualByCategory(subscriptions) {
    const totals = {
      Streaming: 0,
      "Software/Nube": 0,
      "Salud/Gimnasio": 0,
      Servicios: 0,
      Otro: 0
    };

    for (const sub of subscriptions) {
      const cat = Object.prototype.hasOwnProperty.call(totals, sub.category)
        ? sub.category
        : "Otro";
      totals[cat] += this.toAnnual(sub.amount, sub.periodicity);
    }

    return Object.entries(totals)
      .map(([category, annualAmount]) => ({
        category,
        annualAmount,
        color: CATEGORY_COLORS[category] || "#64748b"
      }))
      .filter((item) => item.annualAmount > 0)
      .sort((a, b) => b.annualAmount - a.annualAmount);
  }

  static formatCurrency(value) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  }
}

/**
 * Módulo 2: SubStore
 * Capa de persistencia en localStorage, CRUD e importación/exportación.
 */
class SubStore {
  constructor(storageKey = "subradar_subscriptions_v1") {
    this.storageKey = storageKey;
    this.items = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error leyendo localStorage:", error);
      return [];
    }
  }

  _save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (error) {
      console.error("Error guardando en localStorage:", error);
    }
  }

  getAll() {
    return [...this.items];
  }

  add(payload) {
    const newItem = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: payload.name.trim(),
      category: payload.category,
      amount: Number(parseFloat(payload.amount).toFixed(2)),
      periodicity: payload.periodicity,
      nextBillingDate: payload.nextBillingDate
    };
    this.items.unshift(newItem);
    this._save();
    return newItem;
  }

  update(id, payload) {
    const idx = this.items.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    this.items[idx] = {
      ...this.items[idx],
      name: payload.name.trim(),
      category: payload.category,
      amount: Number(parseFloat(payload.amount).toFixed(2)),
      periodicity: payload.periodicity,
      nextBillingDate: payload.nextBillingDate
    };
    this._save();
    return this.items[idx];
  }

  remove(id) {
    this.items = this.items.filter((item) => item.id !== id);
    this._save();
  }

  loadDemo() {
    this.items = DEMO_SUBSCRIPTIONS.map((item) => ({ ...item }));
    this._save();
    return this.getAll();
  }

  exportAsJson() {
    const payload = {
      app: "SubRadar",
      exportedAt: new Date().toISOString(),
      summary: SubscriptionCalc.summarize(this.items),
      subscriptions: this.items
    };
    return JSON.stringify(payload, null, 2);
  }
}

/**
 * Módulo 3: CsvPatternDetector
 * Motor local de análisis de estados de cuenta CSV (fecha,comercio,monto).
 */
class CsvPatternDetector {
  static parseCsv(csvText) {
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) return [];

    const records = [];
    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cols.length < 3) continue;

      // Saltar encabezado si existe
      if (i === 0 && /fecha/i.test(cols[0]) && /comercio/i.test(cols[1])) {
        continue;
      }

      const [dateStr, merchantRaw, amountRaw] = cols;
      const amount = parseFloat(amountRaw.replace(/[^0-9.-]/g, ""));
      const monthKey = this._extractYearMonth(dateStr);

      if (!merchantRaw || Number.isNaN(amount) || amount <= 0 || !monthKey) {
        continue;
      }

      records.push({
        date: dateStr,
        monthKey,
        merchant: merchantRaw,
        normalizedKey: merchantRaw.toLowerCase(),
        amount
      });
    }

    return records;
  }

  static _extractYearMonth(dateStr) {
    // Soporta YYYY-MM-DD o YYYY/MM/DD
    const isoMatch = dateStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}`;

    // Soporta DD/MM/YYYY o DD-MM-YYYY
    const latamMatch = dateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (latamMatch) return `${latamMatch[3]}-${latamMatch[2]}`;

    return null;
  }

  static detectRecurrences(csvText) {
    const records = this.parseCsv(csvText);
    const grouped = new Map();

    for (const rec of records) {
      if (!grouped.has(rec.normalizedKey)) {
        grouped.set(rec.normalizedKey, {
          merchant: rec.merchant,
          charges: []
        });
      }
      grouped.get(rec.normalizedKey).charges.push(rec);
    }

    const findings = [];

    for (const group of grouped.values()) {
      // Ordenar cronológicamente por fecha
      group.charges.sort((a, b) => a.date.localeCompare(b.date));

      const distinctMonths = new Set(group.charges.map((c) => c.monthKey));
      if (distinctMonths.size < 2) continue;

      const totalSpent = group.charges.reduce((sum, c) => sum + c.amount, 0);
      const monthlyAverage = Number((totalSpent / distinctMonths.size).toFixed(2));
      const firstCharge = group.charges[0].amount;
      const lastCharge = group.charges[group.charges.length - 1].amount;
      const hasPriceHike = lastCharge > firstCharge;
      const hikePercent = hasPriceHike
        ? Number((((lastCharge - firstCharge) / firstCharge) * 100).toFixed(1))
        : 0;

      findings.push({
        merchant: group.merchant,
        chargeCount: group.charges.length,
        distinctMonthsCount: distinctMonths.size,
        monthsList: Array.from(distinctMonths).sort(),
        monthlyAverage,
        firstCharge,
        lastCharge,
        hasPriceHike,
        hikePercent,
        suggestedCategory: this._inferCategory(group.merchant)
      });
    }

    return findings.sort((a, b) => b.monthlyAverage - a.monthlyAverage);
  }

  static _inferCategory(merchant) {
    const m = merchant.toLowerCase();
    if (/netflix|spotify|prime|disney|hbo|max|youtube/.test(m)) return "Streaming";
    if (/icloud|google|microsoft|adobe|github|openai|dropbox/.test(m)) return "Software/Nube";
    if (/gym|fit|salud|farmacia|smart/.test(m)) return "Salud/Gimnasio";
    if (/totalplay|telmex|cfe|agua|izzi|uber/.test(m)) return "Servicios";
    return "Otro";
  }
}

/**
 * Módulo 4: CategoryChart
 * Visualización nativa en <canvas> con gráfico de dona y soporte HiDPI.
 */
class CategoryChart {
  constructor(canvasEl, legendEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext("2d");
    this.legendEl = legendEl;
  }

  render(categoryData, totalAnnual) {
    const dpr = window.devicePixelRatio || 1;
    const logicalSize = 320;
    this.canvas.width = logicalSize * dpr;
    this.canvas.height = logicalSize * dpr;
    this.canvas.style.width = `${logicalSize}px`;
    this.canvas.style.height = `${logicalSize}px`;

    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, logicalSize, logicalSize);

    const cx = logicalSize / 2;
    const cy = logicalSize / 2;
    const outerRadius = 128;
    const innerRadius = 78;

    if (!categoryData.length || totalAnnual <= 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
      ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2, true);
      ctx.fillStyle = "#1e293b";
      ctx.fill();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Sin datos activos", cx, cy);
      this.legendEl.innerHTML = "";
      return;
    }

    let startAngle = -Math.PI / 2;

    for (const slice of categoryData) {
      const fraction = slice.annualAmount / totalAnnual;
      const sweepAngle = fraction * Math.PI * 2;
      const endAngle = startAngle + sweepAngle;

      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();

      // Separador sutil entre segmentos
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#162033";
      ctx.stroke();

      startAngle = endAngle;
    }

    // Texto central de la dona
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 12px sans-serif";
    ctx.fillText("TOTAL ANUAL", cx, cy - 12);

    ctx.fillStyle = "#f1f5f9";
    ctx.font = "800 17px sans-serif";
    ctx.fillText(SubscriptionCalc.formatCurrency(totalAnnual), cx, cy + 10);

    this._renderLegend(categoryData, totalAnnual);
  }

  _renderLegend(categoryData, totalAnnual) {
    this.legendEl.innerHTML = categoryData
      .map((item) => {
        const pct = ((item.annualAmount / totalAnnual) * 100).toFixed(1);
        return `
          <li>
            <span class="legend-left">
              <span class="legend-dot" style="background:${item.color}"></span>
              <span>${item.category} (${pct}%)</span>
            </span>
            <strong>${SubscriptionCalc.formatCurrency(item.annualAmount)}</strong>
          </li>
        `;
      })
      .join("");
  }
}

/**
 * Controlador Principal de la Aplicación
 */
class SubRadarApp {
  constructor() {
    this.store = new SubStore();
    this.simulatedIds = new Set();
    this.currentFilter = "ALL";
    this.csvFindings = [];

    this.chart = new CategoryChart(
      document.getElementById("categoryChartCanvas"),
      document.getElementById("chartLegend")
    );

    this._bindEvents();
    this.render();
  }

  _bindEvents() {
    // Botones globales del header
    document.getElementById("btnNewSub").addEventListener("click", () => this.openModal());
    document.getElementById("btnLoadDemo").addEventListener("click", () => {
      this.store.loadDemo();
      this.simulatedIds.clear();
      this.render();
      this.showToast("8 suscripciones demo cargadas correctamente.");
    });

    document.getElementById("btnExportJson").addEventListener("click", () => this.handleExportJson());

    // Filtro por categoría
    document.getElementById("filterCategory").addEventListener("change", (e) => {
      this.currentFilter = e.target.value;
      this.renderSubscriptions();
    });

    // Simulador: limpiar selección
    document.getElementById("btnClearSim").addEventListener("click", () => {
      this.simulatedIds.clear();
      this.render();
    });

    // Navegación por pestañas
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.switchTab(btn.dataset.tab));
    });

    // Modal CRUD
    document.getElementById("btnCloseModal").addEventListener("click", () => this.closeModal());
    document.getElementById("btnCancelForm").addEventListener("click", () => this.closeModal());
    document.getElementById("subModal").addEventListener("click", (e) => {
      if (e.target.id === "subModal") this.closeModal();
    });

    document.getElementById("subForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    // Detector CSV
    document.getElementById("btnLoadSyntheticCsv").addEventListener("click", () => {
      this.processCsvText(SYNTHETIC_CSV_CONTENT, "CSV Sintético de Prueba (13 movimientos)");
    });

    document.getElementById("csvFileInput").addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.processCsvText(String(ev.target?.result || ""), file.name);
        e.target.value = "";
      };
      reader.readAsText(file, "UTF-8");
    });
  }

  switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabId);
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `tab-${tabId}`);
    });
  }

  render() {
    const allSubs = this.store.getAll();
    const summary = SubscriptionCalc.summarize(allSubs);

    // Actualizar KPIs
    document.getElementById("kpiDaily").textContent = SubscriptionCalc.formatCurrency(summary.daily);
    document.getElementById("kpiMonthly").textContent = SubscriptionCalc.formatCurrency(summary.monthly);
    document.getElementById("kpiAnnual").textContent = SubscriptionCalc.formatCurrency(summary.annual);
    document.getElementById("kpiCount").textContent =
      `${summary.count} ${summary.count === 1 ? "suscripción activa" : "suscripciones activas"}`;

    this.renderSimulatorBanner(allSubs);
    this.renderSubscriptions();

    const categoryData = SubscriptionCalc.groupAnnualByCategory(allSubs);
    this.chart.render(categoryData, summary.annual);
  }

  renderSimulatorBanner(allSubs) {
    const banner = document.getElementById("simulatorBanner");
    // Limpiar IDs inexistentes
    const validIds = new Set(allSubs.map((s) => s.id));
    for (const id of this.simulatedIds) {
      if (!validIds.has(id)) this.simulatedIds.delete(id);
    }

    if (this.simulatedIds.size === 0) {
      banner.classList.add("hidden");
      return;
    }

    const selectedSubs = allSubs.filter((s) => this.simulatedIds.has(s.id));
    const simSummary = SubscriptionCalc.summarize(selectedSubs);

    document.getElementById("simulatorSummaryText").textContent =
      `Si cancelas ${selectedSubs.length} ${selectedSubs.length === 1 ? "servicio seleccionado" : "servicios seleccionados"}, liberarías este flujo de efectivo:`;
    document.getElementById("simMonthlySavings").textContent = SubscriptionCalc.formatCurrency(simSummary.monthly);
    document.getElementById("simAnnualSavings").textContent = SubscriptionCalc.formatCurrency(simSummary.annual);

    banner.classList.remove("hidden");
  }

  renderSubscriptions() {
    const container = document.getElementById("subscriptionsList");
    const allSubs = this.store.getAll();
    const filtered =
      this.currentFilter === "ALL"
        ? allSubs
        : allSubs.filter((s) => s.category === this.currentFilter);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No hay suscripciones registradas en esta vista.</p>
          <p style="font-size:0.84rem;margin-top:0.35rem;">Agrega un servicio manualmente o usa <strong>"Cargar Datos Demo"</strong>.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered
      .map((sub) => {
        const annualCost = SubscriptionCalc.toAnnual(sub.amount, sub.periodicity);
        const isSimulated = this.simulatedIds.has(sub.id);

        return `
          <article class="sub-card ${isSimulated ? "is-simulated" : ""}" data-id="${sub.id}">
            <div>
              <div class="sub-card__top">
                <h3 class="sub-card__title">${this._escapeHtml(sub.name)}</h3>
                <span class="category-pill">${this._escapeHtml(sub.category)}</span>
              </div>

              <div class="sub-card__price-row">
                <span class="sub-card__amount">${SubscriptionCalc.formatCurrency(sub.amount)}</span>
                <span class="sub-card__period">/ ${sub.periodicity}</span>
              </div>
            </div>

            <div class="sub-card__meta">
              <span>Impacto anual: <strong>${SubscriptionCalc.formatCurrency(annualCost)}</strong></span>
              <span>Próximo cobro: <strong>${this._escapeHtml(sub.nextBillingDate)}</strong></span>
            </div>

            <div class="sub-card__footer">
              <label class="sim-toggle">
                <input type="checkbox" class="js-sim-check" data-id="${sub.id}" ${isSimulated ? "checked" : ""} />
                Simular baja
              </label>

              <div class="card-actions">
                <button type="button" class="btn btn--ghost btn--sm js-edit-btn" data-id="${sub.id}">Editar</button>
                <button type="button" class="btn btn--danger btn--sm js-del-btn" data-id="${sub.id}">Eliminar</button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    // Delegar eventos de cada tarjeta
    container.querySelectorAll(".js-sim-check").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const id = e.target.dataset.id;
        if (e.target.checked) {
          this.simulatedIds.add(id);
        } else {
          this.simulatedIds.delete(id);
        }
        this.render();
      });
    });

    container.querySelectorAll(".js-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sub = this.store.getAll().find((item) => item.id === btn.dataset.id);
        if (sub) this.openModal(sub);
      });
    });

    container.querySelectorAll(".js-del-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        this.store.remove(id);
        this.simulatedIds.delete(id);
        this.render();
        this.showToast("Suscripción eliminada.");
      });
    });
  }

  openModal(subToEdit = null) {
    const modal = document.getElementById("subModal");
    const titleEl = document.getElementById("modalTitle");

    if (subToEdit) {
      titleEl.textContent = "Editar Suscripción";
      document.getElementById("subId").value = subToEdit.id;
      document.getElementById("subName").value = subToEdit.name;
      document.getElementById("subCategory").value = subToEdit.category;
      document.getElementById("subAmount").value = subToEdit.amount;
      document.getElementById("subPeriodicity").value = subToEdit.periodicity;
      document.getElementById("subNextDate").value = subToEdit.nextBillingDate;
    } else {
      titleEl.textContent = "Nueva Suscripción";
      document.getElementById("subForm").reset();
      document.getElementById("subId").value = "";
      document.getElementById("subNextDate").value = new Date().toISOString().split("T")[0];
    }

    modal.classList.remove("hidden");
    document.getElementById("subName").focus();
  }

  closeModal() {
    document.getElementById("subModal").classList.add("hidden");
  }

  handleFormSubmit() {
    const id = document.getElementById("subId").value;
    const payload = {
      name: document.getElementById("subName").value,
      category: document.getElementById("subCategory").value,
      amount: document.getElementById("subAmount").value,
      periodicity: document.getElementById("subPeriodicity").value,
      nextBillingDate: document.getElementById("subNextDate").value
    };

    if (id) {
      this.store.update(id, payload);
      this.showToast("Suscripción actualizada.");
    } else {
      this.store.add(payload);
      this.showToast("Suscripción agregada al radar.");
    }

    this.closeModal();
    this.render();
  }

  processCsvText(csvText, sourceLabel) {
    this.csvFindings = CsvPatternDetector.detectRecurrences(csvText);
    const statusBox = document.getElementById("csvStatusBox");
    const resultsContainer = document.getElementById("csvResultsContainer");

    if (this.csvFindings.length === 0) {
      statusBox.innerHTML = `Análisis completado sobre <strong>${this._escapeHtml(sourceLabel)}</strong>: no se encontraron comercios con cargos en 2 o más meses distintos.`;
      resultsContainer.innerHTML = "";
      return;
    }

    const hikesCount = this.csvFindings.filter((f) => f.hasPriceHike).length;
    statusBox.innerHTML = `
      Archivo analizado localmente: <strong>${this._escapeHtml(sourceLabel)}</strong> —
      Se detectaron <strong>${this.csvFindings.length} comercios recurrentes</strong>
      (${hikesCount} con alerta de subida de tarifa).
    `;

    resultsContainer.innerHTML = this.csvFindings
      .map((item, idx) => {
        const annualProjected = item.monthlyAverage * 12;
        return `
          <article class="csv-finding ${item.hasPriceHike ? "has-hike" : ""}">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.45rem;">
                <h3 style="font-size:1.05rem;">${this._escapeHtml(item.merchant)}</h3>
                <span class="category-pill">${item.suggestedCategory}</span>
              </div>

              <p style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:0.65rem;">
                Detectado en <strong>${item.distinctMonthsCount} meses distintos</strong> (${item.monthsList.join(", ")}) · ${item.chargeCount} cargos.
              </p>

              <div style="font-size:0.9rem;margin-bottom:0.65rem;">
                Promedio mensual: <strong>${SubscriptionCalc.formatCurrency(item.monthlyAverage)}</strong>
                <span style="color:var(--text-secondary);font-size:0.8rem;">(${SubscriptionCalc.formatCurrency(annualProjected)}/año)</span>
              </div>

              ${
                item.hasPriceHike
                  ? `<div class="hike-alert">⚠️ Subida de tarifa detectada (+${item.hikePercent}%): pasó de ${SubscriptionCalc.formatCurrency(item.firstCharge)} a ${SubscriptionCalc.formatCurrency(item.lastCharge)}</div>`
                  : `<span class="stable-badge">✓ Tarifa estable (${SubscriptionCalc.formatCurrency(item.lastCharge)})</span>`
              }
            </div>

            <button type="button" class="btn btn--primary btn--sm js-import-csv-btn" data-index="${idx}">
              + Importar al catálogo mensual
            </button>
          </article>
        `;
      })
      .join("");

    resultsContainer.querySelectorAll(".js-import-csv-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const finding = this.csvFindings[Number(btn.dataset.index)];
        if (!finding) return;

        this.store.add({
          name: finding.merchant,
          category: finding.suggestedCategory,
          amount: finding.monthlyAverage,
          periodicity: "Mensual",
          nextBillingDate: new Date().toISOString().split("T")[0]
        });

        btn.disabled = true;
        btn.textContent = "✓ Importado al catálogo";
        btn.classList.remove("btn--primary");
        btn.classList.add("btn--ghost");

        this.render();
        this.showToast(`"${finding.merchant}" importado como suscripción mensual.`);
      });
    });
  }

  handleExportJson() {
    const jsonString = this.store.exportAsJson();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `subradar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    this.showToast("Respaldo JSON descargado.");
  }

  showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  }

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.subRadarApp = new SubRadarApp();
});
