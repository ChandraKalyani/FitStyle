document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('style-selector-form');
    const outputSection = document.getElementById('output-section');
    const resultText = document.getElementById('result-text');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Get all the choices from the dropdowns
        const bodyType = document.getElementById('body-type').value;
        const bodyShape = document.getElementById('body-shape').value;
        const gender = document.getElementById('gender').value;
        const ageGroup = document.getElementById('age-group').value; // <-- ADD THIS
        const skinTone = document.getElementById('skin-tone').value;
        const occasion = document.getElementById('occasion').value;

        outputSection.classList.remove('hidden');
        resultText.innerHTML = `<h2>FitStyle is creating your custom look...</h2><p>This may take a moment. Good style is worth the wait!</p>`;

        try {
            const response = await fetch('http://localhost:5000/get-recommendation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send all the values to the server
                body: JSON.stringify({ bodyType, bodyShape, gender, ageGroup, skinTone, occasion }), // <-- ADD 'ageGroup'
            });

            if (!response.ok) {
                throw new Error('Could not get a response from the server.');
            }

            const data = await response.json();

            let htmlResponse = data.recommendation
                .replace(/### (.*)/g, '<h3>$1</h3>')
                .replace(/\* (.*)/g, '<li>$1</li>');

            if (htmlResponse.includes('<li>')) {
                 htmlResponse = '<ul>' + htmlResponse.replace(/<li>/g, '</li><li>').substring(5) + '</li></ul>';
            }
            
            resultText.innerHTML = htmlResponse;

        } catch (error) {
            console.error('Error:', error);
            resultText.innerHTML = '<h2>Oops!</h2><p>Something went wrong. Please make sure your Python server is running and try again.</p>';
        }
    });

    form.addEventListener('reset', () => {
        outputSection.classList.add('hidden');
    });
});
