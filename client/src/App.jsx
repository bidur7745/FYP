import './App.css'
import Navbar from './components/Navbar'
import AdminNavbar from '../src/components/admin/AdminNavbar'
import ExpertNavbar from '../src/components/expert/ExpertNavbar'
import Home from './pages/Home'
import Login from './components/Login'
import Signup from './components/Signup'
import { LanguageProvider } from './context/LanguageContext'
import { assets } from './assets/images/assets'

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet
} from 'react-router-dom'
import Footer from './components/Footer'
import OurStory from './pages/OurStory'
import Support from './pages/Support'
import CropAdvisory from './pages/user/CropAdvisory'
import CropDetails from './pages/user/CropDetails'
import Privacypolicy from './pages/Privacypolicy'
import Term from './pages/Term'
import ProtectedRoute from './components/ProtectedRoute'
import UserDashboard from './pages/user/UserDashboard'
import Admindashboard from './pages/admin/Admindashboard'
import ExpertChats from './pages/expert/ExpertChats'
import ExpertProfile from './pages/expert/ExpertProfile'
import ExpertEarnings from './pages/expert/ExpertEarnings'
import Unauthorized from './pages/Unauthorized'
import DiseaseDetection from './pages/user/DiseaseDetection'
import DiseaseDetectionScan from './pages/user/DiseaseDetectionScan'
import VerifyWithExpert from './pages/user/VerifyWithExpert'
import WeatherDashboard from './pages/user/WeatherDashboard'
import GovernmentSchemes from './pages/user/GovernmentSchemes'
import SchemeDetails from './pages/user/SchemeDetails'
import MarketPrices from './pages/user/MarketPrices'
import PremiumSubscription from './pages/PremiumSubscription'
import PremiumSuccess from './pages/PremiumSuccess'
import SubscriptionDetails from './pages/user/SubscriptionDetails'
import UserChatsPage from './pages/user/UserChatsPage'
import AdminChatsPage from './pages/admin/AdminChatsPage'
import ChatDetailsPage from './pages/chat/ChatDetailsPage'
import AgroRecommendations from './pages/user/AgroRecommendations'
import CropRecommendation from './pages/user/CropRecommendation'

/** Expert portal layout: clears fixed navbar + mobile bottom nav */
const ExpertLayout = () => (
  <div className="min-h-screen bg-slate-50 pt-20 md:pt-20 pb-20 md:pb-8">
    <Outlet />
  </div>
)

const AuthLayout = ({ children }) => (
  <div className="relative min-h-screen pt-28 pb-16 px-4 overflow-hidden">
    <video
      className="absolute inset-0 w-full h-full object-cover"
      src={assets.backgroundVideo}
      autoPlay
      loop
      muted
      playsInline
    />
    <div className="absolute inset-0 bg-linear-to-br from-black/70 via-emerald-900/60 to-green-900/50" />
    <div className="relative max-w-5xl mx-auto flex items-start justify-center">
      {children}
    </div>
  </div>
)

const AppContent = () => {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/dashboard/admin')
  const isExpertRoute = location.pathname.startsWith('/dashboard/expert')
  const isSharedChatRoute = location.pathname.startsWith('/chat/')

  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
  const isAdminOnChat = isSharedChatRoute && userRole === 'admin'
  const isExpertOnChat = isSharedChatRoute && userRole === 'expert'

  const showAdminNav = isAdminRoute || isAdminOnChat
  const showExpertNav = isExpertRoute || isExpertOnChat
  const showMainNav = !showAdminNav && !showExpertNav

  const isChatRoute = location.pathname.startsWith('/dashboard/user/chats') || isSharedChatRoute
  const showFooter = showMainNav && !isChatRoute

  return (
    <>
      {showAdminNav && <AdminNavbar />}
      {showExpertNav && <ExpertNavbar />}
      {showMainNav && <Navbar />}
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<AuthLayout><Login /> </AuthLayout>} />
          <Route path="/signup" element={<AuthLayout> <Signup /> </AuthLayout> } />
          <Route path="/our-story" element={<OurStory/>}/>
          <Route path="/support" element={<Support/>}/>
          <Route path="/premium" element={<PremiumSubscription />} />
          <Route path="/premium/success" element={<PremiumSuccess />} />

          {/* User Routes */}
          <Route element={<ProtectedRoute allowedRoles={['user']} />}>
            <Route path="/crop-advisory" element={<CropAdvisory/>}/>
            <Route path="/crop-advisory/:cropId" element={<CropDetails/>}/>
            <Route path="/crop-advisory/:cropId/agro-recommendations" element={<AgroRecommendations/>}/>
            <Route path="/crop-recommendation" element={<CropRecommendation/>}/>
            <Route path="/weather-dashboard" element={<WeatherDashboard/>}/>
            <Route path="/market-prices" element={<MarketPrices/>}/>
            <Route path="/government-schemes" element={<GovernmentSchemes/>}/>
            <Route path="/government-schemes/:schemeId" element={<SchemeDetails/>}/>
            <Route path="/disease-detection/scan" element={<DiseaseDetectionScan/>}/>
            <Route path="/disease-detection/verify-with-expert" element={<VerifyWithExpert/>}/>
            <Route path="/dashboard/user" element={<UserDashboard />} />
            <Route path="/dashboard/user/chats" element={<UserChatsPage />} />
            <Route path="/dashboard/user/subscription" element={<SubscriptionDetails />} />
          </Route>

          {/* Chat details – accessible to all authenticated roles */}
          <Route element={<ProtectedRoute allowedRoles={['user', 'expert', 'admin']} />}>
            <Route path="/chat/details/:id" element={<ChatDetailsPage />} />
          </Route>


          <Route path="/disease-detection" element={<DiseaseDetection/>}/>
          <Route path="/privacy-policy" element={<Privacypolicy />} />
          <Route path="/terms-conditions" element={<Term />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
      {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/dashboard/admin" element={<Admindashboard />} />
            <Route path="/dashboard/admin/user-management" element={<Admindashboard />} />
            <Route path="/dashboard/admin/crops" element={<Admindashboard />} />
            <Route path="/dashboard/admin/diseases" element={<Admindashboard />} />
            <Route path="/dashboard/admin/treatments" element={<Navigate to="/dashboard/admin/diseases" replace />} />
            <Route path="/dashboard/admin/subsidy" element={<Admindashboard />} />
            <Route path="/dashboard/admin/subscriptions" element={<Admindashboard />} />
            <Route path="/dashboard/admin/queries" element={<Admindashboard />} />
            <Route path="/dashboard/admin/chats" element={<AdminChatsPage />} />
            <Route path="/dashboard/admin/admin-info" element={<Admindashboard />} />
          </Route>

      {/* Expert Routes – dedicated expert portal */}
          <Route element={<ProtectedRoute allowedRoles={['expert']} />}>
            <Route element={<ExpertLayout />}>
              <Route path="/dashboard/expert" element={<Navigate to="/dashboard/expert/profile" replace />} />
              <Route path="/dashboard/expert/chats" element={<ExpertChats />} />
              <Route path="/dashboard/expert/profile" element={<ExpertProfile />} />
              <Route path="/dashboard/expert/earnings" element={<ExpertEarnings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      {showFooter && <Footer />}
    </>
  )
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  )
}

export default App



