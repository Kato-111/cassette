import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const Icon = () =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="2"
            y="6"
            width="20"
            height="12"
            rx="2"
            stroke="#F5F5F5"
            strokeWidth="1.5"
          />
          <circle cx="8" cy="12" r="2.5" stroke="#F5F5F5" strokeWidth="1.5" />
          <circle cx="16" cy="12" r="2.5" stroke="#F5F5F5" strokeWidth="1.5" />
          <rect x="10.5" y="11" width="3" height="2" fill="#F5F5F5" />
        </svg>
      </div>
    ),
    { ...size },
  );

export default Icon;
