export interface ColorScheme {
  background: string;
  surface: string;
  sidebarBg: string;
  noteListBg: string;
  border: string;
  text: string;
  textSecondary: string;
  textPlaceholder: string;
  accent: string;
  accentMuted: string;
  sidebarText: string;
  sidebarTextSecondary: string;
  sidebarHoverBg: string;
  sidebarAccent: string;
  sidebarAccentMuted: string;
}

export type SchemeName = 'current' | 'pink-sorbet' | 'black-and-white' | 'minimal' | 'dark';

export const schemes: Record<SchemeName, ColorScheme> = {
  current: {
    background: '#F7F5F0',
    surface: '#FFFFFF',
    sidebarBg: '#EDE9E1',
    noteListBg: '#F2EEE8',
    border: '#E0DAD0',
    text: '#1C1C1E',
    textSecondary: '#8A8480',
    textPlaceholder: '#B5AFA8',
    accent: '#D94F3D',
    accentMuted: 'rgba(217, 79, 61, 0.12)',
    sidebarText: '#1C1C1E',
    sidebarTextSecondary: '#8A8480',
    sidebarHoverBg: '#F2EEE8',
    sidebarAccent: '#D94F3D',
    sidebarAccentMuted: 'rgba(217, 79, 61, 0.12)',
  },
  'pink-sorbet': {
    background: '#FFF5F8',
    surface: '#FFFFFF',
    sidebarBg: '#FFE8F0',
    noteListBg: '#FFF0F5',
    border: '#F5C5D8',
    text: '#2A1520',
    textSecondary: '#9E6B80',
    textPlaceholder: '#C9A0B5',
    accent: '#E91E8C',
    accentMuted: 'rgba(233, 30, 140, 0.10)',
    sidebarText: '#2A1520',
    sidebarTextSecondary: '#9E6B80',
    sidebarHoverBg: '#FFF0F5',
    sidebarAccent: '#E91E8C',
    sidebarAccentMuted: 'rgba(233, 30, 140, 0.10)',
  },
  'black-and-white': {
    background: '#F2F2F2',
    surface: '#FFFFFF',
    sidebarBg: '#E5E5E5',
    noteListBg: '#EBEBEB',
    border: '#D5D5D5',
    text: '#111111',
    textSecondary: '#555555',
    textPlaceholder: '#999999',
    accent: '#222222',
    accentMuted: 'rgba(0, 0, 0, 0.07)',
    sidebarText: '#111111',
    sidebarTextSecondary: '#555555',
    sidebarHoverBg: '#DCDCDC',
    sidebarAccent: '#222222',
    sidebarAccentMuted: 'rgba(0, 0, 0, 0.07)',
  },
  minimal: {
    background: '#FAFAF9',
    surface: '#FFFFFF',
    sidebarBg: '#F5F4F0',
    noteListBg: '#FAF9F6',
    border: '#E8E8E3',
    text: '#1A1A1A',
    textSecondary: '#8A8A8A',
    textPlaceholder: '#B0B0B0',
    accent: '#6C63FF',
    accentMuted: 'rgba(108, 99, 255, 0.10)',
    sidebarText: '#1A1A1A',
    sidebarTextSecondary: '#8A8A8A',
    sidebarHoverBg: '#EEECEA',
    sidebarAccent: '#6C63FF',
    sidebarAccentMuted: 'rgba(108, 99, 255, 0.10)',
  },
  dark: {
    background: '#0D0D0D',
    surface: '#111111',
    sidebarBg: '#FFFFFF',
    noteListBg: '#1E1E1E',
    border: '#2A2A2A',
    text: '#E8E8E8',
    textSecondary: '#888888',
    textPlaceholder: '#444444',
    accent: '#AAAAAA',
    accentMuted: 'rgba(255, 255, 255, 0.06)',
    sidebarText: '#111111',
    sidebarTextSecondary: '#666666',
    sidebarHoverBg: '#F0F0F0',
    sidebarAccent: '#1A1A1A',
    sidebarAccentMuted: 'rgba(0, 0, 0, 0.07)',
  },
};

export const schemeLabels: Record<SchemeName, string> = {
  current: 'Current',
  'pink-sorbet': 'Pink Sorbet',
  'black-and-white': 'Black & White',
  minimal: 'Minimal',
  dark: 'Dark',
};
