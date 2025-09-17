import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthService, AuthState, User, LoginCredentials, RegisterData, PasswordChangeData, PasswordResetData } from '../services/auth'

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
  changePassword: (data: PasswordChangeData) => Promise<{ success: boolean; error?: string }>
  requestPasswordReset: (data: PasswordResetData) => Promise<{ success: boolean; error?: string }>
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
  clearError: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(AuthService.getAuthState())

  useEffect(() => {
    // Initialize auth service
    AuthService.initialize()

    // Subscribe to auth state changes
    const unsubscribe = AuthService.subscribe(setAuthState)

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    return await AuthService.login(credentials)
  }

  const register = async (data: RegisterData) => {
    return await AuthService.register(data)
  }

  const logout = async () => {
    await AuthService.logout()
  }

  const updateProfile = async (data: Partial<User>) => {
    return await AuthService.updateProfile(data)
  }

  const changePassword = async (data: PasswordChangeData) => {
    return await AuthService.changePassword(data)
  }

  const requestPasswordReset = async (data: PasswordResetData) => {
    return await AuthService.requestPasswordReset(data)
  }

  const resetPassword = async (token: string, newPassword: string) => {
    return await AuthService.resetPassword(token, newPassword)
  }

  const refreshUser = async () => {
    await AuthService.getCurrentUser()
  }

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }))
  }

  const hasPermission = (permission: string) => {
    return AuthService.hasPermission(permission)
  }

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    refreshUser,
    clearError,
    hasPermission
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
