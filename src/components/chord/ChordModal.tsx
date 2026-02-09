import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { findChordFull } from '@/lib/chordDatabaseFull';
import { ChordDiagram } from './ChordDiagram';

interface ChordModalProps {
  chordName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChordModal({ chordName, open, onOpenChange }: ChordModalProps) {
  const chord = chordName ? findChordFull(chordName) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {chordName || 'Аккорд'}
          </DialogTitle>
        </DialogHeader>

        {chord ? (
          <div className="flex flex-wrap justify-center gap-6 py-4">
            {chord.voicings.map((voicing, i) => (
              <ChordDiagram
                key={i}
                voicing={voicing}
                chordName={`Вариант ${i + 1}`}
                size="md"
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Аккорд <span className="font-bold text-foreground">{chordName}</span> не найден в справочнике
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
