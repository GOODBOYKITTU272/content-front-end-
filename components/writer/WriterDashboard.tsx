
import React, { useState } from 'react';
import { Project, Role, TaskStatus, STAGE_LABELS } from '../../types';
import { Plus, Clock } from 'lucide-react';
import CreateScript from './CreateScript';
import WriterProjectDetail from './WriterProjectDetail';
import WriterMyWork from './WriterMyWork';
import WriterCalendar from './WriterCalendar';
import { formatDistanceToNow } from 'date-fns';
import Layout from '../Layout';

interface Props {
    user: { full_name: string; role: Role };
    projects: Project[];
    onRefresh: () => void;
    onLogout: () => void;
}

const WriterDashboard: React.FC<Props> = ({ user, projects, onRefresh, onLogout }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [viewingProject, setViewingProject] = useState<Project | null>(null);
    const [activeView, setActiveView] = useState<string>('dashboard');

    // Categorize Projects
    const drafts = projects.filter(p => p.assigned_to_role === Role.WRITER && (p.status === TaskStatus.TODO || p.status === TaskStatus.IN_PROGRESS || p.status === TaskStatus.REJECTED));
    const inReview = projects.filter(p => p.assigned_to_role === Role.CMO || p.assigned_to_role === Role.CEO);
    const inProduction = projects.filter(p => !drafts.includes(p) && !inReview.includes(p) && p.status !== TaskStatus.DONE);

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setIsCreating(true);
    };

    const handleCloseCreate = () => {
        setIsCreating(false);
        setEditingProject(null);
        onRefresh();
    };

    const handleViewProject = (project: Project) => {
        setViewingProject(project);
    };

    const handleCloseDetail = () => {
        setViewingProject(null);
        onRefresh();
    };

    if (viewingProject) {
        return <WriterProjectDetail project={viewingProject} onBack={handleCloseDetail} />;
    }

    if (isCreating) {
        return <CreateScript project={editingProject || undefined} onClose={handleCloseCreate} onSuccess={handleCloseCreate} />;
    }

    return (
        <Layout
            user={user as any}
            onLogout={onLogout}
            onOpenCreate={() => setIsCreating(true)}
            activeView={activeView}
            onChangeView={setActiveView}
        >
            {activeView === 'mywork' && <WriterMyWork user={user} projects={projects} />}
            {activeView === 'calendar' && <WriterCalendar projects={projects} />}
            {activeView === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2 drop-shadow-sm">Writer Studio</h1>
                            <p className="font-bold text-base sm:text-lg text-slate-500">Welcome back, {user.full_name}</p>
                        </div>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full sm:w-auto bg-[#D946EF] text-white border-2 border-black px-6 py-4 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center space-x-2"
                        >
                            <Plus className="w-6 h-6 border-2 border-white rounded-full" />
                            <span>New Script</span>
                        </button>
                    </div>

                    {/* Kanban Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Column 1: Drafts & Rework */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-900 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <h3 className="font-black uppercase tracking-wide">Drafts / Rework</h3>
                                <span className="bg-white text-black px-2 py-0.5 font-bold text-xs border border-black">{drafts.length}</span>
                            </div>
                            <div className="space-y-4">
                                {drafts.map(p => (
                                    <div key={p.id} className={`bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all ${p.status === TaskStatus.REJECTED ? 'bg-red-50' : ''}`} onClick={() => handleEdit(p)}>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase border-2 border-black ${p.channel === 'YOUTUBE' ? 'bg-[#FF4F4F] text-white' :
                                                p.channel === 'LINKEDIN' ? 'bg-[#0085FF] text-white' :
                                                    'bg-[#D946EF] text-white'
                                                }`}>
                                                {p.channel}
                                            </span>
                                            {p.status === TaskStatus.REJECTED && (
                                                <span className="bg-[#FF4F4F] text-white px-2 py-0.5 border-2 border-black text-[10px] font-black uppercase">Rework</span>
                                            )}
                                        </div>
                                        <h4 className="font-black text-xl text-slate-900 mb-2 uppercase leading-tight">{p.title}</h4>
                                        <div className="flex items-center text-xs font-bold text-slate-500 uppercase mt-4 border-t-2 border-slate-100 pt-3">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatDistanceToNow(new Date(p.created_at))} ago
                                        </div>
                                    </div>
                                ))}
                                {drafts.length === 0 && <div className="p-8 text-center font-bold text-slate-400 border-2 border-dashed border-slate-300 uppercase text-sm">No active drafts</div>}
                            </div>
                        </div>

                        {/* Column 2: In Review (CMO/CEO) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-[#0085FF] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <h3 className="font-black uppercase tracking-wide">In Review</h3>
                                <span className="bg-white text-black px-2 py-0.5 font-bold text-xs border border-black">{inReview.length}</span>
                            </div>
                            <div className="space-y-4">
                                {inReview.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => handleViewProject(p)}
                                        className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-xs font-black uppercase tracking-wider text-slate-400">{p.channel}</span>
                                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 border border-blue-200 text-[10px] font-bold uppercase">
                                                {p.assigned_to_role === Role.CMO ? 'With CMO' : 'With CEO'}
                                            </span>
                                        </div>
                                        <h4 className="font-black text-lg text-slate-900 mb-4 uppercase">{p.title}</h4>
                                        <div className="w-full bg-slate-100 h-2 border border-black overflow-hidden">
                                            <div className="bg-[#0085FF] h-full w-2/3 animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column 3: In Production */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-[#4ADE80] text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <h3 className="font-black uppercase tracking-wide">Production</h3>
                                <span className="bg-white text-black px-2 py-0.5 font-bold text-xs border border-black">{inProduction.length}</span>
                            </div>
                            <div className="space-y-4">
                                {inProduction.map(p => (
                                    <div key={p.id} className="bg-slate-50 p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase border-2 border-black ${p.channel === 'YOUTUBE' ? 'bg-[#FF4F4F] text-white' :
                                                p.channel === 'LINKEDIN' ? 'bg-[#0085FF] text-white' :
                                                    'bg-[#D946EF] text-white'
                                                }`}>
                                                {p.channel}
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border-2 border-black ${p.assigned_to_role === Role.CINE ? 'bg-purple-100 text-purple-800' :
                                                p.assigned_to_role === Role.EDITOR ? 'bg-yellow-100 text-yellow-800' :
                                                    p.assigned_to_role === Role.DESIGNER ? 'bg-pink-100 text-pink-800' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {p.assigned_to_role === Role.CINE ? 'WITH CINE' :
                                                    p.assigned_to_role === Role.EDITOR ? 'WITH EDITOR' :
                                                        p.assigned_to_role === Role.DESIGNER ? 'CREATIVE DESIGN' :
                                                            STAGE_LABELS[p.current_stage]}
                                            </span>
                                        </div>
                                        <h4 className="font-black text-lg text-slate-900 mb-2 uppercase">{p.title}</h4>
                                        <div className="w-full bg-slate-200 h-2 border border-black overflow-hidden mt-4">
                                            <div className="bg-[#4ADE80] h-full w-3/4"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </Layout>
    );
};

export default WriterDashboard;
