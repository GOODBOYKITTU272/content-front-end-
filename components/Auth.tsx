import React, { useState } from 'react';
import { Role } from '../types';
import { db } from '../services/mockDb';
import { DEMO_USERS } from '../constants';
import { Lock, ArrowRight, Layers, Zap, CheckCircle, X } from 'lucide-react';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(Role.WRITER);

  const handleLogin = () => {
    db.login(selectedRole);
    onLogin();
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
      {showLoginModal && (
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
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Enter Demo Mode</h2>
                    <p className="text-slate-500 font-medium">Select a role to simulate the workflow.</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold uppercase text-slate-700 mb-2">Select Role</label>
                        <select 
                        value={selectedRole} 
                        onChange={(e) => setSelectedRole(e.target.value as Role)}
                        className="w-full p-4 border-2 border-slate-300 rounded-none focus:border-black focus:ring-0 bg-slate-50 outline-none transition-all font-bold text-lg cursor-pointer hover:border-slate-400"
                        >
                        {DEMO_USERS.map((user) => (
                            <option key={user.id} value={user.role}>
                            {user.full_name} - {user.role}
                            </option>
                        ))}
                        </select>
                    </div>

                    <button 
                        onClick={handleLogin}
                        className="w-full bg-black hover:bg-slate-800 text-white p-4 border-2 border-black font-black uppercase flex items-center justify-center space-x-2 transition-all shadow-[6px_6px_0px_0px_rgba(100,100,100,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(100,100,100,1)] text-lg tracking-wide"
                    >
                        <span>Login to System</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    
                    <p className="text-center text-xs text-slate-400 font-medium uppercase tracking-wide">
                        Mock Authentication • No Password Required
                    </p>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default Auth;