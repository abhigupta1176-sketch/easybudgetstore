export const IMAGE_SLOTS = [
  { key: 'site-logo', label: 'Main logo', page: 'Header & footer', fallback: '/logo.png', fit: 'contain' },
  { key: 'home-hero', label: 'Hero image', page: 'Homepage', fallback: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop' },
  { key: 'home-why', label: 'Why choose us', page: 'Homepage', fallback: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=1200&auto=format&fit=crop' },
  { key: 'about-story', label: 'Our story image', page: 'About page', fallback: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop' },
  { key: 'instagram-1', label: 'Social tile 1', page: 'Homepage social grid', fallback: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600&auto=format&fit=crop' },
  { key: 'instagram-2', label: 'Social tile 2', page: 'Homepage social grid', fallback: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop' },
  { key: 'instagram-3', label: 'Social tile 3', page: 'Homepage social grid', fallback: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop' },
  { key: 'instagram-4', label: 'Social tile 4', page: 'Homepage social grid', fallback: 'https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?q=80&w=600&auto=format&fit=crop' },
  { key: 'instagram-5', label: 'Social tile 5', page: 'Homepage social grid', fallback: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=600&auto=format&fit=crop' },
  { key: 'instagram-6', label: 'Social tile 6', page: 'Homepage social grid', fallback: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop' },
];

export const IMAGE_SLOT_MAP = Object.fromEntries(IMAGE_SLOTS.map((slot) => [slot.key, slot]));
