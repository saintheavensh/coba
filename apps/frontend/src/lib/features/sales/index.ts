// Sales Feature Module
export { SalesController } from "./sales.controller.svelte";
export { SalesService } from "./sales.service";

// Submodules
export * from "./customers";
export * from "./purchases";

// Components
export { default as PaymentDialog } from "./components/PaymentDialog.svelte";
export { default as ProductCard } from "./components/ProductCard.svelte";
export { default as ProductCatalog } from "./components/ProductCatalog.svelte";
export { default as SalesCart } from "./components/SalesCart.svelte";
export { default as SalesHeader } from "./components/SalesHeader.svelte";

