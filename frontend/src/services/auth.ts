export interface User {
  id: number
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'user' | 'guest'
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  token: string | null
  refreshToken: string | null
}

export interface PasswordResetData {
  email: string
}

export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export class AuthService {
  private static readonly TOKEN_KEY = 'note-app-token'
  private static readonly REFRESH_TOKEN_KEY = 'note-app-refresh-token'
  private static readonly USER_KEY = 'note-app-user'
  private static readonly API_BASE = 'http://localhost:8000/api/auth'

  private static listeners: ((state: AuthState) => void)[] = []
  private static authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    token: null,
    refreshToken: null
  }

  /**
   * Initialize authentication service
   */
  static async initialize(): Promise<void> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY)
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY)
      const userData = localStorage.getItem(this.USER_KEY)

      if (token && userData) {
        const user = JSON.parse(userData)
        this.authState = {
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          token,
          refreshToken
        }
        this.notifyListeners()
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      this.clearAuth()
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    this.setLoading(true)
    this.setError(null)

    try {
      const response = await fetch(`${this.API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()

      if (!response.ok) {
        this.setError(data.detail || 'Login failed')
        return { success: false, error: data.detail || 'Login failed' }
      }

      const { user, access_token, refresh_token } = data

      // Store tokens and user data
      localStorage.setItem(this.TOKEN_KEY, access_token)
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh_token)
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))

      this.authState = {
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        token: access_token,
        refreshToken: refresh_token
      }

      this.notifyListeners()
      return { success: true }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.'
      this.setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Register new user
   */
  static async register(data: RegisterData): Promise<{ success: boolean; error?: string }> {
    this.setLoading(true)
    this.setError(null)

    try {
      const response = await fetch(`${this.API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        this.setError(result.detail || 'Registration failed')
        return { success: false, error: result.detail || 'Registration failed' }
      }

      this.setLoading(false)
      return { success: true }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.'
      this.setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      const token = this.getToken()
      if (token) {
        await fetch(`${this.API_BASE}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearAuth()
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = this.authState.refreshToken
      if (!refreshToken) return false

      const response = await fetch(`${this.API_BASE}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (!response.ok) return false

      const data = await response.json()
      const { access_token } = data

      localStorage.setItem(this.TOKEN_KEY, access_token)
      this.authState.token = access_token
      this.notifyListeners()

      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getToken()
      if (!token) return null

      const response = await fetch(`${this.API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) return null

      const user = await response.json()
      this.authState.user = user
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))
      this.notifyListeners()

      return user
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(data: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      const token = this.getToken()
      if (!token) return { success: false, error: 'Not authenticated' }

      const response = await fetch(`${this.API_BASE}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.detail || 'Update failed' }
      }

      const updatedUser = await response.json()
      this.authState.user = updatedUser
      localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser))
      this.notifyListeners()

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  /**
   * Change password
   */
  static async changePassword(data: PasswordChangeData): Promise<{ success: boolean; error?: string }> {
    try {
      const token = this.getToken()
      if (!token) return { success: false, error: 'Not authenticated' }

      const response = await fetch(`${this.API_BASE}/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.detail || 'Password change failed' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(data: PasswordResetData): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.detail || 'Password reset failed' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: newPassword })
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.detail || 'Password reset failed' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  /**
   * Get current auth state
   */
  static getAuthState(): AuthState {
    return { ...this.authState }
  }

  /**
   * Get current user
   */
  static getCurrentUserSync(): User | null {
    return this.authState.user
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !!this.authState.token
  }

  /**
   * Get access token
   */
  static getToken(): string | null {
    return this.authState.token
  }

  /**
   * Subscribe to auth state changes
   */
  static subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Clear authentication data
   */
  private static clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
    localStorage.removeItem(this.USER_KEY)
    
    this.authState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      token: null,
      refreshToken: null
    }
    
    this.notifyListeners()
  }

  /**
   * Set loading state
   */
  private static setLoading(isLoading: boolean): void {
    this.authState.isLoading = isLoading
    this.notifyListeners()
  }

  /**
   * Set error state
   */
  private static setError(error: string | null): void {
    this.authState.error = error
    this.authState.isLoading = false
    this.notifyListeners()
  }

  /**
   * Notify listeners of state changes
   */
  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState))
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Check if user has permission
   */
  static hasPermission(permission: string): boolean {
    if (!this.authState.user) return false
    
    // Admin has all permissions
    if (this.authState.user.role === 'admin') return true
    
    // User permissions
    const userPermissions = {
      'user': ['read:notes', 'write:notes', 'read:folders', 'write:folders'],
      'guest': ['read:notes']
    }
    
    return userPermissions[this.authState.user.role]?.includes(permission) || false
  }

  /**
   * Get user initials for avatar
   */
  static getUserInitials(user: User): string {
    return user.name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  /**
   * Format user display name
   */
  static formatUserName(user: User): string {
    return user.name || user.email.split('@')[0]
  }
}
