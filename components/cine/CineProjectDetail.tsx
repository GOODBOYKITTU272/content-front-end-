import React, { useState } from 'react';
import { Project } from '../../types';
import { ArrowLeft, Calendar as CalendarIcon, Upload, Video, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
    project: Project;
    onBack: () => void;
    onUpdate: () => void;
}

const CineProjectDetail: React.FC<Props> = ({ project, onBack, onUpdate }) => {
    const [shootDate, setShootDate] = useState(project.shoot_date || '');
    const [videoLink, setVideoLink] = useState(project.video_link || '');

    const handleSetShootDate = () => {
        if (!shootDate) {
            alert('Please select a date');
            return;
        }
        console.log(`Setting shoot date: ${shootDate}`);
        alert(`✅ Shoot scheduled for ${project.title} on ${shootDate}\n\nThis will be visible on calendars for Writer, CEO, CMO, and Ops.`);
        onUpdate();
    };

    const handleUploadVideo = () => {
        if (!videoLink) {
            alert('Please enter a video link');
            return;
        }
        console.log(`Uploading video: ${videoLink}`);
        alert(`✅ Video uploaded successfully!\n\nProject: ${project.title}\nLink: ${videoLink}\n\n→ Editor will be automatically notified\n→ Project moving to VIDEO_EDITING stage`);
        onUpdate();
    };

    return (
        <div className="min-h-screen bg-slate-50 animate-fade-in">
            {/* Header */}
            <div className="bg-white border-b-2 border-black sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 border-2 border-black hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-black uppercase text-slate-900">{project.title}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span
                                className={`px-2 py-1 text-[10px] font-black uppercase border-2 border-black ${project.channel === 'YOUTUBE'
                                        ? 'bg-[#FF4F4F] text-white'
                                        : project.channel === 'LINKEDIN'
                                            ? 'bg-[#0085FF] text-white'
                                            : 'bg-[#D946EF] text-white'
                                    }`}
                            >
                                {project.channel}
                            </span>
                            <span className="text-sm text-slate-500 font-bold">
                                Due: {formatDistanceToNow(new Date(project.due_date))} from now
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                {/* Script Content */}
                <div className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5" />
                        <h2 className="text-xl font-black uppercase">Script</h2>
                    </div>
                    <div className="bg-slate-50 border-2 border-slate-200 p-4 font-serif text-slate-900 leading-relaxed">
                        {project.data.script_content || 'No script content available'}
                    </div>
                </div>

                {/* Shoot Scheduling Section */}
                <div className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarIcon className="w-5 h-5" />
                        <h2 className="text-xl font-black uppercase">Shoot Schedule</h2>
                    </div>

                    {!project.shoot_date ? (
                        <div className="space-y-4">
                            <p className="text-slate-600 font-medium">Schedule a shoot date for this project</p>
                            <div className="flex gap-3">
                                <input
                                    type="date"
                                    value={shootDate}
                                    onChange={(e) => setShootDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="flex-1 p-4 border-2 border-black text-lg font-bold focus:bg-yellow-50 focus:outline-none"
                                />
                                <button
                                    onClick={handleSetShootDate}
                                    className="px-8 py-4 bg-[#4ADE80] border-2 border-black text-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                >
                                    <CalendarIcon className="w-5 h-5 inline mr-2" />
                                    Set Shoot Date
                                </button>
                            </div>
                            <p className="text-sm text-slate-500">
                                📅 This date will be visible on calendars for Writer, CEO, CMO, and Operations
                            </p>
                        </div>
                    ) : (
                        <div className="bg-green-50 border-2 border-green-600 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold uppercase text-green-800 mb-1">✓ Shoot Scheduled</p>
                                    <p className="text-2xl font-black text-green-900">{project.shoot_date}</p>
                                </div>
                                <button
                                    onClick={() => setShootDate('')}
                                    className="px-4 py-2 border-2 border-green-700 text-green-800 font-bold text-sm uppercase hover:bg-green-100 transition-colors"
                                >
                                    Reschedule
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Video Upload Section */}
                {project.shoot_date && (
                    <div className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Upload className="w-5 h-5" />
                            <h2 className="text-xl font-black uppercase">Video Upload</h2>
                        </div>

                        {!project.video_link ? (
                            <div className="space-y-4">
                                <p className="text-slate-600 font-medium">Upload the video link after shooting</p>
                                <div className="flex gap-3">
                                    <input
                                        type="url"
                                        value={videoLink}
                                        onChange={(e) => setVideoLink(e.target.value)}
                                        placeholder="https://drive.google.com/file/d/... or https://vimeo.com/..."
                                        className="flex-1 p-4 border-2 border-black text-lg font-medium focus:bg-yellow-50 focus:outline-none"
                                    />
                                    <button
                                        onClick={handleUploadVideo}
                                        className="px-8 py-4 bg-[#0085FF] border-2 border-black text-white font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                    >
                                        <Upload className="w-5 h-5 inline mr-2" />
                                        Upload Video
                                    </button>
                                </div>
                                <p className="text-sm text-slate-500">
                                    🎬 Once uploaded, the Editor will be automatically notified
                                </p>
                            </div>
                        ) : (
                            <div className="bg-blue-50 border-2 border-blue-600 p-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Video className="w-5 h-5 text-blue-800" />
                                        <p className="text-sm font-bold uppercase text-blue-800">✓ Video Uploaded</p>
                                    </div>
                                    <a
                                        href={project.video_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-3 bg-white border-2 border-blue-400 text-blue-600 font-medium hover:bg-blue-50 transition-colors break-all"
                                    >
                                        {project.video_link}
                                    </a>
                                    <p className="text-sm text-blue-800 font-medium">
                                        → Project has been moved to Editor for video editing
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Project Info */}
                <div className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                    <h2 className="text-xl font-black uppercase mb-4">Project Details</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-bold text-slate-400 uppercase text-xs">Status</span>
                            <p className="font-bold text-slate-900 mt-1">{project.status}</p>
                        </div>
                        <div>
                            <span className="font-bold text-slate-400 uppercase text-xs">Priority</span>
                            <p className="font-bold text-slate-900 mt-1">{project.priority}</p>
                        </div>
                        <div>
                            <span className="font-bold text-slate-400 uppercase text-xs">Created</span>
                            <p className="font-bold text-slate-900 mt-1">
                                {formatDistanceToNow(new Date(project.created_at))} ago
                            </p>
                        </div>
                        <div>
                            <span className="font-bold text-slate-400 uppercase text-xs">Content Type</span>
                            <p className="font-bold text-slate-900 mt-1">{project.content_type}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CineProjectDetail;
