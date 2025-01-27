"use client";

import {
  ModalContainer,
  ModalContent,
  ModalHeader,
  ModalSidebar,
} from "./components";

import { useAppDispatch, useAppSelector } from "@/hooks";
import { turnOff } from "@/lib/features/modalControl/viewModalSlice";

export const ModalControl = () => {
  const dispatch = useAppDispatch();
  const isActiveViewModal = useAppSelector(
    (state) => state.viewModal.isActiveViewModal,
  );

  const handleModalClose = () =>
    dispatch(turnOff({ isActiveViewModal: false }));

  return (
    <ModalContainer isActive={isActiveViewModal}>
      <ModalHeader onClose={handleModalClose} />
      <div className="flex">
        <ModalSidebar />
        <ModalContent />
      </div>
    </ModalContainer>
  );
};
