import { ChangeEvent, useRef } from "react";
import { Box, Label, Input, Button, Flex, Text } from "theme-ui";

import Modal from "../components/Modal";

import { getHMSDuration, getDurationHMS } from "../helpers/timer";

import useSetting from "../hooks/useSetting";

import {
  RequestCloseEventHandler,
  TimerStartEventHandler,
  TimerStopEventHandler,
} from "../types/Events";
import { Timer } from "../types/Timer";

type StartTimerProps = {
  isOpen: boolean;
  onRequestClose: RequestCloseEventHandler;
  onTimerStart: TimerStartEventHandler;
  onTimerStop: TimerStopEventHandler;
  timer?: Timer;
};

function StartTimerModal({
  isOpen,
  onRequestClose,
  onTimerStart,
  onTimerStop,
  timer,
}: StartTimerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  function focusInput() {
    inputRef.current && inputRef.current.focus();
  }

  const [hour, setHour] = useSetting<number>("timer.hour");
  const [minute, setMinute] = useSetting<number>("timer.minute");
  const [second, setSecond] = useSetting<number>("timer.second");

  function handleSubmit(event: ChangeEvent<HTMLInputElement>) {
    event.preventDefault();
    if (timer) {
      onTimerStop();
    } else {
      const duration = getHMSDuration({ hour, minute, second });
      onTimerStart({ current: duration, max: duration });
    }
  }

  const inputStyle = {
    width: "70px",
    border: "none",
    ":focus": {
      outline: "none",
    },
    fontSize: "32px",
    padding: 2,
    paddingLeft: 0,
  };

  function parseValue(value: string, max: number) {
    const num = parseInt(value);
    if (isNaN(num)) {
      return 0;
    }
    return Math.min(num, max);
  }

  const timerHMS = timer && getDurationHMS(timer.current);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      onAfterOpen={focusInput}
    >
      <Flex
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "300px",
          flexGrow: 1,
        }}
        m={2}
      >
        <Box as="form" onSubmit={handleSubmit}>
          <Label py={2}>Start a countdown timer</Label>
          <Flex mb={2} sx={{ flexGrow: 1, alignItems: "baseline" }}>
            <Text as="label" variant="body2" sx={{ fontSize: "16px" }} p={1}>
              H:
            </Text>
            <Input
              sx={inputStyle}
              value={`${timerHMS ? timerHMS.hour : hour}`}
              onChange={(e) => setHour(parseValue(e.target.value, 24))}
              type="number"
              disabled={!!timer}
              min={0}
              max={24}
            />
            <Text as="label" variant="body2" sx={{ fontSize: "16px" }} p={1}>
              M:
            </Text>
            <Input
              sx={inputStyle}
              value={`${timerHMS ? timerHMS.minute : minute}`}
              onChange={(e) => setMinute(parseValue(e.target.value, 59))}
              type="number"
              ref={inputRef}
              disabled={!!timer}
              min={0}
              max={59}
            />
            <Text as="label" variant="body2" sx={{ fontSize: "16px" }} p={1}>
              S:
            </Text>
            <Input
              sx={inputStyle}
              value={`${timerHMS ? timerHMS.second : second}`}
              onChange={(e) => setSecond(parseValue(e.target.value, 59))}
              type="number"
              disabled={!!timer}
              min={0}
              max={59}
            />
          </Flex>
          <Flex>
            <Button
              sx={{ flexGrow: 1 }}
              disabled={hour === 0 && minute === 0 && second === 0}
            >
              {timer ? "Stop Timer" : "Start Timer"}
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Modal>
  );
}

export default StartTimerModal;
