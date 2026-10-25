import { Box, LinearProgress, Stack, Typography } from "@mui/material";

// "7 of 10 users" with a bar: amber from 80% used, red when full.
function UsageBar({ used, max }) {
    const share = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
    const color = share >= 100 ? "error" : share >= 80 ? "warning" : "success";

    return (
        <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "baseline" }}>
                <Typography variant="body2" sx={{ fontWeight: "fontWeightMedium", fontVariantNumeric: "tabular-nums" }}>
                    {used} of {max}
                </Typography>
                <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                    users
                </Typography>
            </Stack>
            <LinearProgress
                variant="determinate"
                value={share}
                color={color}
                aria-label={`${used} of ${max} users`}
                sx={(theme) => ({ mt: 0.5, height: theme.platform.usageBarHeight, borderRadius: theme.platform.usageBarHeight })}
            />
        </Box>
    );
}

export default UsageBar;
