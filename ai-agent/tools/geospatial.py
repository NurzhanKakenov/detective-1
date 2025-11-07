import folium
from pathlib import Path

def hotspots(incidents: list[dict], output_html: str) -> str:
    if not incidents:
        return "Нет инцидентов"
    center = (sum(i["lat"] for i in incidents)/len(incidents),
              sum(i["lon"] for i in incidents)/len(incidents))
    m = folium.Map(location=center, zoom_start=11)
    for i in incidents:
        folium.CircleMarker(
            location=(i["lat"], i["lon"]),
            radius=max(3, i.get("weight",1)*2),
            popup=f'{i.get("title","case")}: {i.get("time","")}'
        ).add_to(m)
    Path(output_html).parent.mkdir(parents=True, exist_ok=True)
    m.save(output_html)
    return output_html
