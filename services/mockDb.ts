import { Project, Role, TaskStatus, User, WorkflowStage, Channel, ProjectData, UserStatus, SystemLog, Priority, ContentType } from '../types';
import { WORKFLOWS, DEMO_USERS } from '../constants';

const generateId = () => Math.random().toString(36).substring(2, 9);

// Initial Mock Data
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Hiring Freeze Post',
    channel: Channel.LINKEDIN,
    content_type: 'CREATIVE_ONLY',
    current_stage: WorkflowStage.SCRIPT_REVIEW_L2, // Currently with CEO
    assigned_to_role: Role.CEO,
    status: TaskStatus.WAITING_APPROVAL,
    priority: 'HIGH',
    due_date: new Date().toISOString(),
    created_at: new Date(Date.now() - 10000000).toISOString(),
    data: {
      script_content: 'Headline: Why we stopped hiring.\n\nBody: It was a tough decision, but necessary for long term growth. We focused on efficiency over headcount...',
    },
    history: [
      {
        id: 'h1',
        stage: WorkflowStage.SCRIPT,
        actor_id: 'u1',
        actor_name: 'Alice Writer',
        action: 'SUBMITTED',
        timestamp: new Date(Date.now() - 10000000).toISOString()
      },
      {
        id: 'h2',
        stage: WorkflowStage.SCRIPT_REVIEW_L1,
        actor_id: 'u2',
        actor_name: 'Carol CMO',
        action: 'APPROVED',
        comment: 'Looks punchy. Sending to CEO.',
        timestamp: new Date(Date.now() - 5000000).toISOString()
      }
    ],
  },
  {
    id: 'p2',
    title: 'Product Tutorial v1',
    channel: Channel.YOUTUBE,
    content_type: 'VIDEO',
    current_stage: WorkflowStage.SCRIPT_REVIEW_L1, // Currently with CMO
    assigned_to_role: Role.CMO,
    status: TaskStatus.WAITING_APPROVAL,
    priority: 'NORMAL',
    due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    data: {
      script_content: 'INTRO\n[Camera pans to host]\nHost: Welcome back to the channel...',
    },
    history: [
      {
        id: 'h3',
        stage: WorkflowStage.SCRIPT,
        actor_id: 'u1',
        actor_name: 'Alice Writer',
        action: 'SUBMITTED',
        timestamp: new Date(Date.now() - 1000000).toISOString()
      }
    ],
  },
  {
    id: 'p3',
    title: 'Q3 Financial Highlights',
    channel: Channel.INSTAGRAM,
    content_type: 'VIDEO',
    current_stage: WorkflowStage.FINAL_REVIEW_CEO,
    assigned_to_role: Role.CEO,
    status: TaskStatus.WAITING_APPROVAL,
    priority: 'NORMAL',
    due_date: new Date(Date.now() + 43200000).toISOString(),
    created_at: new Date(Date.now() - 200000).toISOString(),
    data: {
      script_content: 'Quick upbeat music. Text overlay: 30% Growth!',
    },
    thumbnail_link: 'https://example.com/thumb.png',
    history: [],
  },
  {
    id: 'p4',
    title: 'Company Culture Reel',
    channel: Channel.INSTAGRAM,
    content_type: 'VIDEO',
    current_stage: WorkflowStage.SCRIPT, // With Writer
    assigned_to_role: Role.WRITER,
    status: TaskStatus.IN_PROGRESS,
    priority: 'NORMAL',
    due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    created_at: new Date(Date.now() - 50000).toISOString(),
    data: {
      brief: 'Showcase our coffee breaks and team events.'
    },
    history: [],
  }
];

class MockDb {
  private projects: Project[] = [...INITIAL_PROJECTS];
  private users: User[] = [...DEMO_USERS];
  private systemLogs: SystemLog[] = [];
  private currentUser: User | null = null;

  constructor() {
    this.systemLogs.push({
      id: generateId(),
      timestamp: new Date(Date.now() - 10000000).toISOString(),
      actor_id: 'u8',
      actor_name: 'Admin User',
      actor_role: Role.ADMIN,
      action: 'SYSTEM_INIT',
      details: 'System initialized'
    });
  }

  // --- Auth & Session ---

  login(role: Role): User {
    const user = this.users.find(u => u.role === role && u.status === UserStatus.ACTIVE);
    if (!user) {
      throw new Error('User inactive or not found');
    }
    user.last_login = new Date().toISOString();
    this.currentUser = user;
    this.logAction('LOGIN', `User ${user.full_name} logged in`);
    return user;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  logout() {
    if (this.currentUser) {
      this.logAction('LOGOUT', `User ${this.currentUser.full_name} logged out`);
    }
    this.currentUser = null;
  }

  // --- User Management (Admin) ---

  getUsers(): User[] {
    return this.users;
  }

  addUser(user: Omit<User, 'id' | 'last_login'>): User {
    const newUser: User = {
      ...user,
      id: generateId(),
      last_login: undefined
    };
    this.users = [newUser, ...this.users];
    this.logAction('USER_CREATED', `Created user ${newUser.full_name} as ${newUser.role}`);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>) {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      const oldUser = this.users[idx];
      this.users[idx] = { ...oldUser, ...updates };
      this.logAction('USER_UPDATED', `Updated user ${oldUser.full_name}`);
    }
  }

  // --- System Logs ---

  getSystemLogs(): SystemLog[] {
    return this.systemLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private logAction(action: string, details: string) {
    if (!this.currentUser) return;
    this.systemLogs.unshift({
      id: generateId(),
      timestamp: new Date().toISOString(),
      actor_id: this.currentUser.id,
      actor_name: this.currentUser.full_name,
      actor_role: this.currentUser.role,
      action,
      details
    });
  }

  // --- Projects & Workflow ---

  getProjects(user: User): Project[] {
    // For CEO/CMO/Admin, show most things
    if ([Role.CEO, Role.CMO, Role.ADMIN, Role.OPS].includes(user.role)) {
      return this.projects;
    }
    // For Writers/Creatives, show assigned or created by them
    return this.projects;
  }

  getProjectById(id: string): Project | undefined {
    return this.projects.find(p => p.id === id);
  }

  createProject(title: string, channel: Channel, dueDate: string, contentType: ContentType = 'VIDEO'): Project {
    const workflow = WORKFLOWS[channel];
    const firstStep = workflow[0];

    const newProject: Project = {
      id: generateId(),
      title,
      channel,
      content_type: contentType,
      current_stage: firstStep.stage,
      assigned_to_role: firstStep.role,
      status: TaskStatus.TODO,
      priority: 'NORMAL',
      due_date: dueDate,
      created_at: new Date().toISOString(),
      data: {},
      history: [
        {
          id: generateId(),
          stage: firstStep.stage,
          actor_id: this.currentUser?.id || 'system',
          actor_name: this.currentUser?.full_name || 'System',
          action: 'CREATED',
          timestamp: new Date().toISOString(),
        }
      ]
    };

    this.projects = [newProject, ...this.projects];
    this.logAction('PROJECT_CREATED', `Created project ${title} for ${channel}`);
    return newProject;
  }

  updateProjectData(projectId: string, newData: Partial<ProjectData>) {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      project.data = { ...project.data, ...newData };
      // If writer is typing, set to In Progress
      if (project.assigned_to_role === Role.WRITER && project.status === TaskStatus.TODO) {
        project.status = TaskStatus.IN_PROGRESS;
      }
    }
  }

  // WRITER SUBMITS TO CMO
  submitToReview(projectId: string) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    // Logic: If in SCRIPT stage, Next is SCRIPT_REVIEW_L1 (CMO)
    // Using WORKFLOWS array to strictly find next step
    const workflow = WORKFLOWS[project.channel];
    const currentIndex = workflow.findIndex(step => step.stage === project.current_stage);
    const nextStep = workflow[currentIndex + 1];

    if (nextStep) {
      project.history.push({
        id: generateId(),
        stage: project.current_stage,
        actor_id: this.currentUser?.id || 'unknown',
        actor_name: this.currentUser?.full_name || 'Unknown',
        action: 'SUBMITTED',
        timestamp: new Date().toISOString()
      });

      project.current_stage = nextStep.stage;
      project.assigned_to_role = nextStep.role;
      project.status = TaskStatus.WAITING_APPROVAL;

      this.logAction('WORKFLOW_SUBMIT', `Submitted ${project.title} to ${nextStep.role}`);
    }
  }

  advanceWorkflow(projectId: string, comment?: string) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    const workflow = WORKFLOWS[project.channel];
    const currentIndex = workflow.findIndex(step => step.stage === project.current_stage);
    const nextStep = workflow[currentIndex + 1];

    if (nextStep) {
      const action = this.isApprovalStage(project.current_stage) ? 'APPROVED' : 'SUBMITTED';

      project.history.push({
        id: generateId(),
        stage: project.current_stage,
        actor_id: this.currentUser?.id || 'unknown',
        actor_name: this.currentUser?.full_name || 'Unknown',
        action: action,
        comment,
        timestamp: new Date().toISOString()
      });

      this.logAction('WORKFLOW_ADVANCE', `${action} project ${project.title} at ${project.current_stage}`);

      project.current_stage = nextStep.stage;
      project.assigned_to_role = nextStep.role;
      // If next is an approver, status is Waiting Approval. Else it's Todo for the worker.
      project.status = this.isApprovalStage(nextStep.stage) ? TaskStatus.WAITING_APPROVAL : TaskStatus.TODO;
    } else {
      // Workflow complete
      project.status = TaskStatus.DONE;
      project.history.push({
        id: generateId(),
        stage: project.current_stage,
        actor_id: this.currentUser?.id || 'unknown',
        actor_name: this.currentUser?.full_name || 'Unknown',
        action: 'PUBLISHED',
        comment: 'Workflow Completed',
        timestamp: new Date().toISOString()
      });
    }
  }

  rejectTask(projectId: string, targetStage: WorkflowStage, comment: string) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    const workflow = WORKFLOWS[project.channel];
    const targetStep = workflow.find(s => s.stage === targetStage);

    if (targetStep) {
      project.history.push({
        id: generateId(),
        stage: project.current_stage,
        actor_id: this.currentUser?.id || 'unknown',
        actor_name: this.currentUser?.full_name || 'Unknown',
        action: 'REJECTED',
        comment,
        timestamp: new Date().toISOString()
      });

      this.logAction('WORKFLOW_REJECT', `Rejected project ${project.title} back to ${targetStage}`);

      project.current_stage = targetStage;
      project.assigned_to_role = targetStep.role;
      project.status = TaskStatus.REJECTED;
    }
  }

  private isApprovalStage(stage: WorkflowStage): boolean {
    return [
      WorkflowStage.SCRIPT_REVIEW_L1,
      WorkflowStage.SCRIPT_REVIEW_L2,
      WorkflowStage.FINAL_REVIEW_CMO,
      WorkflowStage.FINAL_REVIEW_CEO
    ].includes(stage);
  }
}

export const db = new MockDb();