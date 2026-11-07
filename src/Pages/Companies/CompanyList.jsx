import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Box, Button, ButtonBase, Chip, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    AddBusinessRounded,
    BusinessRounded,
    ChevronRightRounded,
    GroupsRounded,
    LocationOnRounded,
    PauseCircleRounded,
    ScheduleRounded,
    SearchRounded,
    VerifiedRounded,
} from "@mui/icons-material";

import EmptyState from "../../components/EmptyState/EmptyState";
import LoadError from "../../components/LoadError/LoadError";
import PageHeader from "../../components/PageHeader/PageHeader";
import Panel from "../../components/Panel/Panel";
import StatCard from "../../components/StatCard/StatCard";
import StatusChip from "../../components/StatusChip/StatusChip";
import CreateCompanyDialog from "./CreateCompanyDialog";
import UsageBar from "./UsageBar";
import { STATUS, errorMessage, formatDate, getCompanies, getOverview } from "./index";
import { HEALTH, ago } from "../Overview/PlatformOverview";

const FILTERS = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "attention", label: "Needs attention" },
    { value: "paused", label: "Paused" },
];

const initials = (name) =>
    String(name || "?")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

// One company: logo tile, status, seats, this week's usage (counts only) and the contact.
function CompanyCard({ company, usage, onOpen }) {
    const status = STATUS[company.status] || STATUS.ACTIVE;
    const health = usage ? HEALTH[usage.health] : null;
    const healthColor = health && health.color !== "default" ? health.color : null;

    return (
        <ButtonBase
            onClick={onOpen}
            sx={(theme) => ({
                display: "block",
                width: "100%",
                textAlign: "left",
                p: 2.25,
                borderRadius: theme.card.radius,
                border: `1px solid ${theme.palette.border.default}`,
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.card.shadow,
                transition: theme.transitions.create(["box-shadow", "border-color", "transform"]),
                "&:hover": { boxShadow: theme.platform.cardHoverShadow, borderColor: alpha(theme.palette.primary.main, theme.tint.border), transform: "translateY(-1px)" },
            })}
        >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Box
                    sx={(theme) => ({
                        width: theme.stat.iconSize,
                        height: theme.stat.iconSize,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: theme.stat.iconRadius,
                        color: theme.palette.common.white,
                        backgroundImage: theme.palette.brand.gradientGlow,
                        ...theme.typography.subtitle2,
                    })}
                >
                    {initials(company.name)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>
                        {company.name}
                    </Typography>
                    <Typography variant="caption" noWrap sx={(theme) => ({ display: "block", color: theme.palette.text.secondary, letterSpacing: theme.typography.overline.letterSpacing })}>
                        {company.code} · since {formatDate(company.createdOn)}
                    </Typography>
                </Box>
                <StatusChip label={status.label} color={status.color} />
            </Stack>

            <Box sx={{ mt: 2 }}>
                <UsageBar used={company.activeUsers} max={company.maxUsers} />
            </Box>

            <Box
                sx={(theme) => ({
                    mt: 2,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 1,
                    p: 1.25,
                    borderRadius: theme.stat.iconRadius,
                    backgroundColor: theme.palette.surface.muted,
                })}
            >
                {[
                    { icon: VerifiedRounded, label: "Health", value: health ? health.label : "—", color: healthColor },
                    { icon: LocationOnRounded, label: "Visits 7d", value: usage ? usage.visits7 : "—" },
                    { icon: ScheduleRounded, label: "Last active", value: usage ? ago(usage.lastActivity) : "—" },
                ].map(({ icon: Icon, label, value, color }) => (
                    <Box key={label} sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                            <Icon sx={(theme) => ({ fontSize: theme.typography.caption.fontSize, color: color ? theme.palette[color].main : theme.palette.text.secondary })} />
                            <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
                                {label}
                            </Typography>
                        </Stack>
                        <Typography variant="subtitle2" noWrap sx={(theme) => ({ color: color ? theme.palette[color].dark : theme.palette.text.primary })}>
                            {value}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 1.75, alignItems: "center" }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                        {company.contactName || "No contact yet"}
                    </Typography>
                    <Typography variant="caption" noWrap sx={{ color: "text.secondary", display: "block" }}>
                        {company.contactEmail || company.contactPhone || "Add a contact on the company page"}
                    </Typography>
                </Box>
                <ChevronRightRounded sx={(theme) => ({ color: theme.palette.text.disabled })} />
            </Stack>
        </ButtonBase>
    );
}

function CompanyList() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);
    const [usage, setUsage] = useState([]);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");

    const load = useCallback(async () => {
        setError("");
        try {
            setData(await getCompanies());
            // Usage counts are extra: the list still works if they can't be loaded.
            getOverview()
                .then((overview) => setUsage(overview.companies || []))
                .catch(() => setUsage([]));
        } catch (err) {
            setError(errorMessage(err, "Failed to load companies."));
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const open = (company) => navigate(`/companies/${company.organisationId}`);

    const usageById = new Map(usage.map((u) => [String(u.organisationId).toLowerCase(), u]));
    const shown = (data?.organisations || []).filter((company) => {
        const u = usageById.get(String(company.organisationId).toLowerCase());
        const q = query.trim().toLowerCase();
        if (q && !`${company.name} ${company.code} ${company.contactName || ""} ${company.contactEmail || ""}`.toLowerCase().includes(q)) return false;
        if (filter === "active") return company.status === "ACTIVE";
        if (filter === "paused") return company.status === "PAUSED";
        if (filter === "attention") {
            const nearLimit = company.maxUsers && company.activeUsers / company.maxUsers >= 0.9;
            return company.status === "ACTIVE" && (nearLimit || (u && ["QUIET", "IDLE"].includes(u.health)));
        }
        return true;
    });

    return (
        <Box>
            <PageHeader
                eyebrow="Platform"
                title="Companies"
                subtitle="Every customer company on Pharmalyx. Each one sees only its own data."
                actions={
                    <Button variant="contained" startIcon={<AddBusinessRounded />} onClick={() => setCreating(true)}>
                        New company
                    </Button>
                }
            />

            {error ? (
                <LoadError title="Couldn't load companies" message={error} onRetry={load} />
            ) : (
                data && (
                    <>
                        <Box sx={{ display: "grid", gap: 2, mb: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
                            <StatCard icon={BusinessRounded} label="Companies" value={data.totals.companies} color="primary" />
                            <StatCard icon={VerifiedRounded} label="Active" value={data.totals.active} color="success" />
                            <StatCard icon={PauseCircleRounded} label="Paused" value={data.totals.paused} color="warning" />
                            <StatCard icon={GroupsRounded} label="Active users" value={data.totals.activeUsers} caption="across all companies" color="info" />
                        </Box>

                        <Panel
                            title="All companies"
                            subtitle={`${shown.length} of ${data.organisations.length} shown`}
                            actions={
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
                                    {FILTERS.map((f) => (
                                        <Chip
                                            key={f.value}
                                            label={f.label}
                                            size="small"
                                            color={filter === f.value ? "primary" : "default"}
                                            variant={filter === f.value ? "filled" : "outlined"}
                                            onClick={() => setFilter(f.value)}
                                        />
                                    ))}
                                    <TextField
                                        size="small"
                                        placeholder="Search companies"
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>) } }}
                                        sx={(theme) => ({ width: theme.platform.searchWidth })}
                                    />
                                </Stack>
                            }
                        >
                            {data.organisations.length === 0 ? (
                                <EmptyState
                                    icon={BusinessRounded}
                                    title="No companies yet"
                                    message="Create the first customer company with its user limit and first administrator."
                                    action={
                                        <Button variant="contained" startIcon={<AddBusinessRounded />} onClick={() => setCreating(true)}>
                                            New company
                                        </Button>
                                    }
                                />
                            ) : shown.length === 0 ? (
                                <Typography variant="body2" sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>
                                    No company matches.
                                </Typography>
                            ) : (
                                <Box
                                    sx={(theme) => ({
                                        display: "grid",
                                        gap: theme.stat.gap,
                                        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                                    })}
                                >
                                    {shown.map((company) => (
                                        <CompanyCard
                                            key={company.organisationId}
                                            company={company}
                                            usage={usageById.get(String(company.organisationId).toLowerCase())}
                                            onOpen={() => open(company)}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Panel>
                    </>
                )
            )}

            {creating && (
                <CreateCompanyDialog
                    onClose={() => setCreating(false)}
                    // The sign-in details are shown once on the next page, so they can be passed on.
                    onCreated={(company, signInDetails) => navigate(`/companies/${company.organisationId}`, { state: { created: signInDetails } })}
                />
            )}
        </Box>
    );
}

export default CompanyList;
