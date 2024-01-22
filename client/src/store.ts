import { Todo } from "./models/todo";

export type TodoState = Record<string, Todo>;

const initialTodosArray: Todo[] = [
  {
    id: "3",
    parentId: "1",
    title: "Todo 3",
    isDone: false,
    order: 0,
    weight: 5,
  },
  {
    id: "2",
    title: "Todo 2",
    isDone: false,
    order: 1,
  },
  {
    id: "1",
    title: "Todo 1",
    isDone: false,
    order: 0,
  },
  {
    id: "4",
    parentId: "2",
    title: "Todo 4",
    isDone: false,
    order: 0,
  },
  {
    id: "5",
    parentId: "2",
    title: "Todo 5",
    isDone: false,
    order: 2,
  },
  {
    id: "6",
    parentId: "2",
    title: "Todo 6",
    isDone: false,
    order: 1,
  },
  {
    id: "7",
    parentId: "5",
    title: "Todo 7",
    isDone: false,
    order: 0,
  },
];

export const convertTodos = (todos: Todo[]): TodoState => {
  const clone = structuredClone(todos);
  const todoMap = clone
    .sort((a, b) => (a?.order || 0) - (b?.order || 0))
    .reduce<TodoState>((prev, cur) => {
      prev[cur.id] = cur;
      return prev;
    }, {});

  // creates the tree structure using the child property "semi-efficiently"
  const result = clone.reduce<TodoState>((prev, cur) => {
    if (cur.parentId) {
      const parent = todoMap[cur.parentId];
      if (!parent) return prev;

      if (!parent.children) {
        parent.children = [cur];
      } else {
        parent.children.push(cur);
      }
    }

    prev[cur.id] = cur;
    return prev;
  }, {});

  return result;
};

export const initialTodos = convertTodos(initialTodosArray);

export enum TodoActions {
  CHECK = "CHECK",
  ADD = "ADD",
  REMOVE = "REMOVE",
  UPDATE = "UPDATE",
}

type TodoAddAction = {
  type: TodoActions.ADD;
  value: Todo;
};

type TodoRemoveAction = {
  type: TodoActions.REMOVE;
  value: Todo["id"];
};

type TodoCheckAction = {
  type: TodoActions.CHECK;
  value: Todo["id"];
};

export type PartialTodo = { id: Todo["id"] } & Partial<Todo>;

type TodoUpdateAction = {
  type: TodoActions.UPDATE;
  value: PartialTodo;
};

export type TodoAction =
  | TodoAddAction
  | TodoRemoveAction
  | TodoCheckAction
  | TodoUpdateAction;

const childrenCheck = (todo: Todo, state: TodoState) => {
  if (!todo.children?.length) return;

  const children = todo.children.map((child) => state[child.id]);
  const childCount = children.length;
  const doneCount = todo.children.filter((x) => x.isDone).length;
  const areAllDone = childCount === doneCount;
  // const weight = todo.children
  //   .map((x) => x.weight || 0)
  //   .reduce<number>((prev, cur) => prev + cur, 0);

  const childTodo = state[todo.id];
  // childTodo.weight = weight;
  childTodo.isDone = areAllDone;
};

const updateParent = (todo: Todo, state: TodoState) => {
  if (!todo.parentId) return;
  const parent = state[todo.parentId];
  childrenCheck(parent, state);
  if (parent.parentId) updateParent(parent, state);
  return;
};

const updateChildren = (todo: Todo, state: TodoState) => {
  if (!todo.children?.length) return;

  for (const c of todo.children) {
    c.isDone = todo.isDone;
    c.children?.length && updateChildren(c, state);
    if (!c.children?.length) {
      updateParent(todo, state);
    }
  }
};

const updateSiblingPosition = (todo: Todo, state: TodoState) => {
  let todoList: Todo[];

  todo.order = todo.order || 0;

  if (todo.parentId) {
    todoList = state[todo.parentId].children || [];
  } else {
    // TODO: In hindsight I would create a root node that would have list of root level todos so we dont have to do this ugly thing
    todoList = Object.values(state).filter((t) => !t.parentId);
  }

  todoList.sort((a, b) => (a?.order || 0) - (b?.order || 0));
  for (let i = 0; i < todoList.length; i++) {
    todoList[i].order = i < todo.order ? i : i + 1;
  }
};

const removeChildren = (todo: Todo, state: TodoState) => {
  const { children } = todo;

  if (children?.length) {
    for (const c of children) {
      delete state[c.id];
      if (c.children?.length) removeChildren(c, state);
    }
  }
};

export const reducer = (state: TodoState, action: TodoAction) => {
  switch (action.type) {
    case TodoActions.ADD: {
      const todo: Todo = action.value;

      const newState = structuredClone(state);

      todo.order = todo.order || 0;
      updateSiblingPosition(todo, newState);
      newState[todo.id] = todo;
      if (todo.parentId) {
        const parent = newState[todo.parentId];
        if (!parent.children?.length) parent.children = [];
        newState[todo.parentId].children!.unshift(todo);
        todo.children?.length && updateChildren(todo, newState);
        todo.parentId && updateParent(todo, newState);
      }

      return newState;
    }
    case TodoActions.UPDATE: {
      const partialTodo = action.value;

      const newState = structuredClone(state);

      const todo = newState[partialTodo.id];
      if (partialTodo.title) todo.title = partialTodo.title;
      if (partialTodo.description) todo.description = partialTodo.description;
      if (partialTodo.parentId) todo.parentId = partialTodo.parentId; // TODO: needs to update children of parent
      if (partialTodo.order) todo.order = partialTodo.order; // TODO: needs to recount order
      if (partialTodo.isDone) todo.isDone = partialTodo.isDone; // TODO: needs to update weights and count
      if (partialTodo.weight) todo.weight = partialTodo.weight; // TODO: needs to update weights and count

      return newState;
    }
    case TodoActions.REMOVE: {
      const id = action.value;
      const newState = structuredClone(state);

      const todo = newState[id];
      delete newState[id];

      // delete todo from parent and delete subtree
      if (todo.parentId) {
        const parent = newState[todo.parentId];
        parent.children?.splice(parent.children?.indexOf(todo), 1);
        if (!parent.children?.length) parent.children = undefined;
      }
      removeChildren(todo, newState);

      // update parents
      todo.parentId && updateParent(todo, newState);

      return newState;
    }
    case TodoActions.CHECK: {
      const id = action.value;

      const newState = structuredClone(state);
      const todo = newState[id];
      todo.isDone = !newState[id].isDone;
      todo.children?.length && updateChildren(todo, newState);
      todo.parentId && updateParent(todo, newState);

      return newState;
    }
    default:
      return state;
  }
};
