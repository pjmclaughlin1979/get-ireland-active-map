import { test } from "node:test";
import assert from "node:assert/strict";
import { fromGrid, toGrid, parseCoordinates } from "./coordinates.js";

test("Irish grid references locate Belfast and Dublin grid squares", () => {
  assert.deepEqual(fromGrid("j 33800 74000"), { x:333800, y:374000 });
  assert.equal(toGrid(315900, 234600), "O 15900 34600");
  assert.deepEqual(fromGrid("J3374"), { x:333000, y:374000 });
  assert.equal(toGrid(-1, 374000), "");
});
test("malformed grid references cannot become map locations", () => {
  for (const value of ["", "I1234", "J123", "J123456789012", "J12.34"])
    assert.throws(() => fromGrid(value));
});
test("coordinate input accepts negative longitude and rejects empty or invalid numbers", () => {
  assert.deepEqual(parseCoordinates("-5.930578", "54.596521", 4326), { x:-5.930578, y:54.596521 });
  assert.deepEqual(parseCoordinates("333,800", "374000", 29902), { x:333800, y:374000 });
  for (const [x, y] of [["", "54"], ["1", "91"], ["181", "54"], ["abc", "54"], ["Infinity", "54"]])
    assert.throws(() => parseCoordinates(x, y, 4326));
});
