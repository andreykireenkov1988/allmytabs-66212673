import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { initialize, svg2png } from "https://esm.sh/svg2png-wasm@1.4.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  const width = 400;
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
    // Simple heuristic: if line has mostly chords, color them
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
  const width = 420;

  // Calculate total height
  let totalH = padding * 2 + titleHeight;
  for (const line of lines) {
    if (line.title) totalH += 22;
    // chord row
    const hasChords = line.chords && line.chords.length > 0;
    if (hasChords) totalH += 22;
    totalH += STRING_NAMES.length * CELL_H + 12;
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

    // Chord row
    if (line.chords && line.chords.length > 0) {
      for (const ch of line.chords) {
        const cx = x0 + ch.position * CELL_W + CELL_W / 2;
        svg += `<text x="${cx}" y="${y + 14}" font-family="${FONT}" font-size="11" font-weight="bold" fill="#64b5f6" text-anchor="middle">${escapeXml(ch.chord)}</text>`;
      }
      y += 22;
    }

    // Strings
    for (let si = 0; si < STRING_NAMES.length; si++) {
      const sy = y + si * CELL_H + CELL_H / 2;

      // Label
      svg += `<text x="${padding}" y="${sy + 4}" font-family="${FONT}" font-size="11" fill="#999">${STRING_NAMES[si]}</text>`;

      // Line
      svg += `<line x1="${x0}" y1="${sy}" x2="${x0 + cols * CELL_W}" y2="${sy}" stroke="#555" stroke-width="1"/>`;

      // Notes
      const notes = (line.notes || []).filter((n: any) => n.stringIndex === si);
      for (const note of notes) {
        const nx = x0 + note.position * CELL_W + CELL_W / 2;
        // Background to cover line
        const tw = note.fret.length > 1 ? 16 : 10;
        svg += `<rect x="${nx - tw / 2}" y="${sy - 8}" width="${tw}" height="16" fill="#1a1a2e"/>`;
        svg += `<text x="${nx}" y="${sy + 4}" font-family="${FONT}" font-size="12" font-weight="bold" fill="#e0e0e0" text-anchor="middle">${escapeXml(note.fret)}</text>`;

        // Bend arrow
        if (note.bend) {
          svg += `<line x1="${nx + 8}" y1="${sy + 2}" x2="${nx + 8}" y2="${sy - 8}" stroke="#64b5f6" stroke-width="1.5"/>`;
          svg += `<polyline points="${nx + 5},${sy - 5} ${nx + 8},${sy - 9} ${nx + 11},${sy - 5}" fill="none" stroke="#64b5f6" stroke-width="1.5"/>`;
        }
      }
    }

    // Connections (hammer-on, pull-off, slide)
    for (const conn of (line.connections || [])) {
      const sy = y + conn.stringIndex * CELL_H + CELL_H / 2;
      const sx = x0 + conn.startPosition * CELL_W + CELL_W / 2;
      const ex = x0 + conn.endPosition * CELL_W + CELL_W / 2;
      const midX = (sx + ex) / 2;

      if (conn.type === "slide") {
        svg += `<line x1="${sx + 6}" y1="${sy + 4}" x2="${ex - 6}" y2="${sy - 4}" stroke="#64b5f6" stroke-width="1.5"/>`;
      } else {
        svg += `<path d="M ${sx + 6} ${sy - 8} Q ${midX} ${sy - 18} ${ex - 6} ${sy - 8}" fill="none" stroke="#64b5f6" stroke-width="1.5"/>`;
        if (conn.type === "hammer-on") {
          svg += `<text x="${midX}" y="${sy - 16}" font-family="${FONT}" font-size="9" fill="#64b5f6" text-anchor="middle">H</text>`;
        } else {
          svg += `<text x="${midX}" y="${sy - 16}" font-family="${FONT}" font-size="9" fill="#64b5f6" text-anchor="middle">P</text>`;
        }
      }
    }

    y += STRING_NAMES.length * CELL_H + 12;
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
  const width = 420;

  let totalH = padding * 2 + titleHeight;
  for (const line of lines) {
    if (line.title) totalH += 22;
    totalH += cellH + 12;
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

    // Render each note/chord
    const chords = line.chords || [];
    const notes = line.notes || [];

    for (let pos = 0; pos < cols; pos++) {
      const cx = padding + pos * cellW + cellW / 2;
      const cy = y + cellH / 2;

      // Check if there's a chord at this position
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

      // Single note
      const note = notes.find((n: any) => n.position === pos);
      if (note) {
        const prefix = note.direction === "blow" ? "" : "-";
        const bendMarks = "'".repeat(note.bend || 0);
        const text = `${prefix}${note.hole}${bendMarks}`;
        const fill = note.direction === "blow" ? "#ef5350" : "#42a5f5";
        svg += `<text x="${cx}" y="${cy + 4}" font-family="${FONT}" font-size="13" font-weight="bold" fill="${fill}" text-anchor="middle">${escapeXml(text)}</text>`;
      }
    }

    y += cellH + 12;
  }

  svg += `</svg>`;
  return svg;
}

// ── SVG to PNG conversion using svg2png-wasm ───────────────

let wasmInitialized = false;
let fontData: Uint8Array | null = null;

async function ensureWasm() {
  if (wasmInitialized) return;
  
  // Load WASM
  const wasmUrl = "https://esm.sh/svg2png-wasm@1.4.1/svg2png_wasm_bg.wasm";
  const wasmRes = await fetch(wasmUrl);
  const wasm = await wasmRes.arrayBuffer();
  await initialize(wasm);
  
  // Load a monospace font for text rendering
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

// ── Telegram API helpers ───────────────────────────────────────

const BOT_TOKEN = () => Deno.env.get("TELEGRAM_BOT_TOKEN")!;

async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function sendPhoto(chatId: number, pngBuffer: Uint8Array, caption: string) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", caption);
  form.append("photo", new Blob([pngBuffer], { type: "image/png" }), "tab.png");

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN()}/sendPhoto`, {
    method: "POST",
    body: form,
  });
}

async function sendDocument(chatId: number, pngBuffer: Uint8Array, filename: string, caption: string) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", caption);
  form.append("document", new Blob([pngBuffer], { type: "image/png" }), filename);

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN()}/sendDocument`, {
    method: "POST",
    body: form,
  });
}

// ── Main handler ───────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Setup webhook endpoint
  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("setup") === "true") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const webhookUrl = `${supabaseUrl}/functions/v1/telegram-bot`;
      const res = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN()}/setWebhook`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: webhookUrl }),
        }
      );
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response("OK", { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    const message = update.message;
    const callback = update.callback_query;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (callback) {
      const chatId = callback.message.chat.id;
      const data = callback.data;

      // Find user by telegram link
      const { data: link } = await supabase
        .from("telegram_links")
        .select("user_id")
        .eq("telegram_chat_id", chatId)
        .single();

      if (!link) {
        await sendMessage(chatId, "⚠️ Аккаунт не привязан. Используйте /link КОД");
        return new Response("OK");
      }

      if (data.startsWith("song:")) {
        const songId = data.replace("song:", "");
        const { data: song } = await supabase
          .from("songs")
          .select("*")
          .eq("id", songId)
          .eq("user_id", link.user_id)
          .single();

        if (!song) {
          await sendMessage(chatId, "Песня не найдена");
          return new Response("OK");
        }

        // Get blocks
        const { data: blocks } = await supabase
          .from("song_blocks")
          .select("*")
          .eq("song_id", songId)
          .eq("user_id", link.user_id)
          .order("position");

        const songTitle = `${song.artist ? song.artist + " - " : ""}${song.title}`;

        if (!blocks || blocks.length === 0) {
          await sendMessage(chatId, `🎸 <b>${escapeXml(songTitle)}</b>\n\nНет блоков для экспорта`);
          return new Response("OK");
        }

        // Render each block as PNG
        for (const block of blocks) {
          try {
            let svgStr: string;
            const blockTitle = block.title || (block.block_type === "chords" ? "Аккорды" : "Табулатура");

            if (block.block_type === "chords") {
              const text = (block.content as any)?.text || "";
              svgStr = renderChordsSvg(text, blockTitle);
            } else {
              svgStr = renderTablatureSvg(block.content, blockTitle);
            }

            const png = await svgToPng(svgStr);
            await sendDocument(chatId, png, `${songTitle} - ${blockTitle}.png`, `🎸 ${songTitle}\n📄 ${blockTitle}`);
          } catch (e) {
            console.error("Error rendering block:", e);
            await sendMessage(chatId, `Ошибка при рендере блока: ${block.title || block.block_type}`);
          }
        }

        return new Response("OK");
      }

      if (data.startsWith("harmonica:")) {
        const tabId = data.replace("harmonica:", "");
        const { data: tab } = await supabase
          .from("harmonica_tabs")
          .select("*")
          .eq("id", tabId)
          .eq("user_id", link.user_id)
          .single();

        if (!tab) {
          await sendMessage(chatId, "Табулатура не найдена");
          return new Response("OK");
        }

        try {
          const svgStr = renderHarmonicaSvg(tab.content, tab.title);
          const png = await svgToPng(svgStr);
          await sendDocument(chatId, png, `${tab.title}.png`, `🎵 ${tab.title}`);
        } catch (e) {
          console.error("Error rendering harmonica tab:", e);
          await sendMessage(chatId, "Ошибка при рендере табулатуры");
        }

        return new Response("OK");
      }

      return new Response("OK");
    }

    if (!message?.text) return new Response("OK");

    const chatId = message.chat.id;
    const text = message.text.trim();

    // /start
    if (text === "/start") {
      await sendMessage(
        chatId,
        "👋 Привет! Я бот <b>AllMyTabs</b>.\n\n" +
        "Для начала привяжите аккаунт:\n" +
        "1. Откройте приложение AllMyTabs\n" +
        "2. Нажмите кнопку «Telegram» в меню\n" +
        "3. Скопируйте код и отправьте сюда командой:\n" +
        "<code>/link ВАШ_КОД</code>\n\n" +
        "Команды:\n" +
        "/list — список композиций\n" +
        "/link КОД — привязать аккаунт\n" +
        "/unlink — отвязать аккаунт"
      );
      return new Response("OK");
    }

    // /link CODE
    if (text.startsWith("/link ")) {
      const code = text.replace("/link ", "").trim();
      if (!code) {
        await sendMessage(chatId, "Укажите код: /link ВАШ_КОД");
        return new Response("OK");
      }

      // Find code
      const { data: linkCode } = await supabase
        .from("telegram_link_codes")
        .select("*")
        .eq("code", code)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (!linkCode) {
        await sendMessage(chatId, "❌ Код не найден или истёк. Сгенерируйте новый в приложении.");
        return new Response("OK");
      }

      // Check if already linked
      const { data: existingLink } = await supabase
        .from("telegram_links")
        .select("id")
        .eq("telegram_chat_id", chatId)
        .single();

      if (existingLink) {
        // Update existing
        await supabase
          .from("telegram_links")
          .update({
            user_id: linkCode.user_id,
            telegram_username: message.from?.username || null,
          })
          .eq("telegram_chat_id", chatId);
      } else {
        // Insert new
        await supabase.from("telegram_links").insert({
          user_id: linkCode.user_id,
          telegram_chat_id: chatId,
          telegram_username: message.from?.username || null,
        });
      }

      // Delete used code
      await supabase.from("telegram_link_codes").delete().eq("id", linkCode.id);

      await sendMessage(chatId, "✅ Аккаунт успешно привязан! Используйте /list для просмотра композиций.");
      return new Response("OK");
    }

    // /unlink
    if (text === "/unlink") {
      await supabase.from("telegram_links").delete().eq("telegram_chat_id", chatId);
      await sendMessage(chatId, "✅ Аккаунт отвязан.");
      return new Response("OK");
    }

    // /list
    if (text === "/list") {
      const { data: link } = await supabase
        .from("telegram_links")
        .select("user_id")
        .eq("telegram_chat_id", chatId)
        .single();

      if (!link) {
        await sendMessage(chatId, "⚠️ Аккаунт не привязан. Используйте /link КОД");
        return new Response("OK");
      }

      // Get songs
      const { data: songs } = await supabase
        .from("songs")
        .select("id, title, artist")
        .eq("user_id", link.user_id)
        .order("updated_at", { ascending: false });

      // Get harmonica tabs
      const { data: harmonicaTabs } = await supabase
        .from("harmonica_tabs")
        .select("id, title, artist")
        .eq("user_id", link.user_id)
        .order("updated_at", { ascending: false });

      if ((!songs || songs.length === 0) && (!harmonicaTabs || harmonicaTabs.length === 0)) {
        await sendMessage(chatId, "📭 У вас пока нет композиций.");
        return new Response("OK");
      }

      // Build inline keyboard
      const keyboard: any[][] = [];

      if (songs && songs.length > 0) {
        keyboard.push([{ text: "🎸 Гитара", callback_data: "noop" }]);
        for (const song of songs) {
          const label = song.artist ? `${song.artist} - ${song.title}` : song.title;
          keyboard.push([{
            text: `📄 ${label}`,
            callback_data: `song:${song.id}`,
          }]);
        }
      }

      if (harmonicaTabs && harmonicaTabs.length > 0) {
        keyboard.push([{ text: "🎵 Гармошка", callback_data: "noop" }]);
        for (const tab of harmonicaTabs) {
          const label = tab.artist ? `${tab.artist} - ${tab.title}` : tab.title;
          keyboard.push([{
            text: `📄 ${label}`,
            callback_data: `harmonica:${tab.id}`,
          }]);
        }
      }

      await sendMessage(
        chatId,
        `📋 <b>Ваши композиции</b>\nНажмите для экспорта в PNG:`,
        { inline_keyboard: keyboard }
      );

      return new Response("OK");
    }

    // Unknown command
    await sendMessage(chatId, "Используйте /start для справки или /list для списка композиций.");
    return new Response("OK");
  } catch (error) {
    console.error("Telegram bot error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
