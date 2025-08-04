"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Menu, Dialog } from "@headlessui/react";
import toast from "react-hot-toast";

interface Property {
  id: string;
  name_ar: string;
  name_en: string;
  operation: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  price: number;
  address_ar: string;
  address_en: string;
  details_ar: string;
  details_en: string;
  images: string[];
  isSpecial: boolean;
  created_at: string;
}

const PropertyListContent = () => {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const itemsPerPage = 6;

  const fetchProperties = async ({ pageParam = 1 }) => {
    try {
      let query = supabase.from("properties").select("*", { count: "exact" });

      if (searchQuery) {
        query = query.or(
          `name_ar.ilike.%${searchQuery}%,name_en.ilike.%${searchQuery}%,address_ar.ilike.%${searchQuery}%,address_en.ilike.%${searchQuery}%`
        );
      }

      const startRange = (pageParam - 1) * itemsPerPage;
      const endRange = startRange + itemsPerPage - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(startRange, endRange);

      if (error) throw error;

      if (count) {
        setTotalPages(Math.ceil(count / itemsPerPage));
      }

      return (data || []) as Property[];
    } catch (error) {
      console.error("Error fetching properties:", error);
      throw error;
    }
  };

  const {
    data: properties = [],
    isLoading,
    error: queryError,
  } = useQuery<Property[], Error>({
    queryKey: ["properties", currentPage, searchQuery],
    queryFn: () => fetchProperties({ pageParam: currentPage }),
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (id: string) => {
    setPropertyToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;

    try {
      // First get the property to access its images
      const { data: property, error: fetchError } = await supabase
        .from("properties")
        .select("images")
        .eq("id", propertyToDelete)
        .single();

      if (fetchError) throw fetchError;

      // Delete images from storage
      if (property?.images && property.images.length > 0) {
        for (const imageUrl of property.images) {
          const imagePath = imageUrl.split("/").pop(); // Get the filename from URL
          if (imagePath) {
            const { error: deleteError } = await supabase.storage
              .from("property-images")
              .remove([imagePath]);

            if (deleteError) {
              console.error("Error deleting image:", deleteError);
            }
          }
        }
      }

      // Delete the property record
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyToDelete);

      if (error) throw error;

      toast.success("تم حذف العقار بنجاح", {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#10B981",
          color: "#fff",
          direction: "rtl",
        },
      });

      setIsDeleteModalOpen(false);
      setPropertyToDelete(null);
      router.refresh();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("حدث خطأ أثناء حذف العقار", {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#EF4444",
          color: "#fff",
          direction: "rtl",
        },
      });
    }
  };

  if (queryError) {
    return (
      <div className="text-center text-red-500 p-4">
        حدث خطأ أثناء تحميل البيانات
      </div>
    );
  }

  return (
    <>
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <div className="trezo-card-header sm:flex items-center justify-between">
          <div className="trezo-card-title">
            <form className="relative sm:w-[265px]">
              <label className="leading-none absolute ltr:left-[13px] rtl:right-[13px] text-black dark:text-white mt-px top-1/2 -translate-y-1/2">
                <i className="material-symbols-outlined !text-[20px]">search</i>
              </label>
              <input
                type="text"
                placeholder="ابحث عن عقار..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-gray-50 border border-gray-50 h-[36px] text-xs rounded-md w-full block text-black pt-[11px] pb-[12px] ltr:pl-[38px] rtl:pr-[38px] ltr:pr-[13px] ltr:md:pr-[16px] rtl:pl-[13px] rtl:md:pl-[16px] placeholder:text-gray-500 outline-0 dark:bg-[#15203c] dark:text-white dark:border-[#15203c] dark:placeholder:text-gray-400"
              />
            </form>
          </div>

          <div className="trezo-card-subtitle mt-[15px] sm:mt-0">
            <Link
              href="/dashboard/real-estate/create-estate"
              className="inline-block transition-all rounded-md font-medium px-[13px] py-[6px] text-primary-500 border border-primary-500 hover:bg-primary-500 hover:text-white"
            >
              <span className="inline-block relative ltr:pl-[22px] rtl:pr-[22px]">
                <i className="material-symbols-outlined !text-[22px] absolute ltr:-left-[4px] rtl:-right-[4px] top-1/2 -translate-y-1/2">
                  add
                </i>
                إضافة عقار
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[25px] mb-[25px]">
        {isLoading ? (
          <div className="col-span-full text-center p-4">جاري التحميل...</div>
        ) : properties.length === 0 ? (
          <div className="col-span-full text-center p-4 text-gray-500 dark:text-gray-400">
            لا توجد عقارات متاحة
          </div>
        ) : (
          properties.map((property) => (
            <div
              key={property.id}
              className={`trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md ${
                property.isSpecial
                  ? "ring-2 ring-primary-500 ring-opacity-50"
                  : ""
              }`}
            >
              <div className="trezo-card-header mb-[20px] flex items-center justify-between">
                <div className="trezo-card-title">
                  <h5 className="!mb-0">{property.name_ar}</h5>
                  {property.isSpecial && (
                    <span className="inline-block mt-1 text-xs py-1 px-2 bg-primary-100 text-primary-600 rounded-md">
                      ⭐ عقار خاص
                    </span>
                  )}
                </div>

                <div className="trezo-card-subtitle">
                  <Menu as="div" className="trezo-card-dropdown relative">
                    <Menu.Button className="trezo-card-dropdown-btn inline-block transition-all text-[26px] text-gray-500 dark:text-gray-400 leading-none hover:text-primary-500">
                      <span className="inline-block relative ltr:pr-[17px] ltr:md:pr-[20px] rtl:pl-[17px] rtl:ml:pr-[20px]">
                        <i className="ri-more-fill"></i>
                      </span>
                    </Menu.Button>

                    <Menu.Items className="transition-all bg-white shadow-3xl rounded-md top-full py-[15px] absolute ltr:right-0 rtl:left-0 w-[195px] z-[50] dark:bg-dark dark:shadow-none">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href={`/dashboard/real-estate/edit-estate/${property.id}`}
                            className={`block w-full transition-all text-black cursor-pointer ltr:text-left rtl:text-right relative py-[8px] px-[20px] hover:bg-gray-50 dark:text-white dark:hover:bg-black ${
                              active ? "bg-gray-50 dark:bg-black" : ""
                            }`}
                          >
                            تعديل
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => handleDeleteClick(property.id)}
                            className={`block w-full transition-all text-black cursor-pointer ltr:text-left rtl:text-right relative py-[8px] px-[20px] hover:bg-gray-50 dark:text-white dark:hover:bg-black ${
                              active ? "bg-gray-50 dark:bg-black" : ""
                            }`}
                          >
                            حذف
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                </div>
              </div>

              <div className="trezo-card-content">
                <div className="relative h-[200px] rounded-[5px] overflow-hidden mb-[20px]">
                  <Image
                    src={
                      property.images && property.images.length > 0
                        ? property.images[0]
                        : "/images/properties/property1.jpg"
                    }
                    alt={property.name_ar}
                    fill
                    quality={100}
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>

                <div className="flex items-center justify-between mb-[9px]">
                  <h3 className="!text-lg !mb-0 !text-orange-500">
                    {property.price?.toLocaleString()} ج.م
                  </h3>
                  <span
                    className={`inline-block rounded-[4px] text-xs py-px px-[9px] ${
                      property.operation === "للبيع"
                        ? "bg-success-100 text-success-600"
                        : "bg-secondary-100 text-secondary-600"
                    }`}
                  >
                    {property.operation}
                  </span>
                </div>

                <span className="block relative pt-px ltr:pl-[22px] rtl:pr-[22px]">
                  <i className="material-symbols-outlined text-primary-500 absolute ltr:-left-[2px] rtl:-right-[2px] top-1/2 -translate-y-1/2 !text-[19px]">
                    location_on
                  </i>
                  {property.address_ar}
                </span>

                <ul className="mt-[17px] py-[10px] border-y border-primary-50 dark:border-[#172036]">
                  <li className="inline-block relative ltr:pl-[24px] rtl:pr-[24px] ltr:mr-[20px] rtl:ml-[20px] ltr:last:mr-0 rtl:last:ml-0">
                    <i className="material-symbols-outlined absolute ltr:left-0 rtl:right-0 top-1/2 -translate-y-1/2 text-primary-500 !text-[18px]">
                      bed
                    </i>
                    {property.bedrooms} غرف نوم
                  </li>
                  <li className="inline-block relative ltr:pl-[24px] rtl:pr-[24px] ltr:mr-[20px] rtl:ml-[20px] ltr:last:mr-0 rtl:last:ml-0">
                    <i className="material-symbols-outlined absolute ltr:left-0 rtl:right-0 top-1/2 -translate-y-1/2 text-primary-500 !text-[18px]">
                      bathtub
                    </i>
                    {property.bathrooms} حمام
                  </li>
                  <li className="inline-block relative ltr:pl-[24px] rtl:pr-[24px] ltr:mr-[20px] rtl:ml-[20px] ltr:last:mr-0 rtl:last:ml-0">
                    <i className="material-symbols-outlined absolute ltr:left-0 rtl:right-0 top-1/2 -translate-y-1/2 text-primary-500 !text-[18px]">
                      square_foot
                    </i>
                    {property.area} م²
                  </li>
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
          <div className="trezo-card-content">
            <div className="sm:flex sm:items-center justify-between">
              <p className="!mb-0">
                عرض {properties.length} من {totalPages * itemsPerPage} نتيجة
              </p>

              <ol className="mt-[10px] sm:mt-0">
                <li className="inline-block mx-[2px] ltr:first:ml-0 ltr:last:mr-0 rtl:first:mr-0 rtl:last:ml-0">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-[31px] h-[31px] block leading-[29px] relative text-center rounded-md border border-gray-100 dark:border-[#172036] transition-all hover:bg-primary-500 hover:text-white hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="opacity-0">0</span>
                    <i className="material-symbols-outlined left-0 right-0 absolute top-1/2 -translate-y-1/2">
                      chevron_right
                    </i>
                  </button>
                </li>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <li
                      key={page}
                      className="inline-block mx-[2px] ltr:first:ml-0 ltr:last:mr-0 rtl:first:mr-0 rtl:last:ml-0"
                    >
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`w-[31px] h-[31px] block leading-[29px] relative text-center rounded-md border border-gray-100 dark:border-[#172036] transition-all hover:bg-primary-500 hover:text-white hover:border-primary-500 ${
                          currentPage === page
                            ? "bg-primary-500 text-white border-primary-500"
                            : ""
                        }`}
                      >
                        {page}
                      </button>
                    </li>
                  )
                )}

                <li className="inline-block mx-[2px] ltr:first:ml-0 ltr:last:mr-0 rtl:first:mr-0 rtl:last:ml-0">
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-[31px] h-[31px] block leading-[29px] relative text-center rounded-md border border-gray-100 dark:border-[#172036] transition-all hover:bg-primary-500 hover:text-white hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="opacity-0">0</span>
                    <i className="material-symbols-outlined left-0 right-0 absolute top-1/2 -translate-y-1/2">
                      chevron_left
                    </i>
                  </button>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="relative z-[9999]"
      >
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-[#0c1427] rounded-lg p-6 shadow-2xl transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-semibold text-black dark:text-white">
                تأكيد الحذف
              </Dialog.Title>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                هل أنت متأكد من حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="font-medium inline-block transition-all rounded-md md:text-md py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[#15203c] dark:text-gray-300 dark:hover:bg-[#1a2942]"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleDeleteProperty}
                className="font-medium inline-block transition-all rounded-md md:text-md py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-danger-500 text-white hover:bg-danger-400"
              >
                حذف
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default PropertyListContent;
