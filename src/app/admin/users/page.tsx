'use client';

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Trash2, CheckCircle, XCircle, Send, Radio, MessageSquare, AlertCircle } from 'lucide-react';

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isDirectMsgOpen, setIsDirectMsgOpen] = useState(false);
  
  // Form states
  const [messageContent, setMessageContent] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', email: '', password: '', role: 'user' });
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
        setActionSuccess('User created successfully!');
        setNewUser({ name: '', username: '', email: '', password: '', role: 'user' });
        setIsCreateOpen(false);
        fetchUsers(searchQuery, roleFilter, page);
      } else {
        setActionError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setActionError('Error creating user');
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setUsers(users.filter((u) => u._id !== id));
        if (selectedUser?._id === id) setSelectedUser(null);
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Directory</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage accounts, send direct messages, or broadcast to all users</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMessageContent('');
              setActionError('');
              setIsBroadcastOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center gap-2 px-4 py-2.5 rounded-xl transition shadow-sm shadow-indigo-600/20"
          >
            <Radio size={18} /> Broadcast to All Users
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 px-4 py-2.5 rounded-xl transition shadow-sm shadow-blue-600/20"
          >
            <UserPlus size={18} /> Create Account
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-sm font-medium flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-emerald-500 font-bold">✕</button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, username, or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
            />
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition">
            Search
          </button>
        </form>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-blue-500 shadow-xs"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Verification</th>
              <th className="p-4">Status</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                  Fetching users database...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                  No matching users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-xl" alt="" /> : user.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {user.name}
                        </div>
                        <div className="text-xs text-slate-500">@{user.username} • {user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        user.role === 'admin'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleVerification(user._id, user.isVerified)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition border ${
                        user.isVerified
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {user.isVerified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {user.isVerified ? 'Verified' : 'Unverified'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${user.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <span className={`text-xs font-medium ${user.isOnline ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {user.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setMessageContent('');
                          setActionError('');
                          setIsDirectMsgOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold rounded-lg transition flex items-center gap-1.5"
                      >
                        <Send size={13} /> Message
                      </button>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => deleteUser(user._id, user.name)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                        title="Delete User"
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

      {/* Broadcast Message Modal */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="text-indigo-600" size={20} />
                <h3 className="font-bold text-lg text-slate-900">Broadcast Message to All</h3>
              </div>
              <button onClick={() => setIsBroadcastOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {actionError && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-200 font-medium">
                {actionError}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                This announcement will be delivered as a direct chat message to <strong>every registered user</strong> in the mobile app.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="Type your official announcement here..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={msgSending || !messageContent.trim()}
                  onClick={() => handleSendMessage(true)}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <Send size={16} /> {msgSending ? 'Sending...' : 'Broadcast Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Single User Message Modal */}
      {isDirectMsgOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-indigo-600" size={20} />
                <h3 className="font-bold text-lg text-slate-900">Message @{selectedUser.username}</h3>
              </div>
              <button onClick={() => setIsDirectMsgOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {actionError && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-200 font-medium">
                {actionError}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                  {selectedUser.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{selectedUser.name}</div>
                  <div className="text-slate-500">{selectedUser.email}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="Type your message to this user..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDirectMsgOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={msgSending || !messageContent.trim()}
                  onClick={() => handleSendMessage(false)}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <Send size={16} /> {msgSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500 font-medium">
          <div>Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 rounded-xl transition text-xs font-semibold"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 rounded-xl transition text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Create New Account</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {actionError && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-200 font-medium">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="johndoe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Manage Modal */}
      {selectedUser && !isDirectMsgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold overflow-hidden shadow-xs">
                  {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" alt="" /> : selectedUser.name[0]}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base">{selectedUser.name}</div>
                  <div className="text-xs text-slate-500">@{selectedUser.username}</div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-900 font-semibold">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role:</span>
                <span className="text-blue-600 uppercase font-bold">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification:</span>
                <span className={selectedUser.isVerified ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                  {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Joined:</span>
                <span className="text-slate-700">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Messaging & Role Actions</div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMessageContent('');
                    setActionError('');
                    setIsDirectMsgOpen(true);
                  }}
                  className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Send size={13} /> Send Direct Message
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateUserRole(selectedUser._id, 'admin')}
                  disabled={selectedUser.role === 'admin'}
                  className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold disabled:opacity-40 transition"
                >
                  Make Admin
                </button>
                <button
                  onClick={() => updateUserRole(selectedUser._id, 'user')}
                  disabled={selectedUser.role === 'user'}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold disabled:opacity-40 transition"
                >
                  Demote to User
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => deleteUser(selectedUser._id, selectedUser.name)}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Trash2 size={16} /> Permanently Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
