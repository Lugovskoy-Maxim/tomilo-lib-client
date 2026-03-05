import { redirect } from "next/navigation";

interface CopyrightPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function CopyrightRedirectPage({ searchParams }: CopyrightPageProps) {
  const params = await searchParams;
  const query = params.lang ? `?lang=${params.lang}` : "";
  redirect(`/dmca${query}`);
}
