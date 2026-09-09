"""Render the site's simple map-pin mark as PNGs, without dependencies."""
import pathlib, struct, zlib
out = pathlib.Path(__file__).resolve().parents[1] / 'public' / 'icons'
for size in (180,192,512):
    rows = bytearray()
    for y in range(size):
        rows.append(0)
        for x in range(size):
            px, py = (x+.5)/size, (y+.5)/size
            circle = (px-.5)**2+(py-.41)**2 < .22**2
            tip = .40 <= py <= .77 and abs(px-.5) < (.77-py)*.59
            hole = (px-.5)**2+(py-.41)**2 < .075**2
            rows.extend((250,248,243) if hole or not (circle or tip) else (48,111,91))
    def chunk(kind,data):
        return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
    png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(rows))+chunk(b'IEND',b'')
    (out/f'icon-{size}.png').write_bytes(png)
