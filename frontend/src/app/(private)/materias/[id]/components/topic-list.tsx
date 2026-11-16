"use client"

import { TopicDragOverlay, TopicRow } from "@/components/topic-row";
import { useCollapsedFolders } from "@/hooks/use-collapsed-folders";
import { useTopicReorder } from "@/hooks/use-topic-reorder";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
import { DndContext } from "@dnd-kit/core";

interface TopicListProps {
    sortedTopics: Topic[];
    subject: Subject;
}

export function TopicList({ sortedTopics, subject }: TopicListProps) {
    const folders = useCollapsedFolders(subject.id);
    const { topics, moveTopic, getTopicMeta, isReordering, activeTopic, dndProps, getDragProps } = useTopicReorder(subject.id, sortedTopics);

    return (
        <DndContext {...dndProps}>
            <div className="flex flex-col gap-2">
                {topics.map((topic, index) => {
                    if (topic.parentId && folders.isCollapsed(topic.parentId)) return null;
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
                            isCollapsed={folders.isCollapsed(topic.id)}
                            onToggleCollapse={() => folders.toggle(topic.id)}
                            subject={subject}
                            isReordering={isReordering}
                            dragProps={getDragProps(topic.id)}
                            onMoveUp={() => moveTopic(topic.id, "up")}
                            onMoveDown={() => moveTopic(topic.id, "down")}
                        />
                    );
                })}
            </div>
            <TopicDragOverlay topic={activeTopic} />
        </DndContext>
    )
}
