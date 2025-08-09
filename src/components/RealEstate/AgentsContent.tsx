"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useRealtors,
  useDeleteRealtor,
  useUpdateRealtor,
  useUploadRealtorImage,
} from "./hooks/useRealtor";
import { toast } from "react-hot-toast";

interface Agent {
  id: string;
  name: string;
  email: string;
  number: string;
  image: string;
  created_at: string;
}

const AgentsContent: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    number: "",
    image: "",
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const agentsPerPage = 9;

  // React Query hooks
  const { data: realtors, isLoading } = useRealtors();
  const deleteRealtorMutation = useDeleteRealtor();
  const updateRealtorMutation = useUpdateRealtor();
  const uploadImageMutation = useUploadRealtorImage();

  // Transform realtors data to match Agent interface
  const agents: Agent[] =
    realtors?.map((realtor) => ({
      id: realtor.id || "",
      name: realtor.name,
      email: realtor.email,
      number: realtor.number,
      image: realtor.image,
      created_at: realtor.created_at || "",
    })) || [];

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1); // Reset to the first page after search
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAgents.length / agentsPerPage);
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * agentsPerPage,
    currentPage * agentsPerPage
  );

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleDeleteAgent = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الوكيل ${name}؟`)) {
      try {
        await deleteRealtorMutation.mutateAsync(id);
        toast.success("تم حذف الوكيل بنجاح");
      } catch {
        toast.error("حدث خطأ أثناء حذف الوكيل");
      }
    }
  };

  // Open edit modal and fill form
  const openEditModal = (agent: Agent) => {
    setEditAgent(agent);
    setEditForm({
      name: agent.name,
      email: agent.email,
      number: agent.number,
      image: agent.image,
    });
    setEditImageFile(null);
    setShowModal(true);
  };

  // Handle edit form changes
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image file change in edit modal
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setEditImageFile(files[0]);
      setEditForm((prev) => ({
        ...prev,
        image: URL.createObjectURL(files[0]),
      }));
    }
  };

  // Save edit
  const handleEditSave = async () => {
    if (!editAgent) return;
    let imageUrl = editAgent.image;
    try {
      toast.loading("جاري تحديث بيانات الوكيل...", { id: "edit-toast" });
      if (editImageFile) {
        imageUrl = await uploadImageMutation.mutateAsync(editImageFile);
      }
      await updateRealtorMutation.mutateAsync({
        id: editAgent.id,
        updates: {
          name: editForm.name,
          email: editForm.email,
          number: editForm.number,
          image: imageUrl,
        },
      });
      toast.success("تم تحديث بيانات الوكيل بنجاح", { id: "edit-toast" });
      setShowModal(false);
      setEditAgent(null);
    } catch {
      toast.error("حدث خطأ أثناء تحديث بيانات الوكيل", { id: "edit-toast" });
    }
  };

  if (isLoading) {
    return (
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <div className="trezo-card-content text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            جاري تحميل الوكلاء...
          </p>
        </div>
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
                placeholder="البحث عن وكيل..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-gray-50 border border-gray-50 h-[36px] text-xs rounded-md w-full block text-black pt-[11px] pb-[12px] ltr:pl-[38px] rtl:pr-[38px] ltr:pr-[13px] ltr:md:pr-[16px] rtl:pl-[13px] rtl:md:pl-[16px] placeholder:text-gray-500 outline-0 dark:bg-[#15203c] dark:text-white dark:border-[#15203c] dark:placeholder:text-gray-400"
              />
            </form>
          </div>

          <div className="trezo-card-subtitle mt-[15px] sm:mt-0">
            <Link
              href="/dashboard/real-estate/add-agent/"
              className="inline-block transition-all rounded-md font-medium px-[13px] py-[6px] text-primary-500 border border-primary-500 hover:bg-primary-500 hover:text-white"
            >
              <span className="inline-block relative ltr:pl-[22px] rtl:pr-[22px]">
                <i className="material-symbols-outlined !text-[22px] absolute ltr:-left-[4px] rtl:-right-[4px] top-1/2 -translate-y-1/2">
                  add
                </i>
                إضافة وكيل
              </span>
            </Link>
          </div>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
          <div className="trezo-card-content text-center">
            <p className="text-gray-600 dark:text-gray-400">
              لا توجد وكلاء مسجلين حالياً
            </p>
            <Link
              href="/dashboard/real-estate/add-agent/"
              className="inline-block mt-4 transition-all rounded-md font-medium px-[13px] py-[6px] text-primary-500 border border-primary-500 hover:bg-primary-500 hover:text-white"
            >
              إضافة أول وكيل
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[25px] mb-[25px]">
            {paginatedAgents.map((agent) => (
              <div
                key={agent.id}
                className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md"
              >
                <div className="trezo-card-content relative -mt-[7px]">
                  <div className="absolute -top-[18px] ltr:-left-[20px] rtl:-right-[20px] ltr:md:-left-[25px] rtl:md:-right-[25px] w-[90px] bg-gray-50 dark:bg-[#0a0e19] border-b-[10px] ltr:border-r-[10px] rtl:border-l-[10px] border-gray-50 dark:border-[#0a0e19] ltr:rounded-br-md rtl:rounded-bl-md">
                    <Image
                      src={agent.image}
                      alt={agent.name}
                      className="rounded-md"
                      width={80}
                      height={80}
                    />
                  </div>

                  <div className="mb-[40px] ltr:pl-[88px] rtl:pr-[88px]">
                    <span className="font-medium text-black dark:text-white block text-md mb-[2px]">
                      {agent.name}
                    </span>
                    <span className="block">{agent.email}</span>
                  </div>

                  <ul>
                    <li className="text-black dark:text-white font-medium mb-[5px] last:mb-0">
                      <span className="ltr:mr-[7px] rtl:ml-[7px] text-gray-500 dark:text-gray-400 font-normal">
                        الهاتف:
                      </span>
                      {agent.number}
                    </li>

                    <li className="text-black dark:text-white font-medium mb-[5px] last:mb-0">
                      <span className="ltr:mr-[7px] rtl:ml-[7px] text-gray-500 dark:text-gray-400 font-normal">
                        تاريخ الإضافة:
                      </span>
                      {new Date(agent.created_at).toLocaleDateString("en-US")}
                    </li>
                  </ul>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openEditModal(agent)}
                      className="inline-block rounded-md font-medium border border-primary-500 text-primary-500 py-[4.5px] px-[15.5px] transition-all hover:bg-primary-500 hover:text-white"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.id, agent.name)}
                      disabled={deleteRealtorMutation.isPending}
                      className="inline-block rounded-md font-medium border border-danger-500 text-danger-500 py-[4.5px] px-[15.5px] transition-all hover:bg-danger-500 hover:text-white disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
              <div className="trezo-card-content">
                <div className="sm:flex sm:items-center justify-between">
                  <p className="!mb-0">
                    {" "}
                    عرض{" "}
                    {Math.min(
                      currentPage * agentsPerPage,
                      filteredAgents.length
                    )}{" "}
                    من {filteredAgents.length} نتيجة
                  </p>

                  <ol className="mt-[10px] sm:mt-0">
                    <li className="inline-block mx-[2px] ltr:first:ml-0 ltr:last:mr-0 rtl:first:mr-0 rtl:last:ml-0">
                      <button
                        disabled={currentPage === 1}
                        onClick={handlePreviousPage}
                        className="w-[31px] h-[31px] block leading-[29px] relative text-center rounded-md border border-gray-100 dark:border-[#172036] transition-all hover:bg-primary-500 hover:text-white hover:border-primary-500"
                      >
                        <span className="opacity-0">0</span>
                        <i className="material-symbols-outlined left-0 right-0 absolute top-1/2 -translate-y-1/2">
                          chevron_left
                        </i>
                      </button>
                    </li>

                    {Array.from({ length: totalPages }, (_, index) => (
                      <li
                        key={index}
                        className="inline-block mx-[2px] ltr:first:ml-0 ltr:last:mr-0 rtl:first:mr-0 rtl:last:ml-0"
                      >
                        <button
                          onClick={() => setCurrentPage(index + 1)}
                          className={`w-[31px] h-[31px] block leading-[29px] text-center rounded-md border ${
                            currentPage === index + 1
                              ? "bg-primary-500 text-white border-primary-500"
                              : "border-gray-100 dark:border-[#172036] hover:bg-primary-500 hover:text-white hover:border-primary-500"
                          }`}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}

                    <li className="inline-block mx-[2px] ltr:first:ml-0 ltr:last:mr-0 rtl:first:mr-0 rtl:last:ml-0">
                      <button
                        disabled={currentPage === totalPages}
                        onClick={handleNextPage}
                        className="w-[31px] h-[31px] block leading-[29px] relative text-center rounded-md border border-gray-100 dark:border-[#172036] transition-all hover:bg-primary-500 hover:text-white hover:border-primary-500"
                      >
                        <span className="opacity-0">0</span>
                        <i className="material-symbols-outlined left-0 right-0 absolute top-1/2 -translate-y-1/2">
                          chevron_right
                        </i>
                      </button>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-[#0c1427] rounded-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 left-2 text-gray-500 hover:text-danger-500"
              onClick={() => setShowModal(false)}
            >
              <i className="material-symbols-outlined">close</i>
            </button>
            <h2 className="text-lg font-bold mb-4 text-center text-black dark:text-white">
              تعديل بيانات الوكيل
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSave();
              }}
            >
              <div className="mb-4">
                <label className="block mb-1 text-black dark:text-white">
                  الاسم
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  className="w-full rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-3 py-2 text-black dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-black dark:text-white">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditFormChange}
                  className="w-full rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-3 py-2 text-black dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-black dark:text-white">
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  name="number"
                  value={editForm.number}
                  onChange={handleEditFormChange}
                  className="w-full rounded-md border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-3 py-2 text-black dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-black dark:text-white">
                  الصورة
                </label>
                <div className="relative flex items-center justify-center overflow-hidden rounded-md py-8 px-4 border border-gray-200 dark:border-[#172036] bg-gray-50 dark:bg-[#15203c]">
                  <div className="flex flex-col items-center justify-center w-full">
                    <label
                      htmlFor="editImageInput"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <div className="w-[35px] h-[35px] border border-gray-100 dark:border-[#15203c] flex items-center justify-center rounded-md text-primary-500 text-lg mb-2">
                        <i className="ri-upload-2-line"></i>
                      </div>
                      <span className="text-black dark:text-white font-medium text-sm">
                        اضغط لرفع صورة جديدة
                      </span>
                      <input
                        id="editImageInput"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleEditImageChange}
                      />
                    </label>
                    {(editForm.image || editImageFile) && (
                      <div className="mt-4 relative w-[60px] h-[60px]">
                        <Image
                          src={editForm.image}
                          alt="preview"
                          width={60}
                          height={60}
                          className="rounded-md"
                        />
                        <button
                          type="button"
                          className="absolute top-[-8px] right-[-8px] bg-danger-500 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs"
                          onClick={() => {
                            setEditImageFile(null);
                            setEditForm((prev) => ({
                              ...prev,
                              image: editAgent?.image || "",
                            }));
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md bg-gray-200 dark:bg-[#172036] text-black dark:text-white"
                  onClick={() => setShowModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-primary-500 text-white hover:bg-primary-400"
                  disabled={
                    updateRealtorMutation.isPending ||
                    uploadImageMutation.isPending
                  }
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AgentsContent;
