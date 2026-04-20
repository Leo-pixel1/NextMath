const express = require("express");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const ADMIN_KEY = process.env.ADMIN_KEY || "LeonardoG19";

const pool = new Pool({
  user: process.env.PGUSER || "postgres",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "postgres",
  password: process.env.PGPASSWORD || "leonardo1908",
  port: Number(process.env.PGPORT || 5433),
});

function monthKeyTZ(dateValue, timeZone = "America/Lima") {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit"
  }).formatToParts(d);

  const year = parts.find(p => p.type === "year")?.value;
  const month = parts.find(p => p.type === "month")?.value;

  return year && month ? `${year}-${month}` : null;
}

function currentMonthKeyTZ(timeZone = "America/Lima") {
  return monthKeyTZ(new Date(), timeZone);
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      edad TEXT,
      grado TEXT NOT NULL,
      colegio TEXT NOT NULL,
      ciudad TEXT NOT NULL,
      pais TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS temario_downloads (
      file_name TEXT PRIMARY KEY,
      downloads INTEGER NOT NULL DEFAULT 0,
      last_download_at TIMESTAMPTZ
    )
  `);
}

function verifyAdmin(req, res) {
  if (req.query.key !== ADMIN_KEY) {
    res.sendStatus(403);
    return false;
  }
  return true;
}

function sanitizeFileName(name) {
  return path.basename(String(name || ""));
}

const appTemariosDir = path.join(__dirname, "public", "temarios");

function ensureFileInsideTemarios(fileName) {
  const filePath = path.join(appTemariosDir, fileName);
  const resolved = path.resolve(filePath);
  const baseResolved = path.resolve(appTemariosDir);
  if (!resolved.startsWith(baseResolved)) return null;
  return filePath;
}

async function incrementDownload(fileName) {
  await pool.query(
    `
    INSERT INTO temario_downloads (file_name, downloads, last_download_at)
    VALUES ($1, 1, NOW())
    ON CONFLICT (file_name)
    DO UPDATE SET
      downloads = temario_downloads.downloads + 1,
      last_download_at = NOW()
    `,
    [fileName]
  );
}

function buildPlaceholderWorkbook(fileName) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["Temario no encontrado"],
    [fileName],
    ["Crea o renombra el archivo en public/temarios/ para reemplazar este placeholder."]
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Temario");
  return XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
}

function getUsersMonthCount(users, monthKey) {
  return users.filter(u => monthKeyTZ(u.fecha) === monthKey).length;
}

function statsFromUsers(users, monthKey = currentMonthKeyTZ()) {
  const total = users.length;
  const primary = users.filter(u => String(u.grado || "").toLowerCase().includes("primaria")).length;
  const secondary = users.filter(u => String(u.grado || "").toLowerCase().includes("secundaria")).length;
  const thisMonth = getUsersMonthCount(users, monthKey);
  return { total, primary, secondary, thisMonth };
}

function monthlyUserStats(users) {
  const map = new Map();

  users.forEach(u => {
    const key = monthKeyTZ(u.fecha);
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));
}

function escapeCsv(value) {
  const s = String(value ?? "");
  return `"${s.replaceAll('"', '""')}"`;
}

function formatFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-PE");
}

function renderPdfTable(doc, title, headers, rows, options = {}) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startX = doc.page.margins.left;
  let y = doc.y + 8;

  const rowHeight = options.rowHeight || 22;
  const headerHeight = options.headerHeight || 24;
  const colWidths = options.colWidths || headers.map(() => pageWidth / headers.length);

  // Título
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#111").text(title, startX, y);
  y += 18;

  function drawHeader() {
    let x = startX;
    headers.forEach((h, i) => {
      const w = colWidths[i];
      doc.rect(x, y, w, headerHeight).fill("#ffd54f");
      doc.fillColor("#0f2027")
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(h, x + 4, y + 7, { width: w - 8 });
      x += w;
    });
    y += headerHeight;
  }

  function checkPageBreak() {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;

      // 🔥 CLAVE: volver a dibujar encabezado
      drawHeader();
    }
  }

  // Dibujar encabezado inicial
  drawHeader();

  doc.font("Helvetica").fontSize(8).fillColor("#111");

  rows.forEach(row => {
    checkPageBreak();

    let x = startX;

    row.forEach((cell, i) => {
      const w = colWidths[i];

      doc.rect(x, y, w, rowHeight).stroke("#cccccc");

      doc.text(String(cell ?? ""), x + 4, y + 6, {
        width: w - 8,
      });

      x += w;
    });

    y += rowHeight;
  });

  doc.y = y + 10;
}

function createPdfBuffer(users, downloads, options = {}) {
  return new Promise(resolve => {
    const monthKey = options.monthKey || null;
    const filteredUsers = monthKey ? users.filter(u => monthKeyTZ(u.fecha) === monthKey) : users;
    const title = monthKey ? `Panel de Administración NexMath - Mes ${monthKey}` : "Panel de Administración NexMath";

    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
    const chunks = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.font("Helvetica-Bold").fontSize(22).fillColor("#0f2027").text(title, { align: "center" });
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(11).fillColor("#333").text(
      monthKey ? "Resumen del mes seleccionado, usuarios y descargas de temarios." : "Resumen general, usuarios y descargas de temarios.",
      { align: "center" }
    );
    doc.moveDown(1);

    const total = filteredUsers.length;
    const primary = filteredUsers.filter(u => String(u.grado || "").toLowerCase().includes("primaria")).length;
    const secondary = filteredUsers.filter(u => String(u.grado || "").toLowerCase().includes("secundaria")).length;
    const totalDownloads = downloads.reduce((a, b) => a + Number(b.downloads || 0), 0);

    const summaryRows = [
      ["Total usuarios", total],
      ["Primaria", primary],
      ["Secundaria", secondary],
      ["Este mes", monthKey ? total : statsFromUsers(users).thisMonth],
      ["Descargas temarios", totalDownloads]
    ];

    summaryRows.forEach(([k, v]) => {
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f2027").text(`${k}:`, { continued: true });
      doc.font("Helvetica").text(` ${v}`);
    });

    doc.moveDown(1);

    const usersRows = filteredUsers.map((u, index) => [
      index + 1, // 🔥 contador continuo (1,2,3,4...),
      u.nombre,
      u.edad,
      u.grado,
      u.colegio,
      u.ciudad,
      u.pais,
      u.email,
      formatFecha(u.fecha)
    ]);

    renderPdfTable(
      doc,
      monthKey ? `Usuarios del mes ${monthKey}` : "Usuarios",
      ["N°", "Nombre", "Edad", "Grado", "Colegio", "Ciudad", "País", "Email", "Fecha"],
      usersRows,
      { colWidths: [30, 95, 45, 85, 95, 80, 70, 160, 110], rowHeight: 20 }
    );

    const downloadsRows = downloads.map(d => [
      d.file_name,
      d.downloads,
      formatFecha(d.last_download_at)
    ]);

    renderPdfTable(
      doc,
      "Descargas de temarios",
      ["Temario", "Descargas", "Última descarga"],
      downloadsRows,
      { colWidths: [360, 120, 180], rowHeight: 22 }
    );

    doc.end();
  });
}

app.post("/registro", async (req, res) => {
  const {
    nombre,
    edad,
    grado,
    colegio,
    ciudad,
    pais,
    email,
    password
  } = req.body || {};

  const nombreClean = String(nombre || "").trim();
  const emailClean = String(email || "").trim().toLowerCase();

  if (!nombreClean || !grado || !colegio || !ciudad || !pais || !emailClean || !password) {
    return res.json({ ok: false, mensaje: "Faltan campos" });
  }

  try {
    const existe = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [emailClean]
    );

    if (existe.rows.length) {
      return res.json({ ok: false, mensaje: "El correo ya está registrado" });
    }

    await pool.query(
      `INSERT INTO usuarios (nombre, edad, grado, colegio, ciudad, pais, email, password)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        nombreClean,
        String(edad || ""),
        String(grado).trim(),
        String(colegio).trim(),
        String(ciudad).trim(),
        String(pais).trim(),
        emailClean,
        String(password)
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error en /registro:", err);
    res.status(500).json({ ok: false, mensaje: "Error en el servidor" });
  }
});

app.post("/register", async (req, res) => {
  const {
    nombre,
    edad,
    grado,
    colegio,
    ciudad,
    pais,
    email,
    password
  } = req.body || {};

  const nombreClean = String(nombre || "").trim();
  const emailClean = String(email || "").trim().toLowerCase();

  if (!nombreClean || !grado || !colegio || !ciudad || !pais || !emailClean || !password) {
    return res.json({ ok: false, mensaje: "Faltan campos" });
  }

  try {
    const existe = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [emailClean]
    );

    if (existe.rows.length) {
      return res.json({ ok: false, mensaje: "El correo ya está registrado" });
    }

    await pool.query(
      `INSERT INTO usuarios (nombre, edad, grado, colegio, ciudad, pais, email, password)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        nombreClean,
        String(edad || ""),
        String(grado).trim(),
        String(colegio).trim(),
        String(ciudad).trim(),
        String(pais).trim(),
        emailClean,
        String(password)
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error en /register:", err);
    res.status(500).json({ ok: false, mensaje: "Error en el servidor" });
  }
});

app.post("/login", async (req, res) => {
  const emailClean = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!emailClean || !password) {
    return res.json({ acceso: false, ok: false, mensaje: "Faltan datos" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1 AND password = $2",
      [emailClean, password]
    );

    if (result.rows.length === 0) {
      return res.json({ acceso: false, ok: false, mensaje: "Credenciales incorrectas" });
    }

    res.json({ acceso: true, ok: true, user: result.rows[0] });
  } catch (err) {
    console.error("Error en /login:", err);
    res.status(500).json({ acceso: false, ok: false, mensaje: "Error en el servidor" });
  }
});

app.get("/admin-data", async (req, res) => {
  if (!verifyAdmin(req, res)) return;

  try {
    const users = await pool.query(`
      SELECT id, nombre, edad, grado, colegio, ciudad, pais, email, password, fecha
      FROM usuarios
      ORDER BY id ASC
    `);

    const downloads = await pool.query(`
      SELECT file_name, downloads, last_download_at
      FROM temario_downloads
      ORDER BY downloads DESC, file_name ASC
    `);

    const monthKey = currentMonthKeyTZ();

    res.json({
      ok: true,
      users: users.rows,
      downloads: downloads.rows,
      summary: {
        ...statsFromUsers(users.rows, monthKey),
        downloads: downloads.rows.reduce((a, b) => a + Number(b.downloads || 0), 0)
      },
      monthly: monthlyUserStats(users.rows)
    });
  } catch (err) {
    console.error("Error en /admin-data:", err);
    res.status(500).json({ ok: false, mensaje: "No se pudo cargar el panel admin" });
  }
});

app.put("/admin-user", async (req, res) => {
  if (!verifyAdmin(req, res)) return;

  const { id, nombre, edad, grado, colegio, ciudad, pais, email, password } = req.body || {};
  const userId = Number(id);
  const emailClean = String(email || "").trim().toLowerCase();

  if (!userId || !nombre || !grado || !colegio || !ciudad || !pais || !emailClean || !password) {
    return res.json({ ok: false, mensaje: "Faltan campos" });
  }

  try {
    const duplicate = await pool.query(
      `SELECT id FROM usuarios WHERE email = $1 AND id <> $2`,
      [emailClean, userId]
    );

    if (duplicate.rows.length) {
      return res.json({ ok: false, mensaje: "Ese correo ya pertenece a otro usuario" });
    }

    await pool.query(
      `
      UPDATE usuarios
      SET nombre = $1, edad = $2, grado = $3, colegio = $4, ciudad = $5, pais = $6, email = $7, password = $8
      WHERE id = $9
      `,
      [
        String(nombre).trim(),
        String(edad).trim(),
        String(grado).trim(),
        String(colegio).trim(),
        String(ciudad).trim(),
        String(pais).trim(),
        emailClean,
        String(password),
        userId
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error en /admin-user PUT:", err);
    res.status(500).json({ ok: false, mensaje: "No se pudo actualizar" });
  }
});

app.delete("/admin-user", async (req, res) => {
  if (!verifyAdmin(req, res)) return;

  const userId = Number(req.body?.id);
  if (!userId) {
    return res.json({ ok: false, mensaje: "ID inválido" });
  }

  try {
    await pool.query(`DELETE FROM usuarios WHERE id = $1`, [userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error en /admin-user DELETE:", err);
    res.status(500).json({ ok: false, mensaje: "No se pudo eliminar" });
  }
});

app.get("/admin-export", async (req, res) => {
  if (!verifyAdmin(req, res)) return;

  const format = String(req.query.format || "csv").toLowerCase();

  try {
    const usersResult = await pool.query(`
      SELECT id, nombre, edad, grado, colegio, ciudad, pais, email, password, fecha
      FROM usuarios
      ORDER BY id ASC
    `);

    const downloadsResult = await pool.query(`
      SELECT file_name, downloads, last_download_at
      FROM temario_downloads
      ORDER BY downloads DESC, file_name ASC
    `);

    const users = usersResult.rows;
    const downloads = downloadsResult.rows;

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();
      const usersSheet = XLSX.utils.json_to_sheet(users);
      const downloadsSheet = XLSX.utils.json_to_sheet(downloads);

      XLSX.utils.book_append_sheet(wb, usersSheet, "Usuarios");
      XLSX.utils.book_append_sheet(wb, downloadsSheet, "Temarios");

      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="nexmath_admin.xlsx"');
      return res.send(buffer);
    }

    if (format === "pdf") {
      const buffer = await createPdfBuffer(users, downloads, {});
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'inline; filename="nexmath_admin.pdf"');
      return res.send(buffer);
    }

    if (format === "pdf-monthly") {
      const monthKey = String(req.query.month || currentMonthKeyTZ() || "").trim();
      const buffer = await createPdfBuffer(users, downloads, { monthKey });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="nexmath_admin_${monthKey}.pdf"`);
      return res.send(buffer);
    }

    const headers = ["id", "nombre", "edad", "grado", "colegio", "ciudad", "pais", "email", "password", "fecha"];
    const lines = [
      headers.join(","),
      ...users.map(u => headers.map(h => escapeCsv(u[h])).join(","))
    ];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="usuarios.csv"');
    return res.send(lines.join("\n"));
  } catch (err) {
    console.error("Error en /admin-export:", err);
    res.status(500).send("Error al exportar");
  }
});

app.get("/temario/:file", async (req, res) => {
  const fileName = sanitizeFileName(req.params.file);
  if (!fileName) return res.sendStatus(400);

  const filePath = ensureFileInsideTemarios(fileName);
  if (!filePath) return res.sendStatus(400);

  try {
    await incrementDownload(fileName);

    if (fs.existsSync(filePath)) {
      return res.download(filePath, fileName);
    }

    const buffer = buildPlaceholderWorkbook(fileName);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (err) {
    console.error("Error en /temario/:file:", err);
    return res.status(500).send("No se pudo descargar el temario");
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function start() {
  await initDb();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log("Servidor activo en puerto " + PORT);
  });
}

start().catch(err => {
  console.error("Error iniciando servidor:", err);
  process.exit(1);
});