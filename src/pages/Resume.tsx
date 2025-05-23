import { useState } from "react";
import axios from "axios";

const ResumeUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string;
  }>({});
  const [results, setResults] = useState<{ [key: number]: string }>({});
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [codingQuestions, setCodingQuestions] = useState<any[]>([]);
  const [jobRecommendations, setJobRecommendations] = useState({
    titles: [],
    growthPaths: [],
    skillGaps: [],
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setError("");
      setExtractedText("");
      setMcqs([]);
      setResults({});
      setScore(null);
      setJobRecommendations({ titles: [], growthPaths: [], skillGaps: [] });
    }
  };

  const handleUpload = async () => {
    if (!file) return setError("Please select a file.");
    setIsLoading(true);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/analyze",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const extracted = response.data.extractedText;
      setExtractedText(extracted || "No text extracted.");

      if (extracted) await generateMCQs(extracted);
    } catch (err: any) {
      console.error("Upload Error:", err.message);
      setError("Error analyzing resume.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateMCQs = async (resumeText: string) => {
    setIsLoading(true);
    try {
      const prompt = `Return a strict JSON object with keys: "mcqs", "coding_questions", "job_titles", "growth_paths", "skill_gaps".

- "mcqs": Array of 20 objects. MCQS should only be based the technical skills mentionaed in the resume. Each object should contain:
  - question: string
  - options: array of 4 strings (e.g. ["a. ...", "b. ...", "c. ...", "d. ..."])
  - answer: correct letter (e.g. "a")

- "coding_questions": Array of 3 DSA-based questions, ONLY DSA-based QUESTIONS SHOULD BE ASKED LIKE hackerrank,leetcode. Each object should contain:
  - title: string
  - statement: string
  - constraints: string
  - examples: array of { input: string, output: string }
  - complexity: string
  - function_signature_python: string
  - function_signature_javascript: string

- "job_titles": array of 3 strings
- "growth_paths": array of 3 strings
- "skill_gaps": array of 3 strings

Strictly base the content only on this resume:\n${resumeText}`;

      const geminiResponse = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        {
          params: { key: import.meta.env.VITE_GEMINI_API_KEY },
          headers: { "Content-Type": "application/json" },
        }
      );

      const responseText =
        geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const match = responseText.match(/\{[\s\S]*\}/);

      if (!match) throw new Error("No JSON found in Gemini response.");

      const parsed = JSON.parse(match[0]);

      const fixedMcqs = parsed.mcqs.map((mcq: any) => {
        const opts = Array.isArray(mcq.options)
          ? mcq.options
          : ["a", "b", "c", "d"].map((k) => `${k}. ${mcq[k]}`);
        return { question: mcq.question, options: opts, answer: mcq.answer };
      });

      setMcqs(fixedMcqs);
      setCodingQuestions(parsed.coding_questions || []);
      setJobRecommendations({
        titles: parsed.job_titles || [],
        growthPaths: parsed.growth_paths || [],
        skillGaps: parsed.skill_gaps || [],
      });
    } catch (err: any) {
      console.error("Gemini AI Error:", err.message);
      setError("Failed to fetch MCQs or DSA questions.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (index: number, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [index]: option }));
  };

  const submitAnswers = () => {
    let correct = 0;
    const resultObj: { [key: number]: string } = {};

    mcqs.forEach((mcq, i) => {
      const user = (selectedAnswers[i] || "").charAt(0).toLowerCase();
      const correctAns = mcq.answer.trim().toLowerCase();

      if (user === correctAns) {
        correct++;
        resultObj[i] = "✅ Correct";
      } else {
        resultObj[i] = `❌ Incorrect (Correct: ${mcq.answer})`;
      }
    });

    setResults(resultObj);
    setScore(correct);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 overflow-y-auto">
      <h1 className="text-4xl font-bold text-center text-blue-800 mb-10">
        📄 Resume-Based Interview Trainer
      </h1>

      <div className="w-full max-w-5xl space-y-12">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-200">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Upload Resume
          </h2>

          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            disabled={isLoading}
            className="w-full border border-gray-300 rounded-lg p-3 mb-4"
          />

          <button
            onClick={handleUpload}
            disabled={isLoading}
            className={`w-full py-3 text-white font-semibold rounded-lg transition-all duration-200 ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Processing..." : "Analyze Resume"}
          </button>

          {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
        </div>

        {/* MCQs */}
        {mcqs.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-800">
              🎓 MCQ Quiz
            </h2>
            {mcqs.map((mcq, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl shadow-md">
                <p className="font-medium mb-2">
                  {idx + 1}. {mcq.question}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {mcq.options.map((opt: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(idx, opt)}
                      className={`p-2 rounded-md border text-left ${
                        selectedAnswers[idx] === opt
                          ? "bg-blue-500 text-white"
                          : "hover:bg-blue-100"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {results[idx] && (
                  <p className="text-sm text-gray-600 mt-1">{results[idx]}</p>
                )}
              </div>
            ))}

            <button
              onClick={submitAnswers}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              Submit Answers
            </button>

            {score !== null && (
              <p className="text-lg text-center font-bold text-blue-700">
                Score: {score} / {mcqs.length}
              </p>
            )}
          </div>
        )}

        {/* Coding Questions */}
        {codingQuestions.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-800">
              💻 DSA Coding Questions
            </h2>
            {codingQuestions.map((q, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl shadow space-y-2"
              >
                <h3 className="font-semibold text-lg text-blue-700">
                  {idx + 1}. {q.title}
                </h3>
                <p>{q.statement}</p>
                <p>
                  <strong>Constraints:</strong> {q.constraints}
                </p>
                <div>
                  <strong>Examples:</strong>
                  <ul className="list-disc ml-6">
                    {q.examples.map((ex: any, i: number) => (
                      <li key={i} className="text-sm">
                        🔹 <strong>Input:</strong> {ex.input} |{" "}
                        <strong>Output:</strong> {ex.output}
                      </li>
                    ))}
                  </ul>
                </div>
                <p>
                  <strong>Complexity:</strong> {q.complexity}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Job Suggestions */}
        {jobRecommendations.titles.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-800">
              💼 Career Recommendations
            </h2>
            <div>
              <h3 className="font-semibold text-blue-700 mb-1">
                🎯 Suitable Job Titles
              </h3>
              <ul className="list-disc ml-6">
                {jobRecommendations.titles.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-green-700 mb-1">
                📈 Growth Paths
              </h3>
              <ul className="list-disc ml-6">
                {jobRecommendations.growthPaths.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-600 mb-1">🛠️ Skill Gaps</h3>
              <ul className="list-disc ml-6">
                {jobRecommendations.skillGaps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUploader;
