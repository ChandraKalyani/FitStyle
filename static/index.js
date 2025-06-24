document.addEventListener('DOMContentLoaded', () => {

    // SCRIPT FOR CUSTOM DROPDOWNS (This part is correct and stays)
    document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const customOptions = wrapper.querySelector('.custom-options');
        const realSelect = wrapper.querySelector('select');
        const triggerSpan = trigger.querySelector('span');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select.open').forEach(openSelect => {
                if (openSelect !== wrapper.querySelector('.custom-select')) {
                    openSelect.classList.remove('open');
                }
            });
            wrapper.querySelector('.custom-select').classList.toggle('open');
        });

        customOptions.querySelectorAll('.custom-option').forEach(option => {
            option.addEventListener('click', () => {
                const currentlySelected = customOptions.querySelector('.selected');
                if (currentlySelected) currentlySelected.classList.remove('selected');
                option.classList.add('selected');
                triggerSpan.textContent = option.textContent.trim();
                triggerSpan.classList.remove('placeholder');
                realSelect.value = option.getAttribute('data-value');
                realSelect.dispatchEvent(new Event('change'));
                wrapper.querySelector('.custom-select').classList.remove('open');
            });
        });
        
        const syncWithRealSelect = () => {
            const selectedValue = realSelect.value;
            const selectedOptionEl = customOptions.querySelector(`.custom-option[data-value="${selectedValue}"]`);
            customOptions.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
            if (selectedOptionEl) {
                triggerSpan.textContent = selectedOptionEl.textContent.trim();
                triggerSpan.classList.remove('placeholder');
                selectedOptionEl.classList.add('selected');
            } else {
                const placeholder = realSelect.querySelector('option[disabled]').textContent;
                triggerSpan.textContent = placeholder;
                triggerSpan.classList.add('placeholder');
            }
        };
        realSelect.addEventListener('change', syncWithRealSelect);
        syncWithRealSelect();
    });

    window.addEventListener('click', () => {
        document.querySelectorAll('.custom-select.open').forEach(openSelect => {
            openSelect.classList.remove('open');
        });
    });


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
    
    // Check if the form element exists before adding a listener
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log("Form submitted. Starting process..."); // Debugging line

            const data = Object.fromEntries(new FormData(form).entries());

            outputSection.classList.remove('hidden');
            chatContainer.classList.add('hidden');
            
            resultText.innerHTML = `<div class="skeleton-text"></div><div class="skeleton-text"></div>`;

            try {
                // We use the original, direct endpoint
                const response = await fetch('https://fitstyle.onrender.com/get-recommendation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                
                console.log("Response received from server:", response.status); // Debugging line

                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                const resultData = await response.json();

                if (resultData.error) {
                    throw new Error(resultData.error);
                }

                console.log("Recommendation data:", resultData.recommendation); // Debugging line

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
                console.error('An error occurred:', error); // Debugging line
                resultText.innerHTML = `<h2>Oops! Something Went Wrong</h2><p>We couldn't get a recommendation. The server might be busy or waking up. Please try again in a minute.</p><p><small>Error: ${error.message}</small></p>`;
            }
        });
    } else {
        console.error("The form with id 'style-selector-form' was not found!");
    }

    // Chat logic (This is correct and does not need to change)
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
                if (!response.ok) throw new Error('Chat server error.');
                const data = await response.json();
                appendMessage(data.reply, 'ai-message');
                conversationHistory += `\n\nAI: ${data.reply}`;
            } catch (error) {
                console.error('Chat Error:', error);
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

    // Reset logic (This is correct)
    if(form) {
        form.addEventListener('reset', () => {
            document.querySelectorAll('select').forEach(select => {
                select.value = "";
                select.dispatchEvent(new Event('change'));
            });
            outputSection.classList.add('hidden');
            chatContainer.classList.add('hidden');
            conversationHistory = "";
        });
    }
});
