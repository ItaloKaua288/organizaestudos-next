"use server";

import { updateTopicReviewStatus } from "@/services/topics.service";

export async function changeReviewStatus(topicId: string, review: string, isCompleted: boolean) {
    try {
        await updateTopicReviewStatus(topicId, review, isCompleted);

        return { success: true };
    } catch (error) {
        console.error("Error completing review:", error);

        return {
            success: false,
            error: "Failed to update the review.",
        };
    }
}