import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { IconButton } from "theme-ui";

import ChangeNicknameModal from "../../modals/ChangeNicknameModal";
import ChangeNicknameIcon from "../../icons/ChangeNicknameIcon";

type ChangeNicknameButtonProps = {
  nickname: string;
  onChange: (nickname: string) => void;
};

function ChangeNicknameButton({
  nickname,
  onChange,
}: ChangeNicknameButtonProps) {
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  function openModal() {
    setIsChangeModalOpen(true);
  }
  function closeModal() {
    setIsChangeModalOpen(false);
  }

  const [changedNickname, setChangedNickname] = useState("");

  useEffect(() => {
    setChangedNickname(nickname);
  }, [nickname]);

  function handleChangeSubmit(event: FormEvent) {
    event.preventDefault();
    onChange(changedNickname);
    closeModal();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setChangedNickname(event.target?.value);
  }
  return (
    <>
      <IconButton
        m={1}
        aria-label="Change Nickname"
        title="Change Nickname"
        onClick={openModal}
      >
        <ChangeNicknameIcon />
      </IconButton>
      <ChangeNicknameModal
        isOpen={isChangeModalOpen}
        onRequestClose={closeModal}
        onChangeSubmit={handleChangeSubmit}
        onChange={handleChange}
        nickname={changedNickname}
      />
    </>
  );
}

export default ChangeNicknameButton;
