import React, { useState } from 'react';
import { Project, Role, WorkflowStage, TaskStatus } from '../../types';
import { Palette, Video, FileImage } from 'lucide-react';
import DesignerMyWork from './DesignerMyWork';
import DesignerCalendar from './DesignerCalendar';
import DesignerProjectDetail from './DesignerProjectDetail';
import Layout from '../Layout';

interface Props {
    user: { full_name: string; role: Role };
    projects: Project[];
    onRefresh: () => void;
    onLogout: () => void;
}

const DesignerDashboard: React.FC<Props> = ({ user, projects, onRefresh, onLogout }) => {
    const [activeView, setActiveView] = useState<string>('dashboard');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Mock data - Projects assigned to Designer (both types)
    const mockProjects: Project[] = [
        // Thumbnail Task (from Editor)
        {
            id: 'mock-designer-1',
            title: 'Product Demo Tutorial',
            channel: 'YOUTUBE' as any,
            content_type: 'VIDEO',
            current_stage: WorkflowStage.THUMBNAIL_DESIGN,
            assigned_to_role: Role.DESIGNER,
            status: TaskStatus.TODO,
            priority: 'HIGH',
            due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
            created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
            edited_video_link: 'https://drive.google.com/edited-product-demo',
            delivery_date: '',
            data: {
                script_content: 'INTRO: Welcome to our latest product tutorial...',
            },
            history: []
        },
        // Creative Task (from CEO)
        {
            id: 'mock-designer-2',
            title: 'LinkedIn Post - Q4 Announcement',
            channel: 'LINKEDIN' as any,
            content_type: 'CREATIVE_ONLY',
            current_stage: WorkflowStage.CREATIVE_DESIGN,
            assigned_to_role: Role.DESIGNER,
            status: TaskStatus.TODO,
            priority: 'NORMAL',
            due_date: new Date(Date.now() + 86400000 * 6).toISOString(),
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            data: {
                script_content: '📊 Q4 Results are in! We exceeded all targets and achieved record growth...',
            },
            history: []
        },
        // Thumbnail with delivery date set
        {
            id: 'mock-designer-3',
            title: 'Behind The Scenes - Office Tour',
            channel: 'INSTAGRAM' as any,
            content_type: 'VIDEO',
            current_stage: WorkflowStage.THUMBNAIL_DESIGN,
            assigned_to_role: Role.DESIGNER,
            status: TaskStatus.IN_PROGRESS,
            priority: 'NORMAL',
            due_date: new Date(Date.now() + 86400000 * 8).toISOString(),
            created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
            edited_video_link: 'https://drive.google.com/edited-office-tour',
            delivery_date: '2025-12-15',
            thumbnail_link: 'https://drive.google.com/thumbnail-office-tour.jpg',
            data: {
                script_content: 'Quick 60-second walk through our new office space...',
            },
            history: []
        }
    ];

    // Combine real projects with mock data
    const allProjects = [...projects.filter(p => p.assigned_to_role === Role.DESIGNER), ...mockProjects];
    const activeProjects = allProjects.filter(p => p.status !== TaskStatus.DONE);

    // Categorize by task type
    const thumbnailTasks = allProjects.filter(p => p.content_type === 'VIDEO');
    const creativeTasks = allProjects.filter(p => p.content_type === 'CREATIVE_ONLY');

    return (
        <Layout
            user={user as any}
            onLogout={onLogout}
            onOpenCreate={() => { }}
            activeView={activeView}
            onChangeView={setActiveView}
        >
            {selectedProject ? (
                <DesignerProjectDetail
                    project={selectedProject}
                    onBack={() => setSelectedProject(null)}
                    onUpdate={() => {
                        setSelectedProject(null);
                        onRefresh();
                    }}
                />
            ) : activeView === 'mywork' ? (
                <DesignerMyWork user={user} projects={allProjects} onSelectProject={setSelectedProject} />
            ) : activeView === 'calendar' ? (
                <DesignerCalendar projects={allProjects} />
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Dashboard Content */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2 drop-shadow-sm">
                                Design Studio
                            </h1>
                            <p className="font-bold text-lg text-slate-500">Welcome back, {user.full_name}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-[#0085FF] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-white mb-1">
                                {thumbnailTasks.filter(p => !p.thumbnail_link).length}
                            </div>
                            <div className="text-sm font-bold uppercase text-white/80">Thumbnail Tasks</div>
                        </div>
                        <div className="bg-[#D946EF] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-white mb-1">
                                {creativeTasks.filter(p => !p.creative_link).length}
                            </div>
                            <div className="text-sm font-bold uppercase text-white/80">Creative Tasks</div>
                        </div>
                        <div className="bg-[#FF4F4F] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-white mb-1">
                                {activeProjects.filter(p => !p.delivery_date).length}
                            </div>
                            <div className="text-sm font-bold uppercase text-white/80">Needs Date</div>
                        </div>
                        <div className="bg-[#4ADE80] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-black mb-1">
                                {allProjects.filter(p => p.thumbnail_link || p.creative_link).length}
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
                            You have {activeProjects.length} active design {activeProjects.length === 1 ? 'task' : 'tasks'}.
                            Click <button onClick={() => setActiveView('mywork')} className="text-blue-600 font-bold underline">My Work</button> to manage them.
                        </p>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default DesignerDashboard;
