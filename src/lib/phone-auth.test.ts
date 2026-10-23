import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { DEFAULT_PHONE_PREFIX, normalizePhoneNumber, phoneAuthOptions } from "./phone-auth";

describe("phone authentication", () => {
  test("defaults to the +1 country code and accepts a local US number", () => {
    assert.equal(DEFAULT_PHONE_PREFIX, "+1");
    assert.equal(normalizePhoneNumber("2025550123"), "+12025550123");
    assert.equal(normalizePhoneNumber("+1 (202) 555-0123"), "+12025550123");
  });
  test("keeps an explicitly entered international country code", () => {
    assert.equal(normalizePhoneNumber("+44 7700 900123"), "+447700900123");
  });
  test("returning staff sign in without a name or creating an account", () => {
    assert.deepEqual(phoneAuthOptions("signin", ""), { shouldCreateUser: false });
  });
  test("new accounts include the staff name", () => {
    assert.deepEqual(phoneAuthOptions("signup", " Jane Nurse "), {
      shouldCreateUser: true, data: { full_name: "Jane Nurse" },
    });
  });
});