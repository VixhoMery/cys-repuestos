import { useState } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";

import type { CreateProductInput } from "@cys-repuestos/schemas";

import ProductForm from "../../components/products/ProductForm";

import {
  createProduct,
  deleteProduct,
  replaceProductImages,
} from "../../api/products";

import {
  getProductImageErrorMessage,
  prepareProductImages,
  removeStorageImages,
  type ProductFormImage,
} from "../../lib/productImages";

function NewProduct() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (
    data: CreateProductInput,
    images: ProductFormImage[],
  ) => {
    let createdProductId: number | null = null;
    let uploadedPaths: string[] = [];

    try {
      setSaving(true);
      setError("");

      const product = await createProduct(data);
      createdProductId = product.id;

      if (images.length > 0) {
        const prepared = await prepareProductImages(product.id, images);
        uploadedPaths = prepared.uploadedPaths;

        await replaceProductImages(product.id, prepared.metadata);
      }

      navigate("/productos");
    } catch (error: any) {
      console.error("Error creando producto:", error);

      if (uploadedPaths.length > 0) {
        try {
          await removeStorageImages(uploadedPaths);
        } catch (cleanupError) {
          console.error("No fue posible limpiar las imágenes subidas:", cleanupError);
        }
      }

      if (createdProductId !== null) {
        try {
          await deleteProduct(createdProductId);
        } catch (cleanupError) {
          console.error("No fue posible revertir el producto creado:", cleanupError);
        }
      }

      const backendMessage = error?.response?.data?.message;
      const detailedMessage = getProductImageErrorMessage(error);

      setError(
        backendMessage ||
          detailedMessage ||
          "No fue posible crear el producto.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      {/* Volver */}
      <button
        type="button"
        onClick={() => navigate("/productos")}
        className="
          mb-6
          inline-flex
          items-center
          gap-2
          text-sm
          font-medium
          text-slate-500
          transition
          hover:text-slate-900
        "
      >
        <ArrowLeft size={18} />
        Volver a productos
      </button>

      {/* Encabezado */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Agregar producto</h1>

        <p className="mt-1 text-slate-500">
          Ingresa la información del nuevo producto.
        </p>
      </header>

      {/* Error */}
      {error && (
        <div
          className="
            mb-6
            flex items-center
            gap-3
            rounded-xl
            border border-red-200
            bg-red-50
            px-5 py-4
            text-red-700
          "
        >
          <AlertCircle size={20} />

          <span>{error}</span>
        </div>
      )}

      {/* Formulario */}
      <div
        className={`
          mx-auto
          w-full
          max-w-4xl
          ${saving ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <ProductForm mode="create" onSubmit={handleSubmit} />
      </div>

      {saving && (
        <p className="mt-4 text-sm text-slate-500">Guardando producto...</p>
      )}
    </section>
  );
}

export default NewProduct;
