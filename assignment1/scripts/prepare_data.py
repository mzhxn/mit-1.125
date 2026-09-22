"""Prepare the public Massachusetts/O*NET snapshot. No personal data."""
import csv, json, pathlib, collections
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist' / 'data'
SOURCE = 'https://lmi.dua.eol.mass.gov/lmi/LongTermOccupationProjections/LTOPResultAll?A=01&GA=000025&Cmd=Go&Type=long&Dopt=CSV'
groups = {'11':'Management','13':'Business & finance','15':'Computer & mathematics','17':'Architecture & engineering','19':'Science','21':'Community & social service','23':'Legal','25':'Education','27':'Arts & media','29':'Healthcare practitioners','31':'Healthcare support','33':'Protective service','35':'Food service','37':'Building & grounds','39':'Personal care','41':'Sales','43':'Office & administration','45':'Farming & fishing','47':'Construction','49':'Installation & repair','51':'Production','53':'Transportation'}
def number(value):
    value = value.replace(',', '').replace('$','').replace('%','').strip()
    try: return float(value)
    except ValueError: return None
skills = collections.defaultdict(list)
for filename in ['essential_skills', 'transferable_skills']:
    for row in csv.DictReader(open(ROOT / 'source-data' / (filename+'.csv'))):
        if row['Scale ID']=='IM' and row['Recommend Suppress']!='Y':
            skills[row['O*NET-SOC Code']].append({'name':row['Element Name'], 'importance':float(row['Data Value']), 'date':row['Date']})
rows = list(csv.DictReader(open(ROOT / 'source-data' / 'ma-all.csv').read().splitlines()[2:]))
data=[]
for r in rows:
    raw=r['SOC Code'].strip()
    if raw=='000000' or len(raw)!=6 or not raw.isdigit(): continue
    soc=raw[:2]+'-'+raw[2:]
    # Exact .00 match only: do not silently average distinct O*NET specialties.
    sk=sorted(skills.get(soc+'.00',[]), key=lambda x:(-x['importance'],x['name']))
    data.append({'soc':soc,'name':r['Occupation Title'],'group':groups.get(raw[:2],'Other'),
      'employment':number(r['Employment 2024']),'projected':number(r['Employment 2034']),
      'growth':number(r['Percent Change']),'change':number(r['Numeric Change']),
      'exits':number(r['Annual Exits']),'transfers':number(r['Annual Transfers']),
      'annualChange':number(r[' Annual Projection Change']),'openings':number(r['Annual Openings']),
      'education':r['Typical education needed for entry'],'wage':number(r['2025 Mean Annual OES Wage']),
      'skills':sk,'onet':soc+'.00' if sk else None})
assert len({d['soc'] for d in data})==len(data)
assert all(d['employment'] is None or d['employment']>=0 for d in data)
payload={'meta':{'geography':'Massachusetts statewide','baseYear':2024,'projectionYear':2034,'wageYear':2025,'retrieved':'2026-09-22','onetVersion':'31.0','source':SOURCE,'count':len(data),'skillsMatched':sum(bool(d['skills']) for d in data)},'occupations':data}
(OUT/'workforce.json').write_text(json.dumps(payload,separators=(',',':')))
fields=['soc','name','group','employment','projected','growth','change','exits','transfers','annualChange','openings','education','wage','onet']
with open(OUT/'massachusetts-occupations.csv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields+['geography','employment_base_year','projection_year','wage_year','retrieved','source_url']); w.writeheader()
    for d in data:w.writerow({**{k:d[k] for k in fields},'geography':'Massachusetts','employment_base_year':2024,'projection_year':2034,'wage_year':2025,'retrieved':'2026-09-22','source_url':SOURCE})
with open(OUT/'occupation-skills.csv','w',newline='') as f:
    w=csv.writer(f);w.writerow(['soc','onet_soc','occupation','skill','importance_1_to_5','rating_date','onet_version','source_url'])
    for d in data:
        for s in d['skills']:w.writerow([d['soc'],d['onet'],d['name'],s['name'],s['importance'],s['date'],'31.0','https://www.onetcenter.org/database.html'])
print(json.dumps(payload['meta']))
print('Highest growth:',[(d['name'],d['growth']) for d in sorted(data,key=lambda d:d['growth'] or -999,reverse=True)[:5]])
print('Most openings:',[(d['name'],d['openings']) for d in sorted(data,key=lambda d:d['openings'] or 0,reverse=True)[:5]])
