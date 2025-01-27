"use client";

import {
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { useState, useEffect } from "react";

export const ModalAction = ({
  title,
  customBody,
  styleButtonShowModal,
  customButtonShowModal,
  labelAction,
  disabled,
  onAction,
}: {
  title: string;
  customBody?: React.ReactNode;
  styleButtonShowModal?: string;
  customButtonShowModal?: React.ReactNode;
  labelAction: string;
  disabled?: boolean;
  onAction: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <>
      <button
        className={styleButtonShowModal}
        disabled={disabled}
        onClick={(event: React.MouseEvent) => {
          event.stopPropagation();
          onOpen();
        }}
      >
        {customButtonShowModal || labelAction}
      </button>
      <Modal
        isOpen={isOpen}
        placement="top-center"
        onOpenChange={(open) => setIsOpen(open)}
      >
        <ModalContent>
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <Divider />
            <ModalBody className="mt-4 mb-4">{customBody}</ModalBody>
            <ModalFooter>
              <Button
                className="bg-white text-black border-[#ccc] border hover:bg-[#f5f5f5]"
                color="danger"
                variant="flat"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                Cancel
              </Button>

              <Button
                className="bg-red-500 text-white"
                onClick={() => {
                  onAction();
                  onClose();
                }}
              >
                {labelAction}
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
};
