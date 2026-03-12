'use client';

import Image from 'next/image';
import { CloudSun, ExternalLink } from 'lucide-react';
import Header from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';

export default function TimeZonesPage() {
  return (
    <>
      <Header title="Time Zones & Weather" />

      <div className="mx-auto max-w-[1200px] space-y-6 pt-6">
        {/* Time Zone Map */}
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <Image
              src="/timezone-map.png"
              alt="US Time Zone Map"
              width={900}
              height={500}
              className="rounded-lg"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </CardContent>
        </Card>

        {/* Weather Link */}
        <a
          href="https://weather.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <Card className="transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-glow)]">
            <CardContent className="flex items-center gap-4 p-5">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors group-hover:bg-[var(--accent-subtle)]"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <CloudSun
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
                    How&apos;s the Weather Today?
                  </h3>
                  <ExternalLink
                    className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: 'var(--accent)' }}
                  />
                </div>
                <p
                  className="mt-1 text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Check current weather conditions and forecasts across the country.
                </p>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>
    </>
  );
}
