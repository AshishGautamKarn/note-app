import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MobileHomePage from './components/MobileHomePage'
import { isMobileDevice } from './services/touchGestures'

function App() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice())
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  console.log('App component is rendering!', { isMobile })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <Routes>
        <Route path="/" element={isMobile ? <MobileHomePage /> : <HomePage />} />
        <Route path="/test" element={<div className="mt-8 text-center text-gray-500">Test Page - Routing is working!</div>} />
      </Routes>
    </div>
  )
}

export default App
