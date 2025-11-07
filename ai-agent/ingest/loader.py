from __future__ import annotations
from pathlib import Path
from typing import List, Dict
from pypdf import PdfReader
from docx import Document
from PIL import Image
import zipfile

def load_directory(uploads_dir: str) -> List[Dict]:
    out = []
    base = Path(uploads_dir)
    base.mkdir(parents=True, exist_ok=True)
    for p in base.rglob("*"):
        if not p.is_file(): continue
        ext = p.suffix.lower()
        item = {"path": str(p), "kind": ext, "text": None, "meta": {}}
        try:
            if ext in [".txt", ".md", ".csv", ".json"]:
                item["text"] = p.read_text(encoding="utf-8", errors="ignore")
            elif ext == ".pdf":
                reader = PdfReader(str(p))
                item["text"] = "\n".join((page.extract_text() or "") for page in reader.pages)
            elif ext == ".docx":
                doc = Document(str(p))
                item["text"] = "\n".join(par.text for par in doc.paragraphs)
            elif ext in [".jpg", ".jpeg", ".png", ".webp"]:
                with Image.open(p) as im:
                    item["meta"]["image_size"] = im.size
            elif ext in [".mp3", ".wav", ".m4a", ".ogg"]:
                pass
            elif ext == ".zip":
                item["meta"]["zip_list"] = list(zipfile.ZipFile(p).namelist())
            out.append(item)
        except Exception as e:
            item["meta"]["error"] = str(e)
            out.append(item)
    return out
