import { ServiceTimelineRowDTO } from "../../../../shared/dtos/repositories/service/ServiceTimelineDTO";

export class BuildServiceTimelineUseCase {
    execute(rows: ServiceTimelineRowDTO[]): any[] {
        return rows.map((row) => {
            let event = row.description || row.action;
            let details: any = {};

            if (row.action === 'CREATE') {
                event = 'Service Dibuat';
                try {
                    const data = JSON.parse(row.newValue as string || '{}');
                    details = {
                        customer: data.customer?.name,
                        phone: data.unit ? `${data.unit.brand} ${data.unit.model}` : null,
                        complaint: data.complaint,
                        technician: data.technicianId ? 'Assigned' : 'Belum ditugaskan',
                        isWalkin: data.isWalkin ? 'Walk-in' : 'Regular'
                    };
                } catch { }
            } else if (row.action === 'STATUS_CHANGE') {
                try {
                    const oldVal = JSON.parse(row.oldValue as string || '{}');
                    const newVal = JSON.parse(row.newValue as string || '{}');
                    event = `Status: ${oldVal.status || '-'} → ${newVal.status}`;
                    details = { from: oldVal.status, to: newVal.status };
                } catch {
                    event = row.description || 'Status changed';
                }
            } else if (row.action === 'ASSIGN') {
                event = 'Teknisi Ditugaskan';
            } else if (row.action === 'UPDATE') {
                event = 'Data Diperbarui';
            }

            return {
                event,
                by: row.userName || 'System',
                time: row.createdAt?.toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) || "-",
                action: row.action,
                details
            };
        });
    }
}
