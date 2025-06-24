document.addEventListener('DOMContentLoaded', () => {

    // SCRIPT FOR CUSTOM DROPDOWNS
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

        if (customOptions) {
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
        }
        
        const syncWithRealSelect = () => {
            const selectedValue = realSelect.value;
            if (customOptions) {
                const selectedOptionEl = customOptions.querySelector(`.custom-option[data-value="${selectedValue}"]`);
                customOptions.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
                if (selectedOptionEl) {
                    triggerSpan.textContent = selectedOptionEl.textContent.trim();
                    triggerSpan.classList.remove('placeholder');
                    selectedOptionEl.classList.add('selected');
                } else {
                    if (realSelect.options.length > 0) {
                        const placeholder = realSelect.options[0].textContent;
                        triggerSpan.textContent = placeholder;
                        triggerSpan.classList.add('placeholder');
                    }
                }
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


    // MAIN APPLICATION LOGIC
    const form = document.getElementById('style-selector-form');
    const outputSection = document.getElementById('output-section');
    const resultText = document.getElementById('result-text');
    const chatContainer = document.getElementById('chat-container');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistoryContainer = document.getElementById('chat-history');

    let conversationHistory = "";
    
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const data = Object.fromEntries(new FormData(form).entries());

            outputSection.classList.remove('hidden');
            chatContainer.classList.add('hidden');
            resultText.innerHTML = `<div class="skeleton-text"></div><div class="skeleton-text"></div><div class="skeleton-text"></div>`;

            try {
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
                console.error('An error occurred:', error);
                resultText.innerHTML = `<h2>Oops! Something Went Wrong</h2><p>${error.message}</p>`;
            }
        });
    }

    // Chat functionality
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
            document.querySelectorAll('select').forEach(select => {
                select.value = "";
                select.dispatchEvent(new Event('change'));
            });
            outputSection.classList.add('hidden');
        });
    }
});
