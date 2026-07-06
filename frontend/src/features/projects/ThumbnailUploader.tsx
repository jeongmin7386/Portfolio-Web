import { ChangeEvent, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadThumbnail } from './projectApi';
import { assetUrl } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';

type ThumbnailUploaderProps = {
  projectId: number;
  thumbnailUrl?: string;
};

export function ThumbnailUploader({ projectId, thumbnailUrl }: ThumbnailUploaderProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mutation = useMutation({
    mutationFn: (file: File) => uploadThumbnail(projectId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    }
  });

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      mutation.mutate(file);
    }
  }

  return (
    <div className="thumbnail-uploader">
      <div className="thumbnail-preview">
        {thumbnailUrl ? <img src={assetUrl(thumbnailUrl)} alt="" /> : <span>썸네일</span>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} hidden />
      <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={mutation.isPending}>
        {mutation.isPending ? '업로드 중' : '이미지 업로드'}
      </Button>
    </div>
  );
}
