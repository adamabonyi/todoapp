import { configure } from "axios-hooks";
import Axios from "axios";
import { API_URL } from "./variables";

const axios = Axios.create({
  baseURL: API_URL,
});

configure({ axios });
