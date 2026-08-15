"use server";

import { updateTopicReviewStatusAction } from "./topics.actions";

export async function changeReviewStatus(topicId: string, review: string, isCompleted: boolean) {
    try {
        const formData = new FormData()
        formData.append("topicId", topicId)
        formData.append("review", review)
        formData.append("isCompleted", `${isCompleted}`)
        await updateTopicReviewStatusAction(formData);

        return { success: true };
    } catch (error) {
        console.error("Error completing review:", error);

        return {
            success: false,
            error: "Failed to update the review.",
        };
    }
}