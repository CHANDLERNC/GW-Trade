import { CategoryInfo, Category } from '@/types';

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
