import { beforeEach, describe, expect, test } from "bun:test";

const { nc, resetParam } = require("./helpers");
const { ics_expand_rrule_event, NEATOCAL_PARAM } = nc;

beforeEach(() => {
  resetParam();
  NEATOCAL_PARAM.year = 2025;
  NEATOCAL_PARAM.start_month = 0;
  NEATOCAL_PARAM.n_month = 12;
  nc.data_set_base({});
});

function _countDatesWithEvents() {
  return Object.keys(NEATOCAL_PARAM.data).filter(
    (k) => k !== "__base" && NEATOCAL_PARAM.data[k] !== undefined,
  ).length;
}

describe("RRULE DAILY", () => {
  test("DAILY with COUNT=5 generates 5 occurrences", () => {
    const event = {
      summary: "Daily standup",
      dtstart: { value: "20250101", params: "VALUE=DATE" },
      dtend: { value: "20250102", params: "VALUE=DATE" },
      rrule: "FREQ=DAILY;COUNT=5",
    };
    const view = nc.get_view_range();
    ics_expand_rrule_event(event, "#cfe8ff", "#000", 0, view.start, view.end);

    expect(NEATOCAL_PARAM.data["2025-01-01"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-02"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-03"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-04"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-05"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-06"]).toBeUndefined();
  });

  test("DAILY with INTERVAL=2 skips every other day", () => {
    const event = {
      summary: "Every other day",
      dtstart: { value: "20250101", params: "VALUE=DATE" },
      dtend: { value: "20250102", params: "VALUE=DATE" },
      rrule: "FREQ=DAILY;INTERVAL=2;COUNT=3",
    };
    const view = nc.get_view_range();
    ics_expand_rrule_event(event, "#cfe8ff", "#000", 0, view.start, view.end);

    expect(NEATOCAL_PARAM.data["2025-01-01"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-02"]).toBeUndefined();
    expect(NEATOCAL_PARAM.data["2025-01-03"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-04"]).toBeUndefined();
    expect(NEATOCAL_PARAM.data["2025-01-05"]).toBeDefined();
  });
});

describe("RRULE WEEKLY", () => {
  test("WEEKLY on MO generates Mondays", () => {
    const event = {
      summary: "Weekly meeting",
      dtstart: { value: "20250106T090000", params: "" },
      dtend: { value: "20250106T100000", params: "" },
      rrule: "FREQ=WEEKLY;COUNT=4",
    };
    const view = nc.get_view_range();
    ics_expand_rrule_event(event, "#cfe8ff", "#000", 0, view.start, view.end);

    // Jan 6 2025 is a Monday
    expect(NEATOCAL_PARAM.data["2025-01-06"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-13"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-20"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-27"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-02-03"]).toBeUndefined();
  });

  test("WEEKLY BYDAY=MO,WE,FR generates three days per week", () => {
    const event = {
      summary: "MWF class",
      dtstart: { value: "20250106T090000", params: "" },
      dtend: { value: "20250106T100000", params: "" },
      rrule: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=6",
    };
    const view = nc.get_view_range();
    ics_expand_rrule_event(event, "#cfe8ff", "#000", 0, view.start, view.end);

    // Week of Jan 6: Mon 6, Wed 8, Fri 10
    // Week of Jan 13: Mon 13, Wed 15, Fri 17
    expect(NEATOCAL_PARAM.data["2025-01-06"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-08"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-10"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-13"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-15"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-17"]).toBeDefined();
  });
});

describe("RRULE MONTHLY", () => {
  test("MONTHLY repeats on same day of month", () => {
    const event = {
      summary: "Monthly review",
      dtstart: { value: "20250115", params: "VALUE=DATE" },
      dtend: { value: "20250116", params: "VALUE=DATE" },
      rrule: "FREQ=MONTHLY;COUNT=3",
    };
    const view = nc.get_view_range();
    ics_expand_rrule_event(event, "#cfe8ff", "#000", 0, view.start, view.end);

    expect(NEATOCAL_PARAM.data["2025-01-15"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-02-15"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-03-15"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-04-15"]).toBeUndefined();
  });

  test("MONTHLY BYDAY=2MO (second Monday)", () => {
    const event = {
      summary: "Second Monday",
      dtstart: { value: "20250113T090000", params: "" },
      dtend: { value: "20250113T100000", params: "" },
      rrule: "FREQ=MONTHLY;BYDAY=2MO;COUNT=3",
    };
    const view = nc.get_view_range();
    ics_expand_rrule_event(event, "#cfe8ff", "#000", 0, view.start, view.end);

    // Jan 13 2025 = 2nd Monday
    expect(NEATOCAL_PARAM.data["2025-01-13"]).toBeDefined();
    // Feb 10 2025 = 2nd Monday
    expect(NEATOCAL_PARAM.data["2025-02-10"]).toBeDefined();
    // Mar 10 2025 = 2nd Monday
    expect(NEATOCAL_PARAM.data["2025-03-10"]).toBeDefined();
  });
});

describe("RRULE YEARLY", () => {
  test("YEARLY with UNTIL stops at limit", () => {
    NEATOCAL_PARAM.n_month = 36; // 3 years
    nc.data_set_base({});

    const event = {
      summary: "Anniversary",
      dtstart: { value: "20250601", params: "VALUE=DATE" },
      dtend: { value: "20250602", params: "VALUE=DATE" },
      rrule: "FREQ=YEARLY;UNTIL=20270601",
    };
    const view = nc.get_view_range();
    ics_expand_rrule_event(event, "#cfe8ff", "#000", 0, view.start, view.end);

    expect(NEATOCAL_PARAM.data["2025-06-01"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2026-06-01"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2027-06-01"]).toBeDefined();
  });
});

describe("RRULE with UNTIL", () => {
  test("DAILY with UNTIL stops on the correct date", () => {
    const event = {
      summary: "Limited daily",
      dtstart: { value: "20250101", params: "VALUE=DATE" },
      dtend: { value: "20250102", params: "VALUE=DATE" },
      rrule: "FREQ=DAILY;UNTIL=20250103",
    };
    const view = nc.get_view_range();
    ics_expand_rrule_event(event, "#cfe8ff", "#000", 0, view.start, view.end);

    expect(NEATOCAL_PARAM.data["2025-01-01"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-02"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-03"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-01-04"]).toBeUndefined();
  });
});
