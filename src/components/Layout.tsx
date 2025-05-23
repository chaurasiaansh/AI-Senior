import React, {useState} from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Bot, BookOpen, Youtube, FileText, GraduationCap, Menu, Book } from 'lucide-react';

export const Layout: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Responsive */}
      <aside
        className={`fixed inset-y-0 left-0 bg-white border-r w-64 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative md:w-64 transition-transform duration-300 ease-in-out`}
      >
        <div className="p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            AI Senior
          </h1>
          {/* Close Button for Mobile */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="p-2 space-y-1">
          {[
            { to: "/", label: "Chat", icon: <Bot className="h-5 w-5" /> },
            { to: "/wiki", label: "Research", icon: <BookOpen className="h-5 w-5" /> },
            { to: "/youtube", label: "YouTube", icon: <Youtube className="h-5 w-5" /> },
            { to: "/resume", label: "Mock", icon: <FileText className="h-5 w-5" /> },
            { to: "/book", label: "Chat with Book", icon: <Book className="h-5 w-5" /> },
            { to: "/syllabus", label: "Syllabus Analysis", icon: <GraduationCap className="h-5 w-5" /> },
            { to: "/skill", label: "Job Assistant", icon: <FileText className="h-5 w-5" /> },
          ].map((item, index) => (
            <Link
              key={index}
              to={item.to}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content with Menu Button */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 md:hidden">
          <button className="text-gray-600" onClick={() => setIsOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
};
