/* =========================================================
   AMORE WEDDING PLANNER
   COMPLETE FIXED JAVASCRIPT
   ========================================================= */

const STORAGE_KEY = "amoreWeddingPlanner_v4";

const DATABASE_CONFIG = {
  url: "https://gobjoyygnqeyncffniaj.supabase.co",
  anonKey: "sb_publishable_zbEtRXfenh5mFTjpK9CpNQ_D6WeklkQ",
  enabled: true
};

/* =========================================================
   GOOGLE FORM / GOOGLE SHEETS
   ========================================================= */

const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdEwJQC8eqTgoxiGnPgUOrOFZeh6Uf-e78kcmRZXB8zS3n00g/viewform";

const GOOGLE_FORM_EMBED_URL =
  GOOGLE_FORM_URL + "?embedded=true";

const DEFAULT_GOOGLE_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1cudrUKbb93mww58HUkcaOb1odRpiXWcRqQAjXQcIH5o/edit?usp=drivesdk";


/* =========================================================
   DEFAULT DATA
   IMPORTANT:
   NO SAMPLE GUESTS
   NO SAMPLE VENDORS
   NO SAMPLE BUDGET ALLOCATIONS
   ========================================================= */

const DEFAULT_DATA = {
  couple: {
    name: "",
    date: "",
    venue: ""
  },

  budget: {
    total: 0,
    spent: 0,
    categories: []
  },

  additionalExpenses: {
    budget: 0,
    items: []
  },

  guests: [],

  vendors: [],

  tasks: [
    {
      id: 1,
      title: "Book caterer",
      done: false,
      group: "12+ MONTHS BEFORE",
      due: "",
      priority: "High"
    },
    {
      id: 2,
      title: "Book live music or DJ",
      done: false,
      group: "12+ MONTHS BEFORE",
      due: "",
      priority: "Medium"
    },
    {
      id: 3,
      title: "Plan honeymoon destination",
      done: false,
      group: "12+ MONTHS BEFORE",
      due: "",
      priority: "Medium"
    },
    {
      id: 4,
      title: "Send save the dates",
      done: false,
      group: "12+ MONTHS BEFORE",
      due: "",
      priority: "High"
    },
    {
      id: 5,
      title: "Research and book photographer",
      done: false,
      group: "12+ MONTHS BEFORE",
      due: "",
      priority: "High"
    },
    {
      id: 6,
      title: "Choose wedding invitations",
      done: false,
      group: "9–12 MONTHS BEFORE",
      due: "",
      priority: "Medium"
    },
    {
      id: 7,
      title: "Book florist",
      done: false,
      group: "9–12 MONTHS BEFORE",
      due: "",
      priority: "High"
    },
    {
      id: 8,
      title: "Finalize wedding guest list",
      done: false,
      group: "9–12 MONTHS BEFORE",
      due: "",
      priority: "High"
    },
    {
      id: 9,
      title: "Choose wedding dress",
      done: false,
      group: "9–12 MONTHS BEFORE",
      due: "",
      priority: "High"
    },
    {
      id: 10,
      title: "Book hair and makeup",
      done: false,
      group: "6–9 MONTHS BEFORE",
      due: "",
      priority: "Medium"
    },
    {
      id: 11,
      title: "Order wedding rings",
      done: false,
      group: "6–9 MONTHS BEFORE",
      due: "",
      priority: "High"
    },
    {
      id: 12,
      title: "Book ceremony officiant",
      done: false,
      group: "6–9 MONTHS BEFORE",
      due: "",
      priority: "High"
    }
  ],

  notes: [],

  googleRsvp: {
    sheetUrl: DEFAULT_GOOGLE_SHEET_URL,
    responses: [],
    lastSync: "",
    status: "Not connected"
  }
};


/* =========================================================
   GLOBALS
   ========================================================= */

let data = null;
let currentPage = "dashboard";

window.guestQ = "";
window.taskFilter = "all";
window.toastT = null;


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function uid() {
  return Date.now() + Math.floor(Math.random() * 100000);
}

function budgetRemaining(amount, spent) {
  return Number(amount || 0) - Number(spent || 0);
}

function money(n) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(n) || 0);
}

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m];
  });
}

function fmtDate(d) {
  if (!d) return "—";

  const x = new Date(d + "T00:00:00");

  if (isNaN(x)) return "—";

  return x.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function fullDate(d) {
  if (!d) return "";

  const x = new Date(d + "T00:00:00");

  if (isNaN(x)) return "";

  return x.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function daysUntil(d) {
  if (!d) return 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const t = new Date(d + "T00:00:00");

  if (isNaN(t)) return 0;

  return Math.max(
    0,
    Math.ceil((t - now) / 86400000)
  );
}

function pct(a, b) {
  a = Number(a) || 0;
  b = Number(b) || 0;

  if (!b) return 0;

  return Math.min(
    100,
    Math.max(
      0,
      Math.round((a / b) * 100)
    )
  );
}

function ask(message) {
  return window.confirm(message);
}

function toast(message) {
  const x = document.getElementById("toast");

  if (!x) {
    console.log(message);
    return;
  }

  x.textContent = message;
  x.classList.add("show");

  clearTimeout(window.toastT);

  window.toastT = setTimeout(() => {
    x.classList.remove("show");
  }, 2300);
}

function badge(status) {
  const c =
    ["Confirmed", "Booked", "Paid", "Attending"].includes(status)
      ? "green"
      : ["Declined", "Cancelled", "Not Attending"].includes(status)
      ? "red"
      : ["Pending", "Contacted", "RSVP Received"].includes(status)
      ? "orange"
      : "pink";

  return `<span class="badge ${c}">${esc(status || "")}</span>`;
}


/* =========================================================
   NORMALIZE DATA
   ========================================================= */

function normalize() {

  if (!data || typeof data !== "object") {
    data = clone(DEFAULT_DATA);
  }

  if (!data.couple || typeof data.couple !== "object") {
    data.couple = clone(DEFAULT_DATA.couple);
  }

  data.couple.name =
    typeof data.couple.name === "string"
      ? data.couple.name
      : "";

  data.couple.date =
    typeof data.couple.date === "string"
      ? data.couple.date
      : "";

  data.couple.venue =
    typeof data.couple.venue === "string"
      ? data.couple.venue
      : "";

  if (!data.budget || typeof data.budget !== "object") {
    data.budget = clone(DEFAULT_DATA.budget);
  }

  data.budget.total = Number(data.budget.total) || 0;
  data.budget.spent = Number(data.budget.spent) || 0;

  if (!Array.isArray(data.budget.categories)) {
    data.budget.categories = [];
  }

  if (!Array.isArray(data.guests)) {
    data.guests = [];
  }

  if (!Array.isArray(data.vendors)) {
    data.vendors = [];
  }

  if (!Array.isArray(data.tasks)) {
    data.tasks = clone(DEFAULT_DATA.tasks);
  }

  if (!Array.isArray(data.notes)) {
    data.notes = [];
  }

  if (
    !data.additionalExpenses ||
    typeof data.additionalExpenses !== "object"
  ) {
    data.additionalExpenses = {
      budget: 0,
      items: []
    };
  }

  data.additionalExpenses.budget =
    Number(data.additionalExpenses.budget) || 0;

  if (!Array.isArray(data.additionalExpenses.items)) {
    data.additionalExpenses.items = [];
  }

  if (
    !data.googleRsvp ||
    typeof data.googleRsvp !== "object"
  ) {
    data.googleRsvp = clone(DEFAULT_DATA.googleRsvp);
  }

  if (!Array.isArray(data.googleRsvp.responses)) {
    data.googleRsvp.responses = [];
  }

  data.googleRsvp.sheetUrl =
    typeof data.googleRsvp.sheetUrl === "string"
      ? data.googleRsvp.sheetUrl
      : DEFAULT_GOOGLE_SHEET_URL;

  data.googleRsvp.lastSync =
    typeof data.googleRsvp.lastSync === "string"
      ? data.googleRsvp.lastSync
      : "";

  data.googleRsvp.status =
    typeof data.googleRsvp.status === "string"
      ? data.googleRsvp.status
      : "Not connected";


  /* ---------------------------------------------------------
     CLEAN OLD ADDITIONAL EXPENSES CATEGORY
     --------------------------------------------------------- */

  const oldAdditional =
    data.budget.categories.find(
      c =>
        String(c.name || "")
          .trim()
          .toLowerCase() === "additional expenses"
    );

  if (oldAdditional) {

    if (
      data.additionalExpenses.budget === 0 &&
      Number(oldAdditional.amount) > 0
    ) {
      data.additionalExpenses.budget =
        Number(oldAdditional.amount);
    }

    if (
      data.additionalExpenses.items.length === 0 &&
      Number(oldAdditional.spent) > 0
    ) {
      data.additionalExpenses.items.push({
        id: uid(),
        date: new Date()
          .toISOString()
          .slice(0, 10),
        category: "Other",
        description:
          "Existing recorded additional expenses",
        amount: Number(oldAdditional.spent) || 0,
        status: "Paid",
        notes:
          "Migrated from previous Budget page."
      });
    }
  }

  data.budget.categories =
    data.budget.categories.filter(
      c =>
        String(c.name || "")
          .trim()
          .toLowerCase() !== "additional expenses"
    );


  /* ---------------------------------------------------------
     NORMALIZE BUDGET CATEGORIES
     --------------------------------------------------------- */

  data.budget.categories.forEach(c => {

    if (!c.id) c.id = uid();

    c.name = String(c.name || "");

    c.amount = Number(c.amount) || 0;
    c.spent = Number(c.spent) || 0;

    c.remaining =
      budgetRemaining(c.amount, c.spent);
  });


  /* ---------------------------------------------------------
     NORMALIZE ADDITIONAL EXPENSES
     --------------------------------------------------------- */

  data.additionalExpenses.items.forEach(x => {

    if (!x.id) x.id = uid();

    x.date =
      x.date ||
      new Date().toISOString().slice(0, 10);

    x.category =
      x.category || "Other";

    x.description =
      x.description || "Additional expense";

    x.amount =
      Number(x.amount) || 0;

    x.status =
      x.status || "Planned";

    x.notes =
      x.notes || "";
  });


  /* ---------------------------------------------------------
     NORMALIZE VENDORS
     --------------------------------------------------------- */

  data.vendors.forEach(v => {

    if (!v.id) v.id = uid();

    v.category = String(v.category || "");
    v.name = String(v.name || "");
    v.contact = String(v.contact || "");
    v.phone = String(v.phone || "");
    v.email = String(v.email || "");
    v.status = String(v.status || "Pending");

    v.total = Number(v.total) || 0;
    v.paid = Number(v.paid) || 0;

    v.due = String(v.due || "");
    v.notes = String(v.notes || "");
  });


  /* ---------------------------------------------------------
     NORMALIZE GUESTS
     --------------------------------------------------------- */

  data.guests.forEach(g => {

    if (!g.id) g.id = uid();

    g.name = String(g.name || "");
    g.phone = String(g.phone || "");
    g.email = String(g.email || "");
    g.side = String(g.side || "Bride");
    g.meal = String(g.meal || "Standard");
    g.status = String(g.status || "Pending");
    g.plusOne = String(g.plusOne || "No");
    g.notes = String(g.notes || "");
  });


  /* ---------------------------------------------------------
     NORMALIZE TASKS
     --------------------------------------------------------- */

  data.tasks.forEach(t => {

    if (!t.id) t.id = uid();

    t.title = String(t.title || "");
    t.done = Boolean(t.done);
    t.group =
      String(t.group || "12+ MONTHS BEFORE");
    t.due = String(t.due || "");
    t.priority =
      String(t.priority || "Medium");
  });
}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function loadData() {

  try {

    const raw =
      localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      data = clone(DEFAULT_DATA);
    } else {
      data = JSON.parse(raw);
    }

    normalize();

    return data;

  } catch (error) {

    console.error(
      "Could not load saved wedding data:",
      error
    );

    data = clone(DEFAULT_DATA);

    normalize();

    return data;
  }
}


function saveData() {

  try {

    normalize();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    return true;

  } catch (error) {

    console.error(
      "Could not save wedding data:",
      error
    );

    toast(
      "Could not save data. Check browser storage."
    );

    return false;
  }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

document
  .querySelectorAll(".nav-item")
  .forEach(button => {

    button.onclick = () =>
      navigate(button.dataset.page);

  });


document
  .getElementById("menuBtn")
  ?.addEventListener(
    "click",
    () => {
      document
        .querySelector(".sidebar")
        ?.classList.toggle("open");
    }
  );


function navigate(page) {

  currentPage = page;

  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === page
      );

    });

  document
    .querySelectorAll(".page")
    .forEach(p =>
      p.classList.remove("active-page")
    );

  const target =
    document.getElementById(page);

  if (target) {
    target.classList.add("active-page");
  }

  document
    .querySelector(".sidebar")
    ?.classList.remove("open");

  render();
}


/* =========================================================
   RENDER
   ========================================================= */

function render() {

  const pages = {
    dashboard: renderDashboard,
    budget: renderBudget,
    "additional-expenses":
      renderAdditionalExpenses,
    guests: renderGuests,
    vendors: renderVendors,
    tasks: renderTasks,
    notes: renderNotes,
    settings: renderSettings
  };

  (
    pages[currentPage] ||
    renderDashboard
  )();
}


/* =========================================================
   STAT CARD
   ========================================================= */

function stat(
  icon,
  title,
  value,
  detail
) {

  return `
    <div class="card">
      <div class="stat-icon">${icon}</div>
      <div class="stat-title">${title}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-detail">${detail}</div>
    </div>
  `;
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {

  const spent =
    data.budget.categories.reduce(
      (total, category) =>
        total +
        (Number(category.spent) || 0),
      0
    );

  data.budget.spent = spent;

  const done =
    data.tasks.filter(
      task => task.done
    ).length;

  const remaining =
    Math.max(
      0,
      Number(data.budget.total) -
      spent
    );

  const coupleName =
    data.couple.name ||
    "Your Wedding";

  const weddingDate =
    fullDate(data.couple.date);

  const venue =
    data.couple.venue
      ? " · " + esc(data.couple.venue)
      : "";

  const countdown =
    data.couple.date
      ? daysUntil(data.couple.date)
      : "—";


  document.getElementById(
    "dashboard"
  ).innerHTML = `

    <div class="topline">

      <div>

        <div class="eyebrow">
          ♥
        </div>

        <h1>
          ${esc(coupleName)}
        </h1>

        <div class="subtitle">
          ${weddingDate}${venue}
        </div>

      </div>

      <button
        class="btn"
        onclick="openCoupleModal()"
      >
        Edit Wedding Details
      </button>

    </div>


    <div class="countdown">

      <div class="count-circle">

        <strong>
          ${countdown}
        </strong>

        <small>
          days
        </small>

      </div>

      <div>

        <div class="label">
          COUNTDOWN
        </div>

        <h2>
          Kasalan Na!!!!
        </h2>

        <div>
          ${
            data.couple.date
              ? `${countdown} days until the wedding.`
              : "Set your wedding date in Wedding Details."
          }
        </div>

      </div>

    </div>


    <div class="grid grid-4 stats">

      ${stat(
        "₱",
        "Budget",
        money(data.budget.total),
        money(spent) + " spent"
      )}

      ${stat(
        "♧",
        "Guests",
        data.guests.length,
        data.guests.filter(
          g =>
            g.status === "Confirmed" ||
            g.status === "Attending"
        ).length +
        " confirmed"
      )}

      ${stat(
        "✓",
        "Tasks",
        done + "/" + data.tasks.length,
        pct(done, data.tasks.length) +
        "% done"
      )}

      ${stat(
        "▥",
        "Vendors",
        data.vendors.length,
        data.vendors.filter(
          v => v.status === "Booked"
        ).length +
        " booked"
      )}

    </div>


    <div class="section-title">
      Budget Progress
    </div>

    <div class="card">

      <div class="summary">

        <span>Spent</span>
        <b>${money(spent)}</b>

        <span>Remaining</span>
        <b>${money(remaining)}</b>

      </div>

      <div
        class="progress"
        style="margin-top:12px"
      >
        <div
          style="width:${pct(
            spent,
            data.budget.total
          )}%"
        ></div>
      </div>

    </div>


    <div class="section-title">
      Up Next
    </div>

    <div class="card">

      ${
        (() => {

          const t =
            data.tasks.find(
              x => !x.done
            );

          if (!t) {
            return "All tasks are complete. ♥";
          }

          return `
            <div
              style="
                display:flex;
                gap:13px;
                align-items:center
              "
            >

              <div class="stat-icon">
                ✓
              </div>

              <div>

                <h3>
                  ${esc(t.title)}
                </h3>

                <div class="small muted">

                  ${esc(t.group)}

                  ${
                    t.due
                      ? " · Due " +
                        fmtDate(t.due)
                      : ""
                  }

                </div>

              </div>

            </div>
          `;

        })()
      }

    </div>


    <div class="section-title">
      Quick Access
    </div>

    <div class="grid grid-4">

      ${quick(
        "₱",
        "Budget",
        "budget"
      )}

      ${quick(
        "＋",
        "Additional Expenses",
        "additional-expenses"
      )}

      ${quick(
        "♧",
        "Guests",
        "guests"
      )}

      ${quick(
        "▥",
        "Vendors",
        "vendors"
      )}

    </div>

  `;
}


function quick(icon, title, page) {

  return `
    <button
      class="card"
      style="
        text-align:left;
        border:1px solid var(--line)
      "
      onclick="navigate('${page}')"
    >

      <div class="stat-icon">
        ${icon}
      </div>

      <h3 style="margin-top:10px">
        ${title}
      </h3>

      <div class="small muted">
        Open ${title}
      </div>

    </button>
  `;
}


/* =========================================================
   BUDGET
   ========================================================= */

function renderBudget() {

  const total =
    Number(data.budget.total) || 0;

  const allocated =
    data.budget.categories.reduce(
      (sum, category) =>
        sum +
        (Number(category.amount) || 0),
      0
    );

  const spent =
    data.budget.categories.reduce(
      (sum, category) =>
        sum +
        (Number(category.spent) || 0),
      0
    );

  data.budget.spent = spent;

  const remaining =
    total - spent;


  document.getElementById(
    "budget"
  ).innerHTML = `

    <div class="topline">

      <div>

        <div class="eyebrow">
          BUDGET
        </div>

        <h1>
          Your Budget
        </h1>

        <div class="subtitle">
          All amounts are in Philippine Peso.
        </div>

      </div>

      <button
        class="btn"
        onclick="openBudgetModal()"
      >
        ＋ Add Allocation
      </button>

    </div>


    <div class="grid grid-4">

      <div class="card">
        <div class="stat-title">
          TOTAL BUDGET
        </div>

        <div class="big-number">
          ${money(total)}
        </div>
      </div>


      <div class="card">
        <div class="stat-title">
          ALLOCATED
        </div>

        <div class="big-number">
          ${money(allocated)}
        </div>
      </div>


      <div class="card">
        <div class="stat-title">
          DOWN PAYMENT
        </div>

        <div class="big-number">
          ${money(spent)}
        </div>
      </div>


      <div class="card">
        <div class="stat-title">
          REMAINING
        </div>

        <div class="big-number">
          ${money(remaining)}
        </div>
      </div>

    </div>


    <div
      class="card"
      style="margin-top:16px"
    >

      <div class="summary">

        <b>
          Budget Monitoring
        </b>

        <b>
          ${pct(spent, total)}%
        </b>

      </div>

      <div
        class="progress"
        style="margin-top:10px"
      >
        <div
          style="
            width:${pct(
              spent,
              total
            )}%
          "
        ></div>
      </div>

      <div
        class="summary"
        style="margin-top:12px"
      >

        <span>Budget</span>
        <b>${money(total)}</b>

        <span>Spent</span>
        <b>${money(spent)}</b>

        <span>Remaining</span>
        <b>${money(remaining)}</b>

      </div>


      ${
        spent > total &&
        total > 0
          ? `
            <div
              class="alert"
              style="margin-top:14px"
            >
              You are
              ${money(spent - total)}
              over the total wedding budget.
            </div>
          `
          : ""
      }

    </div>


    <div class="section-title">
      Budget Allocations
    </div>


    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>Category</th>
            <th>Allocated</th>
            <th>Down Payment</th>
            <th>Remaining</th>
            <th>Progress</th>
            <th>Actions</th>

          </tr>

        </thead>


        <tbody>

          ${
            data.budget.categories.length

              ? data.budget.categories
                  .map(category => {

                    const amount =
                      Number(
                        category.amount
                      ) || 0;

                    const categorySpent =
                      Number(
                        category.spent
                      ) || 0;

                    const categoryRemaining =
                      amount -
                      categorySpent;

                    return `

                      <tr>

                        <td>
                          <b>
                            ${esc(
                              category.name
                            )}
                          </b>
                        </td>

                        <td>
                          ${money(amount)}
                        </td>

                        <td>
                          ${money(
                            categorySpent
                          )}
                        </td>

                        <td>
                          ${money(
                            categoryRemaining
                          )}
                        </td>

                        <td>
                          ${pct(
                            categorySpent,
                            amount
                          )}%
                        </td>

                        <td>

                          <div class="actions">

                            <button
                              class="icon-btn"
                              onclick="openBudgetModal(${category.id})"
                            >
                              Edit
                            </button>

                            <button
                              class="icon-btn"
                              onclick="deleteBudget(${category.id})"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    `;

                  })
                  .join("")

              : `

                <tr>

                  <td colspan="6">

                    <div class="empty">

                      No budget allocations yet.
                      Click "Add Allocation" to enter one.

                    </div>

                  </td>

                </tr>

              `
          }

        </tbody>

      </table>

    </div>


    <div class="section-title">
      Budget Settings
    </div>


    <div class="card">

      <div class="field">

        <label>
          Total Wedding Budget
        </label>

        <input
          id="totalBudget"
          type="number"
          min="0"
          step="0.01"
          value="${total}"
        >

      </div>


      <div class="modal-actions">

        <button
          class="btn"
          onclick="saveTotalBudget()"
        >
          Save Budget
        </button>

      </div>

    </div>

  `;

}


/* =========================================================
   TOTAL BUDGET
   ========================================================= */

function saveTotalBudget() {

  const input =
    document.getElementById(
      "totalBudget"
    );

  const n =
    Number(input?.value);

  if (
    !Number.isFinite(n) ||
    n < 0
  ) {
    return toast(
      "Budget cannot be negative."
    );
  }

  data.budget.total = n;

  saveData();

  renderBudget();

  toast(
    "Total budget saved."
  );
}


/* =========================================================
   BUDGET MODAL
   AUTOMATIC SAVE FOR ALLOCATED + DOWN PAYMENT
   ========================================================= */

function openBudgetModal(id = null) {

  const category =
    id
      ? data.budget.categories.find(
          x => x.id === id
        )
      : null;


  openModal(
    category
      ? "Edit Allocation"
      : "Add Allocation",

    `

      <div class="form-grid">

        <div class="field">

          <label>
            Category
          </label>

          <input
            id="bName"
            value="${esc(
              category?.name || ""
            )}"
            placeholder="e.g. Catering"
          >

        </div>


        <div class="field">

          <label>
            Allocated Amount (₱)
          </label>

          <input
            id="bAmount"
            type="number"
            min="0"
            step="0.01"
            value="${category?.amount || 0}"
          >

        </div>


        <div class="field">

          <label>
            Down Payment (₱)
          </label>

          <input
            id="bSpent"
            type="number"
            min="0"
            step="0.01"
            value="${category?.spent || 0}"
          >

        </div>

      </div>

      <div
        class="small muted"
        style="margin-top:10px"
      >
        Allocated amount and down payment are
        automatically saved while you enter them.
      </div>

    `,

    () => {

      saveBudgetModal(
        id,
        false
      );

    }
  );


  /* ---------------------------------------------------------
     AUTO SAVE WHILE TYPING
     --------------------------------------------------------- */

  setTimeout(() => {

    const amount =
      document.getElementById(
        "bAmount"
      );

    const spent =
      document.getElementById(
        "bSpent"
      );

    const name =
      document.getElementById(
        "bName"
      );


    let saveTimer = null;


    function autoSaveBudget() {

      clearTimeout(saveTimer);

      saveTimer = setTimeout(() => {

        const currentName =
          name.value.trim();

        const currentAmount =
          Number(amount.value);

        const currentSpent =
          Number(spent.value);


        if (!currentName) {
          return;
        }

        if (
          !Number.isFinite(
            currentAmount
          ) ||
          currentAmount < 0
        ) {
          return;
        }

        if (
          !Number.isFinite(
            currentSpent
          ) ||
          currentSpent < 0
        ) {
          return;
        }


        if (id) {

          const existing =
            data.budget.categories.find(
              x => x.id === id
            );

          if (!existing) return;

          existing.name =
            currentName;

          existing.amount =
            currentAmount;

          existing.spent =
            currentSpent;

          existing.remaining =
            budgetRemaining(
              currentAmount,
              currentSpent
            );

        } else {

          /*
           New allocation:
           Create it once the user has
           entered a category name.
          */

          let draft =
            data.budget.categories.find(
              x =>
                x._draft === true
            );

          if (!draft) {

            draft = {
              id: uid(),
              name: currentName,
              amount: currentAmount,
              spent: currentSpent,
              remaining:
                budgetRemaining(
                  currentAmount,
                  currentSpent
                ),
              _draft: true
            };

            data.budget.categories.push(
              draft
            );

            id = draft.id;

          } else {

            draft.name =
              currentName;

            draft.amount =
              currentAmount;

            draft.spent =
              currentSpent;

            draft.remaining =
              budgetRemaining(
                currentAmount,
                currentSpent
              );
          }
        }


        saveData();

      }, 400);
    }


    if (amount) {
      amount.addEventListener(
        "input",
        autoSaveBudget
      );
    }

    if (spent) {
      spent.addEventListener(
        "input",
        autoSaveBudget
      );
    }

    if (name) {
      name.addEventListener(
        "input",
        autoSaveBudget
      );
    }

  }, 50);
}


/* =========================================================
   SAVE BUDGET MODAL
   ========================================================= */

function saveBudgetModal(
  id,
  closeAfterSave = true
) {

  const nameInput =
    document.getElementById(
      "bName"
    );

  const amountInput =
    document.getElementById(
      "bAmount"
    );

  const spentInput =
    document.getElementById(
      "bSpent"
    );


  if (!nameInput ||
      !amountInput ||
      !spentInput) {
    return;
  }


  const name =
    nameInput.value.trim();

  const amount =
    Number(amountInput.value);

  const spent =
    Number(spentInput.value);


  if (!name) {
    return toast(
      "Category is required."
    );
  }

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return toast(
      "Allocated amount cannot be negative."
    );
  }

  if (
    !Number.isFinite(spent) ||
    spent < 0
  ) {
    return toast(
      "Down payment cannot be negative."
    );
  }


  if (id) {

    data.budget.categories =
      data.budget.categories.map(
        x =>
          x.id === id
            ? {
                id,
                name,
                amount,
                spent,
                remaining:
                  budgetRemaining(
                    amount,
                    spent
                  )
              }
            : x
      );

  } else {

    data.budget.categories.push({
      id: uid(),
      name,
      amount,
      spent,
      remaining:
        budgetRemaining(
          amount,
          spent
        )
    });

  }


  /* Remove draft markers */
  data.budget.categories.forEach(
    x => delete x._draft
  );


  saveData();

  if (closeAfterSave) {
    closeModal();
  }

  renderBudget();

  toast(
    "Budget allocation saved."
  );
}


function deleteBudget(id) {

  if (
    !ask(
      "Delete this budget allocation?"
    )
  ) {
    return;
  }

  data.budget.categories =
    data.budget.categories.filter(
      x => x.id !== id
    );

  saveData();

  renderBudget();

  toast(
    "Allocation deleted."
  );
}


/* =========================================================
   ADDITIONAL EXPENSES
   ========================================================= */

function renderAdditionalExpenses() {

  const budget =
    Number(
      data.additionalExpenses.budget
    ) || 0;

  const spent =
    data.additionalExpenses.items.reduce(
      (sum, x) =>
        sum +
        (Number(x.amount) || 0),
      0
    );

  const remaining =
    budget - spent;

  const over =
    Math.max(
      0,
      spent - budget
    );

  const items =
    [...data.additionalExpenses.items]
      .sort(
        (a, b) =>
          (b.date || "")
            .localeCompare(
              a.date || ""
            )
      );


  document.getElementById(
    "additional-expenses"
  ).innerHTML = `

    <div class="topline">

      <div>

        <div class="eyebrow">
          ADDITIONAL EXPENSES
        </div>

        <h1>
          Additional Expenses
        </h1>

        <div class="subtitle">
          Track unexpected, miscellaneous,
          and extra wedding costs separately.
        </div>

      </div>

      <button
        class="btn"
        onclick="openAdditionalExpenseModal()"
      >
        ＋ Add Expense
      </button>

    </div>


    <div class="grid grid-4">

      <div class="card">

        <div class="stat-title">
          ADDITIONAL BUDGET
        </div>

        <div class="big-number">
          ${money(budget)}
        </div>

      </div>


      <div class="card">

        <div class="stat-title">
          TOTAL SPENT
        </div>

        <div class="big-number">
          ${money(spent)}
        </div>

      </div>


      <div class="card">

        <div class="stat-title">
          REMAINING
        </div>

        <div class="big-number">
          ${money(remaining)}
        </div>

      </div>


      <div class="card">

        <div class="stat-title">
          EXPENSE ITEMS
        </div>

        <div class="big-number">
          ${items.length}
        </div>

      </div>

    </div>


    <div
      class="card"
      style="margin-top:16px"
    >

      <div class="summary">

        <b>
          Additional Expenses Budget Monitoring
        </b>

        <b>
          ${pct(spent, budget)}%
        </b>

      </div>


      <div
        class="progress"
        style="margin-top:10px"
      >

        <div
          style="
            width:${pct(
              spent,
              budget
            )}%
          "
        ></div>

      </div>


      <div
        class="summary"
        style="margin-top:12px"
      >

        <span>Budget</span>
        <b>${money(budget)}</b>

        <span>Spent</span>
        <b>${money(spent)}</b>

        <span>Remaining</span>
        <b>${money(remaining)}</b>

      </div>


      ${
        over > 0
          ? `
            <div
              class="alert"
              style="margin-top:14px"
            >
              You are
              ${money(over)}
              over the Additional Expenses budget.
            </div>
          `
          : ""
      }

    </div>


    <div class="section-title">
      Additional Expenses Budget
    </div>


    <div class="card">

      <div class="field">

        <label>
          Budget for Additional Expenses (₱)
        </label>

        <input
          id="additionalBudget"
          type="number"
          min="0"
          step="0.01"
          value="${budget}"
        >

      </div>


      <div class="modal-actions">

        <button
          class="btn"
          onclick="saveAdditionalExpenseBudget()"
        >
          Save Additional Budget
        </button>

      </div>

    </div>


    <div class="section-title">
      Expense Tracking
    </div>


    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Actions</th>

          </tr>

        </thead>


        <tbody>

          ${
            items.length

              ? items.map(x => `

                  <tr>

                    <td>
                      ${fmtDate(x.date)}
                    </td>

                    <td>
                      ${esc(x.category)}
                    </td>

                    <td>
                      <b>
                        ${esc(
                          x.description
                        )}
                      </b>
                    </td>

                    <td>
                      ${money(x.amount)}
                    </td>

                    <td>
                      ${badge(x.status)}
                    </td>

                    <td>
                      ${esc(x.notes || "")}
                    </td>

                    <td>

                      <div class="actions">

                        <button
                          class="icon-btn"
                          onclick="openAdditionalExpenseModal(${x.id})"
                        >
                          Edit
                        </button>

                        <button
                          class="icon-btn"
                          onclick="deleteAdditionalExpense(${x.id})"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                `).join("")

              : `

                <tr>

                  <td colspan="7">

                    <div class="empty">
                      No additional expenses yet.
                    </div>

                  </td>

                </tr>

              `
          }

        </tbody>

      </table>

    </div>

  `;
}


function saveAdditionalExpenseBudget() {

  const input =
    document.getElementById(
      "additionalBudget"
    );

  const n =
    Number(input?.value);


  if (
    !Number.isFinite(n) ||
    n < 0
  ) {
    return toast(
      "Additional Expenses budget cannot be negative."
    );
  }


  data.additionalExpenses.budget =
    n;

  saveData();

  renderAdditionalExpenses();

  toast(
    "Additional Expenses budget saved."
  );
}


function openAdditionalExpenseModal(
  id = null
) {

  const x =
    id
      ? data.additionalExpenses.items.find(
          i => i.id === id
        )
      : null;


  const categories = [
    "Transportation",
    "Tips / Gratuities",
    "Emergency",
    "Decor / Extras",
    "Printing",
    "Food / Drinks",
    "Accommodation",
    "Gifts / Favors",
    "Other"
  ];


  openModal(

    x
      ? "Edit Additional Expense"
      : "Add Additional Expense",

    `

      <div class="form-grid">

        <div class="field">

          <label>
            Date
          </label>

          <input
            id="aeDate"
            type="date"
            value="${
              x?.date ||
              new Date()
                .toISOString()
                .slice(0, 10)
            }"
          >

        </div>


        <div class="field">

          <label>
            Category
          </label>

          <select id="aeCategory">

            ${categories.map(
              value => `
                <option
                  ${
                    x?.category === value
                      ? "selected"
                      : ""
                  }
                >
                  ${value}
                </option>
              `
            ).join("")}

          </select>

        </div>


        <div class="field full">

          <label>
            Description
          </label>

          <input
            id="aeDescription"
            value="${esc(
              x?.description || ""
            )}"
            placeholder="What is this expense for?"
          >

        </div>


        <div class="field">

          <label>
            Amount (₱)
          </label>

          <input
            id="aeAmount"
            type="number"
            min="0"
            step="0.01"
            value="${x?.amount || 0}"
          >

        </div>


        <div class="field">

          <label>
            Status
          </label>

          <select id="aeStatus">

            ${[
              "Planned",
              "Pending",
              "Paid"
            ].map(
              value => `
                <option
                  ${
                    x?.status === value
                      ? "selected"
                      : ""
                  }
                >
                  ${value}
                </option>
              `
            ).join("")}

          </select>

        </div>


        <div class="field full">

          <label>
            Notes
          </label>

          <textarea id="aeNotes">${esc(
            x?.notes || ""
          )}</textarea>

        </div>

      </div>

    `,

    () => {

      const item = {

        id:
          id || uid(),

        date:
          document.getElementById(
            "aeDate"
          ).value,

        category:
          document.getElementById(
            "aeCategory"
          ).value,

        description:
          document.getElementById(
            "aeDescription"
          ).value.trim(),

        amount:
          Number(
            document.getElementById(
              "aeAmount"
            ).value
          ),

        status:
          document.getElementById(
            "aeStatus"
          ).value,

        notes:
          document.getElementById(
            "aeNotes"
          ).value.trim()
      };


      if (!item.description) {
        return toast(
          "Expense description is required."
        );
      }


      if (
        !Number.isFinite(
          item.amount
        ) ||
        item.amount < 0
      ) {
        return toast(
          "Expense amount cannot be negative."
        );
      }


      if (id) {

        data.additionalExpenses.items =
          data.additionalExpenses.items.map(
            existing =>
              existing.id === id
                ? item
                : existing
          );

      } else {

        data.additionalExpenses.items.push(
          item
        );

      }


      saveData();

      closeModal();

      renderAdditionalExpenses();

      toast(
        "Additional expense saved."
      );

    }
  );
}


function deleteAdditionalExpense(id) {

  if (
    !ask(
      "Delete this additional expense?"
    )
  ) {
    return;
  }

  data.additionalExpenses.items =
    data.additionalExpenses.items.filter(
      x => x.id !== id
    );

  saveData();

  renderAdditionalExpenses();

  toast(
    "Additional expense deleted."
  );
}


/* =========================================================
   GOOGLE RSVP HELPERS
   ========================================================= */

function googleGuestDisplayHeaders(
  headers
) {

  const skip = [
    "Timestamp",
    "Name",
    "Full Name",
    "Email",
    "Email Address",
    "Phone",
    "Phone Number"
  ];

  return headers.filter(
    h => !skip.includes(h)
  );
}


function responseName(row) {

  const key =
    Object.keys(row).find(
      k =>
        /^(full\s*name|name|guest\s*name)$/i
          .test(k)
    );


  if (
    key &&
    String(row[key]).trim()
  ) {
    return String(
      row[key]
    ).trim();
  }


  const first =
    Object.keys(row).find(
      k =>
        /^first\s*name$/i.test(k)
    );

  const last =
    Object.keys(row).find(
      k =>
        /^last\s*name$/i.test(k)
    );


  const name =
    [
      first ? row[first] : "",
      last ? row[last] : ""
    ]
      .filter(Boolean)
      .join(" ")
      .trim();


  return name ||
    "Unnamed Guest";
}


function responseEmail(row) {

  const key =
    Object.keys(row).find(
      k =>
        /^(email|email address)$/i
          .test(k)
    );

  return key
    ? String(
        row[key] || ""
      ).trim()
    : "";
}


function responsePhone(row) {

  const key =
    Object.keys(row).find(
      k =>
        /^(phone|phone number|mobile|mobile number)$/i
          .test(k)
    );

  return key
    ? String(
        row[key] || ""
      ).trim()
    : "";
}


/* =========================================================
   RSVP STATUS
   ========================================================= */

function rsvpStatus(row) {

  const values =
    Object.values(row || {})
      .map(
        v => String(v ?? "")
      )
      .filter(Boolean);


  const text =
    values
      .join(" ")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/❤︎|♥|❤/g, "")
      .replace(/\s+/g, " ")
      .trim();


  if (
    /sadly.*\bno\b/.test(text) ||
    /\bno\b.*\b(attend|there|coming)\b/.test(text) ||
    /\bnot attending\b/.test(text) ||
    /\bdeclin/.test(text) ||
    /\bcannot attend\b/.test(text) ||
    /\bcan't attend\b/.test(text) ||
    /\bunable to attend\b/.test(text) ||
    /\bwill not\b.*\battend\b/.test(text) ||
    /\bwon't\b.*\battend\b/.test(text)
  ) {
    return "Not Attending";
  }


  if (
    /\byes\b/.test(text) ||
    /\battending\b/.test(text) ||
    /\bwill attend\b/.test(text) ||
    /\baccept/.test(text) ||
    /\bconfirmed\b/.test(text) ||
    /\bgoing\b/.test(text) ||
    /\bwill be there\b/.test(text)
  ) {
    return "Attending";
  }


  return "RSVP Received";
}


/* =========================================================
   MERGE MANUAL GUESTS + GOOGLE RSVP
   ========================================================= */

function mergeGuestAndRsvp(
  manual,
  responses
) {

  const used =
    new Set();

  const rows = [];


  responses.forEach(response => {

    const name =
      responseName(response);

    const email =
      responseEmail(
        response
      ).toLowerCase();

    const phone =
      responsePhone(
        response
      ).replace(/\D/g, "");


    let manualIndex =
      manual.findIndex(
        (guest, index) => {

          if (
            used.has(index)
          ) {
            return false;
          }


          const guestName =
            String(
              guest.name || ""
            )
              .trim()
              .toLowerCase();

          const guestEmail =
            String(
              guest.email || ""
            )
              .trim()
              .toLowerCase();

          const guestPhone =
            String(
              guest.phone || ""
            )
              .replace(
                /\D/g,
                ""
              );


          return (
            (
              email &&
              guestEmail &&
              email === guestEmail
            ) ||

            (
              phone &&
              guestPhone &&
              phone === guestPhone
            ) ||

            (
              name
                .toLowerCase() ===
                guestName &&
              name.toLowerCase() !==
                "unnamed guest"
            )
          );

        }
      );


    const matched =
      manualIndex >= 0
        ? manual[manualIndex]
        : null;


    if (
      manualIndex >= 0
    ) {
      used.add(
        manualIndex
      );
    }


    rows.push({

      name:
        matched?.name ||
        name,

      isResponse:
        true,

      response,

      manual:
        matched,

      status:
        rsvpStatus(response),

      search:
        [
          name,
          email,
          phone,
          Object.values(
            response
          ).join(" "),
          matched
            ? Object.values(
                matched
              ).join(" ")
            : ""
        ].join(" ")

    });

  });


  manual.forEach(
    (guest, index) => {

      if (
        used.has(index)
      ) {
        return;
      }


      rows.push({

        name:
          guest.name,

        isResponse:
          false,

        response:
          null,

        manual:
          guest,

        status:
          guest.status ||
          "Pending",

        search:
          Object.values(
            guest
          ).join(" ")

      });

    }
  );


  return rows;
}


/* =========================================================
   GOOGLE SHEETS HEADERS
   ========================================================= */

function googleRsvpHeaders(
  rows
) {

  const preferred = [
    "Timestamp",
    "Name",
    "Full Name",
    "Email",
    "Email Address",
    "Phone",
    "Phone Number",
    "RSVP",
    "Attendance",
    "Attending",
    "Meal",
    "Plus One",
    "Side",
    "Notes"
  ];


  const keys = [];


  rows.forEach(
    row => {

      Object.keys(
        row
      ).forEach(
        key => {

          if (
            key &&
            !keys.includes(key)
          ) {
            keys.push(key);
          }

        }
      );

    }
  );


  const ordered =
    preferred.filter(
      key =>
        keys.includes(key)
    );


  return [
    ...ordered,
    ...keys.filter(
      key =>
        !ordered.includes(key)
    )
  ];
}


/* =========================================================
   GOOGLE SHEET URL
   ========================================================= */

function googleSheetsCsvUrl(
  input
) {

  const raw =
    String(
      input || ""
    ).trim();


  if (!raw) {
    return "";
  }


  if (
    /^[A-Za-z0-9_-]{20,}$/
      .test(raw)
  ) {

    return (
      "https://docs.google.com/spreadsheets/d/" +
      raw +
      "/export?format=csv"
    );
  }


  try {

    const u =
      new URL(raw);


    if (
      !/docs\.google\.com$/i.test(
        u.hostname
      )
    ) {
      return raw;
    }


    const match =
      u.pathname.match(
        /\/spreadsheets\/d\/([A-Za-z0-9_-]+)/
      );


    if (!match) {
      return raw;
    }


    const gid =
      u.searchParams.get(
        "gid"
      ) ||
      (
        u.hash.match(
          /gid=(\d+)/
        ) || []
      )[1];


    if (gid) {

      return (
        "https://docs.google.com/spreadsheets/d/" +
        match[1] +
        "/export?format=csv&gid=" +
        encodeURIComponent(gid)
      );

    }


    return (
      "https://docs.google.com/spreadsheets/d/" +
      match[1] +
      "/export?format=csv"
    );

  } catch (error) {

    return raw;

  }
}


/* =========================================================
   GOOGLE GVIZ URL
   ========================================================= */

function googleSheetsGvizUrl(
  input
) {

  const raw =
    String(
      input || ""
    ).trim();


  if (!raw) {
    return "";
  }


  try {

    const u =
      new URL(raw);


    if (
      !/^(docs\.google\.com|docs\.googleusercontent\.com)$/i
        .test(u.hostname)
    ) {
      return "";
    }


    const match =
      u.pathname.match(
        /\/spreadsheets\/d\/([A-Za-z0-9_-]+)/
      );


    if (!match) {
      return "";
    }


    const gid =
      u.searchParams.get(
        "gid"
      ) ||
      (
        u.hash.match(
          /gid=(\d+)/
        ) || []
      )[1];


    const base =
      "https://docs.google.com/spreadsheets/d/" +
      match[1] +
      "/gviz/tq?tqx=out:json";


    return gid
      ? base +
        "&gid=" +
        encodeURIComponent(gid)
      : base;

  } catch (error) {

    return "";
  }
}


/* =========================================================
   CSV PARSER
   ========================================================= */

function parseCsv(text) {

  const rows = [];

  let row = [];
  let cell = "";
  let quoted = false;


  for (
    let i = 0;
    i < text.length;
    i++
  ) {

    const ch =
      text[i];

    const next =
      text[i + 1];


    if (quoted) {

      if (
        ch === '"' &&
        next === '"'
      ) {

        cell += '"';
        i++;

      } else if (
        ch === '"'
      ) {

        quoted = false;

      } else {

        cell += ch;

      }

    } else {

      if (
        ch === '"'
      ) {

        quoted = true;

      } else if (
        ch === ","
      ) {

        row.push(cell);
        cell = "";

      } else if (
        ch === "\n"
      ) {

        row.push(cell);
        rows.push(row);

        row = [];
        cell = "";

      } else if (
        ch === "\r"
      ) {

        // Ignore CR

      } else {

        cell += ch;

      }

    }
  }


  if (
    cell !== "" ||
    row.length
  ) {

    row.push(cell);
    rows.push(row);

  }


  return rows.filter(
    r =>
      r.some(
        value =>
          String(value)
            .trim() !== ""
      )
  );
}


/* =========================================================
   GVIZ PARSER
   ========================================================= */

function parseGviz(text) {

  const start =
    text.indexOf("(");

  const end =
    text.lastIndexOf(")");


  if (
    start < 0 ||
    end < start
  ) {
    throw new Error(
      "Invalid Google Sheets response"
    );
  }


  const obj =
    JSON.parse(
      text.slice(
        start + 1,
        end
      )
    );


  const cols =
    (obj.table?.cols || [])
      .map(
        (column, index) =>
          String(
            column.label ||
            column.id ||
            `Column ${index + 1}`
          ).trim() ||
          `Column ${index + 1}`
      );


  const rows =
    (obj.table?.rows || [])
      .map(row => {

        const object = {};

        cols.forEach(
          (header, index) => {

            const cell =
              row.c?.[index];

            object[header] =
              cell?.f ??
              cell?.v ??
              "";

          }
        );

        return object;

      })
      .filter(
        row =>
          Object.values(row)
            .some(
              value =>
                String(value)
                  .trim() !== ""
            )
      );


  return {
    headers: cols,
    rows
  };
}


/* =========================================================
   FETCH GOOGLE RSVP DATA
   ========================================================= */

async function fetchRsvpData(
  sheetUrl
) {

  const gviz =
    googleSheetsGvizUrl(
      sheetUrl
    );


  if (gviz) {

    try {

      const response =
        await fetch(
          gviz,
          {
            cache: "no-store"
          }
        );


      const text =
        await response.text();


      if (
        response.ok &&
        !/<html|sign in|accounts\.google\.com/i
          .test(
            text.slice(
              0,
              3000
            )
          )
      ) {

        const parsed =
          parseGviz(text);


        if (
          parsed.rows.length
        ) {
          return parsed.rows;
        }

        /*
          An empty response sheet is valid.
          Return an empty RSVP list instead
          of creating fake guests.
        */

        if (
          parsed.rows.length === 0
        ) {
          return [];
        }
      }

    } catch (error) {

      console.warn(
        "GViz fetch failed:",
        error
      );

    }
  }


  const csv =
    googleSheetsCsvUrl(
      sheetUrl
    );


  if (!csv) {
    throw new Error(
      "Invalid Google Sheets URL"
    );
  }


  const response =
    await fetch(
      csv,
      {
        cache: "no-store"
      }
    );


  const text =
    await response.text();


  if (!response.ok) {
    throw new Error(
      "Google Sheets HTTP " +
      response.status
    );
  }


  if (
    /<html|accounts\.google\.com|sign in/i
      .test(
        text.slice(
          0,
          3000
        )
      )
  ) {

    throw new Error(
      "Sheet is private or not published"
    );
  }


  const matrix =
    parseCsv(text);


  if (
    matrix.length < 1
  ) {
    return [];
  }


  const headers =
    matrix[0].map(
      (header, index) =>
        String(
          header ||
          `Column ${index + 1}`
        ).trim() ||
        `Column ${index + 1}`
    );


  return matrix
    .slice(1)
    .map(row => {

      const object = {};

      headers.forEach(
        (header, index) => {

          object[header] =
            String(
              row[index] ?? ""
            ).trim();

        }
      );

      return object;

    })
    .filter(
      row =>
        Object.values(row)
          .some(
            value =>
              value !== ""
          )
    );
}


/* =========================================================
   SYNC GOOGLE RSVP
   ========================================================= */

async function syncGoogleRsvp() {

  const sheetUrl =
    data.googleRsvp?.sheetUrl;


  if (!sheetUrl) {

    return toast(
      "Connect the Google Sheets response sheet in Settings first."
    );

  }


  try {

    data.googleRsvp.status =
      "Connecting…";

    saveData();

    renderGuests();


    const rows =
      await fetchRsvpData(
        sheetUrl
      );


    /*
      ONLY actual Google Form responses
      are stored here.
    */

    data.googleRsvp.responses =
      Array.isArray(rows)
        ? rows
        : [];


    data.googleRsvp.lastSync =
      new Date().toISOString();


    data.googleRsvp.status =
      "Connected";


    saveData();

    renderGuests();


    toast(
      rows.length === 1
        ? "1 RSVP response loaded."
        : `${rows.length} RSVP responses loaded.`
    );


  } catch (error) {

    console.error(
      "Google RSVP sync error:",
      error
    );


    data.googleRsvp.status =
      "Error";


    saveData();

    renderGuests();


    toast(
      "Could not load Google Sheets. Make sure the response sheet can be viewed publicly or is published to the web."
    );
  }
}


/* =========================================================
   GUEST PAGE
   ========================================================= */

function renderGuests() {

  const q =
    (
      window.guestQ ||
      ""
    )
      .toLowerCase()
      .trim();


  const manual =
    data.guests || [];


  const responses =
    data.googleRsvp?.responses || [];


  const headers =
    googleRsvpHeaders(
      responses
    );


  const displayHeaders =
    googleGuestDisplayHeaders(
      headers
    );


  const merged =
    mergeGuestAndRsvp(
      manual,
      responses
    );


  const list =
    merged.filter(
      guest =>
        guest.search
          .toLowerCase()
          .includes(q)
    );


  const connected =
    Boolean(
      data.googleRsvp?.sheetUrl
    );


  const syncText =
    data.googleRsvp?.lastSync

      ? "Last synced " +
        new Date(
          data.googleRsvp.lastSync
        ).toLocaleString(
          "en-PH",
          {
            dateStyle: "medium",
            timeStyle: "short"
          }
        )

      : connected
        ? "Not synced yet"
        : "Connect the Google Sheets response sheet in Settings.";


  const attending =
    merged.filter(
      guest =>
        guest.status ===
          "Attending" ||
        guest.status ===
          "Confirmed"
    ).length;


  const declined =
    merged.filter(
      guest =>
        guest.status ===
          "Not Attending" ||
        guest.status ===
          "Declined"
    ).length;


  const pending =
    Math.max(
      0,
      merged.length -
        attending -
        declined
    );


  document.getElementById(
    "guests"
  ).innerHTML = `

    <div class="topline">

      <div>

        <div class="eyebrow">
          GUESTS
        </div>

        <h1>
          Guest List
        </h1>

        <div class="subtitle">
          Manual guests and actual Google Form RSVP respondents are shown together.
        </div>

      </div>


      <button
        class="btn"
        onclick="openGuestModal()"
      >
        ＋ Add Guest
      </button>

    </div>


    <div class="grid grid-4">

      ${stat(
        "♧",
        "Total Guests",
        merged.length,
        "Manual + RSVP"
      )}

      ${stat(
        "✓",
        "Attending",
        attending,
        "RSVP responses"
      )}

      ${stat(
        "×",
        "Not Attending",
        declined,
        "RSVP responses"
      )}

      ${stat(
        "…",
        "Pending",
        pending,
        "No RSVP response yet"
      )}

    </div>


    <div class="card google-rsvp-card">

      <div class="rsvp-connect-row">

        <div>

          <h3
            style="margin:0 0 5px"
          >
            Wedding RSVP
          </h3>

          <div class="small muted">

            ${
              connected
                ? "Connected through the Google Sheets response sheet."
                : "Connect the response sheet to automatically add RSVP respondents to this Guest List."
            }

          </div>

          <div
            class="small muted"
            style="margin-top:5px"
          >
            ${esc(syncText)}
          </div>

        </div>


        <div class="actions">

          ${
            connected
              ? `
                <button
                  class="btn"
                  onclick="syncGoogleRsvp()"
                >
                  ↻ Refresh Responses
                </button>
              `
              : ""
          }

          <button
            class="btn secondary"
            onclick="navigate('settings')"
          >
            ⚙ RSVP Connection
          </button>

        </div>

      </div>


      <div
        class="google-form-embed-wrap"
        style="margin-top:18px"
      >

        <div
          class="google-form-embed-head"
        >

          <div>

            <h3
              style="margin:0 0 5px"
            >
              RSVP Form
            </h3>

            <div class="small muted">
              Guests can submit their RSVP directly here.
            </div>

          </div>


          <a
            class="btn secondary"
            href="${GOOGLE_FORM_URL}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Form
          </a>

        </div>


        <iframe
          class="google-form-iframe"
          src="${GOOGLE_FORM_EMBED_URL}"
          title="Wedding RSVP Form"
          frameborder="0"
          marginheight="0"
          marginwidth="0"
        >
          Loading…
        </iframe>

      </div>

    </div>


    <div class="section-title">
      All Guests & RSVP Responses
    </div>


    <div
      class="toolbar"
      style="margin-top:0"
    >

      <input
        class="search"
        placeholder="Search guest name or RSVP response..."
        value="${esc(
          window.guestQ || ""
        )}"
        oninput="
          window.guestQ=this.value;
          renderGuests();
        "
      >


      <button
        class="btn secondary"
        onclick="syncGoogleRsvp()"
      >
        ↻ Sync RSVP
      </button>


      <button
        class="btn secondary"
        onclick="exportCombinedGuests()"
      >
        Export Guest + RSVP CSV
      </button>

    </div>


    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>
              Guest
            </th>

            <th>
              Source
            </th>

            <th>
              RSVP Status
            </th>

            ${displayHeaders
              .map(
                h =>
                  `<th>${esc(h)}</th>`
              )
              .join("")}

            <th>
              Actions
            </th>

          </tr>

        </thead>


        <tbody>

          ${
            list.length

              ? list
                  .map(
                    guest => `

                      <tr>

                        <td>

                          <b>
                            ${esc(
                              guest.name ||
                              "Unnamed Guest"
                            )}
                          </b>

                          ${
                            guest.manual?.notes
                              ? `
                                <div
                                  class="small muted"
                                >
                                  ${esc(
                                    guest.manual.notes
                                  )}
                                </div>
                              `
                              : ""
                          }

                        </td>


                        <td>

                          ${
                            guest.isResponse
                              ? `
                                <span
                                  class="badge confirmed"
                                >
                                  Google Form
                                </span>
                              `
                              : `
                                <span class="badge">
                                  Manual
                                </span>
                              `
                          }

                        </td>


                        <td>
                          ${badge(
                            guest.status
                          )}
                        </td>


                        ${displayHeaders
                          .map(
                            header =>
                              `
                                <td>
                                  ${esc(
                                    guest.response?.[
                                      header
                                    ] ?? ""
                                  )}
                                </td>
                              `
                          )
                          .join("")}


                        <td>

                          ${
                            guest.manual
                              ? `
                                <div class="actions">

                                  <button
                                    class="icon-btn"
                                    onclick="openGuestModal(${guest.manual.id})"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    class="icon-btn"
                                    onclick="deleteGuest(${guest.manual.id})"
                                  >
                                    Delete
                                  </button>

                                </div>
                              `
                              : `
                                <span
                                  class="small muted"
                                >
                                  RSVP response
                                </span>
                              `
                          }

                        </td>

                      </tr>

                    `
                  )
                  .join("")

              : `

                <tr>

                  <td
                    colspan="${
                      4 +
                      displayHeaders.length
                    }"
                  >

                    <div class="empty">

                      ${
                        responses.length === 0 &&
                        manual.length === 0

                          ? "No guests or RSVP responses yet."

                          : "No guests found."
                      }

                    </div>

                  </td>

                </tr>

              `
          }

        </tbody>

      </table>

    </div>

  `;
}


/* =========================================================
   GUEST MODAL
   ========================================================= */

function openGuestModal(
  id = null
) {

  const guest =
    id
      ? data.guests.find(
          x => x.id === id
        )
      : null;


  openModal(

    guest
      ? "Edit Guest"
      : "Add Guest",

    `

      <div class="form-grid">

        <div class="field">

          <label>
            Full Name
          </label>

          <input
            id="gName"
            value="${esc(
              guest?.name || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            Side
          </label>

          <select id="gSide">

            ${[
              "Bride",
              "Groom",
              "Both"
            ].map(
              value =>
                `
                  <option
                    ${
                      guest?.side === value
                        ? "selected"
                        : ""
                    }
                  >
                    ${value}
                  </option>
                `
            ).join("")}

          </select>

        </div>


        <div class="field">

          <label>
            Phone
          </label>

          <input
            id="gPhone"
            value="${esc(
              guest?.phone || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            Email
          </label>

          <input
            id="gEmail"
            type="email"
            value="${esc(
              guest?.email || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            Meal
          </label>

          <select id="gMeal">

            ${[
              "Standard",
              "Vegetarian",
              "Vegan",
              "Halal",
              "Other"
            ].map(
              value =>
                `
                  <option
                    ${
                      guest?.meal === value
                        ? "selected"
                        : ""
                    }
                  >
                    ${value}
                  </option>
                `
            ).join("")}

          </select>

        </div>


        <div class="field">

          <label>
            Plus One
          </label>

          <select id="gPlus">

            ${[
              "No",
              "Yes"
            ].map(
              value =>
                `
                  <option
                    ${
                      guest?.plusOne === value
                        ? "selected"
                        : ""
                    }
                  >
                    ${value}
                  </option>
                `
            ).join("")}

          </select>

        </div>


        <div class="field">

          <label>
            RSVP Status
          </label>

          <select id="gStatus">

            ${[
              "Pending",
              "Confirmed",
              "Declined"
            ].map(
              value =>
                `
                  <option
                    ${
                      guest?.status === value
                        ? "selected"
                        : ""
                    }
                  >
                    ${value}
                  </option>
                `
            ).join("")}

          </select>

        </div>


        <div class="field full">

          <label>
            Notes
          </label>

          <textarea id="gNotes">${esc(
            guest?.notes || ""
          )}</textarea>

        </div>

      </div>

    `,

    () => {

      const item = {

        id:
          id || uid(),

        name:
          document.getElementById(
            "gName"
          ).value.trim(),

        side:
          document.getElementById(
            "gSide"
          ).value,

        phone:
          document.getElementById(
            "gPhone"
          ).value.trim(),

        email:
          document.getElementById(
            "gEmail"
          ).value.trim(),

        meal:
          document.getElementById(
            "gMeal"
          ).value,

        plusOne:
          document.getElementById(
            "gPlus"
          ).value,

        status:
          document.getElementById(
            "gStatus"
          ).value,

        notes:
          document.getElementById(
            "gNotes"
          ).value.trim()
      };


      if (!item.name) {
        return toast(
          "Guest name is required."
        );
      }


      if (id) {

        data.guests =
          data.guests.map(
            x =>
              x.id === id
                ? item
                : x
          );

      } else {

        data.guests.push(
          item
        );

      }


      saveData();

      closeModal();

      renderGuests();

      toast(
        "Guest saved."
      );

    }
  );
}


function deleteGuest(id) {

  if (
    !ask(
      "Delete this guest?"
    )
  ) {
    return;
  }


  data.guests =
    data.guests.filter(
      x => x.id !== id
    );


  saveData();

  renderGuests();

  toast(
    "Guest deleted."
  );
}


/* =========================================================
   EXPORT GUESTS
   ========================================================= */

function exportGuests() {

  const rows = [
    [
      "Name",
      "Side",
      "Phone",
      "Email",
      "Meal",
      "Plus One",
      "Status",
      "Notes"
    ],

    ...data.guests.map(
      guest => [
        guest.name,
        guest.side,
        guest.phone,
        guest.email,
        guest.meal,
        guest.plusOne,
        guest.status,
        guest.notes
      ]
    )
  ];


  download(
    "wedding-guests.csv",
    rows
      .map(
        row =>
          row
            .map(
              value =>
                `"${String(value)
                  .replaceAll(
                    '"',
                    '""'
                  )}"`
            )
            .join(",")
      )
      .join("\n"),
    "text/csv"
  );
}


function exportCombinedGuests() {

  const responses =
    data.googleRsvp?.responses || [];


  const headers =
    googleRsvpHeaders(
      responses
    );


  const merged =
    mergeGuestAndRsvp(
      data.guests || [],
      responses
    );


  const output = [
    [
      "Guest",
      "Source",
      "RSVP Status",
      ...headers
    ]
  ];


  merged.forEach(
    guest => {

      output.push([
        guest.name,
        guest.isResponse
          ? "Google Form"
          : "Manual",
        guest.status,

        ...headers.map(
          header =>
            guest.response?.[
              header
            ] ?? ""
        )
      ]);

    }
  );


  download(
    "wedding-guest-list-with-rsvps.csv",

    output
      .map(
        row =>
          row
            .map(
              value =>
                `"${String(value)
                  .replaceAll(
                    '"',
                    '""'
                  )}"`
            )
            .join(",")
      )
      .join("\n"),

    "text/csv"
  );
}


/* =========================================================
   VENDORS
   ========================================================= */

function renderVendors() {

  const total =
    data.vendors.reduce(
      (sum, vendor) =>
        sum +
        (Number(vendor.total) || 0),
      0
    );


  const paid =
    data.vendors.reduce(
      (sum, vendor) =>
        sum +
        (Number(vendor.paid) || 0),
      0
    );


  document.getElementById(
    "vendors"
  ).innerHTML = `

    <div class="topline">

      <div>

        <div class="eyebrow">
          VENDORS
        </div>

        <h1>
          Vendors
        </h1>

        <div class="subtitle">
          Add your vendors manually.
        </div>

      </div>


      <button
        class="btn"
        onclick="openVendorModal()"
      >
        ＋ Add Vendor
      </button>

    </div>


    <div class="grid grid-4">

      ${stat(
        "▥",
        "Vendors",
        data.vendors.length,
        data.vendors.filter(
          v =>
            v.status === "Booked"
        ).length +
        " booked"
      )}


      ${stat(
        "₱",
        "Total Cost",
        money(total),
        "All vendors"
      )}


      ${stat(
        "₱",
        "Paid",
        money(paid),
        "Deposits/payments"
      )}


      ${stat(
        "₱",
        "Balance",
        money(
          Math.max(
            0,
            total - paid
          )
        ),
        "Remaining"
      )}

    </div>


    <div class="section-title">
      Vendor Management
    </div>


    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>Category</th>
            <th>Vendor</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Balance</th>
            <th>Actions</th>

          </tr>

        </thead>


        <tbody>

          ${
            data.vendors.length

              ? data.vendors.map(
                  vendor => `

                    <tr>

                      <td>
                        ${esc(
                          vendor.category
                        )}
                      </td>


                      <td>

                        <b>
                          ${esc(
                            vendor.name
                          )}
                        </b>

                        ${
                          vendor.notes
                            ? `
                              <div
                                class="small muted"
                              >
                                ${esc(
                                  vendor.notes
                                )}
                              </div>
                            `
                            : ""
                        }

                      </td>


                      <td>

                        ${esc(
                          vendor.contact
                        )}

                        <br>

                        ${esc(
                          vendor.phone
                        )}

                      </td>


                      <td>
                        ${badge(
                          vendor.status
                        )}
                      </td>


                      <td>
                        ${money(
                          vendor.total
                        )}
                      </td>


                      <td>
                        ${money(
                          vendor.paid
                        )}
                      </td>


                      <td>
                        ${money(
                          Math.max(
                            0,
                            vendor.total -
                              vendor.paid
                          )
                        )}
                      </td>


                      <td>

                        <div class="actions">

                          <button
                            class="icon-btn"
                            onclick="openVendorModal(${vendor.id})"
                          >
                            Edit
                          </button>

                          <button
                            class="icon-btn"
                            onclick="deleteVendor(${vendor.id})"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  `
                ).join("")

              : `

                <tr>

                  <td colspan="8">

                    <div class="empty">

                      No vendors yet.
                      Click "Add Vendor" to enter a vendor.

                    </div>

                  </td>

                </tr>

              `
          }

        </tbody>

      </table>

    </div>

  `;
}


/* =========================================================
   VENDOR MODAL
   ========================================================= */

function openVendorModal(
  id = null
) {

  const vendor =
    id
      ? data.vendors.find(
          x => x.id === id
        )
      : null;


  openModal(

    vendor
      ? "Edit Vendor"
      : "Add Vendor",

    `

      <div class="form-grid">

        <div class="field">

          <label>
            Category
          </label>

          <input
            id="vCat"
            value="${esc(
              vendor?.category || ""
            )}"
            placeholder="e.g. Photography"
          >

        </div>


        <div class="field">

          <label>
            Status
          </label>

          <select id="vStatus">

            ${[
              "Pending",
              "Contacted",
              "Booked",
              "Paid",
              "Cancelled"
            ].map(
              value =>
                `
                  <option
                    ${
                      vendor?.status === value
                        ? "selected"
                        : ""
                    }
                  >
                    ${value}
                  </option>
                `
            ).join("")}

          </select>

        </div>


        <div class="field">

          <label>
            Vendor Name
          </label>

          <input
            id="vName"
            value="${esc(
              vendor?.name || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            Contact Person
          </label>

          <input
            id="vContact"
            value="${esc(
              vendor?.contact || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            Phone
          </label>

          <input
            id="vPhone"
            value="${esc(
              vendor?.phone || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            Email
          </label>

          <input
            id="vEmail"
            type="email"
            value="${esc(
              vendor?.email || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            Total Cost (₱)
          </label>

          <input
            id="vTotal"
            type="number"
            min="0"
            step="0.01"
            value="${vendor?.total || 0}"
          >

        </div>


        <div class="field">

          <label>
            Paid / Down Payment (₱)
          </label>

          <input
            id="vPaid"
            type="number"
            min="0"
            step="0.01"
            value="${vendor?.paid || 0}"
          >

        </div>


        <div class="field">

          <label>
            Payment Due
          </label>

          <input
            id="vDue"
            type="date"
            value="${vendor?.due || ""}"
          >

        </div>


        <div class="field full">

          <label>
            Notes
          </label>

          <textarea id="vNotes">${esc(
            vendor?.notes || ""
          )}</textarea>

        </div>

      </div>

    `,

    () => {

      const item = {

        id:
          id || uid(),

        category:
          document.getElementById(
            "vCat"
          ).value.trim(),

        name:
          document.getElementById(
            "vName"
          ).value.trim(),

        contact:
          document.getElementById(
            "vContact"
          ).value.trim(),

        phone:
          document.getElementById(
            "vPhone"
          ).value.trim(),

        email:
          document.getElementById(
            "vEmail"
          ).value.trim(),

        status:
          document.getElementById(
            "vStatus"
          ).value,

        total:
          Number(
            document.getElementById(
              "vTotal"
            ).value
          ),

        paid:
          Number(
            document.getElementById(
              "vPaid"
            ).value
          ),

        due:
          document.getElementById(
            "vDue"
          ).value,

        notes:
          document.getElementById(
            "vNotes"
          ).value.trim()
      };


      if (!item.name) {

        return toast(
          "Vendor name is required."
        );

      }


      if (
        !Number.isFinite(
          item.total
        ) ||
        item.total < 0
      ) {

        return toast(
          "Total cost cannot be negative."
        );

      }


      if (
        !Number.isFinite(
          item.paid
        ) ||
        item.paid < 0
      ) {

        return toast(
          "Paid amount cannot be negative."
        );

      }


      if (
        item.paid >
        item.total
      ) {

        return toast(
          "Paid amount cannot exceed total cost."
        );

      }


      if (id) {

        data.vendors =
          data.vendors.map(
            x =>
              x.id === id
                ? item
                : x
          );

      } else {

        data.vendors.push(
          item
        );

      }


      saveData();

      closeModal();

      renderVendors();

      toast(
        "Vendor saved."
      );

    }
  );
}


function deleteVendor(id) {

  if (
    !ask(
      "Delete this vendor?"
    )
  ) {
    return;
  }


  data.vendors =
    data.vendors.filter(
      x => x.id !== id
    );


  saveData();

  renderVendors();

  toast(
    "Vendor deleted."
  );
}


/* =========================================================
   TASKS
   ========================================================= */

function renderTasks() {

  const groups =
    [
      ...new Set(
        data.tasks.map(
          task => task.group
        )
      )
    ];


  const done =
    data.tasks.filter(
      task => task.done
    ).length;


  document.getElementById(
    "tasks"
  ).innerHTML = `

    <div class="topline">

      <div>

        <div class="eyebrow">
          PLANNING
        </div>

        <h1>
          Timeline & Checklist
        </h1>

      </div>


      <button
        class="btn"
        onclick="openTaskModal()"
      >
        ＋ Add Task
      </button>

    </div>


    <div class="card">

      <div class="summary">

        <b>
          ${done}
          of
          ${data.tasks.length}
          complete
        </b>

        <b>
          ${pct(
            done,
            data.tasks.length
          )}%
        </b>

      </div>


      <div
        class="progress"
        style="margin-top:10px"
      >

        <div
          style="
            width:${pct(
              done,
              data.tasks.length
            )}%
          "
        ></div>

      </div>

    </div>


    <div
      class="toolbar"
      style="margin-top:15px"
    >

      <button
        class="btn secondary"
        onclick="
          window.taskFilter='all';
          renderTasks();
        "
      >
        All
      </button>

      <button
        class="btn secondary"
        onclick="
          window.taskFilter='todo';
          renderTasks();
        "
      >
        To Do
      </button>

      <button
        class="btn secondary"
        onclick="
          window.taskFilter='done';
          renderTasks();
        "
      >
        Done
      </button>

    </div>


    <div>

      ${groups
        .map(group => {

          let arr =
            data.tasks.filter(
              task =>
                task.group ===
                group
            );


          if (
            window.taskFilter ===
            "todo"
          ) {

            arr =
              arr.filter(
                task =>
                  !task.done
              );

          }


          if (
            window.taskFilter ===
            "done"
          ) {

            arr =
              arr.filter(
                task =>
                  task.done
              );

          }


          if (!arr.length) {
            return "";
          }


          return `

            <div class="task-group">

              <div
                class="task-group-title"
              >
                ${esc(group)}
              </div>

              <div>
                ${arr
                  .map(taskRow)
                  .join("")}
              </div>

            </div>

          `;

        })
        .join("")}

    </div>

  `;
}


function taskRow(task) {

  return `

    <div class="task-row">

      <button
        class="check ${
          task.done
            ? "done"
            : ""
        }"
        onclick="toggleTask(${task.id})"
      >
        ${
          task.done
            ? "✓"
            : ""
        }
      </button>


      <div style="flex:1">

        <span
          class="task-text ${
            task.done
              ? "done"
              : ""
          }"
        >
          ${esc(task.title)}
        </span>


        <div class="small muted">

          ${
            task.due
              ? "Due " +
                fmtDate(
                  task.due
                )
              : ""
          }

          ${
            task.priority
              ? " · " +
                esc(
                  task.priority
                ) +
                " priority"
              : ""
          }

        </div>

      </div>


      <button
        class="icon-btn"
        onclick="openTaskModal(${task.id})"
      >
        Edit
      </button>


      <button
        class="icon-btn"
        onclick="deleteTask(${task.id})"
      >
        Delete
      </button>

    </div>

  `;
}


function toggleTask(id) {

  const task =
    data.tasks.find(
      x => x.id === id
    );


  if (!task) return;


  task.done =
    !task.done;


  saveData();

  renderTasks();

  toast(
    task.done
      ? "Task completed."
      : "Task reopened."
  );
}


function openTaskModal(
  id = null
) {

  const task =
    id
      ? data.tasks.find(
          x => x.id === id
        )
      : null;


  const groups = [
    "12+ MONTHS BEFORE",
    "9–12 MONTHS BEFORE",
    "6–9 MONTHS BEFORE",
    "3–6 MONTHS BEFORE",
    "1–3 MONTHS BEFORE",
    "WEDDING WEEK"
  ];


  openModal(

    task
      ? "Edit Task"
      : "Add Task",

    `

      <div class="form-grid">

        <div class="field full">

          <label>
            Task
          </label>

          <input
            id="tTitle"
            value="${esc(
              task?.title || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            Planning Period
          </label>

          <select id="tGroup">

            ${groups.map(
              value =>
                `
                  <option
                    ${
                      task?.group === value
                        ? "selected"
                        : ""
                    }
                  >
                    ${value}
                  </option>
                `
            ).join("")}

          </select>

        </div>


        <div class="field">

          <label>
            Due Date
          </label>

          <input
            id="tDue"
            type="date"
            value="${task?.due || ""}"
          >

        </div>


        <div class="field">

          <label>
            Priority
          </label>

          <select id="tPriority">

            ${[
              "Low",
              "Medium",
              "High"
            ].map(
              value =>
                `
                  <option
                    ${
                      task?.priority === value
                        ? "selected"
                        : ""
                    }
                  >
                    ${value}
                  </option>
                `
            ).join("")}

          </select>

        </div>


        <div class="field">

          <label>
            Status
          </label>

          <select id="tDone">

            <option
              value="false"
              ${
                !task?.done
                  ? "selected"
                  : ""
              }
            >
              To Do
            </option>

            <option
              value="true"
              ${
                task?.done
                  ? "selected"
                  : ""
              }
            >
              Done
            </option>

          </select>

        </div>

      </div>

    `,

    () => {

      const item = {

        id:
          id || uid(),

        title:
          document.getElementById(
            "tTitle"
          ).value.trim(),

        group:
          document.getElementById(
            "tGroup"
          ).value,

        due:
          document.getElementById(
            "tDue"
          ).value,

        priority:
          document.getElementById(
            "tPriority"
          ).value,

        done:
          document.getElementById(
            "tDone"
          ).value === "true"
      };


      if (!item.title) {

        return toast(
          "Task title is required."
        );

      }


      if (id) {

        data.tasks =
          data.tasks.map(
            x =>
              x.id === id
                ? item
                : x
          );

      } else {

        data.tasks.push(
          item
        );

      }


      saveData();

      closeModal();

      renderTasks();

      toast(
        "Task saved."
      );

    }
  );
}


function deleteTask(id) {

  if (
    !ask(
      "Delete this task?"
    )
  ) {
    return;
  }


  data.tasks =
    data.tasks.filter(
      x => x.id !== id
    );


  saveData();

  renderTasks();

  toast(
    "Task deleted."
  );
}


/* =========================================================
   NOTES
   ========================================================= */

function renderNotes() {

  document.getElementById(
    "notes"
  ).innerHTML = `

    <div class="topline">

      <div>

        <div class="eyebrow">
          NOTES
        </div>

        <h1>
          Wedding Notes
        </h1>

      </div>


      <button
        class="btn"
        onclick="openNoteModal()"
      >
        ＋ Add Note
      </button>

    </div>


    <div class="grid grid-2">

      ${
        data.notes.length

          ? data.notes
              .map(
                note => `

                  <div class="card">

                    <div class="summary">

                      <h3>
                        ${esc(
                          note.title
                        )}
                      </h3>


                      <div class="actions">

                        <button
                          class="icon-btn"
                          onclick="openNoteModal(${note.id})"
                        >
                          Edit
                        </button>


                        <button
                          class="icon-btn"
                          onclick="deleteNote(${note.id})"
                        >
                          Delete
                        </button>

                      </div>

                    </div>


                    <p class="note">
                      ${esc(
                        note.text
                      )}
                    </p>


                    <div class="small muted">

                      Updated
                      ${
                        note.updated
                          ? new Date(
                              note.updated
                            ).toLocaleString(
                              "en-PH"
                            )
                          : ""
                      }

                    </div>

                  </div>

                `
              )
              .join("")

          : `
              <div class="card empty">
                No notes yet.
              </div>
            `
      }

    </div>

  `;
}


function openNoteModal(
  id = null
) {

  const note =
    id
      ? data.notes.find(
          x => x.id === id
        )
      : null;


  openModal(

    note
      ? "Edit Note"
      : "Add Note",

    `

      <div class="form-grid">

        <div class="field full">

          <label>
            Title
          </label>

          <input
            id="nTitle"
            value="${esc(
              note?.title || ""
            )}"
          >

        </div>


        <div class="field full">

          <label>
            Note
          </label>

          <textarea id="nText">${esc(
            note?.text || ""
          )}</textarea>

        </div>

      </div>

    `,

    () => {

      const item = {

        id:
          id || uid(),

        title:
          document.getElementById(
            "nTitle"
          ).value.trim(),

        text:
          document.getElementById(
            "nText"
          ).value.trim(),

        updated:
          new Date().toISOString()

      };


      if (!item.title) {

        return toast(
          "Note title is required."
        );

      }


      if (id) {

        data.notes =
          data.notes.map(
            x =>
              x.id === id
                ? item
                : x
          );

      } else {

        data.notes.push(
          item
        );

      }


      saveData();

      closeModal();

      renderNotes();

      toast(
        "Note saved."
      );

    }
  );
}


function deleteNote(id) {

  if (
    !ask(
      "Delete this note?"
    )
  ) {
    return;
  }


  data.notes =
    data.notes.filter(
      x => x.id !== id
    );


  saveData();

  renderNotes();

  toast(
    "Note deleted."
  );
}


/* =========================================================
   SETTINGS
   ========================================================= */

function renderSettings() {

  document.getElementById(
    "settings"
  ).innerHTML = `

    <div class="topline">

      <div>

        <div class="eyebrow">
          SETTINGS
        </div>

        <h1>
          Wedding Details
        </h1>

      </div>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>
            Couple Name
          </label>

          <input
            id="sName"
            value="${esc(
              data.couple.name
            )}"
            placeholder="e.g. Carl & Faith"
          >

        </div>


        <div class="field">

          <label>
            Wedding Date
          </label>

          <input
            id="sDate"
            type="date"
            value="${esc(
              data.couple.date
            )}"
          >

        </div>


        <div class="field full">

          <label>
            Venue
          </label>

          <input
            id="sVenue"
            value="${esc(
              data.couple.venue || ""
            )}"
            placeholder="Wedding venue"
          >

        </div>

      </div>


      <div class="modal-actions">

        <button
          class="btn"
          onclick="saveSettings()"
        >
          Save Changes
        </button>

      </div>

    </div>


    <div class="section-title">
      Google Form RSVP Connection
    </div>


    <div class="card">

      <h3>
        Show Google Form responses on the Guests page
      </h3>


      <p class="small muted">

        Your Google Form should save responses
        to a Google Sheet. Paste the Google Sheets
        response-sheet URL below.

        Only actual responses from the sheet
        will appear in the Guest List.

      </p>


      <div
        class="field"
        style="margin-top:14px"
      >

        <label>
          Google Sheets Response Sheet URL
        </label>

        <input
          id="googleSheetUrl"
          type="url"
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value="${esc(
            data.googleRsvp?.sheetUrl || ""
          )}"
        >

      </div>


      <div
        class="small muted"
        style="margin-top:10px"
      >

        <b>
          Important:
        </b>

        The response sheet must be accessible
        to the browser. Use a sheet that is
        published to the web or shared so it
        can be viewed without signing in.

      </div>


      <div
        class="modal-actions"
        style="margin-top:15px"
      >

        <button
          class="btn"
          onclick="saveGoogleRsvpSettings()"
        >
          Save & Test Connection
        </button>


        ${
          data.googleRsvp?.lastSync
            ? `
              <span
                class="small muted"
                style="align-self:center"
              >
                Last sync:
                ${esc(
                  new Date(
                    data.googleRsvp.lastSync
                  ).toLocaleString(
                    "en-PH",
                    {
                      dateStyle:
                        "medium",
                      timeStyle:
                        "short"
                    }
                  )
                )}
              </span>
            `
            : ""
        }

      </div>


      <div
        class="small muted"
        style="margin-top:15px"
      >

        <b>
          Setup:
        </b>

        Google Form →
        Responses →
        Link to Sheets →
        open the response spreadsheet →
        publish/share the response sheet →
        paste its URL here.

      </div>

    </div>


    <div class="section-title">
      Data Management
    </div>


    <div class="grid grid-2">

      <div class="card">

        <h3>
          Export Backup
        </h3>

        <p class="small muted">
          Download all wedding data as a JSON backup.
        </p>

        <button
          class="btn secondary"
          onclick="exportBackup()"
        >
          Export Backup
        </button>

      </div>


      <div class="card">

        <h3>
          Reset Data
        </h3>

        <p class="small muted">
          Clear your current wedding data.
          This removes saved guests, vendors,
          budget entries, RSVP responses,
          expenses and wedding details.
        </p>

        <button
          class="btn danger"
          onclick="resetData()"
        >
          Reset Everything
        </button>

      </div>

    </div>


    <div class="section-title">
      Currency
    </div>


    <div class="card">

      <h3>
        Philippine Peso
      </h3>

      <p class="small muted">
        All financial amounts are displayed
        in Philippine Peso (₱ / PHP).
      </p>

    </div>

  `;
}


/* =========================================================
   SAVE WEDDING DETAILS
   ========================================================= */

function saveSettings() {

  data.couple.name =
    document.getElementById(
      "sName"
    ).value.trim();


  data.couple.date =
    document.getElementById(
      "sDate"
    ).value;


  data.couple.venue =
    document.getElementById(
      "sVenue"
    ).value.trim();


  saveData();

  renderSettings();

  toast(
    "Wedding details saved."
  );
}


function openCoupleModal() {

  navigate(
    "settings"
  );
}


/* =========================================================
   GOOGLE RSVP SETTINGS
   ========================================================= */

function saveGoogleRsvpSettings() {

  const input =
    document.getElementById(
      "googleSheetUrl"
    );


  const value =
    input?.value.trim() || "";


  data.googleRsvp.sheetUrl =
    value;


  if (!value) {

    data.googleRsvp.responses =
      [];

    data.googleRsvp.lastSync =
      "";

    data.googleRsvp.status =
      "Not connected";

    saveData();

    renderSettings();

    toast(
      "Google RSVP connection removed."
    );

    return;
  }


  data.googleRsvp.status =
    "Connecting…";


  saveData();

  renderSettings();

  syncGoogleRsvp();
}


/* =========================================================
   BACKUP
   ========================================================= */

function exportBackup() {

  download(
    "amore-wedding-backup.json",
    JSON.stringify(
      data,
      null,
      2
    ),
    "application/json"
  );


  toast(
    "Backup downloaded."
  );
}


/* =========================================================
   RESET
   ========================================================= */

function resetData() {

  if (
    !ask(
      "Reset all data? Your current entries will be deleted."
    )
  ) {
    return;
  }


  data =
    clone(DEFAULT_DATA);


  normalize();

  saveData();


  currentPage =
    "dashboard";


  document
    .querySelectorAll(".nav-item")
    .forEach(button =>
      button.classList.toggle(
        "active",
        button.dataset.page ===
          "dashboard"
      )
    );


  render();

  toast(
    "All wedding data has been reset."
  );
}


/* =========================================================
   DOWNLOAD
   ========================================================= */

function download(
  filename,
  content,
  type
) {

  const blob =
    new Blob(
      [content],
      { type }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const a =
    document.createElement(
      "a"
    );


  a.href = url;

  a.download =
    filename;


  document.body.appendChild(
    a
  );


  a.click();


  a.remove();


  setTimeout(
    () =>
      URL.revokeObjectURL(
        url
      ),
    1000
  );
}


/* =========================================================
   MODAL
   ========================================================= */

function openModal(
  title,
  body,
  onSave
) {

  const root =
    document.getElementById(
      "modalRoot"
    );


  if (!root) {

    console.error(
      "modalRoot element was not found."
    );

    return;
  }


  root.innerHTML = `

    <div
      class="modal-backdrop"
      id="modalBackdrop"
    >

      <div class="modal">

        <div class="modal-head">

          <h2>
            ${esc(title)}
          </h2>


          <button
            class="modal-close"
            onclick="closeModal()"
          >
            ×
          </button>

        </div>


        ${body}


        <div class="modal-actions">

          <button
            class="btn secondary"
            onclick="closeModal()"
          >
            Cancel
          </button>


          <button
            class="btn"
            id="modalSave"
          >
            Save
          </button>

        </div>

      </div>

    </div>

  `;


  const saveButton =
    document.getElementById(
      "modalSave"
    );


  if (saveButton) {
    saveButton.onclick =
      onSave;
  }


  const backdrop =
    document.getElementById(
      "modalBackdrop"
    );


  if (backdrop) {

    backdrop.onclick =
      event => {

        if (
          event.target.id ===
          "modalBackdrop"
        ) {
          closeModal();
        }

      };

  }
}


function closeModal() {

  const root =
    document.getElementById(
      "modalRoot"
    );


  if (root) {
    root.innerHTML = "";
  }
}


/* =========================================================
   AUTO-SAVE WEDDING DATA WHEN PAGE IS LEFT
   ========================================================= */

window.addEventListener(
  "beforeunload",
  () => {
    saveData();
  }
);


/* =========================================================
   OPTIONAL AUTO-SYNC GOOGLE RSVP
   Every 60 seconds while page is open.
   This does NOT create guests.
   It only imports actual sheet responses.
   ========================================================= */

let googleSyncTimer = null;


function startGoogleAutoSync() {

  clearInterval(
    googleSyncTimer
  );


  googleSyncTimer =
    setInterval(
      async () => {

        if (
          data?.googleRsvp?.sheetUrl &&
          currentPage === "guests"
        ) {

          try {

            const rows =
              await fetchRsvpData(
                data.googleRsvp.sheetUrl
              );


            data.googleRsvp.responses =
              Array.isArray(rows)
                ? rows
                : [];


            data.googleRsvp.lastSync =
              new Date().toISOString();


            data.googleRsvp.status =
              "Connected";


            saveData();

            renderGuests();

          } catch (error) {

            console.warn(
              "Automatic RSVP sync failed:",
              error
            );

          }

        }

      },
      60000
    );
}


/* =========================================================
   START APPLICATION
   ========================================================= */

data =
  loadData();


normalize();


saveData();


render();


startGoogleAutoSync();
