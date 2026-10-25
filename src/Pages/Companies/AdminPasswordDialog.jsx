import { useState } from "react";

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { AutorenewRounded, VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material";

import { errorMessage, generatePassword, passwordProblem, resetAdminPassword } from "./index";

// Sets a new password for one of the company's administrators (e.g. they forgot theirs).
function AdminPasswordDialog({ organisationId, admin, onClose, onDone }) {
    const [password, setPassword] = useState("");
    const [visible, setVisible] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const problem = passwordProblem(password);

    const save = async (event) => {
        event.preventDefault();
        if (problem) {
            setError(problem);
            return;
        }
        setBusy(true);
        setError("");
        try {
            await resetAdminPassword(organisationId, admin.userId, password);
            onDone(password);
        } catch (err) {
            setError(errorMessage(err, "Couldn't change the password."));
            setBusy(false);
        }
    };

    return (
        <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="xs" slotProps={{ paper: { component: "form", noValidate: true, onSubmit: save } }}>
            <DialogTitle sx={(theme) => ({ px: theme.dialog.paddingX, pt: theme.dialog.paddingY })}>New password for {admin.name || admin.userName}</DialogTitle>
            <DialogContent sx={(theme) => ({ px: theme.dialog.paddingX })}>
                <Stack spacing={2}>
                    <Typography variant="body2" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                        Their old password stops working at once. Give them the new one; they sign in as {admin.userName}.
                    </Typography>
                    <TextField
                        id="new-admin-password"
                        autoFocus
                        label="New password"
                        type={visible ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        helperText="At least 8 characters, a letter and a digit."
                        autoComplete="new-password"
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Tooltip title="Generate a password">
                                            <IconButton
                                                aria-label="Generate a password"
                                                onClick={() => {
                                                    setPassword(generatePassword());
                                                    setVisible(true);
                                                }}
                                            >
                                                <AutorenewRounded fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <IconButton edge="end" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible((v) => !v)}>
                                            {visible ? <VisibilityOffRounded fontSize="small" /> : <VisibilityRounded fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    {error && (
                        <Alert severity="error" variant="outlined">
                            {error}
                        </Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={(theme) => ({ px: theme.dialog.paddingX, pb: theme.dialog.paddingY })}>
                <Button onClick={onClose} disabled={busy}>
                    Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={busy}>
                    {busy ? "Saving…" : "Set password"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminPasswordDialog;
