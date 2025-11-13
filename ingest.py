# ingest.py
import os
import re
import hashlib
import chromadb
from typing import List
from langchain_community.document_loaders import DirectoryLoader, PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from chromadb.utils import embedding_functions


# ======================================================
# --- Configuration ---
# ======================================================
CHROMA_DB_PATH = "chroma_db"
SOURCE_DOCS_PATH = "data"         # Folder containing PDFs
COLLECTION_NAME = "rulebook_docs"

CHUNK_SIZE = 800
CHUNK_OVERLAP = 150
MIN_CHUNK_CHARS = 200             # drop tiny chunks
BATCH_SIZE = 1000                 # safe Chroma batch add limit


# ======================================================
# --- Helper Functions ---
# ======================================================
def clean_text(t: str) -> str:
    """Clean PDF-extracted text (fixes hyphens, spacing, newlines)."""
    if not t:
        return ""
    # Merge hyphenated words split across lines
    t = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", t)
    # Normalize spaces and newlines
    t = t.replace("\r", "\n")
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def sha1_hash(s: str) -> str:
    """Deterministic short hash for stable IDs."""
    return hashlib.sha1(s.encode("utf-8")).hexdigest()[:8]


# ======================================================
# --- Main Pipeline ---
# ======================================================
def main():
    print("🚀 Starting rulebook ingestion...")

    # 1️⃣ Embedding model (MUST match evaluate.py)
    embedding_model = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="thenlper/gte-small"
    )

    # 2️⃣ Load PDF documents
    print("📂 Scanning 'data/' for PDFs...")
    loader = DirectoryLoader(
        SOURCE_DOCS_PATH,
        glob="**/*.pdf",
        loader_cls=PyMuPDFLoader,
        show_progress=True
    )
    documents = loader.load()

    if not documents:
        print(f"❌ No PDFs found inside '{SOURCE_DOCS_PATH}'. Exiting.")
        return

    # Clean metadata + text
    for d in documents:
        d.page_content = clean_text(d.page_content)
        d.metadata = d.metadata or {}
        d.metadata["source"] = os.path.basename(
            d.metadata.get("source", d.metadata.get("file_path", "unknown"))
        )
        d.metadata["page"] = int(d.metadata.get("page", 0))

    print(f"✅ Loaded {len(documents)} PDF documents.")

    # 3️⃣ Split into text chunks
    print("✂️ Splitting into chunks...")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " "],
        add_start_index=True
    )
    docs = splitter.split_documents(documents)
    print(f"✅ Generated {len(docs)} chunks (before filtering).")

    # 4️⃣ Filter and prepare chunk metadata
    texts, ids, metas = [], [], []

    for i, d in enumerate(docs):
        txt = clean_text(d.page_content)
        if len(txt) < MIN_CHUNK_CHARS:
            continue

        src = d.metadata.get("source", "unknown")
        page = d.metadata.get("page", 0)
        start = d.metadata.get("start_index", 0)

        hash_short = sha1_hash(txt)
        chunk_id = f"{src}_p{page}_s{start}_{hash_short}"

        meta = {
            "source": src,
            "page": page,
            "chunk_start": start,
            "text_len": len(txt),
            "hash": hash_short
        }

        ids.append(chunk_id)
        texts.append(txt)
        metas.append(meta)

    print(f"✅ Kept {len(texts)} clean chunks for ingestion.")

    # 5️⃣ Initialize ChromaDB
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

    # delete old collection if exists
    existing = [c.name for c in client.list_collections()]
    if COLLECTION_NAME in existing:
        client.delete_collection(name=COLLECTION_NAME)
        print(f"🧹 Old collection '{COLLECTION_NAME}' removed.")

    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_model
    )

    # 6️⃣ Batch insert
    print("📥 Inserting chunks into Chroma...")
    for i in range(0, len(texts), BATCH_SIZE):
        j = i + BATCH_SIZE
        collection.add(
            ids=ids[i:j],
            documents=texts[i:j],
            metadatas=metas[i:j]
        )
        print(f"   • Added {min(j, len(texts))}/{len(texts)}")

    print("---------------------------------------------------")
    print(f"✅ Ingestion complete! Total chunks: {collection.count()}")
    print(f"📚 Collection saved at: {CHROMA_DB_PATH}")
    print("---------------------------------------------------")


# ======================================================
# --- Entry Point ---
# ======================================================
if __name__ == "__main__":
    main()
