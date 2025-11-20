import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import WelcomePage from './pages/onboarding/WelcomePage';
import PreferencesPage from './pages/onboarding/PreferencesPage';
import BrandDetailsPage from './pages/onboarding/BrandDetailsPage';
import VisualAssetsPage from './pages/onboarding/VisualAssetsPage';
import ContentSelectionPage from './pages/onboarding/ContentSelectionPage';
import ReviewPage from './pages/onboarding/ReviewPage';
import CampaignHubPage from './pages/dashboard/CampaignHubPage';
import ContentSelectionDashboard from './pages/dashboard/ContentSelectionDashboard';
import GeneratingPage from './pages/dashboard/GeneratingPage';
import ResultsPage from './pages/dashboard/ResultsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/onboarding/welcome" element={<WelcomePage />} />
          <Route path="/onboarding/preferences" element={<PreferencesPage />} />
          <Route path="/onboarding/brand-details" element={<BrandDetailsPage />} />
          <Route path="/onboarding/visual-assets" element={<VisualAssetsPage />} />
          <Route path="/onboarding/content-selection" element={<ContentSelectionPage />} />
          <Route path="/onboarding/review" element={<ReviewPage />} />

          <Route path="/dashboard/campaign-hub" element={<CampaignHubPage />} />
          <Route path="/dashboard/content-selection" element={<ContentSelectionDashboard />} />
          <Route path="/dashboard/generating" element={<GeneratingPage />} />
          <Route path="/dashboard/results" element={<ResultsPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
