import useAxios from "axios-hooks";
import TodoList from "./components/TodoList";
import { Todo } from "./models/todo";

function App() {
  const [{ data = [], loading }] = useAxios({
    url: "/todos",
  });

  if (loading)
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <div>
          <h1 className="text-3xl font-bold m-8">Loading...</h1>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-full justify-center items-center">
      <div>
        <h1 className="text-3xl font-bold m-8">Adams ToDo App</h1>
      </div>

      <TodoList data={data as Todo[]} />
    </div>
  );
}

export default App;
