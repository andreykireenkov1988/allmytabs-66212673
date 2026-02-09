import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChordDiagram } from '@/components/chord/ChordDiagram';
import { getAllChords } from '@/lib/chordDatabaseFull';
import { Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ROOT_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

const SUFFIX_GROUPS = [
  { label: 'Основные', suffixes: ['', 'm', '7', 'm7', 'maj7'] },
  { label: 'Sus', suffixes: ['sus2', 'sus4', '7sus4'] },
  { label: 'Расширенные', suffixes: ['9', '11', '13', 'maj9', 'maj11', 'maj13', 'm9', 'm11'] },
  { label: 'Другие', suffixes: ['dim', 'dim7', 'aug', '5', '6', 'add9', 'madd9', '7b5', '7b9', '7#9'] },
];

export default function ChordDictionary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [selectedSuffix, setSelectedSuffix] = useState<string | null>(null);
  const [expandedChord, setExpandedChord] = useState<string | null>(null);

  const allChords = useMemo(() => {
    const chords = getAllChords();
    // Remove H duplicates from listing
    return chords.filter(c => !c.key.startsWith('H'));
  }, []);

  const filteredChords = useMemo(() => {
    let chords = allChords;

    if (search) {
      const q = search.toLowerCase();
      chords = chords.filter(c => c.name.toLowerCase().includes(q));
    }

    if (selectedRoot) {
      chords = chords.filter(c => {
        const root = c.key.match(/^[A-G][#b]?/)?.[0];
        return root === selectedRoot;
      });
    }

    if (selectedSuffix !== null) {
      chords = chords.filter(c => {
        const suffix = c.key.replace(/^[A-G][#b]?/, '');
        return suffix === selectedSuffix;
      });
    }

    return chords;
  }, [allChords, search, selectedRoot, selectedSuffix]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
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

        <h1 className="text-2xl font-bold text-foreground mb-2">Справочник аккордов</h1>
        <p className="text-sm text-muted-foreground mb-6">{allChords.length} аккордов в базе</p>

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
            Все ноты
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

        {/* Suffix filter by groups */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          <Button
            variant={selectedSuffix === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSuffix(null)}
            className="h-7 text-xs px-2"
          >
            Все типы
          </Button>
          {SUFFIX_GROUPS.map(group => (
            group.suffixes.map(suffix => (
              <Button
                key={suffix || '_major'}
                variant={selectedSuffix === suffix ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSuffix(selectedSuffix === suffix ? null : suffix)}
                className="h-7 text-xs px-2"
              >
                {suffix || 'Мажор'}
              </Button>
            ))
          ))}
        </div>

        {/* Chord grid */}
        {filteredChords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Аккорды не найдены
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredChords.map(chord => {
              const isExpanded = expandedChord === chord.key;
              return (
                <div
                  key={chord.key}
                  className="glass-card p-3 flex flex-col items-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setExpandedChord(isExpanded ? null : chord.key)}
                >
                  <h3 className="text-base font-bold text-foreground mb-2">{chord.name}</h3>
                  {/* Always show first voicing */}
                  <ChordDiagram
                    voicing={chord.voicings[0]}
                    chordName=""
                    size="sm"
                  />
                  {/* Show remaining voicings when expanded */}
                  {isExpanded && chord.voicings.length > 1 && (
                    <div className="mt-3 flex flex-col gap-3 border-t border-border/50 pt-3">
                      {chord.voicings.slice(1).map((voicing, i) => (
                        <ChordDiagram
                          key={i}
                          voicing={voicing}
                          chordName={`Вар. ${i + 2}`}
                          size="sm"
                        />
                      ))}
                    </div>
                  )}
                  {chord.voicings.length > 1 && (
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {isExpanded ? 'свернуть' : `ещё ${chord.voicings.length - 1} вар.`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
