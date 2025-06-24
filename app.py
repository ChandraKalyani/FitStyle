import os
import json
import threading # We need this to run the AI call in the background
from flask import Flask, request, jsonify, render_template, make_response, g
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# Standard setup
try:
    with open('config.json') as config_file:
        config = json.load(config_file)
        genai.configure(api_key=config["API_KEY"])
except (FileNotFoundError, KeyError) as e:
    print(f"ERROR: Could not load API key from config.json. Details: {e}")
    exit()

model = genai.GenerativeModel('models/gemini-1.5-flash-latest')

# A simple in-memory "database" to store the result
# In a real, large-scale app, you'd use a real database like Redis or a SQL DB.
results_storage = {}

@app.route('/')
def index():
    return render_template('index.html')

# This is the function that does the slow AI work
def get_ai_recommendation_in_background(task_id, data):
    print(f"[{task_id}] Starting AI generation in the background...")
    try:
        outfit_prompt = f"""
        You are "FitStyle", a friendly fashion guide. A user needs a simple outfit idea.
        Your language must be very clear, short, and easy for anyone to understand.

        USER'S DETAILS:
        - Body Type: {data.get('body-type')}
        - Body Shape: {data.get('body-shape')}
        - Gender: {data.get('gender')}
        - Age Group: {data.get('age-group')}
        - Skin Tone: {data.get('skin-tone')}
        - Occasion: {data.get('occasion')}

        **Your Task:** Describe a simple outfit (Top, Bottom, Shoes).
        Format your response using this exact markdown structure:
        ### Here's a Simple Outfit Idea:
        *   **Top:** [Simple description]
        *   **Bottom:** [Simple description]
        *   **Shoes:** [Simple description]
        """
        response = model.generate_content(outfit_prompt)
        
        # Store the successful result
        results_storage[task_id] = {'status': 'completed', 'recommendation': response.text}
        print(f"[{task_id}] AI generation complete. Result stored.")

    except Exception as e:
        print(f"[{task_id}] ERROR during AI generation: {e}")
        # Store the error
        results_storage[task_id] = {'status': 'failed', 'error': str(e)}

# ===================================================================
# =================== STEP 1: INSTANT RESPONSE ======================
# ===================================================================
@app.route('/start-recommendation', methods=['POST'])
def start_recommendation():
    import uuid
    # Create a unique ID for this request
    task_id = str(uuid.uuid4())
    data = request.get_json()
    
    # Immediately store a "processing" status
    results_storage[task_id] = {'status': 'processing'}
    
    # Start the slow AI work in a separate background thread
    # This lets us return a response to the user immediately
    thread = threading.Thread(target=get_ai_recommendation_in_background, args=(task_id, data))
    thread.start()
    
    print(f"[{task_id}] Task started. Returning task ID to user.")
    
    # Immediately return the unique ID to the browser. This is very fast.
    return jsonify({'task_id': task_id})

# ===================================================================
# ================= STEP 2: CHECK FOR THE RESULT ====================
# ===================================================================
@app.route('/get-result/<task_id>', methods=['GET'])
def get_result(task_id):
    result = results_storage.get(task_id, {})
    
    # If the task is done, we can remove it from memory
    if result.get('status') == 'completed' or result.get('status') == 'failed':
        # Pop the result to clean up memory, but return it first
        return jsonify(results_storage.pop(task_id, {}))
        
    # If it's still processing, just return that status
    return jsonify(result)

# The /chat endpoint and other functions remain the same
@app.route('/chat', methods=['POST'])
def chat():
    # ... your chat logic ...
    pass

@app.route('/start-recommendation', methods=['OPTIONS'])
@app.route('/get-result/<task_id>', methods=['OPTIONS'])
@app.route('/chat', methods=['OPTIONS'])
def handle_options(task_id=None):
    # ... your CORS handling logic ...
    pass

if __name__ == '__main__':
    app.run(debug=True)
