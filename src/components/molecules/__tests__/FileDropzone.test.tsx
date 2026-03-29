import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FileDropzone } from "../FileDropzone";

describe("FileDropzone", () => {
  it("renders the dropzone text", () => {
    render(<FileDropzone onFiles={() => {}} />);
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
  });

  it("calls onFiles when files are selected via input", () => {
    const onFiles = vi.fn();
    render(<FileDropzone onFiles={onFiles} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "hello.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it("rejects files exceeding maxSizeMB", () => {
    const onFiles = vi.fn();
    const onError = vi.fn();
    render(<FileDropzone onFiles={onFiles} onError={onError} maxSizeMB={1} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    // Create a 2MB file
    const bigContent = new Uint8Array(2 * 1024 * 1024);
    const file = new File([bigContent], "big.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFiles).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
    expect(screen.getByText(/exceeds 1MB limit/i)).toBeInTheDocument();
  });

  it("rejects files with wrong type", () => {
    const onFiles = vi.fn();
    const onError = vi.fn();
    render(
      <FileDropzone onFiles={onFiles} onError={onError} accept={["image/png"]} />
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["data"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFiles).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });
});
