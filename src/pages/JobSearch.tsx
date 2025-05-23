import { useState } from "react";
import axios from "axios";

const SkillExtractor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExtractedText("");
      setSkills([]);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return setError("Please select a file.");

    setIsLoading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/analyze",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const extracted = res.data.extractedText;
      setExtractedText(extracted || "No text extracted.");

      if (extracted) extractSkills(extracted);
    } catch (err: any) {
      console.error("Upload Error:", err.message);
      setError("Error analyzing resume.");
    } finally {
      setIsLoading(false);
    }
  };

  const extractSkills = (text: string) => {
    const regex =
      /\b(JavaScript|Python|React|Node\.js|Java|C\+\+|HTML|CSS|SQL|Machine Learning|Data Science|AWS|Docker|Kubernetes|Git|Express|MongoDB|TypeScript)\b/gi;
    const found = [...new Set(text.match(regex)?.map((s) => s.trim()) || [])];
    setSkills(found);
  };

  const generateSearchLinks = (skill: string) => {
    const baseSearch = encodeURIComponent(`${skill} internships or jobs`);
    return {
      linkedin: `https://www.linkedin.com/jobs/search/?keywords=${baseSearch}`,
      internshala: `https://internshala.com/internships/keywords-${skill.toLowerCase().replace(
        /\s+/g,
        "-"
      )}`,
      google: `https://www.google.com/search?q=${baseSearch}`,
    };
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 overflow-y-auto">
      <h1 className="text-4xl font-bold text-black text-center mb-10">
        Job Search Assistant
      </h1>

      <div className="w-full max-w-5xl space-y-12">
        {/* Upload Section */}
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

        {/* Skills and Jobs Section */}
        {skills.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 text-center">
              Opportunities Based on Your Skills
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map((skill, idx) => {
                const links = generateSearchLinks(skill);
                return (
                  <div
                    key={idx}
                    className="p-6 bg-white rounded-xl shadow-md border border-gray-200"
                  >
                    <h3 className="text-xl font-semibold text-blue-700 mb-2">
                      {skill}
                    </h3>
                    <ul className="text-sm space-y-1">
                      <li>
                        <a
                          href={links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          LinkedIn Jobs
                        </a>
                      </li>
                      <li>
                        <a
                          href={links.internshala}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Internshala Internships
                        </a>
                      </li>
                      <li>
                        <a
                          href={links.google}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                           Google Search
                        </a>
                      </li>
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillExtractor;
