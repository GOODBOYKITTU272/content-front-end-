import React from 'react';
import { User, SystemLog, Role, UserStatus } from '../../types';
import { Users, ShieldCheck, Activity, UserPlus, Clock } from 'lucide-react';

interface Props {
  users: User[];
  logs: SystemLog[];
  onNavigate: (view: any) => void;
}

const AdminDashboard: React.FC<Props> = ({ users, logs, onNavigate }) => {
  const activeUsers = users.filter(u => u.status === UserStatus.ACTIVE).length;
  const inactiveUsers = users.length - activeUsers;
  
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<Role, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <button 
            onClick={() => onNavigate('USERS')}
            className="mt-2 md:mt-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center w-fit shadow-md shadow-red-100"
        >
            <UserPlus className="w-4 h-4 mr-2" />
            Manage Users
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:border-red-200 transition-colors" onClick={() => onNavigate('USERS')}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500">Total Users</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{users.length}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="w-6 h-6" />
                </div>
            </div>
            <div className="mt-4 flex items-center space-x-3 text-sm">
                <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">{activeUsers} Active</span>
                <span className="text-slate-400">{inactiveUsers} Inactive</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:border-red-200 transition-colors" onClick={() => onNavigate('ROLES')}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500">Roles Defined</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{Object.keys(Role).length}</h3>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                    <ShieldCheck className="w-6 h-6" />
                </div>
            </div>
             <p className="mt-4 text-sm text-slate-500">Fixed System Roles</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:border-red-200 transition-colors" onClick={() => onNavigate('LOGS')}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500">System Logs</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{logs.length}</h3>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                    <Activity className="w-6 h-6" />
                </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">Recorded Events</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500">System Status</p>
                    <h3 className="text-3xl font-bold text-green-600 mt-2">Healthy</h3>
                </div>
                 <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                    <Activity className="w-6 h-6" />
                </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">v1.1 Stable</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-1">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Roles Summary</h3>
            <div className="space-y-3">
                {Object.entries(roleCounts).map(([role, count]) => (
                    <div key={role} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded">
                        <span className="text-sm font-medium text-slate-600">{role}</span>
                        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{count as number}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Recent Admin Activity</h3>
                <button onClick={() => onNavigate('LOGS')} className="text-sm text-red-600 hover:text-red-700 font-medium">View All</button>
            </div>
            <div className="space-y-6">
                {logs.slice(0, 5).map(log => (
                    <div key={log.id} className="flex space-x-4">
                        <div className="w-2 h-2 mt-2 rounded-full bg-slate-300" />
                        <div>
                            <p className="text-sm text-slate-900">
                                <span className="font-semibold">{log.actor_name}</span>{' '}
                                <span className="text-slate-600">{log.action.toLowerCase().replace('_', ' ')}</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-1 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(log.timestamp).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 italic">{log.details}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;