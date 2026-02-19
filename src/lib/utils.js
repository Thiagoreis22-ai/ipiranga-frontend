import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateShort = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
};

export const getUrgencyColor = (urgency) => {
  const colors = {
    baixa: "badge-urgency-baixa",
    media: "badge-urgency-media",
    alta: "badge-urgency-alta",
    critica: "badge-urgency-critica",
  };
  return colors[urgency] || colors.baixa;
};

export const getStatusColor = (status) => {
  const colors = {
    aberta: "badge-status-aberta",
    andamento: "badge-status-andamento",
    resolvida: "badge-status-resolvida",
  };
  return colors[status] || colors.aberta;
};

export const getRiskColor = (level) => {
  const colors = {
    BAIXO: "risk-baixo",
    MÉDIO: "risk-medio",
    ALTO: "risk-alto",
    CRÍTICO: "risk-critico",
  };
  return colors[level] || colors.MÉDIO;
};

export const getParameterStatus = (name, value) => {
  const ranges = {
    ph: { min: 6.8, max: 7.2 },
    brix: { min: 14, max: 18 },
    pol: { min: 12, max: 16 },
    turbidity: { min: 0, max: 500 },
    temperature: { min: 103, max: 105 },
    flow: { min: 1, max: 1000 },
  };

  const range = ranges[name];
  if (!range) return "ok";

  if (value < range.min || value > range.max) {
    if (name === "turbidity" && value > 800) return "critical";
    if (name === "ph" && (value < 6.2 || value > 7.8)) return "critical";
    return "warning";
  }
  return "ok";
};
