import { describe, expect, test, beforeEach } from "bun:test";

const { nc, resetParam } = require("./helpers");
const { ics_expand_event, add_event_to_date, get_view_range, NEATOCAL_PARAM } =
  nc;

beforeEach(() => {
  resetParam();
  NEATOCAL_PARAM.year = 2025;
  NEATOCAL_PARAM.start_month = 0;
  NEATOCAL_PARAM.n_month = 12;
  nc.data_set_base({});
});

describe("get_view_range", () => {
  test("returns Jan 1 to Jan 1 next year for default params", () => {
    const range = get_view_range();
    expect(range.start.getFullYear()).toBe(2025);
    expect(range.start.getMonth()).toBe(0);
    expect(range.start.getDate()).toBe(1);
    expect(range.end.getFullYear()).toBe(2026);
    expect(range.end.getMonth()).toBe(0);
  });

  test("respects start_month and n_month", () => {
    NEATOCAL_PARAM.start_month = 3;
    NEATOCAL_PARAM.n_month = 6;
    const range = get_view_range();
    expect(range.start.getMonth()).toBe(3); // April
    expect(range.end.getMonth()).toBe(9); // October
  });
});

describe("ics_expand_event", () => {
  test("single-day event adds one entry to data", () => {
    const event = {
      summary: "Dentist",
      dtstart: { value: "20250315", params: "VALUE=DATE" },
      dtend: { value: "20250316", params: "VALUE=DATE" },
    };
    const view = get_view_range();
    ics_expand_event(event, "#cfe8ff", "#000", 0, view.start, view.end);

    const entry = NEATOCAL_PARAM.data["2025-03-15"];
    expect(entry).toBeDefined();
    expect(Array.isArray(entry)).toBe(true);
    expect(entry[0].title).toBe("Dentist");
    expect(entry[0].color).toBe("#cfe8ff");
  });

  test("multi-day event spans multiple dates", () => {
    const event = {
      summary: "Vacation",
      dtstart: { value: "20250310", params: "VALUE=DATE" },
      dtend: { value: "20250313", params: "VALUE=DATE" },
    };
    const view = get_view_range();
    ics_expand_event(event, "#cfe8ff", "#000", 0, view.start, view.end);

    // All-day end is exclusive: Mar 10, 11, 12
    expect(NEATOCAL_PARAM.data["2025-03-10"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-03-11"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-03-12"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-03-13"]).toBeUndefined();
  });

  test("event outside view range is not added", () => {
    NEATOCAL_PARAM.start_month = 6; // July
    NEATOCAL_PARAM.n_month = 1;
    nc.data_set_base({});

    const event = {
      summary: "January event",
      dtstart: { value: "20250115", params: "VALUE=DATE" },
      dtend: { value: "20250116", params: "VALUE=DATE" },
    };
    const view = get_view_range();
    ics_expand_event(event, "#cfe8ff", "#000", 0, view.start, view.end);

    expect(NEATOCAL_PARAM.data["2025-01-15"]).toBeUndefined();
  });

  test("sets span.start and span.end flags correctly", () => {
    const event = {
      summary: "3-day",
      dtstart: { value: "20250501", params: "VALUE=DATE" },
      dtend: { value: "20250504", params: "VALUE=DATE" },
    };
    const view = get_view_range();
    ics_expand_event(event, "#cfe8ff", "#000", 0, view.start, view.end);

    expect(NEATOCAL_PARAM.data["2025-05-01"][0].span.start).toBe(true);
    expect(NEATOCAL_PARAM.data["2025-05-01"][0].span.end).toBe(false);
    expect(NEATOCAL_PARAM.data["2025-05-02"][0].span.start).toBe(false);
    expect(NEATOCAL_PARAM.data["2025-05-02"][0].span.end).toBe(false);
    expect(NEATOCAL_PARAM.data["2025-05-03"][0].span.start).toBe(false);
    expect(NEATOCAL_PARAM.data["2025-05-03"][0].span.end).toBe(true);
  });

  test("timed event on single day adds one entry", () => {
    const event = {
      summary: "Meeting",
      dtstart: { value: "20250315T100000", params: "" },
      dtend: { value: "20250315T110000", params: "" },
    };
    const view = get_view_range();
    ics_expand_event(event, "#cfe8ff", "#000", 0, view.start, view.end);

    expect(NEATOCAL_PARAM.data["2025-03-15"]).toBeDefined();
    expect(NEATOCAL_PARAM.data["2025-03-15"][0].title).toBe("Meeting");
  });
});

describe("add_event_to_date", () => {
  test("creates array for new date", () => {
    add_event_to_date("2025-06-01", { title: "Test" });
    expect(Array.isArray(NEATOCAL_PARAM.data["2025-06-01"])).toBe(true);
    expect(NEATOCAL_PARAM.data["2025-06-01"][0].title).toBe("Test");
  });

  test("appends to existing array", () => {
    add_event_to_date("2025-06-01", { title: "First" });
    add_event_to_date("2025-06-01", { title: "Second" });
    expect(NEATOCAL_PARAM.data["2025-06-01"].length).toBe(2);
  });

  test("wraps non-array existing value into array", () => {
    NEATOCAL_PARAM.data["2025-06-01"] = "Existing string";
    add_event_to_date("2025-06-01", { title: "New" });
    expect(Array.isArray(NEATOCAL_PARAM.data["2025-06-01"])).toBe(true);
    expect(NEATOCAL_PARAM.data["2025-06-01"].length).toBe(2);
  });
});
