/**
 * Generates a variant matrix from parent product name, sizes, and colors.
 *
 * @param {string} parentName - The parent product name
 * @param {string[]} [sizes] - Array of size options
 * @param {string[]} [colors] - Array of color options
 * @returns {{ name: string, variantLabel: string }[]}
 */
export function generateVariantMatrix(parentName, sizes, colors) {
  const hasSizes = Array.isArray(sizes) && sizes.length > 0;
  const hasColors = Array.isArray(colors) && colors.length > 0;

  if (!hasSizes && !hasColors) {
    return [];
  }

  const variants = [];

  if (hasSizes && hasColors) {
    for (const color of colors) {
      for (const size of sizes) {
        const variantLabel = `${color} - ${size}`;
        variants.push({
          name: `${parentName} - ${color} - ${size}`,
          variantLabel,
        });
      }
    }
  } else if (hasSizes) {
    for (const size of sizes) {
      variants.push({
        name: `${parentName} - ${size}`,
        variantLabel: `${size}`,
      });
    }
  } else {
    for (const color of colors) {
      variants.push({
        name: `${parentName} - ${color}`,
        variantLabel: `${color}`,
      });
    }
  }

  return variants;
}

/**
 * Reconciles existing variants against a desired variant matrix.
 *
 * @param {Array<{ variantLabel: string, name: string }>} existingVariants - Current child variants
 * @param {Array<{ name: string, variantLabel: string }>} desiredMatrix - Desired variant matrix from generateVariantMatrix
 * @param {string} newParentName - The (possibly updated) parent product name
 * @param {string} oldParentName - The previous parent product name
 * @returns {{ toCreate: Array<{ name: string, variantLabel: string }>, toDelete: Array<{ variantLabel: string, name: string }>, toUpdate: Array<{ variantLabel: string, name: string, oldName: string }> }}
 */
export function reconcileVariants(existingVariants, desiredMatrix, newParentName, oldParentName) {
  const existingLabels = new Set(existingVariants.map(v => v.variantLabel));
  const desiredLabels = new Set(desiredMatrix.map(v => v.variantLabel));

  const toCreate = desiredMatrix.filter(v => !existingLabels.has(v.variantLabel));
  const toDelete = existingVariants.filter(v => !desiredLabels.has(v.variantLabel));

  const toUpdate = [];
  if (newParentName !== oldParentName) {
    for (const existing of existingVariants) {
      if (desiredLabels.has(existing.variantLabel)) {
        const oldName = existing.name;
        const name = oldName.replace(oldParentName, newParentName);
        toUpdate.push({ variantLabel: existing.variantLabel, name, oldName });
      }
    }
  }

  return { toCreate, toDelete, toUpdate };
}
