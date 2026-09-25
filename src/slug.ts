/**
 * Derives a URL-safe slug from a business name and city.
 *
 * Inputs:  businessName — non-empty, non-whitespace-only string
 *          city         — non-empty, non-whitespace-only string
 * Outputs: lowercase ASCII string matching [a-z0-9-], ≤ 200 chars,
 *          no leading/trailing/consecutive hyphens, form: <name>-<city>
 * Throws:  Error when either input is empty or whitespace-only
 */
export function slugify(businessName: string, city: string): string {
  if (typeof businessName !== "string" || businessName.trim() === "") {
    throw new Error("slugify: businessName must be a non-empty, non-whitespace-only string");
  }
  if (typeof city !== "string" || city.trim() === "") {
    throw new Error("slugify: city must be a non-empty, non-whitespace-only string");
  }

  const processSegment = (s: string): string =>
    s
      .toLowerCase()
      // Replace whitespace runs with a single hyphen
      .replace(/\s+/g, "-")
      // Remove characters that are not ASCII letters, digits, or hyphens
      .replace(/[^a-z0-9-]/g, "")
      // Collapse consecutive hyphens
      .replace(/-{2,}/g, "-")
      // Strip leading/trailing hyphens
      .replace(/^-+|-+$/g, "");

  const namePart = processSegment(businessName);
  const cityPart = processSegment(city);

  if (namePart === "") {
    throw new Error(
      "slugify: businessName produces an empty slug after normalisation (no ASCII alphanumeric characters)",
    );
  }
  if (cityPart === "") {
    throw new Error(
      "slugify: city produces an empty slug after normalisation (no ASCII alphanumeric characters)",
    );
  }

  // Join the two processed segments with a hyphen
  let slug = `${namePart}-${cityPart}`;

  // Collapse any consecutive hyphens that may result from the join
  // (e.g. if namePart or cityPart ended/started with a hyphen after processing)
  slug = slug.replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");

  // Truncate to 200 characters at the nearest preceding hyphen boundary
  if (slug.length > 200) {
    slug = slug.slice(0, 200);
    // Walk back to the nearest hyphen so we don't cut mid-word
    const lastHyphen = slug.lastIndexOf("-");
    if (lastHyphen > 0) {
      slug = slug.slice(0, lastHyphen);
    }
    // Strip any trailing hyphen left by the cut
    slug = slug.replace(/-+$/, "");
  }

  return slug;
}
