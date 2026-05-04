import requests, urllib.parse, xml.etree.ElementTree as ET
queries=[
 'DDR4 shortage TrendForce 2025 legacy DRAM',
 'Micron DDR3 industrial embedded lifecycle',
 'Samsung DDR4 end production 2025',
 'SK hynix DDR4 HBM shift 2025',
 'Alliance Memory DDR3 supply industrial'
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
