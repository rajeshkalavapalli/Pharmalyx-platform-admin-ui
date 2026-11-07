import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Box, Button, ButtonBase, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BusinessRounded, ChevronRightRounded, GroupsRounded, PauseCircleRounded, TrendingUpRounded, WarningAmberRounded, HotelRounded, EventSeatRounded, LocationOnRounded } from "@mui/icons-material";

import LoadError from "../../components/LoadError/LoadError";
import PageHeader from "../../components/PageHeader/PageHeader";
import Panel from "../../components/Panel/Panel";
import StatusChip from "../../components/StatusChip/StatusChip";
import UsageBar from "../Companies/UsageBar";
import { STATUS, errorMessage, formatDate, getOverview } from "../Companies/index";

// The owner's view of the platform: companies, seats, growth and how much each company is using the app.
// Usage is counts only - no names, doctors or other company data.

export const HEALTH = {
    ACTIVE: { label: "Working", color: "success", hint: "Visits this week" },
    QUIET: { label: "Quiet", color: "warning", hint: "No visits this week" },
    IDLE: { label: "Idle", color: "error", hint: "No visits in 30 days" },
    PAUSED: { label: "Paused", color: "default", hint: "Paused by you" },
};

export const ago = (value) => {
    if (!value) return "Never";
    const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
};

// ---------------------------------------------------------
// Dark band
// ---------------------------------------------------------

export function BandTile({ icon: Icon, label, value, caption }) {
    return (
        <Box
            sx={(theme) => ({
                p: 2,
                minWidth: 0,
                borderRadius: theme.platform.band.radius / 1.5,
                backgroundColor: theme.platform.band.tileBackground,
                border: `1px solid ${theme.platform.band.tileBorder}`,
            })}
        >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                <Icon sx={(theme) => ({ fontSize: theme.typography.body1.fontSize, color: theme.platform.band.accent })} />
                <Typography variant="caption" noWrap sx={(theme) => ({ color: theme.platform.band.mutedText })}>
                    {label}
                </Typography>
            </Stack>
            <Typography variant="h4" component="p" sx={(theme) => ({ color: theme.platform.band.text, fontWeight: theme.typography.h3.fontWeight })}>
                {value}
            </Typography>
            <Typography variant="caption" noWrap sx={(theme) => ({ display: "block", mt: 0.5, color: theme.platform.band.faintText })}>
                {caption}
            </Typography>
        </Box>
    );
}

function Band({ totals }) {
    return (
        <Box
            sx={(theme) => ({
                p: theme.platform.band.padding,
                mb: theme.stat.gap,
                borderRadius: theme.platform.band.radius,
                background: theme.platform.band.background,
                boxShadow: theme.platform.band.shadow,
            })}
        >
            <Typography variant="overline" sx={(theme) => ({ color: theme.platform.band.accent })}>
                Platform overview
            </Typography>
            <Typography variant="h5" component="h2" sx={(theme) => ({ color: theme.platform.band.text, fontWeight: theme.typography.h3.fontWeight, mb: 2.5 })}>
                {totals.fieldUsers7} people working across {totals.active} compan{totals.active === 1 ? "y" : "ies"} this week
            </Typography>
            <Box
                sx={(theme) => ({
                    display: "grid",
                    gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" },
                    gap: theme.stat.gap,
                })}
            >
                <BandTile icon={BusinessRounded} label="Companies" value={totals.companies} caption={`${totals.newThisMonth} new this month`} />
                <BandTile icon={GroupsRounded} label="Active" value={totals.active} caption={`${totals.paused} paused`} />
                <BandTile icon={EventSeatRounded} label="Seats used" value={`${totals.seatsUsed}/${totals.seats}`} caption={totals.seatPct == null ? "No seats yet" : `${totals.seatPct}% of all seats`} />
                <BandTile icon={LocationOnRounded} label="Visits this week" value={totals.visits7} caption="All companies, last 7 days" />
                <BandTile icon={TrendingUpRounded} label="People in the field" value={totals.fieldUsers7} caption="Logged a visit this week" />
            </Box>
        </Box>
    );
}

// ---------------------------------------------------------
// Charts (small inline SVG, colours from the theme)
// ---------------------------------------------------------

function TrendBars({ trend }) {
    const theme = useTheme();
    const width = 560;
    const height = theme.platform.chartHeight;
    const max = Math.max(1, ...trend.map((d) => d.visits));
    const slot = width / trend.length;
    const barWidth = slot * 0.62;

    return (
        <Box sx={{ width: "100%", overflow: "hidden" }}>
            <svg viewBox={`0 0 ${width} ${height + 22}`} width="100%" role="img" aria-label="Visits per day, last 14 days">
                {[0.25, 0.5, 0.75, 1].map((f) => (
                    <line key={f} x1="0" x2={width} y1={height - height * f} y2={height - height * f} stroke={theme.palette.border.default} strokeDasharray="3 4" />
                ))}
                {trend.map((d, i) => {
                    const h = (d.visits / max) * (height - 8);
                    const x = i * slot + (slot - barWidth) / 2;
                    const today = i === trend.length - 1;
                    return (
                        <g key={d.day}>
                            <title>{`${new Date(`${d.day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${d.visits} visits, ${d.people} people`}</title>
                            <rect x={x} y={height - h} width={barWidth} height={Math.max(h, d.visits ? 2 : 0)} rx={theme.platform.chartBarRadius} fill={today ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.45)} />
                            {i % 2 === trend.length % 2 || today ? (
                                <text x={x + barWidth / 2} y={height + 16} textAnchor="middle" fontSize="11" fill={theme.palette.text.secondary}>
                                    {new Date(`${d.day}T00:00:00`).getDate()}
                                </text>
                            ) : null}
                        </g>
                    );
                })}
            </svg>
        </Box>
    );
}

function GrowthLine({ growth }) {
    const theme = useTheme();
    const width = 560;
    const height = theme.platform.chartHeight;
    const max = Math.max(1, ...growth.map((g) => g.total));
    const step = width / Math.max(1, growth.length - 1);
    const points = growth.map((g, i) => [i * step, height - (g.total / max) * (height - 12) - 4]);
    const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const area = `${line} L${width},${height} L0,${height} Z`;

    return (
        <Box sx={{ width: "100%", overflow: "hidden" }}>
            <svg viewBox={`-6 0 ${width + 12} ${height + 22}`} width="100%" role="img" aria-label="Companies on the platform, last 12 months">
                <defs>
                    <linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity="0.28" />
                        <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={area} fill="url(#growthFill)" />
                <path d={line} fill="none" stroke={theme.palette.primary.main} strokeWidth="2.5" strokeLinejoin="round" />
                {points.map(([x, y], i) => (
                    <g key={growth[i].month}>
                        <title>{`${growth[i].label}: ${growth[i].total} companies (${growth[i].joined} joined)`}</title>
                        <circle cx={x} cy={y} r={growth[i].joined ? 4.5 : 3} fill={theme.palette.background.paper} stroke={theme.palette.primary.main} strokeWidth="2" />
                        <text x={x} y={height + 16} textAnchor="middle" fontSize="11" fill={theme.palette.text.secondary}>
                            {growth[i].label}
                        </text>
                    </g>
                ))}
            </svg>
        </Box>
    );
}

// ---------------------------------------------------------
// Attention + health table
// ---------------------------------------------------------

function AttentionRow({ icon: Icon, color, title, caption, onClick }) {
    return (
        <ButtonBase
            onClick={onClick}
            sx={(theme) => ({
                width: "100%",
                justifyContent: "flex-start",
                textAlign: "left",
                gap: 1.5,
                p: 1.25,
                borderRadius: theme.card.radius,
                "&:hover": { backgroundColor: theme.palette.action.hover },
            })}
        >
            <Box
                sx={(theme) => ({
                    width: theme.stat.iconSize * 0.8,
                    height: theme.stat.iconSize * 0.8,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: theme.stat.iconRadius,
                    color: theme.palette[color].main,
                    backgroundColor: alpha(theme.palette[color].main, theme.tint.soft),
                })}
            >
                <Icon sx={(theme) => ({ fontSize: theme.typography.body1.fontSize })} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap sx={(theme) => ({ fontWeight: theme.typography.subtitle2.fontWeight })}>
                    {title}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
                    {caption}
                </Typography>
            </Box>
            <ChevronRightRounded sx={{ color: "text.disabled" }} />
        </ButtonBase>
    );
}

function Attention({ attention, onOpen }) {
    const items = [
        ...attention.nearLimit.map((c) => ({ key: `limit-${c.organisationId}`, icon: EventSeatRounded, color: "warning", title: c.name, caption: `${c.seatPct}% of seats used - offer more seats`, id: c.organisationId })),
        ...attention.idle.map((c) => ({ key: `idle-${c.organisationId}`, icon: c.health === "IDLE" ? HotelRounded : WarningAmberRounded, color: c.health === "IDLE" ? "error" : "warning", title: c.name, caption: `${HEALTH[c.health].hint} · last activity ${ago(c.lastActivity).toLowerCase()}`, id: c.organisationId })),
        ...attention.paused.map((c) => ({ key: `paused-${c.organisationId}`, icon: PauseCircleRounded, color: "secondary", title: c.name, caption: "Paused - users cannot sign in", id: c.organisationId })),
    ];

    return (
        <Panel title="Needs attention" subtitle="Seat limits, quiet companies and pauses" sx={{ height: "100%" }}>
            {items.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary", py: 3, textAlign: "center" }}>
                    Every company is working and within its seats.
                </Typography>
            ) : (
                <Stack spacing={0.5}>
                    {items.map((item) => (
                        <AttentionRow key={item.key} {...item} onClick={() => onOpen(item.id)} />
                    ))}
                </Stack>
            )}
        </Panel>
    );
}

function HealthDot({ health }) {
    const h = HEALTH[health];
    return (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box
                sx={(theme) => ({
                    width: theme.platform.healthDot,
                    height: theme.platform.healthDot,
                    borderRadius: "50%",
                    flexShrink: 0,
                    backgroundColor: h.color === "default" ? theme.palette.text.disabled : theme.palette[h.color].main,
                    boxShadow: h.color === "default" ? "none" : `0 0 0 3px ${alpha(theme.palette[h.color].main, theme.tint.soft * 2)}`,
                })}
            />
            <Typography variant="body2">{h.label}</Typography>
        </Stack>
    );
}

function HealthTable({ companies, onOpen }) {
    return (
        <Panel
            title="Company health"
            subtitle="Usage counts only · busiest first"
            actions={
                <Button size="small" endIcon={<ChevronRightRounded />} onClick={() => onOpen(null)}>
                    All companies
                </Button>
            }
            disablePadding
        >
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Company</TableCell>
                            <TableCell>Health</TableCell>
                            <TableCell>Seats</TableCell>
                            <TableCell align="right">Visits (7 days)</TableCell>
                            <TableCell align="right">People working</TableCell>
                            <TableCell align="right">Orders (30 days)</TableCell>
                            <TableCell>Last activity</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {companies.map((c) => (
                            <TableRow key={c.organisationId} hover onClick={() => onOpen(c.organisationId)} sx={{ cursor: "pointer" }}>
                                <TableCell>
                                    <Typography variant="subtitle2">{c.name}</Typography>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            {c.code} · since {formatDate(c.createdOn)}
                                        </Typography>
                                        {c.status === "PAUSED" && <StatusChip {...STATUS.PAUSED} />}
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <HealthDot health={c.health} />
                                </TableCell>
                                <TableCell sx={(theme) => ({ minWidth: theme.platform.limitInputWidth })}>
                                    <UsageBar used={c.seatsUsed} max={c.seats} />
                                </TableCell>
                                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                    {c.visits7}
                                </TableCell>
                                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                    {c.fieldUsers7}
                                </TableCell>
                                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                    {c.orders30}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{ago(c.lastActivity)}</Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Panel>
    );
}

// ---------------------------------------------------------

// One company's usage on a small dark band (company detail page).
export function CompanyUsageBand({ organisationId }) {
    const [company, setCompany] = useState(null);

    useEffect(() => {
        let alive = true;
        getOverview()
            .then((data) => alive && setCompany(data.companies.find((c) => String(c.organisationId).toLowerCase() === String(organisationId).toLowerCase()) || null))
            .catch(() => alive && setCompany(null));
        return () => {
            alive = false;
        };
    }, [organisationId]);

    if (!company) return null;
    const health = HEALTH[company.health];

    return (
        <Box
            sx={(theme) => ({
                p: theme.platform.band.padding,
                borderRadius: theme.platform.band.radius,
                background: theme.platform.band.background,
                boxShadow: theme.platform.band.shadow,
            })}
        >
            <Typography variant="overline" sx={(theme) => ({ color: theme.platform.band.accent })}>
                Usage · counts only
            </Typography>
            <Box
                sx={(theme) => ({
                    mt: 1.5,
                    display: "grid",
                    gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" },
                    gap: theme.stat.gap,
                })}
            >
                <BandTile icon={TrendingUpRounded} label="Health" value={health.label} caption={health.hint} />
                <BandTile icon={LocationOnRounded} label="Visits (7 days)" value={company.visits7} caption={`${company.visits30} in 30 days`} />
                <BandTile icon={GroupsRounded} label="People working" value={company.fieldUsers7} caption="Logged a visit this week" />
                <BandTile icon={BusinessRounded} label="Orders (30 days)" value={company.orders30} caption="POB booked" />
                <BandTile icon={EventSeatRounded} label="Last activity" value={ago(company.lastActivity)} caption={`${company.seatsUsed} of ${company.seats} seats used`} />
            </Box>
        </Box>
    );
}

function PlatformOverview() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setError("");
        try {
            setData(await getOverview());
        } catch (err) {
            setError(errorMessage(err, "Failed to load the overview."));
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const open = (id) => navigate(id ? `/companies/${id}` : "/companies");

    return (
        <>
            <PageHeader eyebrow="Pharmalyx platform" title="Overview" subtitle="How every customer company is doing. Usage is shown as counts only." />

            {error && <LoadError title="Couldn't load the overview" message={error} onRetry={load} />}

            {!data && !error && (
                <Stack spacing={2}>
                    <Skeleton variant="rounded" sx={(theme) => ({ height: theme.platform.skeleton.band })} />
                    <Skeleton variant="rounded" sx={(theme) => ({ height: theme.platform.skeleton.chart })} />
                </Stack>
            )}

            {data && (
                <>
                    <Band totals={data.totals} />

                    <Box
                        sx={(theme) => ({
                            display: "grid",
                            gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "repeat(12, minmax(0, 1fr))" },
                            gap: theme.stat.gap,
                            mb: theme.stat.gap,
                        })}
                    >
                        <Box sx={{ gridColumn: { lg: "span 4" }, minWidth: 0 }}>
                            <Panel title="Visits per day" subtitle="All companies · last 14 days" sx={{ height: "100%" }}>
                                <TrendBars trend={data.trend} />
                            </Panel>
                        </Box>
                        <Box sx={{ gridColumn: { lg: "span 4" }, minWidth: 0 }}>
                            <Panel title="Companies on Pharmalyx" subtitle="Total at the end of each month" sx={{ height: "100%" }}>
                                <GrowthLine growth={data.growth} />
                            </Panel>
                        </Box>
                        <Box sx={{ gridColumn: { lg: "span 4" }, minWidth: 0 }}>
                            <Attention attention={data.attention} onOpen={open} />
                        </Box>
                    </Box>

                    <HealthTable companies={data.companies} onOpen={open} />
                </>
            )}
        </>
    );
}

export default PlatformOverview;
