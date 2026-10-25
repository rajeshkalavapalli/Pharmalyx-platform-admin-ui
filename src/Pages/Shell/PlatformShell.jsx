import { Outlet, useNavigate } from "react-router-dom";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LogoutRounded } from "@mui/icons-material";

import BrandMark from "../../components/BrandMark/BrandMark";
import Tag from "../../components/Tag/Tag";
import { clearSession, getAdmin } from "../../configurations/session";

// Top bar + centred content. The platform has few pages, so no sidebar.
function PlatformShell() {
    const theme = useTheme();
    const navigate = useNavigate();
    const admin = getAdmin();

    const signOut = () => {
        clearSession();
        navigate("/", { replace: true });
    };

    return (
        <Box sx={(theme) => ({ minHeight: "100dvh", backgroundColor: theme.palette.background.default })}>
            <Box
                component="header"
                sx={(theme) => ({
                    position: "sticky",
                    top: 0,
                    zIndex: theme.zIndex.appBar,
                    height: theme.platform.headerHeight,
                    px: theme.appShell.headerPaddingX,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    backgroundColor: theme.palette.background.paper,
                    borderBottom: "1px solid",
                    borderColor: theme.palette.border.default,
                })}
            >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
                    <BrandMark size={theme.sidebarLayout.markSize} showWordmark tone="light" />
                    <Tag label="Platform" color="primary" />
                </Stack>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    {admin?.name && (
                        <Typography variant="body2" sx={(theme) => ({ color: theme.palette.text.secondary, display: { xs: "none", sm: "block" } })}>
                            {admin.name}
                        </Typography>
                    )}
                    <Button size="small" startIcon={<LogoutRounded />} onClick={signOut}>
                        Sign out
                    </Button>
                </Stack>
            </Box>

            <Box component="main" sx={(theme) => ({ maxWidth: theme.platform.contentMaxWidth, mx: "auto", p: theme.appShell.contentPadding })}>
                <Outlet />
            </Box>
        </Box>
    );
}

export default PlatformShell;
