"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";

export default function DebugPage() {
  const { user, userProfile, loading } = useUser();
  const [dbData, setDbData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then(token =>
      fetch("/api/debug-db", { headers: { authorization: `Bearer ${token}` } })
    ).then(r => r.json()).then(setDbData).catch(e => setError(e.message));
  }, [user]);

  if (loading) return <div className="p-8">جاري التحميل...</div>;
  if (!user) return <div className="p-8 text-red-500">غير مسجّل الدخول</div>;

  return (
    <div className="p-8 font-mono text-sm" dir="ltr">
      <h1 className="text-xl font-bold mb-4">🔍 Database Debug</h1>

      <div className="mb-6 p-4 bg-blue-50 rounded border">
        <h2 className="font-bold mb-2">Current User (Client)</h2>
        <p>UID: {user.uid}</p>
        <p>Email: {user.email}</p>
        <p>Profile loaded: {userProfile ? "✅ YES" : "❌ NO"}</p>
        {userProfile && <>
          <p>Profile role: <strong>{userProfile.role}</strong></p>
          <p>Profile orgId: <strong>{userProfile.organizationId || "NONE"}</strong></p>
        </>}
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">{error}</div>}

      {dbData && <>
        <div className="mb-6 p-4 bg-green-50 rounded border">
          <h2 className="font-bold mb-2">Current User (Server)</h2>
          <p>UID: {dbData.currentUser?.uid}</p>
          <p>Email: {dbData.currentUser?.email}</p>
          <p>Role: <strong>{dbData.currentUser?.role}</strong></p>
          <p>OrganizationId: <strong>{dbData.currentUser?.organizationId || "-"}</strong></p>
        </div>

        <div className="mb-6">
          <h2 className="font-bold mb-2">Users ({dbData.users?.length})</h2>
          <table className="w-full border-collapse border text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Email</th>
                <th className="border p-2">Role</th>
                <th className="border p-2">OrganizationId</th>
              </tr>
            </thead>
            <tbody>
              {dbData.users?.map((u: any) => (
                <tr key={u.id}>
                  <td className="border p-2">{u.email}</td>
                  <td className="border p-2">{u.role || "❌ NONE"}</td>
                  <td className="border p-2">{u.organizationId || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}
    </div>
  );
}
