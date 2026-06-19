'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, X } from 'lucide-react';

interface Friendship {
  _id: string;
  status: string;
  createdAt: string;
  otherUser: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen: string;
  };
  isRequester: boolean;
}

export default function AdminFriendships() {
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [filter, setFilter] = useState<'friends' | 'pending' | 'sent'>('friends');
  const [loading, setLoading] = useState(true);

  const fetchFriendships = async (type: 'friends' | 'pending' | 'sent') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/friends?type=${type}`);
      const data = await res.json();
      if (data.friendships) {
        setFriendships(data.friendships);
      } else {
        // demo fallback
        setFriendships(getDemoFriendships(type));
      }
    } catch (error) {
      setFriendships(getDemoFriendships(type));
    } finally {
      setLoading(false);
    }
  };

  const getDemoFriendships = (type: string): Friendship[] => {
    if (type === 'friends') {
      return [
        { _id: 'f1', status: 'accepted', createdAt: '2026-05-12', otherUser: { _id: '1', name: 'Sarah Chen', username: 'sarahc', isOnline: true, lastSeen: new Date().toISOString() }, isRequester: false },
        { _id: 'f2', status: 'accepted', createdAt: '2026-04-02', otherUser: { _id: '2', name: 'James Rivera', username: 'jrivera', isOnline: false, lastSeen: new Date(Date.now() - 1000*60*30).toISOString() }, isRequester: true },
      ];
    } else if (type === 'pending') {
      return [
        { _id: 'p1', status: 'pending', createdAt: new Date().toISOString(), otherUser: { _id: '4', name: 'Leo Torres', username: 'leot', isOnline: false, lastSeen: new Date(Date.now() - 1000*60*60*5).toISOString() }, isRequester: false },
      ];
    } else {
      return [
        { _id: 's1', status: 'pending', createdAt: new Date(Date.now() - 1000*60*60*2).toISOString(), otherUser: { _id: '5', name: 'Mia Chen', username: 'miac', isOnline: true, lastSeen: new Date().toISOString() }, isRequester: true },
      ];
    }
  };

  useEffect(() => {
    fetchFriendships(filter);
  }, [filter]);

  const acceptRequest = async (id: string) => {
    try {
      await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId: id }),
      });
      alert('Request accepted (demo)');
      fetchFriendships(filter);
    } catch (e) {
      // demo local update
      setFriendships(prev => prev.filter(f => f._id !== id));
      alert('Accepted (demo mode)');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Friendships</h1>
          <p className="text-zinc-400">Monitor friend requests and active connections</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-6">
        {(['friends', 'pending', 'sent'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 text-sm font-medium rounded-2xl transition ${filter === f ? 'bg-white text-black' : 'bg-zinc-900 hover:bg-zinc-800'}`}
          >
            {f === 'friends' && <Users className="inline mr-2" size={16} />}
            {f === 'pending' && <Clock className="inline mr-2" size={16} />}
            {f === 'sent' && <UserCheck className="inline mr-2" size={16} />}
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Connection</th>
              <th>Status</th>
              <th>Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-10 text-center text-zinc-500">Loading...</td></tr>
            ) : friendships.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-zinc-400">No {filter} found.</td></tr>
            ) : (
              friendships.map((f) => (
                <tr key={f._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium">
                        {f.otherUser.name[0]}
                      </div>
                      <div>
                        <div>{f.otherUser.name}</div>
                        <div className="text-xs text-zinc-400">@{f.otherUser.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs px-3 py-1 rounded bg-zinc-800">{f.isRequester ? 'Sent by them' : 'You sent'}</span>
                  </td>
                  <td>
                    <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${f.status === 'accepted' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="text-sm text-zinc-400">{new Date(f.createdAt).toLocaleDateString()}</td>
                  <td className="text-right space-x-2">
                    {f.status === 'pending' && !f.isRequester && (
                      <button 
                        onClick={() => acceptRequest(f._id)} 
                        className="btn btn-primary text-xs px-4 py-1.5"
                      >
                        Accept
                      </button>
                    )}
                    <button className="btn btn-secondary text-xs px-4 py-1.5">View Profile</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-zinc-500 px-1">
        Note: In full MVP, admins can also revoke friendships and block users.
      </div>
    </div>
  );
}
