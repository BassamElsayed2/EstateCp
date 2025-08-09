import AddAgentForm from "@/components/RealEstate/AddAgentForm";
import React from "react";

function page() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          إضافة وكيل جديد
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          قم بإضافة وكيل جديد إلى النظام
        </p>
      </div>
      <AddAgentForm />
    </div>
  );
}
export default page;
