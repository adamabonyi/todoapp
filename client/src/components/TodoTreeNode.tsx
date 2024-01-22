import React, { useState } from "react";
import { PartialTodo, TodoState } from "../store";
import TodoItem, { TodoItemProps } from "./TodoItem";
import { v4 } from "uuid";
import { Todo } from "../models/todo";

type Props = {
  todos: TodoState;
  level?: number;
  onAdd: (todo: Todo) => void;
  filter: {
    showCompleted: boolean;
    showInProgress: boolean;
    filterText: string;
  };
} & TodoItemProps;

const TodoTreeNode = ({ level = 0, todos, ...props }: Props) => {
  const [isAdding, setIsAdd] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const { todo, onAdd, filter } = props;
  const { showCompleted, showInProgress, filterText } = filter;

  const toggleExpanded = () => setIsExpanded(!isExpanded);
  const toggleIsAdding = () => setIsAdd(!isAdding);

  const newTodo: Todo = {
    id: v4(),
    title: "",
    order: 0,
    parentId: todo.id,
    isDone: false,
  };

  return (
    <React.Fragment>
      <TodoItem
        {...props}
        level={level}
        onAddSubItem={() => setIsAdd(true)}
        isExpanded={isExpanded}
        onExpand={toggleExpanded}
      />
      {isAdding && (
        <TodoItem
          {...props}
          todo={newTodo}
          level={level + 1}
          isAddingNewTodo={isAdding}
          onChange={(todo: PartialTodo) => {
            onAdd(todo as Todo);
            toggleIsAdding();
          }}
          onCancelSubItem={toggleIsAdding}
        />
      )}
      {isExpanded &&
        todo.children
          ?.filter(
            (x) => (showCompleted && x.isDone) || (showInProgress && !x.isDone)
          )
          .filter((x) => x.title.includes(filterText))
          .map((tc: Todo) => (
            <TodoTreeNode
              {...props}
              key={tc.id}
              todos={todos}
              todo={todos[tc.id]}
              level={level + 1}
            />
          ))}
    </React.Fragment>
  );
};

export default TodoTreeNode;
