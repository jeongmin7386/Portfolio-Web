import { backgroundOptions, buttonStyleOptions, fontOptions, type ThemeDraft } from '../features/theme-settings/themeSettings';

type DesignSettingsPanelProps = {
  theme: ThemeDraft;
  onChange: (theme: ThemeDraft) => void;
};

export function DesignSettingsPanel({ theme, onChange }: DesignSettingsPanelProps) {
  function patch(next: Partial<ThemeDraft>) {
    onChange({ ...theme, ...next });
  }

  return (
    <div className="design-panel">
      <div className="inspector-heading">
        <div>
          <p className="panel-label">Design settings</p>
          <h2>Visual system</h2>
        </div>
      </div>

      <label className="field">
        <span>Accent color</span>
        <div className="color-control">
          <input type="color" value={theme.accentColor} onChange={(event) => patch({ accentColor: event.target.value })} />
          <span>{theme.accentColor}</span>
        </div>
      </label>

      <label className="field">
        <span>Font</span>
        <select value={theme.fontFamily} onChange={(event) => patch({ fontFamily: event.target.value })}>
          {fontOptions.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Spacing</span>
        <div className="range-row">
          <input type="range" min="18" max="56" value={theme.spacing} onChange={(event) => patch({ spacing: Number(event.target.value) })} />
          <strong>{theme.spacing}px</strong>
        </div>
      </label>

      <label className="field">
        <span>Background</span>
        <div className="swatch-row">
          {backgroundOptions.map((background) => (
            <button
              key={background}
              type="button"
              className={theme.background === background ? 'active' : ''}
              style={{ background }}
              aria-label={`Use ${background} background`}
              onClick={() => patch({ background })}
            />
          ))}
        </div>
      </label>

      <label className="field">
        <span>Button style</span>
        <select value={theme.buttonStyle} onChange={(event) => patch({ buttonStyle: event.target.value })}>
          {buttonStyleOptions.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
