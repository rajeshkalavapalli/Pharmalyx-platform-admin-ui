import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AddBusinessRounded, ArrowForwardRounded, InsightsRounded, LockOutlined, PersonOutlineRounded, ShieldRounded, VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

const FEATURES = [
    { icon: AddBusinessRounded, title: "New company in minutes", text: "Name, code, user limit and the first admin - ready to sign in." },
    { icon: InsightsRounded, title: "Usage health for every customer", text: "Visits, people working and last activity, as counts only." },
    { icon: ShieldRounded, title: "Seats and access under control", text: "Raise limits, pause a company or reset its admin password." },
];

// Left half on wide screens: dark brand panel with what the platform is for.
function BrandPanel() {
    const theme = useTheme();
    return (
        <Box
            sx={(theme) => ({
                display: { xs: "none", md: "flex" },
                flexDirection: "column",
                justifyContent: "space-between",
                px: theme.login.brandPaddingX,
                py: theme.login.brandPaddingY,
                background: theme.platform.band.background,
                color: theme.platform.band.text,
            })}
        >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <BrandMark size={theme.login.brandMarkSize} showWordmark tone="dark" />
            </Stack>

            <Box sx={(theme) => ({ maxWidth: theme.login.headlineMaxWidth })}>
                <Typography variant="overline" sx={(theme) => ({ color: theme.platform.band.accent })}>
                    Pharmalyx platform
                </Typography>
                <Typography component="h2" sx={(theme) => ({ ...theme.login.headline, color: theme.platform.band.text, mt: 1 })}>
                    Run every customer company from one place.
                </Typography>
                <Stack sx={(theme) => ({ mt: theme.login.featuresMarginTop, gap: theme.login.featureGap * 1.5 })}>
                    {FEATURES.map(({ icon: Icon, title, text }) => (
                        <Stack key={title} direction="row" spacing={1.75} sx={{ alignItems: "flex-start" }}>
                            <Box
                                sx={(theme) => ({
                                    width: theme.stat.iconSize,
                                    height: theme.stat.iconSize,
                                    flexShrink: 0,
                                    display: "grid",
                                    placeItems: "center",
                                    borderRadius: theme.stat.iconRadius,
                                    color: theme.platform.band.accent,
                                    backgroundColor: alpha(theme.platform.band.accent, theme.tint.soft * 1.5),
                                })}
                            >
                                <Icon />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" sx={(theme) => ({ color: theme.platform.band.text })}>
                                    {title}
                                </Typography>
                                <Typography variant="body2" sx={(theme) => ({ color: theme.platform.band.mutedText })}>
                                    {text}
                                </Typography>
                            </Box>
                        </Stack>
                    ))}
                </Stack>
            </Box>

            <Typography variant="caption" sx={(theme) => ({ color: theme.platform.band.faintText })}>
                © {new Date().getFullYear()} Pharmalyx · for the Pharmalyx team only
            </Typography>
        </Box>
    );
}

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
            navigate("/overview", { replace: true });
        } catch (err) {
            setError(errorMessage(err, "Sign-in failed. Please try again."));
        } finally {
            setBusy(false);
        }
    };

    const fieldSx = (theme) => ({ "& .MuiOutlinedInput-root": { minHeight: theme.login.fieldHeight } });

    return (
        <Box sx={(theme) => ({ minHeight: "100dvh", display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" }, backgroundColor: theme.palette.background.default })}>
            <BrandPanel />
            <Box sx={{ display: "grid", placeItems: "center", px: 2, py: 6 }}>
            <Box component="form" noValidate onSubmit={submit} sx={(theme) => ({ width: "100%", maxWidth: theme.platform.signInMaxWidth })}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 4, display: { md: "none" } }}>
                    <BrandMark size={theme.login.brandMarkSize} showWordmark tone="light" />
                    <Tag label="Platform" color="primary" />
                </Stack>

                <Typography variant="h2" component="h1">
                    Welcome back
                </Typography>
                <Typography variant="body2" sx={(theme) => ({ mt: 1, mb: 4, color: theme.palette.text.secondary })}>
                    Sign in to the Pharmalyx platform. Company users sign in on the Pharmalyx app instead.
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
                <Stack direction="row" spacing={1} sx={(theme) => ({ mt: 3, alignItems: "center", color: theme.palette.text.secondary })}>
                    <ShieldRounded sx={(theme) => ({ fontSize: theme.typography.body2.fontSize, color: theme.palette.primary.main })} />
                    <Typography variant="caption">5 wrong passwords lock the account for 15 minutes.</Typography>
                </Stack>
            </Box>
            </Box>
        </Box>
    );
}

export default SignIn;
