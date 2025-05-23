const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;    

import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client using the CDN version
declare global {
  interface Window {
    GoogleGenerativeAI: any;
  }
}

// Wait for the Google AI library to load
let genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
let model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

async function initializeAI() {
  return new Promise((resolve) => {
    const checkLibrary = () => {
      if (window.GoogleGenerativeAI) {
        genAI = new window.GoogleGenerativeAI(GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        resolve(true);
      } else {
        setTimeout(checkLibrary, 100);
      }
    };
    checkLibrary();
  });
}

// Initialize AI when the module loads
const aiInitialized = initializeAI();

export async function generateResponse(query: string) {
  try {
    const result = await model.generateContent(query);
    const response = await result.response;
    return { response: response.text() };
  } catch (error) {
    console.error("Error generating response:", error);
    return { response: "Sorry, I couldn't process your request." };
  }
}


export async function extractTopics(text: string): Promise<string[]> {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: `Extract key topics from this text:\n\n"${text}"\n\nReturn only a plain JSON array without markdown or explanations.` }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    // **Fix: Remove Markdown formatting (` ```json ` and ` ``` `)**
    rawText = rawText.replace(/```json\n|\n```/g, '').trim();

    return JSON.parse(rawText); // Convert cleaned JSON string to array
  } catch (error) {
    console.error('Error extracting topics:', error);
    return [];
  }
}

export async function getYouTubeRecommendations(text: string) {
  const topics = await extractTopics(text);
  const videoResults = [];

  for (const topic of topics) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(topic)}&type=video&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`YouTube API error for topic "${topic}": ${response.statusText}`);
        continue; // Skip this topic if there's an error
      }

      const data = await response.json();
      if (data.items.length > 0) {
        const video = {
          title: data.items[0].snippet.title,
          url: `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`,
          thumbnail: data.items[0].snippet.thumbnails.high.url,
        };
        videoResults.push(video);
      }
    } catch (error) {
      console.error(`Error fetching YouTube video for topic "${topic}":`, error);
    }
  }

  return { videos: videoResults };
}

export async function analyzeFile(file: File, type: 'resume' | 'syllabus') {
  await aiInitialized;
  const text = await file.text();
  let prompt;

  if (type === 'resume') {
    prompt = `Extract key skills and experience from this resume: ${text}`;
  } else {
    prompt = `Extract and explain key topics from this syllabus: ${text}`;
  }

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return { result: response.text() };
}


export async function analyzeSyllabus(text: string) {
  console.log("Starting syllabus analysis...");

  const promptText = `
  Extract and summarize the key topics from the following syllabus text:
  ${text}
  
  Provide a structured overview of different points in different lines including:
  - Key topics
  - Explanation of each topic in a few sentences in a proper manner to understand
  - Examples or applications of each topic
  - any extra information if there that might be useful
  - Prerequisites or related topics
  `;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, // Correct API endpoint
      {
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }]
          }
        ]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    // Extract AI response
    const overview = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ No response from AI.";
    console.log("AI Response:", overview);

    return { overview };
  } catch (error: any) {
    console.error("Error analyzing syllabus:", error.response?.data || error.message);
    return { overview: "❌ AI couldn't process the syllabus at this time." };
  }
}


export async function getWikipediaInfo(query: string) {
  try {
    // 1️⃣ Search for the correct Wikipedia title
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.query.search.length) {
      throw new Error(`No Wikipedia page found for "${query}"`);
    }

    // Get the first search result's title
    let pageTitle = searchData.query.search[0].title.replace(/ /g, "_");

    // 2️⃣ Fetch the summary of the found Wikipedia page
    let wikipediaUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    let response = await fetch(wikipediaUrl, { method: "GET", headers: { Accept: "application/json" } });

    if (!response.ok) {
      console.warn(`Wikipedia API error: ${response.status}, trying research papers...`);
      throw new Error("Wikipedia summary not available");
    }

    let data = await response.json();

    // 3️⃣ If no content or webpage, search for research papers on Wikipedia
    if (!data.extract || !data.content_urls?.desktop?.page) {
      console.warn("Wikipedia content unavailable, searching for research papers...");
      return await getResearchPaperInfo(query);
    }

    return {
      title: data.title || "No Title Found",
      extract: data.extract || "No content available.",
      pageUrl: data.content_urls.desktop.page || "#",
    };
  } catch (error) {
    console.error("Error fetching Wikipedia data:", error);
    return await getResearchPaperInfo(query);
  }
}

async function getResearchPaperInfo(query: string) {
  try {
    console.log("Searching for research papers related to:", query);

    // Search for academic/research-related Wikipedia pages
    const researchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query+"research_paper")}&format=json&origin=*`;
    const researchResponse = await fetch(researchUrl);
    const researchData = await researchResponse.json();

    if (!researchData.query.search.length) {
      throw new Error(`No research paper found for "${query}"`);
    }

    // Get the first research-related Wikipedia page
    let researchPageTitle = researchData.query.search[0].title.replace(/ /g, "_");

    // Fetch summary of the research paper Wikipedia page
    let wikipediaUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(researchPageTitle)}`;
    let response = await fetch(wikipediaUrl, { method: "GET", headers: { Accept: "application/json" } });

    if (!response.ok) {
      throw new Error(`Wikipedia research paper summary not found.`);
    }

    let data = await response.json();

    return {
      title: data.title || "No Title Found",
      extract: data.extract || "No content available.",
      pageUrl: data.content_urls?.desktop?.page || "#",
    };
  } catch (error) {
    console.error("Error fetching research paper data:", error);
    return {
      title: "No Research Paper Found",
      extract: "We couldn't find relevant Wikipedia content or research papers.",
      pageUrl: "#",
    };
  }
}



export async function getResearchPapers(query: string) {
  const searchUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=3`;

  try {
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error('Research paper API error');
    }

    return data.data.map((paper: any) => ({
      title: paper.title,
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
    }));
  } catch (error) {
    console.error('Error fetching research papers:', error);
    return [];
  }
}
