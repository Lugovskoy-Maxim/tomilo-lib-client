import { notFound } from "next/navigation";
import CollectionDetailsClient from "./collection-details-client";


interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

// Серверный компонент страницы коллекции по ID
export default async function CollectionPage({ params }: CollectionPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Валидация ID
  if (!id || id === 'undefined') {
    notFound();
  }

  return <CollectionDetailsClient collectionId={id} />;
}
