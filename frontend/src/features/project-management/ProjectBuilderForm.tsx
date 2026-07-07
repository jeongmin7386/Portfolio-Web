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
          <p className="panel-label">프로젝트 관리</p>
          <Toggle checked={draft.isPublic} onChange={(isPublic) => patch({ isPublic })} label={draft.isPublic ? '게시됨' : '비공개'} />
        </div>

        <Input
          label="프로젝트 제목"
          value={draft.title}
          onChange={(event) => patch({ title: event.target.value })}
          placeholder="AI 포트폴리오 빌더"
          required
        />
        <Textarea
          label="짧은 설명"
          value={draft.description}
          onChange={(event) => patch({ description: event.target.value })}
          placeholder="포트폴리오 갤러리에 보일 짧은 소개를 작성하세요."
          rows={4}
        />
      </div>

      <div className="inspector-section">
        <label className="field">
          <span>카테고리</span>
          <select value={draft.categoryId} onChange={(event) => patch({ categoryId: event.target.value ? Number(event.target.value) : '' })}>
            <option value="">카테고리 선택</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <TagInput label="사용 기술" value={draft.techStacks} onChange={(techStacks) => patch({ techStacks })} />
      </div>

      <div className="inspector-section">
        <Input label="GitHub 링크" value={draft.githubUrl} onChange={(event) => patch({ githubUrl: event.target.value })} placeholder="https://github.com/..." />
        <Input label="배포 링크" value={draft.liveUrl} onChange={(event) => patch({ liveUrl: event.target.value })} placeholder="https://..." />
        <Input
          label="정렬 순서"
          type="number"
          value={draft.sortOrder}
          onChange={(event) => patch({ sortOrder: Number(event.target.value) })}
        />
      </div>

      <div className="inspector-section">
        <Textarea
          label="케이스 스터디 본문"
          value={draft.caseStudy}
          onChange={(event) => patch({ caseStudy: event.target.value })}
          placeholder="문제 정의, 작업 과정, 의사결정, 결과와 배운 점을 정리하세요."
          rows={8}
        />
      </div>

      <button className="button button-primary inspector-save" type="submit" disabled={isSaving}>
        {isSaving ? '저장 중...' : '프로젝트 저장'}
      </button>
    </form>
  );
}
