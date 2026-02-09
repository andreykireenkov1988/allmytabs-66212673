import { ChordVoicing } from '@/lib/chordDatabase';

interface ChordDiagramProps {
  voicing: ChordVoicing;
  chordName: string;
  size?: 'sm' | 'md' | 'lg';
}

const STRING_NAMES_BOTTOM = ['E', 'A', 'D', 'G', 'B', 'e'];

export function ChordDiagram({ voicing, chordName, size = 'md' }: ChordDiagramProps) {
  const scale = size === 'sm' ? 0.7 : size === 'lg' ? 1.2 : 1;
  const stringSpacing = 20 * scale;
  const fretSpacing = 24 * scale;
  const numFrets = 5;
  const padding = { top: 36 * scale, bottom: 20 * scale, left: 28 * scale, right: 12 * scale };
  const dotRadius = 7 * scale;

  const width = padding.left + 5 * stringSpacing + padding.right;
  const height = padding.top + numFrets * fretSpacing + padding.bottom;

  const minFret = voicing.baseFret;
  const showBaseFret = minFret > 1;

  const fingerColors = [
    '', // 0 — not used
    'hsl(var(--primary))',
    'hsl(var(--primary))',
    'hsl(var(--primary))',
    'hsl(var(--primary))',
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm font-bold text-foreground">{chordName}</span>
      <svg width={width} height={height} className="overflow-visible">
        {/* Nut or position marker */}
        {!showBaseFret ? (
          <rect
            x={padding.left}
            y={padding.top}
            width={5 * stringSpacing}
            height={3 * scale}
            fill="hsl(var(--foreground))"
            rx={1}
          />
        ) : (
          <text
            x={padding.left - 8 * scale}
            y={padding.top + fretSpacing / 2 + 4 * scale}
            textAnchor="end"
            fontSize={11 * scale}
            fill="hsl(var(--muted-foreground))"
            fontFamily="monospace"
          >
            {minFret}fr
          </text>
        )}

        {/* Fret lines */}
        {Array.from({ length: numFrets + 1 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={padding.left}
            y1={padding.top + i * fretSpacing}
            x2={padding.left + 5 * stringSpacing}
            y2={padding.top + i * fretSpacing}
            stroke="hsl(var(--border))"
            strokeWidth={i === 0 && !showBaseFret ? 0 : 1}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`string-${i}`}
            x1={padding.left + i * stringSpacing}
            y1={padding.top}
            x2={padding.left + i * stringSpacing}
            y2={padding.top + numFrets * fretSpacing}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            opacity={0.6}
          />
        ))}

        {/* Barre */}
        {voicing.barres?.map((barre, bi) => {
          const barreFret = barre;
          // Find first and last strings that use this fret
          const barreStrings = voicing.frets
            .map((f, si) => ({ fret: f, si }))
            .filter(({ fret }) => fret === (minFret > 1 ? minFret : barreFret));
          
          if (barreStrings.length < 2) return null;
          const first = barreStrings[0].si;
          const last = barreStrings[barreStrings.length - 1].si;
          const fretPos = minFret > 1 ? 1 : barreFret;
          const cy = padding.top + (fretPos - 0.5) * fretSpacing;

          return (
            <rect
              key={`barre-${bi}`}
              x={padding.left + first * stringSpacing - dotRadius}
              y={cy - dotRadius}
              width={(last - first) * stringSpacing + dotRadius * 2}
              height={dotRadius * 2}
              rx={dotRadius}
              fill="hsl(var(--primary))"
              opacity={0.9}
            />
          );
        })}

        {/* Finger dots and markers */}
        {voicing.frets.map((fret, stringIdx) => {
          const x = padding.left + stringIdx * stringSpacing;

          if (fret === -1) {
            // Muted string — X above nut
            return (
              <text
                key={`mute-${stringIdx}`}
                x={x}
                y={padding.top - 10 * scale}
                textAnchor="middle"
                fontSize={12 * scale}
                fill="hsl(var(--muted-foreground))"
                fontWeight="bold"
              >
                ×
              </text>
            );
          }

          if (fret === 0) {
            // Open string — O above nut
            return (
              <circle
                key={`open-${stringIdx}`}
                cx={x}
                cy={padding.top - 10 * scale}
                r={4 * scale}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5 * scale}
              />
            );
          }

          // Fretted note
          const relativeFret = fret - minFret + 1;
          const cy = padding.top + (relativeFret - 0.5) * fretSpacing;

          return (
            <g key={`dot-${stringIdx}`}>
              <circle
                cx={x}
                cy={cy}
                r={dotRadius}
                fill={fingerColors[voicing.fingers[stringIdx]] || 'hsl(var(--primary))'}
              />
              {voicing.fingers[stringIdx] > 0 && size !== 'sm' && (
                <text
                  x={x}
                  y={cy + 4 * scale}
                  textAnchor="middle"
                  fontSize={10 * scale}
                  fill="hsl(var(--primary-foreground))"
                  fontWeight="bold"
                >
                  {voicing.fingers[stringIdx]}
                </text>
              )}
            </g>
          );
        })}

        {/* String names at bottom */}
        {STRING_NAMES_BOTTOM.map((name, i) => (
          <text
            key={`name-${i}`}
            x={padding.left + i * stringSpacing}
            y={padding.top + numFrets * fretSpacing + 14 * scale}
            textAnchor="middle"
            fontSize={9 * scale}
            fill="hsl(var(--muted-foreground))"
            fontFamily="monospace"
          >
            {name}
          </text>
        ))}
      </svg>
    </div>
  );
}
