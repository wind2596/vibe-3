import { NavLink, Route, Routes } from 'react-router-dom';
import { ChatbotPage } from './pages/ChatbotPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExcelPage } from './pages/ExcelPage';
import { NewsPage } from './pages/NewsPage';
import { SchedulePage } from './pages/SchedulePage';

const navigation = [
  { to: '/', label: '대시보드' },
  { to: '/schedule', label: '스케줄' },
  { to: '/excel', label: '엑셀 자동화' },
  { to: '/chatbot', label: '민원 챗봇' },
  { to: '/news', label: '뉴스 수집' },
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-badge">Public Sector</span>
          <h1>행정업무 슈퍼앱</h1>
          <p>문서 기반 업무 구조 스캐폴드</p>
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
          FE-BE 연결은 <code>/api/health</code>를 통해 확인한다.
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
