'use client';

import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { data: session } = useSession();

  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b pl-14 pr-6 lg:px-6"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Left: Page title */}
      <h1
        className="text-xl font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h1>

      {/* Right: Notification bell + user avatar */}
      <div className="flex items-center gap-4">
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-subtle)';
            e.currentTarget.style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
          style={{
            backgroundColor: 'var(--accent-subtle)',
            color: 'var(--accent)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
