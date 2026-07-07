'use client';

import React, { useEffect, useState } from 'react';
import DashboardShell from '@/src/components/DashboardShell';
import { Card } from '@/src/components/ui/primitives';

type EmergencyProfileSummary = Record<string, unknown> | null;

export default function EmergencyDashboardPage() {
  const [data, setData] = useState<EmergencyProfileSummary>(null);
  useEffect(() => {
    void fetch('/api/emergency').then((r) => r.json()).then(setData);
  }, []);
  return (
    <DashboardShell>
      <Card>
        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(data, null, 2)}</pre>
      </Card>
    </DashboardShell>
  );
}
