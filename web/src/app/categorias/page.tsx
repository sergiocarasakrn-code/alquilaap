import { CategoryPicker } from "@/components/CategoryPicker";

export const metadata = { title: "Categorías", description: "Todo lo que puedes alquilar en Alquilaap, por categorías y subcategorías." };

export default function Categorias() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="h1">Categorías</h1>
      <CategoryPicker mode="links" />
    </div>
  );
}
