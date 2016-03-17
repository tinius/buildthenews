import pycountry
import csv
from iso3166 import countries
import operator
import json

rejections = {}
grants = {}
QUARTALS = ['2014 Q1', '2014 Q2', '2014 Q3', '2014 Q4', '2015 Q1', '2015 Q2', '2015 Q3']

with open('datasets/spouse_visa_rejections.txt', 'r') as f :
    next(f)
    for line in f :

        line = line.split(' ')
        n = line[-1].strip()
        if n is '-' :
            n = 0
        elif n is '*' :
            n = 2
        else :
            n = int(n)

        rejections.update({' '.join([ word.capitalize() for word in line[:-1] ]).strip() : n })

with open('datasets/entry_visas.csv', 'r') as f :
    r = csv.DictReader(f)
    for row in r :
        try :
            if row['Quarter'] in QUARTALS :
                nat = row['Country of nationality']
                if nat in grants :
                    if row['Partner '] is 'z' :
                        grants[nat] += 0
                    else :
                        grants[nat] += int(row['Partner '].replace(',', ''))
                else :
                    if row['Partner '] is 'z' :
                        grants[nat] = 0
                    else :
                        grants[nat] = int(row['Partner '].replace(',', ''))

        except Exception :
            print(row)

rejections_alpha2 = {}
grants_alpha2 = {}
helper_dict = {}

with open('missing_codes.json', 'r') as f :
    helper_dict = json.load(f)

misfits = []

for k, v in rejections.items() :
    if k in countries :
        rejections_alpha2.update({ countries[k].alpha2 : v })
    elif k in helper_dict :
        rejections_alpha2.update({ helper_dict[k] : v })
        print('-- hit --')
    else :
        code = input('Please enter the alpha2 country code for %s: ' % k )
        if len(code) >= 2 :
            rejections_alpha2.update({ code.upper() : v })
            helper_dict.update({ k : code.upper() })

        else :
            misfits.append(k)

print('Rejections all done.')

for k, v in grants.items() :
    if k in countries :
        grants_alpha2.update({ countries[k].alpha2 : v })
    elif k in helper_dict :
        print('-- hit --')
        grants_alpha2.update({ helper_dict[k] : v })
    elif k.startswith('*Total') :
        continue
    else :
        code = input('Please enter the alpha2 country code for %s: ' % k )
        if len(code) >= 2 :
            grants_alpha2.update({ code.upper() : v })
            helper_dict.update({ k : code.upper() })

        else :
            misfits.append(k)

print('Grants all done.')

codes = set(rejections_alpha2) & set(grants_alpha2)

ratios = []

print(codes)

for code in codes :
    r = rejections_alpha2[code]
    g = grants_alpha2[code]
    if r+g > 0 :
        try :
            ratios.append((code, countries.get(code).name, r+g, r, r/(r+g)))
        except Exception as e :
            print(code)
            print(e)

# uncomment the following line to enable filtering
#ratios = filter(lambda t: t[1] >= 500, ratios)

print(ratios)

with open('missing_codes.json', 'w+') as f :
    json.dump(helper_dict, f)

with open('misfits.json', 'w+') as f :
    json.dump({'misfits' : misfits}, f)

with open('ratios.csv', 'w+') as f :
    f.write('"country_alpha2","country_name","applications","rejections","rejection_rate"\n')
    for e in ratios :
        f.write('%s,"%s",%d,%d,%f\n' % (e[0], e[1], e[2], e[3], e[4]))

print(sorted(ratios, key=operator.itemgetter(2)))