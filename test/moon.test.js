import { describe, expect, test } from "bun:test";

const { nc } = require("./helpers");
const { calculateLunarAge, getMoonPhase, getMoonPhaseName } = nc;

describe("calculateLunarAge", () => {
  test("reference date (Jan 6 2000) returns near-full cycle", () => {
    const age = calculateLunarAge(2000, 0, 6);
    // Target is midnight UTC, reference is 18:14 UTC same day → target is before ref
    // So daysSince is slightly negative, wraps to ~28.77
    expect(age).toBeGreaterThan(28);
    expect(age).toBeLessThan(29.54);
  });

  test("half cycle (~14.77 days) later gives roughly half", () => {
    // Jan 6 + ~15 days = Jan 21 2000
    const age = calculateLunarAge(2000, 0, 21);
    expect(age).toBeGreaterThan(13);
    expect(age).toBeLessThan(16);
  });

  test("~29 days after reference returns near-full cycle", () => {
    // Jan 6 + 29 = Feb 4 2000; due to the 18:14 UTC offset, this wraps too
    const age = calculateLunarAge(2000, 1, 4);
    expect(age).toBeGreaterThan(27);
    expect(age).toBeLessThan(29.54);
  });

  test("returns positive value for dates before reference", () => {
    const age = calculateLunarAge(1999, 11, 1);
    expect(age).toBeGreaterThanOrEqual(0);
    expect(age).toBeLessThan(29.54);
  });

  test("returns value in range [0, 29.53) for any date", () => {
    const age = calculateLunarAge(2025, 2, 15);
    expect(age).toBeGreaterThanOrEqual(0);
    expect(age).toBeLessThan(29.54);
  });
});

describe("getMoonPhase", () => {
  test("returns 0 (New Moon) for age ~0", () => {
    expect(getMoonPhase(0.5)).toBe(0);
  });

  test("returns 4 (Full Moon) for age ~14.77", () => {
    expect(getMoonPhase(14.77)).toBe(4);
  });

  test("returns phase in range 0-7", () => {
    for (let age = 0; age < 29.53; age += 1) {
      const phase = getMoonPhase(age);
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThanOrEqual(7);
    }
  });

  test("phase 2 (First Quarter) at ~7.38 days", () => {
    expect(getMoonPhase(7.38)).toBe(2);
  });

  test("phase 6 (Last Quarter) at ~22.15 days", () => {
    expect(getMoonPhase(22.15)).toBe(6);
  });
});

describe("getMoonPhaseName", () => {
  test("returns correct names for all phases", () => {
    expect(getMoonPhaseName(0)).toBe("New");
    expect(getMoonPhaseName(1)).toBe("Wax Cres");
    expect(getMoonPhaseName(2)).toBe("First Qtr");
    expect(getMoonPhaseName(3)).toBe("Wax Gibb");
    expect(getMoonPhaseName(4)).toBe("Full");
    expect(getMoonPhaseName(5)).toBe("Wan Gibb");
    expect(getMoonPhaseName(6)).toBe("Last Qtr");
    expect(getMoonPhaseName(7)).toBe("Wan Cres");
  });
});
