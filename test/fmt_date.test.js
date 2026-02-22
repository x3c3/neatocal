import { describe, expect, test } from "bun:test";

const { nc } = require("./helpers");
const { fmt_date, getISOWeekNumber } = nc;

describe("fmt_date", () => {
  test("zero-pads month and day", () => {
    expect(fmt_date(2025, 1, 5)).toBe("2025-01-05");
  });

  test("no padding needed for double-digit month/day", () => {
    expect(fmt_date(2025, 12, 25)).toBe("2025-12-25");
  });

  test("handles boundary month=10, day=10", () => {
    expect(fmt_date(2025, 10, 10)).toBe("2025-10-10");
  });

  test("handles single-digit day with double-digit month", () => {
    expect(fmt_date(2024, 11, 3)).toBe("2024-11-03");
  });
});

describe("getISOWeekNumber", () => {
  test("Jan 1 2024 (Monday) is week 1", () => {
    expect(getISOWeekNumber(new Date(2024, 0, 1))).toBe(1);
  });

  test("Dec 31 2024 (Tuesday) is week 1 of next year", () => {
    // Dec 31 2024 is a Tuesday; nearest Thursday is Jan 2 2025 → week 1
    expect(getISOWeekNumber(new Date(2024, 11, 31))).toBe(1);
  });

  test("Dec 28 2023 (Thursday) is week 52", () => {
    expect(getISOWeekNumber(new Date(2023, 11, 28))).toBe(52);
  });

  test("Jan 1 2023 (Sunday) is week 52 of previous year", () => {
    // Jan 1 2023 is a Sunday; nearest Thursday is Dec 29 2022 → week 52
    expect(getISOWeekNumber(new Date(2023, 0, 1))).toBe(52);
  });

  test("March 14 2025 (Friday) is week 11", () => {
    expect(getISOWeekNumber(new Date(2025, 2, 14))).toBe(11);
  });
});
