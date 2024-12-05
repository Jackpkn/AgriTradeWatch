import axios from "axios";

const api = axios.create({ baseURL: "https://agritradewatch-backend.onrender.com/api" }); // ipv4 of laptop or desktop

export default api;