import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "./safe-next.ts";

test("keeps local paths and rejects other origins", () => {
  assert.equal(safeNext("/pricing/checkout?plan=pro"), "/pricing/checkout?plan=pro");
  assert.equal(safeNext("https://evil.example"), "/app");
  assert.equal(safeNext("//evil.example"), "/app");
  assert.equal(safeNext("/\\evil.example"), "/app");
  assert.equal(safeNext("/ok\r\nSet-Cookie: x"), "/app");
  assert.equal(safeNext(undefined), "/app");
});
