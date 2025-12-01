import React, { useState } from 'react';
import { Project, Role, WorkflowStage, TaskStatus } from '../../types';
import { Calendar, Upload, Link as LinkIcon } from 'lucide-react';
import OpsMyWork from './OpsMyWork';
import OpsCalendar from './OpsCalendar';
import OpsProjectDetail from './OpsProjectDetail';
import Layout from '../Layout';

interface Props {
    user: { full_name: string; role: Role };
    projects: Project[];
    onRefresh: () => void;
    onLogout: () => void;
}

const OpsDashboard: React.FC<Props> = ({ user, projects, onRefresh, onLogout }) => {
    const [activeView, setActiveView] = useState<string>('dashboard');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Mock data - Projects in Ops stage
    const mockProjects: Project[] = [
        // Ready to Schedule (no post date set)
        {
            id: 'mock-ops-1',
            title: 'Q4 Results Announcement',
            channel: 'LINKEDIN' as any,
            content_type: 'CREATIVE_ONLY',
            current_stage: WorkflowStage.OPS_SCHEDULING,
            assigned_to_role: Role.OPS,
            status: TaskStatus.TODO,
            priority: 'HIGH',
            due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
            created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
            creative_link: 'https://drive.google.com/creative-q4-results.png',
            data: {
                script_content: '📊 Q4 Results: Record growth! 30% YoY increase...',
            },
            history: []
        },
        // Scheduled (has post date, waiting to publish)
        {
            id: 'mock-ops-2',
            title: 'Product Demo Tutorial',
            channel: 'YOUTUBE' as any,
            content_type: 'VIDEO',
            current_stage: WorkflowStage.OPS_SCHEDULING,
            assigned_to_role: Role.OPS,
            status: TaskStatus.IN_PROGRESS,
            priority: 'NORMAL',
            due_date: new Date(Date.now() + 86400000 * 10).toISOString(),
            created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
            post_scheduled_date: '2025-12-10',
            edited_video_link: 'https://drive.google.com/edited-demo.mp4',
            thumbnail_link: 'https://drive.google.com/thumb-demo.jpg',
            data: {
                script_content: 'Learn how to use our product in 5 minutes...',
            },
            history: []
        },
        // Posted (has live URL, marked as done)
        {
            id: 'mock-ops-3',
            title: 'Behind The Scenes - Office Tour',
            channel: 'INSTAGRAM' as any,
            content_type: 'VIDEO',
            current_stage: WorkflowStage.POSTED,
            assigned_to_role: Role.OPS,
            status: TaskStatus.DONE,
            priority: 'NORMAL',
            due_date: new Date(Date.now() - 86400000 * 3).toISOString(),
            created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
            post_scheduled_date: '2025-11-28',
            edited_video_link: 'https://drive.google.com/edited-office.mp4',
            thumbnail_link: 'https://drive.google.com/thumb-office.jpg',
            data: {
                script_content: 'Quick tour of our new office space!',
                live_url: 'https://instagram.com/p/xyz123'
            },
            history: []
        },
        // Ready to Schedule - Creative
        {
            id: 'mock-ops-4',
            title: 'Hiring Ad - Software Engineer',
            channel: 'LINKEDIN' as any,
            content_type: 'CREATIVE_ONLY',
            current_stage: WorkflowStage.OPS_SCHEDULING,
            assigned_to_role: Role.OPS,
            status: TaskStatus.TODO,
            priority: 'NORMAL',
            due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
            created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
            creative_link: 'https://drive.google.com/hiring-ad.png',
            data: {
                script_content: "We're hiring! Join our engineering team...",
            },
            history: []
        }
    ];

    // Combine real projects with mock data
    const allProjects = [...projects.filter(p => p.assigned_to_role === Role.OPS), ...mockProjects];

    // Categorize projects
    const readyToSchedule = allProjects.filter(p =>
        p.current_stage === WorkflowStage.OPS_SCHEDULING &&
        !p.post_scheduled_date
    );

    const scheduled = allProjects.filter(p =>
        p.current_stage === WorkflowStage.OPS_SCHEDULING &&
        p.post_scheduled_date &&
        !p.data?.live_url
    );

    const postedThisWeek = allProjects.filter(p => {
        if (p.current_stage !== WorkflowStage.POSTED) return false;
        const postedDate = p.post_scheduled_date ? new Date(p.post_scheduled_date) : null;
        if (!postedDate) return false;
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        return postedDate >= weekAgo;
    });

    return (
        <Layout
            user={user as any}
            onLogout={onLogout}
            onOpenCreate={() => { }}
            activeView={activeView}
            onChangeView={setActiveView}
        >
            {selectedProject ? (
                <OpsProjectDetail
                    project={selectedProject}
                    onBack={() => setSelectedProject(null)}
                    onUpdate={() => {
                        setSelectedProject(null);
                        onRefresh();
                    }}
                />
            ) : activeView === 'mywork' ? (
                <OpsMyWork user={user} projects={allProjects} onSelectProject={setSelectedProject} />
            ) : activeView === 'calendar' ? (
                <OpsCalendar projects={allProjects} />
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Dashboard Content */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2 drop-shadow-sm">
                                Operations Center
                            </h1>
                            <p className="font-bold text-lg text-slate-500">Welcome back, {user.full_name}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-[#F59E0B] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-white mb-1">
                                {readyToSchedule.length}
                            </div>
                            <div className="text-sm font-bold uppercase text-white/80">Ready to Schedule</div>
                        </div>
                        <div className="bg-[#3B82F6] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-white mb-1">
                                {scheduled.length}
                            </div>
                            <div className="text-sm font-bold uppercase text-white/80">Scheduled</div>
                        </div>
                        <div className="bg-[#10B981] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-white mb-1">
                                {postedThisWeek.length}
                            </div>
                            <div className="text-sm font-bold uppercase text-white/80">Posted This Week</div>
                        </div>
                        <div className="bg-[#8B5CF6] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-white mb-1">
                                {allProjects.length}
                            </div>
                            <div className="text-sm font-bold uppercase text-white/80">Total Managed</div>
                        </div>
                    </div>

                    {/* Quick Overview */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black uppercase text-slate-900 border-b-4 border-black inline-block pb-1">
                            Quick Overview
                        </h2>
                        <p className="text-slate-600">
                            You have {readyToSchedule.length} {readyToSchedule.length === 1 ? 'project' : 'projects'} ready to schedule and {scheduled.length} scheduled for publishing.
                            Click <button onClick={() => setActiveView('mywork')} className="text-blue-600 font-bold underline">My Work</button> to manage them.
                        </p>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default OpsDashboard;
