// Backend compatibility utilities

export async function checkLogoSupport() {
  try {
    // Try to get shop settings to see if logo field is supported
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shop-settings`);
    const settings = await response.json();
    
    // If the response includes a logo field (even if null), backend supports it
    return settings && settings.hasOwnProperty('logo');
  } catch (error) {
    console.warn('Could not check logo support:', error);
    return false;
  }
}

export function sanitizeSettingsForBackend(settings, supportsLogo = true) {
  if (!supportsLogo && settings.logo) {
    console.warn('Backend does not support logo field, removing from request');
    const { logo, ...settingsWithoutLogo } = settings;
    return settingsWithoutLogo;
  }
  return settings;
}