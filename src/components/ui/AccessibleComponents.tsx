'use client'

import { useState } from 'react'
import { useAccessibility, generateA11yId } from '@/lib/accessibility'

interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  description?: string
}

export function AccessibleModal({ isOpen, onClose, title, children, description }: AccessibleModalProps) {
  const { announceToScreenReader } = useAccessibility()
  const modalId = generateA11yId('modal')
  const titleId = generateA11yId('modal-title')
  const descId = generateA11yId('modal-desc')

  if (!isOpen) return null

  const handleClose = () => {
    announceToScreenReader('Modal zatvoren')
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Zatvori modal"
        >
          <span aria-hidden="true">×</span>
        </button>

        {/* Title */}
        <h2 id={titleId} className="text-xl font-bold mb-4 pr-8">
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p id={descId} className="text-gray-600 mb-4">
            {description}
          </p>
        )}

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  )
}

interface AccessibleAlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  onClose?: () => void
}

export function AccessibleAlert({ type, title, message, onClose }: AccessibleAlertProps) {
  const alertId = generateA11yId('alert')
  
  const typeStyles = {
    success: 'success-message',
    error: 'error-message',
    warning: 'warning-message',
    info: 'bg-blue-50 text-blue-800 border-blue-300'
  }

  const typeIcons = {
    success: '✓',
    error: '⚠',
    warning: '⚠',
    info: 'ℹ'
  }

  return (
    <div
      id={alertId}
      role="alert"
      aria-live="assertive"
      className={`${typeStyles[type]} flex items-start gap-3`}
    >
      <span aria-hidden="true" className="text-xl">
        {typeIcons[type]}
      </span>
      <div className="flex-1">
        <h3 className="font-bold">{title}</h3>
        <p>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto text-current opacity-70 hover:opacity-100"
          aria-label="Zatvori obaveštenje"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  )
}

interface AccessibleTabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[]
  defaultTab?: string
}

export function AccessibleTabs({ tabs, defaultTab }: AccessibleTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  const { announceToScreenReader } = useAccessibility()
  const tablistId = generateA11yId('tablist')

  const handleTabChange = (tabId: string, tabLabel: string) => {
    setActiveTab(tabId)
    announceToScreenReader(`Prebačeno na tab: ${tabLabel}`)
  }

  return (
    <div>
      {/* Tab list */}
      <div
        role="tablist"
        id={tablistId}
        aria-label="Navigacija kroz tabove"
        className="flex border-b border-gray-300"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => handleTabChange(tab.id, tab.label)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault()
                const currentIndex = tabs.findIndex(t => t.id === activeTab)
                const nextIndex = e.key === 'ArrowRight' 
                  ? (currentIndex + 1) % tabs.length
                  : currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
                handleTabChange(tabs[nextIndex].id, tabs[nextIndex].label)
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          className="py-4"
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}