import { describe, expect, test } from "bun:test";
import { DEFAULT_PHONE_PREFIX, normalizePhoneNumber, phoneAuthOptions } from "./phone-auth";

describe("phone authentication", () => {
  test("defaults to the +1 country code and accepts a local US number", () => {
    expect(DEFAULT_PHONE_PREFIX).toBe("+1");
    expect(normalizePhoneNumber("2025550123")).toBe("+12025550123");
    expect(normalizePhoneNumber("+1 (202) 555-0123")).toBe("+12025550123");
  });
  test("keeps an explicitly entered international country code", () => {
    expect(normalizePhoneNumber("+44 7700 900123")).toBe("+447700900123");
  });
  test("returning staff sign in without a name or creating an account", () => {
    expect(phoneAuthOptions("signin", "")).toEqual({ shouldCreateUser: false });
  });
  test("new accounts include the staff name", () => {
    expect(phoneAuthOptions("signup", " Jane Nurse ")).toEqual({
      shouldCreateUser: true, data: { full_name: "Jane Nurse" },
    });
  });
});