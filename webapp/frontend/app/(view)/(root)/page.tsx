"use client";

import React from "react";

import { Card } from "./_components";
import { cards } from "./_constants";

import { InputChat } from "@/components/chatbot/components/input-chat";

const HomePage = () => {
  return (
    <>
      <div className="w-full bg-white h-[calc(100vh-50px)] flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-800 p-6 space-y-8 transition-all">
        <div className="flex justify-center mb-4">
          <span className="self-center font-semibold whitespace-nowrap text-gray-300 text-3xl">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <Card
              key={index}
              description={card.description}
              title={card.title}
            />
          ))}
        </div>
      </div>

      <div className="w-full bottom-0 flex items-center h-[40px]">
        <InputChat />
      </div>
    </>
  );
};

export default HomePage;
