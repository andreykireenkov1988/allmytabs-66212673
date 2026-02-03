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
        
        if (conn.type === 'hammer-on') {
          // Draw an arc above the notes
          const arcHeight = 12;
          const midX = (startX + endX) / 2;
          
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
        } else {
          // Draw a diagonal line for slide
          return (
            <line
              key={conn.id}
              x1={startX + 4}
              y1={centerY}
              x2={endX - 4}
              y2={centerY}
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary"
              style={{ transform: 'rotate(-15deg)', transformOrigin: `${(startX + endX) / 2}px ${centerY}px` }}
            />
          );
        }
      })}
    </svg>
  );
}
