document.addEventListener('DOMContentLoaded', () => {
    // Keep the custom dropdown script at the top, it's correct.
    // ...

    // MAIN APPLICATION LOGIC
    const form = document.getElementById('style-selector-form');
    const outputSection = document.getElementById('output-section');
    const resultText = document.getElementById('result-text');
    const chatContainer = document.getElementById('chat-container');
    // ... other element selections ...

    // Keep the profile saving/loading functions.
    // ...

    // ===================================================================
    // =========== NEW TWO-STEP FORM SUBMISSION LOGIC ====================
    // ===================================================================
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());

        outputSection.classList.remove('hidden');
        chatContainer.classList.add('hidden');
        
        resultText.innerHTML = `<h3>Finding the perfect outfit...</h3><p>This can take up to a minute when the server is waking up. Thanks for your patience!</p>`;

        try {
            // STEP 1: Start the job and get a task ID instantly
            const startResponse = await fetch('http://localhost:5000/start-recommendation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            
            if (!startResponse.ok) throw new Error('Could not start the recommendation process.');

            const { task_id } = await startResponse.json();

            // STEP 2: Check for the result every 3 seconds
            checkForResult(task_id);

        } catch (error) {
            console.error('Error starting process:', error);
            resultText.innerHTML = `<h2>Oops!</h2><p>Could not contact the server to start the process. Please try again.</p>`;
        }
    });

    // Function to poll for the result
    function checkForResult(taskId, retries = 20) {
        if (retries <= 0) {
            resultText.innerHTML = `<h2>Oops!</h2><p>The request timed out. The server might be very busy. Please try again in a minute.</p>`;
            return;
        }

        setTimeout(async () => {
            try {
                const resultResponse = await fetch(`http://localhost:5000/get-result/${taskId}`);
                const data = await resultResponse.json();

                if (data.status === 'processing') {
                    // It's not ready yet, check again
                    checkForResult(taskId, retries - 1);
                } else if (data.status === 'completed') {
                    // SUCCESS! Display the result.
                    let htmlResponse = data.recommendation
                        .replace(/### (.*)/g, '<h3>$1</h3>')
                        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n\* /g, '<li>');
                    
                    if (htmlResponse.includes('<li>')) {
                        htmlResponse = '<ul>' + htmlResponse.replace(/<li>/g, '</li><li>').substring(5) + '</li></ul>';
                    }
                    resultText.innerHTML = htmlResponse;
                    
                    // Setup and show chat
                    conversationHistory = `The AI's first idea was:\n${data.recommendation}`;
                    chatHistoryContainer.innerHTML = '';
                    chatContainer.classList.remove('hidden');
                } else if (data.status === 'failed') {
                    // The background task failed
                    console.error('Background task failed:', data.error);
                    resultText.innerHTML = `<h2>Oops!</h2><p>The AI had a problem creating an outfit. Please try again.</p>`;
                }
            } catch (error) {
                console.error('Error fetching result:', error);
                // Maybe the network failed, try again
                checkForResult(taskId, retries - 1);
            }
        }, 3000); // Check every 3 seconds
    }

    // Your chat logic and other functions do not need to change.
    // ...
});
