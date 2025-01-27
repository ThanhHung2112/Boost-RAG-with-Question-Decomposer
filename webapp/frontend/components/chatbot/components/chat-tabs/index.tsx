"use client";

import { Tabs, Tab } from "@nextui-org/react";

import { UploadButton } from "../upload-button";
import { InputLink } from "../input-link";

import { TabBodyFiles, TabBodyHyperlinks } from "./components";

export const ChatTabs = () => {
  return (
    <Tabs
      aria-label="tabs colors"
      className="flex flex-col h-full mt-2"
      color="default"
      radius="sm"
    >
      <Tab key="upload-files" title="Upload PDF">
        <div className="flex flex-col space-y-2 h-full">
          <UploadButton />
          <div className="overflow-y-auto">
            <TabBodyFiles />
          </div>
        </div>
      </Tab>
      <Tab key="hyperlinks" title="Hyperlinks">
        <div className="flex flex-col space-y-2 h-full">
          <InputLink />
          <div className="overflow-y-auto">
            <TabBodyHyperlinks />
          </div>
        </div>
      </Tab>
    </Tabs>
  );
};
