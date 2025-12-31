import './App.css'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './components/Login'
import Signup from './components/Signup'
import { LanguageProvider } from './context/LanguageContext'
import { assets } from './assets/images/assets'

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'
import Footer from './components/Footer'


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

function App() {

  return (
    <LanguageProvider>
      <Router>
      <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<AuthLayout><Login /> </AuthLayout>} />
          <Route path="/signup" element={<AuthLayout> <Signup /> </AuthLayout> } />
          
         

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer/>
      </Router>
    </LanguageProvider>
  )
}

export default App



