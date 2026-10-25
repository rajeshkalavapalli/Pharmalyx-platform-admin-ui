import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ArrowForwardRounded, LockOutlined, PersonOutlineRounded, VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material";

import BrandMark from "../../components/BrandMark/BrandMark";
import Tag from "../../components/Tag/Tag";
import { saveSession } from "../../configurations/session";
import { errorMessage, signIn } from "../Companies/index";

// Platform owner sign-in. Company users sign in on the main app, not here.
function SignIn() {
    const theme = useTheme();
    const navigate = useNavigate();
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async (event) => {
        event.preventDefault();
        if (!userName.trim() || !password) {
            setError("Enter your username and password.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const session = await signIn(userName.trim(), password);
            saveSession(session);
            navigate("/companies", { replace: true });
        } catch (err) {
            setError(errorMessage(err, "Sign-in failed. Please try again."));
        } finally {
            setBusy(false);
        }
    };

    const fieldSx = (theme) => ({ "& .MuiOutlinedInput-root": { minHeight: theme.login.fieldHeight } });

    return (
        <Box sx={(theme) => ({ minHeight: "100dvh", display: "grid", placeItems: "center", px: 2, py: 6, backgroundColor: theme.palette.background.default })}>
            <Box component="form" noValidate onSubmit={submit} sx={(theme) => ({ width: "100%", maxWidth: theme.platform.signInMaxWidth })}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 4 }}>
                    <BrandMark size={theme.login.brandMarkSize} showWordmark tone="light" />
                    <Tag label="Platform" color="primary" />
                </Stack>

                <Typography variant="h2" component="h1">
                    Platform sign-in
                </Typography>
                <Typography variant="body2" sx={(theme) => ({ mt: 1, mb: 4, color: theme.palette.text.secondary })}>
                    For the Pharmalyx team: create and manage customer companies. Company users sign in on the Pharmalyx app instead.
                </Typography>

                <Stack spacing={2.25}>
                    {error && (
                        <Alert severity="error" variant="outlined">
                            {error}
                        </Alert>
                    )}
                    <TextField
                        id="platform-username"
                        fullWidth
                        autoFocus
                        label="Username"
                        autoComplete="username"
                        value={userName}
                        onChange={(event) => setUserName(event.target.value)}
                        sx={fieldSx}
                        slotProps={{ input: { startAdornment: (<InputAdornment position="start"><PersonOutlineRounded fontSize="small" /></InputAdornment>) } }}
                    />
                    <TextField
                        id="platform-password"
                        fullWidth
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        sx={fieldSx}
                        slotProps={{
                            input: {
                                startAdornment: (<InputAdornment position="start"><LockOutlined fontSize="small" /></InputAdornment>),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton edge="end" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)}>
                                            {showPassword ? <VisibilityOffRounded fontSize="small" /> : <VisibilityRounded fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={busy}
                        endIcon={busy ? <CircularProgress size={theme.login.spinnerSize} color="inherit" /> : <ArrowForwardRounded />}
                        sx={(theme) => ({ minHeight: theme.login.fieldHeight })}
                    >
                        {busy ? "Signing in…" : "Sign in"}
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
}

export default SignIn;
