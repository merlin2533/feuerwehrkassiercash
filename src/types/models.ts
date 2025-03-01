
export interface Denomination {
  value: number;
  count: number;
}

export interface DenominationCount {
  [key: number]: number;
}

export const DEFAULT_DENOMINATIONS = [
  { value: 500, label: "500€" },
  { value: 200, label: "200€" },
  { value: 100, label: "100€" },
  { value: 50, label: "50€" },
  { value: 20, label: "20€" },
  { value: 10, label: "10€" },
  { value: 5, label: "5€" },
  { value: 2, label: "2€" },
  { value: 1, label: "1€" },
  { value: 0.5, label: "50¢" },
  { value: 0.2, label: "20¢" },
  { value: 0.1, label: "10¢" },
  { value: 0.05, label: "5¢" },
  { value: 0.02, label: "2¢" },
  { value: 0.01, label: "1¢" }
];
