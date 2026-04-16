"use client"

import { useEffect } from 'react'
import { useNotifications } from '../contexts/NotificationContext'

/**
 * This component polls localStorage for new booking notifications
 * and adds them to the notification context
 */
export function NotificationPoller() {
  const { addNotification } = useNotifications()

  useEffect(() => {
    const checkForNewNotifications = () => {
      const pendingNotifications = localStorage.getItem('pendingNotifications')
      if (pendingNotifications) {
        try {
          const notifications = JSON.parse(pendingNotifications)
          if (Array.isArray(notifications) && notifications.length > 0) {
            // Add each notification to the context
            notifications.forEach((notif: any) => {
              addNotification({
                type: notif.type || 'booking',
                title: notif.title || 'New Notification',
                message: notif.message || '',
                clientName: notif.clientName,
                accommodationType: notif.accommodationType,
                totalPrice: notif.totalPrice
              })
            })
            
            // Clear the pending notifications
            localStorage.removeItem('pendingNotifications')
          }
        } catch (error) {
          console.error('Error processing notifications:', error)
        }
      }
    }

    // Check immediately on mount
    checkForNewNotifications()

    // Poll every 5 seconds for new notifications
    const interval = setInterval(checkForNewNotifications, 5000)

    return () => clearInterval(interval)
  }, [addNotification])

  return null // This component doesn't render anything
}
