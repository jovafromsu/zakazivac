'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { 
  EditUserModal, 
  RoleManagerModal, 
  DeleteUserModal 
} from '@/components/AdminUserModals'
import { AccessibleToast } from '@/components/ui/AccessibleFeedback'
import { useAdminUsers, useUserOperations, type User, type Pagination } from '@/hooks/useUsers'

export default function AdminUsersPage() {
  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [verifiedFilter, setVerifiedFilter] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Optimized users hook with caching
  const { 
    users, 
    pagination, 
    loading, 
    error, 
    fetchUsers, 
    invalidateCache 
  } = useAdminUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    emailVerified: verifiedFilter || undefined,
    page: currentPage,
    limit: 20
  })
  
  // User operations hook
  const { updateUser, deleteUser, loading: actionLoading } = useUserOperations()
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])



  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'provider': return 'bg-blue-100 text-blue-800'
      case 'client': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // User management functions
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditModalOpen(true)
  }

  const handleManageRoles = (user: User) => {
    setSelectedUser(user)
    setRoleModalOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setDeleteModalOpen(true)
  }

  const handleUpdateUser = async (userId: string, userData: any) => {
    try {
      await updateUser(userId, userData)
      setSuccessMessage('User updated successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
      await fetchUsers() // Refresh the list
    } catch (error: any) {
      throw error
    }
  }

  const handleUpdateRoles = async (userId: string, roles: string[]) => {
    try {
      await updateUser(userId, { roles })
      setSuccessMessage('User roles updated successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
      await fetchUsers() // Refresh the list
    } catch (error: any) {
      throw error
    }
  }

  const handleConfirmDelete = async (userId: string) => {
    try {
      await deleteUser(userId)
      setSuccessMessage('User deleted successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
      await fetchUsers() // Refresh the list
    } catch (error: any) {
      throw error
    }
  }

  if (error && !loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <UserX className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Users</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchUsers}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Manage all user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {pagination?.total || 0} total users
          </Badge>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <AccessibleToast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage('')}
        />
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter and search users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select value={roleFilter || undefined} onValueChange={(value) => setRoleFilter(value === 'all' ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="provider">Provider</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={verifiedFilter || undefined} onValueChange={(value) => setVerifiedFilter(value === 'all' ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Email verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearch('')
                setRoleFilter('')
                setVerifiedFilter('')
                setCurrentPage(1)
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                          </h4>
                          {user.emailVerified ? (
                            <div title="Email verified">
                              <UserCheck className="h-4 w-4 text-green-500" />
                            </div>
                          ) : (
                            <div title="Email not verified">
                              <UserX className="h-4 w-4 text-red-500" />
                            </div>
                          )}
                          {user.roles.includes('admin') && (
                            <div title="Admin user">
                              <Shield className="h-4 w-4 text-red-500" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-xs text-gray-500">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            Joined {formatDate(user.createdAt)}
                          </div>
                        </div>
                        
                        {user.providerProfile && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              Provider: {user.providerProfile.businessName}
                              {!user.providerProfile.isActive && " (Inactive)"}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Roles & Actions */}
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge 
                            key={role} 
                            className={`text-xs ${getRoleColor(role)}`}
                            variant="secondary"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageRoles(user)}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Manage Roles
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} users
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                    if (page <= pagination.pages) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      )
                    }
                    return null
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pagination.pages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <EditUserModal
        user={selectedUser}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedUser(null)
        }}
        onSave={handleUpdateUser}
      />

      <RoleManagerModal
        user={selectedUser}
        isOpen={roleModalOpen}
        onClose={() => {
          setRoleModalOpen(false)
          setSelectedUser(null)
        }}
        onSave={handleUpdateRoles}
      />

      <DeleteUserModal
        user={selectedUser}
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedUser(null)
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}