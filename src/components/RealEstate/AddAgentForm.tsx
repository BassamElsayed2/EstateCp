"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCreateRealtor, useUploadRealtorImage } from "./hooks/useRealtor";
import { toast } from "react-hot-toast";

const AddAgentForm: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    email: "",
  });

  // Upload Image
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // React Query hooks
  const createRealtorMutation = useCreateRealtor();
  const uploadImageMutation = useUploadRealtorImage();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setSelectedImages((prevImages) => [...prevImages, ...filesArray]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.number || !formData.email) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (selectedImages.length === 0) {
      toast.error("يرجى اختيار صورة للوكيل");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("جاري إنشاء الوكيل...");

    try {
      // Upload the first image
      const imageUrl = await uploadImageMutation.mutateAsync(selectedImages[0]);

      // Create realtor record
      await createRealtorMutation.mutateAsync({
        name: formData.name,
        number: formData.number,
        email: formData.email,
        image: imageUrl,
      });

      // Reset form on success
      setFormData({ name: "", number: "", email: "" });
      setSelectedImages([]);

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("تم إنشاء الوكيل بنجاح!");
    } catch (error) {
      console.error("Error in form submission:", error);

      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error("حدث خطأ أثناء إنشاء الوكيل");
    }
  };

  const isSubmitting =
    createRealtorMutation.isPending || uploadImageMutation.isPending;

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
          <div className="trezo-card-content">
            <div className="sm:grid sm:grid-cols-2 sm:gap-[25px]">
              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  الاسم
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  placeholder="Enter agent name"
                />
              </div>

              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  الرقم
                </label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                  placeholder="Enter email address"
                />
              </div>

              <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                <label className="mb-[10px] text-black dark:text-white font-medium block">
                  صورة الوكيل
                </label>
                <div id="fileUploader">
                  <div className="relative flex items-center justify-center overflow-hidden rounded-md py-[88px] px-[20px] border border-gray-200 dark:border-[#172036]">
                    <div className="flex items-center justify-center">
                      <div className="w-[35px] h-[35px] border border-gray-100 dark:border-[#15203c] flex items-center justify-center rounded-md text-primary-500 text-lg ltr:mr-[12px] rtl:ml-[12px]">
                        <i className="ri-upload-2-line"></i>
                      </div>
                      <p className="leading-[1.5]">
                        <strong className="text-black dark:text-white">
                          اضافة صورة
                        </strong>
                        <br /> هنا
                      </p>
                    </div>
                    <input
                      type="file"
                      id="fileInput"
                      accept="image/*"
                      className="absolute top-0 left-0 right-0 bottom-0 rounded-md z-[1] opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                  </div>
                  {/* Image Previews */}
                  <div className="mt-[10px] flex flex-wrap gap-2">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative w-[50px] h-[50px]">
                        <Image
                          src={URL.createObjectURL(image)}
                          alt="product-preview"
                          width={50}
                          height={50}
                          className="rounded-md"
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
                onClick={() => {
                  setFormData({ name: "", number: "", email: "" });
                  setSelectedImages([]);
                  toast.success("تم إلغاء العملية");
                }}
                className="font-medium inline-block transition-all rounded-md md:text-md ltr:mr-[15px] rtl:ml-[15px] py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-danger-500 text-white hover:bg-danger-400"
              >
                الغاء
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="font-medium inline-block transition-all rounded-md md:text-md py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-primary-500 text-white hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="inline-block relative ltr:pl-[29px] rtl:pr-[29px]">
                  <i className="material-symbols-outlined ltr:left-0 rtl:right-0 absolute top-1/2 -translate-y-1/2">
                    {isSubmitting ? "hourglass_empty" : "add"}
                  </i>
                  {isSubmitting ? "جاري الإنشاء..." : "إنشاء وكيل"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default AddAgentForm;
