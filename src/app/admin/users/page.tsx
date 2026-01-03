"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { deleteUser, toggleUserRole, createUser, resetUserPassword, editUser } from "@/lib/actions/admin";
import {
  Users,
  Shield,
  Trash2,
  Edit,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { AdminUser } from "@/types";

async function getUsers(): Promise<AdminUser[]> {
  const response = await fetch("/api/admin/users");
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

export default function UsersManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"USER" | "ADMIN">("USER");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserRole, setEditUserRole] = useState<"USER" | "ADMIN">("USER");
  const [message, setMessage] = useState("");
  
  // Search and filtering state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  
  // Calculate pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session && (session.user as any)?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session && (session.user as any)?.role === "ADMIN") {
      loadUsers();
    }
  }, [session]);

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search users
  useEffect(() => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply role filter
    if (roleFilter !== "ALL") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, roleFilter]);

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(userId);
    try {
      await deleteUser(userId);
      setMessage("User deleted successfully");
      await loadUsers();
      
      // If deleting current user's session, force logout
      if (userId === (session?.user as any)?.id) {
        window.location.href = '/login';
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (userId: string) => {
    setActionLoading(userId);
    try {
      const result = await toggleUserRole(userId);
      setMessage(result.message);
      await loadUsers();
      
      // If changing current user's role, refresh their session
      if (userId === (session?.user as any)?.id && result.needsSessionRefresh) {
        // Force session refresh
        window.location.reload();
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) return;

    setActionLoading("create");
    try {
      await createUser(newUserEmail, newUserPassword, newUserRole);
      setMessage("User created successfully");
      setShowCreateModal(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("USER");
      await loadUsers();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setActionLoading("edit");
    try {
      const updates: any = {};
      
      // Only include changed fields
      if (editUserEmail !== editingUser.email) updates.email = editUserEmail;
      if (editUserRole !== editingUser.role) updates.role = editUserRole;
      if (editUserPassword.trim()) updates.password = editUserPassword;

      if (Object.keys(updates).length === 0) {
        setMessage("No changes to save");
        return;
      }

      const result = await editUser(editingUser.id, updates);
      setMessage(result.message);
      setShowEditModal(false);
      setEditingUser(null);
      setEditUserEmail("");
      setEditUserPassword("");
      setEditUserRole("USER");
      await loadUsers();
      
      // Handle session refresh for current user
      if (result.isCurrentUser && result.needsSessionRefresh) {
        if (updates.email || updates.role) {
          // Force page reload for email/role changes
          setTimeout(() => {
            setMessage("Your account was updated. Refreshing...");
            window.location.reload();
          }, 1500);
        }
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditUserEmail(user.email);
    setEditUserRole(user.role);
    setEditUserPassword(""); // Don't pre-fill password
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-xl border ${
            message.includes("success") 
              ? "bg-green-500/10 border-green-500/30 text-green-400" 
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            <p className="font-medium">{message}</p>
            <button 
              onClick={() => setMessage("")}
              className="mt-2 text-xs underline opacity-75 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-red-400 mb-2">
              User Management
            </h1>
            <p className="text-slate-400">
              Manage user accounts, roles, and permissions.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <UserPlus size={18} />
              Add User
            </button>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 bg-[#0f1116] border border-white/10 rounded-2xl p-4">
          <div className="flex-grow relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-all ${
              showFilters || roleFilter !== "ALL"
                ? "bg-red-600/20 text-red-400 border-red-500/30" 
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
            }`}
          >
            <Filter size={18} />
            Filter
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <span className="text-slate-300 font-medium">Role:</span>
              <div className="flex gap-2">
                {["ALL", "USER", "ADMIN"].map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role as "ALL" | "USER" | "ADMIN")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      roleFilter === role
                        ? "bg-red-600 text-white" 
                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {role === "ALL" ? "All Users" : role}
                  </button>
                ))}
              </div>
              {(searchTerm || roleFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("ALL");
                  }}
                  className="ml-auto px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-600/30"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-600/20 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-bold text-white">Total Users</h3>
            </div>
            <p className="text-3xl font-black text-white">{users.length}</p>
            <p className="text-xs text-slate-500 mt-1">Registered accounts</p>
          </div>

          <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-600/20 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-bold text-white">Administrators</h3>
            </div>
            <p className="text-3xl font-black text-white">
              {users.filter(u => u.role === "ADMIN").length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Admin privileges</p>
          </div>

          <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-600/20 p-2 rounded-lg">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="font-bold text-white">Regular Users</h3>
            </div>
            <p className="text-3xl font-black text-white">
              {users.filter(u => u.role === "USER").length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Standard access</p>
          </div>

          <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-600/20 p-2 rounded-lg">
                <Search className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-white">Filtered</h3>
            </div>
            <p className="text-3xl font-black text-white">{filteredUsers.length}</p>
            <p className="text-xs text-slate-500 mt-1">Current view</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#0f1116] border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">All Users</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                </p>
              </div>
              {totalPages > 1 && (
                <div className="text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </div>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr className="text-left">
                  <th className="px-6 py-4 font-bold text-slate-300 text-sm">User</th>
                  <th className="px-6 py-4 font-bold text-slate-300 text-sm">Role</th>
                  <th className="px-6 py-4 font-bold text-slate-300 text-sm">Activity</th>
                  <th className="px-6 py-4 font-bold text-slate-300 text-sm">Joined</th>
                  <th className="px-6 py-4 font-bold text-slate-300 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          user.role === "ADMIN" 
                            ? "bg-red-600/20 text-red-400" 
                            : "bg-blue-600/20 text-blue-400"
                        }`}>
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{user.email}</p>
                          <p className="text-xs text-slate-500">ID: {user.id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        user.role === "ADMIN" 
                          ? "bg-red-600/20 text-red-400 border border-red-500/30" 
                          : "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-white font-bold">
                          {user._count.recentSeries} series
                        </p>
                        <p className="text-slate-500 text-xs">
                          {user._count.recentEpisodes} episodes
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-300">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          disabled={actionLoading === user.id}
                          className="p-2 hover:bg-indigo-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit User"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 size={16} className="text-indigo-400 animate-spin" />
                          ) : (
                            <Edit size={16} className="text-slate-400 hover:text-indigo-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleRole(user.id)}
                          disabled={actionLoading === user.id || user.id === (session?.user as any)?.id}
                          className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title={`Change to ${user.role === "ADMIN" ? "USER" : "ADMIN"}`}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 size={16} className="text-blue-400 animate-spin" />
                          ) : (
                            <Shield size={16} className="text-slate-400 hover:text-blue-400" />
                          )}
                        </button>
                        {user.id !== (session?.user as any)?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={actionLoading === user.id}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete User"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 size={16} className="text-red-400 animate-spin" />
                            ) : (
                              <Trash2 size={16} className="text-slate-400 hover:text-red-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-lg text-sm transition-all ${
                            currentPage === pageNum
                              ? "bg-red-600 text-white"
                              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-300 mb-2">No Users Found</h3>
              <p className="text-slate-500 text-sm">
                {searchTerm || roleFilter !== "ALL" 
                  ? "No users match your current search criteria." 
                  : "No users have been created yet."}
              </p>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Bulk Actions</h3>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-orange-600/20 text-orange-400 border border-orange-500/30 rounded-xl font-bold hover:bg-orange-600/30 transition-all">
              Export Users
            </button>
            <button className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl font-bold hover:bg-blue-600/30 transition-all">
              Send Notification
            </button>
            <button className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl font-bold hover:bg-red-600/30 transition-all">
              Bulk Delete
            </button>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1116] border border-white/20 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create New User</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="user@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-slate-300 font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="Enter password"
                  required
                />
              </div>
              
              <div>
                <label className="block text-slate-300 font-medium mb-2">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as "USER" | "ADMIN")}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "create"}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading === "create" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1116] border border-white/20 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Edit User</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {editingUser.id === (session?.user as any)?.id ? "Editing your own account" : `Editing ${editingUser.email}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setEditUserEmail("");
                  setEditUserPassword("");
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            {editingUser.id === (session?.user as any)?.id && (
              <div className="mb-4 p-3 bg-blue-600/10 border border-blue-500/30 rounded-xl">
                <p className="text-blue-400 text-sm font-medium flex items-center gap-2">
                  <Shield size={16} />
                  You are editing your own account. Changes will refresh your session.
                </p>
              </div>
            )}
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="user@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-slate-300 font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="Leave empty to keep current password"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty to keep current password
                </p>
              </div>
              
              <div>
                <label className="block text-slate-300 font-medium mb-2">Role</label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as "USER" | "ADMIN")}
                  disabled={editingUser.id === (session?.user as any)?.id}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {editingUser.id === (session?.user as any)?.id && (
                  <p className="text-xs text-slate-500 mt-1">
                    You cannot change your own role
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setEditUserEmail("");
                    setEditUserPassword("");
                  }}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "edit"}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading === "edit" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}