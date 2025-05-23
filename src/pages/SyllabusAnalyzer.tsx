import { useState } from "react";
import { analyzeSyllabus, getYouTubeRecommendations } from "../lib/api.ts";
import jsPDF from "jspdf";

const SyllabusAnalyzer = () => {
  const [syllabusText, setSyllabusText] = useState("");
  const [analysis, setAnalysis] = useState("🔍 Waiting for analysis...");
  const [loading, setLoading] = useState(false);
  interface Video {
    thumbnail: string;
    title: string;
    url: string;
  }
  const [videos, setVideos] = useState<Video[]>([]);

  const handleAnalyze = async () => {
    if (!syllabusText.trim()) {
      alert("Please enter the syllabus text.");
      return;
    }

    setLoading(true);
    setAnalysis("⏳ Analyzing syllabus...");

    try {
      console.log("Sending text to API:", syllabusText);
      const { overview } = await analyzeSyllabus(syllabusText);
      setAnalysis(overview);
      fetchYouTubeVideos(overview);
    } catch (error) {
      console.error("Error analyzing syllabus:", error);
      setAnalysis("❌ Failed to analyze. Try again.");
    }

    setLoading(false);
  };

  const fetchYouTubeVideos = async (query: string) => {
    try {
      const { videos } = await getYouTubeRecommendations(query);
      setVideos(videos);
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 20;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Syllabus Analysis Report", margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const addTextWithWrapping = (title: string, text: string) => {
      if (y + 10 > 280) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      const wrappedText = doc.splitTextToSize(text, 170);
      wrappedText.forEach((line: string) => {
        if (y + 6 > 280) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 6;
      });
      y += 4;
    };

    addTextWithWrapping("Syllabus Provided:", syllabusText);
    addTextWithWrapping("Analysis Overview:", analysis);

    doc.save("Syllabus_Analysis.pdf");
  };

  return (
    <div className="max-w-2xl mx-auto h-screen overflow-y-auto mt-10 p-6 bg-white shadow-lg rounded-xl flex flex-col">
      <h1 className="text-2xl font-bold text-gray-800 mb-4"> Syllabus Analyzer</h1>
      <p className="text-gray-600 mb-4">Enter the syllabus text below, and AI will analyze the topics instantly.</p>

      <textarea
        className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
        placeholder="Type or paste syllabus here..."
        value={syllabusText}
        onChange={(e) => setSyllabusText(e.target.value)}
      />

      <button
        className={`mt-4 px-4 py-2 text-white font-semibold rounded-md transition ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
        onClick={handleAnalyze}
        disabled={loading}
      >
        {loading ? "⏳ Analyzing..." : " Analyze Syllabus"}
      </button>

      <h2 className="text-lg font-semibold mt-6"> Analysis Overview:</h2>
      <p className="text-gray-700 whitespace-pre-line">{analysis}</p>

      <h2 className="text-lg font-semibold mt-6"> Related YouTube Videos:</h2>
      {videos.length > 0 ? (
        videos.map((video, index) => (
          <div key={index} className="flex items-center space-x-4 border p-3 rounded-md shadow">
            <img src={video.thumbnail} alt={video.title} className="w-20 h-14 rounded" />
            <div>
              <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {video.title}
              </a>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No videos found.</p>
      )}

      <button className="mt-4 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700" onClick={handleDownloadPDF}>
         Download PDF
      </button>
    </div>
  );
};

export default SyllabusAnalyzer;
