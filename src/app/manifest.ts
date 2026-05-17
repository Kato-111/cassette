import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
  name: "Cassette",
  short_name: "Cassette",
  description: "A personal audio library.",
  start_url: "/",
  display: "standalone",
  background_color: "#0A0A0A",
  theme_color: "#0A0A0A",
});

export default manifest;
