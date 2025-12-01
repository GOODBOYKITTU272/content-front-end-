import React, { useState } from 'react';
import { Project, Role, WorkflowStage, TaskStatus } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { Calendar as CalendarIcon, Upload, Video } from 'lucide-react';
import CineMyWork from './CineMyWork';
import CineCalendar from './CineCalendar';
import CineProjectDetail from './CineProjectDetail';
import Layout from '../Layout';

interface Props {
    user: { full_name: string; role: Role };
    projects: Project[];
    onRefresh: () => void;
    onLogout: () => void;
}

const CineDashboard: React.FC<Props> = ({ user, projects, onRefresh, onLogout }) => {
    const [activeView, setActiveView] = useState<string>('dashboard');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [shootDate, setShootDate] = useState<string>('');
    const [videoLink, setVideoLink] = useState<string>('');

    // Mock data - Projects assigned to Cinematographer
    const mockProjects: Project[] = [
        {
            id: 'mock-cine-1',
            title: 'Product Demo Tutorial',
            channel: 'YOUTUBE' as any,
            content_type: 'VIDEO',
            current_stage: WorkflowStage.CINEMATOGRAPHY,
            assigned_to_role: Role.CINE,
            status: TaskStatus.TODO,
            priority: 'HIGH',
            due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
            created_at: new Date(Date.now() - 86400000).toISOString(),
            shoot_date: '2025-12-05',
            data: {
                script_content: 'INTRO: Welcome to our latest product tutorial...',
            },
            history: []
        },
        {
            id: 'mock-cine-2',
            title: 'Behind The Scenes - Office Tour',
            channel: 'INSTAGRAM' as any,
            content_type: 'VIDEO',
            current_stage: WorkflowStage.CINEMATOGRAPHY,
            assigned_to_role: Role.CINE,
            status: TaskStatus.IN_PROGRESS,
            priority: 'NORMAL',
            due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            video_link: 'https://drive.google.com/mock-video-123',
            data: {
                script_content: 'Quick walk through our new office space...',
            },
            history: []
        },
        {
            id: 'mock-cine-3',
            title: 'CEO Interview Q4 Results',
            channel: 'LINKEDIN' as any,
            content_type: 'VIDEO',
            current_stage: WorkflowStage.CINEMATOGRAPHY,
            assigned_to_role: Role.CINE,
            status: TaskStatus.TODO,
            priority: 'HIGH',
            due_date: new Date(Date.now() + 86400000).toISOString(),
            created_at: new Date(Date.now() - 3600000).toISOString(),
            data: {
                script_content: 'Q: How did we perform this quarter? A: We exceeded expectations...',
            },
            history: []
        }
    ];

    // Combine real projects with mock data
    const allProjects = [...projects.filter(p => p.assigned_to_role === Role.CINE), ...mockProjects];
    const activeProjects = allProjects.filter(p => p.status !== TaskStatus.DONE);

    const handleSetShootDate = (project: Project) => {
        console.log(`Setting shoot date for ${project.title}: ${shootDate}`);
        alert(`Shoot scheduled for ${project.title} on ${shootDate}`);
    };

    const handleUploadVideo = (project: Project) => {
        console.log(`Uploading video for ${project.title}: ${videoLink}`);
        alert(`Video uploaded for ${project.title}!\nLink: ${videoLink}\n\nProject will now move to Editor.`);
    };

    return (
        <Layout
            user={user as any}
            onLogout={onLogout}
            onOpenCreate={() => { }}
            activeView={activeView}
            onChangeView={setActiveView}
        >
            {selectedProject ? (
                <CineProjectDetail
                    project={selectedProject}
                    onBack={() => setSelectedProject(null)}
                    onUpdate={() => {
                        setSelectedProject(null);
                        onRefresh();
                    }}
                />
            ) : activeView === 'mywork' ? (
                <CineMyWork user={user} projects={allProjects} onSelectProject={setSelectedProject} />
            ) : activeView === 'calendar' ? (
                <CineCalendar projects={allProjects} />
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Dashboard Content */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2 drop-shadow-sm">
                                Cinematography
                            </h1>
                            <p className="font-bold text-lg text-slate-500">Welcome back, {user.full_name}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0085FF] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-white mb-1">{activeProjects.length}</div>
                            <div className="text-sm font-bold uppercase text-white/80">Active Shoots</div>
                        </div>
                        <div className="bg-[#4ADE80] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-black mb-1">
                                {allProjects.filter(p => p.shoot_date).length}
                            </div>
                            <div className="text-sm font-bold uppercase text-black/80">Scheduled</div>
                        </div>
                        <div className="bg-[#D946EF] border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <div className="text-4xl font-black text-white mb-1">
                                {allProjects.filter(p => p.video_link).length}
                            </div>
                            <div className="text-sm font-bold uppercase text-white/80">Videos Uploaded</div>
                        </div>
                    </div>

                    {/* Projects Summary - click cards to go to My Work */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black uppercase text-slate-900 border-b-4 border-black inline-block pb-1">
                            Quick Overview
                        </h2>
                        <p className="text-slate-600">
                            You have {activeProjects.length} active {activeProjects.length === 1 ? 'project' : 'projects'}.
                            Click <button onClick={() => setActiveView('mywork')} className="text-blue-600 font-bold underline">My Work</button> to manage them.
                        </p>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CineDashboard;
