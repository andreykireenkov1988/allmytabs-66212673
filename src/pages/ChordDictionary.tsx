import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChordDiagram } from '@/components/chord/ChordDiagram';
import { CHORD_DATABASE, ROOT_NOTES, CHORD_TYPES, getChordTypeLabel } from '@/lib/chordDatabase';
import { Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function ChordDictionary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filteredChords = useMemo(() => {
    let chords = CHORD_DATABASE;

    // Remove duplicates (H = B, Bb = A#)
    const seen = new Set<string>();
    chords = chords.filter(c => {
      if (seen.has(c.key)) return false;
      seen.add(c.key);
      return true;
    });

    if (search) {
      const q = search.toLowerCase();
      chords = chords.filter(c => c.name.toLowerCase().includes(q));
    }

    if (selectedRoot) {
      chords = chords.filter(c => {
        const root = c.key.match(/^[A-H][#b]?/)?.[0];
        return root === selectedRoot;
      });
    }

    if (selectedType !== null) {
      chords = chords.filter(c => {
        const type = c.key.replace(/^[A-H][#b]?/, '');
        return type === selectedType;
      });
    }

    return chords;
  }, [search, selectedRoot, selectedType]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {/* Back button */}
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4 -ml-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            К табам
          </Button>
        )}

        <h1 className="text-2xl font-bold text-foreground mb-6">Справочник аккордов</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск аккорда (Am, C7, F#m...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Root filter */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Button
            variant={selectedRoot === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRoot(null)}
            className="h-7 text-xs px-2"
          >
            Все
          </Button>
          {ROOT_NOTES.map(note => (
            <Button
              key={note}
              variant={selectedRoot === note ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRoot(selectedRoot === note ? null : note)}
              className="h-7 text-xs px-2 min-w-[2rem]"
            >
              {note}
            </Button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          <Button
            variant={selectedType === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(null)}
            className="h-7 text-xs px-2"
          >
            Все типы
          </Button>
          {CHORD_TYPES.map(type => (
            <Button
              key={type || '_major'}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(selectedType === type ? null : type)}
              className="h-7 text-xs px-2"
            >
              {getChordTypeLabel(type)}
            </Button>
          ))}
        </div>

        {/* Chord grid */}
        {filteredChords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Аккорды не найдены
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredChords.map(chord => (
              <div key={chord.key} className="glass-card p-4 flex flex-col items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">{chord.name}</h3>
                <div className="flex flex-col gap-4">
                  {chord.voicings.map((voicing, i) => (
                    <ChordDiagram
                      key={i}
                      voicing={voicing}
                      chordName={chord.voicings.length > 1 ? `Вар. ${i + 1}` : ''}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
