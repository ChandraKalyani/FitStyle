document.addEventListener('DOMContentLoaded', () => {
    // Select all the elements we need from the page
    const form = document.getElementById('style-selector-form');
    const outputSection = document.getElementById('output-section');
    const resultText = document.getElementById('result-text');
    const chatContainer = document.getElementById('chat-container');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistoryContainer = document.getElementById('chat-history');

    let conversationHistory = "";

    // Make sure the form exists before we do anything
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); // Stop the page from reloading
            
            const data = Object.fromEntries(new FormData(form).entries());

            // Show the output section and a loading message
            outputSection.classList.remove('hidden');
            chatContainer.classList.add('hidden');
            resultText.innerHTML = `<p>Finding the perfect outfit for you...</p>`;

            try {
                // Send the user's choices to our server on Render
                const response = await fetch('https://fitstyle.onrender.com/get-recommendation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    throw new Error(`The server responded with an error (Status: ${response.status}). Please try again.`);
                }

                const resultData = await response.json();
                
                if (resultData.error) {
                    throw new Error(resultData.error);
                }

                // Format the AI's response into clean HTML
                let htmlResponse = resultData.recommendation
                    .replace(/### (.*)/g, '<h3>$1</h3>')
                    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\* /g, '<li>');
                
                if (htmlResponse.includes('<li>')) {
                    htmlResponse = '<ul>' + htmlResponse.replace(/<li>/g, '</li><li>').substring(5) + '</li></ul>';
                    htmlResponse = htmlResponse.replace(/<\/ul><li>/g, '<li>');
                }

                // Display the final result
                resultText.innerHTML = htmlResponse;
                
                // Prepare the chat for follow-up questions
                conversationHistory = `The AI's first idea was:\n${resultData.recommendation}`;
                chatHistoryContainer.innerHTML = ''; // Clear any old chat messages
                chatContainer.classList.remove('hidden'); // Show the chat box

            } catch (error) {
                console.error('An error occurred:', error);
                resultText.innerHTML = `<h2>Oops! Something Went Wrong</h2><p>${error.message}</p>`;
            }
        });
    }

    // Chat functionality (This part is correct)
    if (chatForm) {
        chatForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const userMessage = chatInput.value.trim();
            if (!userMessage) return;
            appendMessage(userMessage, 'user-message');
            chatInput.value = '';
            conversationHistory += `\n\nUser: ${userMessage}`;
            try {
                const response = await fetch('https://fitstyle.onrender.com/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ history: conversationHistory, newMessage: userMessage }),
                });
                const data = await response.json();
                appendMessage(data.reply, 'ai-message');
                conversationHistory += `\n\nAI: ${data.reply}`;
            } catch (error) {
                appendMessage('Sorry, I had a little trouble with that.', 'ai-message');
            }
        });
    }
    
    function appendMessage(text, className) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${className}`;
        messageElement.innerHTML = text.replace(/\n/g, '<br>').replace(/\* /g, '<br>• ');
        chatHistoryContainer.appendChild(messageElement);
        chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
    }

    // Reset button functionality
    if (form) {
        form.addEventListener('reset', () => {
            outputSection.classList.add('hidden');
        });
    }
});
