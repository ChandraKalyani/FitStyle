document.addEventListener('DOMContentLoaded', () => {

    // The custom dropdown code at the top is correct. Do not change it.
    // ...

    // ===================================================================
    // ========= SIMPLIFIED AND CORRECTED APPLICATION LOGIC =============
    // ===================================================================
    const form = document.getElementById('style-selector-form');
    const outputSection = document.getElementById('output-section');
    const resultText = document.getElementById('result-text');
    const chatContainer = document.getElementById('chat-container');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistoryContainer = document.getElementById('chat-history');

    let conversationHistory = "";

    // We must check if the form element actually exists on the page
    if (form) {
        form.addEventListener('submit', async (event) => {
            // Prevent the default browser action of reloading the page
            event.preventDefault(); 
            
            console.log("Submit button clicked. Form event listener is working.");

            const data = Object.fromEntries(new FormData(form).entries());

            // Show loading state
            outputSection.classList.remove('hidden');
            chatContainer.classList.add('hidden');
            resultText.innerHTML = `<h3>Finding an outfit...</h3><p>This can take a moment, especially if the server is waking up.</p>`;

            try {
                // IMPORTANT: We use the full, correct URL for the deployed server
                const response = await fetch('https://fitstyle.onrender.com/get-recommendation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
                
                console.log("Fetch response received, status:", response.status);

                if (!response.ok) {
                    // Try to get more error details from the server's response
                    const errorBody = await response.text();
                    throw new Error(`Server responded with an error. Status: ${response.status}. Body: ${errorBody}`);
                }

                const resultData = await response.json();

                if (resultData.error) {
                    throw new Error(resultData.error);
                }

                let htmlResponse = resultData.recommendation
                    .replace(/### (.*)/g, '<h3>$1</h3>')
                    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\* /g, '<li>');
                
                if (htmlResponse.includes('<li>')) {
                    htmlResponse = '<ul>' + htmlResponse.replace(/<li>/g, '</li><li>').substring(5) + '</li></ul>';
                    htmlResponse = htmlResponse.replace(/<\/ul><li>/g, '<li>');
                }

                resultText.innerHTML = htmlResponse;
                
                conversationHistory = `The AI's first idea was:\n${resultData.recommendation}`;
                chatHistoryContainer.innerHTML = '';
                chatContainer.classList.remove('hidden');

            } catch (error) {
                console.error('A critical error occurred:', error);
                resultText.innerHTML = `<h2>Oops! Something Went Wrong</h2><p>We couldn't get a recommendation. The server might be busy or there might be a network issue.</p><p><small>Error details: ${error.message}</small></p>`;
            }
        });
    } else {
        console.error("CRITICAL ERROR: The form with id 'style-selector-form' was not found in the HTML.");
    }

    // The rest of the file (chat logic, helpers, etc.) can remain the same.
    // ...
});
