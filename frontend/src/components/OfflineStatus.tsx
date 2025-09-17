import React, { useState, useEffect } from 'react'
import { 
  Wifi, 
  WifiOff, 
  Sync, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  RefreshCw
} from 'lucide-react'
import { OfflineStorageService, SyncStatus } from '../services/offlineStorage'

const OfflineStatus: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(OfflineStorageService.getSyncStatus())
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Initialize offline storage
    OfflineStorageService.initialize()
    OfflineStorageService.setupNetworkListeners()

    // Subscribe to sync status changes
    const unsubscribe = OfflineStorageService.subscribeToSyncStatus(setSyncStatus)

    return () => {
      unsubscribe()
    }
  }, [])

  const handleSync = async () => {
    try {
      await OfflineStorageService.syncWithServer()
    } catch (error) {
      console.error('Manual sync failed:', error)
    }
  }

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />
    }
    
    if (syncStatus.syncInProgress) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
    }
    
    if (syncStatus.pendingItems > 0) {
      return <Clock className="h-4 w-4 text-yellow-500" />
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return 'Offline'
    }
    
    if (syncStatus.syncInProgress) {
      return 'Syncing...'
    }
    
    if (syncStatus.pendingItems > 0) {
      return `${syncStatus.pendingItems} pending`
    }
    
    return 'Synced'
  }

  const getStatusColor = () => {
    if (!syncStatus.isOnline) {
      return 'text-red-600 dark:text-red-400'
    }
    
    if (syncStatus.syncInProgress) {
      return 'text-blue-600 dark:text-blue-400'
    }
    
    if (syncStatus.pendingItems > 0) {
      return 'text-yellow-600 dark:text-yellow-400'
    }
    
    return 'text-green-600 dark:text-green-400'
  }

  const getLastSyncText = () => {
    if (!syncStatus.lastSync) {
      return 'Never synced'
    }
    
    const now = new Date()
    const lastSync = new Date(syncStatus.lastSync)
    const diffInMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours}h ago`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days}d ago`
    }
  }

  return (
    <div className="relative">
      {/* Status Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
          isExpanded 
            ? 'bg-gray-100 dark:bg-gray-700' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title={`Status: ${getStatusText()}`}
      >
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {syncStatus.pendingItems > 0 && (
          <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-full">
            {syncStatus.pendingItems}
          </span>
        )}
      </button>

      {/* Expanded Status Panel */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Sync Status
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            {/* Status Overview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Connection:</span>
                <div className="flex items-center space-x-2">
                  {syncStatus.isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${getStatusColor()}`}>
                    {syncStatus.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Sync:</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {getLastSyncText()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending Items:</span>
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {syncStatus.pendingItems}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Sync Status:</span>
                <div className="flex items-center space-x-2">
                  {syncStatus.syncInProgress ? (
                    <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                  ) : syncStatus.pendingItems > 0 ? (
                    <Clock className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-sm font-medium ${getStatusColor()}`}>
                    {syncStatus.syncInProgress ? 'Syncing...' : 
                     syncStatus.pendingItems > 0 ? 'Pending' : 'Up to date'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <button
                  onClick={handleSync}
                  disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Sync className="h-4 w-4" />
                  <span>Sync Now</span>
                </button>

                {!syncStatus.isOnline && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      You're offline. Changes will sync when you're back online.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                      <AlertCircle className="h-3 w-3" />
                      <span>Working offline</span>
                    </div>
                  </div>
                )}

                {syncStatus.pendingItems > 0 && syncStatus.isOnline && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {syncStatus.pendingItems} item(s) waiting to sync
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Offline Features Info */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Offline Features
              </h4>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div>• Create and edit notes offline</div>
                <div>• Organize notes in folders</div>
                <div>• Add tags and mark favorites</div>
                <div>• Search through offline notes</div>
                <div>• Changes sync automatically when online</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OfflineStatus
