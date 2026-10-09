import { UserRound } from "lucide-react";

import "./pending-applications-popover.css";

export type PendingApplication = { id: string; name: string; time: string };

export function PendingApplicationsPopover({ applications, onReject, onApprove }: { applications: PendingApplication[]; onReject: (id: string) => void; onApprove: (id: string) => void }) {
    return (
        <div className={`pending-applications-popover${applications.length > 1 ? " is-multiple" : ""}`} role="dialog" aria-label="待处理申请">
            {applications.length === 0 ? <div className="pending-applications-popover__empty">暂无待处理申请</div> : applications.map((application) => (
                <div className="pending-applications-popover__item" key={application.id}>
                    <span className="pending-applications-popover__avatar"><UserRound aria-hidden="true" /></span>
                    <span className="pending-applications-popover__name">{application.name}</span>
                    <span className="pending-applications-popover__time">{application.time}</span>
                    <div className="flex flex-row flex-1 gap-2">
                    <button type="button" className="pending-applications-popover__reject" onClick={() => onReject(application.id)}>拒绝</button>
                    <button type="button" className="pending-applications-popover__approve" onClick={() => onApprove(application.id)}>通过</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
