export interface NameColor {
  id: string;
  hex: string;
  label: string;
  unlockHint: string;
  isLocked: (trades: number) => boolean;
}

export const NAME_COLORS: NameColor[] = [
  { id: 'default', hex: '#E8EAF0', label: 'Standard', unlockHint: 'Available to all',    isLocked: () => false },
  { id: 'amber',   hex: '#E8B84B', label: 'Amber',    unlockHint: 'Complete 1 trade',    isLocked: (t) => t < 1 },
  { id: 'lri',     hex: '#5B8A6E', label: 'LRI',      unlockHint: 'Complete 5 trades',   isLocked: (t) => t < 5 },
  { id: 'mss',     hex: '#4A6FA5', label: 'MSS',      unlockHint: 'Complete 5 trades',   isLocked: (t) => t < 5 },
  { id: 'csi',     hex: '#B83C3C', label: 'CSI',      unlockHint: 'Complete 5 trades',   isLocked: (t) => t < 5 },
  { id: 'teal',    hex: '#00BCD4', label: 'Teal',     unlockHint: 'Complete 15 trades',  isLocked: (t) => t < 15 },
  { id: 'purple',  hex: '#9C27B0', label: 'Purple',   unlockHint: 'Complete 30 trades',  isLocked: (t) => t < 30 },
];

export const DEFAULT_NAME_COLOR = '#E8EAF0';

export function resolveNameColor(color: string | null | undefined): string {
  if (!color) return DEFAULT_NAME_COLOR;
  return color;
}
