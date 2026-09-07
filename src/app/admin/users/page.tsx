'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Send, 
  Radio, 
  MessageSquare, 
  AlertCircle,
  MoreVertical,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Mail,
  User as UserIcon,
  Lock,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Download,
  Eye,
  Edit3
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  isOnline: boolean;
  isVerified: boolean;
  lastSeen: string;
  bio?: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inspectUser, setInspectUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isDirectMsgOpen, setIsDirectMsgOpen] = useState(false);
  
  // Form states
  const [messageContent, setMessageContent] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', email: '', password: '', role: 'user' });
  const [editFormData, setEditFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    role: 'user' as 'user' | 'admin',
    isVerified: false,
    newPassword: '',
  });
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchUsers = async (q = '', filterRole = '', currentPage = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      let url = `/api/admin/users?q=${encodeURIComponent(q)}&page=${currentPage}&limit=10`;
      if (filterRole) url += `&role=${filterRole}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.users) {
        setUsers(data.users);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(searchQuery, roleFilter, page);
  }, [searchQuery, roleFilter, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(searchQuery, roleFilter, 1);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (res.ok) {
        setActionSuccess('Account created successfully!');
        setNewUser({ name: '', username: '', email: '', password: '', role: 'user' });
        setIsCreateOpen(false);
        fetchUsers(searchQuery, roleFilter, page);
      } else {
        setActionError(data.error || 'Failed to create account');
      }
    } catch (err) {
      setActionError('Error creating user account');
    }
  };

  const handleSendMessage = async (isBroadcast: boolean) => {
    if (!messageContent.trim()) return;
    setMsgSending(true);
    setActionError('');
    setActionSuccess('');

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isBroadcast,
          targetUserId: selectedUser?._id,
          content: messageContent,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setActionSuccess(data.message || 'Message sent successfully!');
        setMessageContent('');
        setIsBroadcastOpen(false);
        setIsDirectMsgOpen(false);
      } else {
        setActionError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setActionError('Network error while sending message');
    } finally {
      setMsgSending(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
        if (selectedUser) setSelectedUser({ ...selectedUser, role: newRole });
        setActionSuccess(`User role updated to ${newRole}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVerified: !currentStatus }),
      });

      if (res.ok) {
        setUsers(users.map((u) => (u._id === userId ? { ...u, isVerified: !currentStatus } : u)));
        if (selectedUser) setSelectedUser({ ...selectedUser, isVerified: !currentStatus });
        setActionSuccess(`Verification status updated`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (user: User) => {
    setEditUser(user);
    setEditFormData({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      bio: user.bio || '',
      role: user.role || 'user',
      isVerified: Boolean(user.isVerified),
      newPassword: '',
    });
    setActionError('');
    setActionSuccess('');
    setIsEditOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setActionError('');
    setActionSuccess('');

    try {
      const token = localStorage.getItem('adminToken');
      const payload: any = {
        name: editFormData.name,
        username: editFormData.username,
        email: editFormData.email,
        bio: editFormData.bio,
        role: editFormData.role,
        isVerified: editFormData.isVerified,
      };

      if (editFormData.newPassword && editFormData.newPassword.trim().length >= 6) {
        payload.password = editFormData.newPassword.trim();
      }

      const res = await fetch(`/api/admin/users/${editUser._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setUsers(users.map((u) => (u._id === editUser._id ? { ...u, ...data.user } : u)));
        if (inspectUser && inspectUser._id === editUser._id) {
          setInspectUser({ ...inspectUser, ...data.user });
        }
        setActionSuccess(`User "${data.user.name}" updated successfully!`);
        setIsEditOpen(false);
      } else {
        setActionError(data.error || 'Failed to update user');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error updating user');
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete account "${name}"? This action cannot be reversed.`)) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setUsers(users.filter((u) => u._id !== id));
        if (selectedUser?._id === id) setSelectedUser(null);
        if (inspectUser?._id === id) setInspectUser(null);
        if (editUser?._id === id) setIsEditOpen(false);
        setActionSuccess(data.message || 'User account permanently deleted.');
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    }
  };

  const exportUsersCSV = () => {
    if (!users || users.length === 0) {
      alert('No users found to export');
      return;
    }
    const headers = ['User ID', 'Name', 'Username', 'Email', 'Role', 'Status', 'Verified', 'Created At'];
    const rows = users.map((u) => [
      u._id,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.username || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      u.role,
      u.isOnline ? 'Online' : 'Offline',
      u.isVerified ? 'Verified' : 'Unverified',
      u.createdAt ? new Date(u.createdAt).toISOString() : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `novix_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionSuccess('Users directory exported to CSV successfully.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            User Directory & Accounts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Manage user accounts, adjust roles, verify credentials, and broadcast alerts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportUsersCSV}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs sm:text-sm font-semibold flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
            title="Export currently loaded users as CSV"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setMessageContent('');
              setActionError('');
              setIsBroadcastOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 px-4 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Radio size={16} />
            <span>Broadcast Message</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 px-4 py-2.5 rounded-xl transition shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Create Account</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-sm font-medium flex items-center justify-between animate-in fade-in">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-emerald-500 font-bold hover:text-emerald-700 dark:hover:text-emerald-300">✕</button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, username, or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-xs transition"
            />
            <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" size={18} />
          </div>
          <button
            type="submit"
            className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500 shadow-xs transition cursor-pointer"
          >
            <option value="">All Account Roles</option>
            <option value="user">Regular Users</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-left text-xs sm:text-sm min-w-[680px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 sm:px-6">User Account</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Verified</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading user accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No accounts match your search filter.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {u.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => setInspectUser(u)}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate text-left block"
                          >
                            {u.name}
                          </button>
                          <div className="text-xs text-slate-400 truncate">
                            @{u.username || 'unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        u.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {u.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleVerification(u._id, u.isVerified)}
                        className={`inline-flex items-center gap-1 text-xs font-bold cursor-pointer ${
                          u.isVerified ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Click to toggle verification status"
                      >
                        <CheckCircle size={14} className={u.isVerified ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'} />
                        <span>{u.isVerified ? 'Verified' : 'Unverified'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectUser(u)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setMessageContent('');
                            setIsDirectMsgOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                          title="Direct Message"
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button
                          onClick={() => updateUserRole(u._id, u.role === 'admin' ? 'user' : 'admin')}
                          className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition"
                          title={`Make ${u.role === 'admin' ? 'User' : 'Admin'}`}
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                          title="Edit User Details"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => deleteUser(u._id, u.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                          title="Delete Account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create Account */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New User Account</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            {actionError && (
              <div className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold mb-4 border border-red-200 dark:border-red-900/40">
                {actionError}
              </div>
            )}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="johndoe"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Account Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Broadcast Message */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio size={20} className="text-indigo-600" />
                <span>Broadcast to All Users</span>
              </h3>
              <button onClick={() => setIsBroadcastOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              This message will be pushed in real-time to all registered users via system announcement.
            </p>
            {actionError && (
              <div className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold mb-4 border border-red-200 dark:border-red-900/40">
                {actionError}
              </div>
            )}
            <div className="space-y-4">
              <textarea
                rows={4}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your official announcement here..."
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBroadcastOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendMessage(true)}
                  disabled={msgSending || !messageContent.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2"
                >
                  {msgSending ? 'Broadcasting...' : 'Send Broadcast'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Direct Message */}
      {isDirectMsgOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-600" />
                <span>Message to {selectedUser.name}</span>
              </h3>
              <button onClick={() => setIsDirectMsgOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            {actionError && (
              <div className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold mb-4 border border-red-200 dark:border-red-900/40">
                {actionError}
              </div>
            )}
            <div className="space-y-4">
              <textarea
                rows={4}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder={`Write message to @${selectedUser.username || selectedUser.email}...`}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsDirectMsgOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendMessage(false)}
                  disabled={msgSending || !messageContent.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
                >
                  {msgSending ? 'Sending...' : 'Send Direct Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Inspect User Details */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl animate-in zoom-in-95 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md">
                  {inspectUser.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {inspectUser.name}
                    {inspectUser.isVerified && <CheckCircle size={16} className="text-blue-500" />}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">@{inspectUser.username || 'unspecified'}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 font-medium block mb-1">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">{inspectUser.email}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 font-medium block mb-1">Account Role</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  inspectUser.role === 'admin' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {inspectUser.role}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 font-medium block mb-1">Presence Status</span>
                <span className={`font-semibold flex items-center gap-1.5 ${inspectUser.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${inspectUser.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {inspectUser.isOnline ? 'Online Now' : 'Offline'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 font-medium block mb-1">Registered On</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {inspectUser.createdAt ? new Date(inspectUser.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>

            {inspectUser.bio && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs">
                <span className="text-slate-400 font-medium block mb-1">User Biography</span>
                <p className="text-slate-700 dark:text-slate-300 italic">{inspectUser.bio}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setSelectedUser(inspectUser);
                  setMessageContent('');
                  setIsDirectMsgOpen(true);
                  setInspectUser(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <MessageSquare size={14} />
                <span>Send Message</span>
              </button>
              <button
                onClick={() => {
                  toggleVerification(inspectUser._id, inspectUser.isVerified);
                  setInspectUser({ ...inspectUser, isVerified: !inspectUser.isVerified });
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <CheckCircle size={14} />
                <span>{inspectUser.isVerified ? 'Revoke Verified' : 'Mark Verified'}</span>
              </button>
              <button
                onClick={() => {
                  const userToEdit = inspectUser;
                  setInspectUser(null);
                  openEditModal(userToEdit);
                }}
                className="py-2.5 px-3 rounded-xl border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Edit3 size={14} />
                <span>Edit User</span>
              </button>
              <button
                onClick={() => {
                  const id = inspectUser._id;
                  const name = inspectUser.name;
                  deleteUser(id, name);
                }}
                className="py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit User Details */}
      {isEditOpen && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit User Account</h3>
                  <p className="text-xs text-slate-400 font-medium">Modify account information and permissions</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold mb-4 border border-red-200 dark:border-red-900/40 flex items-center justify-between">
                <span>{actionError}</span>
                <button onClick={() => setActionError('')} className="text-red-500 font-bold ml-2">✕</button>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="username"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Biography / Status
                </label>
                <textarea
                  rows={2}
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  placeholder="Brief user biography..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    System Role
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'user' | 'admin' })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition font-medium"
                  >
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Verification
                  </label>
                  <label className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.isVerified}
                      onChange={(e) => setEditFormData({ ...editFormData, isVerified: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span>Verified Badge</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Reset Password <span className="text-slate-400 font-normal normal-case">(Leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={editFormData.newPassword}
                  onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                  placeholder="Enter at least 6 characters to reset"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition font-medium"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
