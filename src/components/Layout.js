import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import axios from "axios";
import {
  LayoutDashboard,
  MessageSquare,
  AlertTriangle,
  FileText,
  Beaker,
  BarChart3,
  History,
  LogOut,
  Sun,
  Moon,
  User,
  Users,
  Bell,
  Menu,
  X,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import { cn, formatDate } from "../lib/utils";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["operator", "supervisor", "admin"],
  },
  {
    label: "Ordens de Serviço",
    path: "/work-orders",
    icon: ClipboardList,
    roles: ["operator", "supervisor", "admin"],
  },
  {
    label: "Assistente IA",
    path: "/assistant",
    icon: MessageSquare,
    roles: ["operator", "supervisor", "admin"],
  },
  {
    label: "Ocorrências",
    path: "/occurrences",
    icon: AlertTriangle,
    roles: ["operator", "supervisor", "admin"],
  },
  {
    label: "Relatórios",
    path: "/reports",
    icon: FileText,
    roles: ["operator", "supervisor", "admin"],
  },
  {
    label: "Dosagem Química",
    path: "/chemicals",
    icon: Beaker,
    roles: ["operator", "supervisor", "admin"],
  },
  {
    label: "Gestão",
    path: "/supervisor",
    icon: BarChart3,
    roles: ["supervisor", "admin"],
  },
  {
    label: "Usuários",
    path: "/users",
    icon: Users,
    roles: ["supervisor", "admin"],
  },
  {
    label: "Histórico",
    path: "/history",
    icon: History,
    roles: ["operator", "supervisor", "admin"],
  },
];

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        axios.get(`${API_URL}/api/notifications?unread_only=false`),
        axios.get(`${API_URL}/api/notifications/count`),
      ]);
      setNotifications(notifRes.data.slice(0, 10));
      setUnreadCount(countRes.data.unread_count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`${API_URL}/api/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API_URL}/api/notifications/mark-all-read`);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) markAsRead(notif.id);
    setNotificationsOpen(false);
    if (notif.type === "work_order_assigned") {
      navigate("/work-orders");
    } else if (notif.occurrence_id) {
      navigate("/occurrences");
    }
  };

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const getRoleLabel = (role) => {
    const labels = {
      operator: "Operador",
      supervisor: "Supervisor",
      admin: "Administrador",
    };
    return labels[role] || role;
  };

  const getUrgencyBadge = (urgency) => {
    const colors = {
      baixa: "bg-emerald-500/15 text-emerald-600",
      media: "bg-amber-500/15 text-amber-600",
      alta: "bg-orange-500/15 text-orange-600",
      critica: "bg-red-500/15 text-red-600",
      urgente: "bg-red-500/15 text-red-600",
    };
    return colors[urgency] || colors.media;
  };

  const NavigationLinks = ({ onItemClick }) => (
    <nav className="px-2 space-y-1">
      {filteredNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onItemClick}
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
          data-testid={`nav-${item.path.replace("/", "")}`}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  const NotificationsPanel = () => (
    <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-md shadow-lg z-50">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="font-semibold text-sm">Notificações</span>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            className="text-xs h-auto py-1"
          >
            Marcar lidas
          </Button>
        )}
      </div>
      <ScrollArea className="h-[300px]">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Nenhuma notificação
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                  !notif.read && "bg-primary/5"
                )}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex items-start gap-2">
                  {notif.urgency && (
                    <Badge
                      className={cn(
                        "text-xs shrink-0",
                        getUrgencyBadge(notif.urgency)
                      )}
                    >
                      {notif.urgency}
                    </Badge>
                  )}
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-sm font-medium mt-1">{notif.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {notif.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(notif.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const UserSection = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2 rounded-sm bg-muted/50">
        <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground">
            {user?.matricula} • {getRoleLabel(user?.role)}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleLogout}
        data-testid="logout-btn"
      >
        <LogOut className="w-4 h-4" />
        Sair do Sistema
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen bg-background" data-testid="main-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar hidden md:flex" data-testid="sidebar">
        <div className="sidebar-header">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-ipiranga.jpg" 
              alt="Ipiranga AI" 
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 className="font-heading font-bold text-lg tracking-tight">
                IPIRANGA AI
              </h1>
              <p className="text-xs text-muted-foreground">
                Tratamento de Caldo
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="sidebar-content">
          <NavigationLinks />
        </ScrollArea>

        <div className="sidebar-footer">
          <Separator className="mb-4" />
          
          {/* Notifications Button */}
          <div className="mb-4 relative">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 relative"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <Bell className="w-4 h-4" />
              <span>Notificações</span>
              {unreadCount > 0 && (
                <Badge className="absolute right-2 bg-red-500 text-white text-xs px-1.5 py-0.5">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            {notificationsOpen && <NotificationsPanel />}
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Tema
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0"
              data-testid="theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>

          <UserSection />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <img 
              src="/logo-ipiranga.jpg" 
              alt="Ipiranga AI" 
              className="h-8 w-auto object-contain"
            />
            <span className="font-heading font-bold">IPIRANGA AI</span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs">
                {unreadCount}
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 w-9 p-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-14 left-0 bottom-0 w-72 bg-card border-r border-border z-50 md:hidden overflow-y-auto">
            <div className="p-4">
              <NavigationLinks onItemClick={() => setMobileMenuOpen(false)} />
            </div>
            <Separator className="my-4" />
            <div className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 mb-4"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                }}
              >
                <Bell className="w-4 h-4" />
                <span>Notificações</span>
                {unreadCount > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white text-xs">
                    {unreadCount}
                  </Badge>
                )}
                <ChevronRight className={cn("w-4 h-4 transition-transform", notificationsOpen && "rotate-90")} />
              </Button>
              
              {notificationsOpen && (
                <div className="mb-4 max-h-60 overflow-y-auto border border-border rounded-md">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "p-3 border-b border-border last:border-0 cursor-pointer",
                          !notif.read && "bg-primary/5"
                        )}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Tema
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="h-8 w-8 p-0"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <UserSection />
            </div>
          </div>
        </>
      )}

      {/* Click outside to close notifications on desktop */}
      {notificationsOpen && !mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 hidden md:block"
          onClick={() => setNotificationsOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="main-content md:ml-0 mt-14 md:mt-0" data-testid="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
