import React, { useEffect, useRef, useState } from "react";
import classNames from "classnames";

import { Todo } from "../models/todo";
import CheckCircle from "./icons/CheckCircle";
import Trash from "./icons/Trash";
import Check from "./icons/Check";
import Cross from "./icons/Cross";
import { PartialTodo } from "../store";
import Plus from "./icons/Plus";
import ChevronDown from "./icons/ChevronDown";
import ChevronUp from "./icons/ChevronUp";

export type TodoItemProps = {
  todo: Todo;
  level?: number;
  isAddingNewTodo?: boolean;
  forceEditMode?: boolean;
  isExpanded?: boolean;
  onCheck?: (id: string) => void;
  onDelete?: (id: string) => void;
  onChange: (todo: PartialTodo) => void;
  onAddSubItem?: () => void;
  onCancelSubItem?: () => void;
  onExpand?: () => void;
};

const TodoItem = ({
  todo,
  isAddingNewTodo = false,
  forceEditMode = false,
  level = 0,
  isExpanded = false,
  onCheck,
  onDelete,
  onChange,
  onAddSubItem,
  onCancelSubItem,
  onExpand,
}: TodoItemProps) => {
  const [isEdit, setIsEdit] = useState(forceEditMode || isAddingNewTodo);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isEdit) {
      ref?.current?.focus();
    }
  }, [isEdit]);

  // TODO: Maybe add useEffect when title changes, reset form - so that it will have the correct text... need to test this
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.target as HTMLFormElement);
    const newTitle = data.get("title")?.toString();
    if (newTitle !== todo.title) {
      if (isAddingNewTodo) {
        onChange({ ...todo, title: newTitle });
      } else {
        onChange({ id: todo.id, title: newTitle });
      }
    }

    setTimeout(() => ref?.current?.focus());
    event.preventDefault();
  };

  return (
    <form
      key={todo.id}
      onSubmit={onSubmit}
      style={{ marginLeft: 16 * level }}
      className="relative"
    >
      <li
        key={todo.id}
        className={classNames(
          "flex flex-column justify-between items-baseline",
          `py-4 px-4 pr-3 mt-4 mb-4`,
          "rounded-md border border-solid  bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600",
          {
            "opacity-60": todo.isDone,
            "border-cyan-300": isEdit,
            "border-transparent": !isEdit,
            stacked: !isExpanded && !forceEditMode,
          }
        )}
      >
        {(!isEdit || !forceEditMode) && (
          <button
            className="self-center ml-1 pr-4 pt-px pb-px"
            onClick={() => onCheck?.(todo.id)}
            type="button"
          >
            <CheckCircle
              isChecked={todo.isDone}
              className={classNames("h-6", "w-6", {
                "text-cyan-600": todo.isDone,
                "text-slate-400": !todo.isDone,
              })}
            />
          </button>
        )}
        <input
          name="title"
          placeholder="...enter a new ToDo item"
          ref={ref}
          defaultValue={todo.title}
          className={classNames(
            "bg-transparent self-center font-semibold grow p-1 m-[-0.25rem] pr-10 mr-6",
            {
              hidden: !isEdit,
            }
          )}
        />

        <div
          className={classNames(
            "self-center font-semibold grow pr-10 mr-6 truncate",
            { hidden: isEdit, "line-through": todo.isDone }
          )}
          onClick={() => setIsEdit(true)}
          title={todo.title}
        >
          {todo.title}
        </div>

        {todo.children?.length && !isEdit && (
          <div className="pl-1 pr-2 text-neutral-400">
            (
            {todo.children
              .map<number>((x) => (x.isDone ? 1 : 0))
              .reduce((p, c) => p + c)}
            /{todo.children.length})
          </div>
        )}

        {!isEdit ? (
          <>
            {todo.children?.length && (
              <button
                type="button"
                onClick={onExpand}
                className=" p-2 mx-1 rounded-md font-bold"
              >
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </button>
            )}
            <button
              type="button"
              onClick={onAddSubItem}
              className="bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 p-2 mx-1 rounded-md font-bold"
            >
              <Plus />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(todo.id)}
              className="bg-red-500 hover:bg-red-600 active:bg-red-700 p-2 mx-1 rounded-md font-bold"
            >
              <Trash />
            </button>
          </>
        ) : (
          <>
            <button
              type="submit"
              // Interesting issue - if we change the input below clicked element the new one gets triggered
              onClick={() => setTimeout(() => setIsEdit(forceEditMode))}
              className="bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 p-2 mx-1 rounded-md font-bold"
            >
              <Check />
            </button>
            <button
              type="reset"
              onClick={() =>
                isAddingNewTodo ? onCancelSubItem?.() : setIsEdit(forceEditMode)
              }
              className="bg-red-500 hover:bg-red-600 active:bg-red-700 p-2 mx-1 rounded-md font-bold"
            >
              <Cross />
            </button>
          </>
        )}
      </li>
    </form>
  );
};

export default TodoItem;
