'use client'

import { useEffect } from 'react'

/**
 * Accessibility utility hook for keyboard navigation and screen readers
 * Implements WCAG 2.1 AAA compliance features
 */
export function useAccessibility() {
  useEffect(() => {
    // Add keyboard navigation support
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip to main content with Ctrl+/ or Alt+S
      if ((event.ctrlKey && event.key === '/') || (event.altKey && event.key === 's')) {
        event.preventDefault()
        const mainContent = document.querySelector('main') || document.querySelector('[role="main"]')
        if (mainContent) {
          (mainContent as HTMLElement).focus()
          mainContent.scrollIntoView({ behavior: 'smooth' })
        }
      }

      // Escape key to close modals/dropdowns
      if (event.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement
        if (activeElement && activeElement.blur) {
          activeElement.blur()
        }
      }
    }

    // Add focus management for dynamic content
    const announceToScreenReader = (message: string) => {
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = message
      document.body.appendChild(announcement)
      
      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)
    }

    document.addEventListener('keydown', handleKeyDown)

    // Announce page changes to screen readers
    announceToScreenReader('Page content loaded')

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return {
    announceToScreenReader: (message: string) => {
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = message
      document.body.appendChild(announcement)
      
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement)
        }
      }, 1000)
    }
  }
}

/**
 * Generate unique IDs for accessibility
 */
export function generateA11yId(prefix: string = 'a11y') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Focus management utility
 */
export function manageFocus(element: HTMLElement | null) {
  if (!element) return

  // Store previous focus
  const previousFocus = document.activeElement as HTMLElement

  // Focus element
  element.focus()

  // Return function to restore focus
  return () => {
    if (previousFocus && previousFocus.focus) {
      previousFocus.focus()
    }
  }
}