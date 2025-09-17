import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'

function App() {
  console.log('App component is rendering!')
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/test" element={<div className="mt-8 text-center text-gray-500">Test Page - Routing is working!</div>} />
      </Routes>
    </div>
  )
}

export default App
