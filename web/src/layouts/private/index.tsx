import type { User } from "firebase/auth";
import { useState } from "react";
import type { ReactNode } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import { useAuth } from "@/features/auth/hooks/use-auth";

interface PrivateLayoutProps {
  children: ReactNode;
  user: User;
}

const getInitial = (user: User) => {
  const label = user.displayName || user.email || "S";
  return label.slice(0, 1).toUpperCase();
};

export function PrivateLayout(props: PrivateLayoutProps) {
  const { children, user } = props;

  const { logout } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const menuOpen = Boolean(menuAnchor);

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const handleLogout = async () => {
    closeMenu();
    await logout();
  };

  return (
    <Box className="min-h-screen w-full bg-slate-100 text-slate-950">
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        className="w-full border-b border-slate-200 bg-white"
      >
        <Toolbar className="gap-4">
          <div className="flex flex-1 items-center gap-2">
            <Typography
              component="h1"
              variant="h6"
              className="font-semibold text-slate-900"
            >
              Sendflow
            </Typography>
          </div>

          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Avatar
              sx={{ width: 32, height: 32, fontSize: 13 }}
              className="bg-blue-600"
            >
              {getInitial(user)}
            </Avatar>

            <Box className="hidden text-left sm:block">
              <Typography className="text-sm font-medium leading-5 text-slate-800">
                {user.displayName || "Cliente"}
              </Typography>
              <Typography className="text-xs leading-4 text-slate-500">
                {user.email}
              </Typography>
            </Box>

            <IconButton
              aria-controls={menuOpen ? "user-menu" : undefined}
              aria-expanded={menuOpen ? "true" : undefined}
              aria-haspopup="menu"
              aria-label="Abrir menu do usuário"
              onClick={openMenu}
              size="small"
              className="text-slate-500"
            >
              <KeyboardArrowDownIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Menu
            id="user-menu"
            anchorEl={menuAnchor}
            open={menuOpen}
            onClose={closeMenu}
            disableScrollLock
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
          >
            <MenuItem onClick={handleLogout}>
              <LogoutIcon className="mr-2 text-slate-500" fontSize="small" />
              Sair
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container component="main" className="py-8">
        {children}
      </Container>
    </Box>
  );
}
