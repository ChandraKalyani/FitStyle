# app.py
import os
import json # 1. We import the 'json' library
from flask import Flask, request, jsonify, render_template, make_response
from flask_cors import CORS
# from dotenv import load_dotenv  <- 2. We no longer need dotenv
import google.generativeai as genai

# load_dotenv() <- We no longer need this line

app = Flask(__name__)
CORS(app)

# --- 3. THIS IS THE MAIN PART THAT HAS CHANGED ---
# We now load the API key from config.json
try:
    with open('config.json') as config_file:
        config = json.load(config_file)
        # Configure the Generative AI model with the key from the JSON file
        genai.configure(api_key=config["API_KEY"])
except FileNotFoundError:
    print("ERROR: config.json file not found. Please create it and add your API_KEY.")
    exit()
except KeyError:
    print("ERROR: 'API_KEY' not found in config.json file. Please add it.")
    exit()
# ----------------------------------------------------

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-recommendation', methods=['POST', 'OPTIONS'])
def get_recommendation():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "POST")
        return response

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request: No JSON data received."}), 400

        prompt = f"""
        You are "FitStyle", a friendly and expert fashion advisor.
        A user needs an outfit recommendation based on the following details:
        - Body Type: {data.get('bodyType', 'Not specified')}
        - Body Shape: {data.get('bodyShape', 'Not specified')}
        - Gender: {data.get('gender', 'Not specified')}
        - Age Group: {data.get('ageGroup', 'Not specified')}
        - Skin Tone: {data.get('skinTone', 'Not specified')}
        - Occasion: {data.get('occasion', 'Not specified')}

        Provide a single, stylish outfit. Format your response using markdown with the following structure exactly:

        **The Outfit:**
        *   **Top:** [Describe the top, e.g., Cream-colored fitted t-shirt]
        *   **Bottom:** [Describe the bottom, e.g., Dark wash straight-leg jeans]
        *   **Footwear:** [Describe the footwear, e.g., White sneakers]
        *   **Accessory/Outerwear:** [Describe an optional accessory or jacket]

        **Why It Works:**
        *   [Explain the first reason in a single bullet point]
        *   [Explain the second reason in a single bullet point]
        *   [Explain the third reason in a single bullet point]
        """
        
        model = genai.GenerativeModel('models/gemini-1.5-flash-latest')
        
        response = model.generate_content(prompt)
        return jsonify({'recommendation': response.text})

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Failed to get recommendation from AI.'}), 500

if __name__ == '__main__':
    app.run(debug=True)