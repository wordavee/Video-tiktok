(() => {
  "use strict";
  const W = 720,
    H = 1280,
    SW = 720,
    SH = 450,
    EXPORT_W = 1080,
    EXPORT_H = 1920,
    EXPORT_SW = 1080,
    EXPORT_SH = 675,
    DEFAULT_CLIP = 18,
    MIN_CLIP = 5,
    MAX_CLIP = 60,
    FPS = 24,
    VIDEO_BITRATE = 8_000_000,
    AUDIO_BITRATE = 192_000,
    AVC_CODEC = "avc1.420028",
    PHOTO = { width: 941, height: 1672 },
    SCREEN_POINTS = [
      { x: 0, y: 552 },
      { x: 696, y: 587 },
      { x: 802, y: 1163 },
      { x: 0, y: 1259 },
    ],
    PIPED = [
      "https:" + "//pipedapi.kavin.rocks",
      "https:" + "//pipedapi.leptons.xyz",
      "https:" + "//pipedapi.nosebs.ru",
      "https:" + "//pipedapi-libre.kavin.rocks",
      "https:" + "//piped-api.privacy.com.de",
      "https:" + "//pipedapi.adminforge.de",
      "https:" + "//api.piped.yt",
      "https:" + "//pipedapi.drgns.space",
      "https:" + "//pipedapi.owo.si",
      "https:" + "//pipedapi.ducks.party",
      "https:" + "//piped-api.codespace.cz",
      "https:" + "//pipedapi.reallyaweso.me",
      "https:" + "//api.piped.private.coffee",
      "https:" + "//pipedapi.darkness.services",
      "https:" + "//pipedapi.orangenet.cc",
    ],
    $ = (s) => document.querySelector(s),
    ui = {
      url: $("#youtubeUrl"),
      load: $("#loadYoutube"),
      status: $("#youtubeStatus"),
      driveUrl: $("#googleDriveUrl"),
      driveLoad: $("#loadGoogleDrive"),
      driveStatus: $("#googleDriveStatus"),
      drivePanel: $("#driveSourcePanel"),
      fallback: $("#fallbackVideoInput"),
      video: $("#sourceVideo"),
      min: $("#startMinutes"),
      sec: $("#startSeconds"),
      range: $("#clipStartRange"),
      rangeOut: $("#clipStartOutput"),
      clipLabel: $("#clipRangeLabel"),
      clipDuration: $("#clipDuration"),
      clipDurationOut: $("#clipDurationOutput"),
      clipDurationDisplay: $("#durationDisplay"),
      clipDurationSummary: $("#clipDurationSummary"),
      durationBadge: $("#durationBadge"),
      volume: $("#audioVolume"),
      volumeOut: $("#audioVolumeOutput"),
      preview: $("#previewClip"),
      text: $("#captionText"),
      x: $("#captionX"),
      y: $("#captionY"),
      size: $("#captionSize"),
      width: $("#captionWidth"),
      xOut: $("#captionXOutput"),
      yOut: $("#captionYOutput"),
      sizeOut: $("#captionSizeOutput"),
      widthOut: $("#captionWidthOutput"),
      generate: $("#generateTipe5"),
      share: $("#shareTipe5"),
      exportSummary: $("#exportSummary"),
      canvas: $("#tipe5Canvas"),
      stage: $("#previewStage"),
      stageMessage: $("#stageMessage"),
      embedLayer: $("#youtubeEmbedLayer"),
      embed: $("#youtubeEmbed"),
      play: $("#playPausePreview"),
      current: $("#previewCurrentTime"),
      end: $("#previewEndTime"),
      timeline: $("#previewProgressBar"),
      dialog: $("#tipe5ProgressDialog"),
      progressTitle: $("#tipe5ProgressTitle"),
      progressDetail: $("#tipe5ProgressDetail"),
      progressBar: $("#tipe5ProgressBar"),
      progressPct: $("#tipe5ProgressPercent"),
      progressCount: $("#tipe5ProgressCounter"),
      cancel: $("#cancelTipe5"),
      mobilePreview: $("#mobilePreviewTipe5"),
      mobileGenerate: $("#mobileGenerateTipe5"),
      mobileShare: $("#mobileShareTipe5"),
      toast: $("#tipe5Toast"),
    };
  if (!ui.canvas) return;
  const PIN_STORAGE_KEY = "captionStudio.tipe5CornerPins.v1",
    TEMPLATE_STORAGE_KEY = "captionStudio.tipe5Template.v2",
    ASSET_DB_NAME = "captionStudioTipe5Assets",
    ASSET_STORE_NAME = "assets",
    DEFAULT_FONT_FAMILY = "Arial, Helvetica, sans-serif",
    FONT_PRESETS = {
      arial: { label: "Arial Bold", family: DEFAULT_FONT_FAMILY },
      impact: { label: "Impact", family: "Impact, Arial Black, sans-serif" },
    },
    PIN_NAMES = ["Kiri atas", "Kanan atas", "Kanan bawah", "Kiri bawah"];
  Object.assign(ui, {
    togglePins: $("#toggleCornerPins"),
    savePins: $("#saveCornerPins"),
    resetPins: $("#resetCornerPins"),
    pinStatus: $("#cornerPinStatus"),
    pinBadge: $("#cornerPinBadge"),
    pinLayer: $("#cornerPinLayer"),
    pinPolygon: $("#cornerPinPolygon"),
    perspectiveBadge: $("#perspectiveBadge"),
    captionModeBadge: $("#captionModeBadge"),
    fontInput: $("#tipe5FontInput"),
    fontLabel: $("#tipe5FontLabel"),
    resetFont: $("#resetTipe5Font"),
    backgroundInput: $("#tipe5BackgroundInput"),
    backgroundLabel: $("#tipe5BackgroundLabel"),
    resetBackground: $("#resetTipe5Background"),
    saveTemplate: $("#saveTipe5Template"),
    useTemplate: $("#useTipe5Template"),
    deleteTemplate: $("#deleteTipe5Template"),
    templateStatus: $("#tipe5TemplateStatus"),
  });
  ui.pinButtons = Array.from(
    document.querySelectorAll(".corner-pin[data-pin]"),
  );
  ui.captionModeButtons = Array.from(
    document.querySelectorAll("[data-caption-mode]"),
  );
  ui.fontPresetButtons = Array.from(
    document.querySelectorAll("[data-font-preset]"),
  );
  const ctx = ui.canvas.getContext("2d", { alpha: false }),
    screenCanvas = document.createElement("canvas");
  screenCanvas.width = SW;
  screenCanvas.height = SH;
  const sctx = screenCanvas.getContext("2d", { alpha: false }),
    state = {
      background: null,
      gl: null,
      file: null,
      url: "",
      objectUrl: "",
      duration: 0,
      clipDuration: DEFAULT_CLIP,
      audioGain: 1,
      textMode: "flat",
      ready: false,
      sourceKind: "",
      youtubeId: "",
      abort: null,
      raf: 0,
      embedTimer: 0,
      toastTimer: 0,
      cancelled: false,
      input: null,
      output: null,
      lastFile: null,
      dragging: false,
      drawError: false,
      defaultBackground: null,
      backgroundObjectUrl: "",
      backgroundBuffer: null,
      backgroundType: "",
      backgroundName: "",
      fontFamily: DEFAULT_FONT_FAMILY,
      fontPreset: "arial",
      customFontBuffer: null,
      customFontName: "",
      screenQuad: null,
      pinEditing: false,
      activePin: -1,
      pinPointerId: null,
      pinsDirty: false,
      pinsSaved: false,
      wakeLock: null,
    };
  const cross = (a, b) => a.x * b.y - a.y * b.x;
  function projectiveWeights(q) {
    const a = { x: q[2].x - q[0].x, y: q[2].y - q[0].y },
      b = { x: q[3].x - q[1].x, y: q[3].y - q[1].y },
      o = { x: q[1].x - q[0].x, y: q[1].y - q[0].y },
      d = cross(a, b);
    if (Math.abs(d) < 1e-6) return [1, 1, 1, 1];
    const t = cross(o, b) / d,
      u = cross(o, a) / d,
      s = (v) => Math.max(0.0001, Math.abs(v));
    return [1 / s(1 - t), 1 / s(1 - u), 1 / s(t), 1 / s(u)];
  }
  class PerspectiveRenderer {
    constructor(w, h) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = w;
      this.canvas.height = h;
      this.w = w;
      this.h = h;
      const g = (this.gl = this.canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true,
      }));
      if (!g) throw Error("WebGL tidak tersedia.");
      const sh = (t, s) => {
          const x = g.createShader(t);
          g.shaderSource(x, s);
          g.compileShader(x);
          if (!g.getShaderParameter(x, g.COMPILE_STATUS))
            throw Error(g.getShaderInfoLog(x));
          return x;
        },
        v = sh(
          g.VERTEX_SHADER,
          "attribute vec2 p;attribute vec3 t;varying highp vec3 v;void main(){gl_Position=vec4(p,0.,1.);v=t;}",
        ),
        f = sh(
          g.FRAGMENT_SHADER,
          "precision mediump float;uniform sampler2D tex;varying highp vec3 v;void main(){gl_FragColor=texture2D(tex,v.xy/v.z);}",
        );
      this.program = g.createProgram();
      g.attachShader(this.program, v);
      g.attachShader(this.program, f);
      g.linkProgram(this.program);
      this.vb = g.createBuffer();
      this.ib = g.createBuffer();
      this.texture = g.createTexture();
      g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, this.ib);
      g.bufferData(
        g.ELEMENT_ARRAY_BUFFER,
        new Uint16Array([0, 1, 2, 0, 2, 3]),
        g.STATIC_DRAW,
      );
      g.bindTexture(g.TEXTURE_2D, this.texture);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      this.pl = g.getAttribLocation(this.program, "p");
      this.tl = g.getAttribLocation(this.program, "t");
      this.ul = g.getUniformLocation(this.program, "tex");
    }
    render(src, q, waitForGpu = false) {
      const g = this.gl,
        k = projectiveWeights(q),
        uv = [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        v = [];
      q.forEach((p, i) =>
        v.push(
          (p.x / this.w) * 2 - 1,
          1 - (p.y / this.h) * 2,
          uv[i][0] * k[i],
          uv[i][1] * k[i],
          k[i],
        ),
      );
      g.viewport(0, 0, this.w, this.h);
      g.clearColor(0, 0, 0, 0);
      g.clear(g.COLOR_BUFFER_BIT);
      g.useProgram(this.program);
      g.bindBuffer(g.ARRAY_BUFFER, this.vb);
      g.bufferData(g.ARRAY_BUFFER, new Float32Array(v), g.DYNAMIC_DRAW);
      g.enableVertexAttribArray(this.pl);
      g.vertexAttribPointer(this.pl, 2, g.FLOAT, false, 20, 0);
      g.enableVertexAttribArray(this.tl);
      g.vertexAttribPointer(this.tl, 3, g.FLOAT, false, 20, 8);
      g.activeTexture(g.TEXTURE0);
      g.bindTexture(g.TEXTURE_2D, this.texture);
      g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, src);
      g.uniform1i(this.ul, 0);
      g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, this.ib);
      g.drawElements(g.TRIANGLES, 6, g.UNSIGNED_SHORT, 0);
      g.flush();
      // Beberapa GPU Android menyelesaikan draw WebGL sesudah frame berikutnya
      // sudah dikirim ke encoder. Mode ekspor menunggu GPU agar frame tidak
      // berubah menjadi hijau atau tertinggal beberapa detik.
      if (waitForGpu) g.finish();
    }
    dispose() {
      this.gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  }
  function solve(A, b) {
    const n = b.length,
      r = A.map((x, i) => [...x, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let i = c + 1; i < n; i++)
        if (Math.abs(r[i][c]) > Math.abs(r[p][c])) p = i;
      [r[c], r[p]] = [r[p], r[c]];
      const d = r[c][c];
      if (Math.abs(d) < 1e-10) throw Error("Perspektif gagal dihitung.");
      for (let j = c; j <= n; j++) r[c][j] /= d;
      for (let i = 0; i < n; i++) {
        if (i === c) continue;
        const f = r[i][c];
        for (let j = c; j <= n; j++) r[i][j] -= f * r[c][j];
      }
    }
    return r.map((x) => x[n]);
  }
  function homography(src, dst) {
    const A = [],
      b = [];
    for (let i = 0; i < 4; i++) {
      const { x, y } = src[i],
        X = dst[i].x,
        Y = dst[i].y;
      A.push([x, y, 1, 0, 0, 0, -X * x, -X * y]);
      b.push(X);
      A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]);
      b.push(Y);
    }
    return [...solve(A, b), 1];
  }
  function mapPoint(h, p) {
    const d = h[6] * p.x + h[7] * p.y + h[8];
    return {
      x: (h[0] * p.x + h[1] * p.y + h[2]) / d,
      y: (h[3] * p.x + h[4] * p.y + h[5]) / d,
    };
  }
  function photoTransform(width = W, height = H) {
    const iw = state.background?.naturalWidth || PHOTO.width,
      ih = state.background?.naturalHeight || PHOTO.height,
      s = Math.max(width / iw, height / ih),
      w = iw * s,
      h = ih * s;
    return {
      s,
      x: (width - w) / 2,
      y: (height - h) / 2,
      w,
      h,
    };
  }
  function defaultScreenQuad() {
    const t = photoTransform();
    return SCREEN_POINTS.map((p) => ({
      x: t.x + p.x * t.s,
      y: t.y + p.y * t.s,
    }));
  }
  function genericScreenQuad() {
    return [
      { x: W * 0.12, y: H * 0.34 },
      { x: W * 0.88, y: H * 0.34 },
      { x: W * 0.88, y: H * 0.67 },
      { x: W * 0.12, y: H * 0.67 },
    ];
  }
  function screenQuad() {
    return (state.screenQuad || defaultScreenQuad()).map((p) => ({
      x: p.x,
      y: p.y,
    }));
  }
  function loadStoredPins() {
    try {
      const q = JSON.parse(localStorage.getItem(PIN_STORAGE_KEY) || "null");
      return quadIsValid(q) ? q.map((p) => ({ x: +p.x, y: +p.y })) : null;
    } catch (e) {
      return null;
    }
  }
  function drawBackgroundTo(targetContext, width, height) {
    targetContext.fillStyle = "#17191b";
    targetContext.fillRect(0, 0, width, height);
    if (state.background) {
      const t = photoTransform(width, height);
      targetContext.drawImage(state.background, t.x, t.y, t.w, t.h);
    }
  }
  function drawBackground() {
    drawBackgroundTo(ctx, W, H);
  }
  function drawCoverTo(targetContext, targetWidth, targetHeight, src, iw, ih) {
    const sa = iw / ih,
      ta = targetWidth / targetHeight;
    let sx = 0,
      sy = 0,
      cw = iw,
      ch = ih;
    if (sa > ta) {
      cw = ih * ta;
      sx = (iw - cw) / 2;
    } else {
      ch = iw / ta;
      sy = (ih - ch) / 2;
    }
    typeof src.draw === "function"
      ? src.draw(targetContext, sx, sy, cw, ch, 0, 0, targetWidth, targetHeight)
      : targetContext.drawImage(
          src,
          sx,
          sy,
          cw,
          ch,
          0,
          0,
          targetWidth,
          targetHeight,
        );
  }
  function drawCover(src, iw, ih) {
    drawCoverTo(sctx, SW, SH, src, iw, ih);
  }
  function wrap(text, max, measureContext = sctx) {
    const out = [];
    for (const para of String(text || "")
      .replace(/\r/g, "")
      .split("\n")) {
      if (!para.trim()) {
        out.push("");
        continue;
      }
      let line = "";
      for (const word of para.trim().split(/\s+/)) {
        const test = line ? line + " " + word : word;
        if (line && measureContext.measureText(test).width > max) {
          out.push(line);
          line = word;
        } else line = test;
      }
      if (line) out.push(line);
    }
    return out;
  }
  function drawTextTo(targetContext, targetWidth, targetHeight) {
    const text = ui.text.value.trim();
    if (!text) return;
    const scale = targetWidth / SW,
      size = +ui.size.value * scale,
      max = (targetWidth * +ui.width.value) / 100,
      x = (targetWidth * +ui.x.value) / 100,
      y = (targetHeight * +ui.y.value) / 100;
    targetContext.save();
    targetContext.font = `900 ${size}px ${state.fontFamily}`;
    targetContext.textBaseline = "top";
    targetContext.textAlign = "left";
    targetContext.lineJoin = "round";
    targetContext.strokeStyle = "#000";
    targetContext.fillStyle = "#fff";
    targetContext.lineWidth = Math.max(5 * scale, size * 0.16);
    wrap(text, max, targetContext).forEach((line, i) => {
      targetContext.strokeText(line, x, y + i * size * 1.16);
      targetContext.fillText(line, x, y + i * size * 1.16);
    });
    targetContext.restore();
  }
  function setCaptionMode(mode, { quiet = false } = {}) {
    state.textMode = mode === "perspective" ? "perspective" : "flat";
    ui.captionModeButtons.forEach((button) => {
      const active = button.dataset.captionMode === state.textMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    ui.captionModeBadge.textContent =
      state.textMode === "perspective" ? "TEKS 3D" : "TEKS DATAR";
    resetFile();
    drawSoon();
    if (!quiet)
      toast(
        state.textMode === "perspective"
          ? "Tulisan sekarang mengikuti perspektif layar."
          : "Tulisan sekarang tetap datar.",
      );
  }
  function isLikelyGreenFrame(pixels, width, height) {
    if (!pixels?.length || !width || !height) return false;
    const columns = 18,
      rows = 12;
    let green = 0,
      sampled = 0;
    for (let row = 0; row < rows; row++) {
      const y = Math.min(height - 1, Math.floor(((row + 0.5) * height) / rows));
      for (let column = 0; column < columns; column++) {
        const x = Math.min(
            width - 1,
            Math.floor(((column + 0.5) * width) / columns),
          ),
          offset = (y * width + x) * 4,
          red = pixels[offset],
          value = pixels[offset + 1],
          blue = pixels[offset + 2];
        if (value > 135 && value > red * 1.65 && value > blue * 1.65) green++;
        sampled++;
      }
    }
    return sampled > 0 && green / sampled >= 0.9;
  }
  function compose(src, iw, ih) {
    drawBackground();
    const perspectiveText = state.textMode === "perspective";
    if (state.gl && (src || perspectiveText)) {
      sctx.fillStyle = "#000";
      sctx.fillRect(0, 0, SW, SH);
      if (src) drawCover(src, iw, ih);
      if (perspectiveText) drawTextTo(sctx, SW, SH);
      state.gl.render(screenCanvas, screenQuad());
      ctx.drawImage(state.gl.canvas, 0, 0, W, H);
    }
    if (!perspectiveText) drawTextTo(ctx, W, H);
  }
  function createExportComposer() {
    const canvas = document.createElement("canvas"),
      exportScreenCanvas = document.createElement("canvas");
    canvas.width = EXPORT_W;
    canvas.height = EXPORT_H;
    exportScreenCanvas.width = EXPORT_SW;
    exportScreenCanvas.height = EXPORT_SH;
    const outputContext = canvas.getContext("2d", {
        alpha: false,
        willReadFrequently: true,
      }),
      exportScreenContext = exportScreenCanvas.getContext("2d", {
        alpha: false,
        willReadFrequently: true,
      }),
      renderer = new PerspectiveRenderer(EXPORT_W, EXPORT_H),
      quad = screenQuad().map((point) => ({
        x: (point.x * EXPORT_W) / W,
        y: (point.y * EXPORT_H) / H,
      }));
    let lastGoodScreen = null,
      safeBlackScreen = null,
      repairedFrames = 0;
    function sampleFromPixels(media, pixels, timestamp, duration) {
      return new media.VideoSample(pixels, {
        format: "RGBA",
        codedWidth: EXPORT_W,
        codedHeight: EXPORT_H,
        timestamp,
        duration,
        colorSpace: {
          primaries: "bt709",
          transfer: "iec61966-2-1",
          matrix: "rgb",
          fullRange: true,
        },
      });
    }
    return {
      canvas,
      compose(src, iw, ih) {
        drawBackgroundTo(outputContext, EXPORT_W, EXPORT_H);
        exportScreenContext.fillStyle = "#000";
        exportScreenContext.fillRect(0, 0, EXPORT_SW, EXPORT_SH);
        if (!safeBlackScreen)
          safeBlackScreen = exportScreenContext.getImageData(
            0,
            0,
            EXPORT_SW,
            EXPORT_SH,
          );
        drawCoverTo(exportScreenContext, EXPORT_SW, EXPORT_SH, src, iw, ih);
        const screenFrame = exportScreenContext.getImageData(
          0,
          0,
          EXPORT_SW,
          EXPORT_SH,
        );
        if (isLikelyGreenFrame(screenFrame.data, EXPORT_SW, EXPORT_SH)) {
          exportScreenContext.putImageData(
            lastGoodScreen || safeBlackScreen,
            0,
            0,
          );
          repairedFrames++;
        } else lastGoodScreen = screenFrame;
        if (state.textMode === "perspective")
          drawTextTo(exportScreenContext, EXPORT_SW, EXPORT_SH);
        renderer.render(exportScreenCanvas, quad, true);
        outputContext.drawImage(renderer.canvas, 0, 0, EXPORT_W, EXPORT_H);
        if (state.textMode !== "perspective")
          drawTextTo(outputContext, EXPORT_W, EXPORT_H);
      },
      captureFrame(media, timestamp, duration) {
        // Salin hasil ke memori CPU sebelum masuk H.264. Ini menghindari bug
        // zero-copy canvas/GPU pada sejumlah Chrome Android yang menghasilkan
        // frame hijau dan frame yang terlambat.
        const pixels = outputContext.getImageData(
          0,
          0,
          EXPORT_W,
          EXPORT_H,
        ).data;
        return sampleFromPixels(media, pixels, timestamp, duration);
      },
      get repairedFrames() {
        return repairedFrames;
      },
      dispose() {
        renderer.dispose();
        canvas.width = 1;
        canvas.height = 1;
        exportScreenCanvas.width = 1;
        exportScreenCanvas.height = 1;
      },
    };
  }
  function loadImageSource(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(Error("Foto tidak dapat dimuat."));
      image.src = src;
    });
  }
  function revokeBackgroundObject() {
    if (state.backgroundObjectUrl) {
      URL.revokeObjectURL(state.backgroundObjectUrl);
      state.backgroundObjectUrl = "";
    }
  }
  async function applyBackgroundBuffer(
    buffer,
    name,
    type = "image/jpeg",
    { resetPins = true } = {},
  ) {
    const url = URL.createObjectURL(new Blob([buffer], { type }));
    let image;
    try {
      image = await loadImageSource(url);
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
    revokeBackgroundObject();
    state.backgroundObjectUrl = url;
    state.background = image;
    state.backgroundBuffer = buffer;
    state.backgroundType = type;
    state.backgroundName = name;
    ui.backgroundLabel.textContent = name.replace(/\.[^.]+$/, "");
    if (resetPins) {
      state.screenQuad = genericScreenQuad();
      state.pinsSaved = false;
      state.pinsDirty = true;
      setPinEditing(true, false);
      pinStatus(
        "Foto laptop diganti",
        "Atur empat pin agar video tepat berada di layar foto baru.",
      );
    }
    resetFile();
    updatePinOverlay();
    updateEmbedTransform();
    drawSoon();
  }
  async function handleBackgroundFile(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      toast("Foto harus berformat JPG, PNG, atau WebP.", true);
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      await applyBackgroundBuffer(buffer, file.name, file.type);
      toast("Foto laptop diganti. Sesuaikan empat pin layar.");
    } catch (error) {
      console.error(error);
      toast("Foto laptop tidak dapat dimuat.", true);
    } finally {
      ui.backgroundInput.value = "";
    }
  }
  function resetBackground(options = {}) {
    const quiet = options?.quiet === true;
    if (!state.defaultBackground) return;
    revokeBackgroundObject();
    state.background = state.defaultBackground;
    state.backgroundBuffer = null;
    state.backgroundType = "";
    state.backgroundName = "";
    ui.backgroundLabel.textContent = "Foto bawaan";
    state.screenQuad = defaultScreenQuad();
    state.pinsSaved = false;
    state.pinsDirty = true;
    setPinEditing(false, false);
    resetFile();
    updatePinOverlay();
    updateEmbedTransform();
    drawSoon();
    if (!quiet) toast("Foto laptop bawaan dipakai kembali.");
  }
  function updateFontPresetButtons() {
    ui.fontPresetButtons.forEach((button) => {
      const active = button.dataset.fontPreset === state.fontPreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }
  function applyFontPreset(name, { quiet = false } = {}) {
    const preset = FONT_PRESETS[name] || FONT_PRESETS.arial;
    state.fontPreset = FONT_PRESETS[name] ? name : "arial";
    state.fontFamily = preset.family;
    state.customFontBuffer = null;
    state.customFontName = "";
    ui.fontLabel.textContent = preset.label;
    updateFontPresetButtons();
    resetFile();
    drawSoon();
    if (!quiet) toast(`Font ${preset.label} sudah diterapkan.`);
  }
  async function applyCustomFont(buffer, fileName) {
    if (!("FontFace" in window))
      throw Error("Browser tidak mendukung font khusus.");
    const family = `Tipe5Font_${Date.now()}`,
      fontFace = new FontFace(family, buffer);
    await fontFace.load();
    document.fonts.add(fontFace);
    state.fontFamily = `"${family}", ${DEFAULT_FONT_FAMILY}`;
    state.fontPreset = "custom";
    state.customFontBuffer = buffer;
    state.customFontName = fileName;
    ui.fontLabel.textContent = fileName.replace(/\.[^.]+$/, "");
    updateFontPresetButtons();
    resetFile();
    drawSoon();
  }
  async function handleFontFile(file) {
    if (!file) return;
    if (!/\.(ttf|otf|woff2?|woff)$/i.test(file.name)) {
      toast("Font harus berformat TTF, OTF, WOFF, atau WOFF2.", true);
      return;
    }
    try {
      await applyCustomFont(await file.arrayBuffer(), file.name);
      toast("Font baru sudah diterapkan.");
    } catch (error) {
      console.error(error);
      toast("Font tidak dapat dimuat oleh browser.", true);
    } finally {
      ui.fontInput.value = "";
    }
  }
  function resetFont() {
    applyFontPreset("arial");
  }
  function openAssetDatabase() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        resolve(null);
        return;
      }
      const request = indexedDB.open(ASSET_DB_NAME, 1);
      request.addEventListener("upgradeneeded", () => {
        if (!request.result.objectStoreNames.contains(ASSET_STORE_NAME))
          request.result.createObjectStore(ASSET_STORE_NAME, { keyPath: "id" });
      });
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
  }
  async function writeAssetRecord(record) {
    const database = await openAssetDatabase();
    if (!database) throw Error("Penyimpanan browser tidak tersedia.");
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(ASSET_STORE_NAME, "readwrite");
      transaction.objectStore(ASSET_STORE_NAME).put(record);
      transaction.addEventListener("complete", resolve);
      transaction.addEventListener("error", () => reject(transaction.error));
    });
    database.close();
  }
  async function readAssetRecord(id) {
    const database = await openAssetDatabase();
    if (!database) return null;
    const record = await new Promise((resolve, reject) => {
      const request = database
        .transaction(ASSET_STORE_NAME, "readonly")
        .objectStore(ASSET_STORE_NAME)
        .get(id);
      request.addEventListener("success", () =>
        resolve(request.result || null),
      );
      request.addEventListener("error", () => reject(request.error));
    });
    database.close();
    return record;
  }
  async function deleteAssetRecord(id) {
    const database = await openAssetDatabase();
    if (!database) return;
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(ASSET_STORE_NAME, "readwrite");
      transaction.objectStore(ASSET_STORE_NAME).delete(id);
      transaction.addEventListener("complete", resolve);
      transaction.addEventListener("error", () => reject(transaction.error));
    });
    database.close();
  }
  function currentTemplateSettings() {
    return {
      x: +ui.x.value,
      y: +ui.y.value,
      size: +ui.size.value,
      width: +ui.width.value,
      clipDuration: +ui.clipDuration.value,
      volume: +ui.volume.value,
      textMode: state.textMode,
      screenQuad: screenQuad(),
    };
  }
  function setControlValue(control, value) {
    if (!Number.isFinite(+value)) return;
    control.value = String(
      Math.max(+control.min, Math.min(+control.max, +value)),
    );
  }
  function updateTemplateStatus(saved, template = null) {
    if (!saved) {
      ui.templateStatus.textContent = "Belum ada template tersimpan.";
      ui.deleteTemplate.hidden = true;
      ui.useTemplate.disabled = true;
      return;
    }
    const parts = [template?.fontName || "Arial Bold"];
    if (template?.backgroundName) parts.push(template.backgroundName);
    ui.templateStatus.textContent = `Tersimpan · ${parts.join(" · ")}`;
    ui.deleteTemplate.hidden = false;
    ui.useTemplate.disabled = false;
  }
  async function saveTemplate() {
    const preset = FONT_PRESETS[state.fontPreset] || FONT_PRESETS.arial,
      fontName = state.customFontName || preset.label;
    const template = {
      version: 3,
      settings: currentTemplateSettings(),
      hasCustomFont: Boolean(state.customFontBuffer),
      fontPreset: state.fontPreset,
      fontName,
      hasBackground: Boolean(state.backgroundBuffer),
      backgroundName: state.backgroundName || "",
      backgroundType: state.backgroundType || "",
      savedAt: new Date().toISOString(),
    };
    try {
      if (state.customFontBuffer)
        await writeAssetRecord({
          id: "font",
          name: state.customFontName,
          buffer: state.customFontBuffer,
        });
      else await deleteAssetRecord("font");
      if (state.backgroundBuffer)
        await writeAssetRecord({
          id: "background",
          name: state.backgroundName,
          type: state.backgroundType,
          buffer: state.backgroundBuffer,
        });
      else await deleteAssetRecord("background");
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(template));
      navigator.storage?.persist?.().catch(() => {});
      updateTemplateStatus(true, template);
      toast("Template tersimpan. Tekan Gunakan template kapan saja.");
    } catch (error) {
      console.error(error);
      toast("Template tidak dapat disimpan oleh browser.", true);
    }
  }
  async function loadSavedTemplate({ announce = false } = {}) {
    let template;
    try {
      const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (!raw) {
        updateTemplateStatus(false);
        return false;
      }
      template = JSON.parse(raw);
      const settings = template.settings || {};
      setControlValue(ui.x, settings.x);
      setControlValue(ui.y, settings.y);
      setControlValue(ui.size, settings.size);
      setControlValue(ui.width, settings.width);
      setControlValue(ui.clipDuration, settings.clipDuration);
      setControlValue(ui.volume, settings.volume);
      setCaptionMode(settings.textMode || "flat", { quiet: true });
      if (template.hasCustomFont) {
        const record = await readAssetRecord("font");
        if (record?.buffer)
          await applyCustomFont(
            record.buffer,
            record.name || template.fontName || "Font tersimpan",
          );
        else applyFontPreset(template.fontPreset || "arial", { quiet: true });
      } else applyFontPreset(template.fontPreset || "arial", { quiet: true });
      if (template.hasBackground) {
        const record = await readAssetRecord("background");
        if (record?.buffer)
          await applyBackgroundBuffer(
            record.buffer,
            record.name || template.backgroundName || "Foto tersimpan",
            record.type || template.backgroundType || "image/jpeg",
            { resetPins: false },
          );
        else resetBackground({ quiet: true });
      } else resetBackground({ quiet: true });
      if (quadIsValid(settings.screenQuad)) {
        state.screenQuad = settings.screenQuad.map((point) => ({
          x: +point.x,
          y: +point.y,
        }));
        state.pinsSaved = true;
        state.pinsDirty = false;
      }
      [ui.x, ui.y, ui.size, ui.width, ui.clipDuration, ui.volume].forEach(
        fillRange,
      );
      updateDuration({ quiet: true });
      updateVolume({ quiet: true });
      updateText();
      updatePinOverlay();
      updateTemplateStatus(true, template);
      if (announce) toast("Template tersimpan sudah diterapkan.");
      return true;
    } catch (error) {
      console.warn("Template Tipe 5 gagal dimuat", error);
      updateTemplateStatus(false);
      return false;
    }
  }
  async function useSavedTemplate() {
    await loadSavedTemplate({ announce: true });
  }
  async function deleteTemplate() {
    try {
      localStorage.removeItem(TEMPLATE_STORAGE_KEY);
      await Promise.all([
        deleteAssetRecord("font"),
        deleteAssetRecord("background"),
      ]);
      updateTemplateStatus(false);
      toast("Template tersimpan telah dihapus.");
    } catch (error) {
      console.error(error);
      toast("Template tidak dapat dihapus.", true);
    }
  }
  function fmt(v) {
    let n = Math.max(0, Math.floor(+v || 0));
    return (
      String(Math.floor(n / 60)).padStart(2, "0") +
      ":" +
      String(n % 60).padStart(2, "0")
    );
  }
  function fillRange(i) {
    const a = +i.min || 0,
      b = +i.max || 100,
      v = +i.value || 0,
      p = b > a ? ((v - a) / (b - a)) * 100 : 0;
    i.style.setProperty("--range-fill", Math.max(0, Math.min(100, p)) + "%");
  }
  function toast(m, e = false) {
    clearTimeout(state.toastTimer);
    ui.toast.textContent = m;
    ui.toast.classList.toggle("error", e);
    ui.toast.classList.add("show");
    state.toastTimer = setTimeout(
      () => ui.toast.classList.remove("show"),
      4200,
    );
  }
  function sourceStatus(element, baseClass, message, kind = "") {
    element.className = baseClass + (kind ? " " + kind : "");
    element.querySelector("span:last-child").textContent = message;
  }
  function status(message, kind = "") {
    sourceStatus(ui.status, "youtube-status", message, kind);
  }
  function driveStatus(message, kind = "") {
    sourceStatus(ui.driveStatus, "drive-status", message, kind);
  }
  function clipDuration() {
    const value = Math.round(+ui.clipDuration.value || DEFAULT_CLIP);
    return Math.max(MIN_CLIP, Math.min(MAX_CLIP, value));
  }
  function frameCount() {
    return Math.max(1, Math.round(clipDuration() * FPS));
  }
  function updateDuration({ quiet = false } = {}) {
    state.clipDuration = clipDuration();
    ui.clipDuration.value = String(state.clipDuration);
    ui.clipDurationOut.textContent = `${state.clipDuration} detik`;
    ui.clipDurationDisplay.textContent = fmt(state.clipDuration);
    ui.clipDurationSummary.textContent = `${state.clipDuration} detik`;
    ui.durationBadge.textContent = `${state.clipDuration} DETIK`;
    ui.preview.textContent = `▶ Preview potongan ${state.clipDuration} detik`;
    if (state.ready) {
      ui.range.max = Math.max(
        0,
        Math.floor(state.duration - state.clipDuration),
      );
      ui.range.disabled = state.duration < state.clipDuration;
    }
    fillRange(ui.clipDuration);
    updateClip();
    resetFile();
    updateButtons();
    if (!quiet && state.ready && state.duration < state.clipDuration)
      toast(
        `Video hanya ${fmt(state.duration)}. Pilih durasi yang lebih pendek.`,
        true,
      );
  }
  function updateVolume({ quiet = false } = {}) {
    const percent = Math.max(
      0,
      Math.min(100, Math.round(+ui.volume.value || 0)),
    );
    ui.volume.value = String(percent);
    ui.volumeOut.textContent = percent + "%";
    state.audioGain = percent / 100;
    ui.video.volume = state.audioGain;
    fillRange(ui.volume);
    updateClip();
    resetFile();
    if (!quiet)
      toast(
        percent === 0 ? "Suara hasil dimatikan." : `Volume hasil ${percent}%.`,
      );
  }
  function selectedStart(sync = true) {
    const clip = clipDuration();
    let t = Math.max(
      0,
      Math.floor(+ui.min.value || 0) * 60 + Math.floor(+ui.sec.value || 0),
    );
    if (state.ready)
      t = Math.min(t, Math.max(0, Math.floor(state.duration - clip)));
    if (sync) {
      ui.min.value = Math.floor(t / 60);
      ui.sec.value = t % 60;
      if (state.ready) ui.range.value = Math.min(t, +ui.range.max);
    }
    return t;
  }
  function updateClip() {
    const s = selectedStart(),
      clip = clipDuration();
    ui.rangeOut.textContent = fmt(s);
    ui.clipLabel.textContent = fmt(s) + " → " + fmt(s + clip);
    ui.end.textContent = fmt(s + clip);
    if (state.ready)
      ui.exportSummary.textContent =
        fmt(s) +
        " → " +
        fmt(s + clip) +
        ` · ${Math.round(state.audioGain * 100)}% suara · Full HD 1080p`;
    fillRange(ui.range);
    drawSoon();
  }
  function updateButtons() {
    const d = !state.ready || state.duration < clipDuration() || !!state.output;
    ui.generate.disabled = d;
    ui.mobileGenerate.disabled = d;
    ui.play.disabled = !state.ready;
    ui.share.hidden = !state.lastFile;
    ui.mobileShare.hidden = !state.lastFile;
  }
  function resetFile() {
    state.lastFile = null;
    updateButtons();
  }
  function updateText() {
    ui.xOut.textContent = ui.x.value + "%";
    ui.yOut.textContent = ui.y.value + "%";
    ui.sizeOut.textContent = ui.size.value + " px";
    ui.widthOut.textContent = ui.width.value + "%";
    [ui.x, ui.y, ui.size, ui.width].forEach(fillRange);
    resetFile();
    drawSoon();
  }
  function updateTimeline() {
    const clip = clipDuration(),
      s = selectedStart(false),
      e = state.ready
        ? Math.max(0, Math.min(clip, ui.video.currentTime - s))
        : 0;
    ui.current.textContent = fmt(s + e);
    ui.timeline.style.width = (e / clip) * 100 + "%";
    const p = state.ready && !ui.video.paused;
    ui.play.textContent = p ? "❚❚" : "▶";
    ui.mobilePreview.textContent = p ? "❚❚ Jeda" : "▶ Preview";
  }
  function drawPreview() {
    try {
      state.ready && ui.video.readyState >= 2
        ? compose(ui.video, ui.video.videoWidth, ui.video.videoHeight)
        : drawBackground();
      state.drawError = false;
    } catch (e) {
      if (!state.drawError) {
        state.drawError = true;
        if (state.sourceKind === "drive")
          driveStatus(
            "Link Drive diblokir browser. Pilih file langsung dari Drive / HP.",
            "error",
          );
        else
          status(
            "Sumber diblokir browser. Gunakan Google Drive atau pilih file.",
            "warning",
          );
        toast("Pilih file dari Google Drive / HP agar bisa diekspor.", true);
      }
    }
    updateTimeline();
  }
  function drawSoon() {
    cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(drawPreview);
  }
  function previewLoop() {
    cancelAnimationFrame(state.raf);
    const tick = () => {
      drawPreview();
      if (state.ready && !ui.video.paused)
        state.raf = requestAnimationFrame(tick);
    };
    state.raf = requestAnimationFrame(tick);
  }
  function youtubeId(v) {
    const raw = String(v || "").trim();
    if (/^[\w-]{11}$/.test(raw)) return raw;
    try {
      const u = new URL(raw.startsWith("http") ? raw : "https:" + "//" + raw),
        host = u.hostname.replace(/^www\./, "");
      if (host === "youtu.be") {
        const id = u.pathname.split("/").filter(Boolean)[0];
        return /^[\w-]{11}$/.test(id || "") ? id : "";
      }
      if (host.endsWith("youtube.com")) {
        const q = u.searchParams.get("v");
        if (/^[\w-]{11}$/.test(q || "")) return q;
        const p = u.pathname.split("/").filter(Boolean),
          i = p.findIndex((x) => ["shorts", "embed", "live"].includes(x)),
          id = i >= 0 ? p[i + 1] : "";
        return /^[\w-]{11}$/.test(id || "") ? id : "";
      }
    } catch (e) {}
    return "";
  }
  function googleDriveId(value) {
    const raw = String(value || "").trim();
    if (/^[\w-]{15,}$/.test(raw)) return raw;
    try {
      const url = new URL(raw),
        host = url.hostname.toLowerCase();
      if (
        host !== "drive.google.com" &&
        host !== "drive.usercontent.google.com" &&
        !host.endsWith(".googleusercontent.com")
      )
        return "";
      const queryId = url.searchParams.get("id");
      if (/^[\w-]{15,}$/.test(queryId || "")) return queryId;
      const match = url.pathname.match(/\/(?:file\/d|d)\/([\w-]{15,})/i);
      return match?.[1] || "";
    } catch (error) {
      return "";
    }
  }
  function googleDriveCandidates(value) {
    const raw = String(value || "").trim(),
      id = googleDriveId(raw);
    if (!id) return [];
    let resourceKey = "";
    try {
      resourceKey = new URL(raw).searchParams.get("resourcekey") || "";
    } catch (error) {}
    const key = resourceKey
        ? "&resourcekey=" + encodeURIComponent(resourceKey)
        : "",
      encodedId = encodeURIComponent(id),
      candidates = [];
    if (/^https:\/\/drive\.usercontent\.google\.com\//i.test(raw))
      candidates.push(raw);
    candidates.push(
      `https://drive.usercontent.google.com/download?id=${encodedId}&export=download&confirm=t${key}`,
      `https://drive.google.com/uc?export=download&id=${encodedId}&confirm=t${key}`,
    );
    return [...new Set(candidates)];
  }
  async function probeRemoteVideo(url, timeout = 6500) {
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          Accept: "video/*,application/octet-stream;q=0.9,*/*;q=0.1",
          Range: "bytes=0-1",
        },
      });
      if (!response.ok) throw Error("HTTP " + response.status);
      const type = (response.headers.get("content-type") || "").toLowerCase();
      if (type.includes("text/html"))
        throw Error("Drive mengembalikan halaman izin, bukan video.");
      response.body?.cancel?.().catch?.(() => {});
      return response.url || url;
    } finally {
      clearTimeout(timer);
    }
  }
  async function fetchJson(url, signal) {
    const c = new AbortController(),
      timer = setTimeout(() => c.abort(), 6000),
      abort = () => c.abort();
    signal.addEventListener("abort", abort, { once: true });
    try {
      const r = await fetch(url, {
        signal: c.signal,
        headers: { Accept: "application/json" },
      });
      if (!r.ok) throw Error("HTTP " + r.status);
      return await r.json();
    } finally {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
    }
  }
  function score(s) {
    const d = (
        (s.mimeType || "") +
        " " +
        (s.codec || "") +
        " " +
        (s.format || "")
      ).toLowerCase(),
      q = parseInt(s.quality || s.qualityLabel || 0) || 0;
    return (
      (s.videoOnly === true ? -1e6 : 0) +
      (/mp4|mpeg_4/.test(d) ? 2e4 : 0) +
      (/avc|h264/.test(d) ? 1e4 : 0) +
      (q <= 720 ? q : 720 - Math.max(0, q - 720))
    );
  }
  async function resolveFromPiped(base, id, signal) {
    const d = await fetchJson(
        base + "/streams/" + encodeURIComponent(id),
        signal,
      ),
      s = (d.videoStreams || [])
        .filter((x) => x && x.url && x.videoOnly !== true)
        .sort((a, b) => score(b) - score(a))[0];
    if (!s) throw Error("Stream gabungan tidak tersedia");
    return {
      url: s.url,
      title: d.title || "Video YouTube",
      duration: +d.duration || 0,
      quality: s.quality || s.qualityLabel || "otomatis",
      resolver: base,
    };
  }
  async function resolveYoutube(id, signal) {
    const batchSize = 5,
      batchTotal = Math.ceil(PIPED.length / batchSize);
    for (let index = 0; index < PIPED.length; index += batchSize) {
      if (signal.aborted) throw new DOMException("Dibatalkan", "AbortError");
      const batch = PIPED.slice(index, index + batchSize),
        batchNumber = Math.floor(index / batchSize) + 1;
      status(
        `Mencari sumber YouTube aman ${batchNumber}/${batchTotal}…`,
        "loading",
      );
      try {
        return await Promise.any(
          batch.map((base) => resolveFromPiped(base, id, signal)),
        );
      } catch (e) {
        if (signal.aborted) throw new DOMException("Dibatalkan", "AbortError");
      }
    }
    throw Error(
      "Semua sumber YouTube sedang dibatasi. Coba lagi atau pilih file video cadangan.",
    );
  }
  function clearEmbed() {
    clearTimeout(state.embedTimer);
    state.embedTimer = 0;
    ui.embedLayer.hidden = true;
    ui.embed.src = "about:blank";
  }
  function updateEmbedTransform() {
    if (ui.embedLayer.hidden) return;
    const r = ui.stage.getBoundingClientRect(),
      dst = screenQuad().map((p) => ({
        x: (p.x * r.width) / W,
        y: (p.y * r.height) / H,
      })),
      src = [
        { x: 0, y: 0 },
        { x: 1280, y: 0 },
        { x: 1280, y: 720 },
        { x: 0, y: 720 },
      ],
      h = homography(src, dst);
    ui.embedLayer.style.transform = `matrix3d(${h[0]},${h[3]},0,${h[6]},${h[1]},${h[4]},0,${h[7]},0,0,1,0,${h[2]},${h[5]},0,${h[8]})`;
  }
  function showEmbed(id, start, loop = true) {
    clearTimeout(state.embedTimer);
    const p = new URLSearchParams({
        autoplay: "1",
        mute: "1",
        controls: "1",
        playsinline: "1",
        rel: "0",
        start: String(Math.floor(start)),
      }),
      webOrigin = /^https?:$/.test(location.protocol) ? location.origin : "";
    if (webOrigin) p.set("origin", webOrigin);
    ui.embed.src =
      "https:" +
      "//www.youtube-nocookie.com/embed/" +
      encodeURIComponent(id) +
      "?" +
      p;
    ui.embedLayer.hidden = false;
    ui.stageMessage.hidden = true;
    requestAnimationFrame(updateEmbedTransform);
    if (loop)
      state.embedTimer = setTimeout(() => {
        if (!ui.embedLayer.hidden && state.youtubeId === id)
          showEmbed(id, start, true);
      }, clipDuration() * 1000);
  }
  function revokeObject() {
    if (state.objectUrl) {
      URL.revokeObjectURL(state.objectUrl);
      state.objectUrl = "";
    }
  }
  function resetSource(keep = false) {
    state.abort?.abort();
    state.abort = null;
    ui.video.pause();
    ui.video.removeAttribute("src");
    ui.video.load();
    revokeObject();
    state.file = null;
    state.url = "";
    state.sourceKind = "";
    state.duration = 0;
    state.ready = false;
    state.drawError = false;
    if (!keep) {
      state.youtubeId = "";
      clearEmbed();
    }
    ui.range.disabled = true;
    ui.range.max = 0;
    ui.range.value = 0;
    ui.stageMessage.hidden = keep && !!state.youtubeId;
    resetFile();
    updateButtons();
    drawSoon();
  }
  function waitMedia(ev, timeout = 18000) {
    return new Promise((res, rej) => {
      let done = false;
      const finish = (e) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          ui.video.removeEventListener(ev, ok);
          ui.video.removeEventListener("error", bad);
          e ? rej(e) : res();
        },
        ok = () => finish(),
        bad = () => finish(Error("Sumber video tidak dapat diputar.")),
        timer = setTimeout(
          () => finish(Error("Video terlalu lama dimuat.")),
          timeout,
        );
      ui.video.addEventListener(ev, ok, { once: true });
      ui.video.addEventListener("error", bad, { once: true });
    });
  }
  function seek(time) {
    return new Promise((res, rej) => {
      const target = Math.max(
        0,
        Math.min(+time || 0, Math.max(0, ui.video.duration - 0.05)),
      );
      if (Math.abs(ui.video.currentTime - target) < 0.04) {
        res();
        return;
      }
      let done = false;
      const finish = (e) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          ui.video.removeEventListener("seeked", ok);
          ui.video.removeEventListener("error", bad);
          e ? rej(e) : res();
        },
        ok = () => finish(),
        bad = () => finish(Error("Gagal menuju waktu terpilih.")),
        timer = setTimeout(
          () => finish(Error("Waktu video gagal dipilih.")),
          5000,
        );
      ui.video.addEventListener("seeked", ok, { once: true });
      ui.video.addEventListener("error", bad, { once: true });
      ui.video.currentTime = target;
    });
  }
  async function loadVideoSource(src, expected = 0, timeout = 18000) {
    ui.video.pause();
    ui.video.crossOrigin = "anonymous";
    ui.video.src = src;
    ui.video.load();
    await waitMedia("loadedmetadata", timeout);
    if (ui.video.readyState < 2) await waitMedia("loadeddata", timeout);
    const d = Number.isFinite(ui.video.duration)
      ? ui.video.duration
      : +expected || 0;
    const clip = clipDuration();
    if (d < clip)
      throw Error(
        "Video hanya " + fmt(d) + `. Dibutuhkan minimal ${clip} detik.`,
      );
    state.duration = d;
    state.ready = true;
    clearEmbed();
    ui.range.max = Math.max(0, Math.floor(d - clip));
    ui.range.disabled = false;
    selectedStart();
    updateClip();
    updateButtons();
    await seek(selectedStart());
    drawPreview();
  }
  async function loadYoutube() {
    const id = youtubeId(ui.url.value);
    if (!id) {
      status("Link YouTube tidak dikenali.", "error");
      toast("Masukkan link YouTube yang valid.", true);
      return;
    }
    resetSource(true);
    state.youtubeId = id;
    state.sourceKind = "youtube-preview";
    ui.drivePanel.classList.remove("attention");
    showEmbed(id, selectedStart());
    status("Preview YouTube dibuka. Mencari sumber ekspor…", "loading");
    ui.load.disabled = true;
    const c = new AbortController();
    state.abort = c;
    try {
      const m = await resolveYoutube(id, c.signal);
      state.url = m.url;
      state.sourceKind = "youtube";
      await loadVideoSource(m.url, m.duration);
      status(
        m.title + " · " + m.quality + ` · siap ${clipDuration()} detik.`,
        "ready",
      );
      toast("Video YouTube sudah menyatu dengan layar laptop.");
    } catch (e) {
      if (e.name !== "AbortError") {
        state.url = "";
        state.ready = false;
        state.sourceKind = "youtube-preview";
        showEmbed(id, selectedStart());
        ui.drivePanel.classList.add("attention");
        status(
          "Preview YouTube aktif. Untuk ekspor, gunakan Google Drive atau pilih file.",
          "warning",
        );
        driveStatus(
          "Tambahkan link Drive publik atau pilih file dari Drive / HP.",
          "warning",
        );
        toast(
          "Preview YouTube tetap aktif. Tambahkan sumber ekspor dari Google Drive.",
        );
      }
    } finally {
      if (state.abort === c) state.abort = null;
      ui.load.disabled = false;
      updateButtons();
    }
  }
  async function loadGoogleDrive() {
    const candidates = googleDriveCandidates(ui.driveUrl.value);
    if (!candidates.length) {
      driveStatus("Link Google Drive tidak dikenali.", "error");
      toast("Masukkan link file video Google Drive yang valid.", true);
      return;
    }
    const keepYoutube = Boolean(state.youtubeId);
    resetSource(keepYoutube);
    state.sourceKind = "drive";
    ui.driveLoad.disabled = true;
    ui.drivePanel.classList.remove("attention");
    driveStatus("Memeriksa akses file Google Drive…", "loading");
    let lastError = null;
    try {
      for (let index = 0; index < candidates.length; index++) {
        try {
          driveStatus(
            `Membuka sumber Drive ${index + 1}/${candidates.length}…`,
            "loading",
          );
          const directUrl = await probeRemoteVideo(candidates[index]);
          state.url = directUrl;
          await loadVideoSource(directUrl, 0, 10000);
          state.sourceKind = "drive";
          driveStatus("Google Drive siap untuk preview dan ekspor.", "ready");
          status("Sumber ekspor Google Drive siap.", "ready");
          toast("Video Google Drive sudah dimuat.");
          return;
        } catch (error) {
          lastError = error;
          ui.video.pause();
          ui.video.removeAttribute("src");
          ui.video.load();
          state.url = "";
          state.ready = false;
        }
      }
      throw lastError || Error("Google Drive tidak dapat dibuka.");
    } catch (error) {
      console.warn("Google Drive diblokir", error);
      state.url = "";
      state.ready = false;
      state.sourceKind = "";
      if (state.youtubeId) showEmbed(state.youtubeId, selectedStart());
      ui.drivePanel.classList.add("attention");
      driveStatus(
        "Link Drive diblokir browser. Tekan “Pilih dari Google Drive / HP”.",
        "error",
      );
      toast(
        "Pilih file melalui tombol Drive / HP agar ekspor pasti berjalan.",
        true,
      );
      updateButtons();
    } finally {
      ui.driveLoad.disabled = false;
    }
  }
  async function loadFallback(file) {
    if (
      !file ||
      (!file.type.startsWith("video/") &&
        !/\.(mp4|webm|mov|m4v)$/i.test(file.name || ""))
    ) {
      toast("Pilih file video yang valid.", true);
      return;
    }
    resetSource(!!state.youtubeId);
    state.file = file;
    state.sourceKind = "file";
    state.objectUrl = URL.createObjectURL(file);
    driveStatus("Membuka " + file.name + "…", "loading");
    try {
      await loadVideoSource(state.objectUrl);
      state.sourceKind = "file";
      driveStatus(
        file.name + ` · siap dipotong ${clipDuration()} detik.`,
        "ready",
      );
      status("Sumber file siap untuk ekspor.", "ready");
      ui.drivePanel.classList.remove("attention");
      toast("Video dari Google Drive / HP sudah siap.");
    } catch (e) {
      resetSource(!!state.youtubeId);
      driveStatus(e.message, "error");
      toast(e.message, true);
    }
  }
  function quadIsValid(q) {
    if (
      !Array.isArray(q) ||
      q.length !== 4 ||
      q.some((p) => !p || !Number.isFinite(+p.x) || !Number.isFinite(+p.y))
    )
      return false;
    for (let i = 0; i < 4; i++) {
      const a = q[i],
        b = q[(i + 1) % 4];
      if (Math.hypot(a.x - b.x, a.y - b.y) < 28) return false;
    }
    const c = [];
    for (let i = 0; i < 4; i++) {
      const a = q[i],
        b = q[(i + 1) % 4],
        d = q[(i + 2) % 4];
      c.push((b.x - a.x) * (d.y - b.y) - (b.y - a.y) * (d.x - b.x));
    }
    return c.every((v) => v > 350) || c.every((v) => v < -350);
  }
  function pinStatus(title, detail, kind = "") {
    if (!ui.pinStatus) return;
    ui.pinStatus.className = "corner-pin-status" + (kind ? " " + kind : "");
    ui.pinStatus.innerHTML = "<strong></strong><span></span>";
    ui.pinStatus.querySelector("strong").textContent = title;
    ui.pinStatus.querySelector("span").textContent = detail;
  }
  function updatePinOverlay() {
    if (!ui.pinLayer || !ui.pinPolygon) return;
    const q = screenQuad();
    ui.pinPolygon.setAttribute(
      "points",
      q.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
    );
    ui.pinButtons.forEach((b, i) => {
      b.style.left = (q[i].x / W) * 100 + "%";
      b.style.top = (q[i].y / H) * 100 + "%";
      b.title = `Pin ${i + 1}: ${PIN_NAMES[i]}`;
    });
  }
  function persistPins(message = "Posisi pin disimpan") {
    try {
      localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(screenQuad()));
      state.pinsDirty = false;
      state.pinsSaved = true;
      pinStatus(
        message,
        "Akan dipakai otomatis pada ekspor berikutnya.",
        "saved",
      );
      ui.perspectiveBadge.textContent = "PIN 3D: TERSIMPAN";
      ui.perspectiveBadge.classList.add("saved");
    } catch (e) {
      pinStatus(
        "Tidak dapat menyimpan",
        "Browser memblokir penyimpanan lokal.",
        "invalid",
      );
    }
  }
  function setPinEditing(on, scroll = true) {
    state.pinEditing = !!on;
    ui.pinLayer.hidden = !state.pinEditing;
    ui.stage.classList.toggle("pin-editing", state.pinEditing);
    ui.togglePins.textContent = state.pinEditing
      ? "✓ Selesai mengatur pin"
      : "✦ Aktifkan 4 pin sudut";
    ui.pinBadge.textContent = state.pinEditing ? "PIN ON" : "PIN OFF";
    ui.pinBadge.classList.toggle("active", state.pinEditing);
    ui.perspectiveBadge.textContent = state.pinEditing
      ? "PIN 3D: EDIT"
      : state.pinsSaved
        ? "PIN 3D: TERSIMPAN"
        : "PIN 3D: OTOMATIS";
    ui.perspectiveBadge.classList.toggle("editing", state.pinEditing);
    ui.perspectiveBadge.classList.toggle(
      "saved",
      !state.pinEditing && state.pinsSaved,
    );
    if (state.pinEditing) {
      ui.stageMessage.hidden = true;
      pinStatus(
        "Mode pin aktif",
        "Seret pin 1, 2, 3, dan 4 ke empat sudut layar laptop.",
      );
      requestAnimationFrame(() => {
        updatePinOverlay();
        if (scroll)
          ui.stage.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } else {
      if (!state.ready && ui.embedLayer.hidden) ui.stageMessage.hidden = false;
      pinStatus(
        state.pinsSaved ? "Posisi tersimpan" : "Mode pin selesai",
        state.pinsSaved
          ? "Perspektif ini dipakai untuk preview dan ekspor."
          : "Tekan Simpan posisi agar pengaturan tidak hilang.",
        state.pinsSaved ? "saved" : "",
      );
    }
  }
  function setScreenQuad(points, { persist = false } = {}) {
    const q = points.map((p) => ({
      x: Math.max(0, Math.min(W, +p.x)),
      y: Math.max(0, Math.min(H, +p.y)),
    }));
    if (!quadIsValid(q)) return false;
    state.screenQuad = q;
    state.pinsDirty = !persist;
    resetFile();
    updatePinOverlay();
    updateEmbedTransform();
    drawSoon();
    if (persist) persistPins();
    return true;
  }
  function resetCornerPins() {
    state.screenQuad = defaultScreenQuad();
    state.pinsSaved = false;
    state.pinsDirty = true;
    updatePinOverlay();
    updateEmbedTransform();
    drawSoon();
    persistPins("Posisi pin dikembalikan");
    pinStatus(
      "Kembali ke posisi otomatis",
      "Seret pin lagi jika belum tepat dengan bezel laptop.",
      "saved",
    );
  }
  function pinPointerMove(e) {
    if (state.activePin < 0 || !state.pinEditing) return;
    e.preventDefault();
    const r = ui.stage.getBoundingClientRect(),
      q = screenQuad(),
      candidate = q.map((p) => ({ ...p }));
    candidate[state.activePin] = {
      x: Math.max(0, Math.min(W, ((e.clientX - r.left) / r.width) * W)),
      y: Math.max(0, Math.min(H, ((e.clientY - r.top) / r.height) * H)),
    };
    if (!quadIsValid(candidate)) {
      pinStatus(
        "Posisi tidak valid",
        "Pin tidak boleh menyilang atau menumpuk.",
        "invalid",
      );
      return;
    }
    state.screenQuad = candidate;
    state.pinsDirty = true;
    state.pinsSaved = false;
    ui.perspectiveBadge.textContent = `PIN ${state.activePin + 1}: ${Math.round(candidate[state.activePin].x)}, ${Math.round(candidate[state.activePin].y)}`;
    updatePinOverlay();
    updateEmbedTransform();
    drawSoon();
  }
  function pinPointerEnd(e) {
    if (state.activePin < 0) return;
    const b = ui.pinButtons[state.activePin];
    try {
      if (state.pinPointerId !== null)
        b.releasePointerCapture?.(state.pinPointerId);
    } catch (x) {}
    b.classList.remove("dragging");
    state.activePin = -1;
    state.pinPointerId = null;
    ui.stage.classList.remove("pin-dragging");
    persistPins();
  }
  async function previewSelected() {
    if (!state.ready) {
      if (state.youtubeId) showEmbed(state.youtubeId, selectedStart());
      else toast("Masukkan video terlebih dahulu.", true);
      return;
    }
    clearEmbed();
    await seek(selectedStart());
    try {
      await ui.video.play();
      previewLoop();
    } catch (e) {
      toast("Ketuk preview sekali lagi untuk memutar.", true);
    }
  }
  function togglePreview() {
    if (!state.ready) {
      previewSelected();
      return;
    }
    ui.video.paused ? previewSelected() : ui.video.pause();
  }
  function pointerMove(e) {
    if (!state.ready) return;
    const r = ui.canvas.getBoundingClientRect(),
      p = {
        x: ((e.clientX - r.left) * W) / r.width,
        y: ((e.clientY - r.top) * H) / r.height,
      };
    let mapped = p,
      targetWidth = W,
      targetHeight = H;
    if (state.textMode === "perspective") {
      try {
        mapped = mapPoint(
          homography(screenQuad(), [
            { x: 0, y: 0 },
            { x: SW, y: 0 },
            { x: SW, y: SH },
            { x: 0, y: SH },
          ]),
          p,
        );
        targetWidth = SW;
        targetHeight = SH;
      } catch (error) {
        return;
      }
    }
    ui.x.value = Math.round(
      Math.max(+ui.x.min, Math.min(+ui.x.max, (mapped.x / targetWidth) * 100)),
    );
    ui.y.value = Math.round(
      Math.max(+ui.y.min, Math.min(+ui.y.max, (mapped.y / targetHeight) * 100)),
    );
    updateText();
  }
  function setProgress(done, total, title = "Menyusun frame MP4…") {
    const p = Math.max(
      0,
      Math.min(100, Math.round((done / Math.max(1, total)) * 100)),
    );
    ui.progressBar.style.width = p + "%";
    ui.progressPct.textContent = p + "%";
    ui.progressCount.textContent = done + " / " + total;
    ui.progressTitle.textContent = title;
  }
  function openProgress() {
    setProgress(0, frameCount());
    ui.progressDetail.textContent =
      "Mode stabil anti-green: setiap frame Full HD disalin aman sebelum dienkode.";
    ui.cancel.disabled = false;
    ui.cancel.textContent = "Batalkan";
    typeof ui.dialog.showModal === "function"
      ? ui.dialog.showModal()
      : ui.dialog.setAttribute("open", "");
  }
  function closeProgress() {
    ui.dialog.open && typeof ui.dialog.close === "function"
      ? ui.dialog.close()
      : ui.dialog.removeAttribute("open");
  }
  function bytesContain(bytes, text) {
    const q = new TextEncoder().encode(text);
    outer: for (let i = 0; i <= bytes.length - q.length; i++) {
      for (let j = 0; j < q.length; j++)
        if (bytes[i + j] !== q[j]) continue outer;
      return true;
    }
    return false;
  }
  function validateMp4(b) {
    if (!(b instanceof Uint8Array) || b.length < 32)
      throw Error("File MP4 kosong.");
    if (!bytesContain(b, "ftyp")) throw Error("Container hasil bukan MP4.");
    if (!bytesContain(b, "avc1")) throw Error("Codec H.264 tidak ditemukan.");
    if (!bytesContain(b, "mp4a")) throw Error("Audio AAC tidak ditemukan.");
  }
  function scaleAudioSample(sample, gain, media = window.Mediabunny) {
    const amount = Math.max(0, Math.min(1, Number(gain) || 0));
    if (amount === 1) return sample.clone();
    const frames = sample.numberOfFrames,
      channels = sample.numberOfChannels,
      data = new Float32Array(frames * channels),
      plane = new Float32Array(frames);
    for (let channel = 0; channel < channels; channel++) {
      sample.copyTo(plane, {
        planeIndex: channel,
        format: "f32-planar",
      });
      const offset = channel * frames;
      for (let index = 0; index < frames; index++)
        data[offset + index] = plane[index] * amount;
    }
    return new media.AudioSample({
      format: "f32-planar",
      sampleRate: sample.sampleRate,
      numberOfFrames: frames,
      numberOfChannels: channels,
      timestamp: sample.timestamp,
      data,
    });
  }
  async function chooseVideoAcceleration(media, config) {
    if (typeof media.canEncodeVideo !== "function") return "no-preference";
    for (const hardwareAcceleration of [
      "prefer-software",
      "no-preference",
      "prefer-hardware",
    ]) {
      try {
        if (
          await media.canEncodeVideo("avc", {
            ...config,
            hardwareAcceleration,
          })
        )
          return hardwareAcceleration;
      } catch (error) {}
    }
    return "";
  }
  async function requestWakeLock() {
    if (!navigator.wakeLock?.request || state.wakeLock) return;
    try {
      state.wakeLock = await navigator.wakeLock.request("screen");
      state.wakeLock.addEventListener?.("release", () => {
        state.wakeLock = null;
      });
    } catch (error) {
      state.wakeLock = null;
    }
  }
  async function releaseWakeLock() {
    const lock = state.wakeLock;
    state.wakeLock = null;
    try {
      await lock?.release?.();
    } catch (error) {}
  }
  function cleanupInput() {
    try {
      state.input?.dispose?.();
    } catch (e) {}
    state.input = null;
    state.output = null;
  }
  function fileName() {
    return (
      `tipe-5-laptop-1080p-stabil-${clipDuration()}-detik-` +
      new Date().toISOString().slice(0, 10) +
      ".mp4"
    );
  }
  async function generateVideo() {
    if (!state.ready) {
      toast("Video belum siap.", true);
      return;
    }
    const mb = window.Mediabunny;
    if (!mb) {
      toast("Mesin MP4 belum tersedia. Muat ulang halaman.", true);
      return;
    }
    state.cancelled = false;
    ui.video.pause();
    clearEmbed();
    resetFile();
    updateButtons();
    await requestWakeLock();
    openProgress();
    const clip = clipDuration(),
      frames = frameCount(),
      gain = state.audioGain;
    let videoSource = null,
      audioSource = null,
      videoSink = null,
      audioSink = null,
      exportComposer = null;
    try {
      if (!state.background)
        throw Error("Foto laptop belum siap. Tunggu sebentar lalu coba lagi.");
      const source = state.file
          ? new mb.BlobSource(state.file)
          : new mb.UrlSource(state.url),
        input = new mb.Input({ formats: mb.ALL_FORMATS, source });
      state.input = input;
      const duration = await input.computeDuration(),
        start = Math.min(selectedStart(false), Math.max(0, duration - clip));
      if (duration < clip)
        throw Error(`Video sumber kurang dari ${clip} detik.`);
      const vt = await input.getPrimaryVideoTrack();
      if (!vt) throw Error("Track video tidak ditemukan.");
      if (typeof vt.canDecode === "function" && !(await vt.canDecode()))
        throw Error("Codec video sumber tidak dapat dibaca browser.");
      const at = await input.getPrimaryAudioTrack();
      if (!at)
        throw Error(
          "Track audio tidak ditemukan. Pilih video yang memiliki suara.",
        );
      if (typeof at.canDecode === "function" && !(await at.canDecode()))
        throw Error("Codec audio sumber tidak dapat dibaca browser.");
      const baseVideoConfig = {
          width: EXPORT_W,
          height: EXPORT_H,
          bitrate: VIDEO_BITRATE,
          framerate: FPS,
          fullCodecString: AVC_CODEC,
        },
        hardwareAcceleration = await chooseVideoAcceleration(
          mb,
          baseVideoConfig,
        );
      if (!hardwareAcceleration)
        throw Error(
          "Perangkat ini belum mendukung encoder H.264 1080p yang stabil.",
        );
      let encodedPackets = 0,
        encodedKeyFrames = 0;
      const vc = { ...baseVideoConfig, hardwareAcceleration },
        ve = {
          codec: "avc",
          bitrate: VIDEO_BITRATE,
          fullCodecString: AVC_CODEC,
          keyFrameInterval: 1,
          bitrateMode: "variable",
          latencyMode: "realtime",
          hardwareAcceleration,
          contentHint: "motion",
          onEncodedPacket(packet) {
            encodedPackets++;
            if (packet.type === "key") encodedKeyFrames++;
          },
        };
      if (
        typeof mb.VideoSampleSink !== "function" ||
        typeof mb.VideoSampleSource !== "function" ||
        typeof mb.AudioSampleSink !== "function"
      )
        throw Error("Browser ini belum mendukung pemotongan stabil.");
      const ac = {
          sampleRate: 48000,
          numberOfChannels: 2,
          bitrate: AUDIO_BITRATE,
          fullCodecString: "mp4a.40.2",
        },
        ae = {
          codec: "aac",
          bitrate: AUDIO_BITRATE,
          fullCodecString: "mp4a.40.2",
          transform: { sampleRate: 48000, numberOfChannels: 2 },
        };
      if (
        typeof mb.canEncodeAudio === "function" &&
        !(await mb.canEncodeAudio("aac", ac))
      )
        throw Error("Encoder AAC tidak tersedia di browser ini.");
      const target = new mb.BufferTarget(),
        output = new mb.Output({
          format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }),
          target,
        });
      state.output = output;
      exportComposer = createExportComposer();
      videoSource = new mb.VideoSampleSource(ve);
      output.addVideoTrack(videoSource, { frameRate: FPS });
      audioSource = new mb.AudioSampleSource(ae);
      output.addAudioTrack(audioSource);
      await output.start();
      await document.fonts?.ready;
      videoSink = new mb.VideoSampleSink(vt);
      audioSink = new mb.AudioSampleSink(at);
      const times = Array.from({ length: frames }, (_, i) => start + i / FPS);
      let i = 0;
      for await (const sample of videoSink.samplesAtTimestamps(times)) {
        try {
          if (state.cancelled)
            throw new DOMException("Dibatalkan", "AbortError");
          exportComposer.compose(
            sample,
            sample.displayWidth || vt.displayWidth || EXPORT_W,
            sample.displayHeight || vt.displayHeight || EXPORT_H,
          );
          const stableFrame = exportComposer.captureFrame(mb, i / FPS, 1 / FPS);
          try {
            await videoSource.add(stableFrame);
          } finally {
            stableFrame.close();
          }
        } finally {
          sample?.close();
        }
        i++;
        if (i % 6 === 0 || i === frames) {
          setProgress(Math.min(i, frames), frames);
          await new Promise((r) => setTimeout(r, 0));
        }
        if (i >= frames) break;
      }
      if (i === 0) throw Error("Frame video tidak dapat dibaca untuk ekspor.");
      let recoveryFailures = 0;
      while (i < frames) {
        if (state.cancelled) throw new DOMException("Dibatalkan", "AbortError");
        let recoverySample = null;
        try {
          recoverySample = await videoSink.getSample(start + i / FPS);
          exportComposer.compose(
            recoverySample,
            recoverySample.displayWidth || vt.displayWidth || EXPORT_W,
            recoverySample.displayHeight || vt.displayHeight || EXPORT_H,
          );
        } catch (error) {
          recoveryFailures++;
          if (recoveryFailures > Math.ceil(FPS / 2))
            throw Error(
              "Decoder video berhenti terlalu lama. Ubah sumber ke MP4 H.264 lalu coba lagi.",
            );
        } finally {
          recoverySample?.close?.();
        }
        const stableFrame = exportComposer.captureFrame(mb, i / FPS, 1 / FPS);
        try {
          await videoSource.add(stableFrame);
        } finally {
          stableFrame.close();
        }
        i++;
        if (i % 6 === 0) setProgress(i, frames);
      }
      videoSource.close();
      setProgress(frames, frames, "Mengatur volume dan audio AAC…");
      for await (const sample of audioSink.samples(start, start + clip)) {
        if (state.cancelled) {
          sample.close();
          throw new DOMException("Dibatalkan", "AbortError");
        }
        let adjusted = null;
        try {
          adjusted = scaleAudioSample(sample, gain, mb);
          adjusted.setTimestamp(Math.max(0, sample.timestamp - start));
          await audioSource.add(adjusted);
        } finally {
          adjusted?.close?.();
          sample.close();
        }
      }
      audioSource.close();
      setProgress(frames, frames, "Finalisasi MP4 sosial…");
      await output.finalize();
      if (encodedPackets < frames - 2 || encodedKeyFrames < 1)
        throw Error(
          "Encoder melewatkan terlalu banyak frame. Coba tutup aplikasi lain lalu ulangi.",
        );
      const bytes =
        target.buffer instanceof Uint8Array
          ? target.buffer
          : new Uint8Array(target.buffer);
      validateMp4(bytes);
      const blob = new Blob([bytes], { type: "video/mp4" }),
        name = fileName(),
        a = document.createElement("a"),
        u = URL.createObjectURL(blob);
      a.href = u;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 3e4);
      state.lastFile = new File([blob], name, { type: "video/mp4" });
      toast(
        exportComposer.repairedFrames
          ? `MP4 stabil diunduh · ${exportComposer.repairedFrames} frame hijau diperbaiki.`
          : "MP4 Full HD stabil sudah diunduh tanpa frame hijau.",
      );
    } catch (e) {
      if (e.name === "AbortError") toast("Proses dibatalkan.");
      else {
        console.error(e);
        const message = /tainted|origin-clean|cross-origin/i.test(
          String(e?.message || e),
        )
          ? "Sumber lintas-origin diblokir. Muat ulang aplikasi lalu gunakan file video cadangan."
          : e.message || "Gagal membuat video.";
        toast(message, true);
      }
    } finally {
      try {
        videoSource?.close?.();
      } catch (e) {}
      try {
        audioSource?.close?.();
      } catch (e) {}
      try {
        exportComposer?.dispose?.();
      } catch (e) {}
      cleanupInput();
      await releaseWakeLock();
      state.cancelled = false;
      ui.cancel.disabled = false;
      ui.cancel.textContent = "Batalkan";
      closeProgress();
      updateButtons();
      drawSoon();
    }
  }
  async function shareVideo() {
    if (!state.lastFile) {
      toast("Buat MP4 terlebih dahulu.", true);
      return;
    }
    const data = {
      files: [state.lastFile],
      title: `Video laptop ${clipDuration()} detik`,
    };
    if (!navigator.canShare?.({ files: data.files })) {
      toast("Browser belum mendukung share file. Gunakan hasil unduhan.", true);
      return;
    }
    try {
      await navigator.share(data);
    } catch (e) {
      if (e.name !== "AbortError") toast("Gagal membuka menu berbagi.", true);
    }
  }
  ui.togglePins.addEventListener("click", () =>
    setPinEditing(!state.pinEditing),
  );
  ui.savePins.addEventListener("click", () => persistPins());
  ui.resetPins.addEventListener("click", resetCornerPins);
  ui.pinButtons.forEach((b, i) =>
    b.addEventListener("pointerdown", (e) => {
      if (!state.pinEditing) return;
      e.preventDefault();
      e.stopPropagation();
      state.activePin = i;
      state.pinPointerId = e.pointerId;
      b.classList.add("dragging");
      ui.stage.classList.add("pin-dragging");
      b.setPointerCapture?.(e.pointerId);
      pinStatus(`Menggeser pin ${i + 1}`, PIN_NAMES[i]);
    }),
  );
  window.addEventListener("pointermove", pinPointerMove, { passive: false });
  window.addEventListener("pointerup", pinPointerEnd);
  window.addEventListener("pointercancel", pinPointerEnd);
  ui.load.addEventListener("click", loadYoutube);
  ui.url.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      loadYoutube();
    }
  });
  ui.driveLoad.addEventListener("click", loadGoogleDrive);
  ui.driveUrl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      loadGoogleDrive();
    }
  });
  ui.fallback.addEventListener("change", () =>
    loadFallback(ui.fallback.files?.[0]),
  );
  ui.fontInput.addEventListener("change", () =>
    handleFontFile(ui.fontInput.files?.[0]),
  );
  ui.fontPresetButtons.forEach((button) =>
    button.addEventListener("click", () =>
      applyFontPreset(button.dataset.fontPreset),
    ),
  );
  ui.resetFont.addEventListener("click", resetFont);
  ui.backgroundInput.addEventListener("change", () =>
    handleBackgroundFile(ui.backgroundInput.files?.[0]),
  );
  ui.resetBackground.addEventListener("click", resetBackground);
  ui.saveTemplate.addEventListener("click", saveTemplate);
  ui.useTemplate.addEventListener("click", useSavedTemplate);
  ui.deleteTemplate.addEventListener("click", deleteTemplate);
  ui.captionModeButtons.forEach((button) =>
    button.addEventListener("click", () =>
      setCaptionMode(button.dataset.captionMode),
    ),
  );
  ui.clipDuration.addEventListener("input", () =>
    updateDuration({ quiet: true }),
  );
  ui.clipDuration.addEventListener("change", () => updateDuration());
  ui.volume.addEventListener("input", () => updateVolume({ quiet: true }));
  ui.volume.addEventListener("change", () => updateVolume());
  [ui.min, ui.sec].forEach((i) =>
    i.addEventListener("change", () => {
      ui.video.pause();
      clearEmbed();
      updateClip();
      if (state.ready)
        seek(selectedStart())
          .then(drawPreview)
          .catch(() => {});
    }),
  );
  ui.range.addEventListener("input", () => {
    const t = +ui.range.value;
    ui.min.value = Math.floor(t / 60);
    ui.sec.value = t % 60;
    ui.video.pause();
    updateClip();
  });
  ui.range.addEventListener("change", () =>
    seek(selectedStart())
      .then(drawPreview)
      .catch(() => {}),
  );
  [ui.text, ui.x, ui.y, ui.size, ui.width].forEach((i) =>
    i.addEventListener("input", updateText),
  );
  ui.preview.addEventListener("click", togglePreview);
  ui.play.addEventListener("click", togglePreview);
  ui.mobilePreview.addEventListener("click", togglePreview);
  ui.video.addEventListener("play", previewLoop);
  ui.video.addEventListener("pause", () => {
    cancelAnimationFrame(state.raf);
    drawPreview();
  });
  ui.video.addEventListener("timeupdate", () => {
    const s = selectedStart(false);
    if (ui.video.currentTime >= s + clipDuration() - 0.03) {
      ui.video.pause();
      seek(s)
        .then(drawPreview)
        .catch(() => {});
    } else updateTimeline();
  });
  ui.canvas.addEventListener("pointerdown", (e) => {
    if (!state.ready) return;
    state.dragging = true;
    ui.canvas.classList.add("dragging");
    ui.canvas.setPointerCapture?.(e.pointerId);
    pointerMove(e);
  });
  ui.canvas.addEventListener("pointermove", (e) => {
    if (state.dragging) pointerMove(e);
  });
  const stop = () => {
    state.dragging = false;
    ui.canvas.classList.remove("dragging");
  };
  ui.canvas.addEventListener("pointerup", stop);
  ui.canvas.addEventListener("pointercancel", stop);
  ui.generate.addEventListener("click", generateVideo);
  ui.mobileGenerate.addEventListener("click", generateVideo);
  ui.share.addEventListener("click", shareVideo);
  ui.mobileShare.addEventListener("click", shareVideo);
  ui.cancel.addEventListener("click", () => {
    state.cancelled = true;
    ui.cancel.disabled = true;
    ui.cancel.textContent = "Membatalkan…";
  });
  window.addEventListener("resize", () => {
    updatePinOverlay();
    updateEmbedTransform();
    drawSoon();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.output)
      requestWakeLock();
  });
  window.addEventListener("beforeunload", () => {
    state.abort?.abort();
    revokeObject();
    revokeBackgroundObject();
  });
  async function init() {
    const stored = loadStoredPins();
    state.screenQuad = stored || defaultScreenQuad();
    state.pinsSaved = !!stored;
    try {
      state.gl = new PerspectiveRenderer(W, H);
    } catch (e) {
      toast(e.message, true);
    }
    [
      ui.x,
      ui.y,
      ui.size,
      ui.width,
      ui.range,
      ui.clipDuration,
      ui.volume,
    ].forEach(fillRange);
    updateFontPresetButtons();
    setCaptionMode("flat", { quiet: true });
    updateDuration({ quiet: true });
    updateVolume({ quiet: true });
    updateText();
    updateButtons();
    ui.stageMessage.hidden = false;
    ui.end.textContent = fmt(DEFAULT_CLIP);
    try {
      const image = await loadImageSource(
        window.__TIPE5_BACKGROUND_DATA_URL__ || "assets/laptop-template.png",
      );
      state.defaultBackground = image;
      state.background = image;
      try {
        delete window.__TIPE5_BACKGROUND_DATA_URL__;
      } catch (e) {}
      await loadSavedTemplate();
      updatePinOverlay();
      drawPreview();
    } catch (error) {
      console.error(error);
      toast("Foto laptop tidak dapat dimuat.", true);
      drawPreview();
    }
    updatePinOverlay();
    pinStatus(
      state.pinsSaved ? "Posisi pin dimuat" : "Posisi awal otomatis",
      state.pinsSaved
        ? "Pengaturan layar tersimpan sudah diterapkan."
        : "Aktifkan 4 pin sudut jika video belum pas.",
      state.pinsSaved ? "saved" : "",
    );
  }
  window.__TIPE5_TEST__ = {
    youtubeId,
    googleDriveId,
    googleDriveCandidates,
    resolveYoutube,
    screenQuad,
    homography,
    mapPoint,
    compose,
    selectedStart,
    loadFallback,
    loadYoutube,
    loadGoogleDrive,
    generateVideo,
    shareVideo,
    state,
    setScreenQuad,
    defaultScreenQuad,
    quadIsValid,
    updatePinOverlay,
    setPinEditing,
    resetCornerPins,
    createExportComposer,
    genericScreenQuad,
    handleFontFile,
    handleBackgroundFile,
    resetFont,
    resetBackground,
    saveTemplate,
    useSavedTemplate,
    loadSavedTemplate,
    deleteTemplate,
    clipDuration,
    frameCount,
    updateDuration,
    updateVolume,
    setCaptionMode,
    applyFontPreset,
    scaleAudioSample,
    isLikelyGreenFrame,
    chooseVideoAcceleration,
    constants: {
      W,
      H,
      SW,
      SH,
      EXPORT_W,
      EXPORT_H,
      EXPORT_SW,
      EXPORT_SH,
      DEFAULT_CLIP,
      MIN_CLIP,
      MAX_CLIP,
      FPS,
      VIDEO_BITRATE,
      AUDIO_BITRATE,
      AVC_CODEC,
      SCREEN_POINTS,
    },
  };
  init();
})();
