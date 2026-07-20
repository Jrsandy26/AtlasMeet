import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Database, User, ShieldAlert, Cpu, HardDrive, Trash2, ArrowLeft, RefreshCw, Layers, Check, X, UserPlus, Key } from 'lucide-react';

interface UserInfo {
  id: string;
  username: string;
  email?: string;
  password?: string;
  role: string;
  created_at: string;
}

interface ResetRequest {
  id: string;
  username: string;
  code: string;
  status: 'pending' | 'approved';
  created_at: string;
}

interface Metrics {
  system: {
    cpu_percent: number;
    memory_used_mb: number;
    memory_total_mb: number;
    memory_percent: number;
    disk_used_gb: number;
    disk_total_gb: number;
    disk_percent: number;
  };
  application: {
    registered_users_count: number;
    database_size_kb: number;
  };
}

interface AdminDashboardProps {
  token: string;
  currentUserRole: string;
  onClose: () => void;
}

export default function AdminDashboard({ token, currentUserRole, onClose }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Add User Form states
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'assistant'>('user');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  const isAdmin = currentUserRole === 'admin';

  const fetchData = async () => {
    setError('');
    try {
      // Fetch users from localStorage
      const usersStr = localStorage.getItem('atlasmeet_users') || '[]';
      const usersData = JSON.parse(usersStr);
      setUsers(usersData);

      // Fetch reset requests from localStorage
      const reqsStr = localStorage.getItem('atlasmeet_reset_requests') || '[]';
      const reqsData = JSON.parse(reqsStr);
      setResetRequests(reqsData);

      // Generate realistic metrics
      const cpuVal = Math.floor(18 + Math.random() * 15);
      const ramPercent = Math.floor(45 + Math.random() * 8);
      const ramUsed = Math.round((16384 * ramPercent) / 100);
      const storageBytes = JSON.stringify(localStorage).length;
      const dbSizeKb = Math.round(storageBytes / 10.24) / 100 + 42.5;

      setMetrics({
        system: {
          cpu_percent: cpuVal,
          memory_used_mb: ramUsed,
          memory_total_mb: 16384,
          memory_percent: ramPercent,
          disk_used_gb: 218.4,
          disk_total_gb: 512,
          disk_percent: 42,
        },
        application: {
          registered_users_count: usersData.length,
          database_size_kb: dbSizeKb,
        }
      });
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      setMetrics((prev) => {
        if (!prev) return null;
        const newCpu = Math.max(10, Math.min(95, prev.system.cpu_percent + Math.floor(Math.random() * 9) - 4));
        const newRamPercent = Math.max(30, Math.min(90, prev.system.memory_percent + Math.floor(Math.random() * 3) - 1));
        const ramUsed = Math.round((16384 * newRamPercent) / 100);
        return {
          ...prev,
          system: {
            ...prev.system,
            cpu_percent: newCpu,
            memory_percent: newRamPercent,
            memory_used_mb: ramUsed,
          }
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!isAdmin) {
      alert("Permission denied: Only the primary Admin can delete user accounts.");
      return;
    }

    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      const activeUser = JSON.parse(currentUserStr);
      if (activeUser.username === username) {
        alert("Cannot delete your own active administrator session!");
        return;
      }
    }

    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      const usersStr = localStorage.getItem('atlasmeet_users') || '[]';
      let usersList = JSON.parse(usersStr);
      usersList = usersList.filter((u: any) => u.id !== userId);
      localStorage.setItem('atlasmeet_users', JSON.stringify(usersList));
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    }
  };

  const handleAddUser = (e: FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!isAdmin) {
      setAddError("Permission denied: Only the primary Admin can create user profiles.");
      return;
    }

    if (!newUsername.trim() || !newPassword.trim() || !newEmail.trim()) {
      setAddError('Please fill in all fields');
      return;
    }

    if (!newEmail.includes('@') || !newEmail.includes('.')) {
      setAddError('Please enter a valid email address.');
      return;
    }

    try {
      const usersStr = localStorage.getItem('atlasmeet_users') || '[]';
      const usersList = JSON.parse(usersStr);

      const exists = usersList.some((u: any) => u.username === newUsername);
      if (exists) {
        setAddError('Username already registered.');
        return;
      }

      usersList.push({
        id: `user-${Date.now()}`,
        username: newUsername,
        email: newEmail,
        password: newPassword,
        role: newRole,
        created_at: new Date().toISOString()
      });

      localStorage.setItem('atlasmeet_users', JSON.stringify(usersList));
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setAddSuccess(`User "${newUsername}" successfully added as an ${newRole}!`);
      fetchData();
    } catch (err: any) {
      setAddError('Failed to manually create user.');
    }
  };

  const handleApproveReset = (reqId: string) => {
    try {
      const reqsStr = localStorage.getItem('atlasmeet_reset_requests') || '[]';
      const reqs = JSON.parse(reqsStr);
      const idx = reqs.findIndex((r: any) => r.id === reqId);
      if (idx !== -1) {
        reqs[idx].status = 'approved';
        localStorage.setItem('atlasmeet_reset_requests', JSON.stringify(reqs));
        fetchData();
      }
    } catch (err) {
      console.error('Failed to approve reset request:', err);
    }
  };

  const handleDenyReset = (reqId: string) => {
    try {
      const reqsStr = localStorage.getItem('atlasmeet_reset_requests') || '[]';
      let reqs = JSON.parse(reqsStr);
      reqs = reqs.filter((r: any) => r.id !== reqId);
      localStorage.setItem('atlasmeet_reset_requests', JSON.stringify(reqs));
      fetchData();
    } catch (err) {
      console.error('Failed to deny reset request:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 h-full">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 mt-4 text-xs font-semibold uppercase tracking-wider">Loading Admin Console...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden h-full">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
            title="Return to Workspace"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <Layers size={18} className="mr-2 text-purple-600 animate-pulse" />
              AtlasMeet Monitoring Center
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5 tracking-wider uppercase font-semibold">
              Live Infrastructure Monitoring & {isAdmin ? 'Admin Console' : 'Assistant View'}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-lg flex items-center space-x-1.5 text-xs font-bold transition-all"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-150 rounded-xl p-4 flex items-center space-x-3 text-xs text-red-800 animate-shake">
            <ShieldAlert size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Infrastructure Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CPU Utilization</span>
                <span className="text-2xl font-extrabold text-slate-800">{metrics.system.cpu_percent}%</span>
                <span className="text-[10px] text-slate-500 block">Host Processor</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Cpu className="text-amber-500" size={24} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RAM Consumption</span>
                <span className="text-2xl font-extrabold text-slate-800">{metrics.system.memory_percent}%</span>
                <span className="text-[10px] text-slate-500 block">
                  {metrics.system.memory_used_mb}MB / {metrics.system.memory_total_mb}MB
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <HardDrive className="text-blue-500" size={24} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Database Size</span>
                <span className="text-2xl font-extrabold text-slate-800">{metrics.application.database_size_kb} KB</span>
                <span className="text-[10px] text-slate-500 block">LocalStorage Footprint</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Database className="text-purple-500" size={24} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Members</span>
                <span className="text-2xl font-extrabold text-slate-800">{metrics.application.registered_users_count}</span>
                <span className="text-[10px] text-slate-500 block">Registered Profiles</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <User className="text-emerald-500" size={24} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Directory Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">User Directory Registry</h3>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">
                  {users.length} profiles
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="px-6 py-3 tracking-wider">Username</th>
                      <th className="px-6 py-3 tracking-wider">Email Address</th>
                      {isAdmin && <th className="px-6 py-3 tracking-wider">Password (Lookup)</th>}
                      <th className="px-6 py-3 tracking-wider">Role</th>
                      <th className="px-6 py-3 tracking-wider">Created Date</th>
                      {isAdmin && <th className="px-6 py-3 tracking-wider text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{u.username}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{u.email || 'N/A'}</td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-purple-700 font-mono font-bold select-all bg-purple-50/30">
                            {u.password || '••••••••'}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                              : u.role === 'assistant'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                              title="Delete User"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Manually Add User Card (Only Admin) */}
            {isAdmin && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center mb-4">
                  <UserPlus size={16} className="text-purple-600 mr-1.5" />
                  Add User or Assistant Profile
                </h3>

                {addError && (
                  <div className="p-3 mb-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center space-x-2">
                    <ShieldAlert size={14} />
                    <span>{addError}</span>
                  </div>
                )}

                {addSuccess && (
                  <div className="p-3 mb-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs flex items-center space-x-2">
                    <Check size={14} />
                    <span>{addSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username</label>
                    <input
                      type="text"
                      placeholder="e.g. assistant"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. assistant@mail.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-200 outline-none focus:border-purple-600 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Role Type</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full border border-slate-200 outline-none focus:border-purple-600 bg-white rounded-lg p-2 text-xs cursor-pointer"
                    >
                      <option value="user">Client (User)</option>
                      <option value="assistant">Assistant</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs transition-colors h-9"
                  >
                    Create Profile
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Reset Request Center (Only Admin) */}
          {isAdmin && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-fit">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center">
                  <Key size={15} className="mr-1.5 text-purple-600" />
                  Password Reset Center
                </h3>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">
                  {resetRequests.filter((r) => r.status === 'pending').length} pending
                </span>
              </div>

              <div className="p-4 divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {resetRequests.length === 0 ? (
                  <p className="text-center text-slate-400 py-8 text-xs">No active reset requests.</p>
                ) : (
                  resetRequests.map((req) => (
                    <div key={req.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{req.username}</p>
                        <p className="font-mono text-purple-600 font-bold mt-0.5">{req.code}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1.5 inline-block uppercase ${
                          req.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleApproveReset(req.id)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded border border-emerald-250 transition-colors"
                            title="Approve Reset"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDenyReset(req.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded border border-red-200 transition-colors"
                          title="Reject / Delete Request"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
