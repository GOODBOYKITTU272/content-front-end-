import React, { useState } from 'react';
import { Lock, ArrowRight, Layers, Zap, CheckCircle, X, Mail, Key, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';
import { db } from '../services/supabaseDb';

interface AuthProps {
    onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (email && password) {
                // Use the compatibility wrapper's login method
                // This now performs real Supabase auth
                await db.login(email, password);
                onLogin();
            }
        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err.message || 'Failed to login. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();

        if (resetEmail) {
            console.log('Password reset for:', resetEmail);
            // TODO: Replace with Supabase password reset
            alert(`Password reset link will be sent to ${resetEmail}`);
            setShowResetPassword(false);
            setResetEmail('');
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-sans bg-[#E6F8EA] text-slate-900 overflow-x-hidden">
            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center max-w-7xl mx-auto w-full">

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase flex flex-col items-center select-none">
                    <span>Content</span>
                    <span>Production</span>
                    <span className="bg-black text-white px-6 py-2 transform -rotate-2 mt-4 inline-block shadow-lg">Chaos Tamed</span>
                </h1>

                <p className="text-lg md:text-xl font-medium max-w-2xl mb-10 leading-relaxed text-slate-800">
                    The internal workflow system for high-velocity marketing teams.
                    Script, shoot, edit, approve, and publish without the mess.
                </p>

                <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto justify-center">
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className="bg-[#D946EF] border-2 border-black px-12 py-5 text-white font-black text-xl flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wide w-full sm:w-auto"
                    >
                        Start Production <ArrowRight className="ml-3 w-6 h-6" />
                    </button>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left max-w-6xl">
                    {/* Blue Card */}
                    <div className="bg-[#0085FF] border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] transition-transform">
                        <Layers className="w-12 h-12 text-white mb-6" />
                        <h3 className="text-2xl font-black text-white uppercase mb-3 tracking-tight">Multi-Channel</h3>
                        <p className="text-white font-medium text-sm leading-relaxed opacity-90">
                            Dedicated workflows for LinkedIn, YouTube, and Instagram. Tailored steps for each format.
                        </p>
                    </div>

                    {/* Green Card */}
                    <div className="bg-[#4ADE80] border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] transition-transform">
                        <Zap className="w-12 h-12 text-black mb-6" />
                        <h3 className="text-2xl font-black text-black uppercase mb-3 tracking-tight">Fast Approvals</h3>
                        <p className="text-black font-medium text-sm leading-relaxed opacity-90">
                            Streamlined CMO & CEO approval loops. No more lost emails or Slack messages.
                        </p>
                    </div>

                    {/* White Card */}
                    <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] transition-transform">
                        <CheckCircle className="w-12 h-12 text-black mb-6" />
                        <h3 className="text-2xl font-black text-black uppercase mb-3 tracking-tight">Role Based</h3>
                        <p className="text-black font-medium text-sm leading-relaxed opacity-80">
                            Clear dashboards for Writers, Editors, Designers, and Ops. Focus on your work only.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-black text-white py-12 px-6 mt-12 border-t-2 border-black">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <h2 className="text-3xl font-black tracking-tighter uppercase mb-4 md:mb-0">ApplyWizz</h2>
                    <p className="text-sm text-gray-400 font-medium">© 2025 ApplyWizz Internal Systems. All rights reserved.</p>
                </div>
            </footer>

            {/* Login Modal */}
            {showLoginModal && !showResetPassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white border-2 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md relative animate-fade-in-up">
                        <button
                            onClick={() => setShowLoginModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-600 border-2 border-black mx-auto flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Login</h2>
                            <p className="text-slate-500 font-medium">Enter your credentials to continue</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start">
                                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-700 text-sm font-medium">{error}</p>
                                </div>
                            )}

                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-bold uppercase text-slate-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@applywizz.com"
                                        required
                                        className="w-full pl-12 pr-4 py-4 border-2 border-slate-300 rounded-none focus:border-black focus:ring-0 bg-slate-50 outline-none transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-bold uppercase text-slate-700 mb-2">Password</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-12 pr-12 py-4 border-2 border-slate-300 rounded-none focus:border-black focus:ring-0 bg-slate-50 outline-none transition-all font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full bg-black hover:bg-slate-800 text-white p-4 border-2 border-black font-black uppercase flex items-center justify-center space-x-2 transition-all shadow-[6px_6px_0px_0px_rgba(100,100,100,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(100,100,100,1)] text-lg tracking-wide ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        <span>Logging in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Login</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            {/* Reset Password Link */}
                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowLoginModal(false);
                                        setShowResetPassword(true);
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-bold underline"
                                >
                                    Forgot Password? Reset Here
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white border-2 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md relative animate-fade-in-up">
                        <button
                            onClick={() => {
                                setShowResetPassword(false);
                                setResetEmail('');
                            }}
                            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-amber-500 border-2 border-black mx-auto flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <Mail className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Reset Password</h2>
                            <p className="text-slate-500 font-medium">Enter your email to receive a reset link</p>
                        </div>

                        <form onSubmit={handleResetPassword} className="space-y-6">
                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-bold uppercase text-slate-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="you@applywizz.com"
                                        required
                                        className="w-full pl-12 pr-4 py-4 border-2 border-slate-300 rounded-none focus:border-black focus:ring-0 bg-slate-50 outline-none transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Send Reset Link Button */}
                            <button
                                type="submit"
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white p-4 border-2 border-black font-black uppercase flex items-center justify-center space-x-2 transition-all shadow-[6px_6px_0px_0px_rgba(100,100,100,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(100,100,100,1)] text-lg tracking-wide"
                            >
                                <span>Send Reset Link</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>

                            {/* Back to Login */}
                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResetPassword(false);
                                        setShowLoginModal(true);
                                        setResetEmail('');
                                    }}
                                    className="text-sm text-slate-600 hover:text-slate-900 font-bold underline"
                                >
                                    Back to Login
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Auth;
