import { AppShell } from "@/components/app-shell";
import { BookScreen } from "@/components/book-screen";
import { baseBooks } from "@/lib/books";

export const dynamicParams = true;

export function generateStaticParams() {
  return baseBooks.map((book) => ({ id: book.id }));
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <BookScreen bookId={id} />
    </AppShell>
  );
}
