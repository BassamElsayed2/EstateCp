"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavProps = {
  UrlOne: string;
  UrlTwo: string;
  titleOne: string;
  titleTwo: string;
};

const Nav: React.FC<NavProps> = ({ UrlOne, UrlTwo, titleOne, titleTwo }) => {
  const pathname = usePathname();

  return (
    <>
      <ul className="mb-[10px]">
        <li className="inline-block mb-[15px] ltr:mr-[11px] rtl:ml-[11px] ltr:last:mr-0 rtl:last:ml-0">
          <Link
            href={UrlOne}
            className={`block rounded-md font-medium py-[8.5px] px-[15px] text-primary-500 border border-primary-500 transition-all  ${
              pathname === UrlOne ? "bg-primary-500 text-white" : ""
            }`}
          >
            {titleOne}
          </Link>
        </li>

        <li className="inline-block mb-[15px] ltr:mr-[11px] rtl:ml-[11px] ltr:last:mr-0 rtl:last:ml-0">
          <Link
            href={UrlTwo}
            className={`block rounded-md font-medium py-[8.5px] px-[15px] text-primary-500 border border-primary-500 transition-all  ${
              pathname === UrlTwo ? "bg-primary-500 text-white" : ""
            }`}
          >
            {titleTwo}
          </Link>
        </li>
      </ul>
    </>
  );
};

export default Nav;
