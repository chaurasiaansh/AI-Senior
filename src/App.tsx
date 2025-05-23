// import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Chat } from './pages/Chat';
import YouTubeSearch from './pages/Youtube';
import WikipediaSearch from './pages/WikipediaSearch';
import SyllabusAnalyzer from './pages/SyllabusAnalyzer';
import ResumeUploader from './pages/Resume';
import BookChat from './pages/Bookchat';
import SkillExtractor from './pages/jobfinder';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Chat />} />
          {/* Other routes will be added later */}
          <Route path="*" element={<Chat />} />
          <Route path="/youtube" element={<YouTubeSearch/>}/>
          <Route path="/wiki" element={<WikipediaSearch/>}/>
          <Route path="/syllabus" element={<SyllabusAnalyzer />}/>
          <Route path="/resume" element={<ResumeUploader />}/>
          <Route path="/book" element={<BookChat />}/>
          <Route path="/skill" element={<SkillExtractor />}/>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;