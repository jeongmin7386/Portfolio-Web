import type { FormEvent } from 'react';
import { Input } from '../../components/ui/Input';
import { TagInput } from '../../components/ui/TagInput';
import { Textarea } from '../../components/ui/Textarea';
import { Toggle } from '../../components/ui/Toggle';
import type { Category } from '../../lib/types';
import type { ProjectDraft } from './projectDraft';

type ProjectBuilderFormProps = {
  draft: ProjectDraft;
  categories: Category[];
  isSaving: boolean;
  onChange: (draft: ProjectDraft) => void;
  onSubmit: () => void;
};

export function ProjectBuilderForm({ draft, categories, isSaving, onChange, onSubmit }: ProjectBuilderFormProps) {
  function patch(next: Partial<ProjectDraft>) {
    onChange({ ...draft, ...next });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="builder-form" onSubmit={handleSubmit}>
      <div className="inspector-section">
        <div className="inspector-heading">
          <p className="panel-label">Project management</p>
          <Toggle checked={draft.isPublic} onChange={(isPublic) => patch({ isPublic })} label={draft.isPublic ? 'Published' : 'Private'} />
        </div>

        <Input
          label="Project title"
          value={draft.title}
          onChange={(event) => patch({ title: event.target.value })}
          placeholder="AI Portfolio Builder"
          required
        />
        <Textarea
          label="Short description"
          value={draft.description}
          onChange={(event) => patch({ description: event.target.value })}
          placeholder="A concise summary that appears on your portfolio grid."
          rows={4}
        />
      </div>

      <div className="inspector-section">
        <label className="field">
          <span>Category</span>
          <select value={draft.categoryId} onChange={(event) => patch({ categoryId: event.target.value ? Number(event.target.value) : '' })}>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <TagInput label="Technology stack" value={draft.techStacks} onChange={(techStacks) => patch({ techStacks })} />
      </div>

      <div className="inspector-section">
        <Input label="GitHub link" value={draft.githubUrl} onChange={(event) => patch({ githubUrl: event.target.value })} placeholder="https://github.com/..." />
        <Input label="Live site link" value={draft.liveUrl} onChange={(event) => patch({ liveUrl: event.target.value })} placeholder="https://..." />
        <Input
          label="Sort order"
          type="number"
          value={draft.sortOrder}
          onChange={(event) => patch({ sortOrder: Number(event.target.value) })}
        />
      </div>

      <div className="inspector-section">
        <Textarea
          label="Case Study body"
          value={draft.caseStudy}
          onChange={(event) => patch({ caseStudy: event.target.value })}
          placeholder="Problem, process, decisions, outcomes, and credits."
          rows={8}
        />
      </div>

      <button className="button button-primary inspector-save" type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save project'}
      </button>
    </form>
  );
}
