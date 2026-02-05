import { TablatureConnection, TablatureNote, BendSize } from '@/types/tablature';

interface ConnectionRendererProps {
  connections: TablatureConnection[];
  stringIndex: number;
  cellWidth: number;
  cellHeight: number;
  selectedConnectionId?: string | null;
  onConnectionClick?: (connectionId: string) => void;
  notes?: TablatureNote[];
}

export function ConnectionRenderer({ 
  connections, 
  stringIndex, 
  cellWidth, 
  cellHeight,
  selectedConnectionId,
  onConnectionClick,
  notes = []
}: ConnectionRendererProps) {
  const stringConnections = connections.filter(c => c.stringIndex === stringIndex);
  const stringNotes = notes.filter(n => n.stringIndex === stringIndex && n.bend);
  
  if (stringConnections.length === 0 && stringNotes.length === 0) return null;

  const handleClick = (e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    onConnectionClick?.(connectionId);
  };

  const getBendLabel = (bend: BendSize): string => {
    switch (bend) {
      case '1/4': return '¼';
      case '1/2': return '½';
      case 'full': return '1';
      case '1.5': return '1½';
      default: return '';
    }
  };

  return (
    <svg 
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ width: '100%', height: cellHeight }}
    >
      {/* Render bend indicators for notes */}
      {stringNotes.map((note) => {
        const x = note.position * cellWidth + cellWidth / 2;
        const centerY = cellHeight / 2;
        const bendLabel = getBendLabel(note.bend!);
        
        return (
          <g key={`bend-${note.position}`}>
            {/* Simple vertical line with arrow */}
            <line
              x1={x + 8}
              y1={centerY + 2}
              x2={x + 8}
              y2={centerY - 10}
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary"
            />
            {/* Arrow head pointing up */}
            <polyline
              points={`${x + 5},${centerY - 7} ${x + 8},${centerY - 11} ${x + 11},${centerY - 7}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            />
            {/* Bend size label above the arrow */}
            <text
              x={x + 8}
              y={centerY - 14}
              textAnchor="middle"
              className="text-primary fill-current"
              fontSize="7"
              fontWeight="bold"
            >
              {bendLabel}
            </text>
          </g>
        );
      })}

      {stringConnections.map((conn) => {
        const startX = conn.startPosition * cellWidth + cellWidth / 2;
        const endX = conn.endPosition * cellWidth + cellWidth / 2;
        const centerY = cellHeight / 2;
        const midX = (startX + endX) / 2;
        const isSelected = conn.id === selectedConnectionId;
        const strokeWidth = isSelected ? 2.5 : 1.5;
        
        if (conn.type === 'hammer-on') {
          const arcHeight = 12;
          
          return (
            <g key={conn.id} className="pointer-events-auto cursor-pointer" onClick={(e) => handleClick(e, conn.id)}>
              {/* Invisible wider path for easier clicking */}
              <path
                d={`M ${startX} ${centerY - 6} Q ${midX} ${centerY - arcHeight - 6} ${endX} ${centerY - 6}`}
                fill="none"
                stroke="transparent"
                strokeWidth="12"
              />
              <path
                d={`M ${startX} ${centerY - 6} Q ${midX} ${centerY - arcHeight - 6} ${endX} ${centerY - 6}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className={isSelected ? 'text-destructive' : 'text-primary'}
              />
            </g>
          );
        } else if (conn.type === 'pull-off') {
          const arcHeight = 12;
          
          return (
            <g key={conn.id} className="pointer-events-auto cursor-pointer" onClick={(e) => handleClick(e, conn.id)}>
              <path
                d={`M ${startX} ${centerY + 6} Q ${midX} ${centerY + arcHeight + 6} ${endX} ${centerY + 6}`}
                fill="none"
                stroke="transparent"
                strokeWidth="12"
              />
              <path
                d={`M ${startX} ${centerY + 6} Q ${midX} ${centerY + arcHeight + 6} ${endX} ${centerY + 6}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className={isSelected ? 'text-destructive' : 'text-secondary-foreground'}
              />
            </g>
          );
        } else if (conn.type === 'slide') {
          return (
            <g key={conn.id} className="pointer-events-auto cursor-pointer" onClick={(e) => handleClick(e, conn.id)}>
              <line
                x1={startX + 4}
                y1={centerY + 4}
                x2={endX - 4}
                y2={centerY - 4}
                stroke="transparent"
                strokeWidth="12"
              />
              <line
                x1={startX + 4}
                y1={centerY + 4}
                x2={endX - 4}
                y2={centerY - 4}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className={isSelected ? 'text-destructive' : 'text-primary'}
              />
            </g>
          );
        }
        
        return null;
      })}
    </svg>
  );
}