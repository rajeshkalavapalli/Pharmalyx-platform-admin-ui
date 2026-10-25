import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { isSignedIn } from "./configurations/session";
import PlatformShell from "./Pages/Shell/PlatformShell";
import SignIn from "./Pages/SignIn/SignIn";
import CompanyList from "./Pages/Companies/CompanyList";
import CompanyDetail from "./Pages/Companies/CompanyDetail";

function RequireOwner({ children }) {
    return isSignedIn() ? children : <Navigate to="/" replace />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={isSignedIn() ? <Navigate to="/companies" replace /> : <SignIn />} />
                <Route
                    element={
                        <RequireOwner>
                            <PlatformShell />
                        </RequireOwner>
                    }
                >
                    <Route path="/companies" element={<CompanyList />} />
                    <Route path="/companies/:organisationId" element={<CompanyDetail />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
