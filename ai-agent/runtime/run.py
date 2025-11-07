import argparse, json
from pathlib import Path
from ..ingest.loader import load_directory
from ..tools import summarize, timeline, entities, similarity, suggestions, questions, anomalies, search_person, geospatial, profiling, dossier, transcription
from ..config import settings

def main():
    ap = argparse.ArgumentParser("ai-agent")
    ap.add_argument("--task", required=True, help="brief|timeline|entities|similar|next|questions|anomalies|search|vl|geo|profile|dossier|asr")
    ap.add_argument("--query", help="строка запроса (для similar/search)")
    ap.add_argument("--images", nargs="*", help="urls картинок для vision")
    ap.add_argument("--incidents_json", help="json файл с инцидентами для карты")
    args = ap.parse_args()

    materials = load_directory(settings.uploads_dir)

    if args.task == "brief":
        out = summarize.quick_case_brief(materials)
    elif args.task == "timeline":
        out = timeline.build_timeline(materials)
    elif args.task == "entities":
        em = entities.extract_entities(materials)
        out = json.dumps({"entities": em, "overlaps": entities.find_intersections([em])}, ensure_ascii=False, indent=2)
    elif args.task == "similar":
        texts = [m["text"] for m in materials if m.get("text")]
        nn, X = similarity.index_texts(texts)
        out = json.dumps(similarity.search_similar(args.query or "", texts, nn, X), ensure_ascii=False, indent=2)
    elif args.task == "next":
        out = suggestions.next_steps(materials)
    elif args.task == "questions":
        out = questions.interview_questions(materials)
    elif args.task == "anomalies":
        out = anomalies.detect_anomalies(materials)
    elif args.task == "search":
        out = search_person.search_by_description(args.query or "")
    elif args.task == "vl":
        out = search_person.image_reasoning(args.query or "Опиши что на фото", args.images or [])
    elif args.task == "geo":
        inc = json.loads(Path(args.incidents_json).read_text(encoding="utf-8"))
        html = geospatial.hotspots(inc, str(Path(settings.outputs_dir)/"hotspots.html"))
        out = f"Heatmap saved to: {html}"
    elif args.task == "profile":
        out = profiling.group_patterns(materials)
    elif args.task == "dossier":
        out = dossier.final_case(materials)
    elif args.task == "asr":
        audio = [m["path"] for m in materials if Path(m["path"]).suffix.lower() in [".mp3",".wav",".m4a",".ogg"]]
        out = transcription.transcribe_and_summarize(audio)
    else:
        out = "Unknown task"

    Path(settings.outputs_dir).mkdir(parents=True, exist_ok=True)
    out_path = Path(settings.outputs_dir) / f"{args.task}.txt"
    out_path.write_text(out, encoding="utf-8")
    print(out)
    print(f"\nSaved to: {out_path}")

if __name__ == "__main__":
    main()
