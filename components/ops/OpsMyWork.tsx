import React from 'react';
import { Project } from '../../types';
import { Calendar, FileText, Video, Image, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
    user: { full_name: string };
    projects: Project[];
    onSelectProject: (project: Project) => void;
}

const OpsMyWork: React.FC<Props> = ({ projects, onSelectProject }) => {
    // Categorize by scheduling status
    const readyToSchedule = projects.filter(p => !p.post_scheduled_date && p.status !== 'DONE');
    const scheduled = projects.filter(p => p.post_scheduled_date && !p.data?.live_url && p.status !== 'DONE');
    const posted = projects.filter(p => p.data?.live_url || p.status === 'DONE');

    const getPlatformColor = (channel: string) => {
        switch (channel) {
            case 'LINKEDIN': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'YOUTUBE': return 'bg-red-100 text-red-800 border-red-300';
            case 'INSTAGRAM': return 'bg-purple-100 text-purple-800 border-purple-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const ProjectCard = ({ project }: { project: Project; key?: any }) => (
        <div
            onClick={() => onSelectProject(project)}
            className="border-2 border-black p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer bg-white"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-xs font-bold border ${getPlatformColor(project.channel)}`}>
                            {project.channel}
                        </span>
                        {project.content_type === 'VIDEO' ? (
                            <span className="flex items-center gap-1 text-xs text-slate-600">
                                <Video size={14} /> VIDEO
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs text-slate-600">
                                <Image size={14} /> CREATIVE
                            </span>
                        )}
                    </div>
                    <h3 className="font-bold text-lg text-slate-900">{project.title}</h3>
                </div>
            </div>

            {/* Status Info */}
            <div className="space-y-2 text-sm">
                {project.post_scheduled_date && (
                    <div className="flex items-center gap-2 text-slate-700">
                        <Calendar size={16} />
                        <span>Scheduled: {format(new Date(project.post_scheduled_date), 'MMM dd, yyyy')}</span>
                    </div>
                )}
                {project.data?.live_url && (
                    <div className="flex items-center gap-2 text-green-700">
                        <LinkIcon size={16} />
                        <span className="font-bold">Posted</span>
                    </div>
                )}
                {!project.post_scheduled_date && !project.data?.live_url && (
                    <div className="text-amber-600 font-bold">⏳ Needs Scheduling</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-4xl font-black uppercase text-slate-900">My Work</h1>

            {/* Ready to Schedule */}
            {readyToSchedule.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase text-amber-600 border-b-4 border-black inline-block pb-1">
                        📅 Ready to Schedule ({readyToSchedule.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {readyToSchedule.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                </div>
            )}

            {/* Scheduled */}
            {scheduled.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase text-blue-600 border-b-4 border-black inline-block pb-1">
                        🗓️ Scheduled ({scheduled.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {scheduled.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                </div>
            )}

            {/* Posted */}
            {posted.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase text-green-600 border-b-4 border-black inline-block pb-1">
                        ✅ Posted ({posted.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {posted.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                </div>
            )}

            {projects.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No projects to manage</p>
                </div>
            )}
        </div>
    );
};

export default OpsMyWork;
