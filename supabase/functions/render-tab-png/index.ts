import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { initialize, svg2png } from "https://esm.sh/svg2png-wasm@1.4.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STRING_NAMES = ["e", "B", "G", "D", "A", "E"];
const CELL_W = 28;
const CELL_H = 24;
const FONT = "monospace";

// ── SVG Renderers ──────────────────────────────────────────────

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderChordsSvg(text: string, title: string): string {
  const lines = text.split("\n");
  const lineHeight = 20;
  const padding = 20;
  const titleHeight = title ? 30 : 0;

  // Calculate width based on longest line
  const maxLineLen = Math.max(...lines.map(l => l.length), 20);
  const width = Math.max(400, padding * 2 + maxLineLen * 8);
  const height = padding * 2 + titleHeight + lines.length * lineHeight + 10;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
  svg += `<rect width="100%" height="100%" fill="#1a1a2e"/>`;

  let y = padding;
  if (title) {
    svg += `<text x="${padding}" y="${y + 16}" font-family="${FONT}" font-size="16" font-weight="bold" fill="#e0e0e0">${escapeXml(title)}</text>`;
    y += titleHeight;
  }

  for (const line of lines) {
    y += lineHeight;
    const isChordLine = /^[\s]*([A-G][#b]?m?(aj|in|dim|aug|sus|add|7|9|11|13)*[\s/]*)+[\s]*$/i.test(line.trim());
    const fill = isChordLine ? "#64b5f6" : "#e0e0e0";
    svg += `<text x="${padding}" y="${y}" font-family="${FONT}" font-size="13" fill="${fill}" xml:space="preserve">${escapeXml(line)}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

function renderTablatureSvg(content: any, title: string): string {
  const lines = content.lines || [];
  const padding = 20;
  const labelWidth = 20;
  const titleHeight = title ? 30 : 0;

  const maxCols = Math.max(...lines.map((l: any) => l.columns || 16), 16);
  const width = padding * 2 + labelWidth + maxCols * CELL_W + 20;

  let totalH = padding * 2 + titleHeight;
  for (const line of lines) {
    if (line.title) totalH += 22;
    if (line.chords && line.chords.length > 0) totalH += 22;
    totalH += STRING_NAMES.length * CELL_H + 16;
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalH}">`;
  svg += `<rect width="100%" height="100%" fill="#1a1a2e"/>`;

  let y = padding;
  if (title) {
    svg += `<text x="${padding}" y="${y + 16}" font-family="${FONT}" font-size="16" font-weight="bold" fill="#e0e0e0">${escapeXml(title)}</text>`;
    y += titleHeight;
  }

  for (const line of lines) {
    if (line.title) {
      svg += `<text x="${padding}" y="${y + 14}" font-family="${FONT}" font-size="12" fill="#999">${escapeXml(line.title)}</text>`;
      y += 22;
    }

    const cols = line.columns || 16;
    const x0 = padding + labelWidth;

    if (line.chords && line.chords.length > 0) {
      for (const ch of line.chords) {
        const cx = x0 + ch.position * CELL_W + CELL_W / 2;
        svg += `<text x="${cx}" y="${y + 14}" font-family="${FONT}" font-size="11" font-weight="bold" fill="#64b5f6" text-anchor="middle">${escapeXml(ch.chord)}</text>`;
      }
      y += 22;
    }

    for (let si = 0; si < STRING_NAMES.length; si++) {
      const sy = y + si * CELL_H + CELL_H / 2;
      svg += `<text x="${padding}" y="${sy + 4}" font-family="${FONT}" font-size="11" fill="#999">${STRING_NAMES[si]}</text>`;
      svg += `<line x1="${x0}" y1="${sy}" x2="${x0 + cols * CELL_W}" y2="${sy}" stroke="#555" stroke-width="1"/>`;

      const notes = (line.notes || []).filter((n: any) => n.stringIndex === si);
      for (const note of notes) {
        const nx = x0 + note.position * CELL_W + CELL_W / 2;
        const tw = note.fret.length > 1 ? 16 : 10;
        svg += `<rect x="${nx - tw / 2}" y="${sy - 8}" width="${tw}" height="16" fill="#1a1a2e"/>`;
        svg += `<text x="${nx}" y="${sy + 4}" font-family="${FONT}" font-size="12" font-weight="bold" fill="#e0e0e0" text-anchor="middle">${escapeXml(note.fret)}</text>`;

        if (note.bend) {
          svg += `<line x1="${nx + 8}" y1="${sy + 2}" x2="${nx + 8}" y2="${sy - 8}" stroke="#64b5f6" stroke-width="1.5"/>`;
          svg += `<polyline points="${nx + 5},${sy - 5} ${nx + 8},${sy - 9} ${nx + 11},${sy - 5}" fill="none" stroke="#64b5f6" stroke-width="1.5"/>`;
        }
      }
    }

    for (const conn of (line.connections || [])) {
      const sy = y + conn.stringIndex * CELL_H + CELL_H / 2;
      const sx = x0 + conn.startPosition * CELL_W + CELL_W / 2;
      const ex = x0 + conn.endPosition * CELL_W + CELL_W / 2;
      const midX = (sx + ex) / 2;

      if (conn.type === "slide") {
        svg += `<line x1="${sx + 6}" y1="${sy + 4}" x2="${ex - 6}" y2="${sy - 4}" stroke="#64b5f6" stroke-width="1.5"/>`;
      } else {
        svg += `<path d="M ${sx + 6} ${sy - 8} Q ${midX} ${sy - 18} ${ex - 6} ${sy - 8}" fill="none" stroke="#64b5f6" stroke-width="1.5"/>`;
        const label = conn.type === "hammer-on" ? "H" : "P";
        svg += `<text x="${midX}" y="${sy - 16}" font-family="${FONT}" font-size="9" fill="#64b5f6" text-anchor="middle">${label}</text>`;
      }
    }

    y += STRING_NAMES.length * CELL_H + 16;
  }

  svg += `</svg>`;
  return svg;
}

function renderHarmonicaSvg(content: any, title: string): string {
  const lines = content.lines || [];
  const padding = 20;
  const titleHeight = title ? 30 : 0;
  const cellW = 36;
  const cellH = 28;

  // Dynamic width based on max columns
  const maxCols = Math.max(...lines.map((l: any) => l.columns || 16), 16);
  const width = Math.max(420, padding * 2 + maxCols * cellW + 20);

  let totalH = padding * 2 + titleHeight;
  for (const line of lines) {
    if (line.title) totalH += 22;
    totalH += cellH + 16;
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalH}">`;
  svg += `<rect width="100%" height="100%" fill="#1a1a2e"/>`;

  let y = padding;
  if (title) {
    svg += `<text x="${padding}" y="${y + 16}" font-family="${FONT}" font-size="16" font-weight="bold" fill="#e0e0e0">${escapeXml(title)}</text>`;
    y += titleHeight;
  }

  for (const line of lines) {
    if (line.title) {
      svg += `<text x="${padding}" y="${y + 14}" font-family="${FONT}" font-size="12" fill="#999">${escapeXml(line.title)}</text>`;
      y += 22;
    }

    const cols = line.columns || 16;
    const chords = line.chords || [];
    const notes = line.notes || [];

    for (let pos = 0; pos < cols; pos++) {
      const cx = padding + pos * cellW + cellW / 2;
      const cy = y + cellH / 2;

      const chord = chords.find((c: any) => c.position === pos);
      if (chord && chord.notes?.length > 0) {
        const sortedNotes = [...chord.notes].sort((a: any, b: any) => a.hole - b.hole);
        const dir = sortedNotes[0].direction;
        const prefix = dir === "blow" ? "" : "-";
        const holes = sortedNotes.map((n: any) => n.hole).join("");
        const text = `${prefix}${holes}`;
        const fill = dir === "blow" ? "#ef5350" : "#42a5f5";
        svg += `<rect x="${cx - cellW / 2 + 2}" y="${y + 2}" width="${cellW - 4}" height="${cellH - 4}" rx="4" fill="${fill}22" stroke="${fill}" stroke-width="1"/>`;
        svg += `<text x="${cx}" y="${cy + 4}" font-family="${FONT}" font-size="12" font-weight="bold" fill="${fill}" text-anchor="middle">${text}</text>`;
        continue;
      }

      const note = notes.find((n: any) => n.position === pos);
      if (note) {
        const prefix = note.direction === "blow" ? "" : "-";
        const bendMarks = "'".repeat(note.bend || 0);
        const text = `${prefix}${note.hole}${bendMarks}`;
        const fill = note.direction === "blow" ? "#ef5350" : "#42a5f5";
        svg += `<text x="${cx}" y="${cy + 4}" font-family="${FONT}" font-size="13" font-weight="bold" fill="${fill}" text-anchor="middle">${escapeXml(text)}</text>`;
      }
    }

    y += cellH + 16;
  }

  svg += `</svg>`;
  return svg;
}

// ── SVG to PNG ─────────────────────────────────────────────────

let wasmInitialized = false;
let fontData: Uint8Array | null = null;

async function ensureWasm() {
  if (wasmInitialized) return;
  const wasmUrl = "https://esm.sh/svg2png-wasm@1.4.1/svg2png_wasm_bg.wasm";
  const wasmRes = await fetch(wasmUrl);
  const wasm = await wasmRes.arrayBuffer();
  await initialize(wasm);

  const fontUrl = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansmono/NotoSansMono%5Bwdth%2Cwght%5D.ttf";
  const fontRes = await fetch(fontUrl);
  fontData = new Uint8Array(await fontRes.arrayBuffer());

  wasmInitialized = true;
}

async function svgToPng(svgString: string): Promise<Uint8Array> {
  await ensureWasm();
  const options: any = { scale: 2 };
  if (fontData) {
    options.fonts = [fontData];
    options.defaultFontFamily = { monospaceFamily: "Noto Sans Mono" };
  }
  return await svg2png(svgString, options);
}

// ── Main handler ───────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, content, title } = await req.json();

    if (!type || !content) {
      return new Response(JSON.stringify({ error: "Missing type or content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let svgStr: string;

    if (type === "chords") {
      svgStr = renderChordsSvg(content.text || "", title || "");
    } else if (type === "tablature") {
      svgStr = renderTablatureSvg(content, title || "");
    } else if (type === "harmonica") {
      svgStr = renderHarmonicaSvg(content, title || "");
    } else {
      return new Response(JSON.stringify({ error: "Unknown type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const png = await svgToPng(svgStr);

    return new Response(png, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
