import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
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
import AdGenieWorkingPage from './pages/dashboard/AdGenieWorkingPage';
import ResultsPage from './pages/dashboard/ResultsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import CampaignsPage from './pages/dashboard/CampaignsPage';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/onboarding/welcome"
              element={
                <ProtectedRoute requireNoOnboarding>
                  <WelcomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/preferences"
              element={
                <ProtectedRoute>
                  <PreferencesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/brand-details"
              element={
                <ProtectedRoute>
                  <BrandDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/visual-assets"
              element={
                <ProtectedRoute>
                  <VisualAssetsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/content-selection"
              element={
                <ProtectedRoute>
                  <ContentSelectionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/review"
              element={
                <ProtectedRoute>
                  <ReviewPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/campaign-hub"
              element={
                <ProtectedRoute requireOnboarding>
                  <CampaignHubPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/content-selection"
              element={
                <ProtectedRoute requireOnboarding>
                  <ContentSelectionDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/generating"
              element={
                <ProtectedRoute requireOnboarding>
                  <GeneratingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/ad-genie-working"
              element={
                <ProtectedRoute requireOnboarding>
                  <AdGenieWorkingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/results"
              element={
                <ProtectedRoute requireOnboarding>
                  <ResultsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute requireOnboarding>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/campaigns"
              element={
                <ProtectedRoute requireOnboarding>
                  <CampaignsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
