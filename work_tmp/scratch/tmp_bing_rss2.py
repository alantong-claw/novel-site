import requests, urllib.parse, xml.etree.ElementTree as ET
queries=[
 'site:trendforce.com DDR4 prices rise legacy products',
 'site:trendforce.com DDR4 tight supply legacy DRAM',
 'site:micron.com DRAM lifecycle industrial embedded',
 'site:micron.com product lifecycle end of life DRAM',
 'site:alliancememory.com DDR3 industrial supply',
 'site:smartm.com DDR4 shortage 2025'
]
for q in queries:
    print('\n###',q)
    url='https://www.bing.com/search?format=rss&q='+urllib.parse.quote(q)
    text=requests.get(url,headers={'User-Agent':'Mozilla/5.0'},timeout=20).text
    root=ET.fromstring(text)
    for item in root.findall('.//item')[:8]:
        print(item.findtext('title'))
        print(item.findtext('link'))
        print((item.findtext('description') or '')[:180])
        print('---')
