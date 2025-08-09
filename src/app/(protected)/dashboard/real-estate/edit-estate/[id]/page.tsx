"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Editor,
  EditorProvider,
  BtnBold,
  BtnBulletList,
  BtnClearFormatting,
  BtnItalic,
  BtnLink,
  BtnNumberedList,
  BtnRedo,
  BtnStrikeThrough,
  BtnStyles,
  BtnUnderline,
  BtnUndo,
  HtmlButton,
  Separator,
  Toolbar,
} from "react-simple-wysiwyg";
import {
  getPropertyById,
  updateProperty,
  uploadPropertyImages,
  checkSpecialPropertyExists,
} from "../../../../../../../services/apiProperty";
import { useRealtors } from "@/components/RealEstate/hooks/useRealtor";
import { Realtor } from "../../../../../../../services/apiRealtor";

interface PropertyFormData {
  nameAr: string;
  nameEn: string;
  operation: string;
  type: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  price: string;
  addressAr: string;
  addressEn: string;
  detailsAr: string;
  detailsEn: string;
  mapUrl: string;
  isSpecial: boolean;
  realtor_id?: string;
}

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
  map_url: string;
  images: string[];
  isSpecial: boolean;
  realtor_id?: string;
  created_at: string;
}

const EditPropertyForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [detailsAr, setDetailsAr] = useState<string>("");
  const [detailsEn, setDetailsEn] = useState<string>("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const { data: realtors, isLoading: isRealtorsLoading } = useRealtors();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PropertyFormData>({
    defaultValues: {
      operation: "للايجار",
      type: "apartment",
      isSpecial: false,
      realtor_id: "",
    },
  });

  // Fetch property data on component mount
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const propertyData = await getPropertyById(propertyId);
        setProperty(propertyData);

        // Set form values
        setValue("nameAr", propertyData.name_ar);
        setValue("nameEn", propertyData.name_en);
        setValue("operation", propertyData.operation);
        setValue("type", propertyData.type);
        setValue("bedrooms", propertyData.bedrooms.toString());
        setValue("bathrooms", propertyData.bathrooms.toString());
        setValue("area", propertyData.area.toString());
        setValue("price", propertyData.price?.toString() || "");
        setValue("addressAr", propertyData.address_ar);
        setValue("addressEn", propertyData.address_en);
        setValue("mapUrl", propertyData.map_url || "");
        setValue("isSpecial", propertyData.isSpecial);
        setValue("realtor_id", propertyData.realtor_id || "");

        // Set editor values
        setDetailsAr(propertyData.details_ar || "");
        setDetailsEn(propertyData.details_en || "");

        // Set existing images
        setExistingImages(propertyData.images || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء تحميل بيانات العقار";
        setError(errorMessage);
        toast.error(errorMessage, {
          duration: 4000,
          position: "top-center",
          style: {
            background: "#EF4444",
            color: "#fff",
            padding: "16px",
            borderRadius: "8px",
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId, setValue]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setSelectedImages((prevImages) => [...prevImages, ...filesArray]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Check if trying to make this property special and another one already exists
      if (data.isSpecial && !property?.isSpecial) {
        const specialExists = await checkSpecialPropertyExists();
        if (specialExists) {
          throw new Error(
            "يوجد عقار خاص واحد فقط مسموح به. يرجى إلغاء تحديد العقار الحالي كـ 'خاص' أولاً."
          );
        }
      }

      let allImageUrls = [...existingImages];

      // Upload new images if any
      if (selectedImages.length > 0) {
        const dataTransfer = new DataTransfer();
        selectedImages.forEach((image) => {
          dataTransfer.items.add(image);
        });

        const newImageUrls = await uploadPropertyImages(dataTransfer.files);
        allImageUrls = [...existingImages, ...newImageUrls];
      }

      // Update property with form data and all image URLs
      await updateProperty(propertyId, {
        ...data,
        detailsAr,
        detailsEn,
        mapUrl: data.mapUrl,
        images: allImageUrls,
      });

      // Show success toast
      toast.success("تم تحديث العقار بنجاح", {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#10B981",
          color: "#fff",
          padding: "16px",
          borderRadius: "8px",
        },
      });

      // Redirect to properties list on success
      router.push("/dashboard/real-estate");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "حدث خطأ أثناء تحديث العقار";
      setError(errorMessage);

      // Show error toast
      toast.error(errorMessage, {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#EF4444",
          color: "#fff",
          padding: "16px",
          borderRadius: "8px",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-2 text-black dark:text-white">
            جاري التحميل...
          </span>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <div className="text-center py-8">
          <p className="text-red-500">العقار غير موجود</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
          <div className="trezo-card-content">
            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            <div className="sm:grid sm:grid-cols-2 sm:gap-[25px]">
              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  اسم العقار بالعربية
                </label>
                <input
                  type="text"
                  {...register("nameAr", { required: "هذا الحقل مطلوب" })}
                  className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  placeholder="اسم العقار بالعربية"
                />
                {errors.nameAr && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.nameAr.message}
                  </span>
                )}
              </div>
              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  اسم العقار بالانجليزية
                </label>
                <input
                  type="text"
                  {...register("nameEn", { required: "هذا الحقل مطلوب" })}
                  className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  placeholder="اسم العقار بالانجليزية"
                />
                {errors.nameEn && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.nameEn.message}
                  </span>
                )}
              </div>

              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  نوع العملية
                </label>
                <select
                  {...register("operation", { required: "هذا الحقل مطلوب" })}
                  className="h-[55px] rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[13px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-500"
                >
                  <option value="للايجار">للإيجار</option>
                  <option value="للبيع">للبيع</option>
                </select>
                {errors.operation && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.operation.message}
                  </span>
                )}
              </div>

              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  السعر
                </label>
                <input
                  type="number"
                  {...register("price", { required: "هذا الحقل مطلوب" })}
                  className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  placeholder="السعر"
                />
                {errors.price && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.price.message}
                  </span>
                )}
              </div>

              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  نوع العقار
                </label>
                <select
                  {...register("type", { required: "هذا الحقل مطلوب" })}
                  className="h-[55px] rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[13px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-500"
                >
                  <option value="apartment">شقة</option>
                  <option value="villa">فيلا</option>
                  <option value="house">منزل</option>
                  <option value="commercial">تجاري</option>
                  <option value="land">أرض</option>
                  <option value="other">أخرى</option>
                </select>
                {errors.type && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.type.message}
                  </span>
                )}
              </div>

              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  عدد الغرف
                </label>
                <input
                  type="number"
                  {...register("bedrooms", { required: "هذا الحقل مطلوب" })}
                  className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  placeholder="عدد الغرف"
                />
                {errors.bedrooms && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.bedrooms.message}
                  </span>
                )}
              </div>

              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  عدد الحمامات
                </label>
                <input
                  type="number"
                  {...register("bathrooms", { required: "هذا الحقل مطلوب" })}
                  className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  placeholder="عدد الحمامات"
                />
                {errors.bathrooms && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.bathrooms.message}
                  </span>
                )}
              </div>

              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  المساحة
                </label>
                <input
                  type="text"
                  {...register("area", { required: "هذا الحقل مطلوب" })}
                  className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  placeholder="المساحة"
                />
                {errors.area && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.area.message}
                  </span>
                )}
              </div>

              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  العنوان بالعربية
                </label>
                <input
                  type="text"
                  {...register("addressAr", { required: "هذا الحقل مطلوب" })}
                  className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  placeholder="العنوان بالعربية"
                />
                {errors.addressAr && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.addressAr.message}
                  </span>
                )}
              </div>

              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  العنوان بالانجليزية
                </label>
                <input
                  type="text"
                  {...register("addressEn", { required: "هذا الحقل مطلوب" })}
                  className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  placeholder="العنوان بالانجليزية"
                />
                {errors.addressEn && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.addressEn.message}
                  </span>
                )}
              </div>

              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  اختر الوكيل العقاري
                </label>
                <select
                  {...register("realtor_id", { required: "هذا الحقل مطلوب" })}
                  className="h-[55px] rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[13px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-500"
                  disabled={isRealtorsLoading}
                >
                  <option value="">اختر وكيل</option>
                  {realtors?.map((realtor: Realtor) => (
                    <option key={realtor.id} value={realtor.id}>
                      {realtor.name}
                    </option>
                  ))}
                </select>
                {errors.realtor_id && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.realtor_id.message}
                  </span>
                )}
              </div>

              <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  التفاصيل بالعربية
                </label>
                <EditorProvider>
                  <Editor
                    value={detailsAr}
                    onChange={(e) => setDetailsAr(e.target.value)}
                    style={{ minHeight: "200px" }}
                    className="rsw-editor"
                  >
                    <Toolbar>
                      <BtnUndo />
                      <BtnRedo />
                      <Separator />
                      <BtnBold />
                      <BtnItalic />
                      <BtnUnderline />
                      <BtnStrikeThrough />
                      <Separator />
                      <BtnNumberedList />
                      <BtnBulletList />
                      <Separator />
                      <BtnLink />
                      <BtnClearFormatting />
                      <HtmlButton />
                      <Separator />
                      <BtnStyles />
                    </Toolbar>
                  </Editor>
                </EditorProvider>
              </div>

              <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  التفاصيل بالانجليزية
                </label>
                <EditorProvider>
                  <Editor
                    value={detailsEn}
                    onChange={(e) => setDetailsEn(e.target.value)}
                    style={{ minHeight: "200px" }}
                    className="rsw-editor"
                  >
                    <Toolbar>
                      <BtnUndo />
                      <BtnRedo />
                      <Separator />
                      <BtnBold />
                      <BtnItalic />
                      <BtnUnderline />
                      <BtnStrikeThrough />
                      <Separator />
                      <BtnNumberedList />
                      <BtnBulletList />
                      <Separator />
                      <BtnLink />
                      <BtnClearFormatting />
                      <HtmlButton />
                      <Separator />
                      <BtnStyles />
                    </Toolbar>
                  </Editor>
                </EditorProvider>
              </div>

              <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  رابط الخريطة من Google Maps
                </label>
                <input
                  type="text"
                  {...register("mapUrl", {
                    required: "هذا الحقل مطلوب",
                  })}
                  className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  placeholder="30.789......, 30.990......"
                />
                {errors.mapUrl && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.mapUrl.message}
                  </span>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  انسخ الاحداثيات الموقع من Google Maps والصقه هنا. يمكنك
                  استخدام الاحداثيات مشاركة من التطبيق أو المتصفح
                </p>
              </div>

              <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isSpecial"
                    {...register("isSpecial")}
                    className="w-4 h-4 text-primary-500 bg-white dark:bg-[#0c1427] border border-gray-200 dark:border-[#172036] rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <label
                    htmlFor="isSpecial"
                    className="mr-2 text-black dark:text-white font-medium cursor-pointer"
                  >
                    عقار خاص (يمكن أن يكون هناك عقار خاص واحد فقط)
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  العقار الخاص سيظهر في مكان مميز في الموقع. يمكن أن يكون هناك
                  عقار خاص واحد فقط في نفس الوقت.
                </p>
              </div>

              <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  صور العقار
                </label>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      الصور الحالية:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((imageUrl, index) => (
                        <div
                          key={`existing-${index}`}
                          className="relative w-[100px] h-[100px]"
                        >
                          <Image
                            src={imageUrl}
                            alt={`property-${index}`}
                            width={100}
                            height={100}
                            className="rounded-md object-cover"
                          />
                          <button
                            type="button"
                            className="absolute top-[-5px] right-[-5px] bg-red-500 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs rtl:right-auto rtl:left-[-5px]"
                            onClick={() => handleRemoveExistingImage(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Images */}
                <div id="fileUploader">
                  <div className="relative flex items-center justify-center overflow-hidden rounded-md py-[88px] px-[20px] border border-gray-200 dark:border-[#172036]">
                    <div className="flex items-center justify-center">
                      <div className="w-[35px] h-[35px] border border-gray-100 dark:border-[#15203c] flex items-center justify-center rounded-md text-primary-500 text-lg ltr:mr-[12px] rtl:ml-[12px]">
                        <i className="ri-upload-2-line"></i>
                      </div>
                      <p className="leading-[1.5]">
                        <strong className="text-black dark:text-white">
                          انقر لإضافة صور جديدة
                        </strong>
                        <br /> هنا
                      </p>
                    </div>
                    <input
                      type="file"
                      id="fileInput"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute top-0 left-0 right-0 bottom-0 rounded-md z-[1] opacity-0 cursor-pointer"
                      multiple
                    />
                  </div>

                  {/* New Image Previews */}
                  <div className="mt-[10px] flex flex-wrap gap-2">
                    {selectedImages.map((image, index) => (
                      <div
                        key={`new-${index}`}
                        className="relative w-[50px] h-[50px]"
                      >
                        <Image
                          src={URL.createObjectURL(image)}
                          alt="property-preview"
                          width={50}
                          height={50}
                          className="rounded-md object-cover"
                        />
                        <button
                          type="button"
                          className="absolute top-[-5px] right-[-5px] bg-orange-500 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs rtl:right-auto rtl:left-[-5px]"
                          onClick={() => handleRemoveImage(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-[20px] md:mt-[25px]">
              <button
                type="button"
                onClick={() => router.back()}
                className="font-medium inline-block transition-all rounded-md md:text-md ltr:mr-[15px] rtl:ml-[15px] py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-danger-500 text-white hover:bg-danger-400"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="font-medium inline-block transition-all rounded-md md:text-md py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-primary-500 text-white hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="inline-block relative ltr:pl-[29px] rtl:pr-[29px]">
                  <i className="material-symbols-outlined ltr:left-0 rtl:right-0 absolute top-1/2 -translate-y-1/2">
                    edit
                  </i>
                  {isSubmitting ? "جاري التحديث..." : "تحديث العقار"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default EditPropertyForm;
