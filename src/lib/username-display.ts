/**
 * Приводит ник к обычному начертанию: NFKC, без ZWSP, латиница/цифры из
 * Mathematical Alphanumeric Symbols и похожих блоков — к ASCII.
 * Исходная строка в API/URL не меняется — только отображение.
 */

/** Невидимые/форматирующие символы, часто вставляемые в ники. */
const INVISIBLE = /[\u200B\uFEFF\u200C\u200D]/g;

/** Script capital Latin — не подряд в Unicode. */
const SCRIPT_CAPITAL: Record<number, string> = {
  0x1d49c: "A",
  0x1d49e: "C",
  0x1d49f: "D",
  0x1d4a0: "G",
  0x1d4a1: "J",
  0x1d4a2: "K",
  0x1d4a3: "L",
  0x1d4a4: "M",
  0x1d4a5: "N",
  0x1d4a6: "O",
  0x1d4a7: "P",
  0x1d4a8: "Q",
  0x1d4a9: "R",
  0x1d4aa: "S",
  0x1d4ab: "T",
  0x1d4ac: "U",
  0x1d4ad: "V",
  0x1d4ae: "W",
  0x1d4af: "X",
  0x1d4b0: "Y",
  0x1d4b1: "Z",
  0x1d4b2: "E",
  0x1d4b3: "F",
  0x1d4b4: "H",
  0x1d4b5: "I",
};

/** Fraktur capital Latin — с пропусками в диапазоне. */
const FRAKTUR_CAPITAL: Record<number, string> = {
  0x1d504: "A",
  0x1d505: "B",
  0x1d506: "C",
  0x1d507: "D",
  0x1d508: "E",
  0x1d509: "F",
  0x1d50a: "G",
  0x1d50b: "H",
  0x1d50d: "J",
  0x1d50e: "K",
  0x1d50f: "L",
  0x1d510: "M",
  0x1d511: "N",
  0x1d512: "O",
  0x1d513: "P",
  0x1d514: "Q",
  0x1d516: "S",
  0x1d517: "T",
  0x1d518: "U",
  0x1d519: "V",
  0x1d51a: "W",
  0x1d51b: "X",
  0x1d51c: "Z",
};

/** Double-struck capital в блоке 1D538 — часть букв в Letterlike Symbols (ℂ, ℕ, …). */
const DOUBLE_STRUCK_CAPITAL: Record<number, string> = {
  0x1d538: "A",
  0x1d539: "B",
  0x1d53b: "D",
  0x1d53c: "E",
  0x1d53d: "F",
  0x1d53e: "G",
  0x1d540: "I",
  0x1d541: "J",
  0x1d542: "K",
  0x1d543: "L",
  0x1d544: "M",
  0x1d546: "O",
  0x1d54a: "S",
  0x1d54b: "T",
  0x1d54c: "U",
  0x1d54d: "V",
  0x1d54e: "W",
  0x1d54f: "X",
  0x1d550: "Y",
};

/** Double-struck capital в Letterlike Symbols (не в 1D538…). */
const LETTERLIKE_DOUBLE_STRUCK: Record<number, string> = {
  0x2102: "C",
  0x210d: "H",
  0x2115: "N",
  0x2119: "P",
  0x211a: "Q",
  0x211d: "R",
  0x2124: "Z",
};

function inRange(cp: number, start: number, end: number): boolean {
  return cp >= start && cp <= end;
}

function mapMathAlphanumeric(cp: number): string | null {
  const scr = SCRIPT_CAPITAL[cp];
  if (scr) return scr;
  const fk = FRAKTUR_CAPITAL[cp];
  if (fk) return fk;
  const ds = DOUBLE_STRUCK_CAPITAL[cp];
  if (ds) return ds;

  // Double-struck small a–z
  if (inRange(cp, 0x1d552, 0x1d56b)) return String.fromCharCode(0x61 + (cp - 0x1d552));

  // Bold Fraktur A–Z, a–z
  if (inRange(cp, 0x1d56c, 0x1d585)) return String.fromCharCode(0x41 + (cp - 0x1d56c));
  if (inRange(cp, 0x1d586, 0x1d59f)) return String.fromCharCode(0x61 + (cp - 0x1d586));

  // Bold / Italic / Bold Italic Latin
  if (inRange(cp, 0x1d400, 0x1d419)) return String.fromCharCode(0x41 + (cp - 0x1d400));
  if (inRange(cp, 0x1d41a, 0x1d433)) return String.fromCharCode(0x61 + (cp - 0x1d41a));
  if (inRange(cp, 0x1d434, 0x1d44d)) return String.fromCharCode(0x41 + (cp - 0x1d434));
  if (inRange(cp, 0x1d44e, 0x1d467)) return String.fromCharCode(0x61 + (cp - 0x1d44e));
  if (inRange(cp, 0x1d468, 0x1d481)) return String.fromCharCode(0x41 + (cp - 0x1d468));
  if (inRange(cp, 0x1d482, 0x1d49b)) return String.fromCharCode(0x61 + (cp - 0x1d482));

  // Script bold A–Z, a–z
  if (inRange(cp, 0x1d4d0, 0x1d4e9)) return String.fromCharCode(0x41 + (cp - 0x1d4d0));
  if (inRange(cp, 0x1d4ea, 0x1d503)) return String.fromCharCode(0x61 + (cp - 0x1d4ea));

  // Script small a–z
  if (inRange(cp, 0x1d4b6, 0x1d4cf)) return String.fromCharCode(0x61 + (cp - 0x1d4b6));

  // Fraktur small a–z
  if (inRange(cp, 0x1d51e, 0x1d537)) return String.fromCharCode(0x61 + (cp - 0x1d51e));

  // Sans-serif
  if (inRange(cp, 0x1d5a0, 0x1d5b7)) return String.fromCharCode(0x41 + (cp - 0x1d5a0));
  if (inRange(cp, 0x1d5b8, 0x1d5cf)) return String.fromCharCode(0x61 + (cp - 0x1d5b8));
  if (inRange(cp, 0x1d5d4, 0x1d5ed)) return String.fromCharCode(0x41 + (cp - 0x1d5d4));
  if (inRange(cp, 0x1d5ee, 0x1d607)) return String.fromCharCode(0x61 + (cp - 0x1d5ee));
  if (inRange(cp, 0x1d608, 0x1d621)) return String.fromCharCode(0x41 + (cp - 0x1d608));
  if (inRange(cp, 0x1d622, 0x1d63b)) return String.fromCharCode(0x61 + (cp - 0x1d622));
  if (inRange(cp, 0x1d63c, 0x1d655)) return String.fromCharCode(0x41 + (cp - 0x1d63c));
  if (inRange(cp, 0x1d656, 0x1d66f)) return String.fromCharCode(0x61 + (cp - 0x1d656));

  // Monospace A–Z, a–z
  if (inRange(cp, 0x1d670, 0x1d689)) return String.fromCharCode(0x41 + (cp - 0x1d670));
  if (inRange(cp, 0x1d68a, 0x1d6a3)) return String.fromCharCode(0x61 + (cp - 0x1d68a));

  // Digits 0–9 (разные стили)
  if (inRange(cp, 0x1d7ce, 0x1d7d7)) return String.fromCharCode(0x30 + (cp - 0x1d7ce));
  if (inRange(cp, 0x1d7d8, 0x1d7e1)) return String.fromCharCode(0x30 + (cp - 0x1d7d8));
  if (inRange(cp, 0x1d7e2, 0x1d7eb)) return String.fromCharCode(0x30 + (cp - 0x1d7e2));
  if (inRange(cp, 0x1d7ec, 0x1d7f5)) return String.fromCharCode(0x30 + (cp - 0x1d7ec));
  if (inRange(cp, 0x1d7f6, 0x1d7ff)) return String.fromCharCode(0x30 + (cp - 0x1d7f6));

  return null;
}

function mapCodePoint(cp: number): string {
  const letterlike = LETTERLIKE_DOUBLE_STRUCK[cp];
  if (letterlike) return letterlike;

  if (inRange(cp, 0x1d400, 0x1d7ff)) {
    const m = mapMathAlphanumeric(cp);
    if (m) return m;
  }
  return String.fromCodePoint(cp);
}

/**
 * Ник для отображения в UI: обычный шрифт, без «математических» букв и полной ширины.
 */
export function formatUsernameDisplay(raw: string | null | undefined): string {
  if (raw == null || raw === "") return raw ?? "";
  const s = raw.normalize("NFKC").replace(INVISIBLE, "");
  const out: string[] = [];
  for (let i = 0; i < s.length; ) {
    const cp = s.codePointAt(i)!;
    i += cp > 0xffff ? 2 : 1;
    out.push(mapCodePoint(cp));
  }
  const normalized = out.join("");
  // Ограничение длины до 16 символов
  if (normalized.length > 16) {
    return normalized.substring(0, 16);
  }
  return normalized;
}
