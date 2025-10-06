import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  // withCredentials: true, // only if you use cookies
});

export default api;
