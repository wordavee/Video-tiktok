(() => {
  "use strict";

  const OUTPUT_WIDTH = 1080;
  const OUTPUT_HEIGHT = 1920;
  const MAX_DURATION = 180;
  const EXPORT_PROFILES = {
    compatible: {
      id: "compatible",
      label: "IG/TikTok MP4",
      width: 720,
      height: 1280,
      fps: 24,
      videoBitsPerSecond: 2_800_000,
      audioBitsPerSecond: 128_000,
      stableMp4: true,
      allowWebmFallback: false,
      resolutionLabel: "720 × 1280",
      detail: "24 fps konstan · MP4 H.264 + AAC · siap upload IG/TikTok",
    },
    fullHd: {
      id: "fullHd",
      label: "Full HD",
      width: OUTPUT_WIDTH,
      height: OUTPUT_HEIGHT,
      fps: 30,
      videoBitsPerSecond: 8_000_000,
      audioBitsPerSecond: 192_000,
      stableMp4: true,
      allowWebmFallback: false,
      resolutionLabel: "1080 × 1920",
      detail: "30 fps · MP4 H.264 jika didukung · untuk HP baru dan desktop",
    },
  };
  const TEMPLATE_STORAGE_KEY = "captionStudio.videoFontTemplate.v1";
  const FONT_DB_NAME = "captionStudioFonts";
  const FONT_STORE_NAME = "savedFonts";
  const DEFAULT_STYLE = {
    videoFontSize: 76,
    videoFontWeight: 700,
    videoTextColor: "#ffffff",
    videoPositionX: 50,
    videoPositionY: 52,
    videoTextWidth: 88,
    videoStrokeWidth: 12,
    videoOutlineEnabled: true,
    videoLineHeight: 100,
    videoAutoFit: true,
  };

  const TEXT_LAYOUT_PRESETS = {
    classic: {
      ...DEFAULT_STYLE,
    },
    columnLarge: {
      videoFontSize: 72,
      videoFontWeight: 400,
      videoTextColor: "#e7c549",
      videoPositionX: 50,
      videoPositionY: 50,
      videoTextWidth: 22,
      videoStrokeWidth: 12,
      videoOutlineEnabled: false,
      videoLineHeight: 145,
      videoAutoFit: true,
    },
    columnMedium: {
      videoFontSize: 46,
      videoFontWeight: 400,
      videoTextColor: "#e7c549",
      videoPositionX: 50,
      videoPositionY: 50,
      videoTextWidth: 32,
      videoStrokeWidth: 10,
      videoOutlineEnabled: false,
      videoLineHeight: 126,
      videoAutoFit: true,
    },
    minimal: {
      videoFontSize: 62,
      videoFontWeight: 500,
      videoTextColor: "#e7c549",
      videoPositionX: 50,
      videoPositionY: 50,
      videoTextWidth: 54,
      videoStrokeWidth: 8,
      videoOutlineEnabled: false,
      videoLineHeight: 118,
      videoAutoFit: true,
    },
    boldCenter: {
      videoFontSize: 44,
      videoFontWeight: 900,
      videoTextColor: "#ffffff",
      videoPositionX: 50,
      videoPositionY: 45,
      videoTextWidth: 72,
      videoStrokeWidth: 7,
      videoOutlineEnabled: true,
      videoLineHeight: 116,
      videoAutoFit: true,
    },
  };

  const TEXT_LAYOUT_LABELS = {
    classic: "Classic",
    columnLarge: "Kolom besar",
    columnMedium: "Kolom sedang",
    minimal: "Minimal",
    boldCenter: "Bold tengah",
  };

  const THEMES = {
    single: {
      label: "Single & percaya diri",
      keywords: ["single", "jomblo", "sendiri", "hts", "mandiri", "self love", "diri sendiri", "kesepian"],
      captions: ["Single Bahagia", "Tetap Selektif", "Sendiri Dulu", "Anti Setengah"],
      hashtags: ["#single", "#fyp", "#quotes", "#singlebahagia"],
      songs: [
        { title: "Satu-Satu", artist: "Idgitaf", mood: "tenang" },
        { title: "Flowers", artist: "Miley Cyrus", mood: "percaya diri" },
        { title: "Espresso", artist: "Sabrina Carpenter", mood: "playful" },
      ],
    },
    love: {
      label: "Cinta",
      keywords: ["cinta", "sayang", "kamu", "bersama", "pasangan", "jodoh", "rindu", "jatuh hati", "mencintai"],
      captions: ["Cuma Kamu", "Saling Menjaga", "Jatuh Hati", "Rumah Hati"],
      hashtags: ["#cinta", "#fyp", "#quotes", "#quotesromantis"],
      songs: [
        { title: "Bergema Sampai Selamanya", artist: "Nadhif Basalamah", mood: "romantis" },
        { title: "BIRDS OF A FEATHER", artist: "Billie Eilish", mood: "hangat" },
        { title: "Glue Song", artist: "beabadoobee", mood: "lembut" },
      ],
    },
    heartbreak: {
      label: "Galau & patah hati",
      keywords: ["patah hati", "galau", "kecewa", "meninggalkan", "pergi", "mantan", "terluka", "bohong", "selesai", "asing", "lupakan"],
      captions: ["Masih Membekas", "Belum Ikhlas", "Jadi Asing", "Patah Perlahan"],
      hashtags: ["#galau", "#fyp", "#quotes", "#galaubrutal"],
      songs: [
        { title: "Sial", artist: "Mahalini", mood: "galau" },
        { title: "Tak Segampang Itu", artist: "Anggi Marito", mood: "patah hati" },
        { title: "The Night We Met", artist: "Lord Huron", mood: "sendu" },
      ],
    },
    healing: {
      label: "Healing",
      keywords: ["healing", "sembuh", "pulih", "tenang", "istirahat", "lelah", "capek", "menerima", "ikhlas", "berdamai"],
      captions: ["Pelan Sembuh", "Belajar Pulih", "Istirahat Dulu", "Berdamai Pelan"],
      hashtags: ["#healing", "#fyp", "#quotes", "#belajarpulih"],
      songs: [
        { title: "Rehat", artist: "Kunto Aji", mood: "menenangkan" },
        { title: "Evaluasi", artist: "Hindia", mood: "reflektif" },
        { title: "Saturn", artist: "SZA", mood: "dreamy" },
      ],
    },
    motivation: {
      label: "Motivasi",
      keywords: ["semangat", "sukses", "berjuang", "usaha", "mimpi", "bangkit", "gagal", "menyerah", "proses", "tujuan", "kuat"],
      captions: ["Tetap Melangkah", "Belum Menyerah", "Proses Dulu", "Terus Bertumbuh"],
      hashtags: ["#motivasi", "#fyp", "#quotes", "#semangathidup"],
      songs: [
        { title: "Manusia Kuat", artist: "Tulus", mood: "kuat" },
        { title: "The Nights", artist: "Avicii", mood: "semangat" },
        { title: "Unstoppable", artist: "Sia", mood: "powerful" },
      ],
    },
    friendship: {
      label: "Persahabatan",
      keywords: ["sahabat", "teman", "pertemanan", "bestie", "kawan", "persahabatan", "circle"],
      captions: ["Circle Tulus", "Teman Pulang", "Selalu Ada", "Bestie Selamanya"],
      hashtags: ["#sahabat", "#fyp", "#quotes", "#bestie"],
      songs: [
        { title: "Monokrom", artist: "Tulus", mood: "nostalgia" },
        { title: "Count on Me", artist: "Bruno Mars", mood: "hangat" },
        { title: "Sahabat Kecil", artist: "Ipang", mood: "kenangan" },
      ],
    },
    religious: {
      label: "Religi",
      keywords: ["allah", "tuhan", "doa", "sabar", "syukur", "ikhlas", "iman", "takdir", "rezeki", "ibadah"],
      captions: ["Percaya Waktu-Nya", "Doa Menjaga", "Tetap Bersyukur", "Belajar Ikhlas"],
      hashtags: ["#islami", "#fyp", "#quotes", "#pengingatdiri"],
      songs: [
        { title: "Insha Allah", artist: "Maher Zain", mood: "penuh harap" },
        { title: "Rahmatun Lil'Alameen", artist: "Maher Zain", mood: "damai" },
        { title: "Ya Maulana", artist: "Sabyan", mood: "syahdu" },
      ],
    },
    funny: {
      label: "Santai & lucu",
      keywords: ["lucu", "ngakak", "wkwk", "haha", "santai", "bercanda", "drama", "receh", "trend"],
      captions: ["Cuma Konten", "Santai Dulu", "Plot Twist", "Jangan Serius"],
      hashtags: ["#receh", "#fyp", "#quotes", "#kontenlucu"],
      songs: [
        { title: "APT.", artist: "ROSÉ & Bruno Mars", mood: "seru" },
        { title: "Cupid", artist: "FIFTY FIFTY", mood: "playful" },
        { title: "Made You Look", artist: "Meghan Trainor", mood: "ceria" },
      ],
    },
    life: {
      label: "Kehidupan",
      keywords: ["hidup", "waktu", "dewasa", "bahagia", "dunia", "perjalanan", "pelajaran", "kehilangan", "berubah", "masa depan"],
      captions: ["Tetap Berjalan", "Belajar Dewasa", "Nikmati Proses", "Pelan Saja"],
      hashtags: ["#kehidupan", "#fyp", "#quotes", "#katabijak"],
      songs: [
        { title: "Secukupnya", artist: "Hindia", mood: "reflektif" },
        { title: "Sorai", artist: "Nadin Amizah", mood: "hangat" },
        { title: "Zona Nyaman", artist: "Fourtwnty", mood: "santai" },
      ],
    },
  };

  const state = {
    videoFile: null,
    videoUrl: "",
    loaded: false,
    previewFrame: 0,
    fontFamily: 'Arial, Helvetica, sans-serif',
    customFontBuffer: null,
    customFontName: "",
    socialSeed: 0,
    currentTheme: "single",
    toastTimer: null,
    cancelRequested: false,
    activeRecorder: null,
    stopRecording: null,
    recordingFrame: 0,
    previewMuted: true,
    audioContext: null,
    audioSource: null,
    audioGain: null,
    audioDestination: null,
    videoSource: "",
    tiktokImporting: false,
    tiktokAbortController: null,
    lastGeneratedFile: null,
    socialEncoderStatus: "checking",
    socialVideoEncoder: { compatible: false, fullHd: false },
    socialAudioEncoder: false,
  };

  const $ = (id) => document.getElementById(id);
  const ui = {
    videoDropzone: $("videoDropzone"),
    videoInput: $("videoInput"),
    videoStatus: $("videoStatus"),
    videoFileName: $("videoFileName"),
    videoFileInfo: $("videoFileInfo"),
    clearVideo: $("clearVideo"),
    sourceVideo: $("sourceVideo"),
    tiktokUrl: $("tiktokUrl"),
    importTikTokButton: $("importTikTokButton"),
    tiktokImportStatus: $("tiktokImportStatus"),
    quoteInput: $("quoteInput"),
    quoteCounter: $("quoteCounter"),
    themeSelect: $("themeSelect"),
    videoFontInput: $("videoFontInput"),
    videoFontLabel: $("videoFontLabel"),
    videoFontSize: $("videoFontSize"),
    videoFontSizeValue: $("videoFontSizeValue"),
    videoFontWeight: $("videoFontWeight"),
    videoFontWeightValue: $("videoFontWeightValue"),
    videoTextColor: $("videoTextColor"),
    videoTextColorSwatch: $("videoTextColorSwatch"),
    layoutPresetButtons: Array.from(document.querySelectorAll("[data-layout-preset]")),
    videoPositionX: $("videoPositionX"),
    videoPositionXValue: $("videoPositionXValue"),
    videoPositionY: $("videoPositionY"),
    videoPositionYValue: $("videoPositionYValue"),
    videoTextWidth: $("videoTextWidth"),
    videoTextWidthValue: $("videoTextWidthValue"),
    videoStrokeWidth: $("videoStrokeWidth"),
    videoStrokeWidthValue: $("videoStrokeWidthValue"),
    videoOutlineEnabled: $("videoOutlineEnabled"),
    videoLineHeight: $("videoLineHeight"),
    videoLineHeightValue: $("videoLineHeightValue"),
    videoAutoFit: $("videoAutoFit"),
    resetVideoStyle: $("resetVideoStyle"),
    saveFontTemplate: $("saveFontTemplate"),
    deleteFontTemplate: $("deleteFontTemplate"),
    fontTemplateStatus: $("fontTemplateStatus"),
    regenerateSocial: $("regenerateSocial"),
    detectedTheme: $("detectedTheme"),
    socialCaption: $("socialCaption"),
    hashtagText: $("hashtagText"),
    songList: $("songList"),
    copySocial: $("copySocial"),
    downloadSocial: $("downloadSocial"),
    generateVideoButton: $("generateVideoButton"),
    shareGeneratedVideoButton: $("shareGeneratedVideoButton"),
    videoExportHint: $("videoExportHint"),
    videoPreviewColumn: $("videoPreviewColumn"),
    videoPreviewCanvas: $("videoPreviewCanvas"),
    videoPreviewEmpty: $("videoPreviewEmpty"),
    playPauseButton: $("playPauseButton"),
    muteButton: $("muteButton"),
    seekBar: $("seekBar"),
    currentTime: $("currentTime"),
    durationTime: $("durationTime"),
    previewVideoName: $("previewVideoName"),
    videoFormatChip: $("videoFormatChip"),
    videoExportProfile: $("videoExportProfile"),
    videoExportProfileHelp: $("videoExportProfileHelp"),
    outputResolutionTitle: $("outputResolutionTitle"),
    outputResolutionHint: $("outputResolutionHint"),
    previewResolutionChip: $("previewResolutionChip"),
    videoExportTitle: $("video-export-title"),
    videoProgressDialog: $("videoProgressDialog"),
    videoProgressTitle: $("videoProgressTitle"),
    videoProgressDetail: $("videoProgressDetail"),
    videoProgressBar: $("videoProgressBar"),
    videoProgressPercent: $("videoProgressPercent"),
    videoProgressTime: $("videoProgressTime"),
    cancelVideoGeneration: $("cancelVideoGeneration"),
    mobilePreviewButton: $("mobilePreviewButton"),
    mobileGenerateVideoButton: $("mobileGenerateVideoButton"),
    mobileShareVideoButton: $("mobileShareVideoButton"),
    videoToast: $("videoToast"),
  };

  async function init() {
    bindDropzone();
    bindVideoEvents();
    bindStyleControls();
    bindCanvasDragging();
    setupMobileLayout();

    ui.videoInput.addEventListener("change", () => handleVideoFile(ui.videoInput.files[0]));
    ui.clearVideo.addEventListener("click", () => clearVideo(true));
    ui.importTikTokButton.addEventListener("click", importTikTokVideo);
    ui.tiktokUrl.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        importTikTokVideo();
      }
    });
    ui.tiktokUrl.addEventListener("paste", () => setTimeout(importTikTokVideo, 0));
    ui.quoteInput.addEventListener("input", onQuoteChanged);
    ui.themeSelect.addEventListener("change", () => {
      state.socialSeed = 0;
      generateSocialIdeas();
    });
    ui.regenerateSocial.addEventListener("click", () => {
      state.socialSeed += 1;
      generateSocialIdeas();
      showToast("Ide posting diperbarui.");
    });
    ui.videoFontInput.addEventListener("change", () => handleFontFile(ui.videoFontInput.files[0]));
    ui.resetVideoStyle.addEventListener("click", resetStyle);
    ui.saveFontTemplate.addEventListener("click", saveFontTemplate);
    ui.deleteFontTemplate.addEventListener("click", deleteFontTemplate);
    ui.playPauseButton.addEventListener("click", togglePlayback);
    ui.muteButton.addEventListener("click", toggleMute);
    ui.seekBar.addEventListener("input", seekPreview);
    ui.copySocial.addEventListener("click", copySocialText);
    ui.downloadSocial.addEventListener("click", downloadSocialText);
    ui.generateVideoButton.addEventListener("click", generateVideo);
    ui.shareGeneratedVideoButton.addEventListener("click", shareGeneratedVideo);
    ui.mobilePreviewButton.addEventListener("click", scrollToVideoPreview);
    ui.mobileGenerateVideoButton.addEventListener("click", generateVideo);
    ui.mobileShareVideoButton.addEventListener("click", shareGeneratedVideo);
    ui.videoExportProfile.addEventListener("change", onExportProfileChanged);
    ui.cancelVideoGeneration.addEventListener("click", cancelGeneration);
    ui.videoProgressDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      cancelGeneration();
    });

    setDefaultExportProfile();
    await detectSocialEncoderSupport();
    await loadSavedFontTemplate();
    updateQuoteCounter();
    generateSocialIdeas();
    updateRecorderLabel();
    updateExportProfileUi();
    updateExportState();
    renderPreview();
  }

  function bindDropzone() {
    ["dragenter", "dragover"].forEach((type) => {
      ui.videoDropzone.addEventListener(type, (event) => {
        event.preventDefault();
        ui.videoDropzone.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach((type) => {
      ui.videoDropzone.addEventListener(type, (event) => {
        event.preventDefault();
        ui.videoDropzone.classList.remove("dragover");
      });
    });
    ui.videoDropzone.addEventListener("drop", (event) => handleVideoFile(event.dataTransfer.files[0]));
  }

  function bindVideoEvents() {
    ui.sourceVideo.addEventListener("loadedmetadata", onVideoMetadata);
    ui.sourceVideo.addEventListener("loadeddata", onVideoReady);
    ui.sourceVideo.addEventListener("seeked", () => requestPreview());
    ui.sourceVideo.addEventListener("play", () => {
      ui.playPauseButton.textContent = "Ⅱ";
      ui.playPauseButton.setAttribute("aria-label", "Jeda video");
      startPreviewLoop();
    });
    ui.sourceVideo.addEventListener("pause", () => {
      ui.playPauseButton.textContent = "▶";
      ui.playPauseButton.setAttribute("aria-label", "Putar video");
      cancelAnimationFrame(state.previewFrame);
      requestPreview();
    });
    ui.sourceVideo.addEventListener("ended", () => {
      ui.playPauseButton.textContent = "▶";
      requestPreview();
    });
    ui.sourceVideo.addEventListener("error", () => {
      if (state.videoUrl) {
        showToast("Video tidak dapat dibaca. Coba format MP4 H.264.", true);
        clearVideo(false);
      }
    });
  }

  function bindStyleControls() {
    const sliderConfigs = [
      [ui.videoFontSize, ui.videoFontSizeValue, (value) => `${value} px`],
      [ui.videoFontWeight, ui.videoFontWeightValue, (value) => `${value} · ${fontWeightLabel(value)}`],
      [ui.videoPositionX, ui.videoPositionXValue, (value) => `${value}%`],
      [ui.videoPositionY, ui.videoPositionYValue, (value) => `${value}%`],
      [ui.videoTextWidth, ui.videoTextWidthValue, (value) => `${value}%`],
      [ui.videoStrokeWidth, ui.videoStrokeWidthValue, (value) => ui.videoOutlineEnabled.checked ? `${value} px` : "Off"],
      [ui.videoLineHeight, ui.videoLineHeightValue, (value) => `${(value / 100).toFixed(2)}×`],
    ];
    sliderConfigs.forEach(([input, output, format]) => {
      const update = (event) => {
        output.value = format(Number(input.value));
        updateRangeFill(input);
        if (event?.isTrusted) setActiveLayoutPreset("");
        requestPreview();
      };
      input.addEventListener("input", update);
      update();
    });
    ui.videoAutoFit.addEventListener("change", (event) => {
      if (event.isTrusted) setActiveLayoutPreset("");
      requestPreview();
    });
    const updateOutlineState = (event) => {
      const enabled = ui.videoOutlineEnabled.checked;
      ui.videoStrokeWidth.disabled = !enabled;
      ui.videoStrokeWidth.closest(".slider-field")?.classList.toggle("is-disabled", !enabled);
      ui.videoStrokeWidthValue.value = enabled ? `${ui.videoStrokeWidth.value} px` : "Off";
      if (event?.isTrusted) setActiveLayoutPreset("");
      requestPreview();
    };
    ui.videoOutlineEnabled.addEventListener("change", updateOutlineState);
    updateOutlineState();
    const updateTextColor = (event) => {
      const color = ui.videoTextColor.value || DEFAULT_STYLE.videoTextColor;
      ui.videoTextColorSwatch.style.background = color;
      ui.videoTextColorSwatch.style.borderColor = color.toLowerCase() === "#ffffff" ? "#cfcfcf" : color;
      if (event?.isTrusted) setActiveLayoutPreset("");
      requestPreview();
    };
    ui.videoTextColor.addEventListener("input", updateTextColor);
    updateTextColor();
    ui.layoutPresetButtons.forEach((button) => {
      button.addEventListener("click", () => applyLayoutPreset(button.dataset.layoutPreset));
    });
    setActiveLayoutPreset(findMatchingLayoutPreset());
  }

  function setActiveLayoutPreset(name) {
    ui.layoutPresetButtons.forEach((button) => {
      const active = button.dataset.layoutPreset === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function findMatchingLayoutPreset(settings = getCurrentStyleTemplate()) {
    return Object.entries(TEXT_LAYOUT_PRESETS).find(([, preset]) =>
      Object.keys(DEFAULT_STYLE).every((key) => preset[key] === settings[key])
    )?.[0] || "";
  }

  function applyLayoutPreset(name) {
    const preset = TEXT_LAYOUT_PRESETS[name];
    if (!preset) return;
    applyStyleTemplate(preset);
    setActiveLayoutPreset(name);
    showToast(`Template ${TEXT_LAYOUT_LABELS[name]} diterapkan.`);
  }

  function bindCanvasDragging() {
    const canvas = ui.videoPreviewCanvas;
    let activePointer = null;
    const update = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      ui.videoPositionX.value = String(Math.round(clamp(x, Number(ui.videoPositionX.min), Number(ui.videoPositionX.max))));
      ui.videoPositionY.value = String(Math.round(clamp(y, Number(ui.videoPositionY.min), Number(ui.videoPositionY.max))));
      ui.videoPositionX.dispatchEvent(new Event("input"));
      ui.videoPositionY.dispatchEvent(new Event("input"));
      setActiveLayoutPreset("");
    };
    canvas.addEventListener("pointerdown", (event) => {
      activePointer = event.pointerId;
      canvas.setPointerCapture(activePointer);
      canvas.classList.add("dragging");
      update(event);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (event.pointerId === activePointer) update(event);
    });
    const stop = (event) => {
      if (event.pointerId !== activePointer) return;
      if (canvas.hasPointerCapture(activePointer)) canvas.releasePointerCapture(activePointer);
      activePointer = null;
      canvas.classList.remove("dragging");
    };
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);
  }

  function setupMobileLayout() {
    const preview = ui.videoPreviewColumn;
    const originParent = preview?.parentNode;
    const controls = document.querySelector(".video-grid > .controls");
    const stylePanel = document.querySelector('[aria-labelledby="video-style-title"]');
    if (!preview || !originParent || !controls || !stylePanel) return;

    const originMarker = document.createComment("video-preview-desktop-position");
    originParent.insertBefore(originMarker, preview);
    const media = window.matchMedia("(max-width: 900px)");
    const syncPreviewPosition = () => {
      if (media.matches) {
        controls.insertBefore(preview, stylePanel);
        preview.classList.add("mobile-inline");
      } else {
        originParent.insertBefore(preview, originMarker.nextSibling);
        preview.classList.remove("mobile-inline");
      }
    };
    syncPreviewPosition();
    if (typeof media.addEventListener === "function") media.addEventListener("change", syncPreviewPosition);
    else media.addListener(syncPreviewPosition);
  }

  function scrollToVideoPreview() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ui.videoPreviewColumn.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  function setTikTokImportStatus(message, tone = "") {
    ui.tiktokImportStatus.hidden = !message;
    ui.tiktokImportStatus.textContent = message;
    ui.tiktokImportStatus.className = "tiktok-import-status";
    if (tone) ui.tiktokImportStatus.classList.add(`is-${tone}`);
  }

  function normalizeTikTokUrl(value) {
    let candidate = String(value || "").trim();
    if (!candidate) throw new Error("Tempel link TikTok terlebih dahulu.");
    if (!/^[a-z][a-z\d+.-]*:\/\//i.test(candidate)) candidate = "https:" + "//" + candidate;
    const parsed = new URL(candidate);
    const hostname = parsed.hostname.toLowerCase();
    if (!/^https?:$/.test(parsed.protocol) || !(hostname === "tiktok.com" || hostname.endsWith(".tiktok.com"))) {
      throw new Error("Link harus berasal dari tiktok.com.");
    }
    return parsed.href;
  }

  function resolveMediaUrl(value) {
    if (!value) return "";
    try {
      return new URL(String(value), "https://www.tikwm.com").href;
    } catch {
      return "";
    }
  }

  async function importTikTokVideo() {
    if (state.tiktokImporting) return;
    let tiktokUrl;
    try {
      tiktokUrl = normalizeTikTokUrl(ui.tiktokUrl.value);
    } catch (error) {
      setTikTokImportStatus(error.message, "error");
      showToast(error.message, true);
      return;
    }

    state.tiktokImporting = true;
    state.tiktokAbortController?.abort();
    const controller = new AbortController();
    state.tiktokAbortController = controller;
    ui.importTikTokButton.disabled = true;
    ui.importTikTokButton.setAttribute("aria-busy", "true");
    ui.importTikTokButton.textContent = "Mengambil…";
    setTikTokImportStatus("Mencari sumber video tanpa watermark…", "loading");

    try {
      const apiUrl = "https:" + "//www.tikwm.com/api/?url=" + encodeURIComponent(tiktokUrl) + "&hd=1";
      const apiResponse = await fetch(apiUrl, { signal: controller.signal, cache: "no-store" });
      if (!apiResponse.ok) throw new Error("Layanan sumber TikTok tidak merespons.");
      const payload = await apiResponse.json();
      if (!payload?.data || Number(payload.code || 0) !== 0) {
        throw new Error(payload?.msg || "Video TikTok tidak ditemukan.");
      }

      const data = payload.data;
      const candidates = [data.hdplay, data.play].map(resolveMediaUrl).filter(Boolean);
      if (!candidates.length) throw new Error("Sumber video tanpa watermark tidak tersedia.");
      setTikTokImportStatus("Video ditemukan. Mengunduh sumber tanpa watermark…", "loading");

      let videoBlob = null;
      let lastError = null;
      for (const mediaUrl of [...new Set(candidates)]) {
        try {
          const mediaResponse = await fetch(mediaUrl, { signal: controller.signal, cache: "no-store" });
          if (!mediaResponse.ok) throw new Error(`HTTP ${mediaResponse.status}`);
          const contentType = mediaResponse.headers.get("content-type") || "";
          if (/text\/html|application\/json/i.test(contentType)) throw new Error("Respons video tidak valid.");
          const blob = await mediaResponse.blob();
          if (blob.size < 1024) throw new Error("File video kosong.");
          videoBlob = blob.type.startsWith("video/") ? blob : new Blob([blob], { type: "video/mp4" });
          break;
        } catch (error) {
          if (error.name === "AbortError") throw error;
          lastError = error;
        }
      }
      if (!videoBlob) throw lastError || new Error("Sumber video tidak dapat diunduh.");

      const id = String(data.id || tiktokUrl.match(/video\/(\d+)/)?.[1] || Date.now()).replace(/[^a-zA-Z0-9_-]/g, "");
      const extension = videoBlob.type.includes("webm") ? "webm" : "mp4";
      const videoFile = new File([videoBlob], `tiktok-${id}.${extension}`, {
        type: videoBlob.type || "video/mp4",
        lastModified: Date.now(),
      });
      setTikTokImportStatus("Sumber diterima. Menyiapkan preview…", "loading");
      await handleVideoFile(videoFile, "tiktok");
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(error);
        const message = "Impor otomatis gagal. Coba link lain atau unggah file video milikmu.";
        setTikTokImportStatus(message, "error");
        showToast(message, true);
      }
    } finally {
      if (state.tiktokAbortController === controller) state.tiktokAbortController = null;
      state.tiktokImporting = false;
      ui.importTikTokButton.disabled = false;
      ui.importTikTokButton.removeAttribute("aria-busy");
      ui.importTikTokButton.textContent = "Ambil video";
    }
  }

  async function handleVideoFile(file, source = "upload") {
    if (!file) return;
    if (!file.type.startsWith("video/") && !/\.(mp4|webm|mov)$/i.test(file.name)) {
      showToast("Pilih file video MP4, WebM, atau MOV.", true);
      return;
    }
    clearVideo(false);
    state.videoSource = source;
    if (source !== "tiktok") setTikTokImportStatus("");
    state.videoFile = file;
    state.videoUrl = URL.createObjectURL(file);
    ui.videoFileName.textContent = file.name;
    ui.videoFileInfo.textContent = "Membaca video…";
    ui.videoStatus.hidden = false;
    ui.sourceVideo.src = state.videoUrl;
    ui.sourceVideo.muted = true;
    ui.sourceVideo.load();
  }

  function onVideoMetadata() {
    const video = ui.sourceVideo;
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      showToast("Durasi video tidak dapat dibaca.", true);
      clearVideo(false);
      return;
    }
    if (video.duration > MAX_DURATION) {
      showToast("Video maksimal 3 menit agar proses tetap stabil.", true);
      clearVideo(false);
      return;
    }
    state.loaded = false;
    ui.videoFileInfo.textContent = `${formatBytes(state.videoFile.size)} · ${formatTime(video.duration)} · ${video.videoWidth} × ${video.videoHeight}`;
    ui.durationTime.textContent = formatTime(video.duration);
    ui.previewVideoName.textContent = state.videoFile.name;
    ui.seekBar.value = "0";
    updateExportState();
    requestPreview();
  }

  async function onVideoReady() {
    if (!state.videoFile || state.loaded) return;
    state.loaded = true;
    if (ui.sourceVideo.duration > .2 && ui.sourceVideo.currentTime < .02) {
      await seekTo(ui.sourceVideo, Math.min(.1, ui.sourceVideo.duration / 10));
    }
    ui.videoPreviewEmpty.hidden = true;
    updateExportState();
    requestPreview();
    if (state.videoSource === "tiktok") {
      setTikTokImportStatus("Video TikTok tanpa watermark siap ditambahkan teks.", "success");
      showToast("Video TikTok siap diedit.");
    } else {
      showToast("Video berhasil dimuat.");
    }
  }

  function clearVideo(showMessage = true) {
    clearGeneratedVideo();
    if (showMessage) state.tiktokAbortController?.abort();
    const video = ui.sourceVideo;
    video.pause();
    cancelAnimationFrame(state.previewFrame);
    if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
    state.videoFile = null;
    state.videoUrl = "";
    state.loaded = false;
    state.videoSource = "";
    video.removeAttribute("src");
    video.load();
    ui.videoInput.value = "";
    ui.videoStatus.hidden = true;
    ui.videoPreviewEmpty.hidden = false;
    ui.previewVideoName.textContent = "belum-ada-video";
    ui.currentTime.textContent = "0:00";
    ui.durationTime.textContent = "0:00";
    ui.seekBar.value = "0";
    if (showMessage) {
      ui.tiktokUrl.value = "";
      setTikTokImportStatus("");
    }
    updateExportState();
    requestPreview();
    if (showMessage) showToast("Video dihapus.");
  }

  function onQuoteChanged() {
    updateQuoteCounter();
    requestPreview();
    clearTimeout(onQuoteChanged.timer);
    onQuoteChanged.timer = setTimeout(() => {
      state.socialSeed = 0;
      generateSocialIdeas();
      updateExportState();
    }, 220);
  }

  function updateQuoteCounter() {
    ui.quoteCounter.textContent = `${ui.quoteInput.value.length} / 300`;
  }

  async function handleFontFile(file) {
    if (!file) return;
    if (!/\.(ttf|otf|woff2?|woff)$/i.test(file.name)) {
      showToast("Format font harus TTF, OTF, WOFF, atau WOFF2.", true);
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      await applyCustomFont(buffer, file.name);
      state.customFontBuffer = buffer;
      state.customFontName = file.name;
      requestPreview();
      showToast("Font khusus berhasil dipakai.");
    } catch (error) {
      console.error(error);
      showToast("Font tidak dapat dimuat.", true);
    }
  }

  function resetStyle() {
    Object.entries(DEFAULT_STYLE).forEach(([key, value]) => {
      const input = ui[key];
      if (input.type === "checkbox") {
        input.checked = value;
        input.dispatchEvent(new Event("change"));
      } else {
        input.value = String(value);
        input.dispatchEvent(new Event("input"));
      }
    });
    state.fontFamily = 'Arial, Helvetica, sans-serif';
    state.customFontBuffer = null;
    state.customFontName = "";
    ui.videoFontInput.value = "";
    ui.videoFontLabel.textContent = "Classic Bold";
    setActiveLayoutPreset("classic");
    showToast("Gaya video dipulihkan.");
  }

  async function applyCustomFont(buffer, fileName) {
    const family = `VideoCaption_${Date.now()}`;
    const fontFace = new FontFace(family, buffer);
    await fontFace.load();
    document.fonts.add(fontFace);
    state.fontFamily = `"${family}", Arial, sans-serif`;
    ui.videoFontLabel.textContent = fileName.replace(/\.[^.]+$/, "");
  }

  function getCurrentStyleTemplate() {
    const settings = {};
    Object.entries(DEFAULT_STYLE).forEach(([key, fallback]) => {
      const input = ui[key];
      if (typeof fallback === "boolean") settings[key] = input.checked;
      else if (typeof fallback === "number") settings[key] = Number(input.value);
      else settings[key] = String(input.value || fallback);
    });
    return settings;
  }

  function applyStyleTemplate(settings) {
    Object.entries(DEFAULT_STYLE).forEach(([key, fallback]) => {
      const input = ui[key];
      const value = settings?.[key] ?? fallback;
      if (typeof fallback === "boolean") {
        input.checked = Boolean(value);
        input.dispatchEvent(new Event("change"));
      } else {
        input.value = String(value);
        input.dispatchEvent(new Event("input"));
      }
    });
  }

  async function saveFontTemplate() {
    const template = {
      version: 1,
      settings: getCurrentStyleTemplate(),
      hasCustomFont: Boolean(state.customFontBuffer),
      fontName: state.customFontName || "Classic Bold",
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(template));
      if (state.customFontBuffer) {
        await writeFontRecord({
          id: "videoFont",
          name: state.customFontName,
          buffer: state.customFontBuffer,
        });
      } else {
        await deleteFontRecord();
      }
      updateFontTemplateStatus(true, template.fontName);
      showToast("Template font tersimpan untuk video berikutnya.");
    } catch (error) {
      console.error(error);
      showToast("Template tidak dapat disimpan oleh browser.", true);
    }
  }

  async function loadSavedFontTemplate() {
    try {
      const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (!raw) {
        updateFontTemplateStatus(false);
        return;
      }
      const template = JSON.parse(raw);
      applyStyleTemplate(template.settings || {});
      setActiveLayoutPreset(findMatchingLayoutPreset());
      if (template.hasCustomFont) {
        const record = await readFontRecord();
        if (record?.buffer) {
          await applyCustomFont(record.buffer, record.name || template.fontName || "Font tersimpan");
          state.customFontBuffer = record.buffer;
          state.customFontName = record.name || template.fontName || "font-tersimpan.ttf";
        } else {
          state.fontFamily = 'Arial, Helvetica, sans-serif';
          ui.videoFontLabel.textContent = "Classic Bold";
        }
      } else {
        state.fontFamily = 'Arial, Helvetica, sans-serif';
        state.customFontBuffer = null;
        state.customFontName = "";
        ui.videoFontLabel.textContent = "Classic Bold";
      }
      updateFontTemplateStatus(true, template.fontName || "Classic Bold");
      requestPreview();
    } catch (error) {
      console.warn("Template font gagal dimuat", error);
      updateFontTemplateStatus(false);
    }
  }

  async function deleteFontTemplate() {
    try {
      localStorage.removeItem(TEMPLATE_STORAGE_KEY);
      await deleteFontRecord();
      updateFontTemplateStatus(false);
      showToast("Template font tersimpan telah dihapus.");
    } catch (error) {
      console.error(error);
      showToast("Template tidak dapat dihapus.", true);
    }
  }

  function updateFontTemplateStatus(saved, fontName = "") {
    ui.fontTemplateStatus.textContent = saved
      ? `Aktif otomatis · ${fontName.replace(/\.[^.]+$/, "")}`
      : "Belum ada template tersimpan.";
    ui.deleteFontTemplate.hidden = !saved;
  }

  function openFontDatabase() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        resolve(null);
        return;
      }
      const request = indexedDB.open(FONT_DB_NAME, 1);
      request.addEventListener("upgradeneeded", () => {
        if (!request.result.objectStoreNames.contains(FONT_STORE_NAME)) {
          request.result.createObjectStore(FONT_STORE_NAME, { keyPath: "id" });
        }
      });
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
  }

  async function writeFontRecord(record) {
    const database = await openFontDatabase();
    if (!database) return;
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(FONT_STORE_NAME, "readwrite");
      transaction.objectStore(FONT_STORE_NAME).put(record);
      transaction.addEventListener("complete", resolve);
      transaction.addEventListener("error", () => reject(transaction.error));
    });
    database.close();
  }

  async function readFontRecord() {
    const database = await openFontDatabase();
    if (!database) return null;
    const record = await new Promise((resolve, reject) => {
      const request = database.transaction(FONT_STORE_NAME, "readonly").objectStore(FONT_STORE_NAME).get("videoFont");
      request.addEventListener("success", () => resolve(request.result || null));
      request.addEventListener("error", () => reject(request.error));
    });
    database.close();
    return record;
  }

  async function deleteFontRecord() {
    const database = await openFontDatabase();
    if (!database) return;
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(FONT_STORE_NAME, "readwrite");
      transaction.objectStore(FONT_STORE_NAME).delete("videoFont");
      transaction.addEventListener("complete", resolve);
      transaction.addEventListener("error", () => reject(transaction.error));
    });
    database.close();
  }

  async function togglePlayback() {
    if (!state.loaded) {
      showToast("Unggah video terlebih dahulu.", true);
      return;
    }
    if (ui.sourceVideo.paused || ui.sourceVideo.ended) {
      if (ui.sourceVideo.ended) ui.sourceVideo.currentTime = 0;
      await ensureAudioGraph();
      try {
        await ui.sourceVideo.play();
      } catch (error) {
        showToast("Browser memblokir pemutaran video.", true);
      }
    } else {
      ui.sourceVideo.pause();
    }
  }

  async function toggleMute() {
    state.previewMuted = !state.previewMuted;
    await ensureAudioGraph();
    applyPreviewVolume();
    ui.muteButton.textContent = state.previewMuted ? "🔇" : "🔊";
    ui.muteButton.setAttribute("aria-label", state.previewMuted ? "Aktifkan suara" : "Matikan suara");
  }

  function seekPreview() {
    if (!state.loaded) return;
    ui.sourceVideo.currentTime = (Number(ui.seekBar.value) / 1000) * ui.sourceVideo.duration;
    updateTimeline();
  }

  function startPreviewLoop() {
    cancelAnimationFrame(state.previewFrame);
    const loop = () => {
      renderPreview();
      updateTimeline();
      if (!ui.sourceVideo.paused && !ui.sourceVideo.ended && !state.activeRecorder) {
        state.previewFrame = requestAnimationFrame(loop);
      }
    };
    state.previewFrame = requestAnimationFrame(loop);
  }

  function updateTimeline() {
    const video = ui.sourceVideo;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    ui.currentTime.textContent = formatTime(current);
    ui.durationTime.textContent = formatTime(duration);
    if (duration > 0 && !ui.seekBar.matches(":active")) ui.seekBar.value = String(Math.round((current / duration) * 1000));
  }

  function requestPreview() {
    if (state.previewFrame && !ui.sourceVideo.paused) return;
    cancelAnimationFrame(state.previewFrame);
    state.previewFrame = requestAnimationFrame(() => {
      state.previewFrame = 0;
      renderPreview();
    });
  }

  function renderPreview() {
    const canvas = ui.videoPreviewCanvas;
    const context = canvas.getContext("2d");
    renderVideoFrame(context, canvas.width, canvas.height, ui.quoteInput.value);
  }

  function renderVideoFrame(context, width, height, quote) {
    context.save();
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    if (state.loaded && ui.sourceVideo.readyState >= 2) drawVideoCover(context, ui.sourceVideo, width, height);
    else drawPlaceholder(context, width, height);
    drawCaption(context, width, height, quote || "Tulis quotes kamu di sini");
    context.restore();
  }

  function drawVideoCover(context, video, width, height) {
    const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (video.videoWidth - sourceWidth) / 2;
    const sourceY = (video.videoHeight - sourceHeight) / 2;
    context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
  }

  function drawPlaceholder(context, width, height) {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#98c9e7");
    gradient.addColorStop(.46, "#567d71");
    gradient.addColorStop(1, "#8f6f57");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.save();
    context.filter = `blur(${Math.round(width * .07)}px)`;
    context.fillStyle = "rgba(27, 48, 62, .75)";
    context.beginPath();
    context.ellipse(width * .16, height * .43, width * .38, height * .34, -.2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(39, 106, 56, .62)";
    context.beginPath();
    context.ellipse(width * .82, height * .18, width * .48, height * .23, -.25, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(167, 126, 94, .72)";
    context.fillRect(width * .18, height * .7, width, height * .4);
    context.restore();
    context.fillStyle = "rgba(0,0,0,.1)";
    context.fillRect(0, 0, width, height);
  }

  function drawCaption(context, width, height, quote) {
    const scale = width / OUTPUT_WIDTH;
    const centerX = width * (Number(ui.videoPositionX.value) / 100);
    const requestedWidth = width * (Number(ui.videoTextWidth.value) / 100);
    const outlineEnabled = ui.videoOutlineEnabled.checked;
    const stroke = outlineEnabled ? Number(ui.videoStrokeWidth.value) * scale : 0;
    const horizontalRoom = Math.max(width * .28, 2 * Math.min(centerX, width - centerX) - stroke * 3);
    const maxWidth = Math.min(requestedWidth, horizontalRoom);
    const lineHeightRatio = Number(ui.videoLineHeight.value) / 100;
    const fontWeight = Number(ui.videoFontWeight.value);
    const minFontSize = 38 * scale;
    let fontSize = Number(ui.videoFontSize.value) * scale;
    let lines = [];
    let lineHeight = fontSize * lineHeightRatio;

    while (fontSize >= minFontSize) {
      context.font = `${fontWeight} ${fontSize}px ${state.fontFamily}`;
      lines = wrapText(context, quote.trim(), maxWidth);
      lineHeight = fontSize * lineHeightRatio;
      const blockHeight = fontSize + Math.max(0, lines.length - 1) * lineHeight;
      if (!ui.videoAutoFit.checked || (blockHeight <= height * .56 && lines.length <= 9)) break;
      fontSize -= 2 * scale;
    }

    context.font = `${fontWeight} ${fontSize}px ${state.fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    context.miterLimit = 2;
    context.fillStyle = ui.videoTextColor.value || DEFAULT_STYLE.videoTextColor;
    context.strokeStyle = "#111111";
    context.lineWidth = stroke;

    const blockHeight = fontSize + Math.max(0, lines.length - 1) * lineHeight;
    const requestedY = height * (Number(ui.videoPositionY.value) / 100);
    const padding = stroke * 1.5;
    const centerY = clamp(requestedY, blockHeight / 2 + padding, height - blockHeight / 2 - padding);
    const firstY = centerY - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      const y = firstY + index * lineHeight;
      if (outlineEnabled && stroke > 0) context.strokeText(line, centerX, y, maxWidth);
      context.fillText(line, centerX, y, maxWidth);
    });
  }

  function wrapText(context, text, maxWidth) {
    const lines = [];
    String(text || "").split(/\r?\n/).forEach((paragraph) => {
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
        } else {
          if (line) lines.push(line);
          if (context.measureText(word).width <= maxWidth) line = word;
          else {
            const chunks = splitLongWord(context, word, maxWidth);
            lines.push(...chunks.slice(0, -1));
            line = chunks.at(-1) || "";
          }
        }
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
      } else chunk = next;
    });
    if (chunk) chunks.push(chunk);
    return chunks;
  }

  function generateSocialIdeas() {
    const quote = ui.quoteInput.value.trim();
    const selected = ui.themeSelect.value;
    const themeKey = selected === "auto" ? detectTheme(quote) : selected;
    const theme = THEMES[themeKey] || THEMES.life;
    state.currentTheme = themeKey;
    const base = Math.abs(hashString(quote || "quotes")) + state.socialSeed;
    const caption = theme.captions[base % theme.captions.length];
    const songs = theme.songs.map((_, index) => theme.songs[(index + base) % theme.songs.length]);
    ui.detectedTheme.textContent = theme.label;
    ui.socialCaption.value = caption;
    ui.hashtagText.value = theme.hashtags.join(" ");
    renderSongs(songs);
  }

  function detectTheme(quote) {
    const normalized = quote.toLowerCase();
    let bestTheme = "life";
    let bestScore = 0;
    Object.entries(THEMES).forEach(([key, theme]) => {
      const score = theme.keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? (keyword.includes(" ") ? 3 : 1) : 0), 0);
      if (score > bestScore) {
        bestScore = score;
        bestTheme = key;
      }
    });
    return bestTheme;
  }

  function renderSongs(songs) {
    ui.songList.replaceChildren();
    songs.forEach((song, index) => {
      const item = document.createElement("div");
      item.className = "song-item";
      item.innerHTML = `<span class="song-number">${index + 1}</span><span class="song-copy"><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml(song.artist)}</small></span><span class="song-mood">${escapeHtml(song.mood)}</span>`;
      ui.songList.append(item);
    });
  }

  function getSocialText() {
    const theme = THEMES[state.currentTheme];
    const songs = [...ui.songList.querySelectorAll(".song-item")].map((item, index) => {
      const title = item.querySelector("strong")?.textContent || "";
      const artist = item.querySelector("small")?.textContent || "";
      return `${index + 1}. ${title} — ${artist}`;
    });
    return [
      `Tema: ${theme?.label || "Quotes"}`,
      "",
      "Caption:",
      ui.socialCaption.value.trim(),
      "",
      "Hashtag:",
      ui.hashtagText.value.trim(),
      "",
      "Request lagu IG/TikTok:",
      ...songs,
      "",
      "Catatan: ketersediaan lagu dapat berbeda menurut wilayah.",
    ].join("\n");
  }

  async function copySocialText() {
    const text = getSocialText();
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else fallbackCopy(text);
      showToast("Caption, hashtag, dan lagu berhasil disalin.");
    } catch (error) {
      fallbackCopy(text);
      showToast("Teks berhasil disalin.");
    }
  }

  function downloadSocialText() {
    const blob = new Blob([getSocialText()], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `ide-posting-${state.currentTheme}.txt`);
    showToast("File ide posting diunduh.");
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function isMobileDevice() {
    return window.matchMedia("(max-width: 900px)").matches || /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  }

  function isRealme5Pro() {
    return /RMX1971|realme[\s_-]?5[\s_-]?pro/i.test(navigator.userAgent);
  }

  function setDefaultExportProfile() {
    ui.videoExportProfile.value = isMobileDevice() ? "compatible" : "fullHd";
    if (isRealme5Pro()) ui.videoExportProfile.value = "compatible";
  }

  function getExportProfile() {
    return EXPORT_PROFILES[ui.videoExportProfile.value] || EXPORT_PROFILES.compatible;
  }

  function onExportProfileChanged() {
    clearGeneratedVideo();
    updateExportProfileUi();
    updateRecorderLabel();
    updateExportState();
    const profile = getExportProfile();
    showToast(profile.id === "compatible" ? "Mode MP4 IG/TikTok aktif untuk realme 5 Pro." : "Mode Full HD aktif.");
  }

  function updateExportProfileUi() {
    const profile = getExportProfile();
    ui.outputResolutionTitle.textContent = `Output ${profile.resolutionLabel} px`;
    ui.outputResolutionHint.textContent = profile.detail;
    ui.previewResolutionChip.textContent = profile.resolutionLabel;
    ui.videoExportTitle.textContent = profile.id === "compatible" ? "1 video · MP4 siap IG/TikTok" : "1 video · 9:16 Full HD";
    ui.videoExportProfileHelp.textContent = profile.id === "compatible"
      ? "Disarankan untuk realme 5 Pro: 720p, 24 fps konstan, H.264 + AAC."
      : "Gunakan jika HP mampu merender 1080p 30 fps tanpa frame terlewat.";
  }

  function getRecorderConfig(profile = getExportProfile()) {
    if (typeof MediaRecorder === "undefined") return null;
    const mp4Options = [
      { mimeType: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", extension: "mp4", label: "MP4" },
      { mimeType: "video/mp4", extension: "mp4", label: "MP4" },
    ];
    const fullHdOptions = [
      ...mp4Options,
      { mimeType: "video/webm;codecs=vp8,opus", extension: "webm", label: "WebM VP8" },
      { mimeType: "video/webm;codecs=vp9,opus", extension: "webm", label: "WebM VP9" },
      { mimeType: "video/webm", extension: "webm", label: "WebM" },
    ];
    const options = profile.allowWebmFallback ? fullHdOptions : mp4Options;
    return options.find((option) => MediaRecorder.isTypeSupported(option.mimeType)) || null;
  }

  function hasStableEncoderRuntime() {
    return Boolean(window.Mediabunny && window.VideoEncoder && window.VideoDecoder && window.AudioEncoder && window.AudioDecoder);
  }

  function getAvcCodecString(profile) {
    return profile.id === "compatible" ? "avc1.42001f" : "avc1.420028";
  }

  function getStableVideoCapability(profile) {
    return {
      width: profile.width,
      height: profile.height,
      bitrate: profile.videoBitsPerSecond,
      framerate: profile.fps,
      fullCodecString: getAvcCodecString(profile),
      hardwareAcceleration: "prefer-hardware",
    };
  }

  function getStableVideoEncoding(profile) {
    return {
      codec: "avc",
      bitrate: profile.videoBitsPerSecond,
      fullCodecString: getAvcCodecString(profile),
      keyFrameInterval: 2,
      bitrateMode: "variable",
      latencyMode: "quality",
      hardwareAcceleration: "prefer-hardware",
      contentHint: "motion",
    };
  }

  function getStableAudioCapability(profile) {
    return {
      sampleRate: 48_000,
      numberOfChannels: 2,
      bitrate: profile.audioBitsPerSecond,
      fullCodecString: "mp4a.40.2",
    };
  }

  function getStableAudioEncoding(profile) {
    return {
      codec: "aac",
      bitrate: profile.audioBitsPerSecond,
      fullCodecString: "mp4a.40.2",
      transform: { sampleRate: 48_000, numberOfChannels: 2 },
    };
  }

  async function detectSocialEncoderSupport() {
    state.socialEncoderStatus = "checking";
    if (!hasStableEncoderRuntime()) {
      state.socialEncoderStatus = "unsupported";
      return;
    }
    try {
      const M = window.Mediabunny;
      const safeCheck = async (check) => {
        try { return Boolean(await check()); }
        catch (error) {
          console.warn("Varian encoder tidak tersedia", error);
          return false;
        }
      };
      const [compatibleVideo, fullHdVideo, audio] = await Promise.all([
        safeCheck(() => M.canEncodeVideo("avc", getStableVideoCapability(EXPORT_PROFILES.compatible))),
        safeCheck(() => M.canEncodeVideo("avc", getStableVideoCapability(EXPORT_PROFILES.fullHd))),
        safeCheck(() => M.canEncodeAudio("aac", getStableAudioCapability(EXPORT_PROFILES.compatible))),
      ]);
      state.socialVideoEncoder.compatible = Boolean(compatibleVideo);
      state.socialVideoEncoder.fullHd = Boolean(fullHdVideo);
      state.socialAudioEncoder = Boolean(audio);
      state.socialEncoderStatus = compatibleVideo && audio ? "supported" : "unsupported";
    } catch (error) {
      console.warn("Pemeriksaan encoder MP4 gagal", error);
      state.socialEncoderStatus = "unsupported";
    }
  }

  function hasStableSocialEncoder(profile = getExportProfile()) {
    return Boolean(
      profile.stableMp4
      && state.socialEncoderStatus !== "checking"
      && state.socialVideoEncoder[profile.id]
      && state.socialAudioEncoder
    );
  }

  function updateRecorderLabel() {
    const profile = getExportProfile();
    const config = getRecorderConfig(profile);
    if (profile.stableMp4 && state.socialEncoderStatus === "checking") ui.videoFormatChip.textContent = "Memeriksa MP4…";
    else if (hasStableSocialEncoder(profile)) ui.videoFormatChip.textContent = "MP4 · H.264 + AAC";
    else if (config) ui.videoFormatChip.textContent = "MP4 native · validasi H.264";
    else ui.videoFormatChip.textContent = "Tidak didukung";
  }

  function updateExportState() {
    const profile = getExportProfile();
    const config = getRecorderConfig(profile);
    const quoteReady = ui.quoteInput.value.trim().length > 0;
    const busy = Boolean(state.activeRecorder);
    const stableAvailable = hasStableSocialEncoder(profile);
    const checkingEncoder = profile.stableMp4 && state.socialEncoderStatus === "checking";
    const outputLabel = stableAvailable ? "MP4 H.264 + AAC" : config?.label;
    const exportDisabled = !state.loaded || !quoteReady || checkingEncoder || (!config && !stableAvailable) || busy;
    ui.generateVideoButton.disabled = exportDisabled;
    ui.mobileGenerateVideoButton.disabled = exportDisabled;
    const canShareGenerated = Boolean(state.lastGeneratedFile);
    ui.shareGeneratedVideoButton.hidden = !canShareGenerated;
    ui.mobileShareVideoButton.hidden = !canShareGenerated;
    if (checkingEncoder) ui.videoExportHint.textContent = "Memeriksa encoder MP4 H.264 + AAC…";
    else if (!config && !stableAvailable && profile.id === "compatible") ui.videoExportHint.textContent = "Encoder MP4 belum tersedia. Perbarui Chrome Android, lalu buka ulang aplikasi.";
    else if (!config && !stableAvailable) ui.videoExportHint.textContent = "Browser ini tidak mendukung encoder video. Gunakan Chrome Android terbaru.";
    else if (!state.loaded) ui.videoExportHint.textContent = "Unggah video untuk mengaktifkan ekspor.";
    else if (!quoteReady) ui.videoExportHint.textContent = "Masukkan quotes terlebih dahulu.";
    else if (busy) ui.videoExportHint.textContent = "Video sedang dirender. Jangan tutup aplikasi.";
    else ui.videoExportHint.textContent = `${formatTime(ui.sourceVideo.duration)} · ${profile.resolutionLabel} px · ${profile.fps} fps konstan · output ${outputLabel}`;
  }

  function includesAscii(bytes, text) {
    const codes = Array.from(text, (character) => character.charCodeAt(0));
    outer: for (let index = 0; index <= bytes.length - codes.length; index += 1) {
      for (let offset = 0; offset < codes.length; offset += 1) {
        if (bytes[index + offset] !== codes[offset]) continue outer;
      }
      return true;
    }
    return false;
  }

  async function inspectRecordedBlob(blob, fallbackConfig) {
    const scanSize = 1_500_000;
    const head = new Uint8Array(await blob.slice(0, Math.min(blob.size, scanSize)).arrayBuffer());
    const tailStart = Math.max(0, blob.size - scanSize);
    const tail = tailStart > 0 ? new Uint8Array(await blob.slice(tailStart).arrayBuffer()) : head;
    const hasMarker = (text) => includesAscii(head, text) || includesAscii(tail, text);
    const webm = head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
    const mp4 = includesAscii(head.subarray(0, 32), "ftyp");
    const codec = hasMarker("V_VP8") || hasMarker("vp08")
      ? "VP8"
      : hasMarker("V_VP9") || hasMarker("vp09")
        ? "VP9"
        : hasMarker("avc1") || hasMarker("avc3")
          ? "H.264"
          : "codec browser";
    if (webm) return { extension: "webm", mimeType: "video/webm", label: `WebM · ${codec}`, codec };
    if (mp4) return { extension: "mp4", mimeType: "video/mp4", label: `MP4 · ${codec}`, codec };
    return { ...fallbackConfig, codec };
  }

  function drawVideoSampleCover(context, width, height, sample) {
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);
    if (!sample) return;
    const sourceWidth = sample.displayWidth;
    const sourceHeight = sample.displayHeight;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const cropWidth = width / scale;
    const cropHeight = height / scale;
    const sourceX = (sourceWidth - cropWidth) / 2;
    const sourceY = (sourceHeight - cropHeight) / 2;
    sample.draw(context, sourceX, sourceY, cropWidth, cropHeight, 0, 0, width, height);
  }

  async function generateStableSocialMp4(profile) {
    const M = window.Mediabunny;
    if (!M) throw new Error("Encoder MP4 belum dimuat.");

    let input = null;
    let output = null;
    state.cancelRequested = false;
    state.activeRecorder = { kind: "stable" };
    state.stopRecording = () => { state.cancelRequested = true; };
    ui.cancelVideoGeneration.disabled = false;
    ui.cancelVideoGeneration.textContent = "Batalkan";
    setProgress(0, "Menyiapkan MP4 sosial…", `${profile.resolutionLabel} · H.264 + AAC · tepat ${profile.fps} fps`);
    openProgress();
    updateExportState();

    try {
      const canEncodeVideo = await M.canEncodeVideo("avc", getStableVideoCapability(profile));
      if (!canEncodeVideo) throw new Error("Encoder H.264 tidak tersedia. Perbarui Chrome Android.");

      input = new M.Input({ source: new M.BlobSource(state.videoFile), formats: M.ALL_FORMATS });
      const videoTrack = await input.getPrimaryVideoTrack();
      if (!videoTrack || !(await videoTrack.canDecode())) throw new Error("Codec video sumber tidak dapat dibaca oleh browser.");

      const audioTrack = await input.getPrimaryAudioTrack();
      let includeAudio = false;
      if (audioTrack) {
        includeAudio = await audioTrack.canDecode()
          && await M.canEncodeAudio("aac", getStableAudioCapability(profile));
        if (!includeAudio) throw new Error("Encoder AAC tidak tersedia. Perbarui Chrome Android.");
      }

      const duration = Math.min(ui.sourceVideo.duration, MAX_DURATION);
      const frameDuration = 1 / profile.fps;
      const frameCount = Math.max(1, Math.ceil(duration * profile.fps));
      const timestamps = Array.from({ length: frameCount }, (_, index) => index / profile.fps);
      const canvas = document.createElement("canvas");
      canvas.width = profile.width;
      canvas.height = profile.height;
      const context = canvas.getContext("2d", { alpha: false });
      const target = new M.BufferTarget();
      output = new M.Output({ format: new M.Mp4OutputFormat({ fastStart: "in-memory" }), target });
      const videoSource = new M.CanvasSource(canvas, getStableVideoEncoding(profile));
      output.addVideoTrack(videoSource, { frameRate: profile.fps });

      let audioSource = null;
      if (includeAudio) {
        audioSource = new M.AudioSampleSource(getStableAudioEncoding(profile));
        output.addAudioTrack(audioSource);
      }

      await output.start();
      ui.sourceVideo.pause();
      await document.fonts.ready;

      const videoTask = (async () => {
        const sink = new M.VideoSampleSink(videoTrack);
        let frameIndex = 0;
        for await (const sample of sink.samplesAtTimestamps(timestamps)) {
          if (state.cancelRequested) {
            sample?.close();
            throw new DOMException("Dibatalkan", "AbortError");
          }
          drawVideoSampleCover(context, profile.width, profile.height, sample);
          drawCaption(context, profile.width, profile.height, ui.quoteInput.value);
          await videoSource.add(frameIndex / profile.fps, frameDuration);
          sample?.close();
          frameIndex += 1;
          const percent = (frameIndex / frameCount) * 100;
          setProgress(percent, `Menyusun frame ${Math.round(percent)}%`, `${frameIndex} / ${frameCount} frame · tepat ${profile.fps} fps`);
        }
        videoSource.close();
        if (frameIndex !== frameCount) throw new Error(`Frame tidak lengkap (${frameIndex}/${frameCount}).`);
      })();

      const audioTask = (async () => {
        if (!audioTrack || !audioSource) return;
        const sink = new M.AudioSampleSink(audioTrack);
        for await (const sample of sink.samples(0, duration)) {
          if (state.cancelRequested) {
            sample.close();
            throw new DOMException("Dibatalkan", "AbortError");
          }
          await audioSource.add(sample);
          sample.close();
        }
        audioSource.close();
      })();

      await Promise.all([videoTask, audioTask]);
      if (state.cancelRequested) throw new DOMException("Dibatalkan", "AbortError");
      await output.finalize();
      if (!target.buffer) throw new Error("Encoder tidak menghasilkan file video.");
      const verificationBytes = new Uint8Array(target.buffer, 0, Math.min(target.buffer.byteLength, 2_000_000));
      if (!includesAscii(verificationBytes.subarray(0, 32), "ftyp") || !includesAscii(verificationBytes, "avc1")) {
        throw new Error("Validasi MP4 H.264 gagal. File tidak disimpan agar tidak ditolak IG/TikTok.");
      }
      if (includeAudio && !includesAscii(verificationBytes, "mp4a")) {
        throw new Error("Validasi audio AAC gagal. File tidak disimpan agar tidak ditolak IG/TikTok.");
      }

      const blob = new Blob([target.buffer], { type: "video/mp4" });
      const date = new Date().toLocaleDateString("sv-SE");
      const fileName = `video-quotes-${state.currentTheme}-${profile.id}-${date}.mp4`;
      state.lastGeneratedFile = new File([blob], fileName, { type: "video/mp4", lastModified: Date.now() });
      updateExportState();
      downloadBlob(blob, fileName);
      setProgress(100, "MP4 siap diupload!", `${frameCount} frame · ${profile.fps} fps konstan · H.264 + AAC`);
      await delay(450);
      closeProgress();
      showToast("MP4 H.264 + AAC selesai. Tekan Bagikan lalu pilih Instagram atau TikTok.");
    } catch (error) {
      try {
        if (output && !["finalized", "canceled"].includes(output.state)) await output.cancel();
      } catch (cancelError) {
        console.warn("Gagal menutup encoder", cancelError);
      }
      closeProgress();
      throw error;
    } finally {
      try { input?.dispose?.(); } catch (disposeError) { console.warn("Gagal melepas input", disposeError); }
      state.activeRecorder = null;
      state.stopRecording = null;
      ui.cancelVideoGeneration.disabled = false;
      ui.cancelVideoGeneration.textContent = "Batalkan";
      updateTimeline();
      requestPreview();
      updateExportState();
    }
  }

  function clearGeneratedVideo() {
    state.lastGeneratedFile = null;
    if (ui.shareGeneratedVideoButton) ui.shareGeneratedVideoButton.hidden = true;
    if (ui.mobileShareVideoButton) ui.mobileShareVideoButton.hidden = true;
  }

  async function ensureAudioGraph() {
    if (state.audioContext) {
      if (state.audioContext.state === "suspended") await state.audioContext.resume();
      applyPreviewVolume();
      return true;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    try {
      state.audioContext = new AudioContextClass();
      state.audioSource = state.audioContext.createMediaElementSource(ui.sourceVideo);
      state.audioDestination = state.audioContext.createMediaStreamDestination();
      state.audioGain = state.audioContext.createGain();
      state.audioSource.connect(state.audioDestination);
      state.audioSource.connect(state.audioGain);
      state.audioGain.connect(state.audioContext.destination);
      ui.sourceVideo.muted = false;
      await state.audioContext.resume();
      applyPreviewVolume();
      return true;
    } catch (error) {
      console.warn("Audio graph unavailable", error);
      return false;
    }
  }

  function applyPreviewVolume() {
    if (state.audioGain) state.audioGain.gain.value = state.previewMuted || state.activeRecorder ? 0 : 1;
  }

  async function generateVideo() {
    if (state.activeRecorder) return;
    if (!state.loaded || !ui.quoteInput.value.trim()) {
      showToast("Unggah video dan masukkan quotes terlebih dahulu.", true);
      return;
    }
    const profile = getExportProfile();
    const config = getRecorderConfig(profile);
    const stableAvailable = hasStableSocialEncoder(profile);
    if (!config && !stableAvailable) {
      showToast("Browser tidak mendukung ekspor video. Gunakan Chrome Android atau Safari iPhone terbaru.", true);
      return;
    }

    if (stableAvailable) {
      try {
        await generateStableSocialMp4(profile);
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          showToast("Proses video dibatalkan.");
          return;
        }
        console.warn("Encoder MP4 stabil gagal, mencoba encoder native", error);
        if (!config) {
          showToast(`Video gagal diproses: ${error.message || "encoder tidak tersedia"}`, true);
          return;
        }
        showToast("Encoder MP4 stabil tidak tersedia. Mencoba encoder MP4 bawaan browser.", true);
      }
    }

    const video = ui.sourceVideo;
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = profile.width;
    outputCanvas.height = profile.height;
    const outputContext = outputCanvas.getContext("2d", { alpha: false });
    const canvasStream = outputCanvas.captureStream(profile.fps);
    const canvasVideoTrack = canvasStream.getVideoTracks()[0];
    if (canvasVideoTrack) canvasVideoTrack.contentHint = "motion";
    const tracks = [...canvasStream.getVideoTracks()];
    const hasAudioGraph = await ensureAudioGraph();
    if (hasAudioGraph) tracks.push(...state.audioDestination.stream.getAudioTracks());
    const outputStream = new MediaStream(tracks);
    const chunks = [];

    state.cancelRequested = false;
    ui.cancelVideoGeneration.disabled = false;
    ui.cancelVideoGeneration.textContent = "Batalkan";
    setProgress(0, "Menyiapkan video…", "Proses berlangsung sesuai durasi asli.");
    openProgress();

    try {
      video.pause();
      await seekTo(video, 0);
      await document.fonts.ready;
      renderVideoFrame(outputContext, profile.width, profile.height, ui.quoteInput.value);

      const recorder = new MediaRecorder(outputStream, {
        mimeType: config.mimeType,
        videoBitsPerSecond: profile.videoBitsPerSecond,
        audioBitsPerSecond: profile.audioBitsPerSecond,
      });
      state.activeRecorder = recorder;
      applyPreviewVolume();
      updateExportState();

      const finished = new Promise((resolve, reject) => {
        recorder.addEventListener("dataavailable", (event) => {
          if (event.data?.size) chunks.push(event.data);
        });
        recorder.addEventListener("error", (event) => reject(event.error || new Error("Perekaman gagal.")));
        recorder.addEventListener("stop", resolve, { once: true });
      });

      const stop = () => {
        cancelAnimationFrame(state.recordingFrame);
        if (recorder.state !== "inactive") recorder.stop();
      };
      state.stopRecording = stop;
      video.addEventListener("ended", stop, { once: true });
      recorder.start(500);
      await video.play();

      const frameInterval = 1000 / profile.fps;
      let lastRenderedAt = -Infinity;
      const drawLoop = (timestamp = performance.now()) => {
        if (timestamp - lastRenderedAt >= frameInterval - 2) {
          renderVideoFrame(outputContext, profile.width, profile.height, ui.quoteInput.value);
          lastRenderedAt = timestamp;
        }
        const percent = video.duration ? (video.currentTime / video.duration) * 100 : 0;
        setProgress(percent, `Merender ${Math.round(percent)}%`, `${profile.resolutionLabel} · ${profile.fps} fps · ${formatTime(video.currentTime)} dari ${formatTime(video.duration)}`);
        if (state.cancelRequested) {
          video.pause();
          stop();
          return;
        }
        if (!video.ended && recorder.state !== "inactive") state.recordingFrame = requestAnimationFrame(drawLoop);
      };
      state.recordingFrame = requestAnimationFrame(drawLoop);
      await finished;

      if (state.cancelRequested) throw new DOMException("Dibatalkan", "AbortError");
      if (!chunks.length) throw new Error("Browser tidak menghasilkan data video.");
      setProgress(100, "Video selesai!", "Video siap diunduh dan dibagikan.");
      const rawBlob = new Blob(chunks, { type: config.mimeType });
      const actual = await inspectRecordedBlob(rawBlob, config);
      if (!profile.allowWebmFallback && (actual.extension !== "mp4" || actual.codec !== "H.264")) {
        throw new Error("Browser menghasilkan WebM/codec non-H.264. Perbarui Chrome Android agar hasil dapat diupload ke IG/TikTok.");
      }
      const blob = rawBlob.slice(0, rawBlob.size, actual.mimeType);
      const date = new Date().toLocaleDateString("sv-SE");
      const fileName = `video-quotes-${state.currentTheme}-${profile.id}-${date}.${actual.extension}`;
      state.lastGeneratedFile = new File([blob], fileName, { type: actual.mimeType, lastModified: Date.now() });
      updateExportState();
      downloadBlob(blob, fileName);
      await delay(450);
      closeProgress();
      showToast(`Video ${profile.label} (${actual.label}) selesai. Tekan Bagikan untuk menyimpan ke HP.`);
    } catch (error) {
      closeProgress();
      if (error?.name === "AbortError") showToast("Proses video dibatalkan.");
      else {
        const compatibilityBlock = /non-H\.264|Validasi MP4|Validasi audio AAC/.test(error?.message || "");
        if (compatibilityBlock) console.warn(error);
        else console.error(error);
        showToast(`Video gagal diproses: ${error.message || "kesalahan browser"}`, true);
      }
    } finally {
      cancelAnimationFrame(state.recordingFrame);
      state.recordingFrame = 0;
      state.activeRecorder = null;
      state.stopRecording = null;
      canvasStream.getTracks().forEach((track) => track.stop());
      video.pause();
      applyPreviewVolume();
      updateTimeline();
      requestPreview();
      updateExportState();
    }
  }

  function cancelGeneration() {
    state.cancelRequested = true;
    ui.cancelVideoGeneration.disabled = true;
    ui.cancelVideoGeneration.textContent = "Membatalkan…";
    ui.sourceVideo.pause();
    state.stopRecording?.();
  }

  function seekTo(video, time) {
    return new Promise((resolve) => {
      if (Math.abs(video.currentTime - time) < .02) {
        video.currentTime = time;
        resolve();
        return;
      }
      video.addEventListener("seeked", resolve, { once: true });
      video.currentTime = time;
    });
  }

  function setProgress(percent, title, detail) {
    const safe = clamp(percent, 0, 100);
    ui.videoProgressBar.style.width = `${safe}%`;
    ui.videoProgressPercent.textContent = `${Math.round(safe)}%`;
    ui.videoProgressTitle.textContent = title;
    ui.videoProgressDetail.textContent = detail;
    ui.videoProgressTime.textContent = `${formatTime(ui.sourceVideo.currentTime)} / ${formatTime(ui.sourceVideo.duration)}`;
  }

  function openProgress() {
    if (typeof ui.videoProgressDialog.showModal === "function") ui.videoProgressDialog.showModal();
    else ui.videoProgressDialog.setAttribute("open", "");
  }

  function closeProgress() {
    if (ui.videoProgressDialog.open && typeof ui.videoProgressDialog.close === "function") ui.videoProgressDialog.close();
    else ui.videoProgressDialog.removeAttribute("open");
    ui.cancelVideoGeneration.disabled = false;
    ui.cancelVideoGeneration.textContent = "Batalkan";
  }

  function fontWeightLabel(value) {
    const labels = {
      100: "Thin",
      200: "Extra Light",
      300: "Light",
      400: "Regular",
      500: "Medium",
      600: "Semi Bold",
      700: "Bold",
      800: "Extra Bold",
      900: "Black",
    };
    return labels[Number(value)] || "Custom";
  }

  function updateRangeFill(input) {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const percentage = ((Number(input.value) - min) / (max - min)) * 100;
    input.style.setProperty("--range-fill", `${percentage}%`);
  }

  async function shareGeneratedVideo() {
    const file = state.lastGeneratedFile;
    if (!file) {
      showToast("Proses video terlebih dahulu.", true);
      return;
    }
    if (file.type !== "video/mp4" || !file.name.toLowerCase().endsWith(".mp4")) {
      showToast("IG/TikTok memerlukan MP4. Pilih mode IG/TikTok MP4 lalu proses ulang.", true);
      return;
    }
    try {
      const shareData = { files: [file], title: "Video quotes" };
      let canShareFiles = false;
      if (typeof navigator.share === "function" && typeof navigator.canShare === "function") {
        try { canShareFiles = navigator.canShare({ files: [file] }); } catch (_) { canShareFiles = false; }
      }
      if (canShareFiles) {
        await navigator.share(shareData);
        showToast("Pilih Instagram atau TikTok pada menu bagikan.");
      } else {
        downloadBlob(file, file.name);
        showToast("Browser tidak mendukung berbagi file. Video diunduh kembali.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(error);
        showToast("Video belum berhasil dibagikan. Coba unduh kembali.", true);
      }
    }
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

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);
    return `${minutes}:${String(remaining).padStart(2, "0")}`;
  }

  function formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** index;
    return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
  }

  function hashString(text) {
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) | 0;
    return hash;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  function showToast(message, isError = false) {
    clearTimeout(state.toastTimer);
    ui.videoToast.textContent = message;
    ui.videoToast.classList.toggle("error", isError);
    ui.videoToast.classList.add("show");
    state.toastTimer = setTimeout(() => ui.videoToast.classList.remove("show"), 3400);
  }

  window.addEventListener("beforeunload", () => {
    state.tiktokAbortController?.abort();
    if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
    state.audioContext?.close();
  });

  init();
})();
