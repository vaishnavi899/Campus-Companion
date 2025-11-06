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

# --- SSL Fix (for local network issues) ---
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# --- Configuration ---
CHROMA_DB_PATH = "chroma_db"
COLLECTION_NAME = "rulebook_docs"
EVALUATION_FILE = "evaluation_dataset.csv"
TOP_K_RESULTS = 3

MODEL_NAME = "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
MODEL_PATH = "models"

# --- Initialize Flask App ---
app = Flask(__name__)
CORS(app)

# --- Global Variables ---
chroma_client = None
collection = None
gpt_model = None
similarity_model = None
evaluation_pairs = []
evaluation_question_embeddings = None


# --- Helper Functions ---
def initialize_chromadb():
    """Initializes ChromaDB using thenlper/gte-small embedding model."""
    global chroma_client, collection
    try:
        embedding_model = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="thenlper/gte-small"
        )
        chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        collection = chroma_client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_model
        )
        print(f"✅ Collection '{COLLECTION_NAME}' loaded with {collection.count()} documents using gte-small.")
    except Exception as e:
        print(f"❌ Error initializing ChromaDB: {e}")
        collection = None


def initialize_model():
    """Initializes the GPT4All model."""
    global gpt_model
    full_model_path = os.path.join(MODEL_PATH, MODEL_NAME)
    if not os.path.exists(full_model_path):
        print(f"❌ Error: Model file not found at {full_model_path}")
        return
    try:
        gpt_model = GPT4All(model_name=MODEL_NAME, model_path=MODEL_PATH)
        print("✅ GPT4All model loaded successfully.")
    except Exception as e:
        print(f"❌ Error loading GPT4All model: {e}")


def initialize_evaluator():
    """Loads the evaluation dataset and precomputes embeddings using gte-small."""
    global similarity_model, evaluation_pairs, evaluation_question_embeddings
    try:
        print("🧠 Initializing evaluator with gte-small...")
        similarity_model = SentenceTransformer("thenlper/gte-small")
        
        if not os.path.exists(EVALUATION_FILE):
            print(f"⚠️ Warning: Evaluation file not found at {EVALUATION_FILE}. Skipping evaluator.")
            return

        with open(EVALUATION_FILE, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                evaluation_pairs.append(row)

        questions = [pair["question"] for pair in evaluation_pairs]
        evaluation_question_embeddings = similarity_model.encode(questions, convert_to_tensor=True)
        print(f"✅ Loaded {len(evaluation_pairs)} evaluation pairs with precomputed gte-small embeddings.")

    except Exception as e:
        print(f"❌ Error initializing evaluator: {e}")


def format_prompt(question, context):
    """Formats the prompt for GPT model."""
    return f"""You are a helpful assistant. Use ONLY the context to answer accurately.
If the answer is not in the context, say: "I cannot find the answer in the provided information."

Context:
---
{context}
---

Question: {question}

Answer:
"""


def generate_answer(prompt):
    """Generates an answer using GPT4All."""
    if gpt_model is None:
        return "Model is not initialized."
    with gpt_model.chat_session():
        response = gpt_model.generate(prompt, max_tokens=250).strip()
    return response


# --- Flask Routes ---
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/ask', methods=['POST'])
def ask():
    """Handles user questions and returns an answer."""
    data = request.get_json()
    question = data.get("question")

    if not question:
        return jsonify({"error": "No question provided"}), 400
    if collection is None or gpt_model is None:
        return jsonify({"error": "System not initialized"}), 500

    try:
        # Step 1: Retrieve context
        results = collection.query(
            query_texts=[question],
            n_results=TOP_K_RESULTS,
            include=["documents", "distances"]
        )
        context = "\n\n---\n\n".join(results["documents"][0])

        top_distance = results["distances"][0][0]
        confidence_score = (1 - top_distance) * 100
        print(f"\n🔹 User Question: {question}")
        print(f"🔸 Confidence Score: {confidence_score:.2f}%")

    except Exception as e:
        return jsonify({"error": f"Database query failed: {e}"}), 500

    # Step 2: Generate answer
    prompt = format_prompt(question, context)
    generated_answer = generate_answer(prompt)

    # Step 3: Evaluate accuracy (if dataset exists)
    if similarity_model and len(evaluation_pairs) > 0:
        user_embedding = similarity_model.encode(question, convert_to_tensor=True)
        cos_scores = util.cos_sim(user_embedding, evaluation_question_embeddings)[0]
        best_match_index = cos_scores.argmax()

        if cos_scores[best_match_index] > 0.85:
            best_match = evaluation_pairs[best_match_index]
            ground_truth = best_match["ground_truth_answer"]

            generated_emb = similarity_model.encode(generated_answer, convert_to_tensor=True)
            truth_emb = similarity_model.encode(ground_truth, convert_to_tensor=True)
            accuracy = util.cos_sim(generated_emb, truth_emb).item()
            print(f"🧩 Matched Question: {best_match['question']}")
            print(f"🎯 Real-time Accuracy: {accuracy * 100:.2f}%")
        else:
            print("⚠️ No strong match found in evaluation dataset.")

    return jsonify({"answer": generated_answer})


# --- Main Execution ---
if __name__ == "__main__":
    initialize_chromadb()
    initialize_model()
    initialize_evaluator()

    if gpt_model and collection:
        app.run(debug=True)
    else:
        print("❌ Exiting: Missing GPT4All model or ChromaDB collection.")
