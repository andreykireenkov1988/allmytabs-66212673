import { TablatureConnection } from '@/types/tablature';

interface ConnectionRendererProps {
  connections: TablatureConnection[];
  stringIndex: number;
  cellWidth: number;
  cellHeight: number;
}

export function ConnectionRenderer({ 
  connections, 
  stringIndex, 
  cellWidth, 
  cellHeight 
}: ConnectionRendererProps) {
  const stringConnections = connections.filter(c => c.stringIndex === stringIndex);
  
  if (stringConnections.length === 0) return null;

  return (
    <svg 
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ width: '100%', height: cellHeight }}
    >
      {stringConnections.map((conn) => {
        const startX = conn.startPosition * cellWidth + cellWidth / 2;
        const endX = conn.endPosition * cellWidth + cellWidth / 2;
        const centerY = cellHeight / 2;
        const midX = (startX + endX) / 2;
        
        if (conn.type === 'hammer-on') {
          // Draw an arc above the notes
          const arcHeight = 12;
          
          return (
            <path
              key={conn.id}
              d={`M ${startX} ${centerY - 6} Q ${midX} ${centerY - arcHeight - 6} ${endX} ${centerY - 6}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary"
            />
          );
        } else if (conn.type === 'pull-off') {
          // Draw an arc below the notes (inverted hammer-on)
          const arcHeight = 12;
          
          return (
            <path
              key={conn.id}
              d={`M ${startX} ${centerY + 6} Q ${midX} ${centerY + arcHeight + 6} ${endX} ${centerY + 6}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-secondary-foreground"
            />
          );
        } else if (conn.type === 'slide') {
          // Draw a diagonal line for slide
          return (
            <line
              key={conn.id}
              x1={startX + 4}
              y1={centerY + 4}
              x2={endX - 4}
              y2={centerY - 4}
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary"
            />
          );
        } else if (conn.type === 'bend') {
          // Draw a curved arrow for bend
          const arrowSize = 4;
          
          return (
            <g key={conn.id} className="text-accent-foreground">
              <path
                d={`M ${startX} ${centerY + 4} Q ${midX} ${centerY - 10} ${endX} ${centerY - 8}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              {/* Arrow head */}
              <path
                d={`M ${endX - arrowSize} ${centerY - 8 - arrowSize} L ${endX} ${centerY - 8} L ${endX - arrowSize} ${centerY - 8 + arrowSize}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        }
        
        return null;
      })}
    </svg>
  );
}
