from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import csv
import datetime
import chromadb
from gpt4all import GPT4All
from chromadb.utils import embedding_functions
from sentence_transformers import SentenceTransformer, util
import ssl
import re

# ======================================================
# --- SSL Fix (for local network issues) ---
# ======================================================
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context


# ======================================================
# --- Configuration ---
# ======================================================
CHROMA_DB_PATH = "chroma_db"
COLLECTION_NAME = "rulebook_docs"
EVALUATION_FILE = "evaluation_dataset.csv"

MODEL_NAME = "Phi-3-mini-4k-instruct-q4.gguf"
MODEL_PATH = "models"

TOP_K_RESULTS = 5
MAX_ALLOWED_DISTANCE = 0.35      # reject low-confidence chunks
MAX_CONTEXT_CHARS = 2500         # avoid overloading the LLM


# ======================================================
# --- Flask App Setup ---
# ======================================================
app = Flask(__name__)
CORS(app)

chroma_client = None
collection = None
gpt_model = None
similarity_model = None
evaluation_pairs = []
evaluation_question_embeddings = None


# ======================================================
# --- Helper Functions ---
# ======================================================
def clean_text(txt: str) -> str:
    """Cleans line breaks, spaces, and artifacts from context."""
    if not txt:
        return ""
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt


def initialize_chromadb():
    """Initializes ChromaDB client using thenlper/gte-small embeddings."""
    global chroma_client, collection
    try:
        print("🧠 Initializing ChromaDB client...")
        embedding_model = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="thenlper/gte-small"
        )
        chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        collection = chroma_client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_model
        )
        print(f"✅ Collection '{COLLECTION_NAME}' loaded ({collection.count()} chunks).")
    except Exception as e:
        print(f"❌ Error initializing ChromaDB: {e}")
        collection = None


def initialize_model():
    """Initializes the GPT4All model."""
    global gpt_model
    full_path = os.path.join(MODEL_PATH, MODEL_NAME)
    if not os.path.exists(full_path):
        print(f"❌ Model not found at {full_path}")
        return
    try:
        gpt_model = GPT4All(model_name=MODEL_NAME, model_path=MODEL_PATH)
        print("✅ GPT4All model loaded successfully.")
    except Exception as e:
        print(f"❌ Error loading GPT4All model: {e}")


def initialize_evaluator():
    """Loads the evaluation dataset and precomputes question embeddings."""
    global similarity_model, evaluation_pairs, evaluation_question_embeddings
    try:
        print("🧩 Loading evaluator (gte-small)...")
        similarity_model = SentenceTransformer("thenlper/gte-small")

        if not os.path.exists(EVALUATION_FILE):
            print(f"⚠️ Evaluation file '{EVALUATION_FILE}' not found. Skipping evaluator.")
            return

        with open(EVALUATION_FILE, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            evaluation_pairs = [row for row in reader if row.get("question")]

        questions = [pair["question"] for pair in evaluation_pairs]
        evaluation_question_embeddings = similarity_model.encode(questions, convert_to_tensor=True)

        print(f"✅ Evaluator initialized with {len(evaluation_pairs)} Q–A pairs.")

    except Exception as e:
        print(f"❌ Error initializing evaluator: {e}")


def format_prompt(question, context):
    """Prompt strictly limiting LLM to the retrieved context."""
    return f"""You are a rulebook assistant. 
Use ONLY the context below to answer. 
If the answer is not present, respond exactly with:
"I cannot find the answer in the provided information."

Context:
---
{context}
---

Question: {question}

Answer:"""


def generate_answer(prompt):
    """Generates a response from GPT4All TinyLlama."""
    if gpt_model is None:
        return "Model not initialized."
    try:
        with gpt_model.chat_session():
            output = gpt_model.generate(prompt, max_tokens=250, temp=0.2)
        return output.strip()
    except Exception as e:
        print(f"⚠️ LLM generation error: {e}")
        return "Error generating answer."


# ======================================================
# --- Flask Routes ---
# ======================================================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/ask', methods=['POST'])
def ask():
    """Handles user question and returns grounded response."""
    data = request.get_json()
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "No question provided."}), 400
    if collection is None or gpt_model is None:
        return jsonify({"error": "System not initialized."}), 500

    # --------------------------------------------------
    # Step 1: Retrieve from ChromaDB
    # --------------------------------------------------
    try:
        results = collection.query(
            query_texts=[question],
            n_results=TOP_K_RESULTS,
            include=["documents", "metadatas", "distances"]
        )

        docs = results["documents"][0]
        dists = results["distances"][0]

        # Filter out weak matches
        paired = [(clean_text(d), dist) for d, dist in zip(docs, dists) if dist <= MAX_ALLOWED_DISTANCE]
        if not paired:
            print("⚠️ No confident match found (distance too high).")
            return jsonify({"answer": "I cannot find the answer in the provided information."})

        # Keep top few chunks
        context_blocks = []
        total_chars = 0
        for i, (doc, dist) in enumerate(paired):
            block = f"[{i+1}] {doc.strip()} (distance={dist:.3f})"
            total_chars += len(block)
            if total_chars > MAX_CONTEXT_CHARS:
                break
            context_blocks.append(block)

        context = "\n\n---\n\n".join(context_blocks)

        best_distance = paired[0][1]
        confidence_score = (1 - best_distance) * 100
        print(f"\n🔹 Q: {question}")
        print(f"🔸 Confidence ≈ {confidence_score:.2f}% | Used {len(context_blocks)} context chunks")

    except Exception as e:
        return jsonify({"error": f"ChromaDB query failed: {e}"}), 500

    # --------------------------------------------------
    # Step 2: LLM Answer
    # --------------------------------------------------
    prompt = format_prompt(question, context)
    generated_answer = generate_answer(prompt)
   


    # --------------------------------------------------
    # Step 3: Optional Evaluator Accuracy
    # --------------------------------------------------
    if similarity_model and evaluation_pairs:
        user_emb = similarity_model.encode(question, convert_to_tensor=True)
        cos_scores = util.cos_sim(user_emb, evaluation_question_embeddings)[0]
        best_match_index = cos_scores.argmax()
        best_sim = cos_scores[best_match_index].item()

        if best_sim > 0.85:
            best_match = evaluation_pairs[best_match_index]
            truth = best_match["ground_truth_answer"]

            gen_emb = similarity_model.encode(generated_answer, convert_to_tensor=True)
            truth_emb = similarity_model.encode(truth, convert_to_tensor=True)
            acc = util.cos_sim(gen_emb, truth_emb).item()

            print(f"🧩 Matched Eval Q: {best_match['question']}")
            print(f"🎯 Accuracy vs Truth: {acc*100:.2f}%")
        else:
            print("⚠️ No close match in evaluation set.")

    return jsonify({
        "answer": generated_answer,
        "confidence": f"{confidence_score:.2f}%",
        "context_used": len(context_blocks)
    })


# ======================================================
# --- App Startup ---
# ======================================================
if __name__ == "__main__":
    initialize_chromadb()
    initialize_model()
    initialize_evaluator()

    if gpt_model and collection:
        print("\n🚀 Flask RAG evaluator running at http://127.0.0.1:5000/")
        app.run(debug=True)
    else:
        print("❌ Exiting: Missing model or ChromaDB collection.")
