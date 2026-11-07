export type TodoPriority = 'High' | 'Medium' | 'Low';
export type TodoCategory = 'Work' | 'Meeting Prep' | 'Follow Up' | 'Personal' | 'Review' | 'Urgent';

export interface PersonalTodo {
  id: string;
  ownerId?: string;
  ownerName: string;
  title: string;
  completed: boolean;
  priority: TodoPriority;
  dueDate?: string;
  category?: TodoCategory | string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export type NoteColor = 'sky' | 'amber' | 'emerald' | 'purple' | 'rose' | 'slate';

export interface PersonalNote {
  id: string;
  ownerId?: string;
  ownerName: string;
  title: string;
  content: string;
  pinned: boolean;
  colorTag: NoteColor;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

