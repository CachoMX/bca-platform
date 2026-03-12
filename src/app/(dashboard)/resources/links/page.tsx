'use client';

import {
  Globe,
  Scale,
  GraduationCap,
  FileText,
  ExternalLink,
} from 'lucide-react';
import Header from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';

/* -------------------------------------------------- */
/*  Link data                                          */
/* -------------------------------------------------- */

interface UsefulLink {
  title: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const LINKS: UsefulLink[] = [
  {
    title: 'BCA Website',
    description: 'Official Benjamin Chaise & Associates company website with services and contact information.',
    url: 'https://www.benjaminchaise.com',
    icon: Globe,
  },
  {
    title: 'Debt Collection Guidelines',
    description: 'Federal and state regulations for debt collection practices and compliance requirements.',
    url: 'https://www.ftc.gov/legal-library/browse/rules/fair-debt-collection-practices-act-text',
    icon: Scale,
  },
  {
    title: 'Training Portal',
    description: 'Access training materials, onboarding documentation, and skill development resources.',
    url: 'https://training.benjaminchaise.com',
    icon: GraduationCap,
  },
  {
    title: 'Company Policy Documents',
    description: 'Employee handbook, company policies, procedures, and operational guidelines.',
    url: 'https://docs.benjaminchaise.com/policies',
    icon: FileText,
  },
];

/* -------------------------------------------------- */
/*  Main Page                                          */
/* -------------------------------------------------- */

export default function UsefulLinksPage() {
  return (
    <>
      <Header title="Useful Links" />

      <div className="mx-auto max-w-[1200px] pt-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.title}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <Card className="h-full transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-glow)]">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors group-hover:bg-[var(--accent-subtle)]"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <Icon
                        className="h-6 w-6 transition-colors"
                        style={{ color: 'var(--accent)' }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className="text-sm font-semibold transition-colors group-hover:text-[var(--accent)]"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {link.title}
                        </h3>
                        <ExternalLink
                          className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ color: 'var(--accent)' }}
                        />
                      </div>
                      <p
                        className="mt-1 text-sm leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {link.description}
                      </p>
                      <p
                        className="mt-2 truncate text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {link.url}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}
