import os, struct, zlib, math

BASE = '/home/alantong/ai-work'
FILES = ['tmp_captcha_1.png','tmp_captcha_2.png','tmp_captcha_3.png']

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
    assert bitdepth == 8 and colortype == 2
    raw = zlib.decompress(idat)
    bpp = 3
    stride = width * bpp
    rows=[]
    i=0
    prev=[0]*stride
    for _ in range(height):
        filt = raw[i]; i+=1
        row = list(raw[i:i+stride]); i+=stride
        if filt==0:
            pass
        elif filt==1:
            for x in range(stride):
                row[x] = (row[x] + (row[x-bpp] if x>=bpp else 0)) & 255
        elif filt==2:
            for x in range(stride):
                row[x] = (row[x] + prev[x]) & 255
        elif filt==3:
            for x in range(stride):
                left = row[x-bpp] if x>=bpp else 0
                up = prev[x]
                row[x] = (row[x] + ((left+up)//2)) & 255
        elif filt==4:
            def paeth(a,b,c):
                p=a+b-c
                pa=abs(p-a); pb=abs(p-b); pc=abs(p-c)
                return a if pa<=pb and pa<=pc else (b if pb<=pc else c)
            for x in range(stride):
                a = row[x-bpp] if x>=bpp else 0
                b = prev[x]
                c = prev[x-bpp] if x>=bpp else 0
                row[x] = (row[x] + paeth(a,b,c)) & 255
        rows.append(row)
        prev=row[:]
    img=[]
    for row in rows:
        out=[]
        for x in range(0, len(row), 3):
            out.append((row[x], row[x+1], row[x+2]))
        img.append(out)
    return width, height, img

def write_png_rgb(path, width, height, img):
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width):
            r,g,b = img[y][x]
            raw += bytes((r,g,b))
    comp = zlib.compress(bytes(raw), 9)
    def chunk(t,d):
        import zlib, struct
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t+d) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', comp) + chunk(b'IEND', b'')
    with open(path,'wb') as f:
        f.write(png)

def gray(rgb):
    r,g,b = rgb
    return int(0.299*r + 0.587*g + 0.114*b)

def upscale(img, sx=4, sy=4):
    h=len(img); w=len(img[0])
    out=[]
    for y in range(h):
        row=[]
        for x in range(w):
            row.extend([img[y][x]]*sx)
        for _ in range(sy):
            out.append(row[:])
    return len(out[0]), len(out), out

def threshold_variant(img, mode=0):
    h=len(img); w=len(img[0])
    gs=[[gray(img[y][x]) for x in range(w)] for y in range(h)]
    vals=[v for row in gs for v in row]
    avg=sum(vals)/len(vals)
    out=[]
    for y in range(h):
        row=[]
        for x in range(w):
            g=gs[y][x]
            r,gc,b=img[y][x]
            if mode==0:
                keep = g < avg-15
            elif mode==1:
                keep = (r > gc+10 and r > b+10) or g < avg-10
            elif mode==2:
                keep = min(r,gc,b) < avg-20
            else:
                keep = g < 180
            row.append((0,0,0) if keep else (255,255,255))
        out.append(row)
    return out

def crop_nonwhite(img):
    h=len(img); w=len(img[0])
    xs=[]; ys=[]
    for y in range(h):
        for x in range(w):
            if gray(img[y][x]) < 245:
                xs.append(x); ys.append(y)
    if not xs:
        return img
    x1=max(min(xs)-1,0); x2=min(max(xs)+2,w)
    y1=max(min(ys)-1,0); y2=min(max(ys)+2,h)
    return [row[x1:x2] for row in img[y1:y2]]

for name in FILES:
    path=os.path.join(BASE,name)
    if not os.path.exists(path):
        continue
    w,h,img = read_png_rgb(path)
    variants = {}
    variants['orig_crop'] = crop_nonwhite(img)
    for i in range(4):
        variants[f'th{i}'] = crop_nonwhite(threshold_variant(img, i))
    for key, var in list(variants.items()):
        uw, uh, up = upscale(var, 4, 4)
        out = os.path.join(BASE, f'{os.path.splitext(name)[0]}_{key}_x4.png')
        write_png_rgb(out, uw, uh, up)
        print(out)
