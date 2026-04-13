import { format } from "date-fns";

export const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("en-LB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)} LBP`;

export const formatDateTime = (value: string) =>
  format(new Date(value), "MMM dd, yyyy, h:mm a");

export const formatPaymentMethod = (value: string) =>
  value
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const formatItemCount = (count: number) => `${count} item${count === 1 ? "" : "s"}`;
