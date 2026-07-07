import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { api, ApiError, type CategoryDto } from '@pos/api-client';
import { FormSelect } from '@/components/form-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const CREATE_VALUE = '__create_category__';

type CategoryPickerProps = {
  categories: CategoryDto[];
  value: string;
  onValueChange: (value: string) => void;
  onCategoriesChange: (categories: CategoryDto[]) => void;
  label?: string;
};

export function CategoryPicker({
  categories,
  value,
  onValueChange,
  onCategoriesChange,
  label = 'Category',
}: CategoryPickerProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const options = [
    { value: '', label: 'No category' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
    { value: CREATE_VALUE, label: '+ Add new category…' },
  ];

  const handleSelect = (v: string) => {
    if (v === CREATE_VALUE) {
      setCreating(true);
      setNewName('');
      return;
    }
    onValueChange(v);
  };

  const saveCategory = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const created = await api.createCategory({
        name: newName.trim(),
        sortOrder: categories.length,
      });
      onCategoriesChange([...categories, created].sort((a, b) => a.sortOrder - b.sortOrder));
      onValueChange(created.id);
      setCreating(false);
      setNewName('');
      toast.success(`Category "${created.name}" added`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <FormSelect
        label={label}
        value={creating ? '' : value}
        onValueChange={handleSelect}
        options={options}
        placeholder="Choose a category"
      />
      {creating && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
          <Label className="text-xs text-muted-foreground">New category name</Label>
          <div className="flex gap-2">
            <Input
              autoFocus
              placeholder="e.g. Beverages"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveCategory()}
            />
            <Button type="button" size="sm" onClick={saveCategory} disabled={saving || !newName.trim()}>
              <PlusIcon data-icon="inline-start" />
              Add
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
