
import React, { useState } from 'react';
import { Project, Role, TaskStatus, STAGE_LABELS, WorkflowStage } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { RotateCcw } from 'lucide-react';
import CmoReviewScreen from './CmoReviewScreen';
import CmoMyWork from './CmoMyWork';
import Layout from '../Layout';

interface Props {
    user: { full_name: string; role: Role };
    projects: Project[];
    onRefresh: () => void;
    onLogout: () => void;
}

const CmoDashboard: React.FC<Props> = ({ user, projects, onRefresh, onLogout }) => {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [tab, setTab] = useState<'PENDING' | 'ALL'>('PENDING');
    const [activeView, setActiveView] = useState<string>('dashboard');
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING_L1' | 'WITH_CEO' | 'REWORKS' | null>(null);

    // Filter Logic:
    // Pending L1 Reviews - Projects assigned to CMO for L1 review
    const pendingL1 = projects.filter(p =>
        p.assigned_to_role === Role.CMO &&
        p.current_stage === WorkflowStage.SCRIPT_REVIEW_L1 &&
        p.status !== TaskStatus.DONE
    );

    // Passed to CEO - Projects that CMO approved and sent to CEO
    const passedToCEO = projects.filter(p =>
        p.assigned_to_role === Role.CEO &&
        p.current_stage === WorkflowStage.SCRIPT_REVIEW_L2 &&
        p.status !== TaskStatus.DONE
    );

    // Reworks Requested - Projects CMO sent back for rework (currently with Writer)
    const cmoReworks = projects.filter(p =>
        p.assigned_to_role === Role.WRITER &&
        p.status === TaskStatus.REJECTED
    );

    // All CMO-related projects for the "PENDING" tab
    const pendingApprovals = pendingL1;

    const allProjects = projects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Determine which projects to display based on active filter
    const getDisplayedProjects = () => {
        if (tab === 'ALL') return allProjects;

        switch (activeFilter) {
            case 'PENDING_L1':
                return pendingL1;
            case 'WITH_CEO':
                return passedToCEO;
            case 'REWORKS':
                return cmoReworks;
            default:
                return pendingApprovals;
        }
    };

    const displayedProjects = getDisplayedProjects();

    const handleReview = (project: Project) => {
        setSelectedProject(project);
    };

    const handleBack = () => {
        setSelectedProject(null);
        onRefresh();
    };

    const handleStatCardClick = (filter: 'PENDING_L1' | 'WITH_CEO' | 'REWORKS') => {
        if (activeFilter === filter) {
            setActiveFilter(null); // Deselect if already selected
        } else {
            setActiveFilter(filter);
        }
    };

    if (selectedProject) {
        return (
            <CmoReviewScreen
                project={selectedProject}
                onBack={handleBack}
                onComplete={handleBack}
            />
        );
    }

    return (
        <Layout
            user={user as any}
            onLogout={onLogout}
            onOpenCreate={() => { }} // CMO cannot create
            activeView={activeView}
            onChangeView={setActiveView}
        >
            {activeView === 'mywork' ? (
                <CmoMyWork user={user} projects={projects} onReview={handleReview} />
            ) : (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2 drop-shadow-sm">CMO Console</h1>
                            <p className="font-bold text-lg text-slate-500">Welcome back, {user.full_name}</p>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={() => { setTab('PENDING'); setActiveFilter(null); }}
                                className={`px-6 py-3 border-2 border-black font-black uppercase transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${tab === 'PENDING' ? 'bg-[#0085FF] text-white hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-slate-50'}`}
                            >
                                Pending ({pendingApprovals.length})
                            </button>
                            <button
                                onClick={() => { setTab('ALL'); setActiveFilter(null); }}
                                className={`px-6 py-3 border-2 border-black font-black uppercase transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${tab === 'ALL' ? 'bg-black text-white hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-slate-50'}`}
                            >
                                History
                            </button>
                        </div>
                    </div>

                    {/* Stats Strip */}
                    {tab === 'PENDING' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div
                                onClick={() => handleStatCardClick('PENDING_L1')}
                                className={`cursor-pointer transition-all hover:scale-105 bg-[#4ADE80] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${activeFilter === 'PENDING_L1' ? 'ring-4 ring-black' : ''}`}
                            >
                                <div className="text-4xl font-black text-black mb-1">{pendingL1.length}</div>
                                <div className="text-sm font-bold uppercase text-black/80">Pending L1 Reviews</div>
                            </div>
                            <div
                                onClick={() => handleStatCardClick('WITH_CEO')}
                                className={`cursor-pointer transition-all hover:scale-105 bg-[#D946EF] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${activeFilter === 'WITH_CEO' ? 'ring-4 ring-black' : ''}`}
                            >
                                <div className="text-4xl font-black text-white mb-1">{passedToCEO.length}</div>
                                <div className="text-sm font-bold uppercase text-white/80">Passed to CEO</div>
                            </div>
                            <div
                                onClick={() => handleStatCardClick('REWORKS')}
                                className={`cursor-pointer transition-all hover:scale-105 bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${activeFilter === 'REWORKS' ? 'ring-4 ring-black' : ''}`}
                            >
                                <div className="text-4xl font-black text-black mb-1">{cmoReworks.length}</div>
                                <div className="text-sm font-bold uppercase text-slate-500">Reworks Requested</div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-xs font-black text-slate-400 uppercase tracking-wider">
                            <div className="col-span-5">Title</div>
                            <div className="col-span-2">Channel</div>
                            <div className="col-span-2">Stage</div>
                            <div className="col-span-2">Submitted</div>
                            <div className="col-span-1 text-right">Action</div>
                        </div>

                        <div className="space-y-4">
                            {displayedProjects.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => handleReview(p)}
                                    className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all group cursor-pointer ${p.status === TaskStatus.REJECTED ? 'bg-red-50' : ''}`}
                                >
                                    {/* Desktop Row */}
                                    <div className="hidden md:grid grid-cols-12 gap-4 items-center px-6 py-6">
                                        <div className="col-span-5">
                                            <div className="font-black text-lg text-slate-900 uppercase truncate">{p.title}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className={`px-2 py-1 text-[10px] font-black uppercase border-2 border-black ${p.channel === 'YOUTUBE' ? 'bg-[#FF4F4F] text-white' :
                                                    p.channel === 'LINKEDIN' ? 'bg-[#0085FF] text-white' :
                                                        'bg-[#D946EF] text-white'
                                                }`}>
                                                {p.channel}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-xs font-bold uppercase text-slate-500">{STAGE_LABELS[p.current_stage]}</div>
                                        <div className="col-span-2 text-xs font-bold uppercase text-slate-400">{formatDistanceToNow(new Date(p.created_at))} ago</div>
                                        <div className="col-span-1 text-right">
                                            {p.assigned_to_role === Role.CMO ? (
                                                <span className="inline-block bg-[#0085FF] text-white rounded-full p-1 border-2 border-black">
                                                    <RotateCcw className="w-4 h-4" /> {/* Icon indicating review need */}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-300 uppercase">View</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mobile Card */}
                                    <div className="md:hidden p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <span className={`px-2 py-1 text-[10px] font-black uppercase border-2 border-black ${p.channel === 'YOUTUBE' ? 'bg-[#FF4F4F] text-white' :
                                                    p.channel === 'LINKEDIN' ? 'bg-[#0085FF] text-white' :
                                                        'bg-[#D946EF] text-white'
                                                }`}>
                                                {p.channel}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">{formatDistanceToNow(new Date(p.created_at))} ago</span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase">{p.title}</h3>
                                        <div className="flex justify-between items-end border-t-2 border-slate-100 pt-4 mt-2">
                                            <div className="text-xs font-bold uppercase text-slate-500">{STAGE_LABELS[p.current_stage]}</div>
                                            {p.assigned_to_role === Role.CMO && (
                                                <button className="bg-[#0085FF] text-white px-4 py-2 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Review</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {displayedProjects.length === 0 && (
                                <div className="border-2 border-dashed border-black p-12 text-center bg-slate-50">
                                    <h3 className="text-xl font-black uppercase text-slate-400">All caught up</h3>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CmoDashboard;
