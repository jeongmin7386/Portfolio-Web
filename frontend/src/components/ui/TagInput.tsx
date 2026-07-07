import { useState } from 'react';

type TagInputProps = {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
};

export function TagInput({ label, value, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('');

  function addTag() {
    const next = draft.trim();
    if (!next || value.includes(next)) {
      setDraft('');
      return;
    }
    onChange([...value, next]);
    setDraft('');
  }

  return (
    <label className="field">
      <span>{label}</span>
      <div className="tag-input">
        <div className="tag-list">
          {value.map((tag) => (
            <button key={tag} type="button" onClick={() => onChange(value.filter((item) => item !== tag))}>
              {tag}
              <span aria-hidden="true"> x</span>
            </button>
          ))}
        </div>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder="React"
        />
      </div>
    </label>
  );
}
