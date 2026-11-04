#!/usr/bin/env python3
"""Build the local catalog from downloaded, attributable source snapshots.

Administrative JSON: sajaddp/list-of-cities-in-Iran (official 1404 workbook).
Municipal hierarchy: zarbinco/laravel-iran-locations.
National neighborhood lookup: Divar's publicly documented places API, fetched on demand.
"""
import json
from pathlib import Path
from collections import Counter,defaultdict
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'panel/data/iran';SOURCES=ROOT/'deployment/geography-sources'
def load(p):return json.loads(Path(p).read_text())
def norm(s):return str(s or '').translate(str.maketrans('يك۰۱۲۳۴۵۶۷۸۹','یک0123456789')).replace('\u200c','').replace(' ','').replace('آ','ا').strip()
def save(name,data):(DATA/(name+'.json')).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
def inside(point,ring):
 x,y=point;found=False
 for a,b in zip(ring,ring[1:]+ring[:1]):
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:found=not found
 return found
cities=load(DATA/'cities-filtered.json');tehran=next(c for c in cities if c['name']=='تهران')
regions=load(SOURCES/'tehran-areas-22-polygon.geojson')['features']
def district(point):
 for r in regions:
  if inside(point,r['geometry']['coordinates'][0]):return 'منطقه '+str(r['properties']['area']).translate(str.maketrans('0123456789','۰۱۲۳۴۵۶۷۸۹'))
 return ''
output={}
for row in load(SOURCES/'geo-zarbinco-neighborhoods.json'):
 code=row.get('default_city_region_code','');number=int(code.rsplit('.',1)[-1]) if code else None
 name=row['name_fa'];label='منطقه '+str(number).translate(str.maketrans('0123456789','۰۱۲۳۴۵۶۷۸۹')) if number else ''
 output[(tehran['id'],norm(name))]={'id':row['code'],'name':name,'city_id':tehran['id'],'district':label,'source':'zarbinco/laravel-iran-locations'}
for row in load(SOURCES/'divar-tehran.json')['districts']:
 point=row.get('default_location') or row.get('centroid',{});lat,lon=point.get('latitude'),point.get('longitude')
 if not lat or not lon:continue
 name=row['name'];key=(tehran['id'],norm(name))
 if key not in output:output[key]={'id':'divar-'+str(row['id']),'name':name,'city_id':tehran['id'],'district':district((lon,lat)),'latitude':lat,'longitude':lon,'source':'Divar public places API'}
# Only explicit city tags are used here; nearest city is not proof of city membership.
name_index=defaultdict(list)
for c in cities:name_index[norm(c['name'])].append(c)
for row in load(SOURCES/'iran-neighborhoods-osm.json')['elements']:
 tags=row['tags'];name=tags.get('name:fa') or tags.get('name');parent=tags.get('addr:city') or tags.get('is_in:city')
 candidates=name_index[norm(parent)] if parent else []
 if not name or len(candidates)!=1:continue
 city=candidates[0];key=(city['id'],norm(name))
 if key not in output:output[key]={'id':'osm-'+str(row['id']),'name':name,'city_id':city['id'],'district':district((row['lon'],row['lat'])) if city['id']==tehran['id'] else '', 'latitude':row['lat'],'longitude':row['lon'],'source':'OpenStreetMap'}
save('neighborhoods',list(output.values()))
public=load(SOURCES/'divar-cities.json')['cities'];votes=defaultdict(Counter)
for c in public:
 matches=name_index[norm(c['name'])]
 if len(matches)==1:votes[c['parent']][matches[0]['province_id']]+=1
province_map={key:v.most_common(1)[0][0] for key,v in votes.items()}
lookup={}
for c in public:
 matches=[x for x in name_index[norm(c['name'])] if x['province_id']==province_map.get(c['parent'])]
 if len(matches)==1:lookup[str(matches[0]['id'])]={'id':c['id'],'latitude':c['default_location']['latitude'],'longitude':c['default_location']['longitude']}
save('city-neighborhood-lookup',lookup)
print('local neighborhoods',len(output),'national city lookups',len(lookup),'cities',len(cities))
