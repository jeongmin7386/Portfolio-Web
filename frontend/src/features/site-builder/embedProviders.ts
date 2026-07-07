export type EmbedProviderKey =
  | 'youtube'
  | 'vimeo'
  | 'figma'
  | 'github'
  | 'notion'
  | 'pdf'
  | 'codepen'
  | 'googleDrive'
  | 'map'
  | 'iframe';

export type EmbedProvider = {
  key: EmbedProviderKey;
  label: string;
  renderType: 'iframe' | 'card';
  aspectRatio?: string;
  sandbox?: string;
  detect: (url: string) => boolean;
  transformUrl: (url: string) => string;
};

const iframeSandbox = 'allow-scripts allow-same-origin allow-popups allow-forms allow-presentation';

function urlParts(url: string) {
  try {
    return new URL(url.trim());
  } catch {
    return null;
  }
}

function youtubeId(url: string) {
  const parsed = urlParts(url);
  if (!parsed) {
    return '';
  }
  if (parsed.hostname.includes('youtu.be')) {
    return parsed.pathname.replace('/', '').split('/')[0] ?? '';
  }
  if (parsed.pathname.includes('/embed/')) {
    return parsed.pathname.split('/embed/')[1]?.split('/')[0] ?? '';
  }
  if (parsed.pathname.includes('/shorts/')) {
    return parsed.pathname.split('/shorts/')[1]?.split('/')[0] ?? '';
  }
  return parsed.searchParams.get('v') ?? '';
}

function vimeoId(url: string) {
  const parsed = urlParts(url);
  if (!parsed) {
    return '';
  }
  const parts = parsed.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

export function parseGithubRepository(url: string) {
  const parsed = urlParts(url);
  if (!parsed || !parsed.hostname.includes('github.com')) {
    return null;
  }
  const [owner, repo] = parsed.pathname.split('/').filter(Boolean);
  if (!owner || !repo) {
    return null;
  }
  return {
    owner,
    repo: repo.replace(/\.git$/, ''),
    label: `${owner}/${repo.replace(/\.git$/, '')}`
  };
}

export const embedProviders: Record<EmbedProviderKey, EmbedProvider> = {
  youtube: {
    key: 'youtube',
    label: 'YouTube',
    renderType: 'iframe',
    aspectRatio: '16 / 9',
    sandbox: iframeSandbox,
    detect: (url) => /youtu\.be|youtube\.com/.test(url),
    transformUrl: (url) => {
      const id = youtubeId(url);
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
  },
  vimeo: {
    key: 'vimeo',
    label: 'Vimeo',
    renderType: 'iframe',
    aspectRatio: '16 / 9',
    sandbox: iframeSandbox,
    detect: (url) => /vimeo\.com/.test(url),
    transformUrl: (url) => {
      const id = vimeoId(url);
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
  },
  figma: {
    key: 'figma',
    label: 'Figma',
    renderType: 'iframe',
    aspectRatio: '16 / 9',
    sandbox: iframeSandbox,
    detect: (url) => /figma\.com/.test(url),
    transformUrl: (url) => `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`
  },
  github: {
    key: 'github',
    label: 'GitHub Repository',
    renderType: 'card',
    detect: (url) => /github\.com/.test(url),
    transformUrl: (url) => url
  },
  notion: {
    key: 'notion',
    label: 'Notion',
    renderType: 'card',
    detect: (url) => /notion\.site|notion\.so/.test(url),
    transformUrl: (url) => url
  },
  pdf: {
    key: 'pdf',
    label: 'PDF',
    renderType: 'iframe',
    aspectRatio: '4 / 3',
    sandbox: iframeSandbox,
    detect: (url) => /\.pdf($|\?)/i.test(url),
    transformUrl: (url) => url
  },
  codepen: {
    key: 'codepen',
    label: 'CodePen',
    renderType: 'iframe',
    aspectRatio: '16 / 9',
    sandbox: iframeSandbox,
    detect: (url) => /codepen\.io/.test(url),
    transformUrl: (url) => url.replace('/pen/', '/embed/')
  },
  googleDrive: {
    key: 'googleDrive',
    label: 'Google Drive',
    renderType: 'iframe',
    aspectRatio: '4 / 3',
    sandbox: iframeSandbox,
    detect: (url) => /drive\.google\.com|docs\.google\.com/.test(url),
    transformUrl: (url) => url.replace('/view', '/preview')
  },
  map: {
    key: 'map',
    label: 'Map',
    renderType: 'iframe',
    aspectRatio: '16 / 9',
    sandbox: iframeSandbox,
    detect: (url) => /google\..*\/maps|maps\.app\.goo\.gl|naver\.me|map\.kakao\.com/.test(url),
    transformUrl: (url) => url
  },
  iframe: {
    key: 'iframe',
    label: 'Custom iframe',
    renderType: 'iframe',
    aspectRatio: '16 / 9',
    sandbox: iframeSandbox,
    detect: () => true,
    transformUrl: (url) => url
  }
};

export const embedProviderOptions = Object.values(embedProviders);

export function detectEmbedProvider(url: string): EmbedProviderKey {
  const match = embedProviderOptions.find((provider) => provider.key !== 'iframe' && provider.detect(url));
  return match?.key ?? 'iframe';
}

export function resolveEmbedProvider(provider: unknown, url: string) {
  if (typeof provider === 'string' && provider in embedProviders) {
    return embedProviders[provider as EmbedProviderKey];
  }
  return embedProviders[detectEmbedProvider(url)];
}
