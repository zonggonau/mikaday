/** Shipping address stored on an order (Order.shippingAddress JSON). */
export interface ShippingAddress {
  name: string;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  state?: string | null; // state/province code (required by Printful for US, CA, AU, …)
  zip?: string | null;
  country: string; // ISO 3166-1 alpha-2
  phone?: string | null;
}
