import { ChordVoicing } from '@/lib/chordDatabase';

interface ChordDiagramProps {
  voicing: ChordVoicing;
  chordName: string;
  size?: 'sm' | 'md' | 'lg';
}

const STRING_NAMES_BOTTOM = ['E', 'A', 'D', 'G', 'B', 'e'];

export function ChordDiagram({ voicing, chordName, size = 'md' }: ChordDiagramProps) {
  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.2 : 1;
  const stringSpacing = 18 * scale;
  const fretSpacing = 22 * scale;
  const numFrets = 5;
  const padding = { top: 28 * scale, bottom: 18 * scale, left: 24 * scale, right: 10 * scale };
  const dotRadius = 6 * scale;
  const gridWidth = 5 * stringSpacing;
  const gridHeight = numFrets * fretSpacing;

  const width = padding.left + gridWidth + padding.right;
  const height = padding.top + gridHeight + padding.bottom;

  const showBaseFret = voicing.baseFret > 1;

  return (
    <div className="flex flex-col items-center gap-0.5">
      {chordName && (
        <span className="text-xs font-medium text-muted-foreground">{chordName}</span>
      )}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Nut (thick bar at top) or fret position label */}
        {!showBaseFret ? (
          <rect
            x={padding.left}
            y={padding.top}
            width={gridWidth}
            height={2.5 * scale}
            fill="hsl(var(--foreground))"
            rx={1}
          />
        ) : (
          <text
            x={padding.left - 4 * scale}
            y={padding.top + fretSpacing * 0.5 + 4 * scale}
            textAnchor="end"
            fontSize={9 * scale}
            fill="hsl(var(--muted-foreground))"
            fontFamily="monospace"
          >
            {voicing.baseFret}
          </text>
        )}

        {/* Fret lines */}
        {Array.from({ length: numFrets + 1 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={padding.left}
            y1={padding.top + i * fretSpacing}
            x2={padding.left + gridWidth}
            y2={padding.top + i * fretSpacing}
            stroke="hsl(var(--border))"
            strokeWidth={1}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`string-${i}`}
            x1={padding.left + i * stringSpacing}
            y1={padding.top}
            x2={padding.left + i * stringSpacing}
            y2={padding.top + gridHeight}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={0.8}
            opacity={0.5}
          />
        ))}

        {/* Barres */}
        {voicing.barres?.map((barreFret, bi) => {
          // barreFret is the fret position in the diagram window (1-based)
          // Find the range of strings that are held at this fret
          const barreStrings = voicing.frets
            .map((f, si) => ({ fret: f, si }))
            .filter(({ fret }) => fret === barreFret);

          if (barreStrings.length < 2) return null;
          const first = barreStrings[0].si;
          const last = barreStrings[barreStrings.length - 1].si;
          const cy = padding.top + (barreFret - 0.5) * fretSpacing;

          return (
            <rect
              key={`barre-${bi}`}
              x={padding.left + first * stringSpacing - dotRadius}
              y={cy - dotRadius}
              width={(last - first) * stringSpacing + dotRadius * 2}
              height={dotRadius * 2}
              rx={dotRadius}
              fill="hsl(var(--primary))"
              opacity={0.85}
            />
          );
        })}

        {/* Finger dots and open/muted markers */}
        {voicing.frets.map((fret, stringIdx) => {
          const x = padding.left + stringIdx * stringSpacing;

          if (fret === -1) {
            // Muted string — X above
            return (
              <text
                key={`m-${stringIdx}`}
                x={x}
                y={padding.top - 6 * scale}
                textAnchor="middle"
                fontSize={10 * scale}
                fill="hsl(var(--muted-foreground))"
                fontWeight="bold"
              >
                ×
              </text>
            );
          }

          if (fret === 0) {
            // Open string — O above
            return (
              <circle
                key={`o-${stringIdx}`}
                cx={x}
                cy={padding.top - 9 * scale}
                r={3.5 * scale}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.2 * scale}
              />
            );
          }

          // Fretted note — fret value is already relative (1 = first fret in window)
          const cy = padding.top + (fret - 0.5) * fretSpacing;

          // Don't render if it's part of a barre (already drawn)
          // Only skip if barre covers this exact fret & it's not the first/last string of the barre
          const isInBarre = voicing.barres?.some(b => {
            if (b !== fret) return false;
            const barreStrings = voicing.frets
              .map((f, si) => ({ f, si }))
              .filter(({ f }) => f === b);
            const first = barreStrings[0]?.si;
            const last = barreStrings[barreStrings.length - 1]?.si;
            return stringIdx > first! && stringIdx < last!;
          });

          if (isInBarre) return null;

          return (
            <g key={`d-${stringIdx}`}>
              <circle
                cx={x}
                cy={cy}
                r={dotRadius}
                fill="hsl(var(--primary))"
              />
              {voicing.fingers[stringIdx] > 0 && size !== 'sm' && (
                <text
                  x={x}
                  y={cy + 3.5 * scale}
                  textAnchor="middle"
                  fontSize={9 * scale}
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
            key={`n-${i}`}
            x={padding.left + i * stringSpacing}
            y={padding.top + gridHeight + 12 * scale}
            textAnchor="middle"
            fontSize={8 * scale}
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
