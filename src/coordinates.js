export const systems = [
  { wkid:29902, label:"Irish Grid TM65", places:0, grid:true },
  { wkid:29903, label:"Irish Grid TM75", places:0, grid:true },
  { wkid:2157, label:"Irish Transverse Mercator (ITM)", places:2 },
  { wkid:4326, label:"WGS84 latitude / longitude", places:6 },
  { wkid:3857, label:"Web Mercator", places:2 },
];
const letters = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
export function toGrid(x, y) {
  if (x < 0 || y < 0 || x >= 500000 || y >= 500000) return "";
  const letter = letters[(4 - Math.floor(y / 100000)) * 5 + Math.floor(x / 100000)];
  return `${letter} ${String(Math.floor(x % 100000)).padStart(5, "0")} ${String(Math.floor(y % 100000)).padStart(5, "0")}`;
}
export function fromGrid(value) {
  const match = /^([A-HJ-Z])(\d{2}|\d{4}|\d{6}|\d{8}|\d{10})$/.exec(value.toUpperCase().replace(/\s/g, ""));
  if (!match) throw new Error("Enter a grid letter followed by 2, 4, 6, 8 or 10 digits, for example J 33800 74000.");
  const index = letters.indexOf(match[1]), half = match[2].length / 2, unit = 10 ** (5 - half);
  return { x:(index % 5) * 100000 + Number(match[2].slice(0, half)) * unit, y:(4 - Math.floor(index / 5)) * 100000 + Number(match[2].slice(half)) * unit };
}
export function parseCoordinates(xText, yText, wkid) {
  const parse = text => {
    const value = text.trim().replace(/,/g, "");
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) throw new Error("Enter a valid number in both coordinate fields.");
    return Number(value);
  };
  const x = parse(xText), y = parse(yText);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("Coordinates must be finite numbers.");
  if (wkid === 4326 && (Math.abs(x) > 180 || Math.abs(y) >= 90)) throw new Error("Longitude must be between −180 and 180; latitude must be between −90 and 90 (excluding the poles).");
  return { x,y };
}
