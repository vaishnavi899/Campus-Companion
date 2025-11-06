import os
import chromadb
from langchain_community.document_loaders import DirectoryLoader, PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from chromadb.utils import embedding_functions

# --- Configuration ---
CHROMA_DB_PATH = "chroma_db"
SOURCE_DOCS_PATH = "data"   # Folder containing your PDFs
COLLECTION_NAME = "rulebook_docs"


def main():
    print("🚀 Starting data ingestion...")

    # 1. Define the embedding model (use thenlper/gte-small)
    embedding_model = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="thenlper/gte-small"
    )

    # 2. Load all PDF documents
    loader = DirectoryLoader(
        SOURCE_DOCS_PATH,
        glob="**/*.pdf",
        loader_cls=PyMuPDFLoader,
        show_progress=True
    )

    print("📄 Loading documents...")
    documents = loader.load()
    if not documents:
        print(f"❌ No documents found in the '{SOURCE_DOCS_PATH}' folder. Exiting.")
        return

    # 3. Split documents into smaller overlapping chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150,
        separators=["\n\n", "\n", ".", " "]
    )

    docs = text_splitter.split_documents(documents)
    print(f"✅ Split {len(documents)} documents into {len(docs)} chunks.")

    # 4. Initialize ChromaDB client
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

    # 5. Delete existing collection if it exists
    existing_collections = [c.name for c in client.list_collections()]
    if COLLECTION_NAME in existing_collections:
        client.delete_collection(name=COLLECTION_NAME)
        print(f"🧹 Deleted existing collection: {COLLECTION_NAME}")

    # 6. Create a new Chroma collection
    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_model
    )

    # 7. Add document chunks to Chroma
    print("📥 Adding document chunks to Chroma (please wait)...")
    collection.add(
        documents=[doc.page_content for doc in docs],
        metadatas=[doc.metadata for doc in docs],
        ids=[f"doc_{i}" for i in range(len(docs))]
    )

    print("-" * 60)
    print("✅ Data ingestion complete!")
    print(f"📚 Total chunks added to collection '{COLLECTION_NAME}': {collection.count()}")
    print("-" * 60)


if __name__ == "__main__":
    main()
