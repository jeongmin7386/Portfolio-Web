import { backgroundOptions, buttonStyleOptions, fontOptions, type ThemeDraft } from '../features/theme-settings/themeSettings';

type DesignSettingsPanelProps = {
  theme: ThemeDraft;
  onChange: (theme: ThemeDraft) => void;
};

const buttonStyleLabels: Record<string, string> = {
  Sharp: '각진 버튼',
  Soft: '부드러운 버튼',
  Outline: '라인 버튼'
};

export function DesignSettingsPanel({ theme, onChange }: DesignSettingsPanelProps) {
  function patch(next: Partial<ThemeDraft>) {
    onChange({ ...theme, ...next });
  }

  return (
    <div className="design-panel">
      <div className="inspector-heading">
        <div>
          <p className="panel-label">디자인 설정</p>
          <h2>시각 스타일</h2>
        </div>
      </div>

      <label className="field">
        <span>포인트 색상</span>
        <div className="color-control">
          <input type="color" value={theme.accentColor} onChange={(event) => patch({ accentColor: event.target.value })} />
          <span>{theme.accentColor}</span>
        </div>
      </label>

      <label className="field">
        <span>폰트</span>
        <select value={theme.fontFamily} onChange={(event) => patch({ fontFamily: event.target.value })}>
          {fontOptions.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>여백</span>
        <div className="range-row">
          <input type="range" min="18" max="56" value={theme.spacing} onChange={(event) => patch({ spacing: Number(event.target.value) })} />
          <strong>{theme.spacing}px</strong>
        </div>
      </label>

      <label className="field">
        <span>배경</span>
        <div className="swatch-row">
          {backgroundOptions.map((background) => (
            <button
              key={background}
              type="button"
              className={theme.background === background ? 'active' : ''}
              style={{ background }}
              aria-label={`${background} 배경 사용`}
              onClick={() => patch({ background })}
            />
          ))}
        </div>
      </label>

      <label className="field">
        <span>버튼 스타일</span>
        <select value={theme.buttonStyle} onChange={(event) => patch({ buttonStyle: event.target.value })}>
          {buttonStyleOptions.map((style) => (
            <option key={style} value={style}>
              {buttonStyleLabels[style] ?? style}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
