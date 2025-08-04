"use client";

import PageInformation from "@/components/MyProfile/PageInformation";
import Nav from "@/components/Settings/Nav";
import React from "react";

export default function page() {
  return (
    <div>
      <Nav
        UrlOne="/dashboard/site-settings"
        UrlTwo="/dashboard/site-settings/dashboard/"
        titleOne="الصفحه الامامية"
        titleTwo="الصفحه الخلفية"
      />
      <PageInformation />
    </div>
  );
}
