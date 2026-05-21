import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { uploadTrackActionMock, capturedDropOptions } = vi.hoisted(() => ({
  uploadTrackActionMock: vi.fn(),
  capturedDropOptions: { current: null as null | { onDrop: (...args: unknown[]) => void } },
}));

vi.mock("@/app/_actions/uploads", () => ({
  uploadTrackAction: uploadTrackActionMock,
}));

vi.mock("react-dropzone", () => ({
  useDropzone: (opts: { onDrop: (...args: unknown[]) => void }) => {
    capturedDropOptions.current = opts;
    return {
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false,
      open: vi.fn(),
    };
  },
}));

import { useTrackUpload } from "@/hooks/use-track-upload";

const makeFile = (name: string) => {
  const file = new File(["x"], name, { type: "audio/mpeg" });
  (file as File & { errors: [] }).errors = [];
  return file;
};

describe("useTrackUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedDropOptions.current = null;
    uploadTrackActionMock.mockImplementation(async (_prev, fd: FormData) => {
      const file = fd.get("file") as File;
      if (file.name === "bad.mp3") {
        return { ok: false, error: "upload failed" };
      }
      return { ok: true, trackId: "new", title: file.name };
    });
  });

  it("deduplicates files by name on drop", () => {
    const { result } = renderHook(() => useTrackUpload());
    const onDrop = capturedDropOptions.current!.onDrop;

    act(() => {
      onDrop([makeFile("a.mp3")], []);
    });
    expect(result.current.files).toHaveLength(1);

    act(() => {
      onDrop([makeFile("a.mp3"), makeFile("b.mp3")], []);
    });
    expect(result.current.files.map((f) => f.name)).toEqual(["a.mp3", "b.mp3"]);
  });

  it("isSuccess is true only when all files uploaded", async () => {
    const { result } = renderHook(() => useTrackUpload());
    const onDrop = capturedDropOptions.current!.onDrop;

    act(() => {
      onDrop([makeFile("good.mp3")], []);
    });

    await act(async () => {
      await result.current.onUpload();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.successes).toContain("good.mp3");
  });

  it("retries failed files on second upload", async () => {
    const { result } = renderHook(() => useTrackUpload());
    const onDrop = capturedDropOptions.current!.onDrop;

    act(() => {
      onDrop([makeFile("bad.mp3"), makeFile("good.mp3")], []);
    });

    await act(async () => {
      await result.current.onUpload();
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.isSuccess).toBe(false);

    uploadTrackActionMock.mockResolvedValueOnce({
      ok: true,
      trackId: "fixed",
      title: "bad.mp3",
    });

    await act(async () => {
      await result.current.onUpload();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("stores dropzone rejection errors on files", () => {
    const { result } = renderHook(() => useTrackUpload());
    const onDrop = capturedDropOptions.current!.onDrop;
    const rejectedFile = makeFile("huge.mp3");

    act(() => {
      onDrop([], [
        {
          file: rejectedFile,
          errors: [{ code: "file-too-large", message: "Too large" }],
        },
      ]);
    });

    expect(result.current.files[0]?.errors[0]?.code).toBe("file-too-large");
  });
});
