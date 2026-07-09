export async function uploadAdminImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData
  });
  const body = (await response.json()) as { message?: string; url?: string };

  if (response.status === 401) {
    window.location.href = "/admin/login";
    return undefined;
  }

  if (!response.ok || !body.url) {
    throw new Error(body.message ?? "이미지를 업로드하지 못했습니다.");
  }

  return body.url;
}

export function getImageFileFromDataTransfer(dataTransfer: DataTransfer | null) {
  if (!dataTransfer) {
    return undefined;
  }

  const file = Array.from(dataTransfer.files).find((item) =>
    item.type.startsWith("image/")
  );

  if (file) {
    return file;
  }

  const imageItem = Array.from(dataTransfer.items).find(
    (item) => item.kind === "file" && item.type.startsWith("image/")
  );

  return imageItem?.getAsFile() ?? undefined;
}

export async function readClipboardImageFile() {
  if (!navigator.clipboard?.read) {
    throw new Error(
      "이 브라우저에서는 클립보드 이미지를 바로 읽을 수 없습니다. 이미지 URL 입력칸에 붙여넣기를 사용해 주세요."
    );
  }

  const items = await navigator.clipboard.read();

  for (const item of items) {
    const imageType = item.types.find((type) => type.startsWith("image/"));

    if (!imageType) {
      continue;
    }

    const blob = await item.getType(imageType);
    const extension = imageType.split("/")[1]?.replace("jpeg", "jpg") ?? "png";

    return new File([blob], `clipboard-${Date.now()}.${extension}`, {
      type: imageType
    });
  }

  return undefined;
}
