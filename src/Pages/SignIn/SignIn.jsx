import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, Box, Button, CircularProgress, Divider, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ArrowForwardRounded, LockOutlined, PersonOutlineRounded, ShieldRounded, VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material";

import BrandMark from "../../components/BrandMark/BrandMark";
import Tag from "../../components/Tag/Tag";
import { saveSession } from "../../configurations/session";
import { errorMessage, signIn } from "../Companies/index";

// Platform owner sign-in: one white card on a soft jade-lit page. Company users sign in on the main app.
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
            navigate("/overview", { replace: true });
        } catch (err) {
            setError(errorMessage(err, "Sign-in failed. Please try again."));
        } finally {
            setBusy(false);
        }
    };

    const fieldSx = (theme) => ({ "& .MuiOutlinedInput-root": { minHeight: theme.login.fieldHeight } });

    return (
        <Box
            sx={(theme) => ({
                minHeight: "100dvh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
                py: 6,
                background: theme.platform.signIn.background,
            })}
        >
            <Box
                component="form"
                noValidate
                onSubmit={submit}
                sx={(theme) => ({
                    width: "100%",
                    maxWidth: theme.platform.signInMaxWidth,
                    p: theme.platform.signIn.cardPadding,
                    borderRadius: theme.platform.signIn.cardRadius,
                    border: theme.platform.signIn.cardBorder,
                    boxShadow: theme.platform.signIn.cardShadow,
                    backgroundColor: theme.palette.background.paper,
                })}
            >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "center", mb: 3.5 }}>
                    <BrandMark size={theme.login.brandMarkSize} showWordmark tone="light" />
                    <Tag label="Platform" color="primary" />
                </Stack>

                <Typography variant="h4" component="h1" sx={{ textAlign: "center" }}>
                    Sign in
                </Typography>
                <Typography variant="body2" sx={(theme) => ({ mt: 0.75, mb: 3.5, textAlign: "center", color: theme.palette.text.secondary })}>
                    Pharmalyx platform console
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

                <Divider sx={{ my: 3 }} />
                <Stack direction="row" spacing={1} sx={(theme) => ({ alignItems: "center", justifyContent: "center", color: theme.palette.text.secondary })}>
                    <ShieldRounded sx={(theme) => ({ fontSize: theme.typography.body2.fontSize, color: theme.palette.primary.main })} />
                    <Typography variant="caption">Secure sign-in · encrypted connection</Typography>
                </Stack>
            </Box>

            <Typography variant="caption" sx={(theme) => ({ mt: 3, color: theme.palette.text.secondary })}>
                © {new Date().getFullYear()} Pharmalyx
            </Typography>
        </Box>
    );
}

export default SignIn;
