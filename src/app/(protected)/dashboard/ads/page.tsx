"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import supabase from "../../../../../services/supabase";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";

export interface Ad {
  id: string;
  title_ar: string;
  title_en: string;
  image_url: string;
  location: string;
  created_at: string;
  link: string;
}

type FormData = {
  title_ar: string;
  title_en: string;
  link: string;
  location: string;
};

const AdsList: React.FC = () => {
  const [adsList, setAdsList] = useState<Ad[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const adsPerPage = 8;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>();

  useEffect(() => {
    const fetchAds = async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching ads:", error.message);
      } else {
        setAdsList(data as Ad[]);
      }
    };

    fetchAds();
  }, []);

  const handleDeleteAd = async (id: string) => {
    try {
      // First get the ad to get its image URL
      const { data: ad, error: fetchError } = await supabase
        .from("ads")
        .select("image_url")
        .eq("id", id)
        .single();

      if (fetchError) {
        throw new Error("فشل في جلب بيانات الإعلان");
      }

      // Extract the file path from the image URL
      const imageUrl = ad.image_url;
      const urlParts = imageUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];

      if (fileName) {
        // Delete the image from storage
        const { error: storageError } = await supabase.storage
          .from("adsmedia")
          .remove([fileName]);

        if (storageError) {
          console.error("Error deleting image:", storageError);
          throw new Error("فشل في حذف الصورة من التخزين");
        }
      }

      // Delete the ad record
      const { error: deleteError } = await supabase
        .from("ads")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw new Error("فشل في حذف الإعلان");
      }

      setAdsList((prev) => prev.filter((ad) => ad.id !== id));
      toast.success("تم حذف الإعلان والصورة بنجاح");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleEditClick = (ad: Ad) => {
    setSelectedAd(ad);
    setValue("title_ar", ad.title_ar);
    setValue("title_en", ad.title_en);
    setValue("link", ad.link);
    setValue("location", ad.location);
    setPreviewImage(ad.image_url);
    setIsEditModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const onEditSubmit = async (data: FormData) => {
    if (!selectedAd) return;
    setLoading(true);

    try {
      let imageUrl = selectedAd.image_url;

      if (selectedImage) {
        const fileExt = selectedImage.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: imageUploadError } = await supabase.storage
          .from("adsmedia")
          .upload(fileName, selectedImage);

        if (imageUploadError) {
          throw new Error("فشل في رفع الصورة");
        }

        imageUrl = supabase.storage.from("adsmedia").getPublicUrl(fileName)
          .data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("ads")
        .update({ ...data, image_url: imageUrl })
        .eq("id", selectedAd.id);

      if (updateError) {
        throw new Error("حدث خطأ أثناء تحديث البيانات");
      }

      setAdsList((prev) =>
        prev.map((ad) =>
          ad.id === selectedAd.id ? { ...ad, ...data, image_url: imageUrl } : ad
        )
      );

      toast.success("تم تحديث الإعلان بنجاح");
      setIsEditModalOpen(false);
      reset();
      setSelectedImage(null);
      setPreviewImage(null);
      setSelectedAd(null);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ البحث والفلترة
  const filteredAds = adsList.filter((ad) => {
    const matchesSearch =
      ad.title_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.title_en.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !locationFilter || ad.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

  const totalPages = Math.ceil(filteredAds.length / adsPerPage);
  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * adsPerPage,
    currentPage * adsPerPage
  );

  // Get unique locations for filter dropdown
  const uniqueLocations = Array.from(new Set(adsList.map((ad) => ad.location)));

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      <div className="trezo-tabs ads-tabs">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-[20px] md:mb-[25px] gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="ابحث عن إعلان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-[#15203c] dark:text-white"
              />
              <i className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </i>
            </div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-[#15203c] dark:text-white"
            >
              <option value="">كل المواقع</option>
              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          <Link
            href="/dashboard/ads/create-ads"
            className="inline-block transition-all rounded-md font-medium px-[13px] py-[6px] text-primary-500 border border-primary-500 hover:bg-primary-500 hover:text-white"
          >
            <span className="relative pl-6">
              <i className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2">
                add
              </i>
              أضف أعلان جديد
            </span>
          </Link>
        </div>

        <div className="table-responsive overflow-x-auto">
          <table className="w-full">
            <thead className="text-black dark:text-white text-end">
              <tr>
                {["العنوان", "الصوره", "مكان النشر", "التاريخ", "أجرأت"].map(
                  (head, i) => (
                    <th
                      key={i}
                      className="font-medium ltr:text-left rtl:text-right px-[20px] py-[11px] bg-gray-50 dark:bg-[#15203c]"
                    >
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedAds.map((ad) => (
                <tr
                  key={ad.id}
                  className="border-t border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 px-3 font-semibold">{ad.title_ar}</td>
                  <td className="py-3 px-3">
                    <Image
                      src={ad.image_url}
                      alt={ad.title_en}
                      width={60}
                      height={40}
                      className="rounded"
                    />
                  </td>
                  <td className="py-3 px-3">
                    {ad.location === "home" ? "الرئيسية" : "أخرى"}
                  </td>
                  <td className="py-3 px-3">
                    {new Date(ad.created_at).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(ad)}
                        className="text-primary-500 leading-none"
                      >
                        <i className="material-symbols-outlined !text-md">
                          edit
                        </i>
                      </button>
                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        className="text-danger-500 leading-none"
                      >
                        <i className="material-symbols-outlined !text-md">
                          delete
                        </i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedAds.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-5 text-center text-gray-400">
                    No ads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#0c1427] p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-black dark:text-white">
                  تعديل الإعلان
                </h3>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    reset();
                    setSelectedImage(null);
                    setPreviewImage(null);
                    setSelectedAd(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <i className="material-symbols-outlined">close</i>
                </button>
              </div>

              <form onSubmit={handleSubmit(onEditSubmit)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      العنوان (ar)
                    </label>
                    <input
                      {...register("title_ar", { required: true })}
                      className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-4 block w-full outline-0 transition-all"
                    />
                    {errors.title_ar && (
                      <p className="text-red-500 mt-1">مطلوب</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      العنوان (en)
                    </label>
                    <input
                      {...register("title_en", { required: true })}
                      className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-4 block w-full outline-0 transition-all"
                    />
                    {errors.title_en && (
                      <p className="text-red-500 mt-1">Required</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      رابط الإعلان
                    </label>
                    <input
                      {...register("link", { required: true })}
                      className="h-[45px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-4 block w-full outline-0 transition-all"
                    />
                    {errors.link && <p className="text-red-500 mt-1">مطلوب</p>}
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      مكان الإعلان
                    </label>
                    <select
                      {...register("location", { required: true })}
                      className="h-[45px] rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-4 block w-full outline-0 cursor-pointer transition-all"
                    >
                      <option value="">اختر مكان الإعلان</option>
                      <option value="home">الرئيسية</option>
                      <option value="other">أخرى</option>
                    </select>
                    {errors.location && (
                      <p className="text-red-500 mt-1">مطلوب</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block font-medium text-black dark:text-white">
                      الصورة
                    </label>
                    <div className="relative flex items-center justify-center overflow-hidden rounded-md py-8 px-4 border border-gray-200 dark:border-[#172036]">
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border border-gray-100 dark:border-[#15203c] flex items-center justify-center rounded-md text-primary-500 text-lg ltr:mr-3 rtl:ml-3">
                          <i className="ri-upload-2-line"></i>
                        </div>
                        <p className="text-black dark:text-white">
                          <strong>Click to upload</strong>
                          <br /> your file here
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                      />
                    </div>

                    {previewImage && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <div className="relative w-[50px] h-[50px]">
                          <Image
                            src={previewImage}
                            alt="preview"
                            width={50}
                            height={50}
                            className="rounded-md"
                          />
                          <button
                            type="button"
                            className="absolute top-[-5px] right-[-5px] bg-orange-500 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs"
                            onClick={() => {
                              setSelectedImage(null);
                              setPreviewImage(null);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      reset();
                      setSelectedImage(null);
                      setPreviewImage(null);
                      setSelectedAd(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50"
                  >
                    {loading ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-md mx-1 text-sm ${
                  currentPage === i + 1
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdsList;
