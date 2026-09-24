import { describe, expect, test } from "bun:test";

import { generationRetryOperationId, resetGenerationTaskMetadata } from "@/lib/canvas/canvas-task-state";

describe("canvas generation retry state", () => {
    test("builds a stable operation id without requiring Web Crypto", () => {
        const first = generationRetryOperationId("task-failed", "attempt-group");
        const second = generationRetryOperationId("task-failed", "attempt-group");

        expect(first).toBe(second);
        expect(first).toMatch(/^retry:[0-9a-f]{32}$/);
        expect(generationRetryOperationId("task-other", "attempt-group")).not.toBe(first);
    });

    test("clears the failed task binding before a new retry is submitted", () => {
        const metadata = resetGenerationTaskMetadata({
            status: "error",
            taskId: "task-failed",
            taskStatus: "failed",
            taskProgress: 0,
            taskStage: "任务失败",
            taskCreatedAt: "2026-09-23T00:00:00.000Z",
            errorDetails: "连接模型服务失败",
        }, "loading");

        expect(metadata.status).toBe("loading");
        expect(metadata.taskId).toBeUndefined();
        expect(metadata.taskStatus).toBeUndefined();
        expect(metadata.taskProgress).toBeUndefined();
        expect(metadata.errorDetails).toBeUndefined();
    });
});
