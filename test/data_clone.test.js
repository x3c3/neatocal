import { beforeEach, describe, expect, test } from "bun:test";

const { nc, resetParam } = require("./helpers");
const { data_clone_base, data_set_base, NEATOCAL_PARAM } = nc;

beforeEach(() => {
  resetParam();
});

describe("data_clone_base", () => {
  test("returns deep clone of input", () => {
    const original = { "2025-01-01": "Hello" };
    const clone = data_clone_base(original);
    expect(clone).toEqual({ "2025-01-01": "Hello" });
    // Verify it's a different object
    clone["2025-01-01"] = "Changed";
    expect(original["2025-01-01"]).toBe("Hello");
  });

  test("strips __base property from clone", () => {
    const original = {
      "2025-01-01": "Hello",
      __base: { "2025-01-01": "Base" },
    };
    const clone = data_clone_base(original);
    expect(clone.__base).toBeUndefined();
    expect(clone["2025-01-01"]).toBe("Hello");
  });

  test("handles null/undefined input", () => {
    expect(data_clone_base(null)).toEqual({});
    expect(data_clone_base(undefined)).toEqual({});
  });

  test("handles empty object", () => {
    expect(data_clone_base({})).toEqual({});
  });
});

describe("data_set_base", () => {
  test("sets NEATOCAL_PARAM.data with __base", () => {
    data_set_base({ "2025-03-15": "Party" });
    expect(NEATOCAL_PARAM.data["2025-03-15"]).toBe("Party");
    expect(NEATOCAL_PARAM.data.__base).toBeDefined();
    expect(NEATOCAL_PARAM.data.__base["2025-03-15"]).toBe("Party");
  });

  test("__base does not have __base itself", () => {
    data_set_base({ "2025-01-01": "NY" });
    expect(NEATOCAL_PARAM.data.__base.__base).toBeUndefined();
  });

  test("data and __base are independent copies", () => {
    data_set_base({ "2025-01-01": "Original" });
    NEATOCAL_PARAM.data["2025-01-01"] = "Modified";
    expect(NEATOCAL_PARAM.data.__base["2025-01-01"]).toBe("Original");
  });
});
