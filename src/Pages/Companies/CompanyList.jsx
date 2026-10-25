import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { AddBusinessRounded, BusinessRounded, GroupsRounded, PauseCircleRounded, VerifiedRounded } from "@mui/icons-material";

import EmptyState from "../../components/EmptyState/EmptyState";
import LoadError from "../../components/LoadError/LoadError";
import PageHeader from "../../components/PageHeader/PageHeader";
import Panel from "../../components/Panel/Panel";
import StatCard from "../../components/StatCard/StatCard";
import StatusChip from "../../components/StatusChip/StatusChip";
import CreateCompanyDialog from "./CreateCompanyDialog";
import UsageBar from "./UsageBar";
import { STATUS, errorMessage, formatDate, getCompanies } from "./index";

function CompanyList() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);

    const load = useCallback(async () => {
        setError("");
        try {
            setData(await getCompanies());
        } catch (err) {
            setError(errorMessage(err, "Failed to load companies."));
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const open = (company) => navigate(`/companies/${company.organisationId}`);

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

                        <Panel title="All companies" disablePadding>
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
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Company</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Users</TableCell>
                                                <TableCell>Contact</TableCell>
                                                <TableCell>Created</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.organisations.map((company) => {
                                                const status = STATUS[company.status] || STATUS.ACTIVE;
                                                return (
                                                    <TableRow
                                                        key={company.organisationId}
                                                        hover
                                                        tabIndex={0}
                                                        onClick={() => open(company)}
                                                        onKeyDown={(event) => event.key === "Enter" && open(company)}
                                                        sx={{ cursor: "pointer" }}
                                                    >
                                                        <TableCell>
                                                            <Typography variant="subtitle2">{company.name}</Typography>
                                                            <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary, letterSpacing: theme.typography.overline.letterSpacing })}>
                                                                {company.code}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <StatusChip label={status.label} color={status.color} />
                                                        </TableCell>
                                                        <TableCell sx={(theme) => ({ minWidth: theme.platform.limitInputWidth })}>
                                                            <UsageBar used={company.activeUsers} max={company.maxUsers} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">{company.contactName || "—"}</Typography>
                                                            {company.contactEmail && (
                                                                <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                                                                    {company.contactEmail}
                                                                </Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{formatDate(company.createdOn)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
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
