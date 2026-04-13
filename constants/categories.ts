import { CategoryInfo, Category } from '@/types';
import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const CATEGORIES: Record<Category, CategoryInfo> = {
  keys: {
    id: 'keys',
    name: 'Keys',
    icon: 'key',
    description: 'Building keys, bunker keys, and access cards',
  },
  gear: {
    id: 'gear',
    name: 'Gear',
    icon: 'shield',
    description: 'Armor, helmets, vests, and tactical equipment',
  },
  items: {
    id: 'items',
    name: 'Items',
    icon: 'cube',
    description: 'Consumables, attachments, and miscellaneous items',
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

export const CATEGORY_META: Record<Category, { icon: IoniconName; color: string }> = {
  keys:  { icon: 'key',    color: '#E8B84B' },
  gear:  { icon: 'shield', color: '#4A6FA5' },
  items: { icon: 'cube',   color: '#5B8A6E' },
};

export const TACTICAL_STATUS = [
  'Back on duty, Operator',
  'Standby for intel, Operator',
  'Zone secured — trading open',
  'Operator on station',
  'All units reporting in',
  'Sitrep: market active',
  'Welcome back to the field',
  'Eyes on the market, Operator',
  'Patrol resumed — good to see you',
  'Gear check complete, Operator',
  'Comms re-established',
  'Area clear — market is live',
] as const;
