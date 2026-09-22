type MatchedProject = {
  name: string;
  description: string;
  url: string;
  tags?: string[];
};

export type TargetedCompany = {
  id: string;
  slug: string;
  company_name: string;
  founder_name: string;
  tech_stack: string[];
  pain_point_summary: string;
  matched_projects: MatchedProject[];
  logo_url: string | null;
  company_url: string | null;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getTargetedCompany(slug: string): Promise<TargetedCompany | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const url = new URL("/rest/v1/targeted_companies", supabaseUrl);
  url.searchParams.set("slug", `eq.${slug}`);
  url.searchParams.set("select", "*");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
      next: { revalidate: 3600, tags: [`targeted-company:${slug}`] },
    });
    // A personalised page must never turn a temporary CRM/database problem into
    // a dead link. Returning null deliberately triggers the normal portfolio.
    if (!response.ok) return null;
    const rows = (await response.json()) as TargetedCompany[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}
