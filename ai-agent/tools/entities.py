import re
from collections import defaultdict

def extract_entities(materials: list[dict]) -> dict:
    text = "\n".join(m.get("text","") for m in materials)
    phones = set(re.findall(r"\+?\d[\d\-\s]{7,}\d", text))
    plates = set(re.findall(r"[A-ZА-Я]{1,2}\d{3,4}[A-ZА-Я]{1,2}", text, re.I))
    addresses = set(re.findall(r"\b(ул\.|улица|проспект|пр-т|пер\.|пр-д|дом|д\.)\s+[^\n,]+", text, re.I))
    persons = set(re.findall(r"[А-ЯЁ][а-яё]+\s[А-ЯЁ]\.\s?[А-ЯЁ]?\.", text))
    return {"phones": list(phones), "plates": list(plates), "addresses": list(addresses), "persons": list(persons)}

def find_intersections(entity_map_list: list[dict]) -> dict:
    index = defaultdict(set)
    for i, em in enumerate(entity_map_list):
        for k, vals in em.items():
            for v in vals:
                index[(k, v)].add(i)
    overlaps = {f"{k[0]}:{k[1]}": sorted(list(v)) for k,v in index.items() if len(v) > 1}
    return overlaps
