import {
  LayoutDashboard,
  Phone,
  Clock,
  Users,
  BarChart3,
  MessageSquare,
  BookOpen,
  Link2,
  Building2,
  Settings,
  UserCog,
  Timer,
  Star,
  MessageCircle,
  FileUp,
  Video,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: number[]; // UserRole values that can access this
  children?: NavItem[];
}

// Role IDs: 1=Admin, 2=Manager, 3=Closer, 4=Rep
const ALL_ROLES = [1, 2, 3, 4];
const ADMIN_ONLY = [1];
const ADMIN_MANAGER = [1, 2];

export const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    label: 'Calls',
    href: '/calls',
    icon: Phone,
    roles: ALL_ROLES,
  },
  {
    label: 'Time Clock',
    href: '/clock',
    icon: Clock,
    roles: ALL_ROLES,
  },
  {
    label: 'Existing Clients',
    href: '/clients',
    icon: Users,
    roles: ALL_ROLES,
  },
  {
    label: 'Training',
    href: '/training',
    icon: BookOpen,
    roles: ALL_ROLES,
  },
  {
    label: 'SMS',
    href: '/sms',
    icon: MessageSquare,
    roles: ADMIN_MANAGER,
  },
  {
    label: 'Resources',
    href: '/resources/links',
    icon: Link2,
    roles: ALL_ROLES,
    children: [
      { label: 'Useful Links', href: '/resources/links', icon: Link2, roles: ALL_ROLES },
      { label: 'Business Entities', href: '/resources/entities', icon: Building2, roles: ALL_ROLES },
    ],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ADMIN_MANAGER,
    children: [
      { label: 'Call Reports', href: '/reports', icon: BarChart3, roles: ADMIN_MANAGER },
      { label: 'Video Reports', href: '/reports/videos', icon: Video, roles: ADMIN_MANAGER },
    ],
  },
];

export const adminNavigation: NavItem[] = [
  {
    label: 'Users',
    href: '/admin/users',
    icon: UserCog,
    roles: ADMIN_ONLY,
  },
  {
    label: 'Time Management',
    href: '/admin/time',
    icon: Timer,
    roles: ADMIN_ONLY,
  },
  {
    label: 'Quotes',
    href: '/admin/quotes',
    icon: Star,
    roles: ADMIN_ONLY,
  },
  {
    label: 'Rebuttals',
    href: '/admin/rebuttals',
    icon: MessageCircle,
    roles: ADMIN_ONLY,
  },
  {
    label: 'Import Leads',
    href: '/admin/import',
    icon: FileUp,
    roles: ADMIN_ONLY,
  },
];
