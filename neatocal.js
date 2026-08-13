/*

MIT License

Copyright (c) 2022 Neatnik LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

var NEATOCAL_PARAM = {

  // experiments with filling in data in cells
  //
  "data_fn": "",

  "data": { },
  "ics_import_count": 0,
  "ics_imports": [],
  "ics": false,

  "firefox_hack": true,

  "color_cell": [],

  // Putting data in cells can alter the cell/row height,
  // so we allow a user parameter to fiddle with cell height.
  // The parameter here is directly applied to the `tr` style,
  // so values of "1.5em" or "30px" will work.
  //
  "cell_height": "",

  // show info/help screen
  //
  "help" : false,

  // for aligned-weekdays, which day to start (0 indexed)
  //
  //   Monday (1) default
  //
  "start_day": 1,

  // calendar format
  //
  //   default
  //   aligned-weekdays
  //
  "format": "default",

  // text direction
  //
  //   ltr default
  //   rtl
  //
  "dir": "",

  // year to start
  //
  //   default this year
  //
  "year": new Date().getFullYear(),

  // Text to use for displaying weekdays
  //
  "weekday_code" : [ "Su", "M", "T", "W", "R", "F", "Sa"  ],

  // Weekday representation https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#weekday
  //
  //   long
  //   short
  //   narrow
  //
  "weekday_format": "short",

  // text to sue for month header
  //
  "month_code": [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],

  // Month representation https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#month
  //
  //   numeric
  //   2-digit
  //   long
  //   short
  //   narrow
  //
  "month_format": "short",

  // weekend days (0=Sun, 1=Mon, ..., 5=Fri, 6=Sat)
  // Default Sunday Monday.
  //
  "weekend_days": [ 0, 6 ],

  //
  "language" : "",

  // start month (0 indexed)
  //
  //   Janurary (0) default
  //
  "start_month" : 0,

  // number of months to go out to
  //
  "n_month" : 12,

  // weekend highlight color
  //
  "highlight_color": '#eee',

  // today's date highlight color
  //
  "today_highlight_color": '',

  // Moon phase display options
  //
  "show_moon_phase": false,
  "moon_phase_style": "css",  // "css", "symbol", "name"
  "moon_phase_position": "below",  // "below", "inline"
  "moon_phase_display": "changes",  // "all", "changes"
  //
  // show week numbers
  //
  "show_week_numbers": false,

  "font_family": '',

  // fiddly parameters
  //
  "year_font_size": undefined,
  "year_font_weight": undefined,
  "year_foreground_color": undefined,
  "year_background_color": undefined,

  "month_font_size": undefined,
  "month_font_weight": undefined,
  "month_foreground_color": undefined,
  "month_background_color": undefined,

  "weekday_font_size": undefined,
  "weekday_font_weight": undefined,
  "weekday_foreground_color": undefined,
  "weekday_background_color": undefined,

  "weekend_font_size": undefined,
  "weekend_font_weight": undefined,
  "weekend_foreground_color": undefined,
  "weekend_background_color": undefined,

  "week_font_size": undefined,
  "week_font_weight": undefined,
  "week_foreground_color": undefined,
  "week_background_color": undefined,

  "date_font_size": undefined,
  "date_font_weight": undefined,
  "date_foreground_color": undefined,
  "date_background_color": undefined,

  "weekend_date_font_size": undefined,
  "weekend_date_font_weight": undefined,
  "weekend_date_foreground_color": undefined,
  "weekend_date_background_color": undefined

};

var ICS_PALETTE = [
  { "bg": "#cfe8ff", "fg": "#000000" },
  { "bg": "#1e4f8a", "fg": "#ffffff" },
  { "bg": "#ffd6d6", "fg": "#000000" },
  { "bg": "#8a1f2b", "fg": "#ffffff" },
  { "bg": "#d8f5d0", "fg": "#000000" },
  { "bg": "#1f6b3d", "fg": "#ffffff" },
  { "bg": "#fff2b3", "fg": "#000000" },
  { "bg": "#8a6b10", "fg": "#ffffff" }
];

// use __base to allow additional events from ics files to be
// consolidated with any supplied via data param on page load
function data_clone_base(data) {
  let clone = JSON.parse(JSON.stringify(data || {}));
  if (clone && typeof clone === "object") {
    delete clone.__base;
  }
  return clone;
}

function data_set_base(data) {
  let base = data_clone_base(data);
  let current = data_clone_base(base);
  current.__base = base;
  NEATOCAL_PARAM.data = current;
}

// simple HTML convenience functions
//
var H = {
  "text": function(txt) { return document.createTextNode(txt); },
  "div": function() { return document.createElement("div"); },
  "tr": function() { return document.createElement("tr"); },
  "th": function(v) {
    let th = document.createElement("th");
    if (typeof v !== "undefined") { th.innerHTML = v; }
    return th;
  },
  "td": function() { return document.createElement("td"); },
  "span": function(v,_class) {
    let s = document.createElement("span");
    if (typeof v !== "undefined") { s.innerHTML = v; }
    if (typeof _class !== "undefined") { s.classList.add(_class); }
    return s;
  }
};

// Probably overkill but have parameters to fiddle with the weekend text, weekday text,
// date (day in month) text, month text, week number (if specified) and dates that fall
// on the weekend (day in month that are also weekends).
// Logic is in each of the render functions but the idea is that date stylings happens
// first then weekend_date stylings are applied.
//
// ele is the HTML element that class stylings are being applied.
// _type is one of "weekend", "weekday", "date", "month", "week", "weekend_date"
//
// _type is checked for validity from the `valid_types` array.
// If not found, returns.
//
// If found, each of the parameter variables is enumerated by tacking on the suffix
// in the `sfx_param` array and testing to see if specified in the NEATOCAL_PARAM list.
// If found, the class stylings are applied to the HTML element using the `class_key`
// value specified.
//
function ele_styles(ele, _type) {
  let valid_type = ["weekend", "weekday", "date", "month", "week", "weekend_date", "year"];
  let sfx_param = [ "_font_size", "_font_weight", "_foreground_color", "_background_color"];
  let class_key = ["fontSize", "fontWeight", "color", "background"];

  let _t = "";
  for (let i=0; i<valid_type.length; i++) {
    if (valid_type[i] == _type) { _t = valid_type[i];  break; }
  }
  if (_t == "") { return; }

  for (let i=0; i<sfx_param.length; i++) {
    let _param = _t + sfx_param[i];
    if ((_param in NEATOCAL_PARAM) &&
        (typeof NEATOCAL_PARAM[_param] !== "undefined")) {
      ele.style[class_key[i]] = NEATOCAL_PARAM[_param];
    }
  }

}

// for convenience, functions wrap the above meta function
//
function weekend_styles(weekend_ele) { ele_styles(weekend_ele, "weekend"); }
function weekday_styles(weekday_ele) { ele_styles(weekday_ele, "weekday"); }
function week_styles(week_ele) { ele_styles(week_ele, "week"); }
function date_styles(date_ele) { ele_styles(date_ele, "date"); }
function weekend_date_styles(weekend_date_ele) { ele_styles(weekend_date_ele, "weekend_date"); }
function month_styles(month_ele) { ele_styles(month_ele, "month"); }
function year_styles(year_ele) { ele_styles(year_ele, "year"); }

function render_cell_data(td, yyyy_mm_dd) {
  if (!(yyyy_mm_dd in NEATOCAL_PARAM.data)) { return; }

  let val = NEATOCAL_PARAM.data[yyyy_mm_dd];

  if (typeof val === "string") {
    let txt = H.div();
    txt.innerHTML = val;
    txt.style.textAlign = "center";
    txt.style.fontWeight = "300";
    td.appendChild(txt);
    return;
  }

  if (!Array.isArray(val)) { return; }

  for (let i = 0; i < val.length; i++) {
    let item = val[i];

    // for simple data, just render text
    //
    if (typeof item === "string") {
      let txt = H.div();
      txt.innerHTML = item;
      txt.style.textAlign = "center";
      txt.style.fontWeight = "300";
      td.appendChild(txt);
      continue;
    }

    // for more complex date information,
    // from iCal, say, decorate with extra
    // markup
    //
    let line = H.div();
    line.classList.add("event");
    line.textContent = item.title || "";

    if (item.color) {
      line.style.background = item.color;
    }
    if (item.text_color) {
      line.style.color = item.text_color;
    }
    if (item.span) {
      line.classList.add("event-span");
      if (item.span.start) { line.classList.add("event-span-start"); }
      if (item.span.end) { line.classList.add("event-span-end"); }
    }

    td.appendChild(line);
  }
}

function add_event_to_date(yyyy_mm_dd, event) {
  if (!(yyyy_mm_dd in NEATOCAL_PARAM.data)) {
    NEATOCAL_PARAM.data[yyyy_mm_dd] = [];
  } else if (!Array.isArray(NEATOCAL_PARAM.data[yyyy_mm_dd])) {
    NEATOCAL_PARAM.data[yyyy_mm_dd] = [NEATOCAL_PARAM.data[yyyy_mm_dd]];
  }
  NEATOCAL_PARAM.data[yyyy_mm_dd].push(event);
}

function get_view_range() {
  let start = new Date(NEATOCAL_PARAM.year, NEATOCAL_PARAM.start_month, 1);
  let end = new Date(NEATOCAL_PARAM.year, NEATOCAL_PARAM.start_month + NEATOCAL_PARAM.n_month, 1);
  return { start: start, end: end };
}


// Moon phase calculation functions
//
// The exact instants of the four principal phases (new moon, first quarter,
// full moon, last quarter) are computed with the truncated periodic series
// from Meeus' "Astronomical Algorithms"
//
const MOON_SYNODIC_MONTH = 29.530588861;

function moon_deg2rad(d) { return d * Math.PI / 180.0; }

// Difference between Terrestrial Dynamical Time and Universal Time, in
// seconds. Meeus' phase series yields TDT, but calendar days are UT, and the
// two differ by around 70 seconds at the moment. That is only enough to matter
// when a phase falls within a minute or two of midnight, but without it those
// cases land on the wrong day, always in the same direction
//
function moon_delta_t(year) {
  let t, u;

  if ((year >= 1900) && (year < 1920)) {
    t = year - 1900;
    return -2.79 + (1.494119*t) - (0.0598939*t*t) + (0.0061966*t*t*t) - (0.000197*t*t*t*t);
  }

  if ((year >= 1920) && (year < 1941)) {
    t = year - 1920;
    return 21.20 + (0.84493*t) - (0.076100*t*t) + (0.0020936*t*t*t);
  }

  if ((year >= 1941) && (year < 1961)) {
    t = year - 1950;
    return 29.07 + (0.407*t) - ((t*t)/233) + ((t*t*t)/2547);
  }

  if ((year >= 1961) && (year < 1986)) {
    t = year - 1975;
    return 45.45 + (1.067*t) - ((t*t)/260) - ((t*t*t)/718);
  }

  if ((year >= 1986) && (year < 2005)) {
    t = year - 2000;
    return 63.86 + (0.3345*t) - (0.060374*t*t) + (0.0017275*t*t*t)
         + (0.000651814*t*t*t*t) + (0.00002373599*t*t*t*t*t);
  }

  if ((year >= 2005) && (year < 2050)) {
    t = year - 2000;
    return 62.92 + (0.32217*t) + (0.005589*t*t);
  }

  if ((year >= 2050) && (year <= 2150)) {
    u = (year - 1820) / 100;
    return -20 + (32*u*u) - (0.5628 * (2150 - year));
  }

  u = (year - 1820) / 100;
  return -20 + (32*u*u);
}

// Julian Ephemeris Day of a phase instant.
//
//   k       - lunation number, 0 == the new moon of 2000 Jan 6
//   quarter - 0 new moon, 1 first quarter, 2 full moon, 3 last quarter
//
function moon_phase_jde(k, quarter) {
  k = k + (quarter * 0.25);

  let T  = k / 1236.85;
  let T2 = T*T, T3 = T2*T, T4 = T3*T;

  let jde = 2451550.09766 + (MOON_SYNODIC_MONTH * k)
          + (0.00015437 * T2)
          - (0.000000150 * T3)
          + (0.00000000073 * T4);

  // eccentricity correction of the earth's orbit
  //
  let E = 1.0 - (0.002516 * T) - (0.0000074 * T2);

  // M  - sun's mean anomaly
  // Mp - moon's mean anomaly
  // F  - moon's argument of latitude
  // Om - longitude of the ascending node
  //
  let M  = 2.5534   + (29.10535670 * k)  - (0.0000014 * T2) - (0.00000011 * T3);
  let Mp = 201.5643 + (385.81693528 * k) + (0.0107582 * T2) + (0.00001238 * T3) - (0.000000058 * T4);
  let F  = 160.7108 + (390.67050284 * k) - (0.0016118 * T2) - (0.00000227 * T3) + (0.000000011 * T4);
  let Om = 124.7746 - (1.56375588 * k)   + (0.0020672 * T2) + (0.00000215 * T3);

  M  = moon_deg2rad(M);
  Mp = moon_deg2rad(Mp);
  F  = moon_deg2rad(F);
  Om = moon_deg2rad(Om);

  let sin = Math.sin, cos = Math.cos;
  let corr = 0;

  if (quarter === 0) {
    corr = -0.40720 * sin(Mp)
         + 0.17241 * E * sin(M)
         + 0.01608 * sin(2*Mp)
         + 0.01039 * sin(2*F)
         + 0.00739 * E * sin(Mp - M)
         - 0.00514 * E * sin(Mp + M)
         + 0.00208 * E * E * sin(2*M)
         - 0.00111 * sin(Mp - 2*F)
         - 0.00057 * sin(Mp + 2*F)
         + 0.00056 * E * sin(2*Mp + M)
         - 0.00042 * sin(3*Mp)
         + 0.00042 * E * sin(M + 2*F)
         + 0.00038 * E * sin(M - 2*F)
         - 0.00024 * E * sin(2*Mp - M)
         - 0.00017 * sin(Om)
         - 0.00007 * sin(Mp + 2*M);
  }

  else if (quarter === 2) {
    corr = -0.40614 * sin(Mp)
         + 0.17302 * E * sin(M)
         + 0.01614 * sin(2*Mp)
         + 0.01043 * sin(2*F)
         + 0.00734 * E * sin(Mp - M)
         - 0.00515 * E * sin(Mp + M)
         + 0.00209 * E * E * sin(2*M)
         - 0.00111 * sin(Mp - 2*F)
         - 0.00057 * sin(Mp + 2*F)
         + 0.00056 * E * sin(2*Mp + M)
         - 0.00042 * sin(3*Mp)
         + 0.00042 * E * sin(M + 2*F)
         + 0.00038 * E * sin(M - 2*F)
         - 0.00024 * E * sin(2*Mp - M)
         - 0.00017 * sin(Om)
         - 0.00007 * sin(Mp + 2*M);
  }

  else {
    corr = -0.62801 * sin(Mp)
         + 0.17172 * E * sin(M)
         - 0.01183 * E * sin(Mp + M)
         + 0.00862 * sin(2*Mp)
         + 0.00804 * sin(2*F)
         + 0.00454 * E * sin(Mp - M)
         + 0.00204 * E * E * sin(2*M)
         - 0.00180 * sin(Mp - 2*F)
         - 0.00070 * sin(Mp + 2*F)
         - 0.00040 * sin(3*Mp)
         - 0.00034 * E * sin(2*Mp - M)
         + 0.00032 * E * sin(M + 2*F)
         + 0.00032 * E * sin(M - 2*F)
         - 0.00028 * E * E * sin(Mp + 2*M)
         + 0.00027 * E * sin(2*Mp + M)
         - 0.00017 * sin(Om);

    let W = 0.00306
          - 0.00038 * E * cos(M)
          + 0.00026 * cos(Mp)
          - 0.00002 * cos(Mp - M)
          + 0.00002 * cos(Mp + M)
          + 0.00002 * cos(2*F);

    corr += ((quarter === 1) ? W : -W);
  }

  return jde + corr;
}

// Phase instants get looked up repeatedly while filling in cells, so memoize
// them. A full year of cells touches only a couple of dozen entries.
//
const MOON_PHASE_INSTANT_CACHE = {};

// Unix epoch milliseconds of a phase instant.
//
function moon_phase_instant(k, quarter) {
  let key = k.toString() + ":" + quarter.toString();
  if (!(key in MOON_PHASE_INSTANT_CACHE)) {
    let jde = moon_phase_jde(k, quarter);
    let ms  = Math.round((jde - 2440587.5) * 86400000);

    // TDT -> UT
    //
    let year = new Date(ms).getUTCFullYear();
    ms -= Math.round(moon_delta_t(year) * 1000);

    MOON_PHASE_INSTANT_CACHE[key] = ms;
  }
  return MOON_PHASE_INSTANT_CACHE[key];
}

// Approximate lunation number for a year/month. There are about 12.3685
// lunations in a year, so this is within one of the true value, and callers
// scan a small window around it.
//
function moon_lunation_index(year, month) {
  return Math.floor((year + ((month + 0.5) / 12) - 2000) * 12.3685);
}

// If a principal phase instant falls inside the given local calendar day,
// return its phase index (0 new, 2 first quarter, 4 full, 6 last quarter).
// Otherwise return -1.
//
// Day boundaries are local, so the calendar marks the phase on the day an
// observer in the browser's timezone would see it. Constructing both bounds
// from local date components keeps this correct across DST transitions.
//
function moon_principal_phase_on_day(year, month, day) {
  let day_start = new Date(year, month, day,     0, 0, 0, 0).getTime();
  let day_end   = new Date(year, month, day + 1, 0, 0, 0, 0).getTime();

  let k0 = moon_lunation_index(year, month);

  for (let dk = -1; dk <= 1; dk++) {
    for (let q = 0; q < 4; q++) {
      let t = moon_phase_instant(k0 + dk, q);
      if ((t >= day_start) && (t < day_end)) { return q * 2; }
    }
  }

  return -1;
}

// Days elapsed since the most recent true new moon, sampled at local noon so
// the value reflects the bulk of the day rather than its first instant.
//
function calculateLunarAge(year, month, day) {
  let t = new Date(year, month, day, 12, 0, 0, 0).getTime();
  let k = moon_lunation_index(year, month);

  while (moon_phase_instant(k, 0) > t)      { k -= 1; }
  while (moon_phase_instant(k + 1, 0) <= t) { k += 1; }

  return (t - moon_phase_instant(k, 0)) / 86400000;
}

function getMoonPhase(lunarAge) {

  // Returns phase index 0-7
  // 0: New Moon, 1: Waxing Crescent, 2: First Quarter, 3: Waxing Gibbous
  // 4: Full Moon, 5: Waning Gibbous, 6: Last Quarter, 7: Waning Crescent
  //
  let phase = Math.round((lunarAge / MOON_SYNODIC_MONTH) * 8) % 8;

  return phase;
}

function getMoonIllumination(lunarAge) {
  // Returns illumination percentage 0-100
  let percent = ((1 - Math.cos((lunarAge / MOON_SYNODIC_MONTH) * 2 * Math.PI)) / 2) * 100;
  return Math.round(percent);
}

function getMoonPhaseName(phase) {
  const names = [
    "New", "Wax Cres", "First Qtr", "Wax Gibb",
    "Full", "Wan Gibb", "Last Qtr", "Wan Cres"
  ];
  return names[phase];
}

function getMoonPhaseSymbol(phase) {
  const symbols = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  return symbols[phase];
}

// Counter for unique mask IDs
//
var MOON_PHASE_COUNTER = 0;

function createMoonPhaseCSS(phase, lunarAge) {

  // Create an inline SVG moon phase visualization with unique mask IDs
  //
  let span = H.span("", "moon-phase");
  let uid = ++MOON_PHASE_COUNTER;

  // SVG moon phase definitions using masks for curved terminators
  //
  const svgs = [

    // 0: New Moon
    //
    "<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><circle cx='32' cy='32' r='30' fill='#404040'/></svg>",

    // 1: Waxing Crescent
    //
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><defs><mask id='m1-${uid}'><circle cx='32' cy='32' r='30' fill='white'/><circle cx='22' cy='32' r='30' fill='black'/></mask></defs><circle cx='32' cy='32' r='30' fill='#404040'/><circle cx='32' cy='32' r='30' fill='#d0d0d0' mask='url(#m1-${uid})'/></svg>`,

    // 2: First Quarter
    //
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><defs><mask id='m2-${uid}'><rect x='32' y='0' width='32' height='64' fill='white'/></mask></defs><circle cx='32' cy='32' r='30' fill='#404040'/><circle cx='32' cy='32' r='30' fill='#d0d0d0' mask='url(#m2-${uid})'/></svg>`,

    // 3: Waxing Gibbous
    //
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><defs><mask id='m3-${uid}'><circle cx='32' cy='32' r='30' fill='white'/><circle cx='42' cy='32' r='30' fill='black'/></mask></defs><circle cx='32' cy='32' r='30' fill='#d0d0d0'/><circle cx='32' cy='32' r='30' fill='#404040' mask='url(#m3-${uid})'/></svg>`,

    // 4: Full Moon
    //
    "<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><circle cx='32' cy='32' r='30' fill='#d0d0d0'/></svg>",

    // 5: Waning Gibbous
    //
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><defs><mask id='m5-${uid}'><circle cx='32' cy='32' r='30' fill='white'/><circle cx='22' cy='32' r='30' fill='black'/></mask></defs><circle cx='32' cy='32' r='30' fill='#d0d0d0'/><circle cx='32' cy='32' r='30' fill='#404040' mask='url(#m5-${uid})'/></svg>`,

    // 6: Last Quarter (Third Quarter)
    //
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><defs><mask id='m6-${uid}'><rect x='0' y='0' width='32' height='64' fill='white'/></mask></defs><circle cx='32' cy='32' r='30' fill='#404040'/><circle cx='32' cy='32' r='30' fill='#d0d0d0' mask='url(#m6-${uid})'/></svg>`,

    // 7: Waning Crescent
    //
    `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><defs><mask id='m7-${uid}'><circle cx='32' cy='32' r='30' fill='white'/><circle cx='42' cy='32' r='30' fill='black'/></mask></defs><circle cx='32' cy='32' r='30' fill='#404040'/><circle cx='32' cy='32' r='30' fill='#d0d0d0' mask='url(#m7-${uid})'/></svg>`
  ];

  span.innerHTML = svgs[phase];
  return span;
}

function renderMoonPhase(td, year, month, day) {
  if (!NEATOCAL_PARAM.show_moon_phase) { return; }

  let lunarAge = calculateLunarAge(year, month, day);
  let phase;

  if (NEATOCAL_PARAM.moon_phase_display === "changes") {

    // Mark only the days that actually contain a principal phase instant
    //
    phase = moon_principal_phase_on_day(year, month, day);
    if (phase < 0) { return; }
  }

  else {
    phase = getMoonPhase(lunarAge);
  }

  let moonElement;

  if (NEATOCAL_PARAM.moon_phase_style === "symbol") {
    moonElement = H.span(getMoonPhaseSymbol(phase), "moon-symbol");
  }

  else if (NEATOCAL_PARAM.moon_phase_style === "name") {
    moonElement = H.span(getMoonPhaseName(phase), "moon-name");
  }

  else {

    // Default to CSS
    //
    moonElement = createMoonPhaseCSS(phase, lunarAge);
  }

  if (NEATOCAL_PARAM.moon_phase_position === "inline") {

    // Add inline after a space
    //
    moonElement.classList.add("moon-inline");
    td.appendChild(H.text(" "));
    td.appendChild(moonElement);
  }

  else {

    // Add below in its own container
    //
    let moonContainer = H.div();
    moonContainer.classList.add("moon-container");
    moonContainer.appendChild(moonElement);
    td.appendChild(moonContainer);
  }

}

function localized_day(locale, day_idx) {
  let iday = 17 + day_idx;
  let s = '1995-12-' + iday.toString() + 'T12:00:01Z';
  let d = new Date(s);
  return d.toLocaleDateString(locale, {"weekday":NEATOCAL_PARAM.weekday_format});
}

function localized_month(locale, mo_idx) {
  let imo = 1 + mo_idx;
  let imo_str = ((imo < 10) ? ("0" + imo.toString()) : imo.toString());
  let s = '1995-' + imo_str + '-18T12:00:01Z';
  let d = new Date(s);
  return d.toLocaleDateString(locale, {"month":NEATOCAL_PARAM.month_format});
}

function neatocal_hallon_almanackan() {
  let year      = NEATOCAL_PARAM.year;
  let start_mo  = NEATOCAL_PARAM.start_month;
  let n_mo      = NEATOCAL_PARAM.n_month;

  let ui_tr_mo = document.getElementById("ui_tr_month_name");
  ui_tr_mo.innerHTML = "";
  for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {
    let th_mo = H.th( NEATOCAL_PARAM.month_code[ i_mo%12 ] );
    month_styles(th_mo);
    ui_tr_mo.appendChild( th_mo );
  }

  // Precompute the parity of week the day falls on.
  // Calendar is month major order, making it more difficult
  // to calculate the parity of week the day falls in.
  //
  let week_parity = 0;
  let day_parity = {};
  for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {

    let cur_year = parseInt(year) + Math.floor(i_mo/12);
    let cur_mo = i_mo%12;
    let nday_in_mo = new Date(cur_year,cur_mo+1,0).getDate();

    if (!(i_mo in day_parity)) {
      day_parity[i_mo] = {};
    }

    for (let day_idx=0; day_idx < 31; day_idx++) {
      if (day_idx >= nday_in_mo) { break; }

      day_parity[i_mo][day_idx] = week_parity;

      let dt = new Date(cur_year, cur_mo, day_idx+1);
      if (dt.getDay() == 0) {
        week_parity = 1-week_parity;
      }

    }
  }

  let tbody = document.getElementById("ui_tbody");
  for (let idx=0; idx<31; idx++) {

    let tr = H.tr();
    if ((typeof NEATOCAL_PARAM.cell_height !== "undefined") &&
        (NEATOCAL_PARAM.cell_height != null) &&
        (NEATOCAL_PARAM.cell_height != "")) {
      tr.style.height = NEATOCAL_PARAM.cell_height;
    }


    let cur_year = year;
    for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {

      cur_year = parseInt(year) + Math.floor(i_mo/12);

      let cur_mo = i_mo%12;

      let nday_in_mo = new Date(cur_year,cur_mo+1,0).getDate();

      let td = H.td();
      td.style.width = (100/n_mo).toString() + "%";

      td.id = "ui_" + fmt_date(cur_year, cur_mo+1, idx+1);

      if (idx < nday_in_mo) {

        let dt = new Date(cur_year, cur_mo, idx+1);

        let d = NEATOCAL_PARAM.weekday_code[ dt.getDay() ];

        if (day_parity[i_mo][idx]) {
          td.classList.add("weekend");
        }

        if ((dt.getDay() != 0) ||
            (idx == (nday_in_mo-1))) {
          td.style.borderBottom = '0';
        }


        let span_date = H.span((idx+1).toString(), "date");
        let span_day = H.span(d, "day");

        // If any param specified stylings apply, apply them.
        // Date stylings happen before weekend_date so that
        // the weekend_date, if specified, can override
        //

        date_styles(span_date);

        //if (dt.getDay() == 0) {
        if (NEATOCAL_PARAM.weekend_days.includes(dt.getDay())) {
          span_date.style.color = "rgb(230,37,7)";
          span_day.style.color = "rgb(230,37,7)";
          weekend_styles(span_day);
          weekend_date_styles(span_date);
        }

        else {
          weekday_styles(span_day);
        }

        td.appendChild( span_date );
        td.appendChild( span_day );

        if ((dt.getDay() == 1) && NEATOCAL_PARAM.show_week_numbers) {
          let span_week_no = H.span(getISOWeekNumber(dt), "date");
          span_week_no.style.float = (NEATOCAL_PARAM.dir === "rtl") ? "left" : "right";
          span_week_no.style.color = "rgb(230,37,7)";
          week_styles(span_week_no);
          td.appendChild(span_week_no);
        }

        let yyyy_mm_dd = fmt_date(cur_year, cur_mo+1, idx+1);
        render_cell_data(td, yyyy_mm_dd);

        // Add moon phase if enabled
        //
        renderMoonPhase(td, cur_year, cur_mo, idx+1);

      }
      tr.appendChild(td);

    }

    tbody.appendChild(tr);

  }

}

function neatocal_default() {
  let year      = NEATOCAL_PARAM.year;
  let start_mo  = NEATOCAL_PARAM.start_month;
  let n_mo      = NEATOCAL_PARAM.n_month;

  let ui_tr_mo = document.getElementById("ui_tr_month_name");
  ui_tr_mo.innerHTML = "";
  for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {
    let th_mo = H.th( NEATOCAL_PARAM.month_code[ i_mo%12 ] );
    month_styles(th_mo);
    ui_tr_mo.appendChild( th_mo );
  }

  let tbody = document.getElementById("ui_tbody");
  for (let idx=0; idx<31; idx++) {

    let tr = H.tr();
    if ((typeof NEATOCAL_PARAM.cell_height !== "undefined") &&
        (NEATOCAL_PARAM.cell_height != null) &&
        (NEATOCAL_PARAM.cell_height != "")) {
      tr.style.height = NEATOCAL_PARAM.cell_height;
    }


    let cur_year = year;
    for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {

      cur_year = parseInt(year) + Math.floor(i_mo/12);

      let cur_mo = i_mo%12;

      let nday_in_mo = new Date(cur_year,cur_mo+1,0).getDate();

      let td = H.td();
      td.style.width = (100/n_mo).toString() + "%";
      td.id = "ui_" + fmt_date(cur_year, cur_mo+1, idx+1);

      if (idx < nday_in_mo) {

        let dt = new Date(cur_year, cur_mo, idx+1);

        let d = NEATOCAL_PARAM.weekday_code[ dt.getDay() ];

        //if ((dt.getDay() == 0) ||
        //    (dt.getDay() == 6)) {
        if (NEATOCAL_PARAM.weekend_days.includes(dt.getDay())) {
          td.classList.add("weekend");
        }

        let span_date = H.span((idx+1).toString(), "date");
        let span_day = H.span(d, "day");

        // If any param specified stylings apply, apply them.
        // Date stylings happen before weekend_date so that
        // the weekend_date, if specified, can override
        //

        date_styles(span_date);

        if ((dt.getDay() == 0) ||
            (dt.getDay() == 6)) {
          weekend_styles(span_day);
          weekend_date_styles(span_date);
        }

        else {
          weekday_styles(span_day);
        }

        td.appendChild( span_date );
        td.appendChild( span_day );

        if ((dt.getDay() == 1) && NEATOCAL_PARAM.show_week_numbers) {
          let span_week_no = H.span(getISOWeekNumber(dt), "date");
          span_week_no.style.float = (NEATOCAL_PARAM.dir === "rtl") ? "left" : "right";
          span_week_no.style.color = "rgb(230,37,7)";
          week_styles(span_week_no);
          td.appendChild(span_week_no);
        }

        let yyyy_mm_dd = fmt_date(cur_year, cur_mo+1, idx+1);
        render_cell_data(td, yyyy_mm_dd);

        // Add moon phase if enabled
        //
        renderMoonPhase(td, cur_year, cur_mo, idx+1);

      }
      tr.appendChild(td);

    }

    tbody.appendChild(tr);

  }

}

function fmt_date(y,m,d) {
  let res = y.toString() + "-";
  if (m<10) {
    res += "0";
  }
  res += m.toString() + "-";
  if (d < 10) {
    res += "0";
  }
  res += d.toString();
  return res;
}

function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  // Set to nearest Thursday: current date + 4 - current day number (Mon=1, Sun=7)
  //

  // Convert Sunday from 0 to 7
  //
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);

  // Get first day of year
  //
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  // Calculate full weeks from year start to nearest Thursday
  //
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function neatocal_aligned_weekdays() {
  let year      = parseInt(NEATOCAL_PARAM.year);
  let start_mo  = parseInt(NEATOCAL_PARAM.start_month);
  let n_mo      = parseInt(NEATOCAL_PARAM.n_month);

  let ui_tr_mo = document.getElementById("ui_tr_month_name");
  ui_tr_mo.innerHTML = "";
  for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {
    let th_mo = H.th( NEATOCAL_PARAM.month_code[ i_mo%12 ] );
    month_styles(th_mo);
    ui_tr_mo.appendChild( th_mo );
  }

  // start_day, when to start the first day in the month.
  // day_in_mo_start is the number of days past the start_day
  //   the month starts, so we know how much to skip over when
  //   displaying the aligned cells.
  //
  let max_start = -1;
  let start_day = NEATOCAL_PARAM.start_day;
  let day_in_mo_start = [];
  for (let i=0; i<n_mo; i++) { day_in_mo_start.push(0); }
  for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {
    let cur_year = parseInt(year) + Math.floor(i_mo/12);
    let cur_mo = i_mo%12;
    let s = new Date(cur_year, cur_mo, 1).getDay();
    day_in_mo_start[i_mo - start_mo] = s;

    if (day_in_mo_start[i_mo - start_mo] > max_start) {
      max_start = day_in_mo_start[i_mo - start_mo];
    }
  }

  let tbody = document.getElementById("ui_tbody");
  for (let idx=0; idx<42; idx++) {

    let tr = H.tr();
    if ((typeof NEATOCAL_PARAM.cell_height !== "undefined") &&
        (NEATOCAL_PARAM.cell_height != null) &&
        (NEATOCAL_PARAM.cell_height != "")) {
      tr.style.height = NEATOCAL_PARAM.cell_height;
    }

    let cur_year = year;
    for (let i_mo = start_mo; i_mo < (start_mo+n_mo); i_mo++) {

      cur_year = parseInt(year) + Math.floor(i_mo/12);

      // cur_mo is the month in the current year
      // nday_in_mo is the number of days in the month under consideration
      // day_idx is the day of the month this cell would fall in,
      //  which can be out of bounds (less than 0 or greater than the number of
      //  days in the month)
      //
      let cur_mo = i_mo%12;
      let nday_in_mo = new Date(cur_year,cur_mo+1,0).getDate();
      let day_idx = idx - ((day_in_mo_start[i_mo - start_mo] - start_day + 7)%7);

      let td = H.td();
      td.style.width = (100/n_mo).toString() + "%";
      td.id = "ui_" + fmt_date(cur_year, cur_mo+1, day_idx+1);

      // if our day falls within bounds, we decorate the td with the appropriate
      // values
      //
      if ((day_idx >= 0) &&
          (day_idx < nday_in_mo)) {

        let dt = new Date(cur_year, cur_mo, day_idx+1);

        let wd_code = NEATOCAL_PARAM.weekday_code[ dt.getDay() ];

        // If it's a weekend (Su,Sa), add the 'weekend' class to allow for highlighting
        //
        //if ((dt.getDay() == 0) ||
        //    (dt.getDay() == 6)) {
        if (NEATOCAL_PARAM.weekend_days.includes(dt.getDay())) {
          td.classList.add("weekend");
        }


        // date - day in month
        // day  - name of weekday (e.g. Su,M,T,W,R,F,Sa)
        //
        let span_date = H.span((day_idx+1).toString(), "date");
        let span_day = H.span(wd_code, "day");

        // If any param specified stylings apply, apply them.
        // Date stylings happen before weekend_date so that
        // the weekend_date, if specified, can override
        //

        date_styles(span_date);

        if ((dt.getDay() == 0) ||
            (dt.getDay() == 6)) {
          weekend_styles(span_day);
          weekend_date_styles(span_date);
        }

        else {
          weekday_styles(span_day);
        }

        td.appendChild( span_date );
        td.appendChild( span_day );

        if ((dt.getDay() == 1) && NEATOCAL_PARAM.show_week_numbers) {
          let span_week_no = H.span(getISOWeekNumber(dt), "date");
          span_week_no.style.float = (NEATOCAL_PARAM.dir === "rtl") ? "left" : "right";
          span_week_no.style.color = "rgb(230,37,7)";
          week_styles(span_week_no);
          td.appendChild(span_week_no);
        }

        let yyyy_mm_dd = fmt_date(cur_year, cur_mo+1, day_idx+1);
        render_cell_data(td, yyyy_mm_dd);

        // Add moon phase if enabled
        //
        renderMoonPhase(td, cur_year, cur_mo, day_idx+1);

      }
      tr.appendChild(td);

    }

    tbody.appendChild(tr);
  }

}

function neatocal_weekly_grid() {
  let year      = parseInt(NEATOCAL_PARAM.year);
  let start_mo  = parseInt(NEATOCAL_PARAM.start_month);
  let n_mo      = parseInt(NEATOCAL_PARAM.n_month);
  let start_day = parseInt(NEATOCAL_PARAM.start_day);

  let ui_tr_mo = document.getElementById("ui_tr_month_name");
  ui_tr_mo.innerHTML = "";

  let th_month = H.th(""); 
  th_month.style.borderBottom = "1.15px solid #333";
  ui_tr_mo.appendChild(th_month);

  for (let i = 0; i < 7; i++) {
    let wd_idx = (start_day + i) % 7;
    let th_wd = H.th( NEATOCAL_PARAM.weekday_code[ wd_idx ] );
    th_wd.style.borderBottom = "1.15px solid #333"; 
    weekday_styles(th_wd);
    ui_tr_mo.appendChild(th_wd);
  }

  if (NEATOCAL_PARAM.show_week_numbers) {
    let th_wk = H.th("Wk");
    th_wk.style.borderBottom = "1.15px solid #333";
    ui_tr_mo.appendChild(th_wk);
  }

  let tbody = document.getElementById("ui_tbody");

  let start_date = new Date(year, start_mo, 1);
  let end_date = new Date(year, start_mo + n_mo, 0);

  let first_day_offset = (start_date.getDay() - start_day + 7) % 7;
  let grid_start = new Date(start_date);
  grid_start.setDate(grid_start.getDate() - first_day_offset);

  let last_day_offset = (end_date.getDay() - start_day + 7) % 7;
  let grid_end = new Date(end_date);
  if (last_day_offset !== 6) { 
    grid_end.setDate(grid_end.getDate() + (6 - last_day_offset));
  }

  let curr_date = new Date(grid_start);
  let last_printed_month = -1;

  while (curr_date <= grid_end) {
    let tr = H.tr();
    if ((typeof NEATOCAL_PARAM.cell_height !== "undefined") &&
        (NEATOCAL_PARAM.cell_height != null) &&
        (NEATOCAL_PARAM.cell_height != "")) {
      tr.style.height = NEATOCAL_PARAM.cell_height;
    }

    let mid_week = new Date(curr_date);
    mid_week.setDate(mid_week.getDate() + 3);
    let week_month = mid_week.getMonth();

    let next_mid_week = new Date(mid_week);
    next_mid_week.setDate(next_mid_week.getDate() + 7);
    let next_week_month = next_mid_week.getMonth();

    let next_week_start = new Date(curr_date);
    next_week_start.setDate(next_week_start.getDate() + 7);
    let is_last_row = next_week_start > grid_end;

    let td_month = H.td();
    td_month.style.width = "8%"; 
    td_month.style.verticalAlign = "middle";
    td_month.style.textAlign = "right";
    td_month.style.paddingRight = "1em";

    if (week_month !== next_week_month || is_last_row) {
      td_month.style.borderBottom = "1.15px solid #333";
    } else {
      td_month.style.borderBottom = "0";
    }

    if (week_month % 2 === 1) {
      td_month.classList.add("weekend"); 
    }

    if (week_month !== last_printed_month) {
      let span_mo = H.span(NEATOCAL_PARAM.month_code[week_month], "month");
      span_mo.style.fontWeight = "bold";
      month_styles(span_mo);
      td_month.appendChild(span_mo);
      last_printed_month = week_month;
    }
    tr.appendChild(td_month);

    let week_number_date = new Date(curr_date); 

    for (let i = 0; i < 7; i++) {
      let td = H.td();
      td.style.width = NEATOCAL_PARAM.show_week_numbers ? "12.5%" : "13.1%";
      
      let cy = curr_date.getFullYear();
      let cm = curr_date.getMonth();
      let cd = curr_date.getDate();
      let cday = curr_date.getDay();
      
      let is_active = (curr_date >= start_date && curr_date <= end_date);
      let nday_in_mo = new Date(cy, cm + 1, 0).getDate();

      if (is_active) {
        if (cd > nday_in_mo - 7 || is_last_row) {
          td.style.borderBottom = "1.15px solid #333";
        }

        td.id = "ui_" + fmt_date(cy, cm + 1, cd);

        if (cm % 2 === 1) {
          td.classList.add("weekend");
        }

        let span_date = H.span(cd.toString(), "date");
        date_styles(span_date);

        if (NEATOCAL_PARAM.weekend_days.includes(cday)) {
          weekend_date_styles(span_date);
        }

        td.appendChild(span_date);

        let yyyy_mm_dd = fmt_date(cy, cm + 1, cd);
        render_cell_data(td, yyyy_mm_dd);
        renderMoonPhase(td, cy, cm, cd);
      } else {
        td.style.background = "#f8f8f8";
        td.style.borderBottom = "1px solid #888";
      }

      tr.appendChild(td);

      curr_date.setDate(curr_date.getDate() + 1);
    }

    if (NEATOCAL_PARAM.show_week_numbers) {
      let td_wn = H.td();
      td_wn.style.width = "4%";

      let span_week_no = H.span(getISOWeekNumber(week_number_date), "date");
      span_week_no.style.color = "rgb(230,37,7)";
      week_styles(span_week_no);
      td_wn.appendChild(span_week_no);
      tr.appendChild(td_wn);
    }
    
    tbody.appendChild(tr);
  }
}

function neatocal_post_process() {
  let highlight_color = NEATOCAL_PARAM.highlight_color;
  let x = document.getElementsByClassName("weekend");
  for (let i = 0; i < x.length; i++) {
    x[i].style.background = highlight_color;
  }

  // Highlight today's date
  if (NEATOCAL_PARAM.today_highlight_color) {
    let today = new Date();
    let today_str = fmt_date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    let today_ele = document.getElementById("ui_" + today_str);
    if (today_ele) {
      today_ele.style.background = NEATOCAL_PARAM.today_highlight_color;
    }
  }

  if ("color_cell" in NEATOCAL_PARAM) {
    let color_cell = NEATOCAL_PARAM.color_cell;

    for (let i=0; i < color_cell.length; i++) {
      let ele = document.getElementById("ui_" + color_cell[i].date);
      if ((typeof ele === "undefined") || (ele == null)) { continue; }
      ele.style.background = color_cell[i].color;
    }
  }

  if (NEATOCAL_PARAM.firefox_hack) {

    if ((typeof navigator !== "undefined") &&
        (typeof navigator.userAgent !== "undefined") &&
        (navigator.userAgent.search( /^Mozilla/ ) == 0) &&
        (typeof screen !== "undefined") &&
        (screen.width < 768) ) {

      let ui_tr_month_name = document.getElementById("ui_tr_month_name");
      if (NEATOCAL_PARAM.cell_height) {
        ui_tr_month_name.style.height = NEATOCAL_PARAM.cell_height;
      }
    }
  }

}

function loadXHR(url, _cb, _errcb) {
  let xhr = new XMLHttpRequest();

  if (typeof _errcb !== "undefined") {
    xhr.addEventListener("error", _errcb);
  }

  xhr.addEventListener("loadend", _cb);
  xhr.open("GET", url);
  xhr.send();
  return xhr;
}

function neatocal_parse_data_error(raw) {
  console.log("error:", raw);
}

function neatocal_override_param(param, data) {

  let admissible_param = [
    "help",

    "dir",

    "year",
    "layout",

    "start_day",
    "start_month",
    "n_month",

    "weekday_code",
    "weekday_format",
    "month_code",
    "month_format",

    "weekend_days",

    "language",

    "show_moon_phase",
    "moon_phase_style",
    "moon_phase_position",
    "moon_phase_display",

    "show_week_numbers",

    "font_family",

    "cell_height",
    "highlight_color",
    "today_highlight_color",

    "year_font_size",
    "year_font_weight",
    "year_foreground_color",
    "year_background_color",

    "month_font_size",
    "month_font_weight",
    "month_foreground_color",
    "month_background_color",

    "weekday_font_size",
    "weekday_font_weight",
    "weekday_foreground_color",
    "weekday_background_color",

    "weekend_font_size",
    "weekend_font_weight",
    "weekend_foreground_color",
    "weekend_background_color",

    "week_font_size",
    "week_font_weight",
    "week_foreground_color",
    "week_background_color",

    "date_font_size",
    "date_font_weight",
    "date_foreground_color",
    "date_background_color",

    "weekend_date_font_size",
    "weekend_date_font_weight",
    "weekend_date_foreground_color",
    "weekend_date_background_color"

  ];

  for (let idx = 0; idx < admissible_param.length; idx++) {
    let key = admissible_param[idx];

    if (key in data) {
      param[key] = data[key];
    }
  }

  if ("color_cell" in data) {
    param.color_cell = data.color_cell;
  }

  return param;
}

function neatocal_parse_data(raw) {

  if (raw.type == "loadend") {

    if ((raw.target.readyState == 4) &&
        (raw.target.status == 200)) {

      try {
        let json_data = JSON.parse(raw.target.response);
        data_set_base(json_data);

        if (typeof NEATOCAL_PARAM.data.param !== "undefined") {
          neatocal_override_param(NEATOCAL_PARAM, NEATOCAL_PARAM.data.param);
        }
      }
      catch (e) {
        console.log("error parsing data file:", e);
      }

      neatocal_render();

    }

    // default to render
    //
    if ((raw.target.readyState == 4) &&
        (raw.target.status == 404)) {
      neatocal_render();
    }

  }

}

function ics_unfold_lines(raw) {
  let lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  let out = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }

  return out;
}

function ics_parse_datetime(value, params) {
  let is_all_day = false;
  let is_utc = false;

  if (params && params.indexOf("VALUE=DATE") >= 0) {
    is_all_day = true;
  }

  let match_date = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (match_date) {
    is_all_day = true;
    return {
      date: new Date(parseInt(match_date[1]), parseInt(match_date[2]) - 1, parseInt(match_date[3])),
      all_day: true
    };
  }

  let match_dt = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/);
  if (!match_dt) {
    return null;
  }

  if (match_dt[7] === "Z") {
    is_utc = true;
  }

  let year = parseInt(match_dt[1]);
  let month = parseInt(match_dt[2]) - 1;
  let day = parseInt(match_dt[3]);
  let hour = parseInt(match_dt[4]);
  let minute = parseInt(match_dt[5]);
  let second = match_dt[6] ? parseInt(match_dt[6]) : 0;

  let date = is_utc
    ? new Date(Date.UTC(year, month, day, hour, minute, second))
    : new Date(year, month, day, hour, minute, second);

  return { date: date, all_day: is_all_day };
}

// RFC 5545 3.3.11: TEXT values escape backslash, comma, semicolon and newline.
//
function ics_unescape_text(value) {
  return value.replace(/\\(.)/g, function(_, c) {
    if ((c === "n") || (c === "N")) { return " "; }
    return c;
  });
}

// RFC 5545 3.3.6 duration (subset: weeks/days/hours/minutes/seconds).
// Returns milliseconds or null if unparseable.
//
function ics_parse_duration(value) {
  let m = value.match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) { return null; }
  let sign = (m[1] === "-") ? -1 : 1;
  let weeks   = parseInt(m[2] || "0");
  let days    = parseInt(m[3] || "0");
  let hours   = parseInt(m[4] || "0");
  let minutes = parseInt(m[5] || "0");
  let seconds = parseInt(m[6] || "0");
  return sign * ((((((weeks * 7) + days) * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000);
}

// Flatten an event's EXDATE properties (each possibly holding a
// comma-separated list) into parsed {date, all_day} entries.
//
function ics_parse_exdates(event) {
  let out = [];
  if (!event.exdate) { return out; }
  for (let i = 0; i < event.exdate.length; i++) {
    let vals = event.exdate[i].value.split(",");
    for (let j = 0; j < vals.length; j++) {
      let parsed = ics_parse_datetime(vals[j].trim(), event.exdate[i].params);
      if (parsed) { out.push(parsed); }
    }
  }
  return out;
}

function ics_date_excluded(date, excluded) {
  for (let i = 0; i < excluded.length; i++) {
    let x = excluded[i];
    if (x.all_day) {
      if ((x.date.getFullYear() === date.getFullYear()) &&
          (x.date.getMonth() === date.getMonth()) &&
          (x.date.getDate() === date.getDate())) {
        return true;
      }
    } else if (x.date.getTime() === date.getTime()) {
      return true;
    }
  }
  return false;
}

function ics_parse_events(raw) {
  let lines = ics_unfold_lines(raw);
  let events = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) { events.push(current); }
      current = null;
      continue;
    }
    if (!current) { continue; }

    let idx = line.indexOf(":");
    if (idx < 0) { continue; }

    let name_params = line.slice(0, idx);
    let value = line.slice(idx + 1);

    let parts = name_params.split(";");
    let name = parts[0];
    let params = parts.slice(1).join(";");

    if (name === "SUMMARY") {
      current.summary = ics_unescape_text(value);
    } else if (name === "DTSTART") {
      current.dtstart = { value: value, params: params };
    } else if (name === "DTEND") {
      current.dtend = { value: value, params: params };
    } else if (name === "RRULE") {
      current.rrule = value;
    } else if (name === "DURATION") {
      current.duration = value;
    } else if (name === "UID") {
      current.uid = value;
    } else if (name === "RECURRENCE-ID") {
      current.recurrence_id = { value: value, params: params };
    } else if (name === "EXDATE") {
      if (!current.exdate) { current.exdate = []; }
      current.exdate.push({ value: value, params: params });
    }
  }

  return events;
}

function ics_color_for_index(idx) {
  return ICS_PALETTE[idx % ICS_PALETTE.length].bg;
}

function ics_text_color_for_index(idx) {
  return ICS_PALETTE[idx % ICS_PALETTE.length].fg;
}

function ics_expand_event(event, color, text_color, source_id, view_start, view_end) {
  if (!event.dtstart) {
    console.warn("neatocal ics: skipping event with no DTSTART:", event.summary || "(no title)");
    return;
  }

  let start_parsed = event._parsed_start || ics_parse_datetime(event.dtstart.value, event.dtstart.params);
  if (!start_parsed) {
    console.warn("neatocal ics: skipping event with unparseable DTSTART \"" +
      event.dtstart.value + "\":", event.summary || "(no title)");
    return;
  }

  let end_parsed = null;
  if (event._parsed_end) {
    end_parsed = event._parsed_end;
  } else if (event.dtend) {
    end_parsed = ics_parse_datetime(event.dtend.value, event.dtend.params);
  }

  let start_date = start_parsed.date;
  let end_date = end_parsed ? end_parsed.date : new Date(start_date.getTime());
  let all_day = start_parsed.all_day || (end_parsed && end_parsed.all_day);

  if (!end_parsed) {
    let dur_ms = event.duration ? ics_parse_duration(event.duration) : null;
    if ((dur_ms !== null) && (dur_ms > 0)) {
      end_date = new Date(start_date.getTime() + dur_ms);
    } else if (all_day) {
      end_date = new Date(start_date.getTime() + 86400000);
    }
  }

  let start_day = new Date(start_date.getFullYear(), start_date.getMonth(), start_date.getDate());
  let end_day = new Date(end_date.getFullYear(), end_date.getMonth(), end_date.getDate());

  if (all_day ||
      (end_date.getHours() === 0 && end_date.getMinutes() === 0 && end_date.getSeconds() === 0)) {
    end_day = new Date(end_day.getTime() - 86400000);
  }

  let view_start_day = new Date(view_start.getFullYear(), view_start.getMonth(), view_start.getDate());
  let view_end_last = new Date(view_end.getTime() - 86400000);

  let cur = new Date(start_day.getTime());
  while (cur <= end_day) {
    if (cur >= view_start && cur < view_end) {
      let date_id = fmt_date(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
      let is_start = (cur.getTime() === start_day.getTime()) ||
        (cur.getTime() === view_start_day.getTime() && start_day < view_start_day);
      let is_end = (cur.getTime() === end_day.getTime()) ||
        (cur.getTime() === view_end_last.getTime() && end_day > view_end_last);

      add_event_to_date(date_id, {
        title: event.summary || "(no title)",
        color: color,
        text_color: text_color,
        source_id: source_id,
        span: {
          start: is_start,
          end: is_end
        }
      });
    }
    cur.setDate(cur.getDate() + 1);
  }
}

// Expand a recurring event into individual occurrences within the view range.
// Walks day by day from DTSTART and tests each date against the rule
// (RFC 5545 3.3.10): the frequency/interval phase, the BYxxx filters present,
// and — for parts absent from the rule — constraints implied by DTSTART.
// Testing day-of-month membership (rather than adding months) means invalid
// dates like Feb 31 are skipped instead of overflowing into the next month.
// `override_dates` holds parsed RECURRENCE-ID values of instances that other
// VEVENTs replace; like EXDATEs, they count toward COUNT but don't render.
//
function ics_expand_rrule_event(event, color, text_color, source_id, view_start, view_end, override_dates) {
  if (!event.dtstart) {
    console.warn("neatocal ics: skipping recurring event with no DTSTART:", event.summary || "(no title)");
    return;
  }
  let start_parsed = ics_parse_datetime(event.dtstart.value, event.dtstart.params);
  if (!start_parsed) {
    console.warn("neatocal ics: skipping event with unparseable DTSTART \"" +
      event.dtstart.value + "\":", event.summary || "(no title)");
    return;
  }
  if (!event.rrule) { return; }

  let rules = {};
  event.rrule.split(';').forEach(p => {
    let kv = p.split('=');
    if (kv.length === 2) { rules[kv[0]] = kv[1]; }
  });

  let freq = rules['FREQ'];
  if ((freq !== 'DAILY') && (freq !== 'WEEKLY') && (freq !== 'MONTHLY') && (freq !== 'YEARLY')) {
    console.warn("neatocal ics: unsupported RRULE FREQ \"" + freq + "\", rendering start date only:",
      event.summary || "(no title)");
    ics_expand_event(Object.assign({}, event, { rrule: null }), color, text_color, source_id, view_start, view_end);
    return;
  }

  let interval = parseInt(rules['INTERVAL']) || 1;
  let count = rules['COUNT'] ? parseInt(rules['COUNT']) : null;

  let until = null;
  if (rules['UNTIL']) {
    let until_parsed = ics_parse_datetime(rules['UNTIL'], "");
    if (until_parsed) {
      until = until_parsed.date;
    } else {
      console.warn("neatocal ics: ignoring unparseable UNTIL \"" + rules['UNTIL'] + "\":",
        event.summary || "(no title)");
    }
  }

  let byday = rules['BYDAY'] ? rules['BYDAY'].split(',') : null;
  let bymonthday = rules['BYMONTHDAY'] ? rules['BYMONTHDAY'].split(',').map(Number) : null;
  let bymonth = rules['BYMONTH'] ? rules['BYMONTH'].split(',').map(Number) : null;

  let day_map = {"SU":0, "MO":1, "TU":2, "WE":3, "TH":4, "FR":5, "SA":6};
  let wkst = (rules['WKST'] in day_map) ? day_map[rules['WKST']] : 1;

  // Parts not in the rule are derived from DTSTART (RFC 5545 3.3.10).
  //
  let implied_month = null;
  let implied_monthday = null;
  let implied_weekday = null;
  if ((freq === 'YEARLY') && !bymonth) {
    implied_month = start_parsed.date.getMonth() + 1;
  }
  if (((freq === 'YEARLY') || (freq === 'MONTHLY')) && !bymonthday && !byday) {
    implied_monthday = start_parsed.date.getDate();
  }
  if ((freq === 'WEEKLY') && !byday) {
    implied_weekday = start_parsed.date.getDay();
  }

  let duration = 0;
  let end_parsed = null;
  if (event.dtend) {
    end_parsed = ics_parse_datetime(event.dtend.value, event.dtend.params);
    if (end_parsed) { duration = end_parsed.date.getTime() - start_parsed.date.getTime(); }
  } else if (event.duration) {
    let dur_ms = ics_parse_duration(event.duration);
    if ((dur_ms !== null) && (dur_ms > 0)) { duration = dur_ms; }
  }

  let excluded = ics_parse_exdates(event);
  if (override_dates) { excluded = excluded.concat(override_dates); }

  let current_date = new Date(start_parsed.date.getTime());

  // Without COUNT there is no need to walk occurrences that end before the
  // view: jump the scan to just before view_start (keeping DTSTART's
  // time-of-day so phase computations against DTSTART stay day-aligned).
  //
  if (count === null) {
    let span_days = Math.max(0, Math.ceil(duration / 86400000)) + 1;
    let ff = new Date(view_start.getTime() - span_days * 86400000);
    ff = new Date(ff.getFullYear(), ff.getMonth(), ff.getDate(),
      start_parsed.date.getHours(), start_parsed.date.getMinutes(), start_parsed.date.getSeconds());
    if (ff > current_date) { current_date = ff; }
  }

  let occurrences = 0;
  let iter = 0;
  let iter_cap = 200000; // Safeguard to prevent infinite loops

  while (iter < iter_cap) {
    iter++;
    if (until && current_date > until) { break; }
    if (count !== null && occurrences >= count) { break; }
    if (current_date > view_end) { break; }

    let match = true;

    if (freq === 'DAILY') {
      let days_diff = Math.round((current_date.getTime() - start_parsed.date.getTime()) / 86400000);
      if (days_diff % interval !== 0) { match = false; }
    } else if (freq === 'WEEKLY') {
      let start_day_offset = (start_parsed.date.getDay() - wkst + 7) % 7;
      let days_diff = Math.round((current_date.getTime() - start_parsed.date.getTime()) / 86400000);
      let weeks_diff = Math.floor((days_diff + start_day_offset) / 7);
      if (weeks_diff % interval !== 0) { match = false; }
    } else if (freq === 'MONTHLY') {
      let months_diff = (current_date.getFullYear() - start_parsed.date.getFullYear()) * 12 + (current_date.getMonth() - start_parsed.date.getMonth());
      if (months_diff % interval !== 0) { match = false; }
    } else if (freq === 'YEARLY') {
      let years_diff = current_date.getFullYear() - start_parsed.date.getFullYear();
      if (years_diff % interval !== 0) { match = false; }
    }

    if (match && bymonth && !bymonth.includes(current_date.getMonth() + 1)) { match = false; }
    if (match && (implied_month !== null) && ((current_date.getMonth() + 1) !== implied_month)) { match = false; }

    if (match && bymonthday) {
      let d = current_date.getDate();
      let days_in_month = new Date(current_date.getFullYear(), current_date.getMonth() + 1, 0).getDate();
      let md_match = false;
      for (let i = 0; i < bymonthday.length; i++) {
        let n = bymonthday[i];
        if ((n > 0) ? (d === n) : (d === days_in_month + 1 + n)) {
          md_match = true;
          break;
        }
      }
      if (!md_match) { match = false; }
    }
    if (match && (implied_monthday !== null) && (current_date.getDate() !== implied_monthday)) { match = false; }
    if (match && (implied_weekday !== null) && (current_date.getDay() !== implied_weekday)) { match = false; }

    if (match && byday) {
      let d_str = Object.keys(day_map).find(key => day_map[key] === current_date.getDay());
      let has_day_match = false;
      for (let i = 0; i < byday.length; i++) {
        let bd = byday[i];
        if (bd.endsWith(d_str)) {
          let prefix = bd.replace(/[A-Z]+$/, '');
          if (!prefix) {
            has_day_match = true;
            break;
          }
          let n = parseInt(prefix);
          let is_match = false;
          let d = current_date.getDate();
          if (n > 0) {
            is_match = Math.ceil(d / 7) === n;
          } else if (n < 0) {
            let days_in_month = new Date(current_date.getFullYear(), current_date.getMonth() + 1, 0).getDate();
            is_match = Math.ceil((days_in_month - d + 1) / 7) === Math.abs(n);
          }
          if (is_match) {
            has_day_match = true;
            break;
          }
        }
      }
      if (!has_day_match) { match = false; }
    }

    if (match) {
      occurrences++;
      if (!ics_date_excluded(current_date, excluded)) {
        let ev_end = new Date(current_date.getTime() + duration);
        if (ev_end >= view_start && current_date <= view_end) {
          let synth = Object.assign({}, event);
          delete synth.rrule;
          synth._parsed_start = { date: new Date(current_date.getTime()), all_day: start_parsed.all_day };
          if (end_parsed) {
            synth._parsed_end = { date: ev_end, all_day: end_parsed.all_day };
          }
          ics_expand_event(synth, color, text_color, source_id, view_start, view_end);
        }
      }
    }

    current_date.setDate(current_date.getDate() + 1);
  }

  if (iter >= iter_cap) {
    console.warn("neatocal ics: recurrence expansion hit iteration cap, event may be truncated:",
      event.summary || "(no title)");
  }
}

function ics_import_text(raw, color, text_color, source_id) {
  let events = ics_parse_events(raw);
  let view = get_view_range();

  // A VEVENT with a RECURRENCE-ID replaces one occurrence of the recurring
  // event sharing its UID (RFC 5545 3.8.4.4). Collect these so the base
  // expansion can suppress the replaced occurrences; the override events
  // themselves render as ordinary standalone events below.
  //
  let overrides = {};
  for (let i = 0; i < events.length; i++) {
    let ev = events[i];
    if (ev.recurrence_id && ev.uid) {
      let parsed = ics_parse_datetime(ev.recurrence_id.value, ev.recurrence_id.params);
      if (parsed) {
        if (!overrides[ev.uid]) { overrides[ev.uid] = []; }
        overrides[ev.uid].push(parsed);
      }
    }
  }

  for (let i = 0; i < events.length; i++) {
    let ev = events[i];
    try {
      if (ev.rrule && !ev.recurrence_id) {
        let override_dates = (ev.uid && overrides[ev.uid]) ? overrides[ev.uid] : null;
        ics_expand_rrule_event(ev, color, text_color, source_id, view.start, view.end, override_dates);
      } else {
        ics_expand_event(ev, color, text_color, source_id, view.start, view.end);
      }
    } catch (err) {
      console.warn("neatocal ics: error importing event:", ev.summary || "(no title)", err);
    }
  }
}

function ics_reset_data() {
  if (NEATOCAL_PARAM.data && NEATOCAL_PARAM.data.__base) {
    data_set_base(NEATOCAL_PARAM.data.__base);
  } else {
    data_set_base({});
  }
}

function ics_update_style(source_id, color, text_color) {
  for (let i = 0; i < NEATOCAL_PARAM.ics_imports.length; i++) {
    if (NEATOCAL_PARAM.ics_imports[i].id === source_id) {
      NEATOCAL_PARAM.ics_imports[i].color = color;
      NEATOCAL_PARAM.ics_imports[i].text_color = text_color;
      break;
    }
  }

  let keys = Object.keys(NEATOCAL_PARAM.data);
  for (let k = 0; k < keys.length; k++) {
    let val = NEATOCAL_PARAM.data[keys[k]];
    if (!Array.isArray(val)) { continue; }
    for (let i = 0; i < val.length; i++) {
      if (val[i] && val[i].source_id === source_id) {
        val[i].color = color;
        val[i].text_color = text_color;
      }
    }
  }

  render_ics_legend();
  neatocal_render();
}

function ics_handle_files(file_list) {
  let files = Array.from(file_list).filter(f => f.name.toLowerCase().endsWith(".ics"));
  if (files.length === 0) { return; }

  let reads = files.map((file, idx) => {
    return new Promise((resolve) => {
      let reader = new FileReader();
      reader.onload = function() {
        resolve({ text: reader.result, idx: idx });
      };
      reader.readAsText(file);
    });
  });

  Promise.all(reads).then((results) => {
    for (let i = 0; i < results.length; i++) {
      let import_id = NEATOCAL_PARAM.ics_import_count + results[i].idx;
      let color = ics_color_for_index(import_id);
      let text_color = ics_text_color_for_index(import_id);
      let file = files[results[i].idx];
      let label = file ? file.name.replace(/\.ics$/i, "") : ("Calendar " + (import_id + 1).toString());

      NEATOCAL_PARAM.ics_imports.push({
        id: import_id,
        name: label,
        color: color,
        text_color: text_color
      });

      ics_import_text(results[i].text, color, text_color, import_id);
    }
    NEATOCAL_PARAM.ics_import_count += results.length;
    render_ics_legend();
    neatocal_render();
  });
}

function ics_remove_calendar(source_id) {
  NEATOCAL_PARAM.ics_imports = NEATOCAL_PARAM.ics_imports.filter(function(item) {
    return item.id !== source_id;
  });

  let keys = Object.keys(NEATOCAL_PARAM.data);
  for (let k = 0; k < keys.length; k++) {
    let key = keys[k];
    if (key === '__base') { continue; }
    
    let val = NEATOCAL_PARAM.data[key];
    if (!Array.isArray(val)) { continue; }

    let filtered_val = val.filter(function(event) {
      return event.source_id !== source_id;
    });

    if (filtered_val.length === 0) {
      delete NEATOCAL_PARAM.data[key];
    } else {
      NEATOCAL_PARAM.data[key] = filtered_val;
    }
  }

  render_ics_legend();
  neatocal_render();
}

function render_ics_legend() {
  let legend = document.getElementById("ics_legend");
  if (!legend) { return; }

  legend.innerHTML = "";
  if (NEATOCAL_PARAM.ics_imports.length === 0) { return; }

  for (let i = 0; i < NEATOCAL_PARAM.ics_imports.length; i++) {
    let item = NEATOCAL_PARAM.ics_imports[i];

    let row = H.div();
    row.classList.add("ics-legend-row");

    let swatch = H.span();
    swatch.classList.add("ics-legend-swatch");
    swatch.style.background = item.color;
    if (item.text_color) {
      swatch.style.borderColor = item.text_color;
    }
    swatch.dataset.id = item.id.toString();

    swatch.addEventListener("click", function(e) {
      e.stopPropagation();
      let id = parseInt(e.target.dataset.id, 10);
      if (isNaN(id)) { return; }

      let palette = H.div();
      palette.classList.add("ics-legend-palette");

      for (let p = 0; p < ICS_PALETTE.length; p++) {
        let opt = H.span();
        opt.classList.add("ics-legend-palette-item");
        opt.style.background = ICS_PALETTE[p].bg;
        opt.style.color = ICS_PALETTE[p].fg;
        opt.dataset.id = id.toString();
        opt.dataset.bg = ICS_PALETTE[p].bg;
        opt.dataset.fg = ICS_PALETTE[p].fg;
        opt.addEventListener("click", function(ev) {
          ev.stopPropagation();
          let _id = parseInt(ev.target.dataset.id, 10);
          if (isNaN(_id)) { return; }
          ics_update_style(_id, ev.target.dataset.bg, ev.target.dataset.fg);
        });
        palette.appendChild(opt);
      }

      palette.addEventListener("click", function(ev) {
        ev.stopPropagation();
      });

      function close_palette() {
        window.removeEventListener("click", close_palette);
        render_ics_legend();
      }

      window.addEventListener("click", close_palette);
      swatch.replaceWith(palette);
    });

    let name = H.span();
    name.classList.add("ics-legend-name");
    name.textContent = item.name;
    name.dataset.idx = i.toString();

    name.addEventListener("click", function(e) {
      let idx = parseInt(e.target.dataset.idx, 10);
      if (isNaN(idx)) { return; }

      let input = document.createElement("input");
      input.type = "text";
      input.value = NEATOCAL_PARAM.ics_imports[idx].name;
      input.classList.add("ics-legend-input");

      function commit() {
        let val = input.value.trim();
        if (val) {
          NEATOCAL_PARAM.ics_imports[idx].name = val;
        }
        render_ics_legend();
      }

      input.addEventListener("blur", commit);
      input.addEventListener("keydown", function(ev) {
        if (ev.key === "Enter") { commit(); }
        if (ev.key === "Escape") { render_ics_legend(); }
      });

      name.replaceWith(input);
      input.focus();
      input.select();
    });

    let remove_btn = H.span();
    remove_btn.classList.add("ics-legend-remove");
    remove_btn.innerHTML = "&times;";
    remove_btn.title = "Remove calendar";
    remove_btn.dataset.id = item.id.toString();
    
    remove_btn.addEventListener("click", function(e) {
      e.stopPropagation();
      let id = parseInt(e.target.dataset.id, 10);
      if (!isNaN(id)) {
        ics_remove_calendar(id);
      }
    });

    row.appendChild(swatch);
    row.appendChild(name);
    row.appendChild(remove_btn);
    legend.appendChild(row);
  }
}
function neatocal_setup_ics_drop() {
  let overlay = document.getElementById("ics_drop_overlay");
  let input = document.getElementById("ics_file_input");

  if (!overlay || !input) { return; }

  let drag_counter = 0;

  function show() {
    overlay.classList.add("visible");
  }

  function hide() {
    overlay.classList.remove("visible");
  }

  window.addEventListener("dragenter", function(e) {
    e.preventDefault();
    drag_counter += 1;
    show();
  });

  window.addEventListener("dragover", function(e) {
    e.preventDefault();
  });

  window.addEventListener("dragleave", function(e) {
    e.preventDefault();
    drag_counter -= 1;
    if (drag_counter <= 0) {
      drag_counter = 0;
      hide();
    }
  });

  window.addEventListener("drop", function(e) {
    e.preventDefault();
    drag_counter = 0;
    hide();
    if (e.dataTransfer && e.dataTransfer.files) {
      ics_handle_files(e.dataTransfer.files);
    }
  });

  overlay.addEventListener("click", function() {
    input.click();
  });

  input.addEventListener("change", function() {
    if (input.files) {
      ics_handle_files(input.files);
      input.value = "";

      hide();
    }
  });

  if (NEATOCAL_PARAM.ics) {
    show();
  }
}

function neatocal_init() {
  let sp = new URLSearchParams(window.location.search);

  // peel off parameters from URL
  //

  let help_param = sp.get("help");
  let year_param = sp.get("year");
  let layout_param = sp.get("layout");
  let start_month_param = sp.get("start_month");
  let n_month_param = sp.get("n_month");
  let start_day_param = sp.get("start_day");
  let highlight_color_param = sp.get("highlight_color");
  let today_highlight_color_param = sp.get("today_highlight_color");
  let cell_height_param = sp.get("cell_height");
  let weekday_code_param = sp.get("weekday_code");
  let weekday_format_param = sp.get("weekday_format");
  let month_code_param = sp.get("month_code");
  let month_format_param = sp.get("month_format");
  let language_param = sp.get("language");
  let show_week_numbers_param = sp.get("show_week_numbers");
  let font_family_param = sp.get("font_family");
  let ics_param = sp.get("ics");

  let dir_param = sp.get("dir");

  let weekend_days_param = sp.get("weekend_days");

  // Moon phase parameters
  //
  let show_moon_phase_param = sp.get("show_moon_phase");
  let moon_phase_style_param = sp.get("moon_phase_style");
  let moon_phase_position_param = sp.get("moon_phase_position");
  let moon_phase_display_param = sp.get("moon_phase_display");

  // fiddly stylings
  //
  let _ele_pfx = [ "year", "month", "weekday", "weekend", "week", "date", "weekend_date" ];
  let _ele_sfx = [ "font_size", "font_weight", "foreground_color", "background_color" ];
  for (let i_p=0; i_p<_ele_pfx.length; i_p++) {
    for (let i_s=0; i_s<_ele_sfx.length; i_s++) {
      let _ele_name = _ele_pfx[i_p] + "_" + _ele_sfx[i_s];
      let _ele_param = sp.get(_ele_name);

      if ((_ele_param != null) &&
          (typeof _ele_param !== "undefined")) {
        NEATOCAL_PARAM[_ele_name] = _ele_param;
      }

    }
  }

  // JSON data file
  //
  let datafn_param = sp.get("data");

  //---

  let data_fn = "";
  if ((datafn_param != null) &&
      (typeof datafn_param !== "undefined")) {
    data_fn = datafn_param;
  }
  NEATOCAL_PARAM.data_fn = data_fn;

  //---

  if ((help_param != null) &&
      (typeof help_param !== "undefined")) {
    let ui_info = document.getElementById("ui_info");
    ui_info.style.display = '';
  }

  //---

  let year = new Date().getFullYear();
  if ((year_param != null) &&
      (typeof year_param !== "undefined")) {
    year = year_param;
  }
  NEATOCAL_PARAM.year = year;

  //---

  let layout = NEATOCAL_PARAM.layout;
  if ((layout_param != null) &&
      (typeof layout_param !== "undefined")) {
    _l = sp.get("layout");
    if      (_l == "default")           { layout = "default"; }
    else if (_l == "aligned-weekdays")  { layout = "aligned-weekdays"; }
    else if (_l == "hallon-almanackan") {
      layout = "hallon-almanackan";
      NEATOCAL_PARAM.show_week_numbers = true;
      NEATOCAL_PARAM.weekend_days = [0];
    }
    else if (_l == "weekly-grid") {
      layout = "weekly-grid";
    }
  }
  NEATOCAL_PARAM.layout = layout;

  //---

  let start_month = NEATOCAL_PARAM.start_month;
  if ((start_month_param != null) &&
      (typeof start_month_param !== "undefined")) {
    start_month = parseInt(start_month_param);
    if (isNaN(start_month)) {
      start_month = 0;
    }
  }
  NEATOCAL_PARAM.start_month = start_month;

  //---

  let n_month = NEATOCAL_PARAM.n_month;
  if ((n_month_param != null) &&
      (typeof n_month_param !== "undefined")) {
    n_month = parseInt(n_month_param);
    if (isNaN(n_month) || n_month <= 0) {
      n_month = 12;
    }
  }
  NEATOCAL_PARAM.n_month = n_month;

  //---

  let start_day = NEATOCAL_PARAM.start_day;
  if ((start_day_param != null) &&
      (typeof start_day_param !== "undefined")) {
    start_day = parseInt(start_day_param);
    if (isNaN(start_day)) {
      start_day = 0;
    }
  }
  NEATOCAL_PARAM.start_day = start_day;

  //---

  let highlight_color = NEATOCAL_PARAM.highlight_color;
  if ((highlight_color_param != null) &&
      (typeof highlight_color_param !== "undefined")) {
    highlight_color = highlight_color_param;
    if (highlight_color.match( /^[\da-fA-F]+/ )) {
      highlight_color = "#" + highlight_color;
    }
  }
  NEATOCAL_PARAM.highlight_color = highlight_color;

  //---

  let today_highlight_color = NEATOCAL_PARAM.today_highlight_color;
  if ((today_highlight_color_param != null) &&
      (typeof today_highlight_color_param !== "undefined")) {
    today_highlight_color = today_highlight_color_param;
    if (today_highlight_color.match( /^[\da-fA-F]+/ )) {
      today_highlight_color = "#" + today_highlight_color;
    }
  }
  NEATOCAL_PARAM.today_highlight_color = today_highlight_color;

  //---

  let cell_height = NEATOCAL_PARAM.cell_height;
  if ((cell_height_param != null) &&
      (typeof cell_height_param !== "undefined")) {
    cell_height = cell_height_param;
  }
  NEATOCAL_PARAM.cell_height = cell_height;

  //---

  let dir = NEATOCAL_PARAM.dir;
  if ((dir_param != null) &&
      (typeof dir_param !== "undefined")) {
    if ((dir_param === "rtl") || (dir_param === "ltr")) {
      dir = dir_param;
    }
  }
  NEATOCAL_PARAM.dir = dir;

  //---

  if (new Set(["long", "short", "narrow"]).has(weekday_format_param)) {
    NEATOCAL_PARAM.weekday_format = weekday_format_param;
  }

  //---

  if (new Set(["numeric", "2-digit", "long", "short", "narrow"]).has(month_format_param)) {
    NEATOCAL_PARAM.month_format = month_format_param;
  }

  //---

  // language fills out the month/day codes and happens
  // before so it can be overriden by month day code
  // specification.
  //
  if ((language_param != null) &&
      (typeof language_param !== "undefined")) {

    for (let day_idx=0; day_idx<7; day_idx++) {
      NEATOCAL_PARAM.weekday_code[day_idx] = localized_day(language_param, day_idx);
    }

    for (let mo_idx=0; mo_idx<12; mo_idx++) {
      NEATOCAL_PARAM.month_code[mo_idx] = localized_month(language_param, mo_idx);
    }
  }

  //---

  let weekday_code = NEATOCAL_PARAM.weekday_code;
  if ((weekday_code_param != null) &&
      (typeof weekday_code_param !== "undefined")) {

    weekday_code = weekday_code_param.split(",");

    // padd out with blank
    //
    for (let i=weekday_code.length; i<7; i++) {
      weekday_code.push("");
    }

  }
  NEATOCAL_PARAM.weekday_code = weekday_code;

  //---

  let month_code = NEATOCAL_PARAM.month_code;
  if ((month_code_param != null) &&
      (typeof month_code_param !== "undefined")) {

    month_code = month_code_param.split(",");

    // padd out with blank
    //
    for (let i=month_code.length; i<7; i++) {
      month_code.push("");
    }

  }
  NEATOCAL_PARAM.month_code = month_code;

  //---

  // thanks to https://github.com/fawaz-alesayi/neatocal
  //
  if ((weekend_days_param != null) &&
      (typeof weekend_days_param !== "undefined")) {
    let days = weekend_days_param.split(",").map(d => parseInt(d.trim()));
    NEATOCAL_PARAM.weekend_days = days.filter(d => !isNaN(d) && d >= 0 && d <= 6);
  }

  // hallon-almanackan defaults to showing week numbers.
  // If the showing week numbers is specified, use user specified value,
  // whether true or false, otherwise, leave it alone.
  //
  if ((show_week_numbers_param != null) &&
      (typeof show_week_numbers_param !== "undefined")) {
    NEATOCAL_PARAM.show_week_numbers = (show_week_numbers_param === "true");
  }

  if (font_family_param != null) {
    NEATOCAL_PARAM.font_family = font_family_param;
  }

  if ((ics_param != null) &&
      (typeof ics_param !== "undefined")) {
    NEATOCAL_PARAM.ics = !(ics_param === "false" || ics_param === "0");
  }

  neatocal_setup_ics_drop();

  //---

  // Moon phase parameters
  //
  let show_moon_phase = NEATOCAL_PARAM.show_moon_phase;
  if ((show_moon_phase_param != null) &&
      (typeof show_moon_phase_param !== "undefined")) {
    show_moon_phase = (show_moon_phase_param === "true" || show_moon_phase_param === "1");
  }
  NEATOCAL_PARAM.show_moon_phase = show_moon_phase;

  //---

  let moon_phase_style = NEATOCAL_PARAM.moon_phase_style;
  if ((moon_phase_style_param != null) &&
      (typeof moon_phase_style_param !== "undefined")) {
    if (moon_phase_style_param === "css" ||
        moon_phase_style_param === "symbol" ||
        moon_phase_style_param === "name") {
      moon_phase_style = moon_phase_style_param;
    }
  }
  NEATOCAL_PARAM.moon_phase_style = moon_phase_style;

  //---

  let moon_phase_position = NEATOCAL_PARAM.moon_phase_position;
  if ((moon_phase_position_param != null) &&
      (typeof moon_phase_position_param !== "undefined")) {
    if (moon_phase_position_param === "below" ||
        moon_phase_position_param === "inline") {
      moon_phase_position = moon_phase_position_param;
    }
  }
  NEATOCAL_PARAM.moon_phase_position = moon_phase_position;

  //---

  let moon_phase_display = NEATOCAL_PARAM.moon_phase_display;
  if ((moon_phase_display_param != null) &&
      (typeof moon_phase_display_param !== "undefined")) {
    if (moon_phase_display_param === "all" ||
        moon_phase_display_param === "changes") {
      moon_phase_display = moon_phase_display_param;
    }
  }
  NEATOCAL_PARAM.moon_phase_display = moon_phase_display;

  //---

  // if we have a data file, short circuit to wait till load.
  // neatocal_parse_data will call neatocal_render to render the
  // calendar.
  //
  if (NEATOCAL_PARAM.data_fn) {
    loadXHR( NEATOCAL_PARAM.data_fn, neatocal_parse_data, neatocal_parse_data_error );
    return;
  }

  // no data file, just render
  //
  if (!NEATOCAL_PARAM.data || !NEATOCAL_PARAM.data.__base) {
    data_set_base({});
  }
  neatocal_render();
}

function neatocal_render() {
  document.documentElement.style.fontFamily = NEATOCAL_PARAM.font_family;

  if ((NEATOCAL_PARAM.dir != null) &&
      (NEATOCAL_PARAM.dir != "")) {
    document.documentElement.dir = NEATOCAL_PARAM.dir;
  }

  let cur_start_month = NEATOCAL_PARAM.start_month;
  let month_remain = NEATOCAL_PARAM.n_month;
  let s_year = parseInt(NEATOCAL_PARAM.year);
  let e_year = parseInt(NEATOCAL_PARAM.year) + Math.floor((cur_start_month + month_remain-1)/12)

  let layout = NEATOCAL_PARAM.layout;

  let year_fraction_tot = 0;
  let year_fraction = [];
  for ( let y = s_year; y <= e_year; y++ ) {
    let del_mo = (((cur_start_month + month_remain) > 12) ? (12-cur_start_month) : (month_remain));
    year_fraction.push( del_mo );
    cur_start_month = 0;
    month_remain -= del_mo;

    year_fraction_tot += del_mo;
  }

  for (let i=0; i < year_fraction.length; i++) {
    if (year_fraction_tot > 0) {
      year_fraction[i] /= year_fraction_tot;
    } else {
      year_fraction[i] = 0;
    }
  }

  // if we only have one year, put it in the center
  // otherwise find the proportion of other years
  //   and adjust the year header appropriately

  let ui_year = document.getElementById("ui_year");
  ui_year.innerHTML = "";

  for ( let y = s_year, idx = 0; y <= e_year; y++, idx++) {
    let span = H.span();
    span.innerHTML = y.toString();
    span.style["display"] = "inline-block";
    span.style["width"] = (100*year_fraction[idx]).toString() + "%";
    span.style["justify-content"] = "center";
    span.style["text-align"] = "center";
    span.style["margin"] = "0 0 .5em 0";

    year_styles(span);

    ui_year.appendChild( span );
  }

  //---
  let ui_tbody = document.getElementById("ui_tbody");
  ui_tbody.innerHTML = "";

  if (layout == "aligned-weekdays") {
    neatocal_aligned_weekdays();
  }
  else if (layout == "hallon-almanackan") {
    neatocal_hallon_almanackan();
  }
  else if (layout == "weekly-grid") {
    neatocal_weekly_grid();
  }
  else {
    neatocal_default();
  }

  neatocal_post_process();
}
