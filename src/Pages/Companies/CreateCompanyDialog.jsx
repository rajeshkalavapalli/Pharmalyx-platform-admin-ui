import { useEffect, useState } from "react";

import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, TextField, Typography } from "@mui/material";

import { createCompany, errorMessage, suggestCode } from "./index";

const EMPTY = { name: "", maxUsers: "10", ownerName: "", ownerEmail: "", ownerPhone: "", notes: "" };

function Section({ title, hint, children }) {
    return (
        <Stack spacing={1.75}>
            <Box>
                <Typography variant="overline" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                    {title}
                </Typography>
                {hint && (
                    <Typography variant="body2" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                        {hint}
                    </Typography>
                )}
            </Box>
            {children}
        </Stack>
    );
}

const twoColumns = { display: "grid", gap: 1.75, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } };

// New company: name, user limit and its owner. The code is made from the name, and the owner
// becomes the first administrator (signs in with their email; the password is generated).
function CreateCompanyDialog({ onClose, onCreated }) {
    const [form, setForm] = useState(EMPTY);
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [touched, setTouched] = useState(false);

    const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

    // Show the code the company will get, a moment after typing stops.
    useEffect(() => {
        const name = form.name.trim();
        if (name.length < 2) {
            setCode("");
            return undefined;
        }
        const timer = setTimeout(() => {
            suggestCode(name)
                .then((result) => setCode(result.code))
                .catch(() => setCode(""));
        }, 400);
        return () => clearTimeout(timer);
    }, [form.name]);

    const limit = Number(form.maxUsers);
    const problems = {
        name: form.name.trim().length < 2 ? "Enter the company name." : "",
        maxUsers: !Number.isInteger(limit) || limit < 1 ? "A whole number, 1 or more." : "",
        ownerName: !form.ownerName.trim() ? "Enter the owner's name." : "",
        ownerEmail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail.trim()) ? "Enter a valid email; the owner signs in with it." : "",
        ownerPhone: !/^[+\d][\d\s-]{6,29}$/.test(form.ownerPhone.trim()) ? "Enter a valid phone number." : "",
    };
    const invalid = Object.values(problems).some(Boolean);
    const show = (key) => (touched && problems[key]) || "";

    const submit = async (event) => {
        event.preventDefault();
        setTouched(true);
        if (invalid) return;
        setBusy(true);
        setError("");
        try {
            const result = await createCompany({ ...form, maxUsers: limit });
            onCreated(result.organisation, result.signIn);
        } catch (err) {
            setError(errorMessage(err, "Couldn't create the company."));
            setBusy(false);
        }
    };

    return (
        <Dialog
            open
            onClose={busy ? undefined : onClose}
            fullWidth
            slotProps={{ paper: { component: "form", noValidate: true, onSubmit: submit, sx: (theme) => ({ maxWidth: theme.platform.dialogMaxWidth }) } }}
        >
            <DialogTitle sx={(theme) => ({ px: theme.dialog.paddingX, pt: theme.dialog.paddingY })}>New company</DialogTitle>

            <DialogContent sx={(theme) => ({ px: theme.dialog.paddingX })}>
                <Stack spacing={3} divider={<Divider />}>
                    <Section title="Company">
                        <TextField
                            id="company-name"
                            label="Company name"
                            required
                            autoFocus
                            value={form.name}
                            onChange={set("name")}
                            error={Boolean(show("name"))}
                            helperText={show("name") || (code ? `Company code: ${code} (made from the name)` : "The company code is made from the name.")}
                        />
                        <TextField
                            id="company-limit"
                            label="User limit"
                            required
                            type="number"
                            value={form.maxUsers}
                            onChange={set("maxUsers")}
                            error={Boolean(show("maxUsers"))}
                            helperText={show("maxUsers") || "How many people can sign in at the same time, the owner included."}
                            slotProps={{ htmlInput: { min: 1, step: 1 } }}
                            sx={(theme) => ({ maxWidth: { sm: theme.platform.signInMaxWidth / 2 } })}
                        />
                    </Section>

                    <Section title="Company owner" hint="The owner becomes the company's first administrator. They sign in to Pharmalyx with this email, using a password we generate for you to pass on.">
                        <TextField
                            id="owner-name"
                            label="Owner name"
                            required
                            value={form.ownerName}
                            onChange={set("ownerName")}
                            error={Boolean(show("ownerName"))}
                            helperText={show("ownerName") || " "}
                        />
                        <Box sx={twoColumns}>
                            <TextField
                                id="owner-email"
                                label="Owner email"
                                required
                                type="email"
                                value={form.ownerEmail}
                                onChange={set("ownerEmail")}
                                error={Boolean(show("ownerEmail"))}
                                helperText={show("ownerEmail") || "Used to sign in."}
                                autoComplete="off"
                            />
                            <TextField
                                id="owner-phone"
                                label="Owner phone"
                                required
                                value={form.ownerPhone}
                                onChange={set("ownerPhone")}
                                error={Boolean(show("ownerPhone"))}
                                helperText={show("ownerPhone") || " "}
                            />
                        </Box>
                    </Section>

                    <Section title="Notes" hint="Optional: plan, agreement, anything to remember about this customer.">
                        <TextField id="company-notes" label="Notes" multiline minRows={2} value={form.notes} onChange={set("notes")} />
                    </Section>

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
                    {busy ? "Creating company…" : "Create company"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CreateCompanyDialog;
