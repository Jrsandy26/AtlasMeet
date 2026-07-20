import { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Copy, 
  Check, 
  ArrowLeft, 
  Settings, 
  Shield, 
  Trash2, 
  Activity, 
  UserPlus, 
  Layers 
} from 'lucide-react';

interface OrgDashboardProps {
  currentUser: { username: string; role: string; orgId?: string };
  onClose: () => void;
}

interface Member {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  org_code: string;
  invite_code: string;
}

export default function OrgDashboard({ currentUser, onClose }: OrgDashboardProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'invite' | 'settings'>('members');
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  
  // Invite form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);

  // Settings form states
  const [orgNameInput, setOrgNameInput] = useState('');
  const [orgDescInput, setOrgDescInput] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Fetch org details and members
  const fetchOrgData = () => {
    try {
      const orgsStr = localStorage.getItem('atlasmeet_organizations') || '[]';
      const orgs = JSON.parse(orgsStr);
      const matchedOrg = orgs.find((o: any) => o.id === currentUser.orgId);
      
      if (matchedOrg) {
        setOrg(matchedOrg);
        setOrgNameInput(matchedOrg.name);
        setOrgDescInput(matchedOrg.description || '');
      }

      const usersStr = localStorage.getItem('atlasmeet_users') || '[]';
      const users = JSON.parse(usersStr);
      const orgMembers = users.filter((u: any) => u.orgId === currentUser.orgId);
      setMembers(orgMembers);
    } catch (e) {
      console.error('Failed to load organization data:', e);
    }
  };

  useEffect(() => {
    fetchOrgData();
  }, [currentUser.orgId]);

  // Handle invite links copying
  const handleCopyLink = () => {
    if (!org) return;
    const inviteLink = `${window.location.origin}/?invite=${org.invite_code}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Invite user via company email
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus({ type: null, message: '' });
    setLoading(true);
    
    try {
      if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      
      const inviteLink = `${window.location.origin}/?invite=${org?.invite_code}`;
      
      // Dispatch invite request to local server mailer
      const res = await fetch('/api/auth/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          orgName: org?.name || 'AtlasMeet Workspace',
          inviteLink
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Email invitation dispatch failed.');
      }

      setInviteStatus({
        type: 'success',
        message: `Invitation successfully emailed to ${inviteEmail}!`
      });
      setInviteEmail('');
    } catch (err: any) {
      setInviteStatus({
        type: 'error',
        message: err.message || 'Failed to dispatch email invite.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Change user role (Admin, Member/User, Viewer)
  const handleChangeRole = (userId: string, targetRole: string) => {
    try {
      const usersStr = localStorage.getItem('atlasmeet_users') || '[]';
      const users = JSON.parse(usersStr);
      const idx = users.findIndex((u: any) => u.id === userId);
      
      if (idx !== -1) {
        users[idx].role = targetRole;
        localStorage.setItem('atlasmeet_users', JSON.stringify(users));
        fetchOrgData();
      }
    } catch (e) {
      console.error('Failed to change role:', e);
    }
  };

  // Evict member from organization
  const handleEvictMember = (userId: string) => {
    if (userId === members.find(m => m.username === currentUser.username)?.id) {
      alert('You cannot remove yourself from the organization.');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this member from the organization?')) return;
    
    try {
      const usersStr = localStorage.getItem('atlasmeet_users') || '[]';
      const users = JSON.parse(usersStr);
      const idx = users.findIndex((u: any) => u.id === userId);
      
      if (idx !== -1) {
        // Clear organization association and default back to standard user role
        delete users[idx].orgId;
        users[idx].role = 'user';
        localStorage.setItem('atlasmeet_users', JSON.stringify(users));
        fetchOrgData();
      }
    } catch (e) {
      console.error('Failed to remove member:', e);
    }
  };

  // Update Org Settings
  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess('');
    
    try {
      const orgsStr = localStorage.getItem('atlasmeet_organizations') || '[]';
      const orgs = JSON.parse(orgsStr);
      const idx = orgs.findIndex((o: any) => o.id === currentUser.orgId);
      
      if (idx !== -1) {
        orgs[idx].name = orgNameInput.trim();
        orgs[idx].description = orgDescInput.trim();
        localStorage.setItem('atlasmeet_organizations', JSON.stringify(orgs));
        setSettingsSuccess('Organization details updated successfully!');
        fetchOrgData();
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  if (!org) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-white">
        <p className="text-sm font-mono text-slate-500">Loading Organization details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col relative pb-12">
      {/* Background neon glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-950/15 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header bar */}
      <header className="border-b border-slate-900 bg-[#020617]/85 backdrop-blur-xl sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-extrabold text-sm text-slate-200 tracking-wide flex items-center">
              <Layers size={14} className="text-purple-400 mr-1.5" />
              <span>{org.name}</span>
            </h1>
            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block mt-0.5">
              Code: {org.org_code} &bull; Org Console
            </span>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex bg-slate-950/80 border border-slate-900 p-1 rounded-xl text-xs">
          <button 
            onClick={() => setActiveTab('members')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'members' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}
          >
            Members
          </button>
          <button 
            onClick={() => setActiveTab('invite')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'invite' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}
          >
            Invite
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'settings' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}
          >
            Settings
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full px-6 pt-12 flex-1 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Stats Column */}
        <div className="md:col-span-1 space-y-4">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Workspace Stats</h4>
          
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono">Total Members</span>
              <p className="text-3xl font-black text-purple-400 flex items-center">
                <Users size={22} className="mr-2 opacity-60" />
                <span>{members.length}</span>
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-950">
              <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono">Invite Code</span>
              <div className="flex items-center justify-between bg-slate-950 border border-slate-850 p-2.5 rounded-xl">
                <span className="font-mono text-xs font-bold text-slate-200 select-all">{org.invite_code}</span>
                <button 
                  onClick={handleCopyLink}
                  className="text-purple-400 hover:text-purple-300"
                  title="Copy Invite Link"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              {copiedLink && <span className="text-[9px] text-emerald-400 font-bold block">Invite link copied to clipboard!</span>}
            </div>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="md:col-span-3 space-y-6">
          
          {/* TAB: Members */}
          {activeTab === 'members' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-lg font-bold text-slate-250 flex items-center">
                <Shield size={16} className="text-purple-400 mr-2" />
                <span>Member Registry</span>
              </h3>

              <div className="bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 uppercase font-mono text-[9px]">
                      <th className="p-4">Username</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-900/20 text-slate-350">
                        <td className="p-4 font-bold text-slate-200 flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-400 font-bold flex items-center justify-center text-[9px]">
                            {member.username.substring(0, 2).toUpperCase()}
                          </span>
                          <span>{member.username}</span>
                        </td>
                        <td className="p-4">{member.email}</td>
                        <td className="p-4">
                          <select 
                            value={member.role}
                            onChange={(e) => handleChangeRole(member.id, e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-[10px] font-bold text-purple-400 rounded-lg px-2 py-1 outline-none"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleEvictMember(member.id)}
                            className="p-2 text-slate-600 hover:text-red-400 rounded-lg hover:bg-slate-900/60"
                            title="Evict Member"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Invite */}
          {activeTab === 'invite' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-200 flex items-center">
                  <UserPlus size={16} className="text-purple-400 mr-2" />
                  <span>Invite New Workspace Members</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your team member's corporate email. We will dispatch a customized verification invite link via SMTP.
                </p>
              </div>

              {inviteStatus.message && (
                <div className={`p-4 rounded-2xl border text-xs flex items-start space-x-2 ${
                  inviteStatus.type === 'success' 
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-950/20 border-red-500/20 text-red-400'
                }`}>
                  <Activity size={16} className="shrink-0 mt-0.5" />
                  <span>{inviteStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleInviteUser} className="space-y-4 bg-slate-950 border border-slate-900 p-6 rounded-3xl shadow-xl">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Company Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Mail size={16} />
                    </span>
                    <input 
                      type="email" 
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="employee@company.com"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/50"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-750 hover:to-indigo-750 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  {loading ? 'Dispatched Invitation...' : 'Send Email Invite'}
                </button>
              </form>
            </div>
          )}

          {/* TAB: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-200 flex items-center">
                  <Settings size={16} className="text-purple-400 mr-2" />
                  <span>Organization Workspace Settings</span>
                </h3>
              </div>

              {settingsSuccess && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl">
                  {settingsSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateSettings} className="space-y-4 bg-slate-950 border border-slate-900 p-6 rounded-3xl shadow-xl">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Workspace Display Name</label>
                  <input 
                    type="text" 
                    required
                    value={orgNameInput}
                    onChange={(e) => setOrgNameInput(e.target.value)}
                    placeholder="e.g. TVS TPM Excellence Team"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Description / Notes</label>
                  <textarea 
                    rows={3}
                    value={orgDescInput}
                    onChange={(e) => setOrgDescInput(e.target.value)}
                    placeholder="Workspace purpose..."
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-750 hover:to-indigo-750 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  Save Organization Settings
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
