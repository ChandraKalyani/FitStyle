import os
import json
from flask import Flask, request, jsonify, render_template, make_response
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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-recommendation', methods=['POST'])
def get_recommendation():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request"}), 400

        # PROMPT FOR SIMPLE, SHORT TEXT, USING ALL SIX OF YOUR ORIGINAL INPUTS
        outfit_prompt = f"""
        You are "FitStyle", a friendly fashion guide.
        A user needs a simple outfit idea. Your language must be very clear, short, and easy for anyone to understand.

        USER'S DETAILS:
        - Body Type: {data.get('body-type')}
        - Body Shape: {data.get('body-shape')}
        - Gender: {data.get('gender')}
        - Age Group: {data.get('age-group')}
        - Skin Tone: {data.get('skin-tone')}
        - Occasion: {data.get('occasion')}

        **Your Task:**
        Describe a simple outfit (Top, Bottom, Shoes). Use basic terms.
        Format your response using this exact markdown structure:

        ### Here's a Simple Outfit Idea:
        *   **Top:** [Very simple description of the top.]
        *   **Bottom:** [Very simple description of the bottom.]
        *   **Shoes:** [Very simple description of the shoes.]
        
        This look is great because it's comfortable and stylish for your occasion!
        """
        response = model.generate_content(outfit_prompt)
        
        # We ONLY return the 'recommendation' text.
        return jsonify({'recommendation': response.text})

    except Exception as e:
        print(f"An error occurred in get_recommendation: {e}")
        return jsonify({'error': 'Failed to get recommendation from AI.'}), 500

# UPGRADED CHAT ENDPOINT FOR ALTERNATIVES
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        history = data['history']
        new_message = data['newMessage']
        prompt = f"""
        You are "FitStyle", a friendly and helpful fashion chatbot. A user is asking for a change or an alternative to their outfit.
        Your goal is to be helpful and provide a specific, simple alternative.

        **Conversation History (The user's original recommendation):**
        {history}

        **User's New Request:** "{new_message}"

        **Your Task:**
        - Analyze the user's request.
        - Provide a single, simple, and clear alternative. For example, if they ask for a different color, suggest one. If they ask about different shoes, suggest a different type.
        - Keep your response conversational, short, and encouraging.
        """
        response = model.generate_content(prompt)
        return jsonify({'reply': response.text})
    except Exception as e:
        print(f"An error occurred in chat: {e}")
        return jsonify({'reply': 'I had a little trouble thinking of an alternative. Can you try rephrasing?'})

# Standard CORS handling
@app.route('/get-recommendation', methods=['OPTIONS'])
@app.route('/chat', methods=['OPTIONS'])
def handle_options():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "POST")
    return response

if __name__ == '__main__':
    app.run(debug=True)
