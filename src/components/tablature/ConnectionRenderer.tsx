import { TablatureConnection } from '@/types/tablature';

interface ConnectionRendererProps {
  connections: TablatureConnection[];
  stringIndex: number;
  cellWidth: number;
  cellHeight: number;
  selectedConnectionId?: string | null;
  onConnectionClick?: (connectionId: string) => void;
}

export function ConnectionRenderer({ 
  connections, 
  stringIndex, 
  cellWidth, 
  cellHeight,
  selectedConnectionId,
  onConnectionClick
}: ConnectionRendererProps) {
  const stringConnections = connections.filter(c => c.stringIndex === stringIndex);
  
  if (stringConnections.length === 0) return null;

  const handleClick = (e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    onConnectionClick?.(connectionId);
  };

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
        } else if (conn.type === 'bend') {
          const arrowSize = 4;
          
          return (
            <g key={conn.id} className={`pointer-events-auto cursor-pointer ${isSelected ? 'text-destructive' : 'text-accent-foreground'}`} onClick={(e) => handleClick(e, conn.id)}>
              <path
                d={`M ${startX} ${centerY + 4} Q ${midX} ${centerY - 10} ${endX} ${centerY - 8}`}
                fill="none"
                stroke="transparent"
                strokeWidth="12"
              />
              <path
                d={`M ${startX} ${centerY + 4} Q ${midX} ${centerY - 10} ${endX} ${centerY - 8}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
              />
              <path
                d={`M ${endX - arrowSize} ${centerY - 8 - arrowSize} L ${endX} ${centerY - 8} L ${endX - arrowSize} ${centerY - 8 + arrowSize}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
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