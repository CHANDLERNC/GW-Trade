// ============================================================
// GZW Market — Master Key List
// Source of truth for all tradeable keys in Gray Zone Warfare.
// Updated: Patch 0.4 (Spearhead) | April 2026
// ============================================================
// Users must select from this list — no free-text key entry.
// key_name (the `name` field) is stored verbatim in the DB.
// ============================================================

export interface GZWKey {
  /** Stable slug — used as React list key and for future analytics. */
  id: string;
  /** Canonical display name — stored as key_name in DB. */
  name: string;
  /** Location group label — used for section headers in the picker. */
  location: string;
}

export interface GZWKeySection {
  location: string;
  keys: GZWKey[];
}

export const GZW_KEY_SECTIONS: GZWKeySection[] = [
  {
    location: 'Ban Khamphet',
    keys: [
      { id: 'bk_house', name: 'Ban Khamphet House Key', location: 'Ban Khamphet' },
    ],
  },
  {
    location: 'Ban Pa',
    keys: [
      { id: 'bp_elders_hut', name: "Ban Pa Elder's Hut Key", location: 'Ban Pa' },
    ],
  },
  {
    location: 'Ban Phouphienge',
    keys: [
      { id: 'bph_house_top', name: 'Ban Phouphienge House Top-Floor Room Key', location: 'Ban Phouphienge' },
    ],
  },
  {
    location: 'Blue Lagoon',
    keys: [
      { id: 'bl_shack', name: 'Blue Lagoon Shack Key', location: 'Blue Lagoon' },
    ],
  },
  {
    location: 'Dongphou Hiking Camp',
    keys: [
      { id: 'dhc_cottage', name: 'Dongphou Hiking Camp Cottage Key', location: 'Dongphou Hiking Camp' },
    ],
  },
  {
    location: 'Fanny Paradise',
    keys: [
      { id: 'fp_managers_office', name: "Fanny Paradise Manager's Office Key", location: 'Fanny Paradise' },
    ],
  },
  {
    location: 'Fort Narith',
    keys: [
      { id: 'fn_a103', name: 'Fort Narith A103 Key', location: 'Fort Narith' },
      { id: 'fn_a208', name: 'Fort Narith A208 Key', location: 'Fort Narith' },
      { id: 'fn_a210', name: 'Fort Narith A210 Key', location: 'Fort Narith' },
      { id: 'fn_c101', name: 'Fort Narith C101 Key', location: 'Fort Narith' },
      { id: 'fn_c108', name: 'Fort Narith C108 Key', location: 'Fort Narith' },
      { id: 'fn_hq_archive', name: 'Fort Narith HQ Archive Key', location: 'Fort Narith' },
      { id: 'fn_atc', name: 'Fort Narith ATC Key', location: 'Fort Narith' },
      { id: 'fn_garage_office', name: 'Fort Narith Garage Office Key', location: 'Fort Narith' },
      { id: 'fn_hq_storage_1', name: 'Fort Narith HQ Storage Room Key (behind reception desk)', location: 'Fort Narith' },
      { id: 'fn_hq_storage_2', name: 'Fort Narith HQ Storage Room Key (second storage room)', location: 'Fort Narith' },
      { id: 'fn_icu', name: 'Fort Narith ICU Key', location: 'Fort Narith' },
      { id: 'fn_outskirts_motel', name: 'Fort Narith Outskirts Motel Key', location: 'Fort Narith' },
      { id: 'fn_bandit_armory', name: 'Fort Narith Bandit Armory Key', location: 'Fort Narith' },
      { id: 'fn_shooting_range_office', name: 'Fort Narith Shooting Range Office Key', location: 'Fort Narith' },
      { id: 'fn_dumping_ground_shed', name: 'Fort Narith Dumping Ground Shed Key', location: 'Fort Narith' },
      { id: 'fn_operations_room', name: 'Fort Narith Operations Room Keycard', location: 'Fort Narith' },
      { id: 'fn_turncoats_house', name: "Turncoat's House Key", location: 'Fort Narith' },
    ],
  },
  {
    location: 'Ground Zero',
    keys: [
      { id: 'gz_hut_north', name: 'Ground Zero Hut Key (North poppy fields)', location: 'Ground Zero' },
      { id: 'gz_hut_south', name: 'Ground Zero Hut Key (South poppy fields)', location: 'Ground Zero' },
    ],
  },
  {
    location: "Hunter's Paradise",
    keys: [
      { id: 'hp_motel_101', name: "Hunter's Paradise Motel Room 101 Key", location: "Hunter's Paradise" },
      { id: 'hp_motel_102', name: "Hunter's Paradise Motel Room 102 Key", location: "Hunter's Paradise" },
      { id: 'hp_motel_armory', name: "Hunter's Paradise Motel Improvised Armory Key", location: "Hunter's Paradise" },
      { id: 'hp_bunker', name: "Hunter's Paradise Bunker Key", location: "Hunter's Paradise" },
      { id: 'hp_shooting_lines', name: "Hunter's Paradise Shooting Lines Storage Key", location: "Hunter's Paradise" },
      { id: 'hp_weapon_storage', name: "Hunter's Paradise Weapon Storage Key", location: "Hunter's Paradise" },
    ],
  },
  {
    location: 'Inthavong Farm',
    keys: [
      { id: 'if_shed', name: 'Inthavong Farm Shed Key', location: 'Inthavong Farm' },
    ],
  },
  {
    location: 'Khamhao Rice Depot',
    keys: [
      { id: 'krd_room', name: 'Khamhao Rice Depot Room Key', location: 'Khamhao Rice Depot' },
    ],
  },
  {
    location: 'Khonwan Village',
    keys: [
      { id: 'khv_house', name: 'Khonwan Village House Key', location: 'Khonwan Village' },
    ],
  },
  {
    location: 'Kiu Vongsa',
    keys: [
      { id: 'kv_restaurant_attic', name: 'Kiu Vongsa Restaurant Storage Key (Attic)', location: 'Kiu Vongsa' },
      { id: 'kv_doctors_office', name: "Kiu Vongsa Doctor's Office Key", location: 'Kiu Vongsa' },
      { id: 'kv_town_hall_finance', name: 'Kiu Vongsa Town Hall Finance Department Keycard', location: 'Kiu Vongsa' },
      { id: 'kv_lumberyard', name: 'Kiu Vongsa Lumberyard Maintenance Room Key', location: 'Kiu Vongsa' },
      { id: 'kv_marketplace_office', name: 'Kiu Vongsa Marketplace Office Key', location: 'Kiu Vongsa' },
      { id: 'kv_villa_bedroom', name: 'Kiu Vongsa Occupied Villa Bedroom Key', location: 'Kiu Vongsa' },
      { id: 'kv_mayors_mansion', name: "Kiu Vongsa Mayor's Mansion Top-Floor Room Key", location: 'Kiu Vongsa' },
      { id: 'kv_unlra_office', name: 'Kiu Vongsa UNLRA Office Key', location: 'Kiu Vongsa' },
      { id: 'kv_construction_container', name: 'Kiu Vongsa Construction Site Container Key', location: 'Kiu Vongsa' },
    ],
  },
  {
    location: 'LAF Radio Tower',
    keys: [
      { id: 'laf_storage', name: 'LAF Radio Tower Storage Room Key', location: 'LAF Radio Tower' },
    ],
  },
  {
    location: 'Midnight Sapphire',
    keys: [
      { id: 'ms_villa_anna_jana', name: 'Villa Anna Jana Key', location: 'Midnight Sapphire' },
      { id: 'ms_villa_elena_garage', name: 'Villa Elena Garage Key', location: 'Midnight Sapphire' },
      { id: 'ms_villa_katherine', name: 'Villa Katherine Key', location: 'Midnight Sapphire' },
      { id: 'ms_villa_luisa', name: 'Villa Luisa Key', location: 'Midnight Sapphire' },
      { id: 'ms_villa_marta_garage', name: 'Villa Marta Monica Garage Key', location: 'Midnight Sapphire' },
      { id: 'ms_villa_vongphet', name: 'Villa Vongphet Room Key', location: 'Midnight Sapphire' },
      { id: 'ms_villa_guest_house', name: 'Villa Guest House Key', location: 'Midnight Sapphire' },
      { id: 'ms_hotel_supply_closet', name: 'Midnight Sapphire Hotel Supply Closet Keycard', location: 'Midnight Sapphire' },
      { id: 'ms_golf_club_storage', name: 'Midnight Sapphire Golf Club Storage Key', location: 'Midnight Sapphire' },
    ],
  },
  {
    location: 'Nam Thaven',
    keys: [
      { id: 'nt_restaurant_attic', name: 'Nam Thaven Restaurant Storage Key (Attic)', location: 'Nam Thaven' },
      { id: 'nt_doctors_office', name: "Nam Thaven Doctor's Office Key", location: 'Nam Thaven' },
      { id: 'nt_town_hall_finance', name: 'Nam Thaven Town Hall Finance Department Keycard', location: 'Nam Thaven' },
      { id: 'nt_lumberyard', name: 'Nam Thaven Lumberyard Maintenance Room Key', location: 'Nam Thaven' },
      { id: 'nt_marketplace_office', name: 'Nam Thaven Marketplace Office Key', location: 'Nam Thaven' },
      { id: 'nt_marketplace_storage', name: 'Nam Thaven Marketplace Storage Key', location: 'Nam Thaven' },
      { id: 'nt_villa_bedroom', name: 'Nam Thaven Occupied Villa Bedroom Key', location: 'Nam Thaven' },
      { id: 'nt_motel_room', name: 'Nam Thaven Motel Room Key', location: 'Nam Thaven' },
      { id: 'nt_unlra_office', name: 'Nam Thaven UNLRA Office Key', location: 'Nam Thaven' },
    ],
  },
  {
    location: 'Pha Lang',
    keys: [
      { id: 'pl_restaurant_attic', name: 'Pha Lang Restaurant Storage Key (Attic)', location: 'Pha Lang' },
      { id: 'pl_doctors_office', name: "Pha Lang Doctor's Office Key", location: 'Pha Lang' },
      { id: 'pl_town_hall_finance', name: 'Pha Lang Town Hall Finance Department Keycard', location: 'Pha Lang' },
      { id: 'pl_lumberyard', name: 'Pha Lang Lumberyard Maintenance Room Key', location: 'Pha Lang' },
      { id: 'pl_marketplace_office', name: 'Pha Lang Marketplace Office Key', location: 'Pha Lang' },
      { id: 'pl_marketplace_storage', name: 'Pha Lang Marketplace Storage Key', location: 'Pha Lang' },
      { id: 'pl_villa_bedroom', name: 'Pha Lang Occupied Villa Bedroom Key', location: 'Pha Lang' },
      { id: 'pl_motel_room', name: 'Pha Lang Motel Room Key', location: 'Pha Lang' },
      { id: 'pl_unlra_office', name: 'Pha Lang UNLRA Office Key', location: 'Pha Lang' },
      { id: 'pl_airfield_hangar', name: 'Pha Lang Airfield Hangar 03 Key', location: 'Pha Lang' },
      { id: 'pl_airfield_terminal', name: 'Pha Lang Airfield Terminal Storage Shed Key', location: 'Pha Lang' },
      { id: 'pl_airfield_meeting', name: 'Pha Lang Airfield Meeting Room Key', location: 'Pha Lang' },
      { id: 'pl_small_marketplace', name: 'Pha Lang Small Marketplace House Key (SW of airfield)', location: 'Pha Lang' },
      { id: 'pl_sunny_skies', name: 'Pha Lang Sunny Skies Guest House Basement Key', location: 'Pha Lang' },
    ],
  },
  {
    location: 'Phouarun Restaurant',
    keys: [
      { id: 'pr_top_floor', name: 'Phouarun Restaurant Top-Floor Room Key', location: 'Phouarun Restaurant' },
    ],
  },
  {
    location: 'Phousai Village',
    keys: [
      { id: 'phv_house', name: 'Phousai Village House Key', location: 'Phousai Village' },
    ],
  },
  {
    location: 'Sawmill',
    keys: [
      { id: 'sm_office_storage', name: 'Sawmill Office Storage Key', location: 'Sawmill' },
      { id: 'sm_storage_shed', name: 'Sawmill Storage Shed Key', location: 'Sawmill' },
      { id: 'sm_toilet', name: 'Sawmill Toilet Key', location: 'Sawmill' },
    ],
  },
  {
    location: 'Siang Radio Station',
    keys: [
      { id: 'srs_top_floor', name: 'Siang Radio Station Top-Floor Room Key', location: 'Siang Radio Station' },
    ],
  },
  {
    location: 'Sunset Chalet',
    keys: [
      { id: 'sc_cottage', name: 'Sunset Chalet Cottage Key', location: 'Sunset Chalet' },
      { id: 'sc_firearms_case', name: 'Sunset Chalet Firearms Case Key', location: 'Sunset Chalet' },
    ],
  },
  {
    location: 'Tiger Bay',
    keys: [
      { id: 'tb_pier', name: 'Tiger Bay Pier Key', location: 'Tiger Bay' },
      { id: 'tb_outskirts_garage', name: 'Tiger Bay Outskirts Garage Key', location: 'Tiger Bay' },
      { id: 'tb_central_armory', name: 'Tiger Bay Central Armory Key', location: 'Tiger Bay' },
      { id: 'tb_trade_depot', name: 'Tiger Bay Trade Depot Office Key', location: 'Tiger Bay' },
      { id: 'tb_unlra_hq_lab', name: 'Tiger Bay UNLRA HQ Lab Key', location: 'Tiger Bay' },
      { id: 'tb_unlra_hq_office', name: 'Tiger Bay UNLRA HQ Office Keycard', location: 'Tiger Bay' },
      { id: 'tb_unlra_equipment', name: 'Tiger Bay UNLRA Equipment Container Key', location: 'Tiger Bay' },
      { id: 'tb_unlra_medical', name: 'Tiger Bay UNLRA Medical Container Key', location: 'Tiger Bay' },
      { id: 'tb_unlra_quarantine', name: 'Tiger Bay UNLRA Quarantine Key', location: 'Tiger Bay' },
      { id: 'tb_unlra_dorm', name: 'Tiger Bay UNLRA Dorm Container Key', location: 'Tiger Bay' },
      { id: 'tb_toto_hardware', name: 'Tiger Bay Toto Hardware Storage Key', location: 'Tiger Bay' },
      { id: 'tb_makeshift_hideout', name: 'Tiger Bay Makeshift Hideout Key', location: 'Tiger Bay' },
    ],
  },
  {
    location: 'Tonmai Hainy Lumber Company',
    keys: [
      { id: 'thlc_office_building', name: 'Tonmai Hainy Lumber Company Office Building Key', location: 'Tonmai Hainy Lumber Company' },
      { id: 'thlc_office_storage', name: 'Tonmai Hainy Lumber Company Office Storage Room Key', location: 'Tonmai Hainy Lumber Company' },
      { id: 'thlc_storage_shed', name: 'Tonmai Hainy Lumber Company Storage Shed Key', location: 'Tonmai Hainy Lumber Company' },
    ],
  },
  {
    location: 'UNLRA Evac Center',
    keys: [
      { id: 'uec_school_room', name: 'UNLRA Evac Center School Room Key', location: 'UNLRA Evac Center' },
    ],
  },
  {
    location: 'YBL-1 Bunker',
    keys: [
      { id: 'ybl_maintenance_door', name: 'YBL-1 Maintenance Door Key', location: 'YBL-1 Bunker' },
      { id: 'ybl_generator_room', name: 'YBL-1 Generator Room Key', location: 'YBL-1 Bunker' },
      { id: 'ybl_office_01', name: 'YBL-1 Office Key 01', location: 'YBL-1 Bunker' },
      { id: 'ybl_office_02', name: 'YBL-1 Office 02 Key', location: 'YBL-1 Bunker' },
      { id: 'ybl_bedroom', name: 'YBL-1 Bedroom Key', location: 'YBL-1 Bunker' },
      { id: 'ybl_corridor_d', name: 'YBL-1 Corridor D Storage Room Key', location: 'YBL-1 Bunker' },
      { id: 'ybl_weapon_storage', name: 'YBL-1 Weapon Storage Room Key', location: 'YBL-1 Bunker' },
    ],
  },
];

/** Flat list of all keys — use for search filtering. */
export const GZW_KEY_LIST: GZWKey[] = GZW_KEY_SECTIONS.flatMap(s => s.keys);

/** Lookup a key by its canonical name. */
export function findKeyByName(name: string): GZWKey | undefined {
  return GZW_KEY_LIST.find(k => k.name === name);
}
