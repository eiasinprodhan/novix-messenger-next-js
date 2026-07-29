'use client';

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Trash2, Shield, CheckCircle, XCircle, AlertCircle, Edit2 } from 'lucide-react';

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

  // Modals state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">User Management</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Control permissions, roles, verification status & accounts</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn bg-blue-600 hover:bg-blue-500 text-white text-sm flex items-center gap-2 px-4 py-2 rounded-xl transition font-medium"
        >
          <UserPlus size={18} /> Create Account
        </button>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/20 text-sm">
          {actionSuccess}
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
              className="input pl-10 bg-zinc-900/60 border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-500 w-full rounded-xl"
            />
            <Search className="absolute left-3.5 top-3.5 text-zinc-500" size={18} />
          </div>
          <button type="submit" className="btn bg-zinc-800 hover:bg-zinc-700 text-white px-5 rounded-xl text-sm font-medium">
            Search
          </button>
        </form>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="bg-zinc-900/60 border border-zinc-800 text-white px-4 py-2 rounded-xl text-sm focus:border-blue-500 outline-none"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-zinc-950/60 border-b border-zinc-800/80 text-zinc-400 text-xs uppercase font-medium">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Verification</th>
              <th className="p-4">Status</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">
                  Fetching users database...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">
                  No matching users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-zinc-800/30 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center text-base font-semibold text-white shrink-0">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-1.5">
                          {user.name}
                        </div>
                        <div className="text-xs text-zinc-400">@{user.username} • {user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.role === 'admin'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/40'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleVerification(user._id, user.isVerified)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition ${
                        user.isVerified
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                      }`}
                    >
                      {user.isVerified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {user.isVerified ? 'Verified' : 'Unverified'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                      <span className={`text-xs ${user.isOnline ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                        {user.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-zinc-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => deleteUser(user._id, user.name)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <div>Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white rounded-xl transition text-xs font-medium"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white rounded-xl transition text-xs font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="font-semibold text-lg text-white">Create New Account</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            {actionError && (
              <div className="bg-red-500/10 text-red-400 text-xs p-3 rounded-xl border border-red-500/20">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="input bg-zinc-950 border-zinc-800 text-white w-full rounded-xl"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="input bg-zinc-950 border-zinc-800 text-white w-full rounded-xl"
                  placeholder="johndoe"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input bg-zinc-950 border-zinc-800 text-white w-full rounded-xl"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input bg-zinc-950 border-zinc-800 text-white w-full rounded-xl"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="bg-zinc-950 border border-zinc-800 text-white w-full p-2.5 rounded-xl outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Manage Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-xl font-semibold text-white overflow-hidden">
                  {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" alt="" /> : selectedUser.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-white text-base">{selectedUser.name}</div>
                  <div className="text-xs text-zinc-400">@{selectedUser.username}</div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/50">
              <div className="flex justify-between">
                <span className="text-zinc-400">Email:</span>
                <span className="text-zinc-200 font-medium">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Current Role:</span>
                <span className="text-blue-400 uppercase font-semibold">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Verification:</span>
                <span className={selectedUser.isVerified ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                  {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Joined:</span>
                <span className="text-zinc-300">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Role Actions</div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateUserRole(selectedUser._id, 'admin')}
                  disabled={selectedUser.role === 'admin'}
                  className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-medium disabled:opacity-40"
                >
                  Make Admin
                </button>
                <button
                  onClick={() => updateUserRole(selectedUser._id, 'user')}
                  disabled={selectedUser.role === 'user'}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium disabled:opacity-40"
                >
                  Demote to User
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex gap-2">
              <button
                onClick={() => deleteUser(selectedUser._id, selectedUser.name)}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
