let currentLang = "es";
let adminUsersCache = [];
let adminDownloadsCache = [];
let usersChartInstance = null;
let downloadsChartInstance = null;

function getLimaMonthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(date);

  const year = parts.find(p => p.type === "year")?.value;
  const month = parts.find(p => p.type === "month")?.value;

  return year && month ? `${year}-${month}` : null;
}

const I18N = {
  es: {
    title: "NexMath",
    badge: "VERSION BETA",
    hero_lead: "Matemáticas claras, estructuradas y a tu ritmo.",
    register: "Registrarse",
    login: "Iniciar sesión",
    feature_24: "24/7",
    feature_tutor: "Tutor virtual",
    feature_levels: "Niveles",
    feature_primary_secondary: "Primaria y Secundaria",
    feature_progress: "Progreso",
    feature_level_up: "Sube de nivel",
    start_today: "Comienza hoy",
    start_text: "Regístrate gratis y prueba una lección.",
    create_account: "Crear cuenta",
    full_name: "Nombre completo",
    age: "Edad",
    grade_placeholder: "Grado",
    grade_1_primary: "1ro Primaria",
    grade_2_primary: "2do Primaria",
    grade_3_primary: "3ro Primaria",
    grade_4_primary: "4to Primaria",
    grade_5_primary: "5to Primaria",
    grade_6_primary: "6to Primaria",
    grade_1_secondary: "1ro Secundaria",
    grade_2_secondary: "2do Secundaria",
    grade_3_secondary: "3ro Secundaria",
    grade_4_secondary: "4to Secundaria",
    grade_5_secondary: "5to Secundaria",
    school_placeholder: "Colegio",
    school_innova: "Innova Schools",
    school_public: "Colegio Público",
    school_private: "Colegio Particular",
    city: "Ciudad",
    country: "País",
    email_placeholder: "Correo electrónico",
    password_placeholder: "Contraseña",
    login_email_placeholder: "Correo",
    login_password_placeholder: "Contraseña",
    back: "Volver",
    what_is: "¿Qué es NexMath?",
    about_text: "NexMath es un asistente virtual que te guía paso a paso en matemáticas, adaptándose a tu grado y ritmo de aprendizaje.",
    roadmap_title: "Ruta de estudio",
    roadmap_1: "Regístrate y elige tu grado y colegio.",
    roadmap_2: "Explora los cursos recomendados según tu nivel.",
    roadmap_3: "Usa sugerencias y recursos para avanzar más rápido.",
    tips_title: "Tips",
    tip_1: "Estudia 20 minutos diarios",
    tip_2: "Practica todos los días",
    tip_3: "Refuerza lo que fallas",
    suggestions_title: "Sugerencias",
    send_suggestion: "Enviar sugerencia",
    explore_courses: "Explorar cursos",
    courses_title: "Cursos",
    open: "Entrar",
    syllabus: "Temario",
    reading_title: "Lectura",
    reading_span: "Para toda Primaria y Secundaria",
    primary_singapur_title: "Matemática Primaria — Método Singapur",
    primary_singapur_span: "Solo Innova Schools (Primaria)",
    primary_traditional_title: "Matemática Primaria — Método Tradicional",
    primary_traditional_span: "Para toda Primaria",
    arithmetic_title: "Aritmética",
    arithmetic_span: "Toda Secundaria",
    geometry_title: "Geometría",
    geometry_span: "Toda Secundaria",
    algebra_title: "Álgebra",
    algebra_span: "Toda Secundaria",
    reasoning_math_title: "Razonamiento Matemático",
    reasoning_math_span: "Toda Secundaria",
    reasoning_verbal_title: "Razonamiento Verbal",
    reasoning_verbal_span: "Toda Secundaria",
    trig_title: "Trigonometría",
    trig_span: "3ro, 4to y 5to de Secundaria",
    functions_title: "Funciones y Límites",
    functions_span: "3ro, 4to y 5to de Secundaria",
    chemistry_title: "Química",
    chemistry_span: "3ro, 4to y 5to de Secundaria",
    physics_title: "Física",
    physics_span: "3ro, 4to y 5to de Secundaria",
    biology_title: "Biología",
    biology_span: "3ro, 4to y 5to de Secundaria",
    calculus_title: "Cálculo Diferencial e Integral",
    calculus_span: "4to y 5to de Secundaria",
    complete_fields: "Completa todos los campos",
    register_ok: "Registro exitoso. Bienvenido a NexMath",
    error_register: "Error al registrar",
    connection_error: "Error de conexión",
    login_required: "Ingresa correo y contraseña",
    login_invalid: "Correo o contraseña incorrectos"
  },
  en: {
    title: "NexMath",
    badge: "BETA VERSION",
    hero_lead: "Clear, structured math at your own pace.",
    register: "Register",
    login: "Login",
    feature_24: "24/7",
    feature_tutor: "Virtual tutor",
    feature_levels: "Levels",
    feature_primary_secondary: "Primary and Secondary",
    feature_progress: "Progress",
    feature_level_up: "Level up",
    start_today: "Start today",
    start_text: "Sign up free and try a lesson.",
    create_account: "Create account",
    full_name: "Full name",
    age: "Age",
    grade_placeholder: "Grade",
    grade_1_primary: "1st Primary",
    grade_2_primary: "2nd Primary",
    grade_3_primary: "3rd Primary",
    grade_4_primary: "4th Primary",
    grade_5_primary: "5th Primary",
    grade_6_primary: "6th Primary",
    grade_1_secondary: "1st Secondary",
    grade_2_secondary: "2nd Secondary",
    grade_3_secondary: "3rd Secondary",
    grade_4_secondary: "4th Secondary",
    grade_5_secondary: "5th Secondary",
    school_placeholder: "School",
    school_innova: "Innova Schools",
    school_public: "Public school",
    school_private: "Private school",
    city: "City",
    country: "Country",
    email_placeholder: "Email address",
    password_placeholder: "Password",
    login_email_placeholder: "Email",
    login_password_placeholder: "Password",
    back: "Back",
    what_is: "What is NexMath?",
    about_text: "NexMath is a virtual assistant that guides you step by step in math, adapting to your grade and learning pace.",
    roadmap_title: "Learning path",
    roadmap_1: "Sign up and choose your grade and school.",
    roadmap_2: "Explore the recommended courses for your level.",
    roadmap_3: "Use suggestions and resources to move faster.",
    tips_title: "Tips",
    tip_1: "Study 20 minutes a day",
    tip_2: "Practice every day",
    tip_3: "Reinforce what you miss",
    suggestions_title: "Suggestions",
    send_suggestion: "Send suggestion",
    explore_courses: "Explore courses",
    courses_title: "Courses",
    open: "Open",
    syllabus: "Syllabus",
    reading_title: "Reading",
    reading_span: "For all Primary and Secondary students",
    primary_singapur_title: "Primary Math — Singapore Method",
    primary_singapur_span: "Innova Schools only (Primary)",
    primary_traditional_title: "Primary Math — Traditional Method",
    primary_traditional_span: "For all Primary students",
    arithmetic_title: "Arithmetic",
    arithmetic_span: "All Secondary",
    geometry_title: "Geometry",
    geometry_span: "All Secondary",
    algebra_title: "Algebra",
    algebra_span: "All Secondary",
    reasoning_math_title: "Math Reasoning",
    reasoning_math_span: "All Secondary",
    reasoning_verbal_title: "Verbal Reasoning",
    reasoning_verbal_span: "All Secondary",
    trig_title: "Trigonometry",
    trig_span: "3rd, 4th and 5th Secondary",
    functions_title: "Functions and Limits",
    functions_span: "3rd, 4th and 5th Secondary",
    chemistry_title: "Chemistry",
    chemistry_span: "3rd, 4th and 5th Secondary",
    physics_title: "Physics",
    physics_span: "3rd, 4th and 5th Secondary",
    biology_title: "Biology",
    biology_span: "3rd, 4th and 5th Secondary",
    calculus_title: "Differential and Integral Calculus",
    calculus_span: "4th and 5th Secondary",
    complete_fields: "Complete all fields",
    register_ok: "Registration successful. Welcome to NexMath",
    error_register: "Error while registering",
    connection_error: "Connection error",
    login_required: "Enter email and password",
    login_invalid: "Incorrect email or password"
  }
};

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || (I18N.es && I18N.es[key]) || key;
}

function applyLanguage(lang) {
  currentLang = I18N[lang] ? lang : "es";
  localStorage.setItem("nexmath_lang", currentLang);
  document.documentElement.lang = currentLang;
  document.title = t("title");

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (I18N[currentLang] && I18N[currentLang][key] !== undefined) {
      el.textContent = I18N[currentLang][key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (I18N[currentLang] && I18N[currentLang][key] !== undefined) {
      el.setAttribute("placeholder", I18N[currentLang][key]);
    }
  });

  const trigger = document.getElementById("langTrigger");
  if (trigger) {
    trigger.innerHTML = currentLang === "en" ? "🇬🇧 EN ▾" : "🇪🇸 ES ▾";
  }
}

function initLanguage() {
  const saved = localStorage.getItem("nexmath_lang");
  const browserLang = (navigator.language || navigator.userLanguage || "es").toLowerCase();
  const initial = saved || (browserLang.startsWith("en") ? "en" : "es");
  applyLanguage(initial);

  const langMenu = document.querySelector(".lang-menu");
  const trigger = document.getElementById("langTrigger");
  const options = document.getElementById("langOptions");

  if (trigger && langMenu && options) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      langMenu.classList.toggle("open");
    });

    options.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-lang]");
      if (!btn) return;
      applyLanguage(btn.dataset.lang);
      langMenu.classList.remove("open");
    });

    document.addEventListener("click", (e) => {
      if (!langMenu.contains(e.target)) {
        langMenu.classList.remove("open");
      }
    });
  }
}

function mostrar(id) {
  const target = document.getElementById(id);
  if (id === "admin" && !isAdminMode()) return;

  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  if (target) {
    target.classList.add("active");
    window.scrollTo(0, 0);
  }

  if (id === "cursos") filtrarCursos();
  if (id === "admin") loadAdminData();
}

function parseGradeInfo(value) {
  const raw = String(value || "").toLowerCase().trim();
  const numMatch = raw.match(/\d+/);
  const num = numMatch ? parseInt(numMatch[0], 10) : null;

  const stage = (raw.includes("primaria") || raw.includes("primary"))
    ? "primary"
    : (raw.includes("secundaria") || raw.includes("secondary"))
      ? "secondary"
      : null;

  return { stage, num };
}

async function registrar() {
  const datos = {
    nombre: document.getElementById("nombre").value.trim(),
    edad: document.getElementById("edad").value,
    grado: document.getElementById("grado").value.trim(),
    colegio: document.getElementById("colegio").value.trim(),
    ciudad: document.getElementById("ciudad").value.trim(),
    pais: document.getElementById("pais").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value
  };

  if (!datos.nombre || !datos.email || !datos.password || !datos.grado || !datos.colegio || !datos.ciudad || !datos.pais) {
    alert(t("complete_fields"));
    return;
  }

  try {
    const res = await fetch("/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    const r = await res.json();

    if (r.ok) {
      localStorage.setItem("perfil", JSON.stringify({
        grado: datos.grado.toLowerCase(),
        colegio: datos.colegio.toLowerCase()
      }));
      alert(t("register_ok"));
      mostrar("principal");
    } else {
      alert(r.mensaje || t("error_register"));
    }
  } catch {
    alert(t("connection_error"));
  }
}

function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPass").value.trim();

  if (!email || !password) {
    alert(t("login_required"));
    return;
  }

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  .then(r => r.json())
  .then(d => {
    if (d.acceso) {
      mostrar("principal");
    } else {
      alert(t("login_invalid"));
    }
  })
  .catch(() => alert(t("connection_error")));
}

function filtrarCursos() {
  const raw = localStorage.getItem("perfil");
  const cards = document.querySelectorAll(".course");

  if (!raw) {
    cards.forEach(c => c.style.display = "block");
    return;
  }

  const perfil = JSON.parse(raw);
  const grado = perfil.grado || "";
  const colegio = (perfil.colegio || "").toLowerCase();
  const { stage, num } = parseGradeInfo(grado);

  cards.forEach(c => c.style.display = "none");

  if (stage === "primary") {
    document.querySelectorAll('.course[data-stage="all"]').forEach(c => c.style.display = "block");
    if (colegio.includes("innova")) {
      document.querySelectorAll('.course[data-stage="primary"].singapur').forEach(c => c.style.display = "block");
    } else {
      document.querySelectorAll('.course[data-stage="primary"].tradicional').forEach(c => c.style.display = "block");
    }
    return;
  }

  if (stage === "secondary") {
    document.querySelectorAll('.course[data-stage="all"]').forEach(c => c.style.display = "block");

    cards.forEach(card => {
      if (card.dataset.stage !== "secondary") return;
      const min = parseInt(card.dataset.min || "1", 10);
      const max = parseInt(card.dataset.max || "99", 10);
      if (num === null || (num >= min && num <= max)) {
        card.style.display = "block";
      }
    });
    return;
  }

  cards.forEach(c => c.style.display = "block");
}

function getAdminToken() {
  const url = new URL(window.location.href);
  const q = url.searchParams.get("admin");
  const saved = sessionStorage.getItem("nexmath_admin");
  if (q) return q;
  if (saved) return saved;
  return null;
}

function isAdminMode() {
  return !!getAdminToken();
}

function initAdminAccess() {
  const url = new URL(window.location.href);
  const q = url.searchParams.get("admin");

  if (q) {
    sessionStorage.setItem("nexmath_admin", q);
    mostrar("admin");
  }
}

function salirAdmin() {
  sessionStorage.removeItem("nexmath_admin");
  const url = new URL(window.location.href);
  url.searchParams.delete("admin");
  history.replaceState({}, "", url.pathname + url.search + url.hash);
  mostrar("inicio");
}

function safeText(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function formatDate(value) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString(currentLang === "en" ? "en-US" : "es-PE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return String(value);
  }
}

function shortFileName(name) {
  return String(name || "").replaceAll("_", " ").replaceAll(".xlsx", "").replaceAll(".pdf", "");
}

async function loadAdminData() {
  if (!isAdminMode()) return;

  try {
    const key = getAdminToken();
    const res = await fetch(`/admin-data?key=${encodeURIComponent(key)}`);
    if (!res.ok) {
      alert("No autorizado");
      salirAdmin();
      return;
    }

    const data = await res.json();
    adminUsersCache = data.users || [];
    adminDownloadsCache = data.downloads || [];

    renderAdminStats(data.summary || {});
    renderUsersChart(data.monthly || []);
    renderDownloadsChart(adminDownloadsCache);
    renderAdminTable();
    renderDownloadsTable();
    filterAdminTable();
    renderQuickDownloads();
  } catch (e) {
    console.error(e);
    alert("No se pudo cargar el panel admin");
  }
}

function renderAdminStats(summary) {
  const map = {
    statTotal: summary.total ?? 0,
    statPrimary: summary.primary ?? 0,
    statSecondary: summary.secondary ?? 0,
    statMonth: summary.thisMonth ?? 0,
    statDownloads: summary.downloads ?? 0
  };

  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

function roundValues(values) {
  return values.map(v => Math.round(Number(v) || 0));
}

function renderUsersChart(monthly) {
  const canvas = document.getElementById("usersChart");
  if (!canvas || typeof Chart === "undefined") return;

  if (usersChartInstance) usersChartInstance.destroy();

  const labels = monthly.map(m => m.month);
  const values = roundValues(monthly.map(m => m.count));

  usersChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Usuarios",
        data: values,
        backgroundColor: "rgba(82, 243, 195, 0.85)",
        borderWidth: 0,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#fff" }
        }
      },
      scales: {
        x: {
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.08)" }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#fff",
            stepSize: 1,
            precision: 0
          },
          grid: { color: "rgba(255,255,255,0.08)" }
        }
      }
    }
  });
}

function renderDownloadsChart(downloads) {
  const canvas = document.getElementById("downloadsChart");
  if (!canvas || typeof Chart === "undefined") return;

  if (downloadsChartInstance) downloadsChartInstance.destroy();

  const labels = downloads.map(d => shortFileName(d.file_name));
  const values = roundValues(downloads.map(d => d.downloads));

  downloadsChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Descargas",
        data: values,
        backgroundColor: "rgba(255, 121, 198, 0.85)",
        borderWidth: 0,
        borderRadius: 8
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#fff" }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            color: "#fff",
            stepSize: 1,
            precision: 0
          },
          grid: { color: "rgba(255,255,255,0.08)" }
        },
        y: {
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.08)" }
        }
      }
    }
  });
}

function renderQuickDownloads() {
  const wrap = document.getElementById("downloadsQuick");
  if (!wrap) return;

  const top = [...adminDownloadsCache]
    .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
    .slice(0, 5);

  if (!top.length) {
    wrap.innerHTML = `<div class="quick-item"><strong>Sin descargas aún</strong><span>—</span></div>`;
    return;
  }

  wrap.innerHTML = top.map(item => `
    <div class="quick-item">
      <strong>${safeText(shortFileName(item.file_name))}</strong>
      <span>${Number(item.downloads || 0)}</span>
    </div>
  `).join("");
}

function escapeAttr(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderAdminTable() {
  const tbody = document.getElementById("adminTableBody");
  if (!tbody) return;

  if (!adminUsersCache.length) {
    tbody.innerHTML = `<tr><td colspan="11" class="admin-empty">No hay usuarios registrados aún.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminUsersCache.map((user, index) => {
    const searchText = [
      index + 1,
      user.id,
      user.nombre,
      user.edad,
      user.grado,
      user.colegio,
      user.ciudad,
      user.pais,
      user.email
    ].join(" ").toLowerCase();

    return `
      <tr class="admin-row" data-search="${escapeAttr(searchText)}" data-id="${user.id}">
        <td>${index + 1}</td>
        <td><input class="admin-input" data-field="nombre" value="${escapeAttr(user.nombre)}"></td>
        <td><input class="admin-input" data-field="edad" value="${escapeAttr(user.edad)}"></td>
        <td><input class="admin-input" data-field="grado" value="${escapeAttr(user.grado)}"></td>
        <td><input class="admin-input" data-field="colegio" value="${escapeAttr(user.colegio)}"></td>
        <td><input class="admin-input" data-field="ciudad" value="${escapeAttr(user.ciudad)}"></td>
        <td><input class="admin-input" data-field="pais" value="${escapeAttr(user.pais)}"></td>
        <td><input class="admin-input" data-field="email" value="${escapeAttr(user.email)}"></td>
        <td><input class="admin-input" data-field="password" value="${escapeAttr(user.password)}"></td>
        <td><input class="admin-input readonly" data-field="fecha" value="${escapeAttr(formatDate(user.fecha))}" readonly></td>
        <td>
          <div class="admin-actions-cell">
            <button class="admin-save" type="button" onclick="saveAdminUser(${user.id})">Guardar</button>
            <button class="admin-delete" type="button" onclick="deleteAdminUser(${user.id})">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderDownloadsTable() {
  const tbody = document.getElementById("downloadsTableBody");
  if (!tbody) return;

  if (!adminDownloadsCache.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="admin-empty">No hay descargas registradas aún.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminDownloadsCache.map(item => `
    <tr class="admin-row">
      <td>${safeText(shortFileName(item.file_name))}</td>
      <td>${Number(item.downloads || 0)}</td>
      <td>${safeText(formatDate(item.last_download_at))}</td>
    </tr>
  `).join("");
}

function filterAdminTable() {
  const input = document.getElementById("adminSearch");
  const q = (input?.value || "").trim().toLowerCase();
  const rows = document.querySelectorAll("#adminTableBody tr.admin-row");

  rows.forEach(row => {
    const hay = (row.dataset.search || "").toLowerCase();
    row.style.display = !q || hay.includes(q) ? "" : "none";
  });
}

function rowPayload(id) {
  const row = document.querySelector(`#adminTableBody tr[data-id="${id}"]`);
  if (!row) return null;

  const get = field => row.querySelector(`[data-field="${field}"]`)?.value?.trim() || "";

  return {
    id,
    nombre: get("nombre"),
    edad: get("edad"),
    grado: get("grado"),
    colegio: get("colegio"),
    ciudad: get("ciudad"),
    pais: get("pais"),
    email: get("email"),
    password: get("password")
  };
}

async function saveAdminUser(id) {
  const payload = rowPayload(id);
  if (!payload) return;

  try {
    const key = getAdminToken();
    const res = await fetch(`/admin-user?key=${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.ok) {
      alert(data.mensaje || "No se pudo guardar");
      return;
    }

    await loadAdminData();
    alert("Usuario actualizado");
  } catch (e) {
    console.error(e);
    alert("Error al guardar");
  }
}

async function deleteAdminUser(id) {
  if (!confirm("¿Eliminar este usuario?")) return;

  try {
    const key = getAdminToken();
    const res = await fetch(`/admin-user?key=${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    const data = await res.json();
    if (!data.ok) {
      alert(data.mensaje || "No se pudo eliminar");
      return;
    }

    await loadAdminData();
    alert("Usuario eliminado");
  } catch (e) {
    console.error(e);
    alert("Error al eliminar");
  }
}

function exportAdmin(format) {
  const key = getAdminToken();
  if (!key) return;

  const url = new URL("/admin-export", window.location.origin);
  url.searchParams.set("key", key);
  url.searchParams.set("format", format);

  if (format === "pdf-monthly") {
    url.searchParams.set("month", getLimaMonthKey() || "");
  }

  window.open(url.toString(), "_blank");
}

document.addEventListener("DOMContentLoaded", () => {
  initLanguage();
  initAdminAccess();
});