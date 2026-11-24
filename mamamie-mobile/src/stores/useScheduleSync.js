import { useEffect } from 'react';
import { useOnboarding } from './onboardingStore';
import { useJournal } from './journalStore';
import { planScheduleSync, scheduleSignature } from '../services/clinicalSchedule';

// Keeps the clinical care plan in the journal in step with the profile. Runs once the journal
// has loaded and again whenever the profile changes (for example after editing the due date).
export function useScheduleSync() {
  const { profile } = useOnboarding();
  const journal = useJournal();
  const { loaded } = journal;

  useEffect(() => {
    if (!loaded || !profile) return;
    const signature = scheduleSignature(profile);
    const redate = signature !== journal.state.scheduleSignature;
    const { upserts, removeIds } = planScheduleSync(journal.entriesById, profile, redate);
    if (upserts.length || removeIds.length || redate) journal.applySchedule(upserts, removeIds, signature);
    // Only re-run on load and profile changes; the journal itself changing must not re-trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, profile]);
}
