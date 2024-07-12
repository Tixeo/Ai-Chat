import React, { useState } from 'react';

const API_KEY = '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';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const App = () => {
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([
    { role: 'system', content: 'Vous êtes un assistant IA utile et amical.' }
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ajouter le message de l'utilisateur à l'historique
      const newHistory = [...conversationHistory, { role: 'user', content: message }];
      setMessage('');  // Clear the input field

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: newHistory,
          temperature: 0.7,
          max_tokens: 1000,
          stream: true
        })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullResponse = '';

      // Add a new entry to responses for the new incoming message
      setResponses((prevResponses) => [...prevResponses, '']);

      let currentResponseIndex = responses.length;  // Index of the new response

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;

        // Process and display the content of the chunk
        let buffer = chunk;
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (line.startsWith('data: ')) {
            line = line.slice(5).trim();
            if (line === '[DONE]') return;
            try {
              let data = JSON.parse(line);
              if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                let content = data.choices[0].delta.content;
                setResponses((prevResponses) => {
                  const newResponses = [...prevResponses];
                  newResponses[currentResponseIndex] += content;
                  return newResponses;
                });
              }
            } catch (error) {
              // Ignore parsing errors for incomplete JSON
            }
          }
        }
      }

      // Ajouter la réponse de l'assistant à l'historique
      setConversationHistory([...newHistory, { role: 'assistant', content: fullResponse }]);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error.message);
    }
  };

  return (
    <div>
      <form id="sendMessage" onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tapez votre message"
        />
        <button type="submit">Envoyer</button>
      </form>
      <div>
        <h2>Réponses de l'assistant:</h2>
        {responses.map((resp, index) => (
          <p key={index}>{resp}</p>
        ))}
      </div>
    </div>
  );
};

export default App;
