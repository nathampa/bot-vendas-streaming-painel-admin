import { Outlet, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// --- IMPORTAÇÕES ADICIONADAS DO MUI ---
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';

// Ícones
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import InventoryIcon from '@mui/icons-material/Inventory';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
// --- FIM DAS IMPORTAÇÕES ---

const drawerWidth = 240; // Largura da barra lateral

export const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Lista dos nossos links do menu
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Produtos', icon: <ShoppingBagIcon />, path: '/produtos' },
    { text: 'Estoque', icon: <InventoryIcon />, path: '/estoque' },
    { text: 'Tickets', icon: <ConfirmationNumberIcon />, path: '/tickets' },
    { text: 'Gift Cards', icon: <CardGiftcardIcon />, path: '/giftcards' },
    { text: 'Sugestões', icon: <LightbulbIcon />, path: '/sugestoes' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* 1. A Barra Lateral (Sidebar) agora é um "Drawer" */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ padding: 2 }}>
          <Typography variant="h5" component="h1">
            Ferreira Streamings
          </Typography>
          <Typography variant="caption">Painel de Admin</Typography>
        </Box>
        <Divider />

        {/* Lista de Links de Navegação */}
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              {/* O 'component={RouterLink}' faz o botão do MUI funcionar
                  como um link do React Router */}
              <ListItemButton component={RouterLink} to={item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        {/* Botão de Sair (Logout) */}
        <Box sx={{ padding: 2, marginTop: 'auto' }}>
          <Button variant="contained" color="error" onClick={handleLogout} fullWidth>
            Sair
          </Button>
        </Box>
      </Drawer>

      {/* 2. Conteúdo Principal da Página */}
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3 /* p: 3 é o 'padding: 24px' */ }}
      >
        {/* O <Outlet> injeta a página (Dashboard, Produtos, etc.) aqui */}
        <Outlet />
      </Box>
    </Box>
  );
};