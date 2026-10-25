import api from "../../configurations/api-config";

export { errorMessage } from "../../configurations/api-config";

const get = async (url, params) => (await api.get(url, { params })).data;
const post = async (url, body) => (await api.post(url, body)).data;
const patch = async (url, body) => (await api.patch(url, body)).data;

export const signIn = (userName, password) => post("/platform/login", { userName, password });
export const getCompanies = () => get("/platform/organisations");
export const getCompany = (id) => get(`/platform/organisations/${id}`);
export const suggestCode = (name) => get("/platform/organisations/suggest-code", { name });
export const createCompany = (payload) => post("/platform/organisations", payload);
export const updateCompany = (id, changes) => patch(`/platform/organisations/${id}`, changes);
export const setCompanyStatus = (id, status) => post(`/platform/organisations/${id}/status`, { status });
export const resetAdminPassword = (id, userId, password) => post(`/platform/organisations/${id}/admins/${userId}/password`, { password });

export const STATUS = {
    ACTIVE: { label: "Active", color: "success" },
    PAUSED: { label: "Paused", color: "warning" },
};

export const ACTION_LABEL = {
    CREATE_ORG: "Company created",
    UPDATE_ORG: "Details changed",
    SET_LIMIT: "User limit changed",
    PAUSE_ORG: "Paused",
    RESUME_ORG: "Resumed",
    RESET_ADMIN_PASSWORD: "Admin password reset",
};

export const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// Same rule as the server: at least 8 characters with a letter and a digit.
export const passwordProblem = (password) => {
    if (!password) return "Enter a password.";
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return "At least 8 characters, with a letter and a digit.";
    return "";
};

// A readable random password the owner can pass on (letters and digits, no look-alikes).
export const generatePassword = () => {
    const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
    const digits = "23456789";
    const pick = (set, n) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (v) => set[v % set.length]).join("");
    return `${pick(letters, 5)}${pick(digits, 3)}${pick(letters, 4)}`;
};
