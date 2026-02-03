import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType = "image/png" } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a guitar tablature recognition expert. Your task is to analyze images containing guitar tabs and extract the tablature notation.

Output ONLY valid JSON in this exact format:
{
  "lines": [
    {
      "title": "Section name if visible (like Intro, Verse, Chorus) or empty string",
      "notes": [
        {"stringIndex": 0, "position": 0, "fret": "5"}
      ],
      "connections": []
    }
  ]
}

String mapping (standard guitar tuning):
- stringIndex 0 = high e string (thinnest)
- stringIndex 1 = B string
- stringIndex 2 = G string  
- stringIndex 3 = D string
- stringIndex 4 = A string
- stringIndex 5 = low E string (thickest)

Position is the horizontal column number starting from 0.
Fret is the fret number as a string (can be "0" for open, numbers like "5", "12", or symbols like "x" for muted).

Connection types for techniques (if visible):
- "hammer-on" (h)
- "pull-off" (p)
- "slide" (/)
- "bend" (b)

For connections, add to the connections array:
{"type": "hammer-on", "stringIndex": 0, "startPosition": 0, "endPosition": 2}

If you cannot recognize any tablature, return: {"lines": [], "error": "Could not recognize tablature from the image"}

IMPORTANT: Return ONLY the JSON, no markdown, no explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this guitar tablature image and extract all the notes and techniques. Return the data in the JSON format specified.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let parsedTabs;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsedTabs = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse tablature from AI response",
          rawResponse: content 
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and add IDs to the response
    const lines = (parsedTabs.lines || []).map((line: any, idx: number) => ({
      id: crypto.randomUUID(),
      title: line.title || "",
      notes: (line.notes || []).map((note: any) => ({
        stringIndex: Number(note.stringIndex) || 0,
        position: Number(note.position) || 0,
        fret: String(note.fret || ""),
      })),
      connections: (line.connections || []).map((conn: any) => ({
        id: crypto.randomUUID(),
        type: conn.type || "hammer-on",
        stringIndex: Number(conn.stringIndex) || 0,
        startPosition: Number(conn.startPosition) || 0,
        endPosition: Number(conn.endPosition) || 1,
      })),
      columns: Math.max(16, ...((line.notes || []).map((n: any) => Number(n.position) + 1)), 16),
    }));

    return new Response(
      JSON.stringify({ 
        lines,
        error: parsedTabs.error || null 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in recognize-tabs:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
