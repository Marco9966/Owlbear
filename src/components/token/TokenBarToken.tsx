import { Box } from "theme-ui";
import { useInView } from "react-intersection-observer";

import TokenImage from "./TokenImage";

import { Token } from "../../types/Token";

type TokenBarTokenProps = {
  token: Token;
};

function TokenBarToken({ token }: TokenBarTokenProps) {
  const [ref, inView] = useInView({ triggerOnce: true });

  return (
    <Box ref={ref} sx={{ width: "48px", height: "48px" }} title={token.name}>
      {inView && (
        <TokenImage
          token={token}
          sx={{
            userSelect: "none",
            touchAction: "none",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
          }}
          alt={token.name}
          title={token.name}
        />
      )}
    </Box>
  );
}

export default TokenBarToken;
