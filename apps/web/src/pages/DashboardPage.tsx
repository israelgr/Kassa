import { useAuth } from '../context/AuthContext';
import { SummaryDashboard } from '../components/summary/SummaryDashboard';

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Kassa</h1>
          <div className="user-info">
            <span>Welcome, {user?.username}</span>
            <button onClick={logout} className="btn btn-secondary btn-small">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <SummaryDashboard />
      </main>

      <footer className="dashboard-footer">
        <p>
          Kassa - Viral Charity Fundraising | Spread the love, grow the impact
        </p>
      </footer>
    </div>
  );
}
