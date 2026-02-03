import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, artist, itemType, itemId } = await req.json();

    if (!title || !itemType || !itemId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate prompt for musical image
    const artistPart = artist ? ` by ${artist}` : "";
    const prompt = `Create a beautiful artistic cover image for a song called "${title}"${artistPart}. 
Style: Musical themed, elegant album cover art with musical notes, instruments like guitar or harmonica subtly incorporated. 
Mood: Atmospheric, emotional, professional music artwork. 
Colors: Rich, warm tones. No text or words on the image. Square format, 512x512 pixels.`;

    console.log("Generating image for:", title);

    // Call Lovable AI Gateway for image generation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in response:", JSON.stringify(aiData));
      throw new Error("No image generated");
    }

    // Extract base64 data and convert to blob
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to storage
    const fileName = `${user.id}/${itemType}-${itemId}-${Date.now()}.png`;
    
    // First delete any existing image for this item
    const { data: existingFiles } = await supabase.storage
      .from("card-images")
      .list(user.id, { search: `${itemType}-${itemId}` });
    
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles
        .filter(f => f.name.startsWith(`${itemType}-${itemId}`))
        .map(f => `${user.id}/${f.name}`);
      
      if (filesToDelete.length > 0) {
        await supabase.storage.from("card-images").remove(filesToDelete);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from("card-images")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("card-images").getPublicUrl(fileName);
    const imageUrl = urlData.publicUrl;

    // Update the item with the image URL
    const tableName = itemType === "song" ? "songs" : "harmonica_tabs";
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ image_url: imageUrl })
      .eq("id", itemId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Failed to update ${itemType}: ${updateError.message}`);
    }

    console.log("Image generated and saved:", imageUrl);

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
