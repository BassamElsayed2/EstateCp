"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getProducts,
  deleteProduct,
  type Product,
  updateProduct,
} from "../../../../../services/apiProduct";
import { useBrands } from "../../../../components/brand/useBrands";

const ProductsList: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const productsPerPage = 10;
  const { data: brands = [], isLoading: brandsLoading } = useBrands();

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  // Delete product mutation
  const deleteProductMutation = useMutation<boolean, Error, string>({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم حذف المنتج بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء حذف المنتج");
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم تحديث المنتج بنجاح");
      setIsEditModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث المنتج");
    },
  });

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + previewUrls.length > 5) {
      toast.error("يمكنك رفع 5 صور كحد أقصى");
      return;
    }
    setSelectedImages(files);

    // Create preview URLs for new images
    const newUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  };

  // Clean up preview URLs when component unmounts
  React.useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  // Handle product deletion with confirmation
  const handleDeleteProduct = (id: string, name: string) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-white dark:bg-[#0c1427] shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <i className="material-symbols-outlined text-danger-500">
                  warning
                </i>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  تأكيد الحذف
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  هل أنت متأكد من حذف المنتج &quot;{name}&quot;؟
                </p>
              </div>
            </div>
            <div className="mt-4 flex space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  deleteProductMutation.mutate(id);
                }}
                className="flex-1 px-4 py-2 bg-danger-500 text-white text-sm font-medium rounded-md hover:bg-danger-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500"
              >
                حذف
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-[#15203c] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-[#1a2942] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      ),
      {
        duration: 5000,
      }
    );
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditedProduct(product);
    // Set existing images
    if (product.images && product.images.length > 0) {
      setPreviewUrls(product.images);
    } else {
      setPreviewUrls([]);
    }
    setSelectedImages([]);
    setIsEditModalOpen(true);
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof Product, value: string | number) => {
    setEditedProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for the field when it's changed
    setFormErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!editedProduct.name_ar?.trim()) {
      errors.name_ar = "اسم المنتج بالعربية مطلوب";
      isValid = false;
    }

    if (!editedProduct.name_en?.trim()) {
      errors.name_en = "اسم المنتج بالإنجليزية مطلوب";
      isValid = false;
    }

    if (!editedProduct.type) {
      errors.type = "نوع المنتج مطلوب";
      isValid = false;
    }

    if (!editedProduct.brand_id) {
      errors.brand_id = "الماركة مطلوبة";
      isValid = false;
    }

    if (!editedProduct.price || editedProduct.price <= 0) {
      errors.price = "السعر يجب أن يكون أكبر من صفر";
      isValid = false;
    }

    if (editedProduct.quantity === undefined || editedProduct.quantity < 0) {
      errors.quantity = "الكمية يجب أن تكون صفر أو أكثر";
      isValid = false;
    }

    if (
      editedProduct.discount !== undefined &&
      (editedProduct.discount < 0 || editedProduct.discount > 100)
    ) {
      errors.discount = "الخصم يجب أن يكون بين 0 و 100";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!selectedProduct) return;

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // Append product data
      Object.entries(editedProduct).forEach(([key, value]) => {
        if (value !== undefined && key !== "images") {
          formData.append(key, value.toString());
        }
      });

      // Append new images
      selectedImages.forEach((file) => {
        formData.append("images", file);
      });

      // Append existing image URLs
      const existingImages = previewUrls.filter(
        (url) => !url.startsWith("blob:")
      );
      formData.append("existingImages", JSON.stringify(existingImages));

      await updateProductMutation.mutateAsync({
        id: selectedProduct.id,
        ...editedProduct,
        images: previewUrls,
      });
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveChanges();
  };

  // Handle modal close
  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      setEditedProduct({});
      setFormErrors({});
      setSelectedImages([]);
      setPreviewUrls([]);
    }
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    const url = previewUrls[index];
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Filter products based on search and filters
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch =
      product.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name_en.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType ? product.type === selectedType : true;
    const matchesBrand = selectedBrand
      ? product.brand_id === selectedBrand
      : true;

    return matchesSearch && matchesType && matchesBrand;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Get brand name
  const getBrandName = (id: string) =>
    brands.find((b) => b.id === id)?.name_ar || "-";

  if (isLoading) {
    return (
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <div className="trezo-card-header mb-[20px] md:mb-[25px]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <label className="leading-none absolute ltr:left-[13px] rtl:right-[13px] text-black dark:text-white mt-px top-1/2 -translate-y-1/2">
                <i className="material-symbols-outlined !text-[20px]">search</i>
              </label>
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 border border-gray-50 h-[36px] text-xs rounded-md w-full block text-black pt-[11px] pb-[12px] ltr:pl-[38px] rtl:pr-[38px] ltr:pr-[13px] ltr:md:pr-[16px] rtl:pl-[13px] rtl:md:pl-[16px] placeholder:text-gray-500 outline-0 dark:bg-[#15203c] dark:text-white dark:border-[#15203c] dark:placeholder:text-gray-400"
              />
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-[36px] rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[13px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-500"
              >
                <option value="">كل الأنواع</option>
                <option value="digital">منتج رقمي</option>
                <option value="physical">منتج مادي</option>
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="h-[36px] rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[13px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-500"
              >
                <option value="">كل الماركات</option>
                {brandsLoading && <option disabled>جاري التحميل...</option>}
                {brands &&
                  brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name_ar}
                    </option>
                  ))}
              </select>
            </div>

            {/* Add Product Button */}
            <div>
              <Link
                href="/dashboard/e-commerce/create-product"
                className="inline-block transition-all rounded-md font-medium px-[13px] py-[6px] text-primary-500 border border-primary-500 hover:bg-primary-500 hover:text-white w-full text-center"
              >
                <span className="inline-block relative ltr:pl-[22px] rtl:pr-[22px]">
                  <i className="material-symbols-outlined !text-[22px] absolute ltr:-left-[4px] rtl:-right-[4px] top-1/2 -translate-y-1/2">
                    add
                  </i>
                  اضافة منتج جديد
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div className="trezo-card-content">
          <div className="table-responsive overflow-x-auto">
            <table className="w-full">
              <thead className="text-black dark:text-white">
                <tr>
                  {[
                    "المنتج",
                    "النوع",
                    "السعر",
                    "الكمية",
                    "الخصم",
                    "الماركة",
                    "الإجراءات",
                  ].map((header, index) => (
                    <th
                      key={index}
                      className="font-medium ltr:text-left rtl:text-right px-[20px] py-[11px] bg-gray-50 dark:bg-[#15203c] whitespace-nowrap ltr:first:rounded-tl-md ltr:last:rounded-tr-md rtl:first:rounded-tr-md rtl:last:rounded-tl-md"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="text-black dark:text-white">
                {paginatedProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                      <div className="flex items-center">
                        <div className="rounded-md w-[40px]">
                          <Image
                            src={product.images[0] || "/images/placeholder.jpg"}
                            alt={product.name_ar}
                            className="inline-block rounded-md"
                            width={40}
                            height={40}
                          />
                        </div>
                        <div className="ltr:ml-[12px] rtl:mr-[12px]">
                          <span className="font-medium inline-block text-[14px] md:text-[15px] transition-all mb-px">
                            {product.name_ar}
                          </span>
                          <span className="block text-sm text-gray-500 dark:text-gray-400">
                            {product.name_en}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                      {product.type === "digital" ? "منتج رقمي" : "منتج مادي"}
                    </td>

                    <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                      ${product.price.toFixed(2)}
                    </td>

                    <td
                      className={`ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l ${
                        product.quantity === 0 ? "text-orange-500" : ""
                      }`}
                    >
                      {product.quantity === 0
                        ? "نفذت الكمية"
                        : product.quantity}
                    </td>

                    <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                      {product.discount}%
                    </td>

                    <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                      {getBrandName(product.brand_id)}
                    </td>

                    <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036] ltr:first:border-l ltr:last:border-r rtl:first:border-r rtl:last:border-l">
                      <div className="flex items-center gap-[9px]">
                        <Link
                          href={`/dashboard/e-commerce/products/${product.id}`}
                          className="text-primary-500 leading-none custom-tooltip"
                          title="عرض"
                        >
                          <i className="material-symbols-outlined !text-md">
                            visibility
                          </i>
                        </Link>

                        <button
                          type="button"
                          className="text-gray-500 dark:text-gray-400 leading-none custom-tooltip"
                          onClick={() => handleEditProduct(product)}
                          title="تعديل"
                        >
                          <i className="material-symbols-outlined !text-md">
                            edit
                          </i>
                        </button>

                        <button
                          type="button"
                          className="text-danger-500 leading-none custom-tooltip"
                          onClick={() =>
                            handleDeleteProduct(product.id, product.name_ar)
                          }
                          title="حذف"
                        >
                          <i className="material-symbols-outlined !text-md">
                            delete
                          </i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-[20px] py-[12px] md:py-[14px] rounded-b-md border-l border-r border-b border-gray-100 dark:border-[#172036] sm:flex sm:items-center justify-between">
            <p className="!mb-0 !text-sm text-gray-500 dark:text-gray-400">
              عرض {paginatedProducts.length} من {filteredProducts.length} نتيجة
            </p>

            <div className="mt-[10px] sm:mt-0 flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-gray-500 dark:text-gray-400 hover:bg-primary-500 hover:text-white hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#0c1427] disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 disabled:hover:border-gray-200 dark:disabled:hover:border-[#172036] transition-all"
              >
                <i className="material-symbols-outlined !text-[20px]">
                  first_page
                </i>
              </button>

              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-gray-500 dark:text-gray-400 hover:bg-primary-500 hover:text-white hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#0c1427] disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 disabled:hover:border-gray-200 dark:disabled:hover:border-[#172036] transition-all"
              >
                <i className="material-symbols-outlined !text-[20px]">
                  chevron_left
                </i>
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-[36px] h-[36px] flex items-center justify-center rounded-md border transition-all ${
                      currentPage === pageNum
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-gray-500 dark:text-gray-400 hover:bg-primary-500 hover:text-white hover:border-primary-500"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-gray-500 dark:text-gray-400 hover:bg-primary-500 hover:text-white hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#0c1427] disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 disabled:hover:border-gray-200 dark:disabled:hover:border-[#172036] transition-all"
              >
                <i className="material-symbols-outlined !text-[20px]">
                  chevron_right
                </i>
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-gray-500 dark:text-gray-400 hover:bg-primary-500 hover:text-white hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#0c1427] disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 disabled:hover:border-gray-200 dark:disabled:hover:border-[#172036] transition-all"
              >
                <i className="material-symbols-outlined !text-[20px]">
                  last_page
                </i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity z-40"
              aria-hidden="true"
              onClick={handleCloseModal}
            >
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <div
              className="inline-block align-bottom bg-white dark:bg-[#0c1427] rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-right w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                      تعديل المنتج
                    </h3>
                    <div className="mt-2">
                      <form
                        id="edit-product-form"
                        className="space-y-4"
                        onSubmit={handleSubmit}
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            اسم المنتج بالعربية *
                          </label>
                          <input
                            type="text"
                            value={editedProduct.name_ar || ""}
                            onChange={(e) =>
                              handleFieldChange("name_ar", e.target.value)
                            }
                            className={`w-full px-3 py-2 border ${
                              formErrors.name_ar
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                            } rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-[#15203c] dark:text-white`}
                            required
                          />
                          {formErrors.name_ar && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.name_ar}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            اسم المنتج بالإنجليزية *
                          </label>
                          <input
                            type="text"
                            value={editedProduct.name_en || ""}
                            onChange={(e) =>
                              handleFieldChange("name_en", e.target.value)
                            }
                            className={`w-full px-3 py-2 border ${
                              formErrors.name_en
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                            } rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-[#15203c] dark:text-white`}
                            required
                          />
                          {formErrors.name_en && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.name_en}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            نوع المنتج *
                          </label>
                          <select
                            value={editedProduct.type || ""}
                            onChange={(e) =>
                              handleFieldChange("type", e.target.value)
                            }
                            className={`w-full px-3 py-2 border ${
                              formErrors.type
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                            } rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-[#15203c] dark:text-white`}
                            required
                          >
                            <option value="">اختر نوع المنتج</option>
                            <option value="digital">منتج رقمي</option>
                            <option value="physical">منتج مادي</option>
                          </select>
                          {formErrors.type && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.type}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            الماركة *
                          </label>
                          <select
                            value={editedProduct.brand_id || ""}
                            onChange={(e) =>
                              handleFieldChange("brand_id", e.target.value)
                            }
                            className={`w-full px-3 py-2 border ${
                              formErrors.brand_id
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                            } rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-[#15203c] dark:text-white`}
                            required
                          >
                            <option value="">اختر الماركة</option>
                            {brandsLoading && (
                              <option disabled>جاري التحميل...</option>
                            )}
                            {brands &&
                              brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                  {brand.name_ar}
                                </option>
                              ))}
                          </select>
                          {formErrors.brand_id && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.brand_id}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            السعر *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editedProduct.price || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                "price",
                                parseFloat(e.target.value)
                              )
                            }
                            className={`w-full px-3 py-2 border ${
                              formErrors.price
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                            } rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-[#15203c] dark:text-white`}
                            required
                          />
                          {formErrors.price && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.price}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            الكمية *
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editedProduct.quantity || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                "quantity",
                                parseInt(e.target.value)
                              )
                            }
                            className={`w-full px-3 py-2 border ${
                              formErrors.quantity
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                            } rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-[#15203c] dark:text-white`}
                            required
                          />
                          {formErrors.quantity && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.quantity}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            الخصم
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editedProduct.discount || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                "discount",
                                parseInt(e.target.value)
                              )
                            }
                            className={`w-full px-3 py-2 border ${
                              formErrors.discount
                                ? "border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                            } rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-[#15203c] dark:text-white`}
                          />
                          {formErrors.discount && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.discount}
                            </p>
                          )}
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            الصور
                          </label>

                          {/* Upload Field */}
                          <div className="mb-4">
                            <label className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#15203c] transition-colors">
                              <div className="flex flex-col items-center justify-center p-4 text-center">
                                <i className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-3xl mb-2">
                                  add_photo_alternate
                                </i>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  <span className="font-medium text-primary-500">
                                    انقر للرفع
                                  </span>
                                  <br />
                                  أو اسحب الصور هنا
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  PNG, JPG, WEBP
                                </p>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Existing Images */}
                          {previewUrls.length > 0 && (
                            <>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {previewUrls.map((url, index) => (
                                  <div
                                    key={index}
                                    className="relative aspect-square group"
                                  >
                                    <Image
                                      src={url}
                                      alt={`Product image ${index + 1}`}
                                      fill
                                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                      className="rounded-lg object-cover"
                                      unoptimized={url.startsWith("blob:")}
                                      style={{
                                        objectFit: "cover",
                                        backgroundColor: "transparent",
                                      }}
                                    />
                                    <div className="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveImage(index)}
                                        className="bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600"
                                      >
                                        <i className="material-symbols-outlined !text-lg">
                                          delete
                                        </i>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center justify-between mt-3 px-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {previewUrls.length} من 5 صور
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewUrls([]);
                                    setSelectedImages([]);
                                  }}
                                  className="text-sm text-danger-500 hover:text-danger-600 transition-colors flex items-center gap-1"
                                >
                                  <i className="material-symbols-outlined !text-lg">
                                    delete_sweep
                                  </i>
                                  حذف الكل
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-[#15203c] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  form="edit-product-form"
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-500 text-base font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-[#0c1427] text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a2942] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductsList;
