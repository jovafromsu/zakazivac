import { useAccessibility } from '@/lib/accessibility'
import { useEffect, useRef } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  onClose: () => void
  autoClose?: boolean
  duration?: number
}

export function AccessibleToast({
  message,
  type = 'info',
  onClose,
  autoClose = true,
  duration = 5000
}: ToastProps) {
  const { announceToScreenReader } = useAccessibility()
  const toastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Announce toast to screen readers
    announceToScreenReader(`${type === 'error' ? 'Greška' : type === 'success' ? 'Uspeh' : 'Obaveštenje'}: ${message}`)

    // Auto close
    if (autoClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [message, type, autoClose, duration, onClose, announceToScreenReader])

  useEffect(() => {
    // Focus toast for screen readers
    if (toastRef.current) {
      toastRef.current.focus()
    }
  }, [])

  const typeConfig = {
    success: { icon: '✅', bgColor: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-400' },
    error: { icon: '❌', bgColor: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-400' },
    warning: { icon: '⚠️', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-400' },
    info: { icon: 'ℹ️', bgColor: 'bg-blue-100', textColor: 'text-blue-800', borderColor: 'border-blue-400' }
  }

  const config = typeConfig[type]

  return (
    <div
      ref={toastRef}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className={`
        fixed top-4 right-4 z-50 p-4 rounded-lg border-l-4 shadow-lg max-w-sm
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      `}
    >
      <div className="flex items-center">
        <span aria-hidden="true" className="mr-3 text-lg">
          {config.icon}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Zatvori obaveštenje"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export function AccessibleLoadingSpinner({ size = 'md', message = 'Učitavanje...' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="flex items-center justify-center space-x-2"
    >
      <div
        className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className="sr-only">{message}</span>
      {message && size !== 'sm' && (
        <span className="text-sm text-gray-600">{message}</span>
      )}
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
}

export function AccessibleProgressBar({
  value,
  max = 100,
  label = 'Napredak',
  showPercentage = true
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showPercentage && (
          <span className="text-sm text-gray-600">{percentage}%</span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${percentage} procenata`}
        className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden"
      >
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="sr-only">
        {percentage === 100 ? 'Završeno' : `${percentage} procenata završeno`}
      </span>
    </div>
  )
}

interface BreadcrumbProps {
  items: Array<{
    label: string
    href?: string
    current?: boolean
  }>
}

export function AccessibleBreadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Putanja navigacije" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm text-gray-600">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span aria-hidden="true" className="mx-2 text-gray-400">
                /
              </span>
            )}
            {item.current ? (
              <span
                aria-current="page"
                className="font-medium text-gray-900"
              >
                {item.label}
              </span>
            ) : item.href ? (
              <a
                href={item.href}
                className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
              >
                {item.label}
              </a>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white px-4 py-2 z-50 rounded-br-lg focus:outline-none"
    >
      {children}
    </a>
  )
}