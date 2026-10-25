// Platform owner session, kept in localStorage under its own keys so it never mixes with a
// company user's session from the main app.
const TOKEN_KEY = "platformToken";
const EXPIRES_KEY = "platformExpiresAt";
const ADMIN_KEY = "platformAdmin";

const read = (key) => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

export const getToken = () => {
    const token = read(TOKEN_KEY);
    const expiresAt = Date.parse(read(EXPIRES_KEY) || "");
    if (!token || (expiresAt && expiresAt <= Date.now())) return null;
    return token;
};

export const isSignedIn = () => Boolean(getToken());

export const getAdmin = () => {
    try {
        return JSON.parse(read(ADMIN_KEY) || "null");
    } catch {
        return null;
    }
};

export const saveSession = ({ token, expiresAt, admin }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXPIRES_KEY, expiresAt);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
};

export const clearSession = () => {
    try {
        [TOKEN_KEY, EXPIRES_KEY, ADMIN_KEY].forEach((key) => localStorage.removeItem(key));
    } catch {
        // nothing stored
    }
};
