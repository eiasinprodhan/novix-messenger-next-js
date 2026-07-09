'use client';

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Trash2, Shield, MoreHorizontal } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  bio?: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async (q = '', currentPage = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?q=${encodeURIComponent(q)}&page=${currentPage}&limit=12`);
      const data = await res.json();
      
      if (data.users) {
        setUsers(data.users);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        // Fallback demo data
        setUsers([
          { _id: '1', name: 'Sarah Chen', username: 'sarahc', email: 'sarah@novix.dev', isOnline: true, lastSeen: new Date().toISOString(), bio: 'Product designer', createdAt: '2026-02-12' },
          { _id: '2', name: 'James Rivera', username: 'jrivera', email: 'james@novix.dev', isOnline: false, lastSeen: new Date(Date.now() - 1000*60*45).toISOString(), bio: '', createdAt: '2026-02-10' },
          { _id: '3', name: 'Aisha Patel', username: 'aishap', email: 'aisha@novix.dev', isOnline: true, lastSeen: new Date().toISOString(), bio: 'Building the future', createdAt: '2026-02-08' },
        ]);
      }
    } catch (err) {
      console.error(err);
      // Demo data fallback
      setUsers([
        { _id: '1', name: 'Sarah Chen', username: 'sarahc', email: 'sarah@novix.dev', isOnline: true, lastSeen: new Date().toISOString(), bio: 'Product designer', createdAt: '2026-02-12' },
        { _id: '2', name: 'James Rivera', username: 'jrivera', email: 'james@novix.dev', isOnline: false, lastSeen: new Date(Date.now() - 1000*60*45).toISOString(), bio: '', createdAt: '2026-02-10' },
        { _id: '3', name: 'Aisha Patel', username: 'aishap', email: 'aisha@novix.dev', isOnline: true, lastSeen: new Date().toISOString(), bio: 'Building the future', createdAt: '2026-02-08' },
        { _id: '4', name: 'Leo Torres', username: 'leot', email: 'leo@novix.dev', isOnline: false, lastSeen: new Date(Date.now() - 1000*60*60*3).toISOString(), bio: '', createdAt: '2026-01-20' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(searchQuery, page);
  }, [searchQuery, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(searchQuery, 1);
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== id));
        alert('User deleted (demo: API not implemented yet)');
      } else {
        alert('Failed to delete');
      }
    } catch (err) {
      // For demo: remove locally
      setUsers(users.filter(u => u._id !== id));
      alert('User removed (demo mode)');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
          <p className="text-zinc-400">Manage all registered users • {users.length} shown</p>
        </div>
        <button 
          onClick={() => window.open('/api/auth/register', '_blank')}
          className="btn btn-primary text-sm flex items-center gap-2"
        >
          <UserPlus size={18} /> Create User (via API)
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, username, or email..."
            className="input pl-10"
          />
          <Search className="absolute left-3.5 top-3.5 text-zinc-500" size={18} />
        </div>
        <button type="submit" className="btn btn-secondary px-6">Search</button>
      </form>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Status</th>
              <th>Last Seen</th>
              <th>Joined</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No users found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-zinc-950 transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center text-lg font-semibold">
                        {user.avatar ? <img src={user.avatar} alt="" /> : user.name[0]}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-zinc-400">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-zinc-300">{user.email}</td>
                  <td>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${user.isOnline ? 'bg-emerald-900/30 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      <div className={`status-dot ${user.isOnline ? 'status-online' : 'status-offline'}`} />
                      {user.isOnline ? 'Online' : 'Offline'}
                    </div>
                  </td>
                  <td className="text-sm text-zinc-400">
                    {user.lastSeen ? new Date(user.lastSeen).toLocaleDateString() + ' ' + new Date(user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="text-xs text-zinc-400">
                    {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 hover:bg-zinc-900 transition-colors"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => deleteUser(user._id, user.name)}
                        className="p-2 rounded-lg hover:bg-red-900/20 hover:text-red-400 text-zinc-400 transition-colors"
                      >
                        <Trash2 size={15} />
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
        <div className="flex items-center justify-between mt-5 text-sm">
          <div className="text-zinc-400">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)} 
              className="btn btn-secondary px-4 disabled:opacity-40"
            >
              Previous
            </button>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)} 
              className="btn btn-secondary px-4 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedUser(null)}>
          <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-zinc-700 rounded-2xl flex items-center justify-center text-2xl font-semibold">
                  {selectedUser.name[0]}
                </div>
                <div>
                  <div className="font-semibold">{selectedUser.name}</div>
                  <div className="text-sm text-zinc-400">@{selectedUser.username}</div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-zinc-500">✕</button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs text-zinc-400">EMAIL</div>
                <div>{selectedUser.email}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">BIO</div>
                <div className="text-zinc-300">{selectedUser.bio || 'No bio set'}</div>
              </div>
              <div className="flex gap-4">
                <div>
                  <div className="text-xs text-zinc-400">STATUS</div>
                  <div className={selectedUser.isOnline ? 'text-emerald-400' : 'text-zinc-400'}>
                    {selectedUser.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">JOINED</div>
                  <div>{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="btn btn-secondary flex-1">Message as Admin</button>
              <button 
                onClick={() => deleteUser(selectedUser._id, selectedUser.name)} 
                className="btn btn-danger flex-1"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
