import { Faction, FactionSlug } from '@/types';

export const FACTIONS: Record<FactionSlug, Faction> = {
  lri: {
    id: 'lri',
    name: 'Lamang Recovery Initiative',
    shortName: 'LRI',
    color: '#5B8A6E',
    description: 'A recovery and salvage faction operating deep in the gray zone.',
  },
  mss: {
    id: 'mss',
    name: 'Mithras Security Systems',
    shortName: 'MSS',
    color: '#4A6FA5',
    description: 'A private military contractor providing security and enforcement.',
  },
  csi: {
    id: 'csi',
    name: 'Crimson Shield International',
    shortName: 'CSI',
    color: '#B83C3C',
    description: 'An international defense organization operating in conflict zones.',
  },
};

export const FACTION_LIST = Object.values(FACTIONS);
