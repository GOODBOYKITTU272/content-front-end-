import React, { useState } from 'react';
import { Project, Role, WorkflowStage, TaskStatus } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { Calendar as CalendarIcon, Upload, Video, Film } from 'lucide-react';
import EditorMyWork from './EditorMyWork';
import EditorCalendar from './EditorCalendar';
import EditorProjectDetail from './EditorProjectDetail';
import Layout from '../Layout';

interface Props {
    user: { full_name: string; role: Role };
    projects: Project[];
    onRefresh: () => void;
    onLogout: () => void;
}

const EditorDashboard: React.FC<Props> = ({ user, projects, onRefresh, onLogout }) => {
    const [activeView, setActiveView] = useState<string>('dashboard');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Mock data - Projects assigned to Editor
    const mockProjects: Project[] = [
        {
            id: 'mock-editor-1',
            title: 'Product Demo Tutorial',
            channel: 'YOUTUBE' as any,
            content_type: 'VIDEO',
            current_stage: WorkflowStage.VIDEO_EDITING,
            assigned_to_role: Role.EDITOR,
            status: TaskStatus.TODO,
            priority: 'HIGH',
            due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            shoot_date: '2025-12-05',
            video_link: 'https://drive.google.com/raw-video-from-cine-123',
            data: {
                script_content: 'INTRO: Welcome to our latest product tutorial. Today we demonstrate...',
            },
            history: []
        },
        {
            id: 'mock-editor-2',
            title: 'Behind The Scenes - Office Tour',
            channel: 'INSTAGRAM' as any,
            content_type: 'VIDEO',
            current_stage: WorkflowStage.VIDEO_EDITING,
            assigned_to_role: Role.EDITOR,
            status: TaskStatus.IN_PROGRESS,
            priority: 'NORMAL',
            due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
            created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
            shoot_date: '2025-12-03',
            video_link: 'https://drive.google.com/raw-video-office-tour',
            delivery_date: '2025-12-12',
            data: {
                script_content: 'Quick 60-second walk through our new office space...',
            },
            history: []
        },
        {
            id: 'mock-editor-3',
            title: 'CEO Interview Q4 Results',
            channel: 'LINKEDIN' as any,
            content_type: 'VIDEO',
            current_stage: WorkflowStage.VIDEO_EDITING,
            assigned_to_role: Role.EDITOR,
            status: TaskStatus.IN_PROGRESS,
            priority: 'HIGH',
            due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
            created_at: new Date(Date.now() - 86400000).toISOString(),
            shoot_date: '2025-12-02',
            video_link: 'https://vimeo.com/ceo-interview-raw',
            delivery_date: '2025-12-08',
            edited_video_link: 'https://drive.google.com/edited-ceo-interview',
            data: {
                script_content: 'Q: How did we perform this quarter? A: We exceeded all expectations...',
            },
            history: []
        }
    ];

    // Combine real projects with mock data
    const allProjects = [...projects.filter(p => p.assigned_to_role === Role.EDITOR), ...mockProjects];
    const activeProjects = allProjects.filter(p => p.status !== TaskStatus.DONE);

    return (
        <Layout
            user={user as any}
            onLogout={onLogout}
            onOpenCreate={() => { }}
            activeView={activeView}
            onChangeView={setActiveView}
        >
            {selectedProject ? (
                <EditorProjectDetail
                    project={selectedProject}
                    onBack={() => setSelectedProject(null)}
                    onUpdate={() => {
                        setSelectedProject(null);
                        onRefresh();
                    }}
                />
            ) : activeView === 'mywork' ? (
                <EditorMyWork user={user} projects={allProjects} onSelectProject={setSelectedProject} />
            ) : activeView === 'calendar' ? (
                <EditorCalendar projects={allProjects} />
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Dashboard Content */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2 drop-shadow-sm">
                                Video Editing
                            </h1>
                            <p className="font-bold text-lg text-slate-500">Welcome back, {user.full_name}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#FF4F4F] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-white mb-1">
                                {activeProjects.filter(p => !p.delivery_date).length}
                            </div>
                            <div className="text-sm font-bold uppercase text-white/80">Needs Delivery Date</div>
                        </div>
                        <div className="bg-[#0085FF] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-white mb-1">
                                {activeProjects.filter(p => p.delivery_date && !p.edited_video_link).length}
                            </div>
                            <div className="text-sm font-bold uppercase text-white/80">In Progress</div>
                        </div>
                        <div className="bg-[#4ADE80] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-black mb-1">
                                {allProjects.filter(p => p.edited_video_link).length}
                            </div>
                            <div className="text-sm font-bold uppercase text-black/80">Delivered</div>
                        </div>
                    </div>

                    {/* Quick Overview */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black uppercase text-slate-900 border-b-4 border-black inline-block pb-1">
                            Quick Overview
                        </h2>
                        <p className="text-slate-600">
                            You have {activeProjects.length} active editing {activeProjects.length === 1 ? 'project' : 'projects'}.
                            Click <button onClick={() => setActiveView('mywork')} className="text-blue-600 font-bold underline">My Work</button> to manage them.
                        </p>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default EditorDashboard;
