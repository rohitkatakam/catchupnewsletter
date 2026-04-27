export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <div>{/* TODO: join page for code {code} */}</div>;
}
