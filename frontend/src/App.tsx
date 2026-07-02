import { NavLink, Route, Routes } from 'react-router-dom';
import { ChatbotPage } from './pages/ChatbotPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExcelPage } from './pages/ExcelPage';
import { NewsPage } from './pages/NewsPage';
import { SchedulePage } from './pages/SchedulePage';

const navigation = [
  { to: '/', label: 'Dashboard' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/excel', label: 'Excel' },
  { to: '/chatbot', label: 'Chatbot' },
  { to: '/news', label: 'News' },
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-badge">Public Sector</span>
          <h1>Admin Super App</h1>
          <p>Simple workspace for document-driven operations</p>
        </div>

        <nav className="nav">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              end={item.to === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-note">
          FE-BE connection is checked through <code>/api/health</code>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/excel" element={<ExcelPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/news" element={<NewsPage />} />
        </Routes>
      </main>
    </div>
  );
}
