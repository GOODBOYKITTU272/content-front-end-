
import React, { useState } from 'react';
import { Project, Role, TaskStatus, STAGE_LABELS } from '../../types';
import { CheckCircle, Clock } from 'lucide-react';
import Layout from '../Layout';
import CeoReviewScreen from './CeoReviewScreen';
import { format } from 'date-fns';

interface Props {
  user: { id: string; full_name: string; role: Role };
  projects: Project[];
  onRefresh: () => void;
  onLogout: () => void;
}

const CeoDashboard: React.FC<Props> = ({ user, projects, onRefresh, onLogout }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

  // Logic: 
  // Pending = Projects specifically assigned to CEO (Waiting for Approval)
  // History = Projects CEO has previously acted on (in history) OR current projects not assigned to them but relevant
  const pendingApprovals = projects.filter(p => p.assigned_to_role === Role.CEO && p.status !== TaskStatus.DONE);
  
  // For history, we look for projects where CEO appears in history array
  const historyProjects = projects.filter(p => 
    p.history.some(h => h.actor_role === Role.CEO) || p.status === TaskStatus.DONE
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Stats Calculations
  const pendingCount = pendingApprovals.length;
  const approvedCount = projects.filter(p => p.status === TaskStatus.DONE).length; // Simplified for demo
  const rejectedCount = projects.filter(p => p.status === TaskStatus.REJECTED).length;

  const handleReview = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBack = () => {
    setSelectedProject(null);
    onRefresh();
  };

  if (selectedProject) {
    return (
      <CeoReviewScreen 
        project={selectedProject} 
        onBack={handleBack}
        onComplete={handleBack}
        user={user}
      />
    );
  }

  return (
    <Layout 
        user={user as any} 
        onLogout={onLogout} 
        onOpenCreate={() => {}} // CEO cannot create content
    >
      <div className="space-y-10 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2 drop-shadow-sm">Approvals</h1>
                <p className="font-bold text-lg text-slate-500">Welcome back, {user.full_name}</p>
            </div>
            
            {/* CEO has no create button - Role is purely approval */}
            <div className="hidden md:block">
                 <div className="bg-black text-white px-6 py-2 font-black uppercase border-2 border-black transform -rotate-2 shadow-[4px_4px_0px_0px_rgba(217,70,239,1)]">
                     Quality Gate Mode
                 </div>
            </div>
        </div>

        {/* Stats Cards Grid - Purely Approval Focused */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Green Card - PENDING APPROVALS */}
            <div 
                onClick={() => setActiveTab('PENDING')}
                className="bg-[#4ADE80] p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
            >
                <div className="flex justify-between items-start mb-6">
                    <h3 className="font-black uppercase text-xl text-black tracking-tight group-hover:underline decoration-2 underline-offset-4">Pending<br/>Approvals</h3>
                    <Clock className="w-8 h-8 text-black" />
                </div>
                <div className="text-7xl font-black mb-4 text-black">{pendingCount}</div>
                <div className="font-bold text-sm uppercase tracking-widest text-black opacity-80">Requires Action</div>
            </div>

            {/* Blue Card - APPROVED TOTAL */}
            <div 
                onClick={() => setActiveTab('HISTORY')}
                className="bg-[#0085FF] p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
            >
                <div className="flex justify-between items-start mb-6">
                    <h3 className="font-black uppercase text-xl text-white tracking-tight group-hover:underline decoration-2 underline-offset-4">Content<br/>Approved</h3>
                    <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="text-7xl font-black mb-4 text-white">{approvedCount}</div>
                <div className="font-bold text-sm uppercase tracking-widest text-white opacity-80">All Time</div>
            </div>

            {/* Magenta Card - REJECTION RATE (Mockup) */}
            <div 
                onClick={() => setActiveTab('HISTORY')}
                className="bg-[#D946EF] p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
            >
                <div className="flex justify-between items-start mb-6">
                    <h3 className="font-black uppercase text-xl text-white tracking-tight group-hover:underline decoration-2 underline-offset-4">Reworks</h3>
                    <div className="font-black text-2xl text-white border-2 border-white rounded-full w-8 h-8 flex items-center justify-center">!</div>
                </div>
                <div className="text-7xl font-black mb-4 text-white">{rejectedCount}</div>
                <div className="font-bold text-sm uppercase tracking-widest text-white opacity-80">Quality Control</div>
            </div>
        </div>

        {/* List Section */}
        <div className="pt-8">
            <div className="flex items-center space-x-6 mb-8 border-b-2 border-black">
                <button 
                    onClick={() => setActiveTab('PENDING')}
                    className={`text-2xl font-black uppercase pb-2 px-2 transition-all ${activeTab === 'PENDING' ? 'text-[#D946EF] border-b-4 border-[#D946EF] translate-y-[2px]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Inbox ({pendingCount})
                </button>
                <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`text-2xl font-black uppercase pb-2 px-2 transition-all ${activeTab === 'HISTORY' ? 'text-black border-b-4 border-black translate-y-[2px]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    History
                </button>
            </div>
            
            {(activeTab === 'PENDING' ? pendingApprovals : historyProjects).length > 0 ? (
                 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {(activeTab === 'PENDING' ? pendingApprovals : historyProjects).map(project => (
                    <div 
                        key={project.id}
                        onClick={() => handleReview(project)}
                        className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all group relative overflow-hidden ${project.status === TaskStatus.REJECTED ? 'bg-red-50' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <span className={`px-3 py-1 text-xs font-black uppercase border-2 border-black ${
                                project.channel === 'YOUTUBE' ? 'bg-[#FF4F4F] text-white' : 
                                project.channel === 'LINKEDIN' ? 'bg-[#0085FF] text-white' : 
                                'bg-[#D946EF] text-white'
                            }`}>
                                {project.channel}
                            </span>
                            {project.assigned_to_role === Role.CEO && (
                                <span className="absolute top-0 right-0 bg-[#4ADE80] text-black text-[10px] font-black uppercase px-3 py-1 border-l-2 border-b-2 border-black animate-pulse">
                                    Action Required
                                </span>
                            )}
                             {project.status === TaskStatus.REJECTED && (
                                <span className="absolute top-0 right-0 bg-[#FF4F4F] text-white text-[10px] font-black uppercase px-3 py-1 border-l-2 border-b-2 border-black">
                                    Rework
                                </span>
                            )}
                        </div>
                        
                        <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight uppercase truncate">
                            {project.title}
                        </h3>
                        
                        <div className="space-y-2 mt-8 border-t-2 border-slate-100 pt-4">
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-slate-400 uppercase text-xs tracking-wider">Current Stage</span>
                                <span className="font-bold text-slate-900 uppercase text-xs">{STAGE_LABELS[project.current_stage]}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-slate-400 uppercase text-xs tracking-wider">Submitted</span>
                                <span className="font-bold text-slate-900 uppercase text-xs">{format(new Date(project.created_at), 'MMM dd')}</span>
                            </div>
                        </div>
                    </div>
                    ))}
                 </div>
            ) : (
                <div className="border-2 border-dashed border-black p-16 text-center bg-[#F8FAFC]">
                    <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">
                        {activeTab === 'PENDING' ? 'All caught up!' : 'No history found.'}
                    </h3>
                    <p className="text-slate-500 font-medium">
                        {activeTab === 'PENDING' ? 'No items currently require your approval.' : 'Items you approve will appear here.'}
                    </p>
                </div>
            )}
        </div>

      </div>
    </Layout>
  );
};

export default CeoDashboard;
