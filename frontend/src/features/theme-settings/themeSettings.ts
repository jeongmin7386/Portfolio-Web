export type ThemeDraft = {
  accentColor: string;
  fontFamily: string;
  spacing: number;
  background: string;
  buttonStyle: string;
};

export const defaultThemeDraft: ThemeDraft = {
  accentColor: '#111111',
  fontFamily: 'Pretendard',
  spacing: 32,
  background: '#f7f4ee',
  buttonStyle: 'Sharp'
};

export const fontOptions = ['Pretendard', 'Noto Sans KR', 'Inter', 'Georgia', 'Mono'];
export const buttonStyleOptions = ['Sharp', 'Soft', 'Outline'];
export const backgroundOptions = ['#f7f4ee', '#ffffff', '#f1f6f4', '#fff7ef', '#101010'];
