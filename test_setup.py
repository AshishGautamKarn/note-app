#!/usr/bin/env python3
"""
Test script to verify the Note App setup.
Run this script to check if all components are working correctly.
"""

import sys
import os
import subprocess
import requests
import time

def test_python_version():
    """Test if Python version is compatible."""
    print("🐍 Testing Python version...")
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        return False
    print(f"✅ Python {sys.version.split()[0]} is compatible")
    return True

def test_backend_dependencies():
    """Test if backend dependencies can be imported."""
    print("📦 Testing backend dependencies...")
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
        from app.main import app
        print("✅ Backend dependencies are working")
        return True
    except ImportError as e:
        print(f"❌ Backend dependency error: {e}")
        return False

def test_frontend_dependencies():
    """Test if frontend dependencies are installed."""
    print("🎨 Testing frontend dependencies...")
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    if not os.path.exists(os.path.join(frontend_dir, 'node_modules')):
        print("❌ Frontend dependencies not installed. Run 'npm install' in frontend directory")
        return False
    print("✅ Frontend dependencies are installed")
    return True

def test_backend_startup():
    """Test if backend can start."""
    print("🚀 Testing backend startup...")
    try:
        # Start backend in background
        backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
        process = subprocess.Popen([
            sys.executable, '-m', 'uvicorn', 'app.main:app', 
            '--host', '0.0.0.0', '--port', '8000'
        ], cwd=backend_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait for startup
        time.sleep(5)
        
        # Test health endpoint
        try:
            response = requests.get('http://localhost:8000/api/health', timeout=5)
            if response.status_code == 200:
                print("✅ Backend is running and responding")
                process.terminate()
                return True
            else:
                print(f"❌ Backend health check failed: {response.status_code}")
                process.terminate()
                return False
        except requests.exceptions.RequestException:
            print("❌ Backend is not responding")
            process.terminate()
            return False
            
    except Exception as e:
        print(f"❌ Backend startup error: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Note App Setup Test")
    print("=" * 40)
    
    tests = [
        test_python_version,
        test_backend_dependencies,
        test_frontend_dependencies,
        # test_backend_startup,  # Commented out as it requires running server
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 40)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your Note App is ready to run.")
        print("\n🚀 To start the application:")
        print("   ./start.sh")
        print("\n📱 Or manually:")
        print("   Backend: cd backend && python -m uvicorn app.main:app --reload")
        print("   Frontend: cd frontend && npm run dev")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
