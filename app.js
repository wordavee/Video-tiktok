(() => {
  "use strict";

  const SIZE_PRESETS = {
    portrait34: { width: 1080, height: 1440, label: "HD 3:4" },
    story916: { width: 1080, height: 1920, label: "HD 9:16" },
    feed45: { width: 1080, height: 1350, label: "Feed 4:5" },
    square: { width: 1080, height: 1080, label: "Kotak" },
  };

  const DEFAULT_STYLE = {
    fontSize: 76,
    textPositionX: 50,
    textPosition: 57,
    textWidth: 88,
    strokeWidth: 12,
    lineHeight: 100,
    autoFit: true,
  };

  const state = {
    rawRows: [],
    hasHeader: false,
    sentences: [],
    photos: [],
    previewIndex: 0,
    fontFamily: 'Arial, Helvetica, sans-serif',
    customFontName: "",
    cancelRequested: false,
    toastTimer: null,
    previewFrame: 0,
  };

  const $ = (id) => document.getElementById(id);

  const ui = {
    excelInput: $("excelInput"),
    excelDropzone: $("excelDropzone"),
    excelStatus: $("excelStatus"),
    excelFileName: $("excelFileName"),
    excelFileInfo: $("excelFileInfo"),
    clearExcel: $("clearExcel"),
    columnRow: $("columnRow"),
    columnSelect: $("columnSelect"),
    sentenceCount: $("sentenceCount"),
    photoInput: $("photoInput"),
    photoDropzone: $("photoDropzone"),
    photoCount: $("photoCount"),
    photoStrip: $("photoStrip"),
    photoMapping: $("photoMapping"),
    sizePreset: $("sizePreset"),
    outputFormat: $("outputFormat"),
    fontInput: $("fontInput"),
    fontLabel: $("fontLabel"),
    fontSize: $("fontSize"),
    fontSizeValue: $("fontSizeValue"),
    textPositionX: $("textPositionX"),
    textPositionXValue: $("textPositionXValue"),
    textPosition: $("textPosition"),
    textPositionValue: $("textPositionValue"),
    textWidth: $("textWidth"),
    textWidthValue: $("textWidthValue"),
    strokeWidth: $("strokeWidth"),
    strokeWidthValue: $("strokeWidthValue"),
    lineHeight: $("lineHeight"),
    lineHeightValue: $("lineHeightValue"),
    autoFit: $("autoFit"),
    resetStyle: $("resetStyle"),
    exportCount: $("exportCount"),
    exportHint: $("exportHint"),
    generateButton: $("generateButton"),
    previewCanvas: $("previewCanvas"),
    previewEmpty: $("previewEmpty"),
    previewIndex: $("previewIndex"),
    previewResolution: $("previewResolution"),
    previewFileName: $("previewFileName"),
    prevPreview: $("prevPreview"),
    nextPreview: $("nextPreview"),
    progressDialog: $("progressDialog"),
    progressTitle: $("progressTitle"),
    progressDetail: $("progressDetail"),
    progressBar: $("progressBar"),
    progressPercent: $("progressPercent"),
    progressCounter: $("progressCounter"),
    cancelGeneration: $("cancelGeneration"),
    toast: $("toast"),
  };

  function init() {
    bindDropzone(ui.excelDropzone, ui.excelInput, (files) => handleExcelFile(files[0]));
    bindDropzone(ui.photoDropzone, ui.photoInput, (files) => handlePhotoFiles(files), true);

    ui.excelInput.addEventListener("change", () => handleExcelFile(ui.excelInput.files[0]));
    ui.photoInput.addEventListener("change", () => handlePhotoFiles([...ui.photoInput.files]));
    ui.clearExcel.addEventListener("click", clearExcel);
    ui.columnSelect.addEventListener("change", updateSentencesFromColumn);
    ui.photoMapping.addEventListener("change", requestPreview);
    ui.sizePreset.addEventListener("change", () => {
      requestPreview();
      updateExportState();
    });
    ui.outputFormat.addEventListener("change", () => {
      requestPreview();
      updateExportState();
    });
    ui.fontInput.addEventListener("change", () => handleFontFile(ui.fontInput.files[0]));
    ui.resetStyle.addEventListener("click", resetStyle);
    ui.prevPreview.addEventListener("click", () => movePreview(-1));
    ui.nextPreview.addEventListener("click", () => movePreview(1));
    bindCanvasDragging();
    ui.generateButton.addEventListener("click", generateAll);
    ui.cancelGeneration.addEventListener("click", () => {
      state.cancelRequested = true;
      ui.cancelGeneration.disabled = true;
      ui.cancelGeneration.textContent = "Membatalkan…";
    });
    ui.progressDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      state.cancelRequested = true;
    });

    const sliderConfigs = [
      [ui.fontSize, ui.fontSizeValue, (v) => `${v} px`],
      [ui.textPositionX, ui.textPositionXValue, (v) => `${v}%`],
      [ui.textPosition, ui.textPositionValue, (v) => `${v}%`],
      [ui.textWidth, ui.textWidthValue, (v) => `${v}%`],
      [ui.strokeWidth, ui.strokeWidthValue, (v) => `${v} px`],
      [ui.lineHeight, ui.lineHeightValue, (v) => `${(v / 100).toFixed(2)}×`],
    ];

    sliderConfigs.forEach(([input, output, format]) => {
      const update = () => {
        output.value = format(Number(input.value));
        updateRangeFill(input);
        requestPreview();
      };
      input.addEventListener("input", update);
      update();
    });
    ui.autoFit.addEventListener("change", requestPreview);

    updateCounts();
    updateExportState();
    renderPreview();
  }

  function bindDropzone(zone, input, callback, multiple = false) {
    ["dragenter", "dragover"].forEach((type) => {
      zone.addEventListener(type, (event) => {
        event.preventDefault();
        zone.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach((type) => {
      zone.addEventListener(type, (event) => {
        event.preventDefault();
        zone.classList.remove("dragover");
      });
    });
    zone.addEventListener("drop", (event) => {
      const files = [...event.dataTransfer.files];
      if (!files.length) return;
      callback(multiple ? files : [files[0]]);
    });
  }

  async function handleExcelFile(file) {
    if (!file) return;
    const extension = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "csv"].includes(extension)) {
      showToast("Gunakan file .xlsx atau .csv.", true);
      return;
    }

    ui.excelFileName.textContent = file.name;
    ui.excelFileInfo.textContent = "Membaca file…";
    ui.excelStatus.hidden = false;

    try {
      const rows = extension === "csv" ? parseCsv(await file.text()) : await parseXlsxRows(file);
      const cleanRows = trimEmptyRows(rows);
      if (!cleanRows.length) throw new Error("Tidak ada data yang dapat dibaca.");
      state.rawRows = cleanRows;
      configureColumns(cleanRows);
      updateSentencesFromColumn();
      ui.excelFileInfo.textContent = `${formatBytes(file.size)} · ${state.sentences.length} kalimat terbaca`;
      showToast(`${state.sentences.length} kalimat berhasil dimuat.`);
    } catch (error) {
      console.error(error);
      clearExcel(false);
      showToast(`Excel gagal dibaca: ${error.message || "format tidak didukung"}`, true);
    }
  }

  function clearExcel(showMessage = true) {
    state.rawRows = [];
    state.sentences = [];
    state.hasHeader = false;
    state.previewIndex = 0;
    ui.excelInput.value = "";
    ui.excelStatus.hidden = true;
    ui.columnRow.hidden = true;
    ui.columnSelect.replaceChildren();
    updateCounts();
    updateExportState();
    requestPreview();
    if (showMessage) showToast("Data Excel dihapus.");
  }

  function configureColumns(rows) {
    const firstRow = rows[0] || [];
    const knownHeaders = ["kalimat", "sentence", "caption", "teks", "text", "quote", "judul"];
    const normalizedHeaders = firstRow.map((value) => normalizeText(value).toLowerCase());
    const detected = normalizedHeaders.findIndex((value) => knownHeaders.includes(value));
    const maxColumns = Math.max(1, ...rows.slice(0, 50).map((row) => row.length));

    state.hasHeader = detected >= 0;
    ui.columnSelect.replaceChildren();

    for (let index = 0; index < maxColumns; index += 1) {
      const option = document.createElement("option");
      option.value = String(index);
      const header = normalizeText(firstRow[index]);
      option.textContent = state.hasHeader && header ? `${columnName(index)} · ${header}` : `Kolom ${columnName(index)}`;
      ui.columnSelect.append(option);
    }

    ui.columnSelect.value = String(detected >= 0 ? detected : firstNonEmptyColumn(rows));
    ui.columnRow.hidden = maxColumns <= 1;
  }

  function updateSentencesFromColumn() {
    const column = Number(ui.columnSelect.value || 0);
    const startRow = state.hasHeader ? 1 : 0;
    state.sentences = state.rawRows
      .slice(startRow)
      .map((row) => normalizeText(row[column]))
      .filter(Boolean);
    state.previewIndex = Math.min(state.previewIndex, Math.max(0, state.sentences.length - 1));
    updateCounts();
    updateExportState();
    requestPreview();
  }

  async function parseXlsxRows(file) {
    if (typeof JSZip === "undefined") throw new Error("Komponen pembaca Excel tidak tersedia.");
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const workbookEntry = zip.file("xl/workbook.xml");
    const relsEntry = zip.file("xl/_rels/workbook.xml.rels");
    if (!workbookEntry || !relsEntry) throw new Error("Struktur .xlsx tidak valid.");

    const workbook = parseXml(await workbookEntry.async("string"));
    const relationships = parseXml(await relsEntry.async("string"));
    const relMap = new Map();
    [...relationships.getElementsByTagName("Relationship")].forEach((rel) => {
      relMap.set(rel.getAttribute("Id"), rel.getAttribute("Target"));
    });

    const sheet = workbook.getElementsByTagName("sheet")[0];
    if (!sheet) throw new Error("Workbook tidak memiliki worksheet.");
    const relationshipId = sheet.getAttribute("r:id") || sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    const target = relMap.get(relationshipId);
    let sheetPath = normalizeZipPath(target ? `xl/${target}` : "xl/worksheets/sheet1.xml");
    let sheetEntry = zip.file(sheetPath);
    if (!sheetEntry) {
      const fallback = Object.keys(zip.files).find((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name));
      sheetEntry = fallback ? zip.file(fallback) : null;
    }
    if (!sheetEntry) throw new Error("Worksheet pertama tidak ditemukan.");

    let sharedStrings = [];
    const sharedEntry = zip.file("xl/sharedStrings.xml");
    if (sharedEntry) {
      const sharedDoc = parseXml(await sharedEntry.async("string"));
      sharedStrings = [...sharedDoc.getElementsByTagName("si")].map((item) =>
        [...item.getElementsByTagName("t")].map((node) => node.textContent || "").join("")
      );
    }

    const worksheet = parseXml(await sheetEntry.async("string"));
    const rows = [];
    [...worksheet.getElementsByTagName("row")].forEach((rowNode) => {
      const row = [];
      let fallbackIndex = 0;
      [...rowNode.getElementsByTagName("c")].forEach((cell) => {
        const reference = cell.getAttribute("r") || "";
        const letters = reference.match(/[A-Z]+/i);
        const index = letters ? columnIndex(letters[0]) : fallbackIndex;
        fallbackIndex = index + 1;
        const type = cell.getAttribute("t");
        const valueNode = cell.getElementsByTagName("v")[0];
        let value = "";

        if (type === "inlineStr") {
          value = [...cell.getElementsByTagName("t")].map((node) => node.textContent || "").join("");
        } else if (type === "s") {
          value = sharedStrings[Number(valueNode?.textContent || 0)] ?? "";
        } else if (type === "b") {
          value = valueNode?.textContent === "1" ? "TRUE" : "FALSE";
        } else {
          value = valueNode?.textContent || "";
        }
        row[index] = value;
      });
      rows.push(row);
    });
    return rows;
  }

  function parseXml(text) {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("XML di dalam Excel rusak.");
    return doc;
  }

  function normalizeZipPath(path) {
    const parts = String(path || "").replace(/\\/g, "/").split("/");
    const resolved = [];
    parts.forEach((part) => {
      if (!part || part === ".") return;
      if (part === "..") resolved.pop();
      else resolved.push(part);
    });
    return resolved.join("/");
  }

  function parseCsv(text) {
    const sample = text.slice(0, 4000);
    const candidates = [",", ";", "\t"];
    const delimiter = candidates
      .map((candidate) => ({ candidate, count: countOutsideQuotes(sample.split(/\r?\n/)[0] || "", candidate) }))
      .sort((a, b) => b.count - a.count)[0].candidate;

    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const next = text[index + 1];
      if (char === '"') {
        if (quoted && next === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === delimiter && !quoted) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") index += 1;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }
    row.push(cell);
    rows.push(row);
    if (rows[0]?.[0]?.charCodeAt(0) === 0xfeff) rows[0][0] = rows[0][0].slice(1);
    return rows;
  }

  function countOutsideQuotes(line, needle) {
    let quoted = false;
    let count = 0;
    for (const char of line) {
      if (char === '"') quoted = !quoted;
      else if (char === needle && !quoted) count += 1;
    }
    return count;
  }

  function trimEmptyRows(rows) {
    const clean = rows.map((row) => row.map((cell) => normalizeText(cell)));
    while (clean.length && clean[0].every((cell) => !cell)) clean.shift();
    while (clean.length && clean[clean.length - 1].every((cell) => !cell)) clean.pop();
    return clean;
  }

  function firstNonEmptyColumn(rows) {
    const maxColumns = Math.max(1, ...rows.slice(0, 30).map((row) => row.length));
    for (let column = 0; column < maxColumns; column += 1) {
      if (rows.some((row) => normalizeText(row[column]))) return column;
    }
    return 0;
  }

  function columnIndex(letters) {
    return String(letters).toUpperCase().split("").reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
  }

  function columnName(index) {
    let value = Number(index) + 1;
    let name = "";
    while (value > 0) {
      const remainder = (value - 1) % 26;
      name = String.fromCharCode(65 + remainder) + name;
      value = Math.floor((value - 1) / 26);
    }
    return name;
  }

  async function handlePhotoFiles(files) {
    const accepted = files
      .filter((file) => file.type.startsWith("image/"))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
    if (!accepted.length) {
      showToast("Pilih file foto JPG, PNG, atau WebP.", true);
      return;
    }

    revokePhotoUrls();
    const results = await Promise.allSettled(accepted.map(loadImageFile));
    state.photos = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
    const failed = results.length - state.photos.length;
    state.previewIndex = 0;
    renderPhotoStrip();
    updateCounts();
    updateExportState();
    requestPreview();
    showToast(failed ? `${state.photos.length} foto dimuat, ${failed} gagal dibaca.` : `${state.photos.length} foto berhasil dimuat.`, failed > 0);
  }

  function loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => resolve({ file, image, url });
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Foto ${file.name} gagal dibaca.`));
      };
      image.src = url;
    });
  }

  function revokePhotoUrls() {
    state.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  }

  function renderPhotoStrip() {
    ui.photoStrip.replaceChildren();
    ui.photoStrip.hidden = state.photos.length === 0;
    state.photos.slice(0, 7).forEach((photo) => {
      const item = document.createElement("div");
      item.className = "photo-thumb";
      item.title = photo.file.name;
      const image = document.createElement("img");
      image.src = photo.url;
      image.alt = "";
      item.append(image);
      ui.photoStrip.append(item);
    });
    if (state.photos.length > 7) {
      const more = document.createElement("div");
      more.className = "photo-more";
      more.textContent = `+${state.photos.length - 7}`;
      ui.photoStrip.append(more);
    }
  }

  async function handleFontFile(file) {
    if (!file) return;
    if (!/\.(ttf|otf|woff2?|woff)$/i.test(file.name)) {
      showToast("Format font harus TTF, OTF, WOFF, atau WOFF2.", true);
      return;
    }
    try {
      const family = `CaptionCustom_${Date.now()}`;
      const fontFace = new FontFace(family, await file.arrayBuffer(), { weight: "700" });
      await fontFace.load();
      document.fonts.add(fontFace);
      state.fontFamily = `"${family}", Arial, sans-serif`;
      state.customFontName = file.name;
      ui.fontLabel.textContent = file.name.replace(/\.[^.]+$/, "");
      requestPreview();
      showToast("Font khusus berhasil dipakai.");
    } catch (error) {
      console.error(error);
      showToast("Font tidak dapat dimuat. Coba file lain.", true);
    }
  }

  function resetStyle() {
    Object.entries(DEFAULT_STYLE).forEach(([key, value]) => {
      const input = ui[key];
      if (!input) return;
      if (input.type === "checkbox") input.checked = value;
      else input.value = String(value);
      input.dispatchEvent(new Event(input.type === "checkbox" ? "change" : "input"));
    });
    state.fontFamily = 'Arial, Helvetica, sans-serif';
    state.customFontName = "";
    ui.fontInput.value = "";
    ui.fontLabel.textContent = "Classic Bold";
    showToast("Gaya contoh dipulihkan.");
  }

  function updateRangeFill(input) {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const percentage = ((Number(input.value) - min) / (max - min)) * 100;
    input.style.setProperty("--range-fill", `${percentage}%`);
  }

  function movePreview(direction) {
    const count = Math.max(1, state.sentences.length);
    state.previewIndex = (state.previewIndex + direction + count) % count;
    requestPreview();
  }

  function bindCanvasDragging() {
    const canvas = ui.previewCanvas;
    let activePointer = null;

    const updateFromPointer = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      ui.textPositionX.value = String(Math.round(clamp(x, Number(ui.textPositionX.min), Number(ui.textPositionX.max))));
      ui.textPosition.value = String(Math.round(clamp(y, Number(ui.textPosition.min), Number(ui.textPosition.max))));
      ui.textPositionX.dispatchEvent(new Event("input"));
      ui.textPosition.dispatchEvent(new Event("input"));
    };

    canvas.addEventListener("pointerdown", (event) => {
      activePointer = event.pointerId;
      canvas.setPointerCapture(activePointer);
      canvas.classList.add("dragging");
      updateFromPointer(event);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (event.pointerId !== activePointer) return;
      updateFromPointer(event);
    });
    const stopDragging = (event) => {
      if (event.pointerId !== activePointer) return;
      if (canvas.hasPointerCapture(activePointer)) canvas.releasePointerCapture(activePointer);
      activePointer = null;
      canvas.classList.remove("dragging");
    };
    canvas.addEventListener("pointerup", stopDragging);
    canvas.addEventListener("pointercancel", stopDragging);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function requestPreview() {
    if (state.previewFrame) cancelAnimationFrame(state.previewFrame);
    state.previewFrame = requestAnimationFrame(() => {
      state.previewFrame = 0;
      renderPreview();
    });
  }

  function renderPreview() {
    const size = SIZE_PRESETS[ui.sizePreset.value];
    const canvas = ui.previewCanvas;
    if (canvas.width !== size.width || canvas.height !== size.height) {
      canvas.width = size.width;
      canvas.height = size.height;
    }
    const context = canvas.getContext("2d");
    const sentence = state.sentences[state.previewIndex] || "single ori kak, bukan single yang just trend atau hts nya dimana mana";
    const photo = getPhotoForIndex(state.previewIndex);
    renderFrame(context, size.width, size.height, sentence, photo);

    ui.previewEmpty.hidden = Boolean(state.photos.length);
    ui.previewResolution.textContent = `${size.width} × ${size.height} px`;
    ui.previewIndex.textContent = state.sentences.length ? `${state.previewIndex + 1} / ${state.sentences.length}` : "Contoh";
    ui.prevPreview.disabled = state.sentences.length <= 1;
    ui.nextPreview.disabled = state.sentences.length <= 1;
    const extension = ui.outputFormat.value === "png" ? "png" : "jpg";
    ui.previewFileName.textContent = state.sentences.length ? makeFileName(state.previewIndex, sentence, extension) : `contoh.${extension}`;
  }

  function renderFrame(context, width, height, sentence, photo) {
    context.save();
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    if (photo?.image) drawImageCover(context, photo.image, width, height);
    else drawPlaceholder(context, width, height);

    drawCaption(context, width, height, sentence);
    context.restore();
  }

  function drawImageCover(context, image, width, height) {
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    const scale = Math.max(width / imageWidth, height / imageHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (imageWidth - sourceWidth) / 2;
    const sourceY = (imageHeight - sourceHeight) / 2;
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
  }

  function drawPlaceholder(context, width, height) {
    const sky = context.createLinearGradient(0, 0, width, height);
    sky.addColorStop(0, "#a8d2ee");
    sky.addColorStop(0.44, "#8ab3c9");
    sky.addColorStop(1, "#42694f");
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);

    context.save();
    context.filter = `blur(${Math.round(width * 0.045)}px)`;
    context.fillStyle = "rgba(37, 100, 45, 0.72)";
    context.beginPath();
    context.ellipse(width * 0.84, height * 0.18, width * 0.46, height * 0.23, -0.28, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(41, 54, 66, 0.82)";
    context.beginPath();
    context.ellipse(width * 0.2, height * 0.44, width * 0.29, height * 0.42, -0.18, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(171, 132, 99, 0.88)";
    context.beginPath();
    context.moveTo(width * 0.32, height * 0.51);
    context.lineTo(width * 0.94, height * 0.72);
    context.lineTo(width, height);
    context.lineTo(width * 0.18, height);
    context.closePath();
    context.fill();
    context.restore();

    const veil = context.createLinearGradient(0, 0, 0, height);
    veil.addColorStop(0, "rgba(0,0,0,0.02)");
    veil.addColorStop(1, "rgba(0,0,0,0.16)");
    context.fillStyle = veil;
    context.fillRect(0, 0, width, height);
  }

  function drawCaption(context, width, height, sentence) {
    const scale = width / 1080;
    const centerX = width * (Number(ui.textPositionX.value) / 100);
    const requestedMaxWidth = width * (Number(ui.textWidth.value) / 100);
    const horizontalRoom = Math.max(width * 0.28, 2 * Math.min(centerX, width - centerX) - Number(ui.strokeWidth.value) * scale * 3);
    const maxWidth = Math.min(requestedMaxWidth, horizontalRoom);
    let fontSize = Number(ui.fontSize.value) * scale;
    const minFontSize = 38 * scale;
    const lineHeightRatio = Number(ui.lineHeight.value) / 100;
    const maxBlockHeight = height * 0.52;
    let lines = [];
    let lineHeight = fontSize * lineHeightRatio;

    while (fontSize >= minFontSize) {
      context.font = `700 ${fontSize}px ${state.fontFamily}`;
      lines = wrapText(context, sentence, maxWidth);
      lineHeight = fontSize * lineHeightRatio;
      const blockHeight = fontSize + Math.max(0, lines.length - 1) * lineHeight;
      if (!ui.autoFit.checked || (blockHeight <= maxBlockHeight && lines.length <= 8)) break;
      fontSize -= 2 * scale;
    }

    context.font = `700 ${fontSize}px ${state.fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    context.miterLimit = 2;
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#111111";
    context.lineWidth = Number(ui.strokeWidth.value) * scale;

    const blockHeight = fontSize + Math.max(0, lines.length - 1) * lineHeight;
    const requestedCenterY = height * (Number(ui.textPosition.value) / 100);
    const safePadding = context.lineWidth * 1.5;
    const centerY = clamp(requestedCenterY, blockHeight / 2 + safePadding, height - blockHeight / 2 - safePadding);
    const firstY = centerY - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      const y = firstY + index * lineHeight;
      context.strokeText(line, centerX, y, maxWidth);
      context.fillText(line, centerX, y, maxWidth);
    });
  }

  function wrapText(context, text, maxWidth) {
    const paragraphs = normalizeText(text).split(/\n/);
    const lines = [];

    paragraphs.forEach((paragraph) => {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (!words.length) {
        lines.push("");
        return;
      }
      let line = "";
      words.forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (context.measureText(candidate).width <= maxWidth) {
          line = candidate;
          return;
        }
        if (line) lines.push(line);
        if (context.measureText(word).width <= maxWidth) {
          line = word;
          return;
        }
        const chunks = splitLongWord(context, word, maxWidth);
        lines.push(...chunks.slice(0, -1));
        line = chunks[chunks.length - 1] || "";
      });
      if (line) lines.push(line);
    });

    return lines.length ? lines : [""];
  }

  function splitLongWord(context, word, maxWidth) {
    const chunks = [];
    let chunk = "";
    [...word].forEach((character) => {
      const next = chunk + character;
      if (chunk && context.measureText(next).width > maxWidth) {
        chunks.push(chunk);
        chunk = character;
      } else {
        chunk = next;
      }
    });
    if (chunk) chunks.push(chunk);
    return chunks;
  }

  function getPhotoForIndex(index) {
    if (!state.photos.length) return null;
    if (index < state.photos.length) return state.photos[index];
    if (ui.photoMapping.value === "first") return state.photos[0];
    if (ui.photoMapping.value === "last") return state.photos[state.photos.length - 1];
    return state.photos[index % state.photos.length];
  }

  function updateCounts() {
    ui.sentenceCount.textContent = `${state.sentences.length} kalimat`;
    ui.photoCount.textContent = `${state.photos.length} foto`;
    ui.exportCount.textContent = String(state.sentences.length);
  }

  function updateExportState() {
    const ready = state.sentences.length > 0 && state.photos.length > 0;
    ui.generateButton.disabled = !ready;
    if (!state.sentences.length && !state.photos.length) {
      ui.exportHint.textContent = "Masukkan Excel dan foto untuk mulai.";
      return;
    }
    if (!state.sentences.length) {
      ui.exportHint.textContent = "Excel belum berisi kalimat yang terbaca.";
      return;
    }
    if (!state.photos.length) {
      ui.exportHint.textContent = "Pilih minimal satu foto latar.";
      return;
    }
    const size = SIZE_PRESETS[ui.sizePreset.value];
    const perImageMb = ui.outputFormat.value === "png" ? (size.height / 1440) * 2.1 : (size.height / 1440) * 0.48;
    const estimate = perImageMb * state.sentences.length;
    ui.exportHint.textContent = `${size.width} × ${size.height} px · perkiraan ZIP ${estimate < 1 ? "< 1 MB" : `± ${Math.round(estimate)} MB`}`;
  }

  async function generateAll() {
    if (!state.sentences.length || !state.photos.length) {
      showToast("Masukkan Excel dan minimal satu foto dahulu.", true);
      return;
    }
    if (typeof JSZip === "undefined") {
      showToast("Komponen ZIP tidak tersedia.", true);
      return;
    }

    const total = state.sentences.length;
    const size = SIZE_PRESETS[ui.sizePreset.value];
    const format = ui.outputFormat.value;
    const extension = format === "png" ? "png" : "jpg";
    const mime = format === "png" ? "image/png" : "image/jpeg";
    const quality = format === "png" ? undefined : 0.94;
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = size.width;
    outputCanvas.height = size.height;
    const context = outputCanvas.getContext("2d");
    const zip = new JSZip();

    state.cancelRequested = false;
    ui.cancelGeneration.disabled = false;
    ui.cancelGeneration.textContent = "Batalkan";
    setProgress(0, total, `Menyiapkan ${total} foto…`, "Jangan tutup tab ini.");
    if (typeof ui.progressDialog.showModal === "function") ui.progressDialog.showModal();
    else ui.progressDialog.setAttribute("open", "");

    try {
      await document.fonts.ready;
      for (let index = 0; index < total; index += 1) {
        if (state.cancelRequested) throw new DOMException("Dibatalkan", "AbortError");
        const sentence = state.sentences[index];
        const photo = getPhotoForIndex(index);
        renderFrame(context, size.width, size.height, sentence, photo);
        const blob = await canvasToBlob(outputCanvas, mime, quality);
        zip.file(makeFileName(index, sentence, extension), blob, { binary: true });
        const progress = ((index + 1) / total) * 86;
        setProgress(progress, total, `Membuat foto ${index + 1} dari ${total}`, photo?.file.name || "Foto");
        if (index % 2 === 0) await nextPaint();
      }

      zip.file(
        "INFO.txt",
        [
          "Caption Foto HD",
          `Jumlah foto: ${total}`,
          `Resolusi: ${size.width} x ${size.height} px`,
          `Format: ${extension.toUpperCase()}`,
          `Dibuat: ${new Date().toLocaleString("id-ID")}`,
          "",
          "Semua foto dibuat lokal di browser.",
        ].join("\n")
      );

      ui.cancelGeneration.disabled = true;
      setProgress(88, total, "Mengemas file ZIP…", "Tahap terakhir, mohon tunggu.");
      const zipBlob = await zip.generateAsync(
        { type: "blob", compression: "STORE", streamFiles: true },
        (metadata) => setProgress(88 + metadata.percent * 0.12, total, "Mengemas file ZIP…", `${Math.round(metadata.percent)}% paket selesai`)
      );

      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(zipBlob, `caption-foto-hd-${total}-${date}.zip`);
      setProgress(100, total, "Selesai!", "ZIP sedang diunduh.");
      await delay(450);
      closeProgress();
      showToast(`${total} foto HD berhasil dibuat dan diunduh.`);
    } catch (error) {
      closeProgress();
      if (error?.name === "AbortError") showToast("Pembuatan foto dibatalkan.");
      else {
        console.error(error);
        showToast(`Gagal membuat foto: ${error.message || "kesalahan browser"}`, true);
      }
    }
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas gagal dikonversi."))), type, quality);
    });
  }

  function setProgress(percent, total, title, detail) {
    const safe = Math.max(0, Math.min(100, percent));
    ui.progressBar.style.width = `${safe}%`;
    ui.progressPercent.textContent = `${Math.round(safe)}%`;
    ui.progressCounter.textContent = `${Math.min(total, Math.round((safe / 86) * total))} / ${total}`;
    ui.progressTitle.textContent = title;
    ui.progressDetail.textContent = detail;
  }

  function closeProgress() {
    if (ui.progressDialog.open && typeof ui.progressDialog.close === "function") ui.progressDialog.close();
    else ui.progressDialog.removeAttribute("open");
    ui.cancelGeneration.disabled = false;
    ui.cancelGeneration.textContent = "Batalkan";
  }

  function makeFileName(index, sentence, extension) {
    const number = String(index + 1).padStart(Math.max(3, String(state.sentences.length || 1).length), "0");
    const slug = normalizeText(sentence)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 54)
      .replace(/-$/g, "");
    return `${number}-${slug || "caption"}.${extension}`;
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function normalizeText(value) {
    return value == null ? "" : String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** index;
    return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
  }

  function nextPaint() {
    return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  }

  function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  function showToast(message, isError = false) {
    clearTimeout(state.toastTimer);
    ui.toast.textContent = message;
    ui.toast.classList.toggle("error", isError);
    ui.toast.classList.add("show");
    state.toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 3200);
  }

  window.addEventListener("beforeunload", revokePhotoUrls);
  init();
})();
