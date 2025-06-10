# --- This is a more detailed script to find the exact point of failure ---

print("Step 1: Script started.")

try:
    import os
    import google.generativeai as genai
    from dotenv import load_dotenv
    print("Step 2: Libraries imported successfully.")

    load_dotenv()
    print("Step 3: load_dotenv() executed.")

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("ERROR: GOOGLE_API_KEY not found in .env file or is empty.")
        exit()
    print("Step 4: API key retrieved from environment.")

    genai.configure(api_key=api_key)
    print("Step 5: genai.configure() executed.")

    print("Step 6: Attempting to list models... (This is the API call)")
    models = genai.list_models()
    print("Step 7: list_models() call completed.")

    found_a_model = False
    for m in models:
      if 'generateContent' in m.supported_generation_methods:
        print(f"-> SUCCESS: Found usable model: {m.name}")
        found_a_model = True
    
    if not found_a_model:
        print("-> WARNING: API call worked, but no models supporting 'generateContent' were found.")

except Exception as e:
    print("-" * 20)
    print(f"AN EXCEPTION OCCURRED: {e}")
    print("-" * 20)

print("Step 8: Script finished.")