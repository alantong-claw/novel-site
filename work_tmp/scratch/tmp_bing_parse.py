import requests, urllib.parse, re
from html import unescape
from urllib.parse import urlparse, parse_qs, unquote

def extract_real(href):
    href=unescape(href)
    if 'bing.com/ck/a' in href:
        qs=parse_qs(urlparse(href).query)
        u=qs.get('u')
        if u:
            val=u[0]
            if val.startswith('a1'):
                return unquote(val[2:])
    return href

queries=[
 'DDR4 shortage TrendForce 2025 legacy DRAM',
 'Micron DDR3 industrial embedded lifecycle',
 'Samsung DDR4 end production 2025',
 'SK hynix DDR4 HBM shift 2025',
 'Alliance Memory DDR3 supply 2026 industrial'
]
for q in queries:
    print('\n###',q)
    html=requests.get('https://www.bing.com/search?q='+urllib.parse.quote(q),headers={'User-Agent':'Mozilla/5.0'},timeout=20).text
    count=0
    for m in re.finditer(r'<h2><a href="(.*?)"[^>]*>(.*?)</a></h2>', html, re.S):
        href,title=m.groups()
        title=re.sub('<.*?>','',unescape(title))
        print(title)
        print(extract_real(href))
        count += 1
        if count>=5:
            break
