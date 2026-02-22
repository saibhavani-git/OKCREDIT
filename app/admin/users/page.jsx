'use client'
import React, { useEffect, useState } from 'react'

const Page = () => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [allusers, setAllusers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/allUsers');
                const res = await response.json();

                if (response.ok) {
                    setAllusers(res);
                } else {
                    setMessage(res.message || 'Something went wrong');
                }
            } catch (e) {
                setError(e.message);
            } finally {
                setTimeout(() => setLoading(false), 1000);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-gray-400">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <div className="bg-black/95 backdrop-blur-xl border-b border-gray-900/50 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 
                        className="text-3xl font-extrabold tracking-tight"
                        style={{
                            background: "linear-gradient(90deg, #888, #fff, #888)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        All Users
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">Manage all users in the system</p>
                </div>
            </div>

            {/* Error/Message Display */}
            {(error || message) && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    {error && (
                        <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-4 text-yellow-400 text-sm">
                            {message}
                        </div>
                    )}
                </div>
            )}

            {/* Users Table */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {allusers.length === 0 ? (
                    <div className="text-center py-32">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl mb-6 border border-gray-800">
                            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-200 mb-2">No users found</h3>
                        <p className="text-gray-500 text-sm">There are no users in the system</p>
                    </div>
                ) : (
                    <div className="bg-gray-950/50 rounded-xl border border-gray-800/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-900/50 border-b border-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cards</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/50">
                                    {allusers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-900/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-200">{user.username}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-300">{user.email}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                                    user.role === 'admin' 
                                                        ? 'bg-purple-900/50 text-purple-300 border border-purple-800/50' 
                                                        : 'bg-gray-800/50 text-gray-300'
                                                }`}>
                                                    {user.role || 'user'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-300">
                                                    {user.cards?.length || 0} {user.cards?.length === 1 ? 'card' : 'cards'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-xs text-gray-500 font-mono">{user._id}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Page;