Complete Frontend Guide - Karara Task Management System
=======================================================

Table of Contents
-----------------

1.  [Frontend Architecture Overview](https://app.base44.com/apps/689da29bc576e49b6356c2b4/editor/preview/Boards#frontend-architecture-overview)
2.  [Application Flow and User Journey](https://app.base44.com/apps/689da29bc576e49b6356c2b4/editor/preview/Boards#application-flow-and-user-journey)
3.  [Component Architecture](https://app.base44.com/apps/689da29bc576e49b6356c2b4/editor/preview/Boards#component-architecture)
4.  [State Management Patterns](https://app.base44.com/apps/689da29bc576e49b6356c2b4/editor/preview/Boards#state-management-patterns)
5.  [Navigation and Routing](https://app.base44.com/apps/689da29bc576e49b6356c2b4/editor/preview/Boards#navigation-and-routing)
6.  [Data Flow and API Integration](https://app.base44.com/apps/689da29bc576e49b6356c2b4/editor/preview/Boards#data-flow-and-api-integration)
7.  [UI/UX Design System](https://app.base44.com/apps/689da29bc576e49b6356c2b4/editor/preview/Boards#ui-ux-design-system)
8.  [Feature-by-Feature Breakdown](https://app.base44.com/apps/689da29bc576e49b6356c2b4/editor/preview/Boards#feature-by-feature-breakdown)
9.  [Performance Optimization](https://app.base44.com/apps/689da29bc576e49b6356c2b4/editor/preview/Boards#performance-optimization)
10. [Error Handling](https://app.base44.com/apps/689da29bc576e49b6356c2b4/editor/preview/Boards#error-handling)
11. [Development Workflow](https://app.base44.com/apps/689da29bc576e49b6356c2b4/editor/preview/Boards#development-workflow)

* * * * *

1\. Frontend Architecture Overview
----------------------------------

### Technology Stack

```
React (UI Library)
├── Tailwind CSS (Styling Framework)
├── Shadcn/UI (Component Library)
├── Lucide React (Icons)
├── React Router DOM (Navigation)
├── date-fns (Date Utilities)
├── Recharts (Charts & Analytics)
└── Base44 SDK (Backend Integration)

```

### Application Structure

```
src/
├── Layout.js                 # Main layout wrapper
├── pages/                    # Main application pages
│   ├── Dashboard.js         # Home dashboard
│   ├── Boards.js            # Kanban boards
│   ├── RecurringTasks.js    # Recurring task management
│   ├── Forms.js             # Form management
│   ├── Teams.js             # Team management
│   ├── Reports.js           # Analytics & reports
│   ├── Settings.js          # User settings
│   ├── AdminUsers.js        # User management (admin)
│   ├── CompleteProfile.js   # Profile completion
│   └── NoTeamAssigned.js    # Team assignment flow
├── components/              # Reusable components
│   ├── dashboard/           # Dashboard-specific components
│   ├── boards/              # Kanban-specific components
│   ├── forms/               # Form-related components
│   ├── teams/               # Team management components
│   ├── reports/             # Analytics components
│   └── utils/               # Utility components & services
└── entities/                # Data models (JSON schemas)

```

* * * * *

2\. Application Flow and User Journey
-------------------------------------

### Authentication Flow

```
graph TD
    A[User visits app] --> B{Authenticated?}
    B -->|No| C[Redirect to Base44 login]
    B -->|Yes| D{Profile complete?}
    C --> E[Google/Email login] --> F[Return to app] --> D
    D -->|No| G[CompleteProfile page]
    D -->|Yes| H{Has team assignment?}
    G --> I[Fill profile info] --> J[Auto-assign to teams] --> K[Dashboard]
    H -->|No| L[NoTeamAssigned page]
    H -->|Yes| K[Dashboard]
    L --> M[Wait for admin assignment] --> K

```

### Main User Journey

```
graph LR
    A[Dashboard] --> B[View Tasks]
    A --> C[View Forms]
    A --> D[Notifications]

    B --> B1[Kanban Board]
    B1 --> B2[Update Status]
    B1 --> B3[Create Task]
    B1 --> B4[Edit Task]

    C --> C1[Complete Form]
    C --> C2[View Submissions]

    D --> D1[Task Reminders]
    D --> D2[Form Deadlines]

```

* * * * *

3\. Component Architecture
--------------------------

### Layout Component (`Layout.js`)

Purpose: Main application shell that wraps all pages Key Features:

-   Responsive sidebar navigation
-   User authentication checking
-   Profile completion flow
-   Team assignment verification
-   User dropdown with logout functionality

```
// Key responsibilities:
1. Authentication state management
2. Navigation menu rendering
3. User profile display
4. Responsive design handling
5. Route protection

```

### Page Components Pattern

All page components follow this structure:

```
export default function PageName() {
  // 1. State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // 2. Data loading on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // 3. Data manipulation functions
  const loadInitialData = async () => { /* ... */ };
  const handleCreate = async () => { /* ... */ };
  const handleUpdate = async () => { /* ... */ };
  const handleDelete = async () => { /* ... */ };

  // 4. Render with loading states
  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      {/* Page content */}
    </div>
  );
}

```

### Component Composition Strategy

#### Dashboard Components

```
Dashboard.js
├── QuickStats.jsx           # KPI cards
├── TasksSummary.jsx         # Today's tasks widget
├── FormsSummary.jsx         # Today's forms widget
├── NotificationCenter.jsx   # Notifications panel
└── RecentActivity.jsx       # Activity feed

```

#### Boards Components

```
Boards.js
├── TeamSelector.jsx         # Team selection dropdown
├── KanbanBoard.jsx         # Main kanban container
├── TaskCard.jsx            # Individual task cards
├── TaskModal.jsx           # Task details modal
├── CreateTaskModal.jsx     # New task creation
└── RecurringTaskCard.jsx   # Recurring task templates

```

#### Forms Components

```
Forms.js
├── FormScheduleModal.jsx   # Schedule creation/editing
├── ScheduleCard.jsx        # Schedule display cards
├── ImportFormModal.jsx     # Form import functionality
├── FormAnalytics.jsx       # Form performance metrics
├── PendingAssignments.jsx  # Pending form tasks
└── RecentSubmissions.jsx   # Recent form completions

```

* * * * *

4\. State Management Patterns
-----------------------------

### Local State Pattern (React useState)

Each component manages its own state for:

-   UI state (loading, modals open/closed)
-   Form input values
-   Local data that doesn't need to be shared

```
const [showModal, setShowModal] = useState(false);
const [formData, setFormData] = useState({});
const [loading, setLoading] = useState(true);

```

### Data Fetching Pattern

Consistent pattern across all components:

```
// 1. Initial data loading
useEffect(() => {
  loadData();
}, []);

// 2. Dependency-based reloading
useEffect(() => {
  if (selectedTeam) {
    loadTeamData(selectedTeam.id);
  }
}, [selectedTeam]);

// 3. Event-driven reloading
const handleUpdate = async () => {
  await updateEntity(data);
  await loadData(); // Refresh after update
};

```

### User State Management

User authentication state is managed in `Layout.js` and passed down to components that need it:

```
// In Layout.js
const [user, setUser] = useState(null);
useEffect(() => {
  const checkUser = async () => {
    const currentUser = await User.me();
    setUser(currentUser);
  };
  checkUser();
}, []);

// In child components
const ComponentName = ({ user }) => {
  // Use user data
};

```

* * * * *

5\. Navigation and Routing
--------------------------

### Navigation Structure

The application uses React Router DOM for client-side routing:

```
// Navigation items defined in Layout.js
const navigationItems = [
  { title: "داشبورد", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "کانبان تیم‌ها", url: createPageUrl("Boards"), icon: Kanban },
  { title: "کارهای تکراری", url: createPageUrl("RecurringTasks"), icon: Repeat },
  { title: "فرم‌ها و چک‌لیست‌ها", url: createPageUrl("Forms"), icon: FileText },
  { title: "گزارشات", url: createPageUrl("Reports"), icon: BarChart3 },
  { title: "تیم‌ها", url: createPageUrl("Teams"), icon: Users },
  { title: "تنظیمات", url: createPageUrl("Settings"), icon: Settings }
];

```

### Navigation Best Practices

#### For Links:

```
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Use Link for navigation that doesn't need to reload
<Link to={createPageUrl("Dashboard")}>Dashboard</Link>

```

#### For Programmatic Navigation:

```
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const navigate = useNavigate();
const handleSave = () => {
  // After saving, navigate to another page
  navigate(createPageUrl('Teams'));
};

```

#### For URL Parameters:

```
// Passing parameters
const editUrl = createPageUrl(`FormEditor?formId=${form.id}`);

// Reading parameters
const urlParams = new URLSearchParams(window.location.search);
const formId = urlParams.get('formId');

```

* * * * *

6\. Data Flow and API Integration
---------------------------------

### Base44 SDK Usage Pattern

#### Entity Operations:

```
import { Task, Team, User } from '@/entities/all';

// CREATE
const newTask = await Task.create({
  title: "New Task",
  board_id: boardId,
  list_id: listId
});

// READ - List all
const allTasks = await Task.list('-created_date', 50);

// READ - Filter with conditions
const myTasks = await Task.filter({
  assignee_id: user.id,
  status: 'todo'
}, 'due_at', 20);

// READ - Get single item
const task = await Task.get(taskId);

// UPDATE
await Task.update(taskId, {
  status: 'done',
  completed_at: new Date().toISOString()
});

// DELETE
await Task.delete(taskId);

```

#### User Management:

```
// Get current user
const currentUser = await User.me();

// Update user profile
await User.updateMyUserData({
  first_name: "John",
  profile_completed: true
});

// Logout
await User.logout();

```

### Data Loading Patterns

#### Single Entity Loading:

```
const loadTasks = async () => {
  try {
    setLoading(true);
    const tasks = await Task.filter({ board_id: selectedBoard.id });
    setTasks(tasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
  } finally {
    setLoading(false);
  }
};

```

#### Related Data Loading:

```
const loadTeamData = async (teamId) => {
  try {
    // Load multiple related entities
    const [team, boards, members, templates] = await Promise.all([
      Team.get(teamId),
      Board.filter({ team_id: teamId }),
      TeamMember.filter({ team_id: teamId }),
      TaskTemplate.filter({ team_id: teamId })
    ]);

    setTeam(team);
    setBoards(boards);
    setMembers(members);
    setTemplates(templates);
  } catch (error) {
    console.error('Error loading team data:', error);
  }
};

```

#### Bulk Operations:

```
// Create multiple records
const tasks = await Task.bulkCreate([
  { title: "Task 1", board_id: boardId, list_id: listId },
  { title: "Task 2", board_id: boardId, list_id: listId }
]);

// Update multiple records
await Promise.all(
  selectedTasks.map(task =>
    Task.update(task.id, { status: 'done' })
  )
);

```

* * * * *

7\. UI/UX Design System
-----------------------

### CSS Architecture

The application uses Tailwind CSS with a custom design system:

#### Color Palette:

```
:root {
  --primary-blue: #1e40af;
  --primary-orange: #ea580c;
  --warm-gray: #78716c;
  --light-blue: #dbeafe;
  --soft-orange: #fed7aa;
}

```

#### Typography:

```
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Vazirmatn', system-ui, sans-serif;
  direction: rtl; /* Persian/Arabic support */
}

```

### Reusable CSS Classes:

#### Glass Effect:

```
.glass-effect {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

```

#### Hover Animations:

```
.hover-lift {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(30, 64, 175, 0.15);
}

```

### Component Styling Patterns:

#### Cards:

```
<Card className="glass-effect border-none shadow-lg hover-lift">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content
  </CardContent>
</Card>

```

#### Buttons:

```
// Primary button
<Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover-lift">
  Primary Action
</Button>

// Secondary button
<Button variant="outline" className="hover-lift">
  Secondary Action
</Button>

```

#### Status Badges:

```
const getPriorityColor = (priority) => {
  const colors = {
    urgent: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };
  return colors[priority] || colors.medium;
};

<Badge className={getPriorityColor(task.priority)}>
  {priority}
</Badge>

```

### Responsive Design:

```
// Grid layouts that adapt to screen size
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</div>

// Responsive sidebar
<aside className={`
  fixed lg:static
  w-80 lg:w-64
  transform ${sidebarOpen ? 'translateX-0' : 'translateX-full'}
  lg:transform-none
  transition-transform duration-300
`}>

```

* * * * *

8\. Feature-by-Feature Breakdown
--------------------------------

### Dashboard Feature

Purpose: Central hub showing today's priorities and quick stats

Components:

-   `QuickStats`: Shows counts of today's tasks, forms, overdue items, and teams
-   `TasksSummary`: Lists today's tasks with quick action buttons (start, complete, snooze)
-   `FormsSummary`: Shows pending form assignments with completion links
-   `NotificationCenter`: Real-time notifications with mark-as-read functionality
-   `RecentActivity`: Shows recent team activity (mock data currently)

Key Interactions:

```
// Task status change from dashboard
const handleStatusChange = async (task, newStatus) => {
  await Task.update(task.id, { ...task, status: newStatus });
  if (newStatus === 'done') {
    // Move to Done list
    const doneList = await List.filter({ board_id: task.board_id, name_en: 'Done' });
    await Task.update(task.id, { list_id: doneList[0].id });
  }
  loadTasks(); // Refresh
};

// Task snoozing
const handleSnooze = async (task, minutes) => {
  const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
  await Task.update(task.id, {
    due_at: snoozeUntil.toISOString(),
    snooze_count: (task.snooze_count || 0) + 1
  });
};

```

### Boards Feature

Purpose: Kanban-style task management with team collaboration

Components:

-   `TeamSelector`: Dropdown to switch between teams
-   `KanbanBoard`: Main board layout with drag-and-drop
-   `TaskCard`: Individual task display with priority/status badges
-   `TaskModal`: Detailed task editing with all fields
-   `CreateTaskModal`: New task creation form
-   `RecurringTaskCard`: Template management for recurring tasks

Key Interactions:

```
// Drag and drop task movement
const handleTaskMove = async (taskId, newListId) => {
  const task = tasks.find(t => t.id === taskId);
  await Task.update(taskId, { ...task, list_id: newListId });
  loadBoardData(); // Refresh board
};

// Task creation with position calculation
const handleCreateTask = async (taskData) => {
  const listTasks = tasks.filter(t => t.list_id === taskData.list_id);
  const maxPosition = Math.max(...listTasks.map(t => t.position || 0), 0);

  await Task.create({
    ...taskData,
    position: maxPosition + 1
  });
};

```

### Forms Feature

Purpose: Create, schedule, and manage organizational forms and checklists

Components:

-   `FormEditor`: Visual form builder with drag-and-drop fields
-   `FormScheduleModal`: Set up recurring form assignments
-   `FormAnalytics`: Performance metrics and completion rates
-   `PendingAssignments`: List of forms awaiting completion
-   `RecentSubmissions`: Latest form submissions with data

Key Interactions:

```
// Form scheduling creates assignments and tasks
const handleSaveSchedule = async (scheduleData) => {
  const schedule = await FormSchedule.create(scheduleData);

  // Generate initial assignments
  for (const assigneeId of scheduleData.assignee_ids) {
    const assignment = await FormAssignment.create({
      form_id: scheduleData.form_id,
      schedule_id: schedule.id,
      assignee_id: assigneeId,
      due_at: calculateDueDate(scheduleData.due_time)
    });

    // Create linked kanban task
    const task = await Task.create({
      title: `Complete Form: ${form.title}`,
      form_assignment_id: assignment.id,
      assignee_id: assigneeId,
      due_at: assignment.due_at
    });

    // Link them together
    await FormAssignment.update(assignment.id, { task_id: task.id });
  }
};

```

### Teams Feature

Purpose: Organize users into working groups with role-based access

Components:

-   `TeamCard`: Display team info with member counts
-   `CreateTeamModal`: Team creation/editing form
-   `ManageMembersModal`: Add/remove team members with roles

Key Interactions:

```
// Adding members to team
const handleAddMember = async (teamId, userId, role) => {
  await TeamMember.create({
    team_id: teamId,
    user_id: userId,
    role: role,
    joined_at: new Date().toISOString()
  });

  // Create default board if team's first member
  const existingMembers = await TeamMember.filter({ team_id: teamId });
  if (existingMembers.length === 1) {
    const board = await Board.create({
      team_id: teamId,
      name: `Board ${team.name}`
    });
    await createDefaultLists(board);
  }
};

```

### Reports Feature

Purpose: Analytics dashboard with performance metrics and trends

Components:

-   `ReportFilters`: Date range and team selection
-   `PerformanceKPIs`: Key metrics cards
-   `TaskTrendsChart`: Line chart of task creation vs completion
-   `TeamPerformanceChart`: Bar chart of team productivity
-   `TaskStatusDistribution`: Pie chart of task statuses
-   `DetailedTaskTable`: Sortable/filterable task list

Key Interactions:

```
// Dynamic data filtering and aggregation
const loadAnalytics = async () => {
  const { dateRange, teamId } = filters;

  let tasks = await Task.list('-created_date', 1000);

  // Filter by date range
  tasks = tasks.filter(task => {
    const taskDate = new Date(task.created_date);
    return taskDate >= dateRange.from && taskDate <= dateRange.to;
  });

  // Filter by team
  if (teamId !== 'all') {
    const teamBoards = await Board.filter({ team_id: teamId });
    const boardIds = teamBoards.map(b => b.id);
    tasks = tasks.filter(task => boardIds.includes(task.board_id));
  }

  // Calculate metrics
  const analytics = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    completionRate: Math.round((completedTasks / tasks.length) * 100),
    overdueTasks: tasks.filter(t => isOverdue(t)).length
  };

  setAnalyticsData(analytics);
};

```

* * * * *

9\. Performance Optimization
----------------------------

### Data Loading Strategies

#### Lazy Loading:

```
// Load data only when needed
const [data, setData] = useState([]);
const [hasLoaded, setHasLoaded] = useState(false);

const loadData = async () => {
  if (hasLoaded) return; // Don't reload unnecessarily

  setLoading(true);
  const result = await Entity.list();
  setData(result);
  setHasLoaded(true);
  setLoading(false);
};

// Trigger loading on first render or dependency change
useEffect(() => {
  if (shouldLoad && !hasLoaded) {
    loadData();
  }
}, [shouldLoad]);

```

#### Batched Requests:

```
// Load related data in parallel instead of sequentially
const loadDashboard = async () => {
  const [user, tasks, forms, notifications] = await Promise.all([
    User.me(),
    Task.filter({ assignee_id: user.id }),
    FormAssignment.filter({ assignee_id: user.id }),
    Notification.filter({ user_id: user.id }, '-created_date', 10)
  ]);

  setUser(user);
  setTasks(tasks);
  setForms(forms);
  setNotifications(notifications);
};

```

#### Selective Re-rendering:

```
// Use React.memo for components that don't need frequent updates
const TaskCard = React.memo(({ task, onUpdate }) => {
  // Component only re-renders if task prop changes
  return <div>{task.title}</div>;
});

// Use dependency arrays in useEffect to control when effects run
useEffect(() => {
  loadTeamData(selectedTeam.id);
}, [selectedTeam.id]); // Only run when team changes, not on every render

```

### Image and Asset Optimization:

```
// Use optimized images from Unsplash with size parameters
const heroImage = "https://images.unsplash.com/photo-id?w=1200&h=600&fit=crop";

// Lazy load images when in viewport
<img
  src={imageUrl}
  loading="lazy"
  alt="Description"
  className="w-full h-auto object-cover"
/>

```

* * * * *

10\. Error Handling
-------------------

### API Error Handling:

```
// Standard error handling pattern
const handleApiCall = async () => {
  try {
    setLoading(true);
    const result = await Entity.operation();
    setData(result);
  } catch (error) {
    console.error('Operation failed:', error);

    // Handle specific error types
    if (error.response?.status === 429) {
      alert('Too many requests. Please wait and try again.');
    } else if (error.response?.status === 403) {
      alert('You don\'t have permission for this action.');
    } else {
      alert('An error occurred. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

```

### Form Validation:

```
// Client-side validation before API calls
const validateForm = (formData) => {
  const errors = {};

  if (!formData.title?.trim()) {
    errors.title = 'Title is required';
  }

  if (!formData.due_at) {
    errors.due_at = 'Due date is required';
  } else if (new Date(formData.due_at) < new Date()) {
    errors.due_at = 'Due date cannot be in the past';
  }

  return errors;
};

const handleSubmit = async (formData) => {
  const errors = validateForm(formData);
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }

  try {
    await Entity.create(formData);
    alert('Created successfully!');
  } catch (error) {
    console.error('Creation failed:', error);
    alert('Failed to create. Please try again.');
  }
};

```

### Loading States:

```
// Show loading indicators for better user experience
if (loading) {
  return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <span className="ml-3 text-slate-600">Loading...</span>
    </div>
  );
}

// Show empty states when no data
if (!loading && data.length === 0) {
  return (
    <div className="text-center py-12">
      <EmptyIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
      <h3 className="text-xl font-semibold text-slate-600 mb-2">No Data Found</h3>
      <p className="text-slate-500 mb-6">Get started by creating your first item.</p>
      <Button onClick={handleCreate}>Create New</Button>
    </div>
  );
}

```

* * * * *

11\. Development Workflow
-------------------------

### Adding New Features

#### 1\. Plan the Feature:

-   Define the user story
-   Identify required entities/data changes
-   Sketch the UI components
-   Plan the component hierarchy

#### 2\. Create/Update Entities:

```
// entities/NewEntity.json
{
  "name": "NewEntity",
  "type": "object",
  "properties": {
    "field1": {"type": "string", "description": "..."},
    "field2": {"type": "number", "description": "..."}
  },
  "required": ["field1"]
}

```

#### 3\. Build Components:

```
// components/feature/NewComponent.jsx
import React, { useState, useEffect } from 'react';
import { NewEntity } from '@/entities/NewEntity';

export default function NewComponent() {
  // Component logic
}

```

#### 4\. Create/Update Pages:

```
// pages/NewPage.js
import React from 'react';
import NewComponent from '../components/feature/NewComponent';

export default function NewPage() {
  return (
    <div className="page-container">
      <NewComponent />
    </div>
  );
}

```

#### 5\. Update Navigation:

```
// Layout.js - Add to navigationItems
{
  title: "New Feature",
  titleEn: "New Feature",
  url: createPageUrl("NewPage"),
  icon: NewIcon,
}

```

### Testing New Features:

```
// Test data flow
1. Create test entities in dashboard
2. Verify CRUD operations work
3. Test edge cases (empty states, validation)
4. Check responsive design on mobile
5. Test navigation and back buttons

```

### Debugging Tips:

```
// Use console.log strategically
console.log('Loading data for team:', teamId);
console.log('API response:', data);
console.log('State after update:', newState);

// Check Base44 SDK calls
console.log('Calling Entity.filter with:', filterParams);

// Monitor re-renders
useEffect(() => {
  console.log('Component re-rendered with props:', props);
});

```

* * * * *

This comprehensive guide covers the entire frontend architecture and workflow of your Karara application. Each section provides both conceptual understanding and practical code examples that you can reference when working with or extending the application.

The key to working effectively with this frontend is understanding the data flow patterns, component composition strategies, and the Base44 SDK integration points. Always start with the data model, then build your UI components around that structure.
