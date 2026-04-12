export interface NameColor {
  id: string;
  hex: string;
  label: string;
}

export const NAME_COLORS: NameColor[] = [
  { id: 'default', hex: '#E8EAF0', label: 'Standard' },
  { id: 'amber',   hex: '#E8B84B', label: 'Amber'    },
  { id: 'lri',     hex: '#5B8A6E', label: 'LRI'      },
  { id: 'mss',     hex: '#4A6FA5', label: 'MSS'      },
  { id: 'csi',     hex: '#B83C3C', label: 'CSI'      },
  { id: 'teal',    hex: '#00BCD4', label: 'Teal'     },
  { id: 'purple',  hex: '#9C27B0', label: 'Purple'   },
];

export const DEFAULT_NAME_COLOR = '#E8EAF0';

export function resolveNameColor(color: string | null | undefined): string {
  if (!color) return DEFAULT_NAME_COLOR;
  return color;
}
