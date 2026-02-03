import { Collection } from '@/types/collection';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CollectionSelectProps {
  collections: Collection[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  allowNone?: boolean;
}

export function CollectionSelect({ 
  collections, 
  value, 
  onChange, 
  placeholder = 'Выберите коллекцию',
  allowNone = true,
}: CollectionSelectProps) {
  return (
    <Select 
      value={value ?? 'none'} 
      onValueChange={(v) => onChange(v === 'none' ? null : v)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && (
          <SelectItem value="none">Без коллекции</SelectItem>
        )}
        {collections.map((collection) => (
          <SelectItem key={collection.id} value={collection.id}>
            {collection.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
