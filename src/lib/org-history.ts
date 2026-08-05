import { adminDb } from '@/lib/firebase-admin';

// Logs organization membership changes so beneficiaries/mentors/coaches keep a
// record of which orgs they've belonged to, not just their current one.
// Call this any time a user's organizationId is set, cleared, or switched —
// it closes out whatever membership was open and opens a new one if joining.
export async function recordOrgMembershipChange(uid: string, newOrgId: string | null): Promise<void> {
  const historyRef = adminDb.collection('users').doc(uid).collection('organizationHistory');
  const now = new Date().toISOString();

  const openSnap = await historyRef.where('leftAt', '==', null).limit(1).get();
  if (!openSnap.empty) {
    const openDoc = openSnap.docs[0];
    // No-op if "joining" the same org they're already in.
    if (newOrgId && openDoc.data().organizationId === newOrgId) return;
    await openDoc.ref.update({ leftAt: now });
  }

  if (newOrgId) {
    let organizationName = '';
    try {
      const orgSnap = await adminDb.collection('organizations').doc(newOrgId).get();
      organizationName = orgSnap.data()?.name || '';
    } catch {}
    await historyRef.add({
      organizationId: newOrgId,
      organizationName,
      joinedAt: now,
      leftAt: null,
    });
  }
}

export interface OrgHistoryEntry {
  id: string;
  organizationId: string;
  organizationName: string;
  joinedAt: string | null;
  leftAt: string | null;
}

// Reads a user's membership history, newest first. Existing users predate this
// feature and have no logged entries yet — for them, synthesize a single
// "current" entry from their live organizationId so the UI still shows
// something meaningful instead of an empty history.
export async function getOrgHistory(uid: string): Promise<OrgHistoryEntry[]> {
  const historyRef = adminDb.collection('users').doc(uid).collection('organizationHistory');
  const snap = await historyRef.get();
  const entries: OrgHistoryEntry[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as OrgHistoryEntry));

  if (entries.length === 0) {
    const userSnap = await adminDb.collection('users').doc(uid).get();
    const organizationId = userSnap.data()?.organizationId;
    if (organizationId) {
      let organizationName = '';
      try {
        const orgSnap = await adminDb.collection('organizations').doc(organizationId).get();
        organizationName = orgSnap.data()?.name || '';
      } catch {}
      entries.push({
        id: 'current',
        organizationId,
        organizationName,
        joinedAt: userSnap.data()?.createdAt || null,
        leftAt: null,
      });
    }
  }

  return entries.sort((a, b) => (b.joinedAt || '').localeCompare(a.joinedAt || ''));
}
