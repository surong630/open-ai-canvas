import type { CanvasNodeData, CanvasNodeMetadata } from "@/types/canvas";

/** 查询/消费异常不是任务终态。只标记恢复诊断，不覆盖成功结果或新的任务绑定。 */
export function markCanvasTaskRecoveryUnconfirmed(node: CanvasNodeData, expectedTaskId: string | undefined, detail: string): CanvasNodeData {
    if (node.metadata?.status === "success" || node.metadata?.taskId !== expectedTaskId) return node;
    return { ...node, metadata: { ...node.metadata, errorDetails: detail } };
}

// 失败节点再次提交前必须移除旧任务绑定，否则批次调度会把它误判为仍在处理。
export function resetGenerationTaskMetadata(metadata: CanvasNodeMetadata | undefined, status: CanvasNodeMetadata["status"] = "idle"): CanvasNodeMetadata {
    const next = {
        ...(metadata || {}),
        status,
        errorDetails: undefined,
        generationErrorCode: undefined,
        resourceReloadAvailable: undefined,
        failedPromptFingerprint: undefined,
    };
    delete next.taskId;
    delete next.taskClientOperationId;
    delete next.retryOf;
    delete next.attemptGroupId;
    delete next.taskStatus;
    delete next.taskProgress;
    delete next.taskStage;
    delete next.taskMediaStage;
    delete next.taskCanRecoverMedia;
    delete next.taskProvider;
    delete next.taskStartedAt;
    delete next.taskCompletedAt;
    delete next.taskDurationMs;
    delete next.taskErrorCode;
    delete next.taskOfficialStatus;
    delete next.taskReceiptRecorded;
    delete next.taskCreatedAt;
    delete next.taskUpdatedAt;
    return next;
}

/**
 * Builds a stable retry operation key without Web Crypto. `crypto.subtle` is
 * unavailable on non-secure LAN origins, which must not prevent a retry from
 * reaching the backend.
 */
export function generationRetryOperationId(retryOf: string, attemptGroupId = retryOf) {
    const input = `generation-retry\0${attemptGroupId}\0${retryOf}`;
    const seeds = [2166136261, 2166136261 ^ 0x9e3779b9, 2166136261 ^ 0x85ebca6b, 2166136261 ^ 0xc2b2ae35];
    const fingerprint = seeds.map((seed) => {
        let hash = seed;
        for (let index = 0; index < input.length; index += 1) hash = Math.imul(hash ^ input.charCodeAt(index), 16777619);
        return (hash >>> 0).toString(16).padStart(8, "0");
    }).join("");
    return `retry:${fingerprint}`;
}
