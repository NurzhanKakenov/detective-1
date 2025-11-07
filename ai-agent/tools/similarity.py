import numpy as np
from sklearn.neighbors import NearestNeighbors
from ..client.qwen_client import QwenClient

def index_texts(texts: list[str]):
    q = QwenClient()
    if not texts:
        raise ValueError("Нет текстов для индексации")
    embs = q.embed(texts)
    X = np.array(embs, dtype="float32")
    nn = NearestNeighbors(n_neighbors=min(5, len(texts)), metric="cosine").fit(X)
    return nn, X

def search_similar(query: str, texts: list[str], nn, X):
    q = QwenClient()
    import numpy as np
    qv = np.array(q.embed([query])[0], dtype="float32").reshape(1, -1)
    dists, idxs = nn.kneighbors(qv, return_distance=True)
    return [(int(i), float(d)) for i,d in zip(idxs[0], dists[0])]
