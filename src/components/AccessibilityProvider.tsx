'use client'

import { useAccessibility, generateA11yId } from '@/lib/accessibility'
import { useEffect, useState } from 'react'

interface AccessibilityProviderProps {
  children: React.ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const { announceToScreenReader } = useAccessibility()
  const [highContrast, setHighContrast] = useState(false)
  const [fontSize, setFontSize] = useState('normal')

  useEffect(() => {
    // Check for user preferences
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersHighContrast) {
      setHighContrast(true)
      document.documentElement.classList.add('high-contrast')
    }

    if (prefersReducedMotion) {
      document.documentElement.classList.add('reduced-motion')
    }

    // Add accessibility toolbar
    const toolbar = createAccessibilityToolbar()
    document.body.appendChild(toolbar)

    return () => {
      if (document.body.contains(toolbar)) {
        document.body.removeChild(toolbar)
      }
    }
  }, [])

  const createAccessibilityToolbar = () => {
    const toolbar = document.createElement('div')
    toolbar.id = 'accessibility-toolbar'
    toolbar.setAttribute('aria-label', 'Alati za pristupačnost')
    toolbar.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #000;
      color: #fff;
      padding: 10px;
      border-radius: 8px;
      z-index: 9999;
      display: none;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `

    // Toggle button
    const toggleButton = document.createElement('button')
    toggleButton.textContent = '♿'
    toggleButton.setAttribute('aria-label', 'Otvori/zatvori alate za pristupačnost')
    toggleButton.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 50px;
      height: 50px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 20px;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `

    toggleButton.onclick = () => {
      const isVisible = toolbar.style.display !== 'none'
      toolbar.style.display = isVisible ? 'none' : 'flex'
      announceToScreenReader(isVisible ? 'Alati zatvoreni' : 'Alati otvoreni')
    }

    // Font size controls
    const fontControls = document.createElement('div')
    fontControls.innerHTML = `
      <label style="color: white; font-weight: bold;">Veličina teksta:</label>
      <div style="display: flex; gap: 5px;">
        <button id="font-small" style="padding: 5px; border: none; border-radius: 3px;">A-</button>
        <button id="font-normal" style="padding: 5px; border: none; border-radius: 3px;">A</button>
        <button id="font-large" style="padding: 5px; border: none; border-radius: 3px;">A+</button>
      </div>
    `

    // High contrast toggle
    const contrastToggle = document.createElement('button')
    contrastToggle.textContent = 'Visok kontrast'
    contrastToggle.style.cssText = `
      padding: 8px;
      border: 1px solid #fff;
      background: transparent;
      color: white;
      border-radius: 4px;
      cursor: pointer;
    `
    contrastToggle.onclick = () => {
      const newState = !highContrast
      setHighContrast(newState)
      document.documentElement.classList.toggle('high-contrast', newState)
      announceToScreenReader(newState ? 'Visok kontrast uključen' : 'Visok kontrast isključen')
    }

    toolbar.appendChild(fontControls)
    toolbar.appendChild(contrastToggle)
    document.body.appendChild(toggleButton)

    // Font size event listeners
    setTimeout(() => {
      document.getElementById('font-small')?.addEventListener('click', () => {
        document.documentElement.style.fontSize = '14px'
        announceToScreenReader('Tekst smanjen')
      })
      
      document.getElementById('font-normal')?.addEventListener('click', () => {
        document.documentElement.style.fontSize = '16px'
        announceToScreenReader('Normalna veličina teksta')
      })
      
      document.getElementById('font-large')?.addEventListener('click', () => {
        document.documentElement.style.fontSize = '18px'
        announceToScreenReader('Tekst povećan')
      })
    }, 100)

    return toolbar
  }

  return <>{children}</>
}

// Enhanced form components with accessibility
interface AccessibleFormProps {
  children: React.ReactNode
  onSubmit?: (e: React.FormEvent) => void
  title: string
}

export function AccessibleForm({ children, onSubmit, title }: AccessibleFormProps) {
  const formId = generateA11yId('form')
  const { announceToScreenReader } = useAccessibility()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    announceToScreenReader('Forma je poslana')
    onSubmit?.(e)
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      role="form"
      aria-labelledby={`${formId}-title`}
      noValidate
    >
      <h2 id={`${formId}-title`} className="sr-only">
        {title}
      </h2>
      {children}
    </form>
  )
}

// Accessible loading component
interface AccessibleLoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function AccessibleLoading({ message = 'Učitavanje...', size = 'md' }: AccessibleLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={`loading ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : ''}`}
    >
      <span className="sr-only">{message}</span>
      <div aria-hidden="true" className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
    </div>
  )
}