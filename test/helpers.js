// Shared test utilities for neatocal tests

const nc = require("../neatocal.js");

// Default NEATOCAL_PARAM values for resetting between tests
const PARAM_DEFAULTS = {
  data_fn: "",
  data: {},
  ics_import_count: 0,
  ics_imports: [],
  ics: false,
  firefox_hack: true,
  color_cell: [],
  cell_height: "",
  help: false,
  start_day: 1,
  format: "default",
  dir: "",
  year: new Date().getFullYear(),
  weekday_code: ["Su", "M", "T", "W", "R", "F", "Sa"],
  weekday_format: "short",
  month_code: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  month_format: "short",
  weekend_days: [0, 6],
  language: "",
  start_month: 0,
  n_month: 12,
  highlight_color: "#eee",
  today_highlight_color: "",
  show_moon_phase: false,
  moon_phase_style: "css",
  moon_phase_position: "below",
  moon_phase_display: "changes",
  show_week_numbers: false,
  font_family: "",
  year_font_size: undefined,
  year_font_weight: undefined,
  year_foreground_color: undefined,
  year_background_color: undefined,
  month_font_size: undefined,
  month_font_weight: undefined,
  month_foreground_color: undefined,
  month_background_color: undefined,
  weekday_font_size: undefined,
  weekday_font_weight: undefined,
  weekday_foreground_color: undefined,
  weekday_background_color: undefined,
  weekend_font_size: undefined,
  weekend_font_weight: undefined,
  weekend_foreground_color: undefined,
  weekend_background_color: undefined,
  week_font_size: undefined,
  week_font_weight: undefined,
  week_foreground_color: undefined,
  week_background_color: undefined,
  date_font_size: undefined,
  date_font_weight: undefined,
  date_foreground_color: undefined,
  date_background_color: undefined,
  weekend_date_font_size: undefined,
  weekend_date_font_weight: undefined,
  weekend_date_foreground_color: undefined,
  weekend_date_background_color: undefined,
};

function resetParam() {
  const p = nc.NEATOCAL_PARAM;
  for (const key of Object.keys(PARAM_DEFAULTS)) {
    if (Array.isArray(PARAM_DEFAULTS[key])) {
      p[key] = [...PARAM_DEFAULTS[key]];
    } else if (
      typeof PARAM_DEFAULTS[key] === "object" &&
      PARAM_DEFAULTS[key] !== null
    ) {
      p[key] = JSON.parse(JSON.stringify(PARAM_DEFAULTS[key]));
    } else {
      p[key] = PARAM_DEFAULTS[key];
    }
  }
  // Clean out any dynamic date keys
  for (const key of Object.keys(p)) {
    if (key.match(/^\d{4}-/)) {
      delete p[key];
    }
  }
}

module.exports = { nc, resetParam };
