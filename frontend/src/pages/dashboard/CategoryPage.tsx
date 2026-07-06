import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../../features/categories/categoryApi';

export function CategoryPage() {
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const [name, setName] = useState('');
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      setName('');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, nextName, sortOrder }: { id: number; nextName: string; sortOrder: number }) =>
      updateCategory(id, { name: nextName, sortOrder }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate({ name });
  }

  return (
    <section className="page-section narrow-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Categories</h1>
        </div>
      </div>

      <form className="inline-form" onSubmit={handleSubmit}>
        <Input label="새 카테고리" value={name} onChange={(event) => setName(event.target.value)} required />
        <Button type="submit" disabled={createMutation.isPending}>
          추가
        </Button>
      </form>

      <div className="list-panel">
        {categoriesQuery.data?.map((category) => (
          <div key={category.id} className="editable-row">
            <input
              defaultValue={category.name}
              onBlur={(event) => {
                const nextName = event.target.value.trim();
                if (nextName && nextName !== category.name) {
                  updateMutation.mutate({ id: category.id, nextName, sortOrder: category.sortOrder });
                }
              }}
            />
            <span>{category.slug}</span>
            <Button variant="ghost" onClick={() => deleteMutation.mutate(category.id)}>
              삭제
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
