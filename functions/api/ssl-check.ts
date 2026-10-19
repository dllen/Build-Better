import type { PagesFunction } from "@cloudflare/workers-types";

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const domain = url.searchParams.get("domain")?.trim().toLowerCase();

  if (!domain) {
    return Response.json({ error: "Missing 'domain' query parameter" }, { status: 400 });
  }

  // Basic domain validation
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
    return Response.json({ error: "Invalid domain format" }, { status: 400 });
  }

  try {
    // Use a reliable free API to get cert info
    const apiUrl = `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`;
    const resp = await fetch(apiUrl, {
      headers: { "User-Agent": "BuildBetter-SSLCheck/1.0" },
    });

    if (!resp.ok) {
      throw new Error(`Certificate lookup failed (HTTP ${resp.status})`);
    }

    const entries = await resp.json() as Array<{
      issuer_ca_id: number;
      issuer_name: string;
      common_name: string;
      name_value: string;
      not_before: string;
      not_after: string;
      serial_number: string;
    }>;

    if (!Array.isArray(entries) || entries.length === 0) {
      return Response.json({ error: "No certificates found for this domain" }, { status: 404 });
    }

    // Find the newest non-expired entry (or the latest one)
    const now = new Date();
    const sorted = entries
      .map((e) => ({
        ...e,
        notBefore: new Date(e.not_before),
        notAfter: new Date(e.not_after),
      }))
      .sort((a, b) => b.notAfter.getTime() - a.notAfter.getTime());

    const best = sorted[0];

    // Parse SANs from name_value (newline-separated)
    const sans = best.name_value
      ? best.name_value.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];

    // Deduplicate SANs
    const uniqueSans = [...new Set(sans)];

    const daysRemaining = Math.floor(
      (best.notAfter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Response.json({
      subject: best.common_name || domain,
      issuer: best.issuer_name || "Unknown",
      validFrom: best.not_before || "Unknown",
      validTo: best.not_after || "Unknown",
      daysRemaining,
      serialNumber: best.serial_number || "Unknown",
      sans: uniqueSans.slice(0, 20), // Limit to 20 SANs
      isExpired: daysRemaining < 0,
      isSelfSigned: best.issuer_name?.includes(best.common_name) || false,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);

    // If crt.sh fails, try a simpler approach: fetch the domain and check response headers
    try {
      await fetch(`https://${domain}`, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });

      // We can't actually read cert info from fetch in Workers,
      // but if it connected successfully, the cert is valid
      return Response.json({
        subject: domain,
        issuer: "Could not retrieve details",
        validFrom: "—",
        validTo: "—",
        daysRemaining: 0,
        serialNumber: "—",
        sans: [],
        isExpired: false,
        isSelfSigned: false,
        note: "Certificate details limited — crt.sh unavailable. Domain responded successfully on HTTPS.",
      });
    } catch {
      return Response.json(
        { error: `Could not check certificate: ${msg}` },
        { status: 502 }
      );
    }
  }
};