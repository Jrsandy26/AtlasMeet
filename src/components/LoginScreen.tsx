import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Lock, User, Sparkles, AlertCircle, Key, Mail, ShieldAlert, Users, ArrowRight, Check } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: { username: string; role: string; orgId?: string }) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [authScope, setAuthScope] = useState<'personal' | 'organization'>('personal');
  const [orgAction, setOrgAction] = useState<'join' | 'create'>('join');
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Check for pre-filled org invite code on mount
  useEffect(() => {
    const invite = sessionStorage.getItem('org_invite_code');
    if (invite) {
      setAuthScope('organization');
      setViewMode('register');
      setOrgAction('join');
      setOrgInviteInput(invite);
      sessionStorage.removeItem('org_invite_code');
    }
  }, []);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Organization States
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [orgInviteInput, setOrgInviteInput] = useState('');
  const [orgCodeInput, setOrgCodeInput] = useState(''); // For login

  // Forgot password with recovery code
  const [recoveryInput, setRecoveryInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA states
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [tempUser, setTempUser] = useState<any>(null);

  // Success details to display (recovery/org codes)
  const [showSuccessDetails, setShowSuccessDetails] = useState<{
    accountCode: string;
    orgName?: string;
    orgCode?: string;
    orgInvite?: string;
  } | null>(null);

  const generateRecoveryCode = () => {
    const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ATLAS-${segment()}-${segment()}-${segment()}`;
  };

  const handleVerifyOtp = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!enteredOtp.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    if (enteredOtp.trim() !== generatedOtp) {
      setError('Invalid 2FA code. Please check your inbox.');
      return;
    }

    if (tempUser) {
      const mockToken = `mock-jwt-${tempUser.id}-${Date.now()}`;
      onLoginSuccess(mockToken, { 
        username: tempUser.username, 
        role: tempUser.role,
        orgId: tempUser.orgId
      });
    }
  };

  const handleResendOtp = async () => {
    if (!tempUser || !tempUser.email) return;
    setError('');
    setLoading(true);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const emailRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tempUser.email, otp })
      });
      
      if (!emailRes.ok) {
        throw new Error('Failed to dispatch resend email.');
      }
      
      setGeneratedOtp(otp);
      setError(`New code sent to ${tempUser.email}!`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Forgot password recovery code path
    if (viewMode === 'forgot') {
      if (!username.trim() || !recoveryInput.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
        setError('Please fill in all fields');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError('Passwords do not match');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        try {
          const usersStr = localStorage.getItem('atlasmeet_users') || '[]';
          const users = JSON.parse(usersStr);

          // Find user by username or email
          const userIdx = users.findIndex((u: any) => 
            u.username.toLowerCase() === username.toLowerCase().trim() || 
            u.email.toLowerCase() === username.toLowerCase().trim()
          );

          if (userIdx === -1) {
            throw new Error('No account found matching that username or email.');
          }

          const user = users[userIdx];
          if (!user.recovery_code || user.recovery_code.toLowerCase().trim() !== recoveryInput.toLowerCase().trim()) {
            throw new Error('Invalid recovery code.');
          }

          // Upgraded password directly without admin approval
          users[userIdx].password = newPassword;
          localStorage.setItem('atlasmeet_users', JSON.stringify(users));

          setViewMode('login');
          setUsername('');
          setRecoveryInput('');
          setNewPassword('');
          setConfirmNewPassword('');
          setError('Password reset successfully! Please login.');
        } catch (err: any) {
          setError(err.message || 'Reset failed.');
        } finally {
          setLoading(false);
        }
      }, 500);
      return;
    }

    // Default Login/Register behavior
    if (viewMode === 'login') {
      if (!username.trim() || !password.trim()) {
        setError('Please fill in all fields');
        return;
      }
      if (authScope === 'organization' && !orgCodeInput.trim()) {
        setError('Please enter your Organization Code');
        return;
      }
    } else {
      // Register
      if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
        setError('Please fill in all fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (authScope === 'organization') {
        if (orgAction === 'create' && !orgName.trim()) {
          setError('Please specify Organization Name');
          return;
        }
        if (orgAction === 'join' && !orgInviteInput.trim()) {
          setError('Please specify Organization Invite Code');
          return;
        }
      } else {
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid email address');
          return;
        }
      }
    }

    setLoading(true);

    setTimeout(async () => {
      try {
        const usersStr = localStorage.getItem('atlasmeet_users') || '[]';
        const users = JSON.parse(usersStr);

        if (viewMode === 'login') {
          // Login Path
          // Check username OR email
          const user = users.find((u: any) => 
            (u.username.toLowerCase() === username.toLowerCase().trim() || 
             u.email.toLowerCase() === username.toLowerCase().trim()) && 
            u.password === password
          );

          if (!user) {
            throw new Error('Invalid username, email, or password.');
          }

          // If logging into organization scope, check org ID linkage
          if (authScope === 'organization') {
            const orgsStr = localStorage.getItem('atlasmeet_organizations') || '[]';
            const orgs = JSON.parse(orgsStr);
            const matchedOrg = orgs.find((o: any) => 
              o.org_code.toLowerCase() === orgCodeInput.toLowerCase().trim() || 
              o.id.toLowerCase() === orgCodeInput.toLowerCase().trim()
            );

            if (!matchedOrg) {
              throw new Error('Organization not found.');
            }

            if (user.orgId !== matchedOrg.id) {
              throw new Error('This user account is not linked to this organization.');
            }
          } else {
            // Personal workspace login shouldn't be locked into organization hub
            if (user.orgId) {
              // Set authScope to organization automatically so they enter org workspace
              setAuthScope('organization');
              setOrgCodeInput(user.orgId);
            }
          }

          if (!user.email) {
            throw new Error('No registered email found for this account.');
          }

          // Generate OTP
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          
          // Send email
          const emailRes = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, otp })
          });

          if (!emailRes.ok) {
            const errData = await emailRes.json().catch(() => ({}));
            throw new Error(errData.detail || '2FA Email delivery failed. Is SMTP active?');
          }

          setGeneratedOtp(otp);
          setTempUser(user);
          setOtpSent(true);
          setError(`2FA Code successfully sent to ${user.email}!`);
        } else {
          // Registration Path
          const exists = users.some((u: any) => u.username.toLowerCase() === username.toLowerCase().trim());
          if (exists) {
            throw new Error('Username already registered');
          }

          const recoveryCode = generateRecoveryCode();

          if (authScope === 'personal') {
            const newUser = {
              id: `user-${Date.now()}`,
              username,
              email,
              password,
              role: users.length === 0 ? 'admin' : 'user', // first user is global admin
              recovery_code: recoveryCode,
              created_at: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem('atlasmeet_users', JSON.stringify(users));

            setShowSuccessDetails({
              accountCode: recoveryCode
            });
          } else {
            // Organization Hub Register
            const orgsStr = localStorage.getItem('atlasmeet_organizations') || '[]';
            const orgs = JSON.parse(orgsStr);

            let targetOrgId = '';
            let targetOrgName = '';
            let targetOrgCode = '';
            let targetInviteCode = '';
            let userRole = 'user';

            if (orgAction === 'create') {
              const cleanOrgName = orgName.trim();
              const prefix = cleanOrgName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ORG');
              targetOrgId = `org-${Date.now()}`;
              targetOrgName = cleanOrgName;
              targetOrgCode = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
              targetInviteCode = `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
              userRole = 'admin'; // Creator is org admin

              orgs.push({
                id: targetOrgId,
                name: targetOrgName,
                description: orgDesc,
                org_code: targetOrgCode,
                invite_code: targetInviteCode,
                created_at: new Date().toISOString()
              });
              localStorage.setItem('atlasmeet_organizations', JSON.stringify(orgs));
            } else {
              // Joining
              const cleanInvite = orgInviteInput.trim();
              const matchedOrg = orgs.find((o: any) => o.invite_code.toLowerCase() === cleanInvite.toLowerCase());
              if (!matchedOrg) {
                throw new Error('Invalid organization invite code.');
              }
              targetOrgId = matchedOrg.id;
              targetOrgName = matchedOrg.name;
              targetOrgCode = matchedOrg.org_code;
              userRole = 'user'; // Joiner is org member
            }

            const newUser = {
              id: `user-${Date.now()}`,
              username,
              email: email.trim() || `${username}@local-org.com`, // fallback if no email is supplied
              password,
              role: userRole,
              orgId: targetOrgId,
              recovery_code: recoveryCode,
              created_at: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem('atlasmeet_users', JSON.stringify(users));

            setShowSuccessDetails({
              accountCode: recoveryCode,
              orgName: targetOrgName,
              orgCode: targetOrgCode,
              orgInvite: targetInviteCode
            });
          }
        }
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  // 1. Success Details / Recovery Code Screen
  if (showSuccessDetails) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 overflow-y-auto z-50 animate-fadeIn">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative space-y-6 text-center">
          
          <div className="w-14 h-14 bg-emerald-600/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
            <Check size={24} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-white">Registration Successful!</h2>
            <p className="text-slate-400 text-xs">Your credential registers have been successfully locked in.</p>
          </div>

          {/* Org details summary if created/joined */}
          {showSuccessDetails.orgName && (
            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl text-left space-y-2">
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block font-mono">Organization Registered</span>
              <p className="text-xs text-slate-200 font-bold">{showSuccessDetails.orgName}</p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[9px] text-slate-500">
                <div>Code: <strong className="text-slate-350">{showSuccessDetails.orgCode}</strong></div>
                {showSuccessDetails.orgInvite && (
                  <div>Invite: <strong className="text-slate-350">{showSuccessDetails.orgInvite}</strong></div>
                )}
              </div>
            </div>
          )}

          {/* Account Recovery Code Warning */}
          <div className="bg-slate-950/80 border border-purple-500/25 p-5 rounded-2xl space-y-3">
            <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block font-mono">Account Recovery Code</span>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-sm font-extrabold font-mono tracking-wider text-slate-200 select-all">{showSuccessDetails.accountCode}</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              <strong>Save this recovery code securely.</strong> You will need this code to reset your password if you ever forget it.
            </p>
          </div>

          <button
            onClick={() => {
              setShowSuccessDetails(null);
              setViewMode('login');
              setPassword('');
              setConfirmPassword('');
              setEmail('');
              setError('');
              setOrgName('');
              setOrgDesc('');
              setOrgInviteInput('');
            }}
            className="w-full py-3 bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
          >
            <span>Continue to Login</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // 2. OTP 2FA verification screen
  if (otpSent) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 overflow-y-auto z-50 animate-fadeIn">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] mb-4">
              <ShieldAlert className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-wide">2-Step Verification</h2>
            <p className="text-slate-400 text-xs mt-1.5 text-center">
              Please enter the security verification code sent to <br />
              <strong className="text-purple-400">{tempUser?.email}</strong>
            </p>
          </div>

          {error && (
            <div className={`p-3.5 mb-6 rounded-xl border flex items-start space-x-3 text-xs leading-normal animate-shake ${error.includes('successful') || error.includes('sent')
                ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400'
                : 'bg-red-950/40 border-red-900/60 text-red-400'
              }`}>
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security OTP Code</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Key size={16} />
                </span>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP code"
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-650 tracking-widest text-center font-bold"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/10 hover:shadow-purple-600/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] mt-6"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Verify & Login</span>
                  <Sparkles size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setTempUser(null);
                setEnteredOtp('');
                setError('');
              }}
              className="text-[11px] text-slate-400 hover:text-white font-semibold transition-colors outline-none"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold transition-colors outline-none"
              disabled={loading}
            >
              Resend OTP Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Normal Authentication Page
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 overflow-y-auto z-50 animate-fadeIn">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse delay-1000"></div>

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] mb-4">
            <span className="text-white font-extrabold text-xl">A</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">
            Atlas<span className="text-purple-500">Meet</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-semibold">
            {viewMode === 'login' && (authScope === 'personal' ? 'Personal Workspace Sign In' : 'Organization Hub Sign In')}
            {viewMode === 'register' && (authScope === 'personal' ? 'Create Personal Account' : 'Register Organization Member')}
            {viewMode === 'forgot' && 'Account Recovery Reset'}
          </p>
        </div>

        {/* Auth Scope selector tabs */}
        {viewMode !== 'forgot' && (
          <div className="flex bg-slate-950 p-1 rounded-2xl mb-6 border border-slate-900">
            <button
              type="button"
              onClick={() => {
                setAuthScope('personal');
                setError('');
              }}
              className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all ${
                authScope === 'personal'
                  ? 'bg-purple-650 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              Personal Workspace
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthScope('organization');
                setError('');
              }}
              className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all ${
                authScope === 'organization'
                  ? 'bg-purple-650 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              Organization Hub
            </button>
          </div>
        )}

        {/* Error/Notice Banner */}
        {error && (
          <div className={`p-3.5 mb-6 rounded-xl border flex items-start space-x-3 text-xs leading-normal animate-shake ${error.includes('successful') || error.includes('sent') || error.includes('emailed')
              ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400'
              : 'bg-red-950/40 border-red-900/60 text-red-400'
            }`}>
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Org creation or join Selector if scope === organization */}
          {authScope === 'organization' && viewMode === 'register' && (
            <div className="flex bg-slate-950 p-1 rounded-xl mb-4 border border-slate-900 animate-fadeIn">
              <button
                type="button"
                onClick={() => setOrgAction('join')}
                className={`flex-1 py-1.5 text-center rounded-lg text-[10px] font-bold uppercase transition-all ${
                  orgAction === 'join' ? 'bg-indigo-650 text-white' : 'text-slate-500'
                }`}
              >
                Join Organization
              </button>
              <button
                type="button"
                onClick={() => setOrgAction('create')}
                className={`flex-1 py-1.5 text-center rounded-lg text-[10px] font-bold uppercase transition-all ${
                  orgAction === 'create' ? 'bg-indigo-650 text-white' : 'text-slate-500'
                }`}
              >
                Create Organization
              </button>
            </div>
          )}

          {/* 1. Username or Email Input Field */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {viewMode === 'forgot' || viewMode === 'login' ? 'Username or Email' : 'Username'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={viewMode === 'forgot' || viewMode === 'login' ? 'Enter username or email' : 'Choose username'}
                className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {/* 2. Organization Code (Login only, Scope === organization) */}
          {authScope === 'organization' && viewMode === 'login' && (
            <div className="space-y-1 animate-fadeIn">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Organization Code</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Users size={16} />
                </span>
                <input
                  type="text"
                  value={orgCodeInput}
                  onChange={(e) => setOrgCodeInput(e.target.value)}
                  placeholder="e.g. TVS-TPM-2026"
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* 3. Org Invite Input (Register only, Scope === organization, Action === join) */}
          {authScope === 'organization' && viewMode === 'register' && orgAction === 'join' && (
            <div className="space-y-1 animate-fadeIn">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Organization Invite Code</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Key size={16} />
                </span>
                <input
                  type="text"
                  value={orgInviteInput}
                  onChange={(e) => setOrgInviteInput(e.target.value)}
                  placeholder="e.g. TPM-X7K9-PQ2"
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* 4. Org Name & Desc Inputs (Register only, Scope === organization, Action === create) */}
          {authScope === 'organization' && viewMode === 'register' && orgAction === 'create' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Organization Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Users size={16} />
                  </span>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. TVS TPM Excellence Team"
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
                <input
                  type="text"
                  value={orgDesc}
                  onChange={(e) => setOrgDesc(e.target.value)}
                  placeholder="Brief organization purpose (optional)"
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* 5. Personal Email Input (Register only) */}
          {viewMode === 'register' && (
            <div className="space-y-1 animate-fadeIn">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email for 2FA dispatches"
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* 6. Password Input (Login/Register only) */}
          {viewMode !== 'forgot' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                {viewMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('forgot');
                      setError('');
                    }}
                    className="text-[10px] font-bold text-purple-400 hover:underline outline-none"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* 7. Confirm Password (Register only) */}
          {viewMode === 'register' && (
            <div className="space-y-1 animate-fadeIn">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm account password"
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* 8. Recovery Reset Form Fields (Forgot Mode only) */}
          {viewMode === 'forgot' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recovery Code</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Key size={16} />
                  </span>
                  <input
                    type="text"
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value)}
                    placeholder="ATLAS-XXXX-XXXX-XXXX"
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 transition-all font-mono"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirm New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/10 hover:shadow-purple-600/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] mt-6"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {viewMode === 'login' && <span>Sign In</span>}
                {viewMode === 'register' && (
                  authScope === 'personal' 
                    ? <span>Create Account</span>
                    : (orgAction === 'create' ? <span>Create Organization</span> : <span>Join Organization</span>)
                )}
                {viewMode === 'forgot' && <span>Reset Password & Login</span>}
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Bottom Toggle switch links */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs">
          
          {viewMode === 'login' ? (
            <button
              type="button"
              onClick={() => {
                setViewMode('register');
                setError('');
              }}
              className="text-[11px] text-slate-400 hover:text-white font-semibold transition-colors outline-none"
              disabled={loading}
            >
              Don't have an account? Sign Up
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setViewMode('login');
                setError('');
              }}
              className="text-[11px] text-slate-400 hover:text-white font-semibold transition-colors outline-none"
              disabled={loading}
            >
              Already have an account? Login
            </button>
          )}

        </div>

      </div>
    </div>
  );
}
