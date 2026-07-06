export type PortfolioTemplate = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  background: string;
  layout: string;
  imageUrl: string;
  sections: string[];
};

export const portfolioTemplates: PortfolioTemplate[] = [
  {
    id: 'MINIMAL_PORTFOLIO',
    name: 'Minimal Portfolio',
    tagline: 'Editorial grid for focused work',
    description: 'Large images, restrained typography, and quiet navigation for a refined portfolio.',
    accent: '#111111',
    background: '#f6f3ed',
    layout: 'Grid',
    imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    sections: ['Hero', 'Selected work', 'About', 'Contact']
  },
  {
    id: 'DEVELOPER_PORTFOLIO',
    name: 'Developer Portfolio',
    tagline: 'Product, code, and live demos',
    description: 'A launch-ready layout for technical projects, links, stacks, and case study notes.',
    accent: '#0a84ff',
    background: '#f7f8f4',
    layout: 'Split hero',
    imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
    sections: ['Intro', 'Project gallery', 'Stack', 'Links']
  },
  {
    id: 'DESIGNER_PORTFOLIO',
    name: 'Designer Portfolio',
    tagline: 'Bold visual storytelling',
    description: 'Immersive project covers, compact credits, and a polished case study rhythm.',
    accent: '#ff5a3d',
    background: '#fff8f2',
    layout: 'Magazine',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    sections: ['Cover', 'Case studies', 'Services', 'Contact']
  },
  {
    id: 'PHOTOGRAPHY_GRID',
    name: 'Photography Grid',
    tagline: 'Image-first gallery wall',
    description: 'A dense, gallery-like layout for photography, visual art, and image-led work.',
    accent: '#16856f',
    background: '#f4f2ec',
    layout: 'Masonry',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    sections: ['Gallery', 'Series', 'Journal', 'Contact']
  },
  {
    id: 'CASE_STUDY_LAYOUT',
    name: 'Case Study Layout',
    tagline: 'Long-form project narrative',
    description: 'A structured page for problem, process, result, stack, and external links.',
    accent: '#c48a2c',
    background: '#fbfaf6',
    layout: 'Story',
    imageUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
    sections: ['Problem', 'Process', 'Outcome', 'Credits']
  }
];

export function findPortfolioTemplate(templateId?: string) {
  if (templateId === 'MINIMAL_GRID') {
    return portfolioTemplates[0];
  }
  return portfolioTemplates.find((template) => template.id === templateId) ?? portfolioTemplates[0];
}
