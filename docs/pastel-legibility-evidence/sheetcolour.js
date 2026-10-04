// Colour maths for the sample sheet's live picker. Inlined into the page AND
// loaded by the build's self-check, which compares it against colorkit.mjs —
// so the numbers the page shows while you drag are the kit's numbers.
var SheetColour = (function () {
  function lin(l, c, h) {
    var r = (h * Math.PI) / 180, A = c * Math.cos(r), B = c * Math.sin(r);
    var l_ = Math.pow(l + 0.3963377774 * A + 0.2158037573 * B, 3);
    var m_ = Math.pow(l - 0.1055613458 * A - 0.0638541728 * B, 3);
    var s_ = Math.pow(l - 0.0894841775 * A - 1.291485548 * B, 3);
    return [4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_, -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_, -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_];
  }
  function inGamut(v) { var e = 1e-5; return v.every(function (x) { return x >= -e && x <= 1 + e; }); }
  function ch(x) { var v = Math.min(1, Math.max(0, x)); return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; }
  function oklchToHex(l, c, h) {
    var chroma = c;
    if (!inGamut(lin(l, chroma, h))) {
      var lo = 0, hi = c;
      for (var i = 0; i < 24; i++) { chroma = (lo + hi) / 2; if (inGamut(lin(l, chroma, h))) lo = chroma; else hi = chroma; }
      chroma = lo;
    }
    return "#" + lin(l, chroma, h).map(function (x) { return Math.round(ch(x) * 255).toString(16).padStart(2, "0"); }).join("");
  }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function apca(text, bg) {
    function Y(hex) { var c = rgb(hex); var y = 0.2126729 * Math.pow(c[0] / 255, 2.4) + 0.7151522 * Math.pow(c[1] / 255, 2.4) + 0.072175 * Math.pow(c[2] / 255, 2.4); return y > 0.022 ? y : y + Math.pow(0.022 - y, 1.414); }
    var yt = Y(text), yb = Y(bg), s;
    if (Math.abs(yb - yt) < 0.0005) return 0;
    if (yb > yt) { s = (Math.pow(yb, 0.56) - Math.pow(yt, 0.57)) * 1.14; return s < 0.1 ? 0 : (s - 0.027) * 100; }
    s = (Math.pow(yb, 0.65) - Math.pow(yt, 0.62)) * 1.14; return s > -0.1 ? 0 : (s + 0.027) * 100;
  }
  function lum(hex) { var c = rgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function wcag(a, b) { var la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
  // Machado, Oliveira & Fernandes 2009, severity 1.0, applied in linear RGB (same matrices as colorkit.mjs).
  var M = { protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
    tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]] };
  function toLin(hex) { return rgb(hex).map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); }
  function simulate(hex, kind) {
    var c = toLin(hex), m = M[kind];
    return "#" + m.map(function (r) { var x = Math.min(1, Math.max(0, r[0] * c[0] + r[1] * c[1] + r[2] * c[2])); return Math.round(ch(x) * 255).toString(16).padStart(2, "0"); }).join("");
  }
  // How colourful a hex really is (OKLab chroma): what the screen shows, which can be less than what was asked for.
  function chroma(hex) {
    var c = toLin(hex), l = Math.cbrt(0.4122214708 * c[0] + 0.5363325363 * c[1] + 0.0514459929 * c[2]), m = Math.cbrt(0.2119034982 * c[0] + 0.6806995451 * c[1] + 0.1073969566 * c[2]), s = Math.cbrt(0.0883024619 * c[0] + 0.2817188376 * c[1] + 0.6299787005 * c[2]);
    return Math.hypot(1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s);
  }
  return { oklchToHex: oklchToHex, apca: apca, wcag: wcag, simulate: simulate, chroma: chroma, KINDS: ["protan", "deutan", "tritan"] };
})();
if (typeof module !== "undefined") module.exports = SheetColour;
