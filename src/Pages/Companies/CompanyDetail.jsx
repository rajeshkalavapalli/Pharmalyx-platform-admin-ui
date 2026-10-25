import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { Alert, Box, Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { ArrowBackRounded, ContentCopyRounded, KeyRounded, PauseCircleRounded, PlayCircleRounded, SaveRounded } from "@mui/icons-material";

import ConfirmActionDialog from "../../components/ConfirmActionDialog/ConfirmActionDialog";
import EmptyState from "../../components/EmptyState/EmptyState";
import LoadError from "../../components/LoadError/LoadError";
import PageHeader from "../../components/PageHeader/PageHeader";
import Panel from "../../components/Panel/Panel";
import StatusChip from "../../components/StatusChip/StatusChip";
import Tag from "../../components/Tag/Tag";
import { useSnackbar } from "../../components/Snackbar/SnackbarContext";
import AdminPasswordDialog from "./AdminPasswordDialog";
import UsageBar from "./UsageBar";
import { ACTION_LABEL, STATUS, errorMessage, formatDate, formatDateTime, getCompany, setCompanyStatus, updateCompany } from "./index";

// Where company users sign in (the main Pharmalyx app).
const APP_ADDRESS = "http://localhost:5173";

const copy = async (text, showSnackbar) => {
    try {
        await navigator.clipboard.writeText(text);
        showSnackbar("Copied", "success");
    } catch {
        showSnackbar("Couldn't copy; select the text instead.", "warning");
    }
};

// Shown once, right after creating the company or setting a password.
function SignInDetails({ title, userName, password, onDismiss }) {
    const { showSnackbar } = useSnackbar();
    const text = `Pharmalyx sign-in\nAddress: ${APP_ADDRESS}\nUsername: ${userName}\nPassword: ${password}`;
    return (
        <Alert
            severity="success"
            variant="outlined"
            sx={{ mb: 2 }}
            action={
                <Stack direction="row" spacing={1}>
                    <Button size="small" startIcon={<ContentCopyRounded />} onClick={() => copy(text, showSnackbar)}>
                        Copy
                    </Button>
                    <Button size="small" onClick={onDismiss}>
                        Done
                    </Button>
                </Stack>
            }
        >
            <Typography variant="subtitle2">{title}</Typography>
            <Typography variant="body2" component="div" sx={{ whiteSpace: "pre-line" }}>
                {`Share these with the administrator. The password isn't shown again.\nAddress: ${APP_ADDRESS}\nUsername: ${userName}\nPassword: ${password}`}
            </Typography>
        </Alert>
    );
}

function LimitPanel({ organisation, onSaved }) {
    const { showSnackbar } = useSnackbar();
    const [limit, setLimit] = useState(String(organisation.maxUsers));
    const [busy, setBusy] = useState(false);
    const value = Number(limit);
    const tooLow = Number.isInteger(value) && value < organisation.activeUsers;
    const invalid = !Number.isInteger(value) || value < 1;
    const changed = value !== organisation.maxUsers;

    const save = async () => {
        setBusy(true);
        try {
            onSaved(await updateCompany(organisation.organisationId, { maxUsers: value }));
            showSnackbar("User limit saved", "success");
        } catch (err) {
            showSnackbar(errorMessage(err, "Couldn't save the limit."), "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Panel title="User limit" subtitle="Active users allowed, the admin included. Deactivated users don't count.">
            <Stack spacing={2}>
                <UsageBar used={organisation.activeUsers} max={organisation.maxUsers} />
                <Typography variant="body2" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                    {organisation.freeSeats} free · {organisation.totalUsers} users in total (including deactivated)
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                    <TextField
                        id="company-limit"
                        size="small"
                        type="number"
                        label="New limit"
                        value={limit}
                        onChange={(event) => setLimit(event.target.value)}
                        error={invalid || tooLow}
                        helperText={tooLow ? `At least ${organisation.activeUsers} (users active now).` : " "}
                        sx={(theme) => ({ width: theme.platform.limitInputWidth })}
                        slotProps={{ htmlInput: { min: 1, step: 1 } }}
                    />
                    <Button variant="contained" startIcon={<SaveRounded />} disabled={!changed || invalid || tooLow || busy} onClick={save}>
                        Save
                    </Button>
                </Stack>
            </Stack>
        </Panel>
    );
}

function DetailsPanel({ organisation, onSaved }) {
    const { showSnackbar } = useSnackbar();
    const initial = {
        name: organisation.name || "",
        contactName: organisation.contactName || "",
        contactEmail: organisation.contactEmail || "",
        contactPhone: organisation.contactPhone || "",
        notes: organisation.notes || "",
    };
    const [form, setForm] = useState(initial);
    const [busy, setBusy] = useState(false);
    const changes = Object.fromEntries(Object.entries(form).filter(([key, value]) => value !== initial[key]));

    const save = async () => {
        setBusy(true);
        try {
            onSaved(await updateCompany(organisation.organisationId, changes));
            showSnackbar("Details saved", "success");
        } catch (err) {
            showSnackbar(errorMessage(err, "Couldn't save the details."), "error");
        } finally {
            setBusy(false);
        }
    };
    const field = (key, label, extra = {}) => (
        <TextField id={`company-${key}`} size="small" label={label} value={form[key]} onChange={(event) => setForm((c) => ({ ...c, [key]: event.target.value }))} {...extra} />
    );

    return (
        <Panel
            title="Details"
            subtitle={`Code ${organisation.code} · created ${formatDate(organisation.createdOn)}`}
            actions={
                <Button size="small" variant="contained" startIcon={<SaveRounded />} disabled={!Object.keys(changes).length || !form.name.trim() || busy} onClick={save}>
                    Save
                </Button>
            }
        >
            <Stack spacing={2}>
                {field("name", "Company name", { required: true })}
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
                    {field("contactName", "Contact name")}
                    {field("contactEmail", "Contact email")}
                    {field("contactPhone", "Contact phone")}
                </Box>
                {field("notes", "Notes", { multiline: true, minRows: 2 })}
            </Stack>
        </Panel>
    );
}

function CompanyDetail() {
    const { organisationId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showSnackbar } = useSnackbar();

    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [confirm, setConfirm] = useState(false);
    const [busy, setBusy] = useState(false);
    const [resetFor, setResetFor] = useState(null);
    const [shown, setShown] = useState(location.state?.created ? { title: "Company created: send the owner these sign-in details", ...location.state.created } : null);

    const load = useCallback(async () => {
        setError("");
        try {
            setData(await getCompany(organisationId));
        } catch (err) {
            setError(errorMessage(err, "Failed to load the company."));
        }
    }, [organisationId]);

    useEffect(() => {
        load();
        // The sign-in details live only in this page's state, not in the browser history.
        if (location.state?.created) navigate(location.pathname, { replace: true, state: null });
    }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

    const organisation = data?.organisation;
    const paused = organisation?.status === "PAUSED";

    const toggleStatus = async () => {
        setBusy(true);
        try {
            setData(await setCompanyStatus(organisationId, paused ? "ACTIVE" : "PAUSED"));
            showSnackbar(paused ? "Company resumed" : "Company paused", "success");
            setConfirm(false);
        } catch (err) {
            showSnackbar(errorMessage(err, "Couldn't change the status."), "error");
        } finally {
            setBusy(false);
        }
    };

    const status = organisation ? STATUS[organisation.status] || STATUS.ACTIVE : null;

    return (
        <Box>
            <PageHeader
                eyebrow="Company"
                title={organisation?.name || "Company"}
                status={status && <StatusChip label={status.label} color={status.color} />}
                subtitle={organisation ? `${organisation.activeUsers} of ${organisation.maxUsers} users active` : undefined}
                actions={
                    <Stack direction="row" spacing={1}>
                        <Button startIcon={<ArrowBackRounded />} onClick={() => navigate("/companies")}>
                            Companies
                        </Button>
                        {organisation && (
                            <Button
                                variant="outlined"
                                color={paused ? "success" : "warning"}
                                startIcon={paused ? <PlayCircleRounded /> : <PauseCircleRounded />}
                                onClick={() => setConfirm(true)}
                            >
                                {paused ? "Resume" : "Pause"}
                            </Button>
                        )}
                    </Stack>
                }
            />

            {shown && <SignInDetails {...shown} onDismiss={() => setShown(null)} />}

            {paused && (
                <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
                    This company is paused: its people can't sign in, and anyone signed in is signed out within a minute. Their data is kept.
                </Alert>
            )}

            {error ? (
                <LoadError title="Couldn't load the company" message={error} onRetry={load} />
            ) : (
                organisation && (
                    <Stack spacing={2}>
                        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, alignItems: "start" }}>
                            <LimitPanel key={`limit-${organisation.maxUsers}`} organisation={organisation} onSaved={setData} />
                            <DetailsPanel key={`details-${organisation.modifiedOn}`} organisation={organisation} onSaved={setData} />
                        </Box>

                        <Panel title="Administrators" subtitle="People with the Administrator role. They manage the company's users and data in the Pharmalyx app.">
                            {data.admins.length === 0 ? (
                                <EmptyState icon={KeyRounded} title="No administrators" message="This company has no one with the Administrator role." />
                            ) : (
                                <Stack divider={<Divider />}>
                                    {data.admins.map((admin) => (
                                        <Stack key={admin.userId} direction={{ xs: "column", sm: "row" }} sx={{ py: 1.5, gap: 1.5, alignItems: { sm: "center" } }}>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                                    <Typography variant="subtitle2">{admin.name || admin.userName}</Typography>
                                                    {!admin.active && <Tag label="Deactivated" color="secondary" />}
                                                </Stack>
                                                <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                                                    {admin.userName}
                                                    {admin.email ? ` · ${admin.email}` : ""}
                                                </Typography>
                                            </Box>
                                            <Button size="small" startIcon={<KeyRounded />} onClick={() => setResetFor(admin)}>
                                                Set new password
                                            </Button>
                                        </Stack>
                                    ))}
                                </Stack>
                            )}
                        </Panel>

                        <Panel title="History" subtitle="What the platform team changed for this company.">
                            {data.history.length === 0 ? (
                                <Typography variant="body2" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                                    Nothing yet.
                                </Typography>
                            ) : (
                                <Stack divider={<Divider />}>
                                    {data.history.map((entry, index) => (
                                        <Stack key={index} direction="row" sx={{ py: 1, gap: 2, justifyContent: "space-between" }}>
                                            <Typography variant="body2">
                                                {ACTION_LABEL[entry.action] || entry.action}
                                                {entry.action === "SET_LIMIT" && entry.details?.after?.maxUsers ? `: ${entry.details.before?.maxUsers ?? "?"} → ${entry.details.after.maxUsers}` : ""}
                                                {entry.by ? ` · ${entry.by}` : ""}
                                            </Typography>
                                            <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary, whiteSpace: "nowrap" })}>
                                                {formatDateTime(entry.at)}
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            )}
                        </Panel>
                    </Stack>
                )
            )}

            {confirm && organisation && (
                <ConfirmActionDialog
                    icon={paused ? PlayCircleRounded : PauseCircleRounded}
                    color={paused ? "success" : "warning"}
                    title={paused ? `Resume ${organisation.name}?` : `Pause ${organisation.name}?`}
                    message={
                        paused
                            ? "Its people can sign in again straight away."
                            : "Its people can't sign in, and anyone signed in is signed out within a minute. Nothing is deleted; you can resume any time."
                    }
                    confirmLabel={paused ? "Resume" : "Pause"}
                    busy={busy}
                    onClose={() => setConfirm(false)}
                    onConfirm={toggleStatus}
                />
            )}

            {resetFor && (
                <AdminPasswordDialog
                    organisationId={organisationId}
                    admin={resetFor}
                    onClose={() => setResetFor(null)}
                    onDone={(password) => {
                        setShown({ title: `New password for ${resetFor.name || resetFor.userName}`, userName: resetFor.userName, password });
                        setResetFor(null);
                        load();
                    }}
                />
            )}
        </Box>
    );
}

export default CompanyDetail;
