export type Todo = {
  id: string;
  parentId?: Todo["id"];
  title: string;
  isDone: boolean;
  order?: number;
  description?: string;
  weight?: number;

  children?: Todo[]; // client only
  updated?: string[]; // client only
};
