import React from "react";
import { useHiddenPages } from "@/providers/HiddenPagesContext";

export default function PageInformation() {
  const { hiddenPages, setHiddenPages } = useHiddenPages();

  const handleCheckboxChange = (
    page: "news" | "ads" | "ecomerce" | "realestate"
  ) => {
    setHiddenPages((prev) => ({
      ...prev,
      [page]: !prev[page],
    }));
  };

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
        <div className="trezo-card-title">
          <h5 className="!mb-0">معلومات الصفحة</h5>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hiddenPages.news}
            onChange={() => handleCheckboxChange("news")}
          />
          <span>إخفاء صفحة الأخبار</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hiddenPages.ads}
            onChange={() => handleCheckboxChange("ads")}
          />
          <span>إخفاء صفحة الإعلانات</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hiddenPages.ecomerce}
            onChange={() => handleCheckboxChange("ecomerce")}
          />
          <span>إخفاء صفحه المنتجات</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hiddenPages.realestate}
            onChange={() => handleCheckboxChange("realestate")}
          />
          <span>إخفاء صفحة العقارات</span>
        </label>
      </div>
    </div>
  );
}
