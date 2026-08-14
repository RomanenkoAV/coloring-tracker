import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ColoringPageScreen } from "@/components/coloring-page-screen";
import { PAGE_COUNT, baseBooks, isValidPageNumber } from "@/lib/books";

export const dynamicParams = true;

export function generateStaticParams() {
  return baseBooks.flatMap((book) =>
    Array.from({ length: PAGE_COUNT }, (_, index) => ({
      id: book.id,
      pageNumber: String(index + 1),
    })),
  );
}

export default async function ColoringPage({
  params,
}: {
  params: Promise<{ id: string; pageNumber: string }>;
}) {
  const { id, pageNumber: pageNumberParam } = await params;

  if (!isValidPageNumber(pageNumberParam)) {
    notFound();
  }

  return (
    <AppShell>
      <ColoringPageScreen
        bookId={id}
        pageNumber={Number.parseInt(pageNumberParam, 10)}
      />
    </AppShell>
  );
}
