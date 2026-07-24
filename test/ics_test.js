// Test harness for neatocal ICS import. Loads neatocal.js in a vm context
// (no DOM needed — only pure functions are exercised) and runs ICS text
// through ics_import_text, then inspects NEATOCAL_PARAM.data.
"use strict";
const fs = require("fs");
const vm = require("vm");

const path = require("path");
const SRC = fs.readFileSync(process.argv[2] || path.join(__dirname, "..", "neatocal.js"), "utf8");

function makeCtx(year, start_month = 0, n_month = 12) {
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  ctx.NEATOCAL_PARAM.year = year;
  ctx.NEATOCAL_PARAM.start_month = start_month;
  ctx.NEATOCAL_PARAM.n_month = n_month;
  ctx.NEATOCAL_PARAM.data = {};
  return ctx;
}

function importIcs(ctx, body) {
  const raw = "BEGIN:VCALENDAR\nVERSION:2.0\n" + body + "\nEND:VCALENDAR\n";
  vm.runInContext("ics_import_text(" + JSON.stringify(raw) + ", '#abc', '#000', 0)", ctx);
  return Object.keys(ctx.NEATOCAL_PARAM.data).sort();
}

function vevent(lines) { return "BEGIN:VEVENT\n" + lines.join("\n") + "\nEND:VEVENT"; }

let pass = 0, fail = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log("ok    " + name); }
  else {
    fail++;
    console.log("FAIL  " + name);
    console.log("      expected: " + e);
    console.log("      actual:   " + a);
  }
}

// --- 1. simple weekly (regression: existing behavior)
{
  const ctx = makeCtx(2026, 0, 2); // Jan-Feb 2026
  const days = importIcs(ctx, vevent([
    "DTSTART:20260105T090000", "DTEND:20260105T100000",
    "SUMMARY:Standup", "RRULE:FREQ=WEEKLY"]));
  check("weekly simple", days,
    ["2026-01-05","2026-01-12","2026-01-19","2026-01-26",
     "2026-02-02","2026-02-09","2026-02-16","2026-02-23"]);
}

// --- 2. weekly INTERVAL=2 + COUNT
{
  const ctx = makeCtx(2026, 0, 3);
  const days = importIcs(ctx, vevent([
    "DTSTART;VALUE=DATE:20260106",
    "SUMMARY:Biweekly", "RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=3"]));
  check("weekly interval=2 count=3", days, ["2026-01-06","2026-01-20","2026-02-03"]);
}

// --- 3. monthly on the 31st must skip short months (bug #1)
{
  const ctx = makeCtx(2026, 0, 12);
  const days = importIcs(ctx, vevent([
    "DTSTART;VALUE=DATE:20260131",
    "SUMMARY:Payday", "RRULE:FREQ=MONTHLY"]));
  check("monthly 31st skips short months", days,
    ["2026-01-31","2026-03-31","2026-05-31","2026-07-31",
     "2026-08-31","2026-10-31","2026-12-31"]);
}

// --- 4. yearly Feb 29 only lands on leap years (bug #1)
{
  const ctx = makeCtx(2026, 0, 12);
  const days = importIcs(ctx, vevent([
    "DTSTART;VALUE=DATE:20240229",
    "SUMMARY:Leap", "RRULE:FREQ=YEARLY"]));
  check("yearly feb29 absent in non-leap year", days, []);
  const ctx8 = makeCtx(2028, 0, 12);
  const days8 = importIcs(ctx8, vevent([
    "DTSTART;VALUE=DATE:20240229",
    "SUMMARY:Leap", "RRULE:FREQ=YEARLY"]));
  check("yearly feb29 present in leap year", days8, ["2028-02-29"]);
}

// --- 5. YEARLY;BYMONTH falls back to DTSTART day (bug #2)
{
  const ctx = makeCtx(2026, 0, 12);
  const days = importIcs(ctx, vevent([
    "DTSTART;VALUE=DATE:20250715",
    "SUMMARY:Anniv", "RRULE:FREQ=YEARLY;BYMONTH=7"]));
  check("yearly bymonth inherits dtstart day", days, ["2026-07-15"]);
}

// --- 6. WEEKLY;BYMONTH falls back to DTSTART weekday (bug #2)
{
  const ctx = makeCtx(2026, 0, 12);
  const days = importIcs(ctx, vevent([
    "DTSTART;VALUE=DATE:20260106", // a Tuesday
    "SUMMARY:T", "RRULE:FREQ=WEEKLY;BYMONTH=2"]));
  check("weekly bymonth inherits dtstart weekday", days,
    ["2026-02-03","2026-02-10","2026-02-17","2026-02-24"]);
}

// --- 7. WEEKLY;BYDAY multi-day + COUNT counts expanded occurrences
{
  const ctx = makeCtx(2026, 0, 2);
  const days = importIcs(ctx, vevent([
    "DTSTART;VALUE=DATE:20260105", // Monday
    "SUMMARY:MWF", "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=5"]));
  check("weekly byday count=5", days,
    ["2026-01-05","2026-01-07","2026-01-09","2026-01-12","2026-01-14"]);
}

// --- 8. MONTHLY;BYDAY=-1SU last Sunday
{
  const ctx = makeCtx(2026, 0, 3);
  const days = importIcs(ctx, vevent([
    "DTSTART;VALUE=DATE:20260125",
    "SUMMARY:LastSun", "RRULE:FREQ=MONTHLY;BYDAY=-1SU"]));
  check("monthly byday=-1SU", days, ["2026-01-25","2026-02-22","2026-03-29"]);
}

// --- 9. UNTIL is inclusive
{
  const ctx = makeCtx(2026, 0, 12);
  const days = importIcs(ctx, vevent([
    "DTSTART;VALUE=DATE:20260101",
    "SUMMARY:U", "RRULE:FREQ=WEEKLY;UNTIL=20260115"]));
  check("until inclusive", days, ["2026-01-01","2026-01-08","2026-01-15"]);
}

// --- 10. EXDATE removes occurrences (bug #3)
{
  const ctx = makeCtx(2026, 0, 2);
  const days = importIcs(ctx, vevent([
    "DTSTART:20260105T090000", "DTEND:20260105T100000",
    "SUMMARY:S", "RRULE:FREQ=WEEKLY;COUNT=4",
    "EXDATE:20260112T090000"]));
  check("exdate removes instance", days, ["2026-01-05","2026-01-19","2026-01-26"]);
}

// --- 11. EXDATE with VALUE=DATE and multiple values
{
  const ctx = makeCtx(2026, 0, 2);
  const days = importIcs(ctx, vevent([
    "DTSTART;VALUE=DATE:20260105",
    "SUMMARY:S", "RRULE:FREQ=DAILY;COUNT=5",
    "EXDATE;VALUE=DATE:20260106,20260108"]));
  check("exdate multi-value date", days, ["2026-01-05","2026-01-07","2026-01-09"]);
}

// --- 12. RECURRENCE-ID override suppresses base occurrence (bug #3)
{
  const ctx = makeCtx(2026, 0, 2);
  const days = importIcs(ctx,
    vevent([
      "UID:abc@x", "DTSTART:20260105T090000", "DTEND:20260105T100000",
      "SUMMARY:S", "RRULE:FREQ=WEEKLY;COUNT=3"]) + "\n" +
    vevent([
      "UID:abc@x", "RECURRENCE-ID:20260112T090000",
      "DTSTART:20260114T090000", "DTEND:20260114T100000",
      "SUMMARY:S (moved)"]));
  check("recurrence-id moves instance", days, ["2026-01-05","2026-01-14","2026-01-19"]);
}

// --- 13. DURATION spans days (bug #7)
{
  const ctx = makeCtx(2026, 0, 1);
  const days = importIcs(ctx, vevent([
    "DTSTART;VALUE=DATE:20260110", "DURATION:P3D", "SUMMARY:Trip"]));
  check("duration P3D spans 3 days", days, ["2026-01-10","2026-01-11","2026-01-12"]);
}

// --- 14. SUMMARY unescaping (bug #8)
{
  const ctx = makeCtx(2026, 0, 1);
  importIcs(ctx, vevent([
    "DTSTART;VALUE=DATE:20260110", "SUMMARY:Lunch\\, with Bob\\; maybe"]));
  const ev = ctx.NEATOCAL_PARAM.data["2026-01-10"][0];
  check("summary unescaped", ev.title, "Lunch, with Bob; maybe");
}

// --- 15. RRULE event without DTSTART must not throw (bug #4)
{
  const ctx = makeCtx(2026, 0, 1);
  let threw = false;
  try {
    importIcs(ctx,
      vevent(["SUMMARY:NoStart", "RRULE:FREQ=WEEKLY"]) + "\n" +
      vevent(["DTSTART;VALUE=DATE:20260110", "SUMMARY:Good"]));
  } catch (e) { threw = true; }
  check("missing dtstart no crash, good event kept",
    { threw, days: Object.keys(ctx.NEATOCAL_PARAM.data) },
    { threw: false, days: ["2026-01-10"] });
}

// --- 16. malformed UNTIL must not throw (bug #4)
{
  const ctx = makeCtx(2026, 0, 1);
  let threw = false;
  try {
    importIcs(ctx, vevent([
      "DTSTART;VALUE=DATE:20260110", "SUMMARY:BadUntil",
      "RRULE:FREQ=WEEKLY;UNTIL=banana"]));
  } catch (e) { threw = true; }
  check("malformed until no crash", threw, false);
}

// --- 17. multi-day non-recurring event with DTEND (regression)
{
  const ctx = makeCtx(2026, 0, 1);
  const days = importIcs(ctx, vevent([
    "DTSTART;VALUE=DATE:20260120", "DTEND;VALUE=DATE:20260123", "SUMMARY:Conf"]));
  check("multi-day dtend exclusive", days, ["2026-01-20","2026-01-21","2026-01-22"]);
}

// --- 18. timed DURATION PT1H30M stays single day
{
  const ctx = makeCtx(2026, 0, 1);
  const days = importIcs(ctx, vevent([
    "DTSTART:20260110T100000", "DURATION:PT1H30M", "SUMMARY:Mtg"]));
  check("duration PT1H30M single day", days, ["2026-01-10"]);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
