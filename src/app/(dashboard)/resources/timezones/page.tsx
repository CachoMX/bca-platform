'use client';

import { useState, useEffect } from 'react';
import { Clock, CloudSun, MapPin } from 'lucide-react';
import Header from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';

const US_TIMEZONES = [
  { label: 'Eastern', zone: 'America/New_York', abbr: 'ET', color: '#0891b2' },
  { label: 'Central', zone: 'America/Chicago', abbr: 'CT', color: '#7c3aed' },
  { label: 'Mountain', zone: 'America/Denver', abbr: 'MT', color: '#ea580c' },
  { label: 'Pacific', zone: 'America/Los_Angeles', abbr: 'PT', color: '#16a34a' },
  { label: 'Alaska', zone: 'America/Anchorage', abbr: 'AKT', color: '#2563eb' },
  { label: 'Hawaii', zone: 'Pacific/Honolulu', abbr: 'HT', color: '#dc2626' },
];

function LiveClock({ zone, abbr }: { zone: string; abbr: string }) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          timeZone: zone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString('en-US', {
          timeZone: zone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [zone]);

  if (!time) return <span style={{ color: 'var(--text-muted)' }}>--:--:--</span>;

  return (
    <div>
      <span
        className="text-2xl font-bold tabular-nums tracking-tight"
        style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
      >
        {time}
      </span>
      <span
        className="ml-2 text-xs font-semibold"
        style={{ color: 'var(--text-muted)' }}
      >
        {abbr}
      </span>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {date}
      </p>
    </div>
  );
}

export default function TimeZonesPage() {
  return (
    <>
      <Header title="Time Zones & Weather" />

      <div className="mx-auto max-w-[1200px] space-y-6 pt-6">
        {/* Live Time Zone Clocks */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              US Time Zones
            </h2>
            <span
              className="ml-auto flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <span
                className="inline-block h-2 w-2 animate-pulse rounded-full"
                style={{ backgroundColor: '#22c55e' }}
              />
              Live
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {US_TIMEZONES.map((tz) => (
              <Card key={tz.zone} className="transition-all hover:scale-[1.02]">
                <CardContent className="py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${tz.color}15` }}
                    >
                      <MapPin
                        className="h-4 w-4"
                        style={{ color: tz.color }}
                      />
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: tz.color }}
                    >
                      {tz.label}
                    </span>
                  </div>
                  <LiveClock zone={tz.zone} abbr={tz.abbr} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Live Weather Radar Map */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <CloudSun className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Live Weather Radar
            </h2>
          </div>

          <Card>
            <CardContent className="overflow-hidden rounded-lg p-0">
              <iframe
                src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=in&metricTemp=°F&metricWind=mph&zoom=4&overlay=rain&product=ecmwf&level=surface&lat=39.8&lon=-98.6&message=true"
                width="100%"
                height="500"
                style={{ border: 'none', display: 'block', borderRadius: '12px' }}
                title="Live Weather Radar - US"
                loading="lazy"
                allowFullScreen
              />
            </CardContent>
          </Card>
          <p
            className="mt-2 text-center text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Powered by Windy.com &mdash; Interactive weather radar with rain, wind, temperature, and more.
          </p>
        </div>
      </div>
    </>
  );
}
