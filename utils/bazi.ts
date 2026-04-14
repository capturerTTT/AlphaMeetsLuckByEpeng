/**
 * BaZi (八字) Four Pillars of Destiny — calculation utilities
 * Pure functions, no side effects.
 */

import { BaziInfo, BaziPillars } from '../types';

export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// Five Elements for each Heavenly Stem (index 0-9)
export const STEM_ELEMENTS   = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
// Five Elements for each Earthly Branch (index 0-11)
export const BRANCH_ELEMENTS = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];

export const ELEMENT_EN: Record<string, string> = {
  金: 'Metal', 木: 'Wood', 水: 'Water', 火: 'Fire', 土: 'Earth',
};

// ─── Year Pillar ──────────────────────────────────────────────────────────────
function getYearStemIdx(year: number): number {
  return ((year - 4) % 10 + 10) % 10;
}
function getYearBranchIdx(year: number): number {
  return ((year - 4) % 12 + 12) % 12;
}

// ─── Month Pillar ─────────────────────────────────────────────────────────────
// Simplified: uses Gregorian month (good enough for fortune-telling vibe)
// Jan=丑(1), Feb=寅(2), Mar=卯(3), Apr=辰(4), May=巳(5), Jun=午(6),
// Jul=未(7), Aug=申(8), Sep=酉(9), Oct=戌(10), Nov=亥(11), Dec=子(0)
const MONTH_BRANCH_BY_GREGORIAN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0];

function getMonthBranchIdx(month: number): number {
  return MONTH_BRANCH_BY_GREGORIAN[month - 1];
}

// Month stem starting index by year stem group
// 甲己→丙(2), 乙庚→戊(4), 丙辛→庚(6), 丁壬→壬(8), 戊癸→甲(0)
const MONTH_STEM_START = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];

function getMonthStemIdx(yearStemIdx: number, monthBranchIdx: number): number {
  // monthBranchIdx cycles 2,3,4,...11,0,1 (寅=2 is month 1 of the year)
  // Adjust so 寅 (index 2) maps to position 0
  const monthOffset = (monthBranchIdx - 2 + 12) % 12;
  return (MONTH_STEM_START[yearStemIdx] + monthOffset) % 10;
}

// ─── Day Pillar ───────────────────────────────────────────────────────────────
// Uses Julian Day Number (JDN). Reference: JDN 2415032 = Jan 11, 1900 = 甲子 (cycle 0)
function toJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function getDayOffset(year: number, month: number, day: number): number {
  const jdn = toJDN(year, month, day);
  return ((jdn - 2415032) % 60 + 60) % 60;
}

// ─── Hour Pillar ──────────────────────────────────────────────────────────────
// 子时 23-01, 丑时 01-03, ... 亥时 21-23
function getHourBranchIdx(hour: number): number {
  return Math.floor(((hour + 1) % 24) / 2);
}

// Hour stem start by day stem group
const HOUR_STEM_START = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];

function getHourStemIdx(dayStemIdx: number, hourBranchIdx: number): number {
  return (HOUR_STEM_START[dayStemIdx] + hourBranchIdx) % 10;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function calculatePillars(info: BaziInfo): BaziPillars {
  const { birthYear, birthMonth, birthDay, birthHour } = info;

  // Year
  const yStemIdx   = getYearStemIdx(birthYear);
  const yBranchIdx = getYearBranchIdx(birthYear);
  const yearPillar = HEAVENLY_STEMS[yStemIdx] + EARTHLY_BRANCHES[yBranchIdx];

  // Month
  const mBranchIdx = getMonthBranchIdx(birthMonth);
  const mStemIdx   = getMonthStemIdx(yStemIdx, mBranchIdx);
  const monthPillar = HEAVENLY_STEMS[mStemIdx] + EARTHLY_BRANCHES[mBranchIdx];

  // Day
  const dayOffset   = getDayOffset(birthYear, birthMonth, birthDay);
  const dStemIdx    = dayOffset % 10;
  const dBranchIdx  = dayOffset % 12;
  const dayPillar   = HEAVENLY_STEMS[dStemIdx] + EARTHLY_BRANCHES[dBranchIdx];

  // Hour
  let hourPillar = '时辰未知';
  if (birthHour !== undefined && birthHour >= 0) {
    const hBranchIdx = getHourBranchIdx(birthHour);
    const hStemIdx   = getHourStemIdx(dStemIdx, hBranchIdx);
    hourPillar = HEAVENLY_STEMS[hStemIdx] + EARTHLY_BRANCHES[hBranchIdx];
  }

  // Dominant element from year stem (simplification — real BaZi uses all four)
  const yearElement = STEM_ELEMENTS[yStemIdx];

  return { yearPillar, monthPillar, dayPillar, hourPillar, yearElement };
}

/** Format pillars as a readable string for the AI prompt */
export function pillarsToPromptString(pillars: BaziPillars, info: BaziInfo): string {
  return [
    `年柱：${pillars.yearPillar}（${STEM_ELEMENTS[getYearStemIdx(info.birthYear)]}）`,
    `月柱：${pillars.monthPillar}`,
    `日柱：${pillars.dayPillar}（日元：${pillars.dayPillar[0]}，五行属${STEM_ELEMENTS[HEAVENLY_STEMS.indexOf(pillars.dayPillar[0])]}）`,
    `时柱：${pillars.hourPillar}`,
    `出生地：${info.birthLocation}`,
  ].join('  ');
}
