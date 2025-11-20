'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  AccessibleModal,
  AccessibleAlert 
} from '@/components/ui/AccessibleComponents'
import { 
  User, 
  Mail, 
  Shield,
  AlertTriangle,
  Save,
  X 
} from 'lucide-react'

interface User {
  _id: string
  name: string
  email: string
  roles: string[]
  emailVerified: boolean
  createdAt: string
  providerProfile?: {
    businessName: string
    isActive: boolean
  }
}

interface EditUserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onSave: (userId: string, userData: any) => Promise<void>
}

export function EditUserModal({ user, isOpen, onClose, onSave }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    emailVerified: user?.emailVerified || false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      setError('')
      
      await onSave(user._id, {
        name: formData.name,
        email: formData.email,
        emailVerified: formData.emailVerified
      })
      
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified
      })
    }
    setError('')
    onClose()
  }

  if (!user) return null

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit User"
      description={`Update details for ${user.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <AccessibleAlert
            type="error"
            title="Update Failed"
            message={error}
            onClose={() => setError('')}
          />
        )}

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Email Verification */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <Label htmlFor="email-verified">Email Verified</Label>
                <p className="text-sm text-gray-600">
                  Whether this user has verified their email address
                </p>
              </div>
            </div>
            <Switch
              id="email-verified"
              checked={formData.emailVerified}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailVerified: checked }))}
              disabled={loading}
            />
          </div>

          {/* Current Roles (Read-only) */}
          <div className="space-y-2">
            <Label>Current Roles</Label>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                  {role === 'admin' && <Shield className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-600">
              Use "Manage Roles" to change user roles
            </p>
          </div>

          {/* User Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">User Information</p>
                <p className="text-xs text-blue-700">
                  ID: {user._id}
                </p>
                <p className="text-xs text-blue-700">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </p>
                {user.providerProfile && (
                  <p className="text-xs text-blue-700">
                    Provider: {user.providerProfile.businessName}
                    {!user.providerProfile.isActive && " (Inactive)"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </AccessibleModal>
  )
}

interface RoleManagerModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onSave: (userId: string, roles: string[]) => Promise<void>
}

export function RoleManagerModal({ user, isOpen, onClose, onSave }: RoleManagerModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availableRoles = [
    { id: 'client', name: 'Client', description: 'Can book services and manage appointments' },
    { id: 'provider', name: 'Provider', description: 'Can offer services and manage availability' },
    { id: 'admin', name: 'Administrator', description: 'Full system access and user management' }
  ]

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(r => r !== roleId)
        : [...prev, roleId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (selectedRoles.length === 0) {
      setError('User must have at least one role')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      await onSave(user._id, selectedRoles)
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to update roles')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedRoles(user?.roles || [])
    setError('')
    onClose()
  }

  if (!user) return null

  const isRemovingOwnAdmin = user._id === user._id && user.roles.includes('admin') && !selectedRoles.includes('admin')

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manage User Roles"
      description={`Configure roles for ${user.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <AccessibleAlert
            type="error"
            title="Role Update Failed"
            message={error}
            onClose={() => setError('')}
          />
        )}

        {isRemovingOwnAdmin && (
          <AccessibleAlert
            type="warning"
            title="Permission Warning"
            message="Warning: You cannot remove your own admin role"
          />
        )}

        <div className="space-y-4">
          {/* User Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label>Select Roles</Label>
            {availableRoles.map((role) => {
              const isSelected = selectedRoles.includes(role.id)
              const isCurrentAdmin = role.id === 'admin' && user.roles.includes('admin')
              
              return (
                <div 
                  key={role.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleRoleToggle(role.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-4 h-4 border rounded mt-1 flex items-center justify-center ${
                      isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-sm" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">{role.name}</p>
                        {role.id === 'admin' && <Shield className="h-4 w-4 text-red-500" />}
                        {isCurrentAdmin && (
                          <Badge variant="outline" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected Roles Preview */}
          {selectedRoles.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-2">Selected Roles:</p>
              <div className="flex flex-wrap gap-2">
                {selectedRoles.map((roleId) => {
                  const role = availableRoles.find(r => r.id === roleId)
                  return (
                    <Badge key={roleId} className="bg-green-100 text-green-800">
                      {role?.name}
                      {roleId === 'admin' && <Shield className="h-3 w-3 ml-1" />}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || selectedRoles.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Updating...' : 'Update Roles'}
          </Button>
        </div>
      </form>
    </AccessibleModal>
  )
}

interface DeleteUserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (userId: string) => Promise<void>
}

export function DeleteUserModal({ user, isOpen, onClose, onConfirm }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || confirmText !== 'DELETE') return

    try {
      setLoading(true)
      setError('')
      
      await onConfirm(user._id)
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmText('')
    setError('')
    onClose()
  }

  if (!user) return null

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete User"
      description="This action cannot be undone"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <AccessibleAlert
            type="error"
            title="Delete Failed"
            message={error}
            onClose={() => setError('')}
          />
        )}

        <div className="space-y-4">
          {/* Warning */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Permanent Deletion</p>
                <p className="text-sm text-red-700 mt-1">
                  This will permanently delete the user account and all associated data. 
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <div className="flex flex-wrap gap-1">
                {user.roles.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <code className="bg-gray-100 px-1 rounded">DELETE</code> to confirm
            </Label>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              disabled={loading}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={loading || confirmText !== 'DELETE'}
          >
            {loading ? 'Deleting...' : 'Delete User'}
          </Button>
        </div>
      </form>
    </AccessibleModal>
  )
}