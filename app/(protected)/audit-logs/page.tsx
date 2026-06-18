import { AuditLogsClient, ImportLogsClient } from "@/components/management-clients";
import { getAuditLogs, getImportLogs } from "@/lib/data";

export default async function AuditLogsPage() {
  const [logs, importLogs] = await Promise.all([getAuditLogs(), getImportLogs()]);
  return (
    <div className="space-y-6">
      <AuditLogsClient logs={logs} />
      <ImportLogsClient logs={importLogs} />
    </div>
  );
}
