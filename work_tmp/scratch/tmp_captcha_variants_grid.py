import os, struct, zlib, sys, math
from pathlib import Path

src = sys.argv[1]
prefix = sys.argv[2]
BASE = Path('/home/alantong/ai-work')

# minimal png io for 8-bit rgb

def read_png_rgb(path):
    with open(path,'rb') as f:
        sig=f.read(8)
        assert sig == b'\x89PNG\r\n\x1a\n'
        width=height=None
        bitdepth=colortype=None
        idat=b''
        while True:
            ln=f.read(4)
            if not ln: break
            l=struct.unpack('>I',ln)[0]
            ctype=f.read(4)
            data=f.read(l)
            f.read(4)
            if ctype==b'IHDR':
                width,height,bitdepth,colortype,_,_,_=struct.unpack('>IIBBBBB',data)
            elif ctype==b'IDAT':
                idat += data
            elif ctype==b'IEND':
                break
    raw = zlib.decompress(idat)
    bpp = 3; stride = width*bpp; rows=[]; i=0; prev=[0]*stride
    for _ in range(height):
        filt=raw[i]; i+=1
        row=list(raw[i:i+stride]); i+=stride
        if filt==1:
            for x in range(stride): row[x]=(row[x]+(row[x-bpp] if x>=bpp else 0))&255
        elif filt==2:
            for x in range(stride): row[x]=(row[x]+prev[x])&255
        elif filt==3:
            for x in range(stride): row[x]=(row[x]+(((row[x-bpp] if x>=bpp else 0)+prev[x])//2))&255
        elif filt==4:
            def paeth(a,b,c):
                p=a+b-c
                pa=abs(p-a); pb=abs(p-b); pc=abs(p-c)
                return a if pa<=pb and pa<=pc else (b if pb<=pc else c)
            for x in range(stride):
                a=row[x-bpp] if x>=bpp else 0; b=prev[x]; c=prev[x-bpp] if x>=bpp else 0
                row[x]=(row[x]+paeth(a,b,c))&255
        rows.append(row); prev=row[:]
    return width, height, [[tuple(row[x:x+3]) for x in range(0,len(row),3)] for row in rows]

def write_png_rgb(path, width, height, img):
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width): raw += bytes(img[y][x])
    comp = zlib.compress(bytes(raw), 9)
    def chunk(t,d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t+d) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', comp) + chunk(b'IEND', b'')
    with open(path,'wb') as f: f.write(png)

def gray(rgb):
    r,g,b=rgb
    return int(0.299*r+0.587*g+0.114*b)

def crop_nonwhite(img, cutoff=245):
    h=len(img); w=len(img[0]); xs=[]; ys=[]
    for y in range(h):
        for x in range(w):
            if gray(img[y][x]) < cutoff:
                xs.append(x); ys.append(y)
    if not xs: return img
    x1=max(min(xs)-1,0); x2=min(max(xs)+2,w)
    y1=max(min(ys)-1,0); y2=min(max(ys)+2,h)
    return [row[x1:x2] for row in img[y1:y2]]

def threshold(img, mode, param):
    h=len(img); w=len(img[0])
    vals=[gray(px) for row in img for px in row]
    avg=sum(vals)/len(vals)
    out=[]
    for y in range(h):
        row=[]
        for x in range(w):
            r,g,b=img[y][x]
            gv=gray((r,g,b))
            keep=False
            if mode=='gray':
                keep = gv < avg + param
            elif mode=='minrgb':
                keep = min(r,g,b) < avg + param
            elif mode=='red':
                keep = r > g + param and r > b + param
            elif mode=='blue':
                keep = b > r + param and b > g + param
            elif mode=='dark':
                keep = gv < param
            row.append((0,0,0) if keep else (255,255,255))
        out.append(row)
    return out

def despeckle(img):
    h=len(img); w=len(img[0])
    out=[row[:] for row in img]
    for y in range(1,h-1):
        for x in range(1,w-1):
            blk = img[y][x][0] < 128
            cnt=0
            for yy in range(y-1,y+2):
                for xx in range(x-1,x+2):
                    if img[yy][xx][0] < 128: cnt += 1
            if blk and cnt <= 2:
                out[y][x]=(255,255,255)
    return out

def upscale(img, scale=6):
    out=[]
    for row0 in img:
        row=[]
        for px in row0: row.extend([px]*scale)
        for _ in range(scale): out.append(row[:])
    return len(out[0]), len(out), out

_,_,img = read_png_rgb(src)
variants=[]
variants.append(('orig', crop_nonwhite(img)))
for mode, params in {
    'gray':[-40,-25,-15,-5,5],
    'minrgb':[-35,-20,-10,0],
    'red':[5,15,25],
    'blue':[5,15,25],
    'dark':[100,120,140,160],
}.items():
    for p in params:
        v = crop_nonwhite(threshold(img, mode, p))
        variants.append((f'{mode}_{p}', v))
        variants.append((f'{mode}_{p}_ds', despeckle(v)))

written=[]
for name,v in variants:
    w,h,up=upscale(v,6)
    out=str(BASE / f'{prefix}_{name}.png')
    write_png_rgb(out,w,h,up)
    written.append(out)
print('\n'.join(written))
