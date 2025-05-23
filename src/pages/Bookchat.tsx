import { useState } from "react";
import axios from "axios";

const BookChat = () => {
  const [contextText, setContextText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ question: string; answer: string }[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain") {
      setError("Please upload a valid .txt file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContextText(text);
      setChatHistory([]);
      setError("");
    };
    reader.onerror = () => {
      setError("Failed to read the file.");
    };

    reader.readAsText(file);
  };

  const askQuestion = async () => {
    if (!userInput || !contextText) return;
    setIsLoading(true);
    setError("");

    const prompt = `
You are a helpful assistant. Only use the following text to answer the question. Do not use external knowledge.

[TEXT START]
${contextText.slice(0, 20000)}
[TEXT END]

Question: ${userInput}
Answer strictly based on the content above. If the answer is not in the text, say "Not found in the text."
`;

    try {
      const geminiRes = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        {
          params: {
            key: "YOUR_GEMINI_API_KEY",
          },
          headers: { "Content-Type": "application/json" },
        }
      );

      const answer = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "No answer found.";
      setChatHistory([...chatHistory, { question: userInput, answer }]);
      setUserInput("");
    } catch (err: any) {
      console.error("Gemini Chat Error:", err.message);
      setError("Failed to get answer from AI.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex flex-col items-center overflow-y-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-4 sm:mb-6 text-center">
        📄 Text File Chat AI
      </h1>

      {/* File Upload */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg w-full max-w-4xl space-y-4">
        <input
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          disabled={isLoading}
          className="w-full border border-gray-300 p-2 rounded-lg"
        />
        {error && <p className="text-red-600 font-medium">{error}</p>}
      </div>

      {/* Chat Section */}
      {contextText && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-2xl shadow-lg w-full max-w-4xl space-y-6">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scroll-smooth">
            {chatHistory.map((entry, idx) => (
              <div key={idx} className="border-b pb-4">
                <p className="text-gray-800 font-semibold">🧑‍💻 Q: {entry.question}</p>
                <p className="text-gray-700 whitespace-pre-line">🤖 A: {entry.answer}</p>
              </div>
            ))}
          </div>

          {/* Input & Button */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Ask something about the text..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full flex-1 border border-gray-300 rounded-lg p-2"
            />
            <button
              onClick={askQuestion}
              disabled={isLoading}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Ask
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookChat;
