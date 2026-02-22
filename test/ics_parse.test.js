import { describe, expect, test } from "bun:test";

const { nc } = require("./helpers");
const { ics_unfold_lines, ics_parse_datetime, ics_parse_events } = nc;

describe("ics_unfold_lines", () => {
  test("joins continuation lines starting with space", () => {
    const input = "SUMMARY:Long event\r\n name here\r\nDTSTART:20250101";
    const result = ics_unfold_lines(input);
    expect(result).toEqual(["SUMMARY:Long eventname here", "DTSTART:20250101"]);
  });

  test("joins continuation lines starting with tab", () => {
    const input = "SUMMARY:Event\n\tcontinued\nDTSTART:20250101";
    const result = ics_unfold_lines(input);
    expect(result).toEqual(["SUMMARY:Eventcontinued", "DTSTART:20250101"]);
  });

  test("handles plain LF line endings", () => {
    const input = "LINE1\nLINE2\nLINE3";
    const result = ics_unfold_lines(input);
    expect(result).toEqual(["LINE1", "LINE2", "LINE3"]);
  });

  test("handles bare CR line endings", () => {
    const input = "LINE1\rLINE2\rLINE3";
    const result = ics_unfold_lines(input);
    expect(result).toEqual(["LINE1", "LINE2", "LINE3"]);
  });
});

describe("ics_parse_datetime", () => {
  test("parses all-day date (YYYYMMDD)", () => {
    const result = ics_parse_datetime("20250315", "");
    expect(result.all_day).toBe(true);
    expect(result.date.getFullYear()).toBe(2025);
    expect(result.date.getMonth()).toBe(2); // March = 2
    expect(result.date.getDate()).toBe(15);
  });

  test("parses all-day date with VALUE=DATE param", () => {
    const result = ics_parse_datetime("20250101", "VALUE=DATE");
    expect(result.all_day).toBe(true);
  });

  test("parses datetime with time (local)", () => {
    const result = ics_parse_datetime("20250315T143000", "");
    expect(result.all_day).toBe(false);
    expect(result.date.getHours()).toBe(14);
    expect(result.date.getMinutes()).toBe(30);
  });

  test("parses UTC datetime (Z suffix)", () => {
    const result = ics_parse_datetime("20250315T120000Z", "");
    expect(result.all_day).toBe(false);
    // UTC noon — exact local time depends on timezone, but date should be constructed
    expect(result.date instanceof Date).toBe(true);
  });

  test("returns null for invalid format", () => {
    expect(ics_parse_datetime("not-a-date", "")).toBe(null);
  });

  test("handles datetime without seconds (seconds group is optional)", () => {
    const result = ics_parse_datetime("20250315T1430", "");
    // The regex makes seconds optional, so 4-digit time is accepted
    expect(result).not.toBe(null);
    expect(result.date.getHours()).toBe(14);
    expect(result.date.getMinutes()).toBe(30);
  });

  test("rejects invalid date-only overflow (Jan 32)", () => {
    expect(ics_parse_datetime("20250132", "")).toBe(null);
  });

  test("rejects invalid month (month 13)", () => {
    expect(ics_parse_datetime("20251301", "")).toBe(null);
  });

  test("rejects invalid datetime overflow (Feb 30)", () => {
    expect(ics_parse_datetime("20250230T120000", "")).toBe(null);
  });

  test("accepts valid leap day", () => {
    const result = ics_parse_datetime("20240229", "");
    expect(result).not.toBe(null);
    expect(result.date.getDate()).toBe(29);
  });

  test("rejects non-leap year Feb 29", () => {
    expect(ics_parse_datetime("20250229", "")).toBe(null);
  });
});

describe("ics_parse_events", () => {
  test("parses a single VEVENT with SUMMARY, DTSTART, DTEND", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "SUMMARY:Team Meeting",
      "DTSTART:20250315T100000",
      "DTEND:20250315T110000",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const events = ics_parse_events(ics);
    expect(events.length).toBe(1);
    expect(events[0].summary).toBe("Team Meeting");
    expect(events[0].dtstart.value).toBe("20250315T100000");
    expect(events[0].dtend.value).toBe("20250315T110000");
  });

  test("parses multiple events", () => {
    const ics = [
      "BEGIN:VEVENT",
      "SUMMARY:Event A",
      "DTSTART:20250301",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "SUMMARY:Event B",
      "DTSTART:20250302",
      "END:VEVENT",
    ].join("\n");

    const events = ics_parse_events(ics);
    expect(events.length).toBe(2);
    expect(events[0].summary).toBe("Event A");
    expect(events[1].summary).toBe("Event B");
  });

  test("parses DTSTART with VALUE=DATE parameter", () => {
    const ics = [
      "BEGIN:VEVENT",
      "SUMMARY:All Day",
      "DTSTART;VALUE=DATE:20250401",
      "END:VEVENT",
    ].join("\n");

    const events = ics_parse_events(ics);
    expect(events[0].dtstart.value).toBe("20250401");
    expect(events[0].dtstart.params).toBe("VALUE=DATE");
  });

  test("parses RRULE", () => {
    const ics = [
      "BEGIN:VEVENT",
      "SUMMARY:Weekly",
      "DTSTART:20250101T090000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO",
      "END:VEVENT",
    ].join("\n");

    const events = ics_parse_events(ics);
    expect(events[0].rrule).toBe("FREQ=WEEKLY;BYDAY=MO");
  });

  test("parses DURATION", () => {
    const ics = [
      "BEGIN:VEVENT",
      "SUMMARY:Quick",
      "DTSTART:20250101T090000",
      "DURATION:PT1H",
      "END:VEVENT",
    ].join("\n");

    const events = ics_parse_events(ics);
    expect(events[0].duration).toBe("PT1H");
  });

  test("ignores lines outside VEVENT", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "SUMMARY:Should be ignored",
      "BEGIN:VEVENT",
      "SUMMARY:Real event",
      "DTSTART:20250101",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    const events = ics_parse_events(ics);
    expect(events.length).toBe(1);
    expect(events[0].summary).toBe("Real event");
  });
});
