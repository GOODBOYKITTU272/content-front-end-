export enum Role {
  ADMIN = 'ADMIN',
  WRITER = 'WRITER',
  CINE = 'CINE',
  EDITOR = 'EDITOR',
  DESIGNER = 'DESIGNER',
  CMO = 'CMO',
  CEO = 'CEO',
  OPS = 'OPS',
}

export enum Channel {
  LINKEDIN = 'LINKEDIN',
  YOUTUBE = 'YOUTUBE',
  INSTAGRAM = 'INSTAGRAM',
}

export enum WorkflowStage {
  SCRIPT = 'SCRIPT',
  SCRIPT_REVIEW_L1 = 'SCRIPT_REVIEW_L1', // CMO
  SCRIPT_REVIEW_L2 = 'SCRIPT_REVIEW_L2', // CEO
  SHOOT = 'SHOOT',
  EDIT = 'EDIT',
  DESIGN = 'DESIGN',
  METADATA = 'METADATA', // Writer adds captions/tags after editing
  FINAL_REVIEW_L1 = 'FINAL_REVIEW_L1', // CMO
  FINAL_REVIEW_L2 = 'FINAL_REVIEW_L2', // CEO
  PUBLISH = 'PUBLISH',
  COMPLETED = 'COMPLETED',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  REJECTED = 'REJECTED',
  DONE = 'DONE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export type Priority = 'HIGH' | 'NORMAL';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar_url?: string;
  status: UserStatus;
  last_login?: string;
  phone?: string;
}

export interface Project {
  id: string;
  title: string;
  channel: Channel;
  current_stage: WorkflowStage;
  assigned_to_role: Role;
  assigned_to_user_id?: string; // Optional, usually assigned by role
  status: TaskStatus;
  priority: Priority;
  due_date: string;
  created_at: string;
  data: ProjectData; // Flexible JSON blob for form inputs
  history: HistoryEvent[];
}

export interface ProjectData {
  script_content?: string;
  script_notes?: string;
  shoot_date?: string;
  shoot_location?: string;
  raw_footage_link?: string;
  rough_cut_link?: string;
  master_link?: string;
  thumbnail_link?: string;
  design_assets_link?: string;
  captions?: string;
  tags?: string;
  live_url?: string;
  video_title_final?: string;
  [key: string]: any;
}

export interface HistoryEvent {
  id: string;
  stage: WorkflowStage;
  actor_id: string;
  actor_name: string;
  action: 'CREATED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  comment?: string;
  timestamp: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  actor_role: Role;
  action: string;
  details: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.WRITER]: 'Content Writer',
  [Role.CINE]: 'Cinematographer',
  [Role.EDITOR]: 'Video Editor',
  [Role.DESIGNER]: 'Graphic Designer',
  [Role.CMO]: 'CMO (Approver)',
  [Role.CEO]: 'CEO (Approver)',
  [Role.OPS]: 'Operations',
};

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  [WorkflowStage.SCRIPT]: 'Scripting',
  [WorkflowStage.SCRIPT_REVIEW_L1]: 'Script Review (CMO)',
  [WorkflowStage.SCRIPT_REVIEW_L2]: 'Script Review (CEO)',
  [WorkflowStage.SHOOT]: 'Production (Shooting)',
  [WorkflowStage.EDIT]: 'Post-Production (Editing)',
  [WorkflowStage.DESIGN]: 'Creative Design',
  [WorkflowStage.METADATA]: 'Copy & Metadata',
  [WorkflowStage.FINAL_REVIEW_L1]: 'Final Review (CMO)',
  [WorkflowStage.FINAL_REVIEW_L2]: 'Final Review (CEO)',
  [WorkflowStage.PUBLISH]: 'Publishing',
  [WorkflowStage.COMPLETED]: 'Completed',
};