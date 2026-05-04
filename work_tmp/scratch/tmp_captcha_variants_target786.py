import os, struct, zlib
from pathlib import Path
BASE = Path('/home/alantong/ai-work')
src = BASE / 'live_cap_786706.png'
prefix = 'live_cap_786706_target'

def read_png_rgb(path):
    with open(path,'rb') as f:
        sig=f.read(8); assert sig == b'\x89PNG\r\n\x1a\n'
        width=height=None; idat=b''
        while True:
            ln=f.read(4)
            if not ln: break
            l=struct.unpack('>I',ln)[0]
            ctype=f.read(4); data=f.read(l); f.read(4)
            if ctype==b'IHDR': width,height,bitdepth,colortype,_,_,_=struct.unpack('>IIBBBBB',data)
            elif ctype==b'IDAT': idat+=data
            elif ctype==b'IEND': break
    raw=zlib.decompress(idat); bpp=3; stride=width*bpp; rows=[]; i=0; prev=[0]*stride
    for _ in range(height):
        filt=raw[i]; i+=1; row=list(raw[i:i+stride]); i+=stride
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
    return width,height,[[tuple(row[x:x+3]) for x in range(0,len(row),3)] for row in rows]

def write_png_rgb(path, width, height, img):
    raw=bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width): raw += bytes(img[y][x])
    comp=zlib.compress(bytes(raw),9)
    def chunk(t,d): return struct.pack('>I', len(d))+t+d+struct.pack('>I', zlib.crc32(t+d)&0xffffffff)
    ihdr=struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',ihdr)+chunk(b'IDAT',comp)+chunk(b'IEND',b'')
    with open(path,'wb') as f: f.write(png)

def gray(px):
    r,g,b=px; return int(0.299*r+0.587*g+0.114*b)

def crop(img):
    h=len(img); w=len(img[0]); xs=[]; ys=[]
    for y in range(h):
        for x in range(w):
            if gray(img[y][x])<245: xs.append(x); ys.append(y)
    x1=max(min(xs)-1,0); x2=min(max(xs)+2,w); y1=max(min(ys)-1,0); y2=min(max(ys)+2,h)
    return [row[x1:x2] for row in img[y1:y2]]

def upscale(img, sx=10, sy=10):
    out=[]
    for row0 in img:
        row=[]
        for px in row0: row.extend([px]*sx)
        for _ in range(sy): out.append(row[:])
    return len(out[0]), len(out), out

def bw(img, mode):
    vals=[gray(px) for row in img for px in row]; avg=sum(vals)/len(vals)
    out=[]
    for row0 in img:
        row=[]
        for r,g,b in row0:
            gv=gray((r,g,b))
            if mode=='g-30': keep=gv<avg-30
            elif mode=='g-20': keep=gv<avg-20
            elif mode=='g-10': keep=gv<avg-10
            elif mode=='dark140': keep=gv<140
            elif mode=='dark160': keep=gv<160
            elif mode=='min-20': keep=min(r,g,b)<avg-20
            elif mode=='red10': keep=r>g+10 and r>b+10
            elif mode=='blue10': keep=b>r+10 and b>g+10
            else: keep=gv<avg
            row.append((0,0,0) if keep else (255,255,255))
        out.append(row)
    return out

def right_crop(img, frac=0.45):
    h=len(img); w=len(img[0]); x=int(w*(1-frac))
    return [row[x:] for row in img]

_,_,img=read_png_rgb(src)
img=crop(img)
variants={'orig':img}
for m in ['g-30','g-20','g-10','dark140','dark160','min-20','red10','blue10']:
    variants[m]=bw(img,m)
for name,v in list(variants.items()):
    w,h,up=upscale(v,10,10)
    write_png_rgb(BASE/f'{prefix}_{name}.png', w,h,up)
    rc=right_crop(v,0.5)
    w2,h2,up2=upscale(rc,16,16)
    write_png_rgb(BASE/f'{prefix}_{name}_right.png', w2,h2,up2)
print('done')
