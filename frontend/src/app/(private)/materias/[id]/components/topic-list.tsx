"use client"

import { TopicDragGhost, TopicRow } from "@/components/topic-row";
import { useTopicReorder } from "@/hooks/use-topic-reorder";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";

interface TopicListProps {
    sortedTopics: Topic[];
    subject: Subject;
}

export function TopicList({ sortedTopics, subject }: TopicListProps) {
    const { topics, moveTopic, getTopicMeta, isReordering, draggedId, overId, ghost, ghostRef, getDragProps } = useTopicReorder(subject.id, sortedTopics);

    return (
        <div className="flex flex-col gap-2">
            {topics.map((topic, index) => {
                const meta = getTopicMeta(topic.id);

                return (
                <TopicRow
                    key={topic.id || `topic-${index}`}
                    topic={topic}
                    index={index}
                    isFirst={meta.isFirst}
                    isLast={meta.isLast}
                    isSubtopic={meta.isSubtopic}
                    childCount={meta.childCount}
                    subject={subject}
                    isReordering={isReordering}
                    dragProps={getDragProps(topic.id)}
                    isDragging={draggedId === topic.id}
                    isDragOver={overId === topic.id}
                    onMoveUp={() => moveTopic(topic.id, "up")}
                    onMoveDown={() => moveTopic(topic.id, "down")}
                />
                );
            })}
            <TopicDragGhost ghost={ghost} elementRef={ghostRef} />
        </div>
    )
}
