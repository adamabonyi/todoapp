import { useEffect, useRef } from "react";
import { Todo } from "./models/todo";

export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export const compareStates = (
  prev: Record<Todo["id"], Todo>,
  to: Record<Todo["id"], Todo>
) => {
  const prevKeys = Object.keys(prev);
  const toKeys = Object.keys(to);

  const prevKeysSet = new Set(prevKeys);
  const toKeysSet = new Set(toKeys);

  // find additions (whats in to but not in prev)
  const newIds = toKeys.filter((x) => !prevKeysSet.has(x));
  const newTodos = newIds.map((x) => to[x]);

  // find removals (whats in prev but in to)
  const removeTodos = prevKeys.filter((x) => !toKeysSet.has(x));

  // find updates (go trough same ids)
  const updateIds = toKeys.filter((x) => prevKeysSet.has(x));
  const updateTodos: Partial<Todo>[] = [];

  for (const id of updateIds) {
    const prevT = prev[id];
    const toT = to[id];

    const properties: (keyof Todo)[] = [
      "parentId",
      "title",
      "isDone",
      "order",
      "description",
      "weight",
    ];

    const changedProperties = properties.filter((p) => prevT[p] !== toT[p]);
    if (!changedProperties.length) continue;

    const updatedTodo: Partial<Todo> = {
      id,
    };

    for (const p of changedProperties) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updatedTodo[p] as any) = toT[p];
    }

    updateTodos.push(updatedTodo);
  }

  if (!newTodos?.length && !removeTodos?.length && !updateTodos?.length)
    return null;

  return { newTodos, removeTodos, updateTodos };
};
