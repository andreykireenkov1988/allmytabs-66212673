import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract song content from the scraped data
    const markdown = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    const metadata = data.data?.metadata || data.metadata || {};
    
    // Try to extract title from metadata or content
    let title = metadata.title || '';
    let artist = '';
    
    // Try to parse title and artist from common patterns
    // Pattern: "Song Name - Artist Name" or "Artist - Song"
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      // Usually format is "Song - Artist" or "Artist - Song"
      if (parts.length >= 2) {
        // Check if it looks like Ultimate Guitar format
        if (title.toLowerCase().includes('tab') || title.toLowerCase().includes('chord')) {
          artist = parts[0].trim();
          title = parts[1].replace(/\s*(tab|chord|chords|tabs|ukulele).*/i, '').trim();
        } else {
          title = parts[0].trim();
          artist = parts[1].trim();
        }
      }
    }
    
    // Clean up common suffixes
    title = title.replace(/\s*[-|]\s*(Ultimate Guitar|Chords|Tab|Tabs|Lyrics).*/i, '').trim();
    artist = artist.replace(/\s*[-|]\s*(Ultimate Guitar|Chords|Tab|Tabs|Lyrics).*/i, '').trim();

    // Process the content to extract chord sheet format
    const songContent = extractChordSheet(markdown, html);

    console.log('Scrape successful, extracted content length:', songContent.length);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          title,
          artist,
          content: songContent,
          sourceUrl: formattedUrl,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractChordSheet(markdown: string, html: string): string {
  // Try to find pre-formatted chord sections in markdown
  // Look for patterns with chords (capital letters followed by optional modifiers)
  const chordPattern = /\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|\/[A-G][#b]?)*\b/g;
  
  // First, try to find content between common markers
  const lines = markdown.split('\n');
  const resultLines: string[] = [];
  let inChordSection = false;
  let consecutiveChordLines = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines but keep them in output
    if (!trimmedLine) {
      if (inChordSection) {
        resultLines.push('');
      }
      continue;
    }
    
    // Skip navigation/metadata lines
    if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) continue;
    if (trimmedLine.startsWith('#')) continue;
    if (trimmedLine.includes('|') && trimmedLine.split('|').length > 3) continue;
    if (/^\d+\s*(views|favorites|comments)/i.test(trimmedLine)) continue;
    if (/^(difficulty|capo|tuning|key):/i.test(trimmedLine)) continue;
    
    // Check if line contains chords
    const chordMatches = trimmedLine.match(chordPattern);
    const hasChords = chordMatches && chordMatches.length > 0;
    
    // Check if line is mostly chords (chord line)
    const words = trimmedLine.split(/\s+/);
    const chordWords = words.filter(w => chordPattern.test(w));
    const isChordLine = chordWords.length > 0 && chordWords.length >= words.length * 0.5;
    
    // Check if it's a section header
    const isSectionHeader = /^[\[]?(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Interlude|Solo|Instrumental|Coda|Hook|Refrain|Припев|Куплет|Вступление|Проигрыш|Соло)[\s\d]*[\]]?:?$/i.test(trimmedLine);
    
    if (isSectionHeader) {
      inChordSection = true;
      consecutiveChordLines = 0;
      resultLines.push('');
      resultLines.push(trimmedLine.replace(/[\[\]]/g, ''));
      continue;
    }
    
    // If we see chord patterns, we're in a chord section
    if (hasChords || isChordLine) {
      inChordSection = true;
      consecutiveChordLines++;
      resultLines.push(line);
      continue;
    }
    
    // If we're in a chord section, include lyrics lines too
    if (inChordSection) {
      // Check if this looks like a lyrics line (follows a chord line)
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      const prevHasChords = prevLine.match(chordPattern);
      
      if (prevHasChords || consecutiveChordLines > 0) {
        resultLines.push(line);
        consecutiveChordLines = 0;
      } else if (trimmedLine.length > 2 && !trimmedLine.includes('http') && !/^\d+$/.test(trimmedLine)) {
        // Might be standalone lyrics
        resultLines.push(line);
      }
    }
  }
  
  // Clean up result
  let result = resultLines.join('\n');
  
  // Remove excessive blank lines
  result = result.replace(/\n{4,}/g, '\n\n\n');
  result = result.trim();
  
  // If we didn't find much, return the cleaned markdown
  if (result.length < 50) {
    // Fallback: just clean the markdown
    return markdown
      .replace(/^#+\s+/gm, '')
      .replace(/\[.*?\]\((.*?)\)/g, '')
      .replace(/\*\*/g, '')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
  }
  
  return result;
}
