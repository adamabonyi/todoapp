import { useEffect, useMemo, useReducer, useState } from "react";
import TodoItem from "./TodoItem";
import TodoTreeNode from "./TodoTreeNode";
import {
  PartialTodo,
  TodoAction,
  TodoActions,
  convertTodos,
  reducer,
} from "../store";
import { Todo } from "../models/todo";
import { v4 } from "uuid";
import { compareStates } from "../utils";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { WS_URL } from "../variables";

type SocketMessage = {
  meta: string;
  payload: TodoAction;
};

type Props = {
  data: Todo[];
};

const randomUserName = `adam-${v4()}`;

const TodoList = ({ data }: Props) => {
  const [todos, dispatch] = useReducer(reducer, convertTodos(data));
  const [lastSavedTodos, setLastSavedTodos] = useState(todos);
  const [savePending, setSavePending] = useState(false);

  const [showCompleted, setShowCompleted] = useState(true);
  const [showInProgress, setShowInProgress] = useState(true);
  const [filterText, setFilterText] = useState<string>("");
  const firstLevelTodos = useMemo(
    () =>
      Object.values(todos)
        .filter((x) => !x.parentId)
        .filter(
          (x) => (showCompleted && x.isDone) || (showInProgress && !x.isDone)
        )
        .filter((x) => x.title.includes(filterText))
        .sort((a, b) => (a?.order || 0) - (b?.order || 0)),
    [todos, showCompleted, showInProgress, filterText]
  );
  const allFirstLevelTodo = useMemo(
    () => Object.values(todos).filter((x) => !x.parentId),
    [todos]
  );

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    WS_URL,
    {
      share: false,
      shouldReconnect: () => true,
    }
  );

  useEffect(() => {
    if (savePending) {
      const changes = compareStates(lastSavedTodos, todos);
      if (changes) {
        sendJsonMessage({
          meta: "save-changes",
          room: "todo1",
          payload: changes,
        });
      }
      setLastSavedTodos(todos);
      setSavePending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, savePending]);

  // Run when the connection state (readyState) changes
  useEffect(() => {
    console.log("Connection state changed");
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        meta: "join",
        room: "todo1",
        participant: randomUserName,
      });
    }
  }, [readyState]);

  // Run when a new WebSocket message is received (lastJsonMessage)
  useEffect(() => {
    if (!lastJsonMessage) return;
    const { meta, payload }: SocketMessage | undefined =
      lastJsonMessage as SocketMessage;

    if (meta !== "send-message") return;

    const { type, value } = payload;
    switch (type) {
      case TodoActions.ADD:
        onAddTodo(value, true);
        break;
      case TodoActions.REMOVE:
        onDeleteTodo(value, true);
        break;
      case TodoActions.CHECK:
        onCheckTodo(value, true);
        break;
      case TodoActions.UPDATE:
        onUpdateTodo(value, true);
        break;
      default:
        break;
    }

    console.log("recived", payload);
  }, [lastJsonMessage]);

  const sendSocketMessage = (message: TodoAction) => {
    // raise event in sockets
    sendJsonMessage({
      meta: "send-message",
      participant: randomUserName,
      room: "todo1",
      payload: message,
    });
  };

  const onAddTodo = (todo: Todo, isRemoteChange?: boolean) => {
    const message: TodoAction = { type: TodoActions.ADD, value: todo };
    dispatch(message);
    if (!isRemoteChange) {
      setSavePending(true);
      // raise event in sockets
      sendSocketMessage(message);
    }
  };

  const onDeleteTodo = (id: string, isRemoteChange?: boolean) => {
    const message: TodoAction = { type: TodoActions.REMOVE, value: id };
    dispatch(message);
    if (!isRemoteChange) {
      setSavePending(true);
      // raise event in sockets
      sendSocketMessage(message);
    }
  };

  const onCheckTodo = (id: string, isRemoteChange?: boolean) => {
    const message: TodoAction = { type: TodoActions.CHECK, value: id };
    dispatch(message);
    if (!isRemoteChange) {
      setSavePending(true);
      // raise event in sockets
      sendSocketMessage(message);
      console.log("sending", message);
    }
  };

  const onUpdateTodo = (todo: PartialTodo, isRemoteChange?: boolean) => {
    const message: TodoAction = { type: TodoActions.UPDATE, value: todo };
    dispatch({ type: TodoActions.UPDATE, value: todo });
    if (!isRemoteChange) {
      setSavePending(true);
      // raise event in sockets
      sendSocketMessage(message);
    }
  };

  const onFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  };

  const newTodo = {
    id: v4(),
    title: "",
    order: 0,
    isDone: false,
  };

  return (
    <>
      <div className="flex flex-row ">
        <div className="text-2xl mb-8">
          {allFirstLevelTodo.filter((x) => x.isDone).length} of{" "}
          {allFirstLevelTodo.length} Done
        </div>
      </div>

      <div className="flex flex-row justify-between items-baseline">
        <input
          placeholder="Filter text here"
          onChange={onFilterChange}
          className="rounded-md py-2 px-2 my-2 mx-4 bg-slate-200 dark:bg-slate-700  dark:text-gray-200 dark:placeholder-gray-400 font-semibold"
        />
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="border-solid border-2 border-gray-100  rounded-md py-1 px-2 my-2 ml-4 w-32"
        >
          {showCompleted ? "Hide Done" : "Show Done"}
        </button>
        <button
          onClick={() => setShowInProgress(!showInProgress)}
          className="border-solid border-2 border-gray-100  rounded-md py-1 px-2 my-2 ml-4 w-40"
        >
          {showInProgress ? "Hide In Progress" : "Show In Progress"}
        </button>
      </div>

      <div className="todo-width">
        <ul>
          <TodoItem
            todo={newTodo}
            level={0}
            isAddingNewTodo
            forceEditMode
            isExpanded={false}
            onChange={(todo) => onAddTodo(todo as Todo)}
          />
          {firstLevelTodos?.map((todo) => (
            <TodoTreeNode
              key={todo.id}
              todo={todos[todo.id]}
              todos={todos}
              onAdd={onAddTodo}
              onCheck={onCheckTodo}
              onDelete={onDeleteTodo}
              onChange={onUpdateTodo}
              filter={{
                showCompleted,
                showInProgress,
                filterText,
              }}
            />
          ))}
        </ul>
      </div>
    </>
  );
};

export default TodoList;
