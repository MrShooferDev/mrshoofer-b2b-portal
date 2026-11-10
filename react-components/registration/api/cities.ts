let cache: Promise<string[]> | null = null;

/** GET /TaxiTrips/SupportedCities → string[]. Cached per page load. */
export function fetchCities(): Promise<string[]> {
  if (!cache) {
    cache = fetch("/TaxiTrips/SupportedCities", { headers: { Accept: "application/json" }, credentials: "same-origin" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data: unknown) => (Array.isArray(data) ? data.filter((x): x is string => typeof x === "string") : []))
      .catch(() => {
        cache = null;
        return [];
      });
  }
  return cache;
}
