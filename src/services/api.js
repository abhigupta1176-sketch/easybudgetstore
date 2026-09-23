import {
  initCms,
  getStore,
  filterProducts,
  getProduct,
  withPrice,
  upsertProduct,
  duplicateProduct,
  archiveProduct,
  restoreProduct,
  deleteProduct,
  upsertCategory,
  deleteCategory,
  reorderCategories,
  updateHomepage,
  updateSettings,
  addQuote,
  updateQuote,
  addOrder,
  updateOrder,
  addMedia,
} from '../lib/cms';
import { getVerifiedOwner } from '../lib/ownerAuth';

export const initDb = initCms;

async function requireAdmin() {
  if (!(await getVerifiedOwner())) {
    throw new Error('Admin access required.');
  }
}

export const api = {
  getProducts: async (params = {}) => ({ products: filterProducts(params) }),
  getAdminProducts: async (params = {}) => {
    await requireAdmin();
    return { products: filterProducts({ ...params, includeArchived: true }) };
  },

  getProductByIdentifier: async (idOrSlug) => {
    const product = getProduct(idOrSlug);
    if (!product || product.status === 'ARCHIVED') throw new Error('Product not found.');
    return { product: withPrice(product) };
  },

  getCategories: async () => {
    const store = getStore();
    return { categories: [...store.categories].sort((a, b) => a.order - b.order) };
  },

  getHomepage: async () => ({ homepage: getStore().homepage }),
  getSettings: async () => ({ settings: getStore().settings }),

  submitBulkQuote: async (quoteData) => {
    const customer_name = String(quoteData.customer_name || quoteData.name || '').trim();
    const business_name = String(quoteData.business_name || quoteData.businessName || '').trim();
    const phone = String(quoteData.phone || quoteData.mobileNumber || '').trim();
    const email = String(quoteData.email || '').trim();
    const quantity = Number(quoteData.quantity || 0);
    const categories = Array.isArray(quoteData.categories)
      ? quoteData.categories.filter(Boolean)
      : quoteData.interestedCategory ? [quoteData.interestedCategory] : [];

    if (!customer_name || !business_name || !phone || categories.length === 0 || quantity <= 0) {
      throw new Error('Please complete the required enquiry details.');
    }
    if (!/^[0-9+()\-\s]{7,20}$/.test(phone)) {
      throw new Error('Enter a valid phone number.');
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error('Enter a valid email address.');
    }

    const quote = addQuote({
      ...quoteData,
      customer_name,
      business_name,
      phone,
      email,
      quantity,
      categories,
      product_name: quoteData.product_name || quoteData.requiredProducts || categories.join(', '),
      city: quoteData.city || '',
      notes: quoteData.notes || quoteData.message || '',
    });
    return { message: 'Enquiry received. We will contact you on WhatsApp shortly.', quote_id: quote.id };
  },

  createOrder: async (orderData) => ({ order: addOrder(orderData) }),
  getOrders: async (status) => {
    await requireAdmin();
    let orders = [...getStore().orders];
    if (status && status !== 'all') orders = orders.filter((o) => o.order_status === status);
    return { orders };
  },
  getBulkQuotes: async () => {
    await requireAdmin();
    return { quotes: getStore().quotes };
  },
  updateOrderStatus: async (id, status) => {
    await requireAdmin();
    updateOrder(id, status);
    return { message: 'Order updated.' };
  },
  updateQuoteStatus: async (id, status) => {
    await requireAdmin();
    updateQuote(id, status);
    return { message: 'Enquiry updated.' };
  },

  getAdminDashboard: async () => {
    await requireAdmin();
    const store = getStore();
    const products = store.products;
    return {
      metrics: {
        total_sales: store.orders.reduce((s, o) => s + (o.total_amount || 0), 0),
        total_orders: store.orders.length,
        total_customers: store.quotes.length,
        total_products: products.filter((p) => p.status !== 'ARCHIVED').length,
        active_products: products.filter((p) => p.visibility === 'visible').length,
        out_of_stock: products.filter((p) => p.stockQuantity <= 0 || p.stockStatus === 'Out of stock').length,
        total_categories: store.categories.length,
        pending_bulk_quotes: store.quotes.filter((q) => q.status === 'NEW').length,
      },
      recent_orders: store.orders.slice(0, 5),
      recent_quotes: store.quotes.slice(0, 5),
      audit_logs: store.audit.slice(0, 10),
      settings: store.settings,
    };
  },

  createProduct: async (data) => {
    await requireAdmin();
    if (!data.name) throw new Error('Product name is required.');
    const product = upsertProduct(data);
    return { message: 'Product saved.', product: withPrice(product) };
  },
  updateProduct: async (id, data) => {
    await requireAdmin();
    const product = upsertProduct({ ...data, id });
    return { message: 'Product updated.', product: withPrice(product) };
  },
  duplicateProduct: async (id) => {
    await requireAdmin();
    return { product: withPrice(duplicateProduct(id)) };
  },
  archiveProduct: async (id) => {
    await requireAdmin();
    archiveProduct(id);
    return { message: 'Product archived.' };
  },
  restoreProduct: async (id) => {
    await requireAdmin();
    restoreProduct(id);
    return { message: 'Product restored.' };
  },
  deleteProduct: async (id) => {
    await requireAdmin();
    deleteProduct(id);
    return { message: 'Product deleted.' };
  },

  createCategory: async (data) => {
    await requireAdmin();
    if (!data.name) throw new Error('Category name is required.');
    return { category: upsertCategory(data) };
  },
  updateCategory: async (id, data) => {
    await requireAdmin();
    return { category: upsertCategory({ ...data, id }) };
  },
  deleteCategory: async (id) => {
    await requireAdmin();
    deleteCategory(id);
    return { message: 'Category deleted.' };
  },
  reorderCategories: async (ids) => {
    await requireAdmin();
    reorderCategories(ids);
    return { message: 'Order saved.' };
  },

  saveHomepage: async (data) => {
    await requireAdmin();
    updateHomepage(data);
    return { homepage: getStore().homepage, message: 'Homepage saved.' };
  },
  updateSettings: async (data) => {
    await requireAdmin();
    updateSettings(data);
    return { settings: getStore().settings, message: 'Settings saved.' };
  },
  getMedia: async () => {
    await requireAdmin();
    return { media: getStore().media || [] };
  },
  addMedia: async (item) => {
    await requireAdmin();
    addMedia(item);
    return { media: getStore().media, message: 'Image saved.' };
  },
};
