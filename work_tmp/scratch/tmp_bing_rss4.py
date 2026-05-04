import requests, urllib.parse, xml.etree.ElementTree as ET
queries=[
 'site:investors.micron.com Micron Q1 2025 results DRAM HBM DDR5',
 'site:investors.micron.com Micron quarterly results HBM demand DRAM supply',
 'site:news.skhynix.com HBM DDR5 demand 2025',
 'site:news.samsung.com semiconductor DDR5 HBM 2025 memory'
]
for q in queries:
    print('\n###',q)
    url='https://www.bing.com/search?format=rss&q='+urllib.parse.quote(q)
    text=requests.get(url,headers={'User-Agent':'Mozilla/5.0'},timeout=20).text
    root=ET.fromstring(text)
    for item in root.findall('.//item')[:5]:
        print(item.findtext('title'))
        print(item.findtext('link'))
        print((item.findtext('description') or '')[:200])
        print('---')
