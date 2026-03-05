import json

def debug_missing():
    path = r"C:\Users\AlbertG\IGGA.SAS\PERSONAL\DEV\SIG-IGGA-AVISOS\capas\Torres.geojson"
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        features = data['features']

    missing = [
        {'den': 'Torre 2', 'ut': 'CMAQJAGU2301'},
        {'den': 'Torre 157', 'ut': 'CHIVSESQ1151'},
        {'den': 'Torre 58', 'ut': 'CHIVSESQ1151'},
        {'den': 'Torre 64', 'ut': 'CHIVSESQ1151'},
    ]

    for m in missing:
        print(f"\nLooking for: {m}")
        found = False
        for f in features:
            p = f['properties']
            if p.get('Torre_No') == m['den'] and p.get('ID_Linea_F') == m['ut']:
                print(f"  FOUND! {p}")
                found = True
                break
        if not found:
            # Try fuzzy match on line ID
            near_lines = set()
            for f in features:
                p = f['properties']
                if m['ut'] in str(p.get('ID_Linea_F', '')):
                    near_lines.add(p.get('ID_Linea_F'))
            if near_lines:
                print(f"  NOT FOUND. Similar lines: {list(near_lines)[:5]}")
            else:
                print("  NOT FOUND. No similar lines.")

if __name__ == "__main__":
    debug_missing()
