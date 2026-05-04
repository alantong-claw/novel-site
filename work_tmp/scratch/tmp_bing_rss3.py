import requests, urllib.parse, xml.etree.ElementTree as ET
queries=[
 'TrendForce DDR4 prices rise AI shift 2025',
 'TrendForce DDR4 supply tight 2025',
 'Tom Hardware DDR4 prices rise 2025 DRAM makers',
 'Micron HBM DDR4 supply 2025 earnings',
 'Alliance Memory no plans to EOL DDR3 DDR4'
]
for q in queries:
    print('\n###',q)
    url='https://www.bing.com/search?format=rss&q='+urllib.parse.quote(q)
    text=requests.get(url,headers={'User-Agent':'Mozilla/5.0'},timeout=20).text
    root=ET.fromstring(text)
    for item in root.findall('.//item')[:6]:
        print(item.findtext('title'))
        print(item.findtext('link'))
        print((item.findtext('description') or '')[:220])
        print('---')
